import { Router } from "express";
import { db } from "@workspace/db";
import {
  portfolioTable,
  educationTable,
  experienceTable,
  skillsTable,
  certificationsTable,
  blogsTable,
  customSectionsTable,
  customSectionItemsTable,
} from "@workspace/db";
import { eq, and } from "drizzle-orm";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import * as z from "zod";
import {
  UpdatePortfolioBody,
  ChangePasswordBody,
  AddEducationBody,
  UpdateEducationBody,
  UpdateEducationParams,
  DeleteEducationParams,
  AddExperienceBody,
  UpdateExperienceBody,
  UpdateExperienceParams,
  DeleteExperienceParams,
  AddSkillBody,
  DeleteSkillParams,
  AddCertificationBody,
  UpdateCertificationBody,
  UpdateCertificationParams,
  DeleteCertificationParams,
  AddBlogBody,
  UpdateBlogBody,
  UpdateBlogParams,
  DeleteBlogParams,
  AddCustomSectionBody,
  UpdateCustomSectionBody,
  UpdateCustomSectionParams,
  DeleteCustomSectionParams,
  AddCustomSectionItemBody,
  UpdateCustomSectionItemBody,
  UpdateCustomSectionItemParams,
  DeleteCustomSectionItemParams,
  ChangeLoginUsernameBody,
} from "@workspace/api-zod";

import { openai } from "@workspace/integrations-openai-ai-server";

const router = Router();

// ─── Security Config ─────────────────────────────────────────────────────
if (!process.env.JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required. Set it in .env");
}
if (!process.env.SUPER_ADMIN_PASSWORD) {
  throw new Error("FATAL: SUPER_ADMIN_PASSWORD environment variable is required. Set it in .env");
}
const JWT_SECRET = process.env.JWT_SECRET;
const JWT_EXPIRY = "7d";
const SUPER_ADMIN_PASSWORD = process.env.SUPER_ADMIN_PASSWORD;
const SALT_ROUNDS = 10;

// ─── Helpers ──────────────────────────────────────────────────────────────
const JWT_ALGORITHM = "HS256";

// H8: Simple in-memory token blocklist for logout/revocation
const tokenBlocklist = new Set<string>();
function isTokenRevoked(token: string): boolean {
  return tokenBlocklist.has(token);
}
// Cleanup old tokens every hour to prevent memory leak
setInterval(() => { if (tokenBlocklist.size > 10000) tokenBlocklist.clear(); }, 3600000);

function signToken(portfolioId: number, slug: string): string {
  return jwt.sign({ id: portfolioId, slug }, JWT_SECRET, { algorithm: JWT_ALGORITHM, expiresIn: JWT_EXPIRY });
}

function verifyToken(token: string): { id: number; slug: string } | null {
  try {
    return jwt.verify(token, JWT_SECRET, { algorithms: [JWT_ALGORITHM] }) as { id: number; slug: string };
  } catch {
    return null;
  }
}

function getTokenFromRequest(req: any): string | null {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) return auth.slice(7);
  // Fallback: check x-portfolio-token header
  return (req.headers["x-portfolio-token"] as string) || null;
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

async function comparePassword(plain: string, hashed: string): Promise<boolean> {
  return bcrypt.compare(plain, hashed);
}

function validatePasswordStrength(password: string): string | null {
  if (password.length < 8) return "Password must be at least 8 characters long";
  if (!/[A-Z]/.test(password)) return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password)) return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password)) return "Password must contain at least one number";
  return null;
}

// C7: Constant-time comparison to prevent timing attacks
function safeCompare(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) {
    crypto.timingSafeEqual(bufA, Buffer.alloc(bufA.length));
    return false;
  }
  return crypto.timingSafeEqual(bufA, bufB);
}

function sanitizePortfolioResponse(portfolio: any) {
  const { adminPassword, loginUsername, plainPassword, ...safe } = portfolio;
  return safe;
}

// ─── Auth Middleware ───────────────────────────────────────────────────────
async function requireAdmin(req: any, res: any): Promise<number | null> {
  const token = getTokenFromRequest(req);
  if (!token) {
    res.status(401).json({ error: "Authentication required" });
    return null;
  }
  if (isTokenRevoked(token)) {
    res.status(401).json({ error: "Token has been revoked" });
    return null;
  }
  const payload = verifyToken(token);
  if (!payload) {
    res.status(401).json({ error: "Invalid or expired token" });
    return null;
  }
  return payload.id;
}

function requireSuperAdmin(req: any, res: any): boolean {
  const pw = req.headers["x-admin-password"] || req.body?.adminPassword;
  if (!SUPER_ADMIN_PASSWORD) {
    res.status(500).json({ error: "Server configuration error" });
    return false;
  }
  if (!pw || !safeCompare(pw, SUPER_ADMIN_PASSWORD)) {
    res.status(401).json({ error: "Invalid admin credentials" });
    return false;
  }
  return true;
}

// ─── Portfolio Data Helpers ────────────────────────────────────────────────
async function getPortfolioBySlug(slug: string) {
  const trimmedSlug = (slug || "default").trim().toLowerCase();
  const existing = await db.select().from(portfolioTable).where(eq(portfolioTable.slug, trimmedSlug)).limit(1);
  return existing[0] || null;
}

async function getFullPortfolio(portfolioId: number) {
  const [portfolio] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, portfolioId)).limit(1);
  const education = await db.select().from(educationTable).where(eq(educationTable.portfolioId, portfolioId));
  const experience = await db.select().from(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.portfolioId, portfolioId));
  const certifications = await db.select().from(certificationsTable).where(eq(certificationsTable.portfolioId, portfolioId));
  const blogs = await db.select().from(blogsTable).where(eq(blogsTable.portfolioId, portfolioId));
  const customSections = await db.select().from(customSectionsTable).where(eq(customSectionsTable.portfolioId, portfolioId));
  const customSectionItems = await db.select().from(customSectionItemsTable).where(eq(customSectionItemsTable.portfolioId, portfolioId));

  return sanitizePortfolioResponse({
    ...portfolio,
    additionalInfo: (portfolio.additionalInfo as Record<string, string>) || {},
    sectionOrder: (portfolio.sectionOrder as string[]) || ["experience", "education", "skills", "certifications", "blogs"],
    education: education.map((e) => ({ ...e, accomplishments: (e.accomplishments as string[]) || [] })).sort((a, b) => a.orderIndex - b.orderIndex),
    experience: experience.map((e) => ({ ...e, accomplishments: (e.accomplishments as string[]) || [] })).sort((a, b) => a.orderIndex - b.orderIndex),
    skills,
    certifications,
    blogs: blogs.sort((a, b) => a.orderIndex - b.orderIndex),
    customSections: customSections.sort((a, b) => a.orderIndex - b.orderIndex).map((cs) => ({
      ...cs,
      items: customSectionItems
        .filter((item) => item.customSectionId === cs.id)
        .map((item) => ({ ...item, accomplishments: (item.accomplishments as string[]) || [] }))
        .sort((a, b) => a.orderIndex - b.orderIndex),
    })),
  });
}

// ─── PUBLIC: Get Portfolio (no auth needed for viewing) ───────────────────
router.get("/portfolio", async (req, res) => {
  try {
    const slug = (req.headers["x-portfolio-slug"] || req.query.slug || "default") as string;
    const portfolio = await getPortfolioBySlug(slug);
    if (!portfolio) {
      return res.status(404).json({ error: "Portfolio not found" });
    }
    const full = await getFullPortfolio(portfolio.id);
    res.json(full);
  } catch (err: any) {
    req.log.error({ err }, "Failed to get portfolio");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── PUBLIC: Login (server-side auth, returns JWT) ────────────────────────
// M5: Account lockout - in-memory tracking of failed attempts
const loginAttempts = new Map<string, { count: number; lockoutUntil: number }>();
const MAX_LOGIN_ATTEMPTS = 10;
const LOCKOUT_MS = 15 * 60 * 1000; // 15 minutes

function cleanupLoginAttempts() {
  const now = Date.now();
  for (const [key, val] of loginAttempts) {
    if (now > val.lockoutUntil) loginAttempts.delete(key);
  }
}

router.post("/portfolio/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({ error: "Username and password are required" });
    }

    cleanupLoginAttempts();
    const attemptKey = username.toLowerCase().trim();
    const attempt = loginAttempts.get(attemptKey);
    if (attempt && attempt.lockoutUntil > Date.now()) {
      const remaining = Math.ceil((attempt.lockoutUntil - Date.now()) / 1000);
      return res.status(429).json({ error: `Account locked. Try again in ${remaining} seconds` });
    }

    // Lookup by login_username (case-insensitive) — slug and name are never used for login
    const allPortfolios = await db.select().from(portfolioTable);
    const portfolio = allPortfolios.find(p => p.loginUsername?.toLowerCase() === attemptKey) || null;
    if (!portfolio) {
      return res.status(401).json({ error: "Invalid credentials" });
    }

    const valid = await comparePassword(password, portfolio.adminPassword);
    if (!valid) {
      const newAttempt = { count: (attempt?.count || 0) + 1, lockoutUntil: 0 };
      if (newAttempt.count >= MAX_LOGIN_ATTEMPTS) {
        newAttempt.lockoutUntil = Date.now() + LOCKOUT_MS;
        req.log.warn({ slug }, "Account locked due to too many failed attempts");
      }
      loginAttempts.set(attemptKey, newAttempt);
      return res.status(401).json({ error: "Invalid credentials" });
    }

    loginAttempts.delete(attemptKey);
    const token = signToken(portfolio.id, portfolio.slug);
    res.json({
      token,
      slug: portfolio.slug,
      name: portfolio.name,
    });
  } catch (err) {
    req.log.error({ err }, "Login failed");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Logout (revoke JWT) ───────────────────────────────────────────
router.post("/portfolio/logout", async (req, res) => {
  const token = getTokenFromRequest(req);
  if (token) tokenBlocklist.add(token);
  res.json({ success: true });
});

// ─── ADMIN: Update Portfolio ──────────────────────────────────────────────
router.put("/portfolio", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = UpdatePortfolioBody.parse(req.body);
    const { isAdmin, adminPassword, ...safeBody } = body as any;
    await db.update(portfolioTable).set(safeBody).where(eq(portfolioTable.id, portfolioId));
    res.json(await getFullPortfolio(portfolioId));
  } catch (err) {
    req.log.error({ err }, "Failed to update portfolio");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Change Password (with hashing + policy) ──────────────────────
router.post("/portfolio/change-password", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;

    const { currentPassword, newPassword, confirmPassword } = ChangePasswordBody.parse(req.body);
    if (newPassword !== confirmPassword) {
      return res.status(400).json({ error: "New passwords do not match" });
    }

    const pwError = validatePasswordStrength(newPassword);
    if (pwError) {
      return res.status(400).json({ error: pwError });
    }

    const [portfolio] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, portfolioId)).limit(1);
    const valid = await comparePassword(currentPassword, portfolio.adminPassword);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    const hashed = await hashPassword(newPassword);
    await db.update(portfolioTable).set({ adminPassword: hashed }).where(eq(portfolioTable.id, portfolioId));
    res.json({ success: true });
  } catch (err) {
    req.log.error({ err }, "Failed to change password");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: CV Export Section Settings ──────────────────────────────────
router.put("/portfolio/cv-export-sections", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { sections } = req.body;
    if (!sections || typeof sections !== "object") {
      return res.status(400).json({ error: "sections object required" });
    }
    const cvExportSections = {
      experience: sections.experience !== false,
      education: sections.education !== false,
      skills: sections.skills !== false,
      certifications: sections.certifications !== false,
      blogs: sections.blogs === true,
      customSections: sections.customSections === true,
    };
    await db.update(portfolioTable).set({ cvExportSections }).where(eq(portfolioTable.id, portfolioId));
    res.json({ success: true, cvExportSections });
  } catch (err) {
    req.log.error({ err }, "Failed to update CV export sections");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Get Login Username ────────────────────────────────────────────
router.get("/portfolio/login-username", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const [portfolio] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, portfolioId)).limit(1);
    res.json({ loginUsername: portfolio?.loginUsername || "" });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Change Login Username ─────────────────────────────────────────
router.post("/portfolio/change-username", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;

    const { currentPassword, newUsername } = ChangeLoginUsernameBody.parse(req.body);

    const [portfolio] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, portfolioId)).limit(1);
    const valid = await comparePassword(currentPassword, portfolio.adminPassword);
    if (!valid) {
      return res.status(401).json({ error: "Current password is incorrect" });
    }

    // Check if username is already taken by another portfolio
    const allPortfolios = await db.select().from(portfolioTable);
    const taken = allPortfolios.find(p => p.id !== portfolioId && p.loginUsername?.toLowerCase() === newUsername.toLowerCase());
    if (taken) {
      return res.status(400).json({ error: "That username is already taken" });
    }

    await db.update(portfolioTable).set({ loginUsername: newUsername }).where(eq(portfolioTable.id, portfolioId));
    res.json({ success: true, loginUsername: newUsername });
  } catch (err) {
    req.log.error({ err }, "Failed to change username");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Education ─────────────────────────────────────────────────────────────
router.post("/portfolio/education", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddEducationBody.parse(req.body);
    const count = await db.select().from(educationTable).where(eq(educationTable.portfolioId, portfolioId));
    const [edu] = await db.insert(educationTable).values({ ...body, portfolioId, accomplishments: body.accomplishments || [], orderIndex: body.orderIndex ?? count.length }).returning();
    res.status(201).json({ ...edu, accomplishments: (edu.accomplishments as string[]) || [] });
  } catch (err) {
    req.log.error({ err }, "Failed to add education");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/education/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = UpdateEducationParams.parse(req.params);
    const body = UpdateEducationBody.parse(req.body);
    const updateData: Record<string, unknown> = { ...body };
    if (body.accomplishments !== undefined) updateData.accomplishments = body.accomplishments;
    const [edu] = await db.update(educationTable).set(updateData).where(and(eq(educationTable.id, id), eq(educationTable.portfolioId, portfolioId))).returning();
    res.json({ ...edu, accomplishments: (edu.accomplishments as string[]) || [] });
  } catch (err) {
    req.log.error({ err }, "Failed to update education");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/education/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteEducationParams.parse(req.params);
    await db.delete(educationTable).where(and(eq(educationTable.id, id), eq(educationTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete education");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Experience ────────────────────────────────────────────────────────────
router.post("/portfolio/experience", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddExperienceBody.parse(req.body);
    const count = await db.select().from(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
    const [exp] = await db.insert(experienceTable).values({ ...body, portfolioId, accomplishments: body.accomplishments || [], orderIndex: body.orderIndex ?? count.length }).returning();
    res.status(201).json({ ...exp, accomplishments: (exp.accomplishments as string[]) || [] });
  } catch (err) {
    req.log.error({ err }, "Failed to add experience");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/experience/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = UpdateExperienceParams.parse(req.params);
    const body = UpdateExperienceBody.parse(req.body);
    const updateData: Record<string, unknown> = { ...body };
    if (body.accomplishments !== undefined) updateData.accomplishments = body.accomplishments;
    const [exp] = await db.update(experienceTable).set(updateData).where(and(eq(experienceTable.id, id), eq(experienceTable.portfolioId, portfolioId))).returning();
    res.json({ ...exp, accomplishments: (exp.accomplishments as string[]) || [] });
  } catch (err) {
    req.log.error({ err }, "Failed to update experience");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/experience/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteExperienceParams.parse(req.params);
    await db.delete(experienceTable).where(and(eq(experienceTable.id, id), eq(experienceTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete experience");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Skills ────────────────────────────────────────────────────────────────
router.post("/portfolio/skills", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddSkillBody.parse(req.body);
    const [skill] = await db.insert(skillsTable).values({ ...body, portfolioId }).returning();
    res.status(201).json(skill);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/skills/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteSkillParams.parse(req.params);
    await db.delete(skillsTable).where(and(eq(skillsTable.id, id), eq(skillsTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Certifications ────────────────────────────────────────────────────────
router.post("/portfolio/certifications", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddCertificationBody.parse(req.body);
    const [cert] = await db.insert(certificationsTable).values({ ...body, portfolioId }).returning();
    res.status(201).json(cert);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/certifications/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = UpdateCertificationParams.parse(req.params);
    const body = UpdateCertificationBody.parse(req.body);
    const [cert] = await db.update(certificationsTable).set(body).where(and(eq(certificationsTable.id, id), eq(certificationsTable.portfolioId, portfolioId))).returning();
    res.json(cert);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/certifications/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteCertificationParams.parse(req.params);
    await db.delete(certificationsTable).where(and(eq(certificationsTable.id, id), eq(certificationsTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Blogs ─────────────────────────────────────────────────────────────────
router.post("/portfolio/blogs", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddBlogBody.parse(req.body);
    const count = await db.select().from(blogsTable).where(eq(blogsTable.portfolioId, portfolioId));
    const [blog] = await db.insert(blogsTable).values({
      ...body,
      portfolioId,
      summary: body.summary || "",
      orderIndex: body.orderIndex ?? count.length
    }).returning();
    res.status(201).json(blog);
  } catch (err) {
    req.log.error({ err }, "Failed to create blog");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/blogs/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = UpdateBlogParams.parse(req.params);
    const body = UpdateBlogBody.parse(req.body);
    const [blog] = await db.update(blogsTable).set(body).where(and(eq(blogsTable.id, id), eq(blogsTable.portfolioId, portfolioId))).returning();
    res.json(blog);
  } catch (err) {
    req.log.error({ err }, "Failed to update blog");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/blogs/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteBlogParams.parse(req.params);
    await db.delete(blogsTable).where(and(eq(blogsTable.id, id), eq(blogsTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    req.log.error({ err }, "Failed to delete blog");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Custom Sections ───────────────────────────────────────────────────────
router.post("/portfolio/custom-sections", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddCustomSectionBody.parse(req.body);
    const [section] = await db.insert(customSectionsTable).values({ ...body, portfolioId, content: body.content || "", orderIndex: body.orderIndex || 0 }).returning();
    res.status(201).json({ ...section, items: [] });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/custom-sections/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = UpdateCustomSectionParams.parse(req.params);
    const body = UpdateCustomSectionBody.parse(req.body);
    const [section] = await db.update(customSectionsTable).set(body).where(and(eq(customSectionsTable.id, id), eq(customSectionsTable.portfolioId, portfolioId))).returning();
    res.json(section);
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/custom-sections/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteCustomSectionParams.parse(req.params);
    await db.delete(customSectionItemsTable).where(and(eq(customSectionItemsTable.customSectionId, id), eq(customSectionItemsTable.portfolioId, portfolioId)));
    await db.delete(customSectionsTable).where(and(eq(customSectionsTable.id, id), eq(customSectionsTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── Custom Section Items ──────────────────────────────────────────────────
router.post("/portfolio/custom-section-items", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const body = AddCustomSectionItemBody.parse(req.body);
    // Verify the custom section belongs to this portfolio
    const [section] = await db.select().from(customSectionsTable).where(and(eq(customSectionsTable.id, body.customSectionId), eq(customSectionsTable.portfolioId, portfolioId))).limit(1);
    if (!section) {
      return res.status(400).json({ error: "Custom section not found" });
    }
    const existing = await db.select().from(customSectionItemsTable).where(eq(customSectionItemsTable.customSectionId, body.customSectionId));
    const [item] = await db.insert(customSectionItemsTable).values({
      ...body,
      portfolioId,
      accomplishments: body.accomplishments || [],
      orderIndex: body.orderIndex ?? existing.length,
    }).returning();
    res.status(201).json({ ...item, accomplishments: (item.accomplishments as string[]) || [] });
  } catch (err) {
    req.log.error({ err }, "Failed to add custom section item");
    res.status(500).json({ error: "Internal server error" });
  }
});

router.put("/portfolio/custom-section-items/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = UpdateCustomSectionItemParams.parse(req.params);
    const body = UpdateCustomSectionItemBody.parse(req.body);
    const updateData: Record<string, unknown> = { ...body };
    if (body.accomplishments !== undefined) updateData.accomplishments = body.accomplishments;
    const [item] = await db.update(customSectionItemsTable).set(updateData).where(and(eq(customSectionItemsTable.id, id), eq(customSectionItemsTable.portfolioId, portfolioId))).returning();
    res.json({ ...item, accomplishments: (item.accomplishments as string[]) || [] });
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

router.delete("/portfolio/custom-section-items/:id", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const { id } = DeleteCustomSectionItemParams.parse(req.params);
    await db.delete(customSectionItemsTable).where(and(eq(customSectionItemsTable.id, id), eq(customSectionItemsTable.portfolioId, portfolioId)));
    res.status(204).end();
  } catch (err) {
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Reset Portfolio ────────────────────────────────────────────────
router.post("/portfolio/reset", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;

    const [current] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, portfolioId)).limit(1);
    const keepPassword = current?.adminPassword || "";
    const keepTheme = current?.theme || "orbital";

    await db.delete(customSectionItemsTable).where(eq(customSectionItemsTable.portfolioId, portfolioId));
    await db.delete(customSectionsTable).where(eq(customSectionsTable.portfolioId, portfolioId));
    await db.delete(blogsTable).where(eq(blogsTable.portfolioId, portfolioId));
    await db.delete(certificationsTable).where(eq(certificationsTable.portfolioId, portfolioId));
    await db.delete(skillsTable).where(eq(skillsTable.portfolioId, portfolioId));
    await db.delete(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
    await db.delete(educationTable).where(eq(educationTable.portfolioId, portfolioId));

    await db.update(portfolioTable).set({
      name: "Your Full Name",
      title: "Your Professional Title",
      about: "Write a short summary about yourself — your background, goals, and what makes you stand out.",
      email: "your.email@example.com",
      phone: "+1 (000) 000-0000",
      location: "City, Country",
      theme: keepTheme,
      status: "open",
      adminPassword: keepPassword,
      additionalInfo: {},
      sectionOrder: ["experience", "education", "skills", "certifications", "blogs"],
      photoUrl: null,
    }).where(eq(portfolioTable.id, portfolioId));

    res.json(await getFullPortfolio(portfolioId));
  } catch (err) {
    req.log.error({ err }, "Failed to reset portfolio");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── ADMIN: Import CV ─────────────────────────────────────────────────────
const ImportCvBody = z.object({
  name: z.string().max(200).optional(),
  title: z.string().max(200).optional(),
  about: z.string().max(5000).optional(),
  email: z.string().max(200).optional(),
  phone: z.string().max(50).optional(),
  location: z.string().max(200).optional(),
  education: z.array(z.object({
    institution: z.string().max(200), degree: z.string().max(200), field: z.string().max(200),
    startDate: z.string().max(50), endDate: z.string().max(50).nullable().optional(),
    grade: z.string().max(50).nullable().optional(), description: z.string().max(2000).nullable().optional(),
    accomplishments: z.array(z.string().max(500)).max(20).optional(),
  })).max(50).optional(),
  experience: z.array(z.object({
    company: z.string().max(200), role: z.string().max(200),
    startDate: z.string().max(50), endDate: z.string().max(50).nullable().optional(),
    description: z.string().max(2000).optional(), accomplishments: z.array(z.string().max(500)).max(20).optional(),
  })).max(50).optional(),
  skills: z.array(z.object({ name: z.string().max(100), category: z.string().max(100) })).max(100).optional(),
  certifications: z.array(z.object({ name: z.string().max(200), issuer: z.string().max(200), date: z.string().max(50).nullable().optional() })).max(50).optional(),
});

router.post("/portfolio/import-cv", async (req, res) => {
  try {
    const portfolioId = await requireAdmin(req, res);
    if (!portfolioId) return;
    const data = ImportCvBody.parse(req.body);

    await db.delete(certificationsTable).where(eq(certificationsTable.portfolioId, portfolioId));
    await db.delete(skillsTable).where(eq(skillsTable.portfolioId, portfolioId));
    await db.delete(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
    await db.delete(educationTable).where(eq(educationTable.portfolioId, portfolioId));

    const update: Record<string, unknown> = {};
    if (data.name) update.name = data.name;
    if (data.title) update.title = data.title;
    if (data.about) update.about = data.about;
    if (data.email) update.email = data.email;
    if (data.phone) update.phone = data.phone;
    if (data.location) update.location = data.location;
    if (Object.keys(update).length > 0) {
      await db.update(portfolioTable).set(update).where(eq(portfolioTable.id, portfolioId));
    }

    for (let i = 0; i < (data.education || []).length; i++) {
      const e = data.education![i];
      await db.insert(educationTable).values({
        portfolioId, institution: e.institution || "", degree: e.degree || "", field: e.field || "",
        startDate: e.startDate || "", endDate: e.endDate ?? null, grade: e.grade ?? null,
        description: e.description ?? null, accomplishments: e.accomplishments || [], orderIndex: i,
      });
    }

    for (let i = 0; i < (data.experience || []).length; i++) {
      const e = data.experience![i];
      await db.insert(experienceTable).values({
        portfolioId, company: e.company || "", role: e.role || "",
        startDate: e.startDate || "", endDate: e.endDate ?? null,
        description: e.description ?? "", accomplishments: e.accomplishments || [], orderIndex: i,
      });
    }

    const seenSkills = new Set<string>();
    for (const s of (data.skills || [])) {
      const key = `${s.name.toLowerCase()}|${s.category.toLowerCase()}`;
      if (!seenSkills.has(key)) {
        seenSkills.add(key);
        await db.insert(skillsTable).values({ portfolioId, name: s.name, category: s.category });
      }
    }

    for (let i = 0; i < (data.certifications || []).length; i++) {
      const c = data.certifications![i];
      await db.insert(certificationsTable).values({
        portfolioId, name: c.name, issuer: c.issuer, date: c.date ?? null, orderIndex: i,
      });
    }

    res.json(await getFullPortfolio(portfolioId));
  } catch (err) {
    req.log.error({ err }, "Failed to import CV data");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── SUPER ADMIN: Create Client (protected) ───────────────────────────────
router.post("/portfolio/create-client", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const { slug, password, name, email, features } = req.body;

    if (!slug || !password) {
      return res.status(400).json({ error: "Slug and password are required" });
    }

    if (!/^[a-z0-9-]+$/.test(slug)) {
      return res.status(400).json({ error: "Slug must be lowercase alphanumeric with hyphens only" });
    }

    const pwError = validatePasswordStrength(password);
    if (pwError) {
      return res.status(400).json({ error: pwError });
    }

    const existing = await db.select().from(portfolioTable).where(eq(portfolioTable.slug, slug)).limit(1);
    if (existing.length > 0) {
      return res.status(400).json({ error: "That slug is already taken." });
    }

    const clientFeatures = {
      cvImportExport: features?.cvImportExport === true,
      aiChat: features?.aiChat === true,
      themeSelector: features?.themeSelector === true,
      blogPage: features?.blogPage === true,
      exploreAccess: features?.exploreAccess === true,
      aiMatchAccess: features?.aiMatchAccess === true,
    };

    const sectionOrder: string[] = ["experience", "education", "skills", "certifications"];
    if (clientFeatures.blogPage) sectionOrder.push("blogs");

    const hashedPassword = await hashPassword(password);

    const [newClient] = await db.insert(portfolioTable).values({
      slug,
      adminPassword: hashedPassword,
      plainPassword: password,
      loginUsername: name || "newclient",
      name: name || "New Client",
      email: email || "",
      title: "Aspiring Professional",
      about: "Welcome to your new portfolio! Log in to start editing.",
      theme: "orbital",
      status: "open",
      isAdmin: false,
      sectionOrder,
      features: clientFeatures,
    }).returning();

    return res.status(201).json({
      success: true,
      message: "Client portfolio created successfully!",
      portfolioId: newClient.id,
      slug: newClient.slug,
    });
  } catch (error) {
    req.log.error({ err: error }, "Failed to create client");
    return res.status(500).json({ error: "Could not create client." });
  }
});

// ─── SUPER ADMIN: Client Management ────────────────────────────────────────
router.get("/portfolio/clients", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const clients = await db
      .select({
        id: portfolioTable.id,
        slug: portfolioTable.slug,
        name: portfolioTable.name,
        email: portfolioTable.email,
        theme: portfolioTable.theme,
        status: portfolioTable.status,
        features: portfolioTable.features,
        plainPassword: portfolioTable.plainPassword,
      })
      .from(portfolioTable)
      .where(eq(portfolioTable.isAdmin, false));

    const nonDefault = clients.filter(c => c.slug !== "default");
    return res.json(nonDefault);
  } catch (error) {
    req.log.error({ err: error }, "Failed to list clients");
    return res.status(500).json({ error: "Could not list clients." });
  }
});

router.put("/portfolio/clients/:id", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid client ID" });

    const { features } = req.body;
    const clientFeatures = {
      cvImportExport: features?.cvImportExport === true,
      aiChat: features?.aiChat === true,
      themeSelector: features?.themeSelector === true,
      blogPage: features?.blogPage === true,
      exploreAccess: features?.exploreAccess === true,
      aiMatchAccess: features?.aiMatchAccess === true,
    };

    const [updated] = await db
      .update(portfolioTable)
      .set({ features: clientFeatures })
      .where(eq(portfolioTable.id, id))
      .returning({
        id: portfolioTable.id,
        slug: portfolioTable.slug,
        name: portfolioTable.name,
        features: portfolioTable.features,
      });

    if (!updated) return res.status(404).json({ error: "Client not found" });
    return res.json({ success: true, client: updated });
  } catch (error) {
    req.log.error({ err: error }, "Failed to update client features");
    return res.status(500).json({ error: "Could not update client." });
  }
});

router.put("/portfolio/clients/:id/password", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid client ID" });

    const { password } = req.body;
    if (!password) return res.status(400).json({ error: "Password is required" });

    const pwError = validatePasswordStrength(password);
    if (pwError) return res.status(400).json({ error: pwError });

    const hashedPassword = await hashPassword(password);

    const [updated] = await db
      .update(portfolioTable)
      .set({ adminPassword: hashedPassword, plainPassword: password })
      .where(eq(portfolioTable.id, id))
      .returning({ id: portfolioTable.id, slug: portfolioTable.slug });

    if (!updated) return res.status(404).json({ error: "Client not found" });
    return res.json({ success: true, client: updated });
  } catch (error) {
    req.log.error({ err: error }, "Failed to update client password");
    return res.status(500).json({ error: "Could not update password." });
  }
});

router.delete("/portfolio/clients/:id", async (req, res) => {
  if (!requireSuperAdmin(req, res)) return;
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid client ID" });

    const [client] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, id)).limit(1);
    if (!client) return res.status(404).json({ error: "Client not found" });
    if (client.slug === "default") return res.status(403).json({ error: "Cannot delete the default portfolio" });

    await db.delete(customSectionItemsTable).where(eq(customSectionItemsTable.portfolioId, id));
    await db.delete(customSectionsTable).where(eq(customSectionsTable.portfolioId, id));
    await db.delete(blogsTable).where(eq(blogsTable.portfolioId, id));
    await db.delete(certificationsTable).where(eq(certificationsTable.portfolioId, id));
    await db.delete(skillsTable).where(eq(skillsTable.portfolioId, id));
    await db.delete(experienceTable).where(eq(experienceTable.portfolioId, id));
    await db.delete(educationTable).where(eq(educationTable.portfolioId, id));
    await db.delete(portfolioTable).where(eq(portfolioTable.id, id));

    return res.json({ success: true, message: `Client '${client.slug}' deleted.` });
  } catch (error) {
    req.log.error({ err: error }, "Failed to delete client");
    return res.status(500).json({ error: "Could not delete client." });
  }
});

// ─── PUBLIC: Explore (no auth required) ──────────────────────────────────
router.get("/portfolio/explore", async (req, res) => {
  try {
    const currentSlug = (req.headers["x-portfolio-slug"] || "default") as string;
    const [currentPortfolio] = await db.select().from(portfolioTable).where(eq(portfolioTable.slug, currentSlug)).limit(1);
    const currentPortfolioId = currentPortfolio?.id || 0;

    const allPortfolios = await db.select().from(portfolioTable);
    const otherPortfolios = allPortfolios.filter(p => p.id !== currentPortfolioId);

    const profiles = await Promise.all(
      otherPortfolios.map(async (portfolio) => {
        const portfolioId = portfolio.id;
        const skills = await db.select().from(skillsTable).where(eq(skillsTable.portfolioId, portfolioId));
        const experience = await db.select().from(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
        const education = await db.select().from(educationTable).where(eq(educationTable.portfolioId, portfolioId));
        const certifications = await db.select().from(certificationsTable).where(eq(certificationsTable.portfolioId, portfolioId));
        return {
          slug: portfolio.slug,
          name: portfolio.name,
          title: portfolio.title,
          location: portfolio.location,
          photoUrl: portfolio.photoUrl,
          about: portfolio.about,
          email: portfolio.email,
          employmentStatus: portfolio.employmentStatus || "available",
          skills: skills.map(s => ({ name: s.name, category: s.category })),
          experience: experience.map(e => ({ role: e.role, company: e.company, description: e.description, startDate: e.startDate, endDate: e.endDate })),
          education: education.map(e => ({ degree: e.degree, field: e.field, institution: e.institution })),
          certifications: certifications.map(c => ({ name: c.name, issuer: c.issuer })),
        };
      })
    );

    const allBlogs = await db.select().from(blogsTable);
    const blogs = await Promise.all(
      allBlogs.map(async (blog) => {
        const [portfolio] = await db.select().from(portfolioTable).where(eq(portfolioTable.id, blog.portfolioId)).limit(1);
        return {
          id: blog.id,
          title: blog.title,
          summary: blog.summary,
          content: blog.content,
          author: portfolio?.name || "Unknown",
          createdAt: blog.createdAt,
          portfolioSlug: portfolio?.slug || "default",
          coverImage: blog.coverImage,
        };
      })
    );

    res.json({ profiles, blogs });
  } catch (err) {
    req.log.error({ err }, "Failed to fetch explore data");
    res.status(500).json({ error: "Internal server error" });
  }
});

// ─── AI Job Matching (Explore) — public, no auth required ────────────────
router.post("/portfolio/explore/match", async (req, res) => {
  try {
    const { jobDescription } = req.body;
    if (!jobDescription || typeof jobDescription !== "string") {
      return res.status(400).json({ error: "jobDescription is required" });
    }

    const allPortfolios = await db.select().from(portfolioTable);

    const profiles = await Promise.all(
      allPortfolios.map(async (portfolio) => {
        const portfolioId = portfolio.id;
        const skills = await db.select().from(skillsTable).where(eq(skillsTable.portfolioId, portfolioId));
        const experience = await db.select().from(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
        const education = await db.select().from(educationTable).where(eq(educationTable.portfolioId, portfolioId));
        const certifications = await db.select().from(certificationsTable).where(eq(certificationsTable.portfolioId, portfolioId));
        return {
          slug: portfolio.slug,
          name: portfolio.name,
          title: portfolio.title,
          location: portfolio.location,
          photoUrl: portfolio.photoUrl,
          about: portfolio.about,
          email: portfolio.email,
          employmentStatus: portfolio.employmentStatus || "available",
          skills: skills.map(s => ({ name: s.name, category: s.category })),
          experience: experience.map(e => ({ role: e.role, company: e.company, description: e.description, startDate: e.startDate, endDate: e.endDate })),
          education: education.map(e => ({ degree: e.degree, field: e.field, institution: e.institution })),
          certifications: certifications.map(c => ({ name: c.name, issuer: c.issuer })),
        };
      })
    );

    const profilesSummary = profiles.map((p, i) => {
      const skills = p.skills.map(s => s.name).join(", ");
      const exp = p.experience.map(e => `${e.role} at ${e.company}${e.description ? ` (${e.description.slice(0, 150)})` : ""}`).join("; ");
      const edu = p.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join("; ");
      const certs = p.certifications.map(c => `${c.name} from ${c.issuer}`).join(", ");
      return `[${i}] ${p.name} | Title: ${p.title || "N/A"} | Location: ${p.location || "N/A"} | Status: ${p.employmentStatus} | About: ${(p.about || "").slice(0, 200)} | Skills: ${skills || "N/A"} | Experience: ${exp || "N/A"} | Education: ${edu || "N/A"} | Certifications: ${certs || "N/A"} | Email: ${p.email || "N/A"} | Slug: ${p.slug}`;
    }).join("\n");

    const systemPrompt = `You are an expert HR recruitment assistant. Your job is to analyze a job description and match it against a list of candidate profiles.

For each candidate, you have: name, title, location, employment status, about, skills, experience, education, and certifications.

INSTRUCTIONS:
1. Analyze the job description carefully — identify required skills, experience level, education, and soft skills.
2. Score each candidate from 0-100 based on how well they match.
3. Only recommend candidates with a score of 40 or above.
4. For each recommended candidate, provide a brief explanation of WHY they match.
5. Sort by match score (highest first).
6. If no candidates match well, say so honestly.

RESPOND IN FORMATTED MARKDOWN (use headings, bold, bullet points, and horizontal rules):

## Top Matches

### 🥇 Candidate Name — Score: XX/100
**Location:** ... | **Status:** ... | **Role:** ...

**Why they match:**
- Reason 1
- Reason 2

**Key Skills:** skill1, skill2, skill3

---

### 🥈 Next Candidate — Score: XX/100
...

## Summary
Brief overall assessment of the candidate pool for this role.

IMPORTANT: Do NOT return JSON. Use markdown formatting only. Write in a clear, professional tone. Use emoji sparingly for scores (🥇🥈🥉).`;

    const stream = await openai.chat.completions.create({
      model: "gemini-flash-latest",
      max_tokens: 2048,
      temperature: 0.3,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Here are the available candidates:\n\n${profilesSummary}\n\n---\n\nNow match them against this job description:\n\n${jobDescription}` },
      ],
      stream: true,
    });

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to match candidates");
    res.write(`data: ${JSON.stringify({ error: "Failed to process matching" })}\n\n`);
    res.end();
  }
});

export { getFullPortfolio, signToken, requireAdmin };
export default router;
