import { Router } from "express";
import { db } from "@workspace/db";
import {
  conversations, messages, portfolioTable,
  educationTable, experienceTable, skillsTable,
  certificationsTable, blogsTable, customSectionsTable, customSectionItemsTable,
} from "@workspace/db";
import { openai } from "@workspace/integrations-openai-ai-server";
import { eq } from "drizzle-orm";
import jwt from "jsonwebtoken";
import {
  CreateOpenaiConversationBody,
  SendOpenaiMessageBody,
  SendOpenaiMessageParams,
} from "@workspace/api-zod";

const router = Router();

const JWT_SECRET = process.env.JWT_SECRET || process.env.ADMIN_JWT_SECRET || "";
if (!JWT_SECRET) {
  throw new Error("FATAL: JWT_SECRET environment variable is required");
}

// Verify that the request has valid auth (JWT or valid slug+password)
async function requireAiAuth(req: any, res: any): Promise<boolean> {
  // Check for JWT token
  const auth = req.headers.authorization;
  if (auth?.startsWith("Bearer ")) {
    try {
      jwt.verify(auth.slice(7), JWT_SECRET, { algorithms: ["HS256"] });
      return true;
    } catch { /* fall through */ }
  }

  // Check for x-portfolio-token
  const token = req.headers["x-portfolio-token"] as string;
  if (token) {
    try {
      jwt.verify(token, JWT_SECRET, { algorithms: ["HS256"] });
      return true;
    } catch { /* fall through */ }
  }

  // Fallback: check slug + password (bcrypt only — no plaintext comparison)
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

  res.status(401).json({ error: "Authentication required to use AI features" });
  return false;
}

// Resolve which portfolio slug to use from the request (query param takes priority over header)
function getSlugFromRequest(req: any): string {
  const fromQuery = (req.query?.slug || "") as string;
  const fromHeader = (req.headers["x-portfolio-slug"] || "") as string;
  const slug = (fromQuery.trim() || fromHeader.trim() || "default");
  return slug || "default";
}

async function buildPortfolioContext(slug: string): Promise<string> {
  const trimmedSlug = (slug || "default").trim().toLowerCase();
  
  const portfolioRows = await db.select().from(portfolioTable).where(eq(portfolioTable.slug, trimmedSlug)).limit(1);
  const portfolio = portfolioRows[0];
  
  if (!portfolio) {
    return `You represent a portfolio assistant. The portfolio with slug "${trimmedSlug}" was not found in our database.`;
  }

  const portfolioId = portfolio.id;
  const education = await db.select().from(educationTable).where(eq(educationTable.portfolioId, portfolioId));
  const experience = await db.select().from(experienceTable).where(eq(experienceTable.portfolioId, portfolioId));
  const skills = await db.select().from(skillsTable).where(eq(skillsTable.portfolioId, portfolioId));
  const certifications = await db.select().from(certificationsTable).where(eq(certificationsTable.portfolioId, portfolioId));
  const blogs = await db.select().from(blogsTable).where(eq(blogsTable.portfolioId, portfolioId));
  const customSections = await db.select().from(customSectionsTable).where(eq(customSectionsTable.portfolioId, portfolioId));
  const customItems = await db.select().from(customSectionItemsTable).where(eq(customSectionItemsTable.portfolioId, portfolioId));

  const name = portfolio.name;
  const additionalInfo = (portfolio.additionalInfo as Record<string, string>) || {};

  let context = `You are a smart, thoughtful AI assistant for ${name}'s professional portfolio. You are having a natural conversation with a visitor who is learning about ${name} as a professional candidate.

STRICT RULES — YOU MUST FOLLOW:
- ONLY answer questions related to ${name}'s professional background, skills, experience, education, certifications, and career.
- ONLY discuss CV/resume topics: work history, qualifications, achievements, skills, education, and career trajectory.
- NEVER answer questions about politics, religion, personal opinions on non-professional topics, general knowledge, coding help, or anything unrelated to ${name}'s professional profile.
- If asked something off-topic, respond: "I can only help with questions about ${name}'s professional background and qualifications. Feel free to ask about their experience, skills, or education!"
- NEVER generate harmful, inappropriate, or misleading content.

HOW TO ANSWER:
- Be concise but not robotic. Write like a smart human, not a FAQ page.
- Use bullet points for lists, but write in full sentences for analysis/opinions.
- Don't start every response with "${name} is..." — vary your openings.
- If a question deserves a one-line answer, give one line. If it deserves analysis, give analysis.
- You're not a salesperson. Don't oversell. Be honest and balanced.
- Think before answering. Synthesize the data below, don't just copy-paste it.
- You CAN give opinions, observations, and insights when asked. For example, if asked "what makes ${name} stand out?" — analyze their experience and skills and tell the visitor what you find impressive, backed by evidence from the data.
- You CAN compare, contrast, and draw conclusions from the data.
- You CAN ask clarifying questions if the visitor's question is vague.
- You CAN be slightly opinionated — you're not a dictionary, you're an informed guide.
- If the visitor asks something you don't have data for, say "I don't have that information" and suggest what you DO know about ${name}'s professional profile.

REFERENCE DATA FOR ${name.toUpperCase()}:
${portfolio.about}

CONTACT:
- Email: ${portfolio.email}
- Phone: ${portfolio.phone}
- Location: ${portfolio.location}
`;

  if (Object.keys(additionalInfo).length > 0) {
    context += "\nADDITIONAL INFORMATION:\n";
    for (const [key, value] of Object.entries(additionalInfo)) {
      context += `- ${key}: ${value}\n`;
    }
  }

  if (education.length > 0) {
    context += "\nEDUCATION:\n";
    for (const edu of education.sort((a, b) => a.orderIndex - b.orderIndex)) {
      const acc = (edu.accomplishments as string[]) || [];
      context += `- ${edu.degree} in ${edu.field} | ${edu.institution} | ${edu.startDate}${edu.endDate ? ` – ${edu.endDate}` : " (ongoing)"}`;
      if (edu.grade) context += ` | Grade: ${edu.grade}`;
      if (edu.description) context += `\n  ${edu.description}`;
      if (acc.length > 0) { context += "\n  Achievements:\n"; for (const a of acc) context += `  • ${a}\n`; }
      else context += "\n";
    }
  }

  if (experience.length > 0) {
    context += "\nPROFESSIONAL EXPERIENCE:\n";
    for (const exp of experience.sort((a, b) => a.orderIndex - b.orderIndex)) {
      const acc = (exp.accomplishments as string[]) || [];
      context += `- ${exp.role} | ${exp.company} | ${exp.startDate} – ${exp.endDate || "Present"}\n`;
      if (exp.description) context += `  ${exp.description}\n`;
      if (acc.length > 0) { context += "  Key Achievements:\n"; for (const a of acc) context += `  • ${a}\n`; }
    }
  }

  if (skills.length > 0) {
    const byCategory: Record<string, string[]> = {};
    for (const skill of skills) {
      if (!byCategory[skill.category]) byCategory[skill.category] = [];
      byCategory[skill.category].push(skill.name);
    }
    context += "\nSKILLS:\n";
    for (const [cat, names] of Object.entries(byCategory)) {
      context += `- ${cat}: ${names.join(", ")}\n`;
    }
  }

  if (certifications.length > 0) {
    context += "\nCERTIFICATIONS:\n";
    for (const cert of certifications) {
      context += `- ${cert.name} | ${cert.issuer}${cert.date ? ` | ${cert.date}` : ""}\n`;
    }
  }

  if (blogs.length > 0) {
    context += "\nBLOG POSTS (written by the candidate):\n";
    for (const blog of blogs.sort((a, b) => a.orderIndex - b.orderIndex)) {
      const plainContent = blog.content.replace(/<[^>]*>/g, "").trim();
      const preview = plainContent.length > 300 ? plainContent.slice(0, 300) + "..." : plainContent;
      context += `- "${blog.title}" (published ${new Date(blog.publishedAt).toLocaleDateString()})\n`;
      if (blog.summary) context += `  Summary: ${blog.summary}\n`;
      context += `  Content: ${preview}\n`;
    }
  }

  if (customSections.length > 0) {
    for (const section of customSections.sort((a, b) => a.orderIndex - b.orderIndex)) {
      context += `\n${section.title.toUpperCase()}:\n`;
      if (section.content) {
        const plain = section.content.replace(/<[^>]*>/g, "").trim();
        if (plain) context += `${plain}\n`;
      }
      const items = customItems
        .filter(i => i.customSectionId === section.id)
        .sort((a, b) => a.orderIndex - b.orderIndex);
      for (const item of items) {
        context += `- ${item.title}`;
        if (item.subtitle) context += ` | ${item.subtitle}`;
        if (item.startDate) context += ` | ${item.startDate}${item.endDate ? ` – ${item.endDate}` : ""}`;
        context += "\n";
        if (item.description) context += `  ${item.description}\n`;
        const acc = (item.accomplishments as string[]) || [];
        for (const a of acc) context += `  • ${a}\n`;
        if (item.url) context += `  Link: ${item.url}\n`;
      }
    }
  }

  context += `\nRemember: You are a professional portfolio assistant — nothing more. ONLY discuss ${name}'s career, qualifications, and professional profile. Never engage with off-topic questions. Be the assistant a recruiter or hiring manager would want to talk to.`;

  return context;
}

router.post("/openai/conversations", async (req, res) => {
  try {
    if (!(await requireAiAuth(req, res))) return;
    const body = CreateOpenaiConversationBody.parse(req.body);
    const slug = getSlugFromRequest(req);
    const portfolioRows = await db.select().from(portfolioTable).where(eq(portfolioTable.slug, slug)).limit(1);
    const portfolioId = portfolioRows[0]?.id || null;
    const [conversation] = await db.insert(conversations).values({
      title: body.title,
      portfolioId,
    }).returning();
    res.status(201).json(conversation);
  } catch (err) {
    req.log.error({ err }, "Failed to create conversation");
    res.status(500).json({ error: "Failed to create conversation" });
  }
});

router.get("/openai/conversations/:id/messages", async (req, res) => {
  try {
    if (!(await requireAiAuth(req, res))) return;
    const { id } = SendOpenaiMessageParams.parse(req.params);
    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (!conversation) { res.status(404).json({ error: "Conversation not found" }); return; }
    const allMessages = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    res.json(allMessages);
  } catch (err) {
    req.log.error({ err }, "Failed to get messages");
    res.status(500).json({ error: "Failed to get messages" });
  }
});

router.post("/openai/conversations/:id/messages", async (req, res) => {
  try {
    if (!(await requireAiAuth(req, res))) return;
    const { id } = SendOpenaiMessageParams.parse(req.params);
    const body = SendOpenaiMessageBody.parse(req.body);

    const [conversation] = await db.select().from(conversations).where(eq(conversations.id, id)).limit(1);
    if (!conversation) { res.status(404).json({ error: "Conversation not found" }); return; }

    const existingMessages = await db.select().from(messages).where(eq(messages.conversationId, id)).orderBy(messages.createdAt);
    await db.insert(messages).values({ conversationId: id, role: "user", content: body.content });

    // Use the slug from the request header — the frontend sends x-portfolio-slug
    const slug = getSlugFromRequest(req);
    const portfolioContext = await buildPortfolioContext(slug);
    const chatMessages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: portfolioContext },
      ...existingMessages.map((m) => ({ role: m.role as "user" | "assistant", content: m.content })),
      { role: "user", content: body.content },
    ];

    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");

    let fullResponse = "";
    const stream = await openai.chat.completions.create({
      model: "gemini-flash-latest",
      max_tokens: 2048,
      temperature: 0.7,
      messages: chatMessages,
      stream: true,
    });

    for await (const chunk of stream) {
      const content = chunk.choices[0]?.delta?.content;
      if (content) {
        fullResponse += content;
        res.write(`data: ${JSON.stringify({ content })}\n\n`);
      }
    }

    await db.insert(messages).values({ conversationId: id, role: "assistant", content: fullResponse });
    res.write(`data: ${JSON.stringify({ done: true })}\n\n`);
    res.end();
  } catch (err) {
    req.log.error({ err }, "Failed to send message");
    res.write(`data: ${JSON.stringify({ error: "Failed to process message" })}\n\n`);
    res.end();
  }
});

export default router;
