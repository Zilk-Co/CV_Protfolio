import express, { type Express } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";
import { pool } from "@workspace/db";

const app: Express = express();

// Run migrations on startup
async function runMigrations() {
  try {
    await pool.query("ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'available';");
    await pool.query("ALTER TABLE portfolio ALTER COLUMN admin_password SET DEFAULT '';");
    await pool.query("ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS plain_password TEXT NOT NULL DEFAULT '';");
    await pool.query("ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS cv_export_sections JSONB DEFAULT '{\"experience\":true,\"education\":true,\"skills\":true,\"certifications\":true,\"blogs\":true,\"customSections\":true}';");
    // H5: Add foreign key constraints (skip if already exists)
    const fkChecks = [
      ["education", "fk_education_portfolio", "portfolio_id", "portfolio"],
      ["experience", "fk_experience_portfolio", "portfolio_id", "portfolio"],
      ["skills", "fk_skills_portfolio", "portfolio_id", "portfolio"],
      ["certifications", "fk_certifications_portfolio", "portfolio_id", "portfolio"],
      ["blogs", "fk_blogs_portfolio", "portfolio_id", "portfolio"],
      ["custom_sections", "fk_custom_sections_portfolio", "portfolio_id", "portfolio"],
      ["custom_section_items", "fk_custom_section_items_portfolio", "portfolio_id", "portfolio"],
      ["custom_section_items", "fk_custom_section_items_section", "custom_section_id", "custom_sections"],
    ];
    for (const [table, constraint, col, refTable] of fkChecks) {
      const exists = await pool.query(`SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = $1 AND table_name = $2`, [constraint, table]);
      if (exists.rows.length === 0) {
        await pool.query(`ALTER TABLE ${table} ADD CONSTRAINT ${constraint} FOREIGN KEY (${col}) REFERENCES ${refTable}(id) ON DELETE CASCADE;`);
      }
    }
    // Add portfolio_id to conversations
    const convExists = await pool.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'portfolio_id'`);
    if (convExists.rows.length === 0) {
      await pool.query(`ALTER TABLE conversations ADD COLUMN portfolio_id INTEGER REFERENCES portfolio(id) ON DELETE SET NULL;`);
    }
    // Ensure default portfolio has admin login credentials
    await pool.query(`UPDATE portfolio SET login_username = 'admin' WHERE slug = 'default' AND login_username != 'admin';`);
    logger.info("Database migrations completed");
  } catch (err) {
    logger.warn({ err }, "Migration warning (may already exist)");
  }
}

runMigrations().catch(err => logger.error({ err }, "Migration failed"));

// ─── Security Headers ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "'unsafe-inline'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:"],
      connectSrc: ["'self'"],
      frameSrc: ["'none'"],
      objectSrc: ["'none'"],
      baseUri: ["'self'"],
      formAction: ["'self'"],
      frameAncestors: ["'none'"],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginResourcePolicy: { policy: "same-site" },
}));

// ─── CORS ─────────────────────────────────────────────────────────────────
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map(s => s.trim())
  : ["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"];

app.use(cors({
  origin: (origin, callback) => {
    // L2: Block null origin (sandboxed iframes, file://)
    if (origin === "null") return callback(new Error("Not allowed by CORS"));
    // Allow requests with no origin (same-origin, server-to-server)
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin) || allowedOrigins.includes("*")) {
      return callback(null, true);
    }
    callback(new Error("Not allowed by CORS"));
  },
  credentials: true,
}));

// ─── Rate Limiting ────────────────────────────────────────────────────────
// L5: Rate limit key uses JWT user ID when available
function rateLimitKey(req: any): string {
  const authHeader = req.headers?.authorization;
  if (authHeader?.startsWith("Bearer ")) {
    try {
      const payload = JSON.parse(Buffer.from(authHeader.split(".")[1], "base64").toString());
      if (payload?.id) return `user-${payload.id}`;
    } catch {}
  }
  return req.socket?.remoteAddress || "anonymous";
}

// Global: 200 requests per minute per IP
const globalLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 200,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later" },
  keyGenerator: rateLimitKey,
});
app.use(globalLimiter);

// Auth endpoints: 10 attempts per 15 minutes per IP
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many login attempts, please try again later" },
});

// Super admin endpoints: 20 attempts per 15 minutes per IP
const superAdminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests, please try again later" },
  keyGenerator: rateLimitKey,
});

// AI endpoints: 30 requests per minute per IP
const aiLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many AI requests, please try again later" },
  keyGenerator: rateLimitKey,
});

// ─── Body Parsing ─────────────────────────────────────────────────────────
app.use(express.json({ limit: "2mb" }));
app.use(express.urlencoded({ extended: true, limit: "2mb" }));

// ─── Logging ──────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  }),
);

// ─── Apply rate limiters to specific routes BEFORE router ───────────────────
app.use("/api/portfolio/login", authLimiter);
app.use("/api/portfolio/create-client", superAdminLimiter);
app.use("/api/portfolio/clients", superAdminLimiter);
app.use("/api/openai", aiLimiter);
app.use("/api/cv", aiLimiter);

// ─── Router ─────────────────────────────────────────────────────────────────
app.use("/api", router);

export { globalLimiter, authLimiter, aiLimiter };
export default app;
