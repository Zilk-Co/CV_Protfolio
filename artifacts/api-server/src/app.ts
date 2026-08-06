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
  const migrations = [
    "ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS employment_status TEXT NOT NULL DEFAULT 'available';",
    "ALTER TABLE portfolio ALTER COLUMN admin_password SET DEFAULT '';",
    "ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS plain_password TEXT NOT NULL DEFAULT '';",
    "ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS cv_export_sections JSONB DEFAULT '{\"experience\":true,\"education\":true,\"skills\":true,\"certifications\":true,\"blogs\":true,\"customSections\":true}';",
    "ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS trial_starts_at TIMESTAMP;",
    "ALTER TABLE blogs ADD COLUMN IF NOT EXISTS cover_image TEXT;",
    "ALTER TABLE portfolio ADD COLUMN IF NOT EXISTS admin_label TEXT;",
  ];
  for (const sql of migrations) {
    try { await pool.query(sql); } catch (e) { /* column may already exist */ }
  }
  // Fix case-sensitive loginUsername: lowercase all existing values
  try { await pool.query("UPDATE portfolio SET login_username = LOWER(login_username) WHERE login_username <> LOWER(login_username)"); } catch (e) { /* ignore */ }
  // FK constraints
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
    try {
      const exists = await pool.query(`SELECT 1 FROM information_schema.table_constraints WHERE constraint_name = $1 AND table_name = $2`, [constraint, table]);
      if (exists.rows.length === 0) {
        await pool.query(`ALTER TABLE ${table} ADD CONSTRAINT ${constraint} FOREIGN KEY (${col}) REFERENCES ${refTable}(id) ON DELETE CASCADE;`);
      }
    } catch (e) { /* skip */ }
  }
  // conversations portfolio_id
  try {
    const convExists = await pool.query(`SELECT 1 FROM information_schema.columns WHERE table_name = 'conversations' AND column_name = 'portfolio_id'`);
    if (convExists.rows.length === 0) {
      await pool.query(`ALTER TABLE conversations ADD COLUMN portfolio_id INTEGER REFERENCES portfolio(id) ON DELETE SET NULL;`);
    }
  } catch (e) { /* skip */ }
  // Default portfolio admin + set demo portfolios to never lock
  try {
    await pool.query(`UPDATE portfolio SET login_username = 'admin' WHERE slug = 'default' AND login_username != 'admin';`);
    await pool.query(`UPDATE portfolio SET trial_starts_at = NULL WHERE slug IN ('default','mustafa-protfolio','ayaan-protfolio','agha-protfolio');`);
    // Rename demo portfolios
    await pool.query(`UPDATE portfolio SET slug = 'ayaan-protfolio', name = 'Ayaan', login_username = 'ayaan' WHERE slug = 'umarjadoon';`);
    await pool.query(`UPDATE portfolio SET slug = 'agha-protfolio', name = 'Agha', login_username = 'agha' WHERE slug = 'azhar-abbas';`);
    // Ensure demo portfolios: no trial lock, correct login usernames
    await pool.query(`UPDATE portfolio SET trial_starts_at = NULL, login_username = 'mustafa' WHERE slug = 'mustafa-protfolio';`);
    await pool.query(`UPDATE portfolio SET trial_starts_at = NULL, login_username = 'ayaan' WHERE slug = 'ayaan-protfolio';`);
    await pool.query(`UPDATE portfolio SET trial_starts_at = NULL, login_username = 'agha' WHERE slug = 'agha-protfolio';`);
  } catch (e) { /* skip */ }
  logger.info("Database migrations completed");
}

runMigrations().catch(err => logger.error({ err }, "Migration failed"));

// ─── Security Headers ────────────────────────────────────────────────────
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'"],
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
    if (allowedOrigins.includes(origin)) {
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
app.use("/api/portfolio/refresh", authLimiter);
app.use("/api/portfolio/create-client", superAdminLimiter);
app.use("/api/portfolio/clients", superAdminLimiter);
app.use("/api/portfolio/logout", authLimiter);
// Rate limit all admin mutation endpoints
app.use("/api/portfolio/education", superAdminLimiter);
app.use("/api/portfolio/experience", superAdminLimiter);
app.use("/api/portfolio/skills", superAdminLimiter);
app.use("/api/portfolio/certifications", superAdminLimiter);
app.use("/api/portfolio/blogs", superAdminLimiter);
app.use("/api/portfolio/custom-sections", superAdminLimiter);
app.use("/api/portfolio/cv", superAdminLimiter);
app.use("/api/portfolio/reset", superAdminLimiter);
app.use("/api/portfolio/import", superAdminLimiter);
app.use("/api/openai", aiLimiter);
app.use("/api/cv", aiLimiter);

// ─── Router ─────────────────────────────────────────────────────────────────
app.use("/api", router);

export { globalLimiter, authLimiter, aiLimiter };
export default app;
