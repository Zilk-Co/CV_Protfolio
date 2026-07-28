import { Router } from "express";
import * as z from "zod";
import { openai } from "@workspace/integrations-openai-ai-server";
import { ExtractCvBody } from "@workspace/api-zod";
import jwt from "jsonwebtoken";
import { eq } from "drizzle-orm";
import { db } from "@workspace/db";
import { portfolioTable } from "@workspace/db";

const router = Router();
const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || "";
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required");
}

async function requireCvAuth(req: any, res: any): Promise<boolean> {
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try { jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ["HS256"] }); return true; } catch { /* fall through */ }
  }
  const token = req.headers["x-portfolio-token"] as string;
  if (token) {
    try { jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] }); return true; } catch { /* fall through */ }
  }
  const slug = (req.headers["x-portfolio-slug"] || req.query?.slug || "") as string;
  const password = req.headers["x-portfolio-password"] as string;
  if (slug && password) {
    const portfolio = await db.select().from(portfolioTable).where(eq(portfolioTable.slug, slug)).limit(1);
    if (portfolio.length > 0) {
      const bcrypt = await import("bcryptjs");
      const valid = await bcrypt.compare(password, portfolio[0].adminPassword);
      if (valid) return true;
    }
  }
  res.status(401).json({ error: "Authentication required" });
  return false;
}

router.post("/cv/extract", async (req, res) => {
  try {
    if (!(await requireCvAuth(req, res))) return;
    const { text } = ExtractCvBody.parse(req.body);

    let response;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        response = await openai.chat.completions.create({
          model: "gemini-flash-latest",
          max_tokens: 4096,
          messages: [
            {
              role: "system",
              content: `You are a professional CV/resume parser. Extract ALL structured data from the CV text and return it as valid JSON exactly matching this schema.

CRITICAL RULES for skills extraction:
- Infer and create SPECIFIC category names based on the person's field (e.g. "Accounting Software", "Programming Languages", "Financial Analysis", "Cloud Platforms", "Design Tools", "Languages", "Soft Skills", "Data Analysis")
- Do NOT use generic "Technical" or "Other" — be precise and domain-specific
- Every skill MUST have a meaningful category name that fits the CV's industry

Return ONLY this JSON structure, no markdown, no extra text:
{
  "name": "string",
  "title": "string - professional title/role",
  "about": "string - the full summary/profile section verbatim",
  "email": "string",
  "phone": "string",
  "location": "string - city and country",
  "education": [
    {
      "institution": "string",
      "degree": "string",
      "field": "string",
      "startDate": "string - year or month year",
      "endDate": "string or null",
      "grade": "string or null",
      "description": "string or null",
      "accomplishments": ["array of achievement bullet points"]
    }
  ],
  "experience": [
    {
      "company": "string",
      "role": "string",
      "startDate": "string",
      "endDate": "string or null - use null if current",
      "description": "string - one sentence role summary",
      "accomplishments": ["array of every achievement/responsibility bullet point from this role"]
    }
  ],
  "skills": [
    {
      "name": "string - individual skill name",
      "category": "string - SPECIFIC domain-relevant category (NOT just Technical or Other)"
    }
  ],
  "certifications": [
    {
      "name": "string",
      "issuer": "string",
      "date": "string or null"
    }
  ]
}`,
            },
            {
              role: "user",
              content: `Parse this CV:\n\n${text}`,
            },
          ],
        });
        break;
      } catch (apiErr: any) {
        if (apiErr?.status === 429 && attempt < 2) {
          await new Promise(r => setTimeout(r, (attempt + 1) * 3000));
          continue;
        }
        throw apiErr;
      }
    }
    if (!response) throw new Error("Failed after retries");

    let rawContent = response.choices[0]?.message?.content ?? "{}";
    rawContent = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      rawContent = rawContent.substring(firstBrace, lastBrace + 1);
    }
    rawContent = rawContent.replace(/,\s*([}\]])/g, "$1");
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      for (let i = rawContent.length - 1; i > 0; i--) {
        if (rawContent[i] === "}") {
          try { parsed = JSON.parse(rawContent.substring(0, i + 1).replace(/,\s*([}\]])/g, "$1")); break; } catch {}
        }
      }
      if (!parsed) throw new Error("Could not extract valid JSON");
    }
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to extract CV");
    res.status(500).json({ error: "Failed to extract CV data" });
  }
});

const GenerateCvTemplatesBody = z.object({
  portfolio: z.object({
    name: z.string(),
    title: z.string(),
    about: z.string(),
    email: z.string().optional(),
    phone: z.string().optional(),
    location: z.string().optional(),
    status: z.string().optional(),
    additionalInfo: z.record(z.string(), z.string()).optional(),
    experience: z.array(z.object({
      company: z.string(),
      role: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      accomplishments: z.array(z.string()).optional(),
    })).optional(),
    education: z.array(z.object({
      institution: z.string(),
      degree: z.string(),
      field: z.string(),
      startDate: z.string(),
      endDate: z.string().nullable().optional(),
      grade: z.string().nullable().optional(),
      description: z.string().nullable().optional(),
      accomplishments: z.array(z.string()).optional(),
    })).optional(),
    skills: z.array(z.object({ name: z.string(), category: z.string() })).optional(),
    certifications: z.array(z.object({ name: z.string(), issuer: z.string(), date: z.string().nullable().optional() })).optional(),
    blogs: z.array(z.object({ title: z.string(), summary: z.string().nullable().optional(), publishedAt: z.string().optional() })).optional(),
    customSections: z.array(z.object({
      title: z.string(),
      content: z.string().nullable().optional(),
      items: z.array(z.object({
        title: z.string(),
        subtitle: z.string().nullable().optional(),
        startDate: z.string().nullable().optional(),
        endDate: z.string().nullable().optional(),
        description: z.string().nullable().optional(),
        accomplishments: z.array(z.string()).optional(),
      })).optional(),
    })).optional(),
  }),
});

router.post("/cv/generate-templates", async (req, res) => {
  try {
    if (!(await requireCvAuth(req, res))) return;
    const { portfolio } = GenerateCvTemplatesBody.parse(req.body);
    const prompt = `You are a world-class Career Strategist and Resume Expert. Your task is to take the provided raw user profile data and transform it into 5 distinct CV JSON objects for 5 different UI templates.

CRITICAL GLOBAL RULES:

Never hallucinate degrees, skills, or fake visuals. Correctly categorize data: full-time roles MUST go under Professional Experience, never under Projects. Return a single JSON object with these keys: auditor, tech, strategist, minimalist, hybrid.

1. THE \"EXECUTIVE AUDITOR\" (Traditional/Big 4)
Tone: Formal, high-trust, focused on compliance.
Content: Highlight regulatory adherence, standard procedures, and accuracy.

2. THE \"FULL-STACK DEV / TECH\" (Terminal/Dark Mode)
Title: Use FINANCIAL TECHNOLOGIST or DATA & ANALYTICS PROFILE for ACCA students with tech skills.
Tech Stack Split: Split into Tech & Tools and Domain Expertise.

3. THE \"DATA STRATEGIST\" (Analytical/ROI Focus)
Tone: Impact-driven and quantitative. Quantify every achievement when possible.

4. THE \"CREATIVE MINIMALIST\" (High Design/White Space)
Mandatory Headings: THE STORY, EXPERIENCE, EDUCATION, EXPERTISE. Do not use bullet points for experience.

5. THE \"HYBRID CONSULTANT\" (The 50/50 Split)
Dual Expertise: Separate lists for [Financial Acumen] and [Technical Stack]. Experience bullets must link tech skills to financial outcomes.

User Data provided: ${JSON.stringify(portfolio, null, 2)}

Return ONLY valid JSON, no markdown, no extra text. The output must be one object with the following structure:
{
  "auditor": { ... },
  "tech": { ... },
  "strategist": { ... },
  "minimalist": { ... },
  "hybrid": { ... }
}
`;

    const response = await openai.chat.completions.create({
      model: "gemini-flash-latest",
      max_tokens: 4096,
      messages: [
        { role: "system", content: prompt },
      ],
    });

    let rawContent = response.choices[0]?.message?.content ?? "{}";
    rawContent = rawContent.replace(/```json\s*/gi, "").replace(/```\s*/g, "").trim();
    const firstBrace = rawContent.indexOf("{");
    const lastBrace = rawContent.lastIndexOf("}");
    if (firstBrace !== -1 && lastBrace > firstBrace) {
      rawContent = rawContent.substring(firstBrace, lastBrace + 1);
    }
    rawContent = rawContent.replace(/,\s*([}\]])/g, "$1");
    let parsed;
    try {
      parsed = JSON.parse(rawContent);
    } catch {
      for (let i = rawContent.length - 1; i > 0; i--) {
        if (rawContent[i] === "}") {
          try { parsed = JSON.parse(rawContent.substring(0, i + 1).replace(/,\s*([}\]])/g, "$1")); break; } catch {}
        }
      }
      if (!parsed) throw new Error("Could not extract valid JSON");
    }
    res.json(parsed);
  } catch (err) {
    req.log.error({ err }, "Failed to generate CV templates");
    res.status(500).json({ error: "Failed to generate CV templates" });
  }
});

export default router;
