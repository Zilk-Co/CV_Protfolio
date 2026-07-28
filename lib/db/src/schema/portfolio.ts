import { pgTable, text, serial, boolean, timestamp, integer, json } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const portfolioTable = pgTable("portfolio", {
  id: serial("id").primaryKey(),
  slug: text("slug").notNull().unique().default("default"),
  name: text("name").notNull().default(""),
  title: text("title").notNull().default(""),
  about: text("about").notNull().default(""),
  email: text("email").notNull().default(""),
  phone: text("phone").notNull().default(""),
  location: text("location").notNull().default(""),
  theme: text("theme").notNull().default("orbital"),
  isAdmin: boolean("is_admin").notNull().default(false),
  photoUrl: text("photo_url"),
  status: text("status").notNull().default("open"),
  employmentStatus: text("employment_status").notNull().default("available"), // "hiring" | "available" | "open" | "employed"
  additionalInfo: json("additional_info").$type<Record<string, string>>().default({}),
  sectionOrder: json("section_order").$type<string[]>().default(["experience", "education", "skills", "certifications", "blogs"]),
  loginUsername: text("login_username").notNull().default(""),
  adminPassword: text("admin_password").notNull().default(""),
  plainPassword: text("plain_password").notNull().default(""),
  features: json("features").$type<{
    cvImportExport: boolean;
    aiChat: boolean;
    themeSelector: boolean;
    blogPage: boolean;
    exploreAccess: boolean;
    aiMatchAccess: boolean;
  }>().default({ cvImportExport: true, aiChat: true, themeSelector: true, blogPage: true, exploreAccess: false, aiMatchAccess: false }),
  cvExportSections: json("cv_export_sections").$type<{
    experience: boolean;
    education: boolean;
    skills: boolean;
    certifications: boolean;
    blogs: boolean;
    customSections: boolean;
  }>().default({ experience: true, education: true, skills: true, certifications: true, blogs: true, customSections: true }),
});

export const educationTable = pgTable("education", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  institution: text("institution").notNull(),
  degree: text("degree").notNull(),
  field: text("field").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  grade: text("grade"),
  description: text("description"),
  accomplishments: json("accomplishments").$type<string[]>().default([]),
  orderIndex: integer("order_index").notNull().default(0),
});

export const experienceTable = pgTable("experience", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  company: text("company").notNull(),
  role: text("role").notNull(),
  startDate: text("start_date").notNull(),
  endDate: text("end_date"),
  description: text("description"),
  accomplishments: json("accomplishments").$type<string[]>().default([]),
  orderIndex: integer("order_index").notNull().default(0),
});

export const skillsTable = pgTable("skills", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  name: text("name").notNull(),
  category: text("category").notNull(),
});

export const certificationsTable = pgTable("certifications", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  name: text("name").notNull(),
  issuer: text("issuer").notNull(),
  date: text("date"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const blogsTable = pgTable("blogs", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull(),
  summary: text("summary").notNull().default(""),
  publishedAt: timestamp("published_at").notNull().defaultNow(),
  orderIndex: integer("order_index").notNull().default(0),
});

export const customSectionsTable = pgTable("custom_sections", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  title: text("title").notNull(),
  content: text("content").notNull().default(""),
  orderIndex: integer("order_index").notNull().default(0),
});

export const customSectionItemsTable = pgTable("custom_section_items", {
  id: serial("id").primaryKey(),
  portfolioId: integer("portfolio_id").notNull(),
  customSectionId: integer("custom_section_id").notNull(),
  title: text("title").notNull(),
  subtitle: text("subtitle"),
  startDate: text("start_date"),
  endDate: text("end_date"),
  description: text("description"),
  accomplishments: json("accomplishments").$type<string[]>().default([]),
  url: text("url"),
  orderIndex: integer("order_index").notNull().default(0),
});

export const insertPortfolioSchema = createInsertSchema(portfolioTable).omit({ id: true });
export const insertEducationSchema = createInsertSchema(educationTable).omit({ id: true });
export const insertExperienceSchema = createInsertSchema(experienceTable).omit({ id: true });
export const insertSkillSchema = createInsertSchema(skillsTable).omit({ id: true });
export const insertCertificationSchema = createInsertSchema(certificationsTable).omit({ id: true });
export const insertBlogSchema = createInsertSchema(blogsTable).omit({ id: true });
export const insertCustomSectionSchema = createInsertSchema(customSectionsTable).omit({ id: true });
export const insertCustomSectionItemSchema = createInsertSchema(customSectionItemsTable).omit({ id: true });

export type Portfolio = typeof portfolioTable.$inferSelect;
export type Education = typeof educationTable.$inferSelect;
export type Experience = typeof experienceTable.$inferSelect;
export type Skill = typeof skillsTable.$inferSelect;
export type Certification = typeof certificationsTable.$inferSelect;
export type Blog = typeof blogsTable.$inferSelect;
export type CustomSection = typeof customSectionsTable.$inferSelect;
export type CustomSectionItem = typeof customSectionItemsTable.$inferSelect;
export type InsertPortfolio = z.infer<typeof insertPortfolioSchema>;

