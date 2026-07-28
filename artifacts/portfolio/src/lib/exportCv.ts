import {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  BorderStyle, TabStopPosition, TabStopType, TableRow, TableCell, Table,
  WidthType, ShadingType, convertInchesToTwip,
} from "docx";

export type CvTemplate = "executive" | "minimal" | "sidebar" | "simplified" | "modern" | "creative" | "minimalist" | "freshgraduate" | "techportfolio" | "functional" | "combination" | "academic" | "timeline" | "twocol" | "infographic" | "darkmode" | "corporate" | "millennial" | "ivy" | "everest" | "quick" | "photo" | "cleanelegant" | "modernbasic" | "harvard" | "europass" | "metro" | "creativebeige" | "corporateats" | "boldgraphic" | "scienceeng" | "calligraphic" | "elegant" | "gradient" | "retro" | "conservative" | "artistic" | "ultraminimal" | "techstack" | "businesspro" | "academiccv" | "mosaic" | "brutalist" | "watercolor" | "neon" | "vintage" | "geometric" | "magazine" | "monochrome" | "copper" | "forest" | "royal" | "futuristic" | "handwritten" | "zen" | "pop" | "carbon" | "pearl" | "sunset" | "arctic" | "terracotta" | "indigo";

export interface ExportCvOptions {
  template?: CvTemplate;
  sections?: Record<string, boolean>;
}

type PortfolioData = {
  name: string;
  title: string;
  about: string;
  email: string;
  phone: string;
  location: string;
  status?: string;
  additionalInfo?: Record<string, string>;
  experience?: Array<{
    role: string;
    company: string;
    startDate: string;
    endDate?: string | null;
    description?: string | null;
    accomplishments?: string[];
  }>;
  education?: Array<{
    degree: string;
    field: string;
    institution: string;
    startDate: string;
    endDate?: string | null;
    grade?: string | null;
    description?: string | null;
    accomplishments?: string[];
  }>;
  skills?: Array<{ name: string; category: string }>;
  certifications?: Array<{
    name: string;
    issuer: string;
    date?: string | null;
  }>;
  blogs?: Array<{
    title: string;
    summary?: string | null;
    publishedAt: string;
  }>;
  customSections?: Array<{
    title: string;
    content?: string | null;
    items?: Array<{
      title: string;
      subtitle?: string | null;
      startDate?: string | null;
      endDate?: string | null;
      description?: string | null;
      accomplishments?: string[];
    }>;
  }>;
};

function esc(s: string): string {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
}

function stripHtml(html: string): string {
  return html.replace(/<[^>]*>/g, "").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").trim();
}

function groupByCategory(skills: Array<{ name: string; category: string }>): Record<string, string[]> {
  const g: Record<string, string[]> = {};
  for (const s of skills) {
    if (!g[s.category]) g[s.category] = [];
    g[s.category].push(s.name);
  }
  return g;
}

function contactParts(p: PortfolioData): string[] {
  const parts: string[] = [];
  if (p.location) parts.push(p.location);
  if (p.phone) parts.push(p.phone);
  if (p.email) parts.push(p.email);
  return parts;
}

function bulletHtml(items: string[]): string {
  return items.filter(Boolean).map((a) => `<li>${esc(a)}</li>`).join("\n");
}

// ─── HTML TEMPLATES (for preview) ──────────────────────────────────────────

function buildExecutiveHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="job-row"><div class="job-title">${esc(e.role)} — ${esc(e.company)}</div><div class="job-meta">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</div></div><ul>${bulletHtml(e.accomplishments || [])}</ul>`).join("\n");
    expHtml = `<h2>Professional Experience</h2>\n${items}`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu-item"><div class="edu-title"><span>${esc(e.degree)} in ${esc(e.field)}</span><span>${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-sub">${esc(e.institution)}${e.grade && e.grade !== "null" ? " | Grade: " + esc(e.grade) : ""}</div></div>`).join("\n");
    eduHtml = `<h2>Education</h2>\n${items}`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<li><b>${esc(cat)}:</b> ${names.map(esc).join(" · ")}</li>`).join("\n");
    skillsHtml = `<h2>Core Competencies</h2>\n<ul class="skills-list">${items}</ul>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? " (" + esc(c.date) + ")" : ""}</li>`).join("\n");
    certHtml = `<h2>Certifications &amp; Qualifications</h2>\n<ul>${items}</ul>`;
  }
  let blogsHtml = "";
  if (p.blogs?.length) {
    const items = p.blogs.map((b) => `<li><b>${esc(b.title)}</b> — ${esc(b.summary)} (${new Date(b.publishedAt).getFullYear()})</li>`).join("\n");
    blogsHtml = `<h2>Featured Articles</h2>\n<ul>${items}</ul>`;
  }
  let customSectionsHtml = "";
  if (p.customSections?.length) {
    const sections = p.customSections.map((cs) => `<h3>${esc(cs.title)}</h3>\n<p>${cs.content ? stripHtml(cs.content) : ""}</p>${cs.items?.length ? `<ul>${cs.items.map((i) => `<li><b>${esc(i.title)}</b>${i.subtitle ? "<br>" + esc(i.subtitle) : ""}${i.startDate || i.endDate ? " | " + (i.startDate || "") + (i.endDate ? " – " + i.endDate : "") : ""}${i.description ? "<br>" + stripHtml(i.description) : ""}</li>`).join("\n")}</ul>` : ""}`).join("\n");
    customSectionsHtml = `<h2>Additional Information</h2>\n${sections}`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}:root{--navy:#1c2b3a;--cream:#f7f3ea;--gold:#a8823c;--ink:#2a2a28;--rule:#c9bd9e;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,'Times New Roman',serif;background:#e9e5da;color:var(--ink);}.page{width:210mm;min-height:297mm;margin:12px auto;background:var(--cream);box-shadow:0 4px 24px rgba(0,0,0,.25);padding:16mm 18mm;}header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:3px double var(--navy);padding-bottom:12px;margin-bottom:14px;}h1{font-size:30px;letter-spacing:2px;color:var(--navy);font-weight:400;text-transform:uppercase;}.role{font-style:italic;color:var(--gold);font-size:14px;margin-top:4px;}.contact{text-align:right;font-size:11px;line-height:1.9;color:var(--navy);}h2{font-size:13px;letter-spacing:2.5px;text-transform:uppercase;color:var(--navy);border-bottom:1px solid var(--rule);padding-bottom:4px;margin:20px 0 10px;display:flex;align-items:center;gap:10px;}h2::after{content:"";flex:1;height:1px;background:var(--rule);}p,li{font-size:12px;line-height:1.65;color:var(--ink);}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:6px;}li b{color:var(--navy);}.skills-list{list-style:none;margin-left:0;}.job-row{display:flex;justify-content:space-between;align-items:baseline;margin-top:14px;}.job-title{font-size:14px;color:var(--navy);font-weight:bold;}.job-meta{font-size:11px;color:var(--gold);font-style:italic;}.edu-item{margin-bottom:10px;}.edu-title{font-weight:bold;font-size:12.5px;color:var(--navy);display:flex;justify-content:space-between;}.edu-sub{font-size:11px;color:#555;}</style></head><body><div class="page"><header role="banner"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact" aria-label="Contact information">${contact.map(esc).join("<br>\n")}</div></header><main role="main" aria-label="CV content">${about ? `<section aria-label="Professional summary">\n<h2>Professional Summary</h2>\n<p>${esc(about)}</p>\n</section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</main></div></body></html>`;
}

function buildMinimalHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="job-header"><div class="job-title">${esc(e.role)} <span class="job-org">— ${esc(e.company)}</span></div><div class="job-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</div></div><ul>${bulletHtml(e.accomplishments || [])}</ul>`).join("\n");
    expHtml = `<section>\n<h2>Experience</h2>\n${items}\n</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu-row"><span>${esc(e.degree)} — ${esc(e.institution)}</span><span>${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-detail">${e.grade && e.grade !== "null" ? "Grade: " + esc(e.grade) : ""}</div>`).join("\n");
    eduHtml = `<section>\n<h2>Education</h2>\n${items}\n</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const tags = Object.values(groups).flat().map((s) => `<span class="skill-tag">${esc(s)}</span>`).join("\n");
    skillsHtml = `<section>\n<h2>Core Skills</h2>\n<div class="skills-wrap">${tags}</div>\n</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? " (" + esc(c.date) + ")" : ""}</li>`).join("\n");
    certHtml = `<section>\n<h2>Certifications</h2>\n<ul>${items}</ul>\n</section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}:root{--ink:#1a1a1a;--grey:#6b6b6b;--accent:#0f766e;--line:#e4e4e0;--paper:#ffffff;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue',Arial,sans-serif;background:#eee;color:var(--ink);}.page{width:210mm;min-height:297mm;margin:12px auto;background:var(--paper);padding:20mm 20mm;box-shadow:0 4px 24px rgba(0,0,0,.2);}h1{font-size:34px;font-weight:300;letter-spacing:1px;}h1 b{font-weight:700;}.role{font-size:13px;color:var(--accent);text-transform:uppercase;letter-spacing:2px;margin-top:6px;font-weight:600;}.contact-bar{display:flex;gap:22px;flex-wrap:wrap;font-size:11px;color:var(--grey);margin-top:14px;padding-top:14px;border-top:1px solid var(--line);}.contact-bar span::before{content:"— ";color:var(--accent);}section{margin-top:26px;}h2{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:var(--ink);font-weight:700;margin-bottom:12px;position:relative;padding-left:14px;}h2::before{content:"";position:absolute;left:0;top:2px;width:6px;height:6px;background:var(--accent);}p,li{font-size:12px;line-height:1.7;color:#333;}.job-header{display:flex;justify-content:space-between;align-items:baseline;}.job-title{font-size:15px;font-weight:700;}.job-org{color:var(--accent);font-weight:400;}.job-date{font-size:11px;color:var(--grey);}ul{margin-left:0;list-style:none;}li{padding-left:16px;position:relative;margin-bottom:7px;}li::before{content:"\\203A";position:absolute;left:0;color:var(--accent);font-weight:700;}li b{font-weight:600;}.edu-row{display:flex;justify-content:space-between;font-size:12.5px;font-weight:600;}.edu-detail{font-size:11px;color:var(--grey);margin-bottom:10px;}.skills-wrap{display:flex;flex-wrap:wrap;gap:7px;margin-top:4px;}.skill-tag{font-size:10.5px;padding:4px 10px;border:1px solid var(--line);border-radius:20px;color:#444;}</style></head><body><div class="page"><header role="banner"><h1>${esc(p.name.split(" ").slice(0, 1).join(" "))} <b>${esc(p.name.split(" ").slice(1).join(" "))}</b></h1><div class="role">${esc(p.title)}</div><div class="contact-bar" aria-label="Contact information">${contact.map((c) => `<span>${esc(c)}</span>`).join("\n    ")}</div></header><main role="main" aria-label="CV content">${about ? `<section aria-label="Professional summary">\n<h2>Summary</h2>\n<p>${esc(about)}</p>\n</section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</main></div></body></html>`;
}

function buildSidebarHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  const groups = groupByCategory(p.skills || []);
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="job-header"><div class="job-title">${esc(e.role)} <span class="job-org">— ${esc(e.company)}</span></div><div class="job-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</div></div><div class="job-loc">${esc(e.company)}</div><ul>${bulletHtml(e.accomplishments || [])}</ul>`).join("\n");
    expHtml = `<section>\n<h2>Experience</h2>\n${items}\n</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu-item"><div class="edu-title"><span>${esc(e.degree)} — ${esc(e.institution)}</span><span>${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-sub">${e.grade && e.grade !== "null" ? "Grade: " + esc(e.grade) : ""}</div></div>`).join("\n");
    eduHtml = `<section>\n<h2>Education</h2>\n${items}\n</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? " (" + esc(c.date) + ")" : ""}</li>`).join("\n");
    certHtml = `<div class="side-sec"><h3>Certifications</h3><ul class="skill-list">${items}</ul></div>`;
  }
  const sidebarSkills = Object.values(groups).flat().map((s) => `<li>${esc(s)}</li>`).join("\n");
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}:root{--side-bg:#182634;--side-ink:#dfe6ec;--accent:#e0a458;--main-ink:#232323;--grey:#6d6d6d;--line:#e6e2d8;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',Arial,sans-serif;background:#ddd;color:var(--main-ink);}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;display:grid;grid-template-columns:70mm 1fr;box-shadow:0 4px 24px rgba(0,0,0,.25);}.side{background:var(--side-bg);color:var(--side-ink);padding:14mm 10mm;}.side h1{font-size:23px;font-weight:700;line-height:1.25;color:#fff;}.side .role{font-size:11px;color:var(--accent);margin-top:6px;text-transform:uppercase;letter-spacing:1px;font-weight:600;}.side-sec{margin-top:26px;}.side-sec h3{font-size:10.5px;text-transform:uppercase;letter-spacing:2px;color:var(--accent);border-bottom:1px solid rgba(255,255,255,.2);padding-bottom:6px;margin-bottom:10px;}.side-sec p,.side-sec li{font-size:10.7px;line-height:1.8;color:var(--side-ink);}.side-sec ul{list-style:none;}.contact-item{display:flex;gap:6px;margin-bottom:8px;font-size:10.5px;word-break:break-word;}.contact-item .lbl{color:var(--accent);flex-shrink:0;font-weight:700;}.skill-list li{margin-bottom:5px;padding-left:10px;position:relative;}.skill-list li::before{content:"\\2022";position:absolute;left:0;color:var(--accent);}.main{padding:14mm 13mm;}.main h2{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:var(--side-bg);border-bottom:2px solid var(--accent);display:inline-block;padding-bottom:4px;margin-bottom:12px;}.main section{margin-bottom:22px;}.main p,.main li{font-size:12px;line-height:1.65;color:#333;}.job-header{display:flex;justify-content:space-between;align-items:baseline;}.job-title{font-size:14.5px;font-weight:700;color:var(--side-bg);}.job-org{color:var(--accent);font-weight:600;}.job-date{font-size:10.8px;color:var(--grey);background:#f2ece0;padding:2px 8px;border-radius:3px;}.job-loc{font-size:11px;color:var(--grey);font-style:italic;margin-bottom:6px;}ul{margin-left:16px;}li{margin-bottom:6px;}li b{color:var(--side-bg);}.edu-item{margin-bottom:10px;}.edu-title{display:flex;justify-content:space-between;font-weight:700;font-size:12.5px;color:var(--side-bg);}.edu-sub{font-size:11px;color:var(--grey);}</style></head><body><div class="page"><aside class="side" role="complementary" aria-label="Contact and skills sidebar"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-sec" role="contentinfo"><h3>Contact</h3>${contact.map((c) => `<div class="contact-item"><span class="lbl">${esc(c === p.location ? "Loc" : c === p.phone ? "Tel" : "Mail")}</span><span>${esc(c)}</span></div>`).join("\n      ")}</div><div class="side-sec"><h3>Core Skills</h3><ul class="skill-list" aria-label="Core skills">${sidebarSkills || "<li>No skills listed</li>"}</ul></div>${certHtml}</aside><main class="main" role="main" aria-label="Professional profile">${about ? `<section>\n<h2>Profile</h2>\n<p>${esc(about)}</p>\n</section>` : ""}${expHtml}${eduHtml}</main></div></body></html>`;
}

// ─── DOCX GENERATION ──────────────────────────────────────────────────────

const COLORS = {
  executive:    { heading: "1C2B3A", accent: "A8823C", text: "2A2A28", rule: "C9BD9E" },
  minimal:      { heading: "1A1A1A", accent: "0F766E", text: "333333", rule: "E4E4E0" },
  sidebar:      { heading: "182634", accent: "E0A458", text: "333333", rule: "6D6D6D" },
  simplified:   { heading: "222222", accent: "222222", text: "333333", rule: "CCCCCC" },
  modern:       { heading: "0F172A", accent: "6D28D9", text: "334155", rule: "E2E8F0" },
  creative:     { heading: "1E293B", accent: "E11D48", text: "334155", rule: "CBD5E1" },
  minimalist:   { heading: "18181B", accent: "2563EB", text: "3F3F46", rule: "E4E4E7" },
  freshgraduate:{ heading: "111827", accent: "059669", text: "374151", rule: "D1D5DB" },
  techportfolio:{ heading: "0C0A09", accent: "2563EB", text: "44403C", rule: "E7E5E4" },
  functional:   { heading: "1E1B4B", accent: "7C3AED", text: "374151", rule: "DDD6FE" },
  combination:  { heading: "172554", accent: "0284C7", text: "334155", rule: "BAE6FD" },
  academic:     { heading: "1C1917", accent: "B45309", text: "44403C", rule: "D6D3D1" },
  timeline:     { heading: "1F2937", accent: "DC2626", text: "374151", rule: "FCA5A5" },
  twocol:       { heading: "0F172A", accent: "0EA5E9", text: "334155", rule: "BAE6FD" },
  infographic:  { heading: "1E1B4B", accent: "F59E0B", text: "374151", rule: "FDE68A" },
  darkmode:     { heading: "F8FAFC", accent: "22D3EE", text: "CBD5E1", rule: "334155" },
  corporate:    { heading: "111827", accent: "1D4ED8", text: "374151", rule: "BFDBFE" },
  millennial:   { heading: "1E1B4B", accent: "EC4899", text: "374151", rule: "FBCFE8" },
  ivy:          { heading: "1C1917", accent: "7C2D12", text: "44403C", rule: "FED7AA" },
  everest:      { heading: "18181B", accent: "0D9488", text: "3F3F46", rule: "99F6E4" },
  quick:        { heading: "FFFFFF", accent: "4338CA", text: "E2E8F0", rule: "4338CA" },
  photo:        { heading: "1E293B", accent: "7C3AED", text: "334155", rule: "C4B5FD" },
  cleanelegant: { heading: "1F2937", accent: "475569", text: "334155", rule: "CBD5E1" },
  modernbasic:  { heading: "111827", accent: "2563EB", text: "374151", rule: "DBEAFE" },
  harvard:      { heading: "A51C30", accent: "A51C30", text: "333333", rule: "F5C6CB" },
  europass:     { heading: "003399", accent: "003399", text: "333333", rule: "CCD5E0" },
  metro:        { heading: "0F172A", accent: "06B6D4", text: "334155", rule: "A5F3FC" },
  creativebeige:{ heading: "44403C", accent: "D97706", text: "44403C", rule: "FDE68A" },
  corporateats: { heading: "1E293B", accent: "1E40AF", text: "334155", rule: "BFDBFE" },
  boldgraphic:  { heading: "1F2937", accent: "DC2626", text: "374151", rule: "FCA5A5" },
  scienceeng:   { heading: "14532D", accent: "16A34A", text: "374151", rule: "BBF7D0" },
  calligraphic: { heading: "292524", accent: "92400E", text: "44403C", rule: "D6D3D1" },
  elegant:      { heading: "B8860B", accent: "D4A843", text: "333333", rule: "D4A843" },
  gradient:     { heading: "1E1B4B", accent: "7C3AED", text: "334155", rule: "C4B5FD" },
  retro:        { heading: "78350F", accent: "B45309", text: "374151", rule: "FDE68A" },
  conservative: { heading: "1E3A5F", accent: "1E3A5F", text: "333333", rule: "93C5FD" },
  artistic:     { heading: "831843", accent: "BE185D", text: "374151", rule: "FBCFE8" },
  ultraminimal: { heading: "000000", accent: "000000", text: "525252", rule: "E5E5E5" },
  techstack:    { heading: "022C22", accent: "059669", text: "374151", rule: "A7F3D0" },
  businesspro:  { heading: "1E3A5F", accent: "1E40AF", text: "334155", rule: "BFDBFE" },
  academiccv:   { heading: "1C1917", accent: "854D0E", text: "44403C", rule: "D6D3D1" },
  mosaic:       { heading: "3B0764", accent: "7E22CE", text: "374151", rule: "E9D5FF" },
  brutalist:    { heading: "171717", accent: "171717", text: "404040", rule: "000000" },
  watercolor:   { heading: "3B0764", accent: "7C3AED", text: "44403C", rule: "DDD6FE" },
  neon:         { heading: "FAFAFA", accent: "FF00FF", text: "E4E4E7", rule: "A855F7" },
  vintage:      { heading: "451A03", accent: "92400E", text: "44403C", rule: "D6D3D1" },
  geometric:    { heading: "164E63", accent: "0891B2", text: "334155", rule: "A5F3FC" },
  magazine:     { heading: "1F2937", accent: "DC2626", text: "374151", rule: "FCA5A5" },
  monochrome:   { heading: "18181B", accent: "18181B", text: "525252", rule: "E4E4E7" },
  copper:       { heading: "451A03", accent: "B45309", text: "44403C", rule: "FDE68A" },
  forest:       { heading: "14532D", accent: "166534", text: "374151", rule: "BBF7D0" },
  royal:        { heading: "3B0764", accent: "581C87", text: "374151", rule: "DDD6FE" },
  futuristic:   { heading: "0E7490", accent: "06B6D4", text: "334155", rule: "A5F3FC" },
  handwritten:  { heading: "451A03", accent: "78350F", text: "44403C", rule: "D6D3D1" },
  zen:          { heading: "134E4A", accent: "0F766E", text: "374151", rule: "99F6E4" },
  pop:          { heading: "1F2937", accent: "E11D48", text: "374151", rule: "FECDD3" },
  carbon:       { heading: "F5F5F4", accent: "525252", text: "A3A3A3", rule: "404040" },
  pearl:        { heading: "292524", accent: "78716C", text: "44403C", rule: "D6D3D1" },
  sunset:       { heading: "431407", accent: "EA580C", text: "374151", rule: "FED7AA" },
  arctic:       { heading: "0C4A6E", accent: "0EA5E9", text: "334155", rule: "BAE6FD" },
  terracotta:   { heading: "431407", accent: "C2410C", text: "44403C", rule: "FED7AA" },
  indigo:       { heading: "1E1B4B", accent: "3730A3", text: "374151", rule: "C7D2FE" },
} as const;

function sectionHeading(title: string, color: string): Paragraph {
  return new Paragraph({
    heading: HeadingLevel.HEADING_2,
    spacing: { before: 300, after: 120 },
    children: [
      new TextRun({ text: title, bold: true, size: 22, font: "Calibri", color }),
    ],
    border: { bottom: { color, space: 4, style: BorderStyle.SINGLE, size: 6 } },
  });
}

function bodyText(text: string, opts?: { bold?: boolean; color?: string; size?: number }): Paragraph {
  return new Paragraph({
    spacing: { after: 80 },
    children: [
      new TextRun({ text, size: opts?.size ?? 21, font: "Calibri", color: opts?.color ?? "333333", bold: opts?.bold }),
    ],
  });
}

function bulletPoint(text: string, color: string): Paragraph {
  return new Paragraph({
    bullet: { level: 0 },
    spacing: { after: 40 },
    children: [new TextRun({ text, size: 20, font: "Calibri", color: "333333" })],
  });
}

function jobParagraph(role: string, company: string, dates: string, color: string, accent: string): Paragraph {
  return new Paragraph({
    spacing: { before: 200, after: 60 },
    children: [
      new TextRun({ text: role, bold: true, size: 22, font: "Calibri", color }),
      new TextRun({ text: " — ", size: 22, font: "Calibri", color: "999999" }),
      new TextRun({ text: company, size: 22, font: "Calibri", color: accent }),
      new TextRun({ text: `    ${dates}`, size: 18, font: "Calibri", color: "888888", italics: true }),
    ],
  });
}

function contactLine(p: PortfolioData, color: string): Paragraph {
  const parts = contactParts(p);
  return new Paragraph({
    spacing: { after: 60 },
    children: parts.map((c, i) =>
      new TextRun({ text: c + (i < parts.length - 1 ? "  |  " : ""), size: 18, font: "Calibri", color }),
    ),
  });
}

function buildExecutiveDocx(p: PortfolioData): Document {
  const c = COLORS.executive;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 36, font: "Georgia", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title, italics: true, size: 22, font: "Georgia", color: c.accent })],
  }));
  children.push(contactLine(p, c.heading));

  if (p.about) {
    children.push(sectionHeading("Professional Summary", c.heading));
    children.push(bodyText(stripHtml(p.about), { color: c.text }));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Professional Experience", c.heading));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.heading));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "888888", italics: true }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` | Grade: ${e.grade}` : ""), { size: 20, color: "666666" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Core Competencies", c.heading));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: names.join(" · "), size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications & Qualifications", c.heading));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

function buildMinimalDocx(p: PortfolioData): Document {
  const c = COLORS.minimal;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, size: 36, font: "Calibri Light", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 18, font: "Calibri", color: c.accent, characterSpacing: 80 })],
  }));
  children.push(contactLine(p, c.accent));

  if (p.about) {
    children.push(sectionHeading("Summary", c.heading));
    children.push(bodyText(stripHtml(p.about)));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.heading));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.heading));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} — ${e.institution}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "999999" }),
        ],
      }));
      if (e.grade && e.grade !== "null") children.push(bodyText(`Grade: ${e.grade}`, { size: 18, color: "999999" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Core Skills", c.heading));
    children.push(bodyText(Object.values(groups).flat().join("  ·  "), { color: c.text }));
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.heading));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

function buildSidebarDocx(p: PortfolioData): Document {
  const c = COLORS.sidebar;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Calibri", color: "FFFFFF" })],
  }));
  children.push(new Paragraph({
    spacing: { after: 100 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Calibri", color: c.accent, characterSpacing: 60 })],
  }));

  children.push(sectionHeading("Contact", c.accent));
  for (const part of contactParts(p)) {
    children.push(bodyText(part, { size: 18, color: "555555" }));
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Core Skills", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 19, font: "Calibri", color: c.accent }),
          new TextRun({ text: names.join(", "), size: 19, font: "Calibri", color: "444444" }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 19, font: "Calibri", color: c.accent }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 19, font: "Calibri", color: "444444" }),
        ],
      }));
    }
  }

  children.push(new Paragraph({ children: [] }));
  children.push(sectionHeading("Profile", c.heading));
  if (p.about) children.push(bodyText(stripHtml(p.about)));

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.heading));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.heading));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} — ${e.institution}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "888888", italics: true }),
        ],
      }));
      if (e.grade && e.grade !== "null") children.push(bodyText(`Grade: ${e.grade}`, { size: 18, color: "999999" }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── SIMPLIFIED CLEAN TEMPLATE ─────────────────────────────────────────────
function buildSimplifiedHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="job-header"><div class="job-title">${esc(e.role)} <span class="job-org">— ${esc(e.company)}</span></div><div class="job-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</div></div><ul>${bulletHtml(e.accomplishments || [])}</ul>`).join("\n");
    expHtml = `<section>\n<h2>Professional Experience</h2>\n${items}\n</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu-row"><span>${esc(e.degree)} — ${esc(e.institution)}</span><span>${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-sub">${e.grade && e.grade !== "null" ? "Grade: " + esc(e.grade) : ""}</div>`).join("\n");
    eduHtml = `<section>\n<h2>Education</h2>\n${items}\n</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div><span class="comp-h">${esc(cat)}:</span> ${names.map(esc).join(", ")}</div>`).join("\n");
    skillsHtml = `<section>\n<h2>Core Competencies</h2>\n<div class="comp-grid">${items}</div>\n</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const cols = p.certifications.map((c) => `<p>${esc(c.name)}${c.issuer ? " — " + esc(c.issuer) : ""}${c.date && c.date !== "null" ? " (" + esc(c.date) + ")" : ""}</p>`).join("\n");
    certHtml = `<section>\n<h2>Certifications &amp; Qualifications</h2>\n<div class="grid2">${cols}</div>\n</section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width, initial-scale=1.0"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}:root{--ink:#222;--grey:#666;--rule:#ccc;--paper:#fff;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Arial,Helvetica,sans-serif;background:#e5e5e5;color:var(--ink);}.page{width:210mm;min-height:297mm;margin:12px auto;background:var(--paper);padding:18mm 20mm;box-shadow:0 2px 12px rgba(0,0,0,.15);}header{text-align:center;padding-bottom:12px;border-bottom:2px solid var(--ink);}h1{font-size:26px;font-weight:700;letter-spacing:.5px;}.role{font-size:12.5px;color:var(--grey);margin-top:4px;}.contact-line{font-size:11px;color:var(--grey);margin-top:8px;}.contact-line span{margin:0 8px;}h2{font-size:12.5px;text-transform:uppercase;letter-spacing:1.5px;font-weight:700;margin:20px 0 8px;border-bottom:1px solid var(--rule);padding-bottom:4px;}section{margin-bottom:4px;}p,li{font-size:12px;line-height:1.6;color:#333;}.job-header{display:flex;justify-content:space-between;align-items:baseline;}.job-title{font-size:13.5px;font-weight:700;}.job-org{font-weight:400;}.job-date{font-size:11px;color:var(--grey);}ul{margin-left:18px;margin-top:4px;}li{margin-bottom:5px;}.grid2{display:grid;grid-template-columns:1fr 1fr;gap:0 30px;}.edu-row{display:flex;justify-content:space-between;font-weight:700;font-size:12.5px;}.edu-sub{font-size:11px;color:var(--grey);margin-bottom:8px;}.comp-grid{display:grid;grid-template-columns:repeat(2,1fr);gap:6px 30px;font-size:12px;}.comp-h{font-weight:700;}</style></head><body><div class="page"><header role="banner"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact-line" aria-label="Contact information">${contact.map((c) => `<span>${esc(c)}</span>`).join("<span aria-hidden=\"true\">|</span>")}</div></header><main role="main" aria-label="CV content">${about ? `<section aria-label="Professional summary">\n<h2>Professional Summary</h2>\n<p>${esc(about)}</p>\n</section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</main></div></body></html>`;
}

// ─── MODERN TEMPLATE (Dark header, purple accent, clean body) ───────────────
function buildModernHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="job"><div class="job-head"><div><span class="job-title">${esc(e.role)}</span><span class="job-sep"> · </span><span class="job-company">${esc(e.company)}</span></div><span class="job-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p class="job-desc">${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu"><div class="edu-head"><span class="edu-degree">${esc(e.degree)} in ${esc(e.field)}</span><span class="edu-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-school">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const tags = Object.entries(groups).map(([cat, names]) => `<div class="skill-group"><span class="skill-cat">${esc(cat)}</span><span class="skill-names">${names.map(esc).join(" · ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${tags}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter','Segoe UI',system-ui,sans-serif;background:#f1f5f9;color:#1e293b;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);overflow:hidden;}.header{background:linear-gradient(135deg,#0f172a 0%,#1e1b4b 50%,#6D28D9 100%);color:#fff;padding:28mm 24mm 20mm;position:relative;}.header::after{content:"";position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#6D28D9,#a78bfa,#6D28D9);}h1{font-size:32px;font-weight:800;letter-spacing:-0.5px;}.role{font-size:14px;color:#a78bfa;margin-top:6px;font-weight:500;}.contact-bar{display:flex;gap:20px;flex-wrap:wrap;font-size:11px;color:#94a3b8;margin-top:14px;}.contact-bar span{padding:3px 10px;border:1px solid rgba(255,255,255,.15);border-radius:20px;font-size:10.5px;}.body{padding:20mm 24mm;}section{margin-bottom:22px;}h2{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#6D28D9;font-weight:700;margin-bottom:12px;padding-bottom:6px;border-bottom:2px solid #6D28D9;display:inline-block;}p,li{font-size:12px;line-height:1.7;color:#334155;}.job{margin-bottom:16px;}.job-head{display:flex;justify-content:space-between;align-items:baseline;}.job-title{font-weight:700;color:#0f172a;font-size:13.5px;}.job-company{color:#6D28D9;font-weight:500;}.job-sep{color:#cbd5e1;}.job-date{font-size:11px;color:#94a3b8;font-style:italic;}.job-desc{margin:4px 0 6px;font-size:11.5px;color:#64748b;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#6D28D9;}.edu{margin-bottom:12px;}.edu-head{display:flex;justify-content:space-between;font-size:12.5px;}.edu-degree{font-weight:700;color:#0f172a;}.edu-date{font-size:11px;color:#94a3b8;}.edu-school{font-size:11.5px;color:#64748b;margin-top:2px;}.skill-group{margin-bottom:6px;font-size:12px;}.skill-cat{font-weight:700;color:#0f172a;margin-right:6px;}.skill-names{color:#64748b;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact-bar">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><h2>Profile</h2><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── CREATIVE TEMPLATE (Bold rose accent, unique layout with accent bars) ───
function buildCreativeHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="entry"><div class="entry-bar"></div><div class="entry-body"><div class="entry-head"><div><span class="entry-title">${esc(e.role)}</span><span class="entry-sub">${esc(e.company)}</span></div><span class="entry-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div></div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="entry"><div class="entry-bar"></div><div class="entry-body"><div class="entry-head"><div><span class="entry-title">${esc(e.degree)} in ${esc(e.field)}</span><span class="entry-sub">${esc(e.institution)}</span></div><span class="entry-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.grade && e.grade !== "null" ? `<p class="grade">Grade: ${esc(e.grade)}</p>` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const tags = Object.entries(groups).map(([cat, names]) => `<div class="skill-group"><div class="skill-cat">${esc(cat)}</div><div class="skill-pills">${names.map((n) => `<span class="pill">${esc(n)}</span>`).join("")}</div></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${tags}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<div class="cert-item"><span class="cert-dot"></span><div><b>${esc(c.name)}</b><span class="cert-issuer"> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</span></div></div>`).join("\n");
    certHtml = `<section><h2>Certifications</h2>${items}</section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans','Segoe UI',system-ui,sans-serif;background:#fef2f2;color:#1e293b;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.1);overflow:hidden;display:grid;grid-template-columns:1fr 260px;}.main{padding:24mm 24mm 20mm 28mm;}.side{background:#1e293b;color:#e2e8f0;padding:28mm 18mm 20mm;position:relative;}.side::before{content:"";position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,#E11D48,#fb7185);}.side h1{font-size:22px;font-weight:800;color:#fff;line-height:1.3;}.side .role{font-size:12px;color:#fb7185;margin-top:8px;font-weight:600;text-transform:uppercase;letter-spacing:1px;}.side-section{margin-top:28px;}.side-section h3{font-size:10px;text-transform:uppercase;letter-spacing:2px;color:#fb7185;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,255,255,.1);}.side-section p,.side-section li{font-size:10.5px;line-height:1.7;color:#cbd5e1;}.side-section ul{list-style:none;}.contact-item{display:flex;gap:8px;margin-bottom:10px;font-size:10.5px;color:#cbd5e1;}.contact-lbl{color:#fb7185;font-weight:700;flex-shrink:0;}main h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#E11D48;font-weight:700;margin-bottom:14px;display:flex;align-items:center;gap:10px;}main h2::after{content:"";flex:1;height:2px;background:linear-gradient(90deg,#E11D48,transparent);}section{margin-bottom:24px;}.entry{display:flex;gap:12px;margin-bottom:16px;}.entry-bar{width:3px;background:linear-gradient(180deg,#E11D48,#fecdd3);border-radius:3px;flex-shrink:0;margin-top:4px;}.entry-body{flex:1;}.entry-head{display:flex;justify-content:space-between;align-items:baseline;}.entry-title{font-weight:700;color:#1e293b;font-size:13px;}.entry-sub{color:#E11D48;font-weight:500;margin-left:6px;font-size:12.5px;}.entry-date{font-size:10.5px;color:#94a3b8;font-style:italic;}p,li{font-size:12px;line-height:1.65;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#E11D48;}.grade{font-size:11px;color:#94a3b8;margin-top:4px;}.skill-group{margin-bottom:12px;}.skill-cat{font-size:11px;font-weight:700;color:#1e293b;margin-bottom:6px;}.skill-pills{display:flex;flex-wrap:wrap;gap:6px;}.pill{font-size:10px;padding:3px 10px;background:#fef2f2;border:1px solid #fecdd3;border-radius:16px;color:#E11D48;font-weight:500;}.cert-item{display:flex;align-items:flex-start;gap:8px;margin-bottom:8px;font-size:12px;}.cert-dot{width:6px;height:6px;background:#E11D48;border-radius:50%;flex-shrink:0;margin-top:6px;}.cert-issuer{color:#64748b;}</style></head><body><div class="page"><div class="main"><h1 style="font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#64748b;margin-bottom:4px;">${esc(p.title)}</h1>${about ? `<section><h2>Profile</h2><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div><div class="side"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-section"><h3>Contact</h3>${contact.map((c) => `<div class="contact-item"><span class="contact-lbl">›</span><span>${esc(c)}</span></div>`).join("")}</div></div></div></body></html>`;
}

// ─── MINIMALIST TEMPLATE (Ultra-clean, blue accent, lots of whitespace) ─────
function buildMinimalistHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="exp-row"><span class="exp-role">${esc(e.role)}</span><span class="exp-dates">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="exp-company">${esc(e.company)}</div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="exp-row"><span class="exp-role">${esc(e.degree)} in ${esc(e.field)}</span><span class="exp-dates">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="exp-company">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="skill-row"><span class="skill-cat">${esc(cat)}</span><span class="skill-list">${names.map(esc).join(", ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<div class="cert"><span class="cert-name">${esc(c.name)}</span><span class="cert-detail">${esc(c.issuer)}${c.date && c.date !== "null" ? ` · ${esc(c.date)}` : ""}</span></div>`).join("\n");
    certHtml = `<section><h2>Certifications</h2>${items}</section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue','Inter',sans-serif;background:#f8fafc;color:#18181b;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.08);padding:30mm 28mm;}.topline{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:16px;border-bottom:3px solid #18181b;margin-bottom:24px;}h1{font-size:36px;font-weight:200;letter-spacing:-1px;color:#18181b;}.contact{font-size:11px;color:#71717a;text-align:right;line-height:1.8;}.contact div{display:inline;}.contact div::after{content:" · ";color:#d4d4d8;}.contact div:last-child::after{content:"";}.role{font-size:13px;color:#2563EB;font-weight:600;letter-spacing:1px;text-transform:uppercase;margin-top:8px;}section{margin-top:28px;}h2{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#71717a;font-weight:600;margin-bottom:14px;}.exp{margin-bottom:18px;}.exp-row{display:flex;justify-content:space-between;align-items:baseline;}.exp-role{font-size:14px;font-weight:700;color:#18181b;}.exp-dates{font-size:11px;color:#a1a1aa;font-variant-numeric:tabular-nums;}.exp-company{font-size:12px;color:#2563EB;margin-top:2px;margin-bottom:4px;}p,li{font-size:12px;line-height:1.7;color:#3f3f46;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#2563EB;}.skill-row{display:flex;gap:12px;margin-bottom:8px;font-size:12px;}.skill-cat{font-weight:700;color:#18181b;flex-shrink:0;min-width:140px;}.skill-list{color:#71717a;}.cert{margin-bottom:8px;font-size:12px;}.cert-name{font-weight:600;color:#18181b;}.cert-detail{color:#71717a;margin-left:8px;}</style></head><body><div class="page"><div class="topline"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── FRESH GRADUATE TEMPLATE (Education-first, ATS-optimized, single-column) ──
function buildFreshGraduateHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu"><div class="edu-head"><span class="edu-degree">${esc(e.degree)} in ${esc(e.field)}</span><span class="edu-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-school">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · GPA: ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(e.role)}</span><span class="exp-sep"> — </span><span class="exp-company">${esc(e.company)}</span></div><span class="exp-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p class="exp-desc">${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="skill-group"><span class="skill-cat">${esc(cat)}</span><span class="skill-list">${names.map(esc).join(", ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Calibri','Segoe UI',sans-serif;background:#f0fdf4;color:#111827;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:24mm 22mm;}.header{border-bottom:3px solid #059669;padding-bottom:14px;margin-bottom:20px;}h1{font-size:28px;font-weight:700;color:#111827;}.role{font-size:13px;color:#059669;font-weight:600;margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:11px;color:#6B7280;margin-top:10px;}.contact span{display:inline-flex;align-items:center;gap:4px;}section{margin-top:22px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#059669;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #D1D5DB;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#059669;}.edu{margin-bottom:14px;}.edu-head{display:flex;justify-content:space-between;font-size:13px;}.edu-degree{font-weight:700;color:#111827;}.edu-date{font-size:11px;color:#9CA3AF;font-style:italic;}.edu-school{font-size:12px;color:#6B7280;margin-top:2px;}.exp{margin-bottom:16px;}.exp-head{display:flex;justify-content:space-between;align-items:baseline;}.exp-role{font-weight:700;color:#111827;font-size:13px;}.exp-company{color:#059669;font-weight:500;}.exp-sep{color:#D1D5DB;}.exp-date{font-size:11px;color:#9CA3AF;}.exp-desc{margin:4px 0 6px;font-size:11.5px;color:#6B7280;}.skill-group{margin-bottom:6px;font-size:12px;}.skill-cat{font-weight:700;color:#111827;margin-right:6px;}.skill-list{color:#374151;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${eduHtml}${about ? `<section><h2>Professional Summary</h2><p>${esc(about)}</p></section>` : ""}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── TECH PORTFOLIO TEMPLATE (Skills + Projects first, GitHub-ready) ──────
function buildTechPortfolioHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="skill-group"><div class="skill-cat">${esc(cat)}</div><div class="skill-tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n");
    skillsHtml = `<section><h2>Technical Skills</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(e.role)}</span><span class="exp-at"> @ </span><span class="exp-company">${esc(e.company)}</span></div><span class="exp-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu"><span class="edu-degree">${esc(e.degree)} in ${esc(e.field)}</span><span class="edu-school">${esc(e.institution)}</span><span class="edu-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'JetBrains Mono','Fira Code','Consolas',monospace;background:#f5f5f4;color:#1c1917;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);overflow:hidden;display:grid;grid-template-columns:1fr 240px;}.main{padding:24mm 20mm 20mm 24mm;}.side{background:#0C0A09;color:#e7e5e4;padding:28mm 16mm 20mm;position:relative;}.side::before{content:"";position:absolute;top:0;left:0;width:4px;height:100%;background:linear-gradient(180deg,#2563EB,#60A5FA);}.side h1{font-size:20px;font-weight:700;color:#fff;font-family:'JetBrains Mono',monospace;}.side .role{font-size:11px;color:#60A5FA;margin-top:6px;font-weight:500;}.side-contact{margin-top:20px;}.side-contact div{font-size:10px;color:#a8a29e;margin-bottom:8px;display:flex;align-items:center;gap:6px;}.side-contact .lbl{color:#60A5FA;font-weight:700;min-width:40px;text-transform:uppercase;font-size:9px;letter-spacing:1px;}.side-section{margin-top:24px;}.side-section h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#60A5FA;margin-bottom:8px;padding-bottom:4px;border-bottom:1px solid rgba(255,255,255,.08);}.side-section p,.side-section li{font-size:10px;line-height:1.6;color:#d6d3d1;}main h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#2563EB;font-weight:700;margin-bottom:12px;display:flex;align-items:center;gap:8px;}main h2::before{content:"$";color:#2563EB;font-weight:700;font-size:14px;}section{margin-top:22px;}.tag{display:inline-block;font-size:9.5px;padding:3px 8px;background:#EFF6FF;border:1px solid #BFDBFE;border-radius:4px;color:#2563EB;margin:2px 4px 2px 0;font-weight:500;}.skill-group{margin-bottom:10px;}.skill-cat{font-size:10px;font-weight:700;color:#1c1917;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;}.skill-tags{display:flex;flex-wrap:wrap;gap:4px;}p,li{font-size:11.5px;line-height:1.65;color:#44403C;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#2563EB;}.exp{margin-bottom:14px;}.exp-head{display:flex;justify-content:space-between;align-items:baseline;}.exp-role{font-weight:700;color:#1c1917;font-size:12.5px;}.exp-at{color:#a8a29e;}.exp-company{color:#2563EB;font-weight:500;}.exp-date{font-size:10px;color:#a8a29e;font-style:italic;}.edu{margin-bottom:10px;font-size:11.5px;display:flex;flex-wrap:wrap;gap:6px;align-items:baseline;}.edu-degree{font-weight:700;color:#1c1917;}.edu-school{color:#2563EB;font-size:11px;}.edu-date{font-size:10px;color:#a8a29e;}</style></head><body><div class="page"><div class="main">${about ? `<section><p>${esc(about)}</p></section>` : ""}${skillsHtml}${expHtml}${eduHtml}${certHtml}</div><div class="side"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-contact">${contact.map((c) => `<div><span class="lbl">›</span><span>${esc(c)}</span></div>`).join("")}</div></div></div></body></html>`;
}

// ─── FUNCTIONAL TEMPLATE (Skills-first, no experience needed) ──────────────
function buildFunctionalHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="skill-block"><div class="skill-cat">${esc(cat)}</div><ul>${names.map((n) => `<li>${esc(n)}</li>`).join("")}</ul></div>`).join("\n");
    skillsHtml = `<section class="skills-section"><h2>Core Competencies</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu"><div class="edu-head"><span class="edu-degree">${esc(e.degree)} in ${esc(e.field)}</span><span class="edu-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-school">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="exp-head"><span class="exp-role">${esc(e.role)}</span><span class="exp-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="exp-company">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Relevant Experience</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Georgia','Times New Roman',serif;background:#f5f3ff;color:#1e1b4b;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:26mm 22mm;}.header{text-align:center;padding-bottom:18px;border-bottom:3px double #7C3AED;margin-bottom:22px;}h1{font-size:30px;font-weight:400;color:#1e1b4b;letter-spacing:2px;}.role{font-size:12px;color:#7C3AED;text-transform:uppercase;letter-spacing:3px;margin-top:6px;font-weight:600;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:11px;color:#6B7280;margin-top:12px;}.contact span{padding:3px 12px;border:1px solid #DDD6FE;border-radius:16px;font-size:10px;}section{margin-top:24px;}h2{font-size:12px;letter-spacing:2.5px;text-transform:uppercase;color:#7C3AED;font-weight:700;margin-bottom:12px;text-align:center;padding-bottom:6px;border-bottom:1px solid #DDD6FE;}p,li{font-size:12px;line-height:1.7;color:#374151;}.skills-section{background:#FAF5FF;padding:16px;border-radius:8px;border:1px solid #EDE9FE;}.skill-block{margin-bottom:12px;}.skill-cat{font-size:11px;font-weight:700;color:#1e1b4b;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;}.skill-block ul{list-style:none;margin:0;padding:0;}.skill-block li{display:inline-block;font-size:11px;padding:3px 10px;margin:2px 4px 2px 0;background:#EDE9FE;color:#7C3AED;border-radius:14px;font-weight:500;}.edu{margin-bottom:14px;}.edu-head{display:flex;justify-content:space-between;font-size:13px;}.edu-degree{font-weight:700;color:#1e1b4b;}.edu-date{font-size:11px;color:#9CA3AF;font-style:italic;}.edu-school{font-size:12px;color:#6B7280;margin-top:2px;}.exp{margin-bottom:14px;}.exp-head{display:flex;justify-content:space-between;align-items:baseline;}.exp-role{font-weight:700;color:#1e1b4b;font-size:13px;}.exp-date{font-size:11px;color:#9CA3AF;}.exp-company{font-size:12px;color:#7C3AED;margin-bottom:4px;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#7C3AED;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${skillsHtml}${eduHtml}${expHtml}${certHtml}</div></body></html>`;
}

// ─── COMBINATION TEMPLATE (Skills + Chronological hybrid) ──────────────────
function buildCombinationHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="skill-row"><span class="skill-cat">${esc(cat)}</span><span class="skill-items">${names.map(esc).join(" · ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills Summary</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(e.role)}</span><span class="exp-sep"> | </span><span class="exp-company">${esc(e.company)}</span></div><span class="exp-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Professional Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu"><div class="edu-head"><span class="edu-degree">${esc(e.degree)} in ${esc(e.field)}</span><span class="edu-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-school">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI','Helvetica Neue',sans-serif;background:#f0f9ff;color:#172554;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);padding:24mm 22mm;}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:3px solid #0284C7;margin-bottom:20px;}.header-left h1{font-size:28px;font-weight:700;color:#172554;}.header-left .role{font-size:12px;color:#0284C7;font-weight:600;text-transform:uppercase;letter-spacing:2px;margin-top:4px;}.header-right{font-size:10px;color:#64748B;text-align:right;line-height:1.8;}.header-right div{display:inline;}.header-right div::after{ content:" | ";color:#BAE6FD;}.header-right div:last-child::after{content:"";}section{margin-top:22px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0284C7;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #BAE6FD;}p,li{font-size:12px;line-height:1.7;color:#334155;}.skill-row{display:flex;gap:10px;margin-bottom:6px;font-size:12px;}.skill-cat{font-weight:700;color:#172554;min-width:120px;flex-shrink:0;}.skill-items{color:#64748B;}.edu{margin-bottom:14px;}.edu-head{display:flex;justify-content:space-between;font-size:13px;}.edu-degree{font-weight:700;color:#172554;}.edu-date{font-size:11px;color:#94A3B8;font-style:italic;}.edu-school{font-size:12px;color:#64748B;margin-top:2px;}.exp{margin-bottom:16px;}.exp-head{display:flex;justify-content:space-between;align-items:baseline;}.exp-role{font-weight:700;color:#172554;font-size:13px;}.exp-sep{color:#BAE6FD;}.exp-company{color:#0284C7;font-weight:500;}.exp-date{font-size:11px;color:#94A3B8;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#0284C7;}</style></head><body><div class="page"><div class="header"><div class="header-left"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="header-right">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${skillsHtml}${expHtml}${eduHtml}${certHtml}</div></body></html>`;
}

// ─── ACADEMIC TEMPLATE (Publications, GPA, coursework, research) ───────────
function buildAcademicHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="edu"><div class="edu-head"><span class="edu-degree">${esc(e.degree)} in ${esc(e.field)}</span><span class="edu-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="edu-school">${esc(e.institution)}</div>${e.grade && e.grade !== "null" ? `<div class="edu-gpa">GPA: ${esc(e.grade)}</div>` : ""}</div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="exp-head"><div><span class="exp-role">${esc(e.role)}</span><span class="exp-sep"> — </span><span class="exp-company">${esc(e.company)}</span></div><span class="exp-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Research & Experience</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="skill-group"><span class="skill-cat">${esc(cat)}</span><span class="skill-list">${names.map(esc).join("; ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Areas of Expertise</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications & Awards</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Garamond','Georgia',serif;background:#fafaf9;color:#1c1917;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:26mm 24mm;}.header{text-align:center;padding-bottom:16px;border-bottom:2px solid #1c1917;margin-bottom:22px;}h1{font-size:32px;font-weight:400;color:#1c1917;letter-spacing:1px;}.role{font-size:13px;color:#B45309;margin-top:6px;font-weight:600;font-style:italic;}.contact{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;font-size:11px;color:#78716C;margin-top:12px;}section{margin-top:24px;}h2{font-size:13px;color:#1c1917;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #D6D3D1;text-transform:uppercase;letter-spacing:2px;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#B45309;}.edu{margin-bottom:14px;}.edu-head{display:flex;justify-content:space-between;font-size:13px;}.edu-degree{font-weight:700;color:#1c1917;}.edu-date{font-size:11px;color:#A8A29E;font-style:italic;}.edu-school{font-size:12px;color:#78716C;margin-top:2px;}.edu-gpa{font-size:11px;color:#B45309;font-weight:600;margin-top:2px;}.exp{margin-bottom:16px;}.exp-head{display:flex;justify-content:space-between;align-items:baseline;}.exp-role{font-weight:700;color:#1c1917;font-size:13px;}.exp-sep{color:#D6D3D1;}.exp-company{color:#B45309;font-style:italic;}.exp-date{font-size:11px;color:#A8A29E;font-style:italic;}.skill-group{margin-bottom:6px;font-size:12px;}.skill-cat{font-weight:700;color:#1c1917;margin-right:6px;}.skill-list{color:#78716C;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${eduHtml}${about ? `<section><h2>Research Interests</h2><p>${esc(about)}</p></section>` : ""}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── TIMELINE TEMPLATE (Vertical timeline with dot markers) ────────────────
function buildTimelineHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="tl-item"><div class="tl-dot"></div><div class="tl-content"><div class="tl-head"><span class="tl-role">${esc(e.role)}</span><span class="tl-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="tl-company">${esc(e.company)}</div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div></div>`).join("\n");
    expHtml = `<section><h2>Experience</h2><div class="tl">${items}</div></section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="tl-item"><div class="tl-dot"></div><div class="tl-content"><div class="tl-head"><span class="tl-role">${esc(e.degree)} in ${esc(e.field)}</span><span class="tl-date">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="tl-company">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2><div class="tl">${items}</div></section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#fef2f2;color:#1F2937;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:24mm 22mm;}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12px;border-bottom:3px solid #DC2626;margin-bottom:20px;}.header h1{font-size:28px;font-weight:700;color:#1F2937;}.header .role{font-size:12px;color:#DC2626;font-weight:600;text-transform:uppercase;letter-spacing:1.5px;margin-top:4px;}.contact{font-size:10px;color:#6B7280;text-align:right;line-height:1.8;}section{margin-top:22px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#DC2626;font-weight:700;margin-bottom:12px;}p,li{font-size:11.5px;line-height:1.7;color:#374151;}.tl{position:relative;padding-left:24px;border-left:2px solid #FCA5A5;}.tl-item{position:relative;margin-bottom:16px;}.tl-dot{position:absolute;left:-29px;top:4px;width:12px;height:12px;border-radius:50%;background:#DC2626;border:2px solid #fff;box-shadow:0 0 0 2px #FCA5A5;}.tl-head{display:flex;justify-content:space-between;align-items:baseline;}.tl-role{font-weight:700;color:#1F2937;font-size:13px;}.tl-date{font-size:10px;color:#9CA3AF;font-style:italic;}.tl-company{font-size:12px;color:#DC2626;margin-bottom:4px;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#DC2626;}.sg{margin-bottom:5px;font-size:11.5px;}.sc{font-weight:700;color:#1F2937;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── TWO-COLUMN PRO (Skill bars + side panel) ─────────────────────────────
function buildTwocolHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><div class="sc">${esc(cat)}</div>${names.map((n) => `<div class="bar"><span class="bar-label">${esc(n)}</span><div class="bar-track"><div class="bar-fill"></div></div></div>`).join("")}</div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue',sans-serif;background:#f0f9ff;color:#0F172A;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);display:grid;grid-template-columns:1fr 230px;}.main{padding:24mm 16mm 20mm 24mm;}.side{background:#0F172A;color:#BAE6FD;padding:28mm 16mm 20mm;}.side h1{font-size:20px;color:#fff;font-weight:700;}.side .role{font-size:11px;color:#0EA5E9;margin-top:6px;text-transform:uppercase;letter-spacing:1.5px;}.side-contact{margin-top:16px;}.side-contact div{font-size:10px;color:#94A3B8;margin-bottom:6px;}.side h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#0EA5E9;margin-top:20px;margin-bottom:8px;border-bottom:1px solid rgba(255,255,255,.1);padding-bottom:4px;}main h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0EA5E9;font-weight:700;margin-bottom:10px;}section{margin-top:18px;}p,li{font-size:11.5px;line-height:1.65;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#0EA5E9;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#0F172A;font-size:12.5px;}.ed{font-size:10px;color:#94A3B8;font-style:italic;}.ec{font-size:11px;color:#0EA5E9;margin-bottom:4px;}.sg{margin-bottom:10px;}.sc{font-size:10px;font-weight:700;color:#BAE6FD;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;}.bar{margin-bottom:5px;}.bar-label{font-size:9.5px;color:#CBD5E1;display:block;margin-bottom:2px;}.bar-track{height:4px;background:rgba(255,255,255,.1);border-radius:4px;}.bar-fill{height:100%;width:75%;background:linear-gradient(90deg,#0EA5E9,#38BDF8);border-radius:4px;}</style></head><body><div class="page"><div class="main">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${certHtml}</div><div class="side"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div>${skillsHtml}</div></div></body></html>`;
}

// ─── INFOGRAPHIC TEMPLATE (Visual skill bars, icons, charts) ──────────────
function buildInfographicHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><div class="sc">${esc(cat)}</div><div class="pill-row">${names.map((n) => `<span class="pill">${esc(n)}</span>`).join("")}</div></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#FFFBEB;color:#1E1B4B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);overflow:hidden;}.header{background:linear-gradient(135deg,#1E1B4B,#312E81);color:#fff;padding:20mm 24mm 16mm;position:relative;}.header::after{content:"";position:absolute;bottom:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#F59E0B,#FBBF24,#F59E0B);}h1{font-size:30px;font-weight:800;}.role{font-size:13px;color:#FDE68A;margin-top:6px;font-weight:600;}.contact{display:flex;gap:16px;flex-wrap:wrap;font-size:10px;color:#D4D4D8;margin-top:12px;}.contact span{padding:3px 10px;background:rgba(255,255,255,.08);border-radius:14px;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#F59E0B;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px;}h2::before{content:"";width:4px;height:16px;background:#F59E0B;border-radius:2px;}p,li{font-size:12px;line-height:1.7;color:#374151;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E1B4B;font-size:13px;}.ed{font-size:10px;color:#9CA3AF;font-style:italic;}.ec{font-size:11px;color:#F59E0B;margin-bottom:4px;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#F59E0B;}.sg{margin-bottom:10px;}.sc{font-size:10px;font-weight:700;color:#1E1B4B;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;}.pill-row{display:flex;flex-wrap:wrap;gap:5px;}.pill{font-size:10px;padding:3px 10px;background:#FEF3C7;border:1px solid #FDE68A;border-radius:14px;color:#92400E;font-weight:500;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${skillsHtml}${expHtml}${eduHtml}${certHtml}</div></div></body></html>`;
}

// ─── DARK MODE TEMPLATE (Dark background, light text) ─────────────────────
function buildDarkmodeHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'SF Mono','Fira Code',monospace;background:#0f172a;color:#CBD5E1;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#1E293B;box-shadow:0 4px 24px rgba(0,0,0,.4);padding:24mm 22mm;border-left:4px solid #22D3EE;}h1{font-size:28px;font-weight:700;color:#F8FAFC;}.role{font-size:12px;color:#22D3EE;margin-top:4px;text-transform:uppercase;letter-spacing:2px;}.contact{display:flex;gap:16px;flex-wrap:wrap;font-size:10px;color:#64748B;margin-top:12px;}section{margin-top:22px;}h2{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#22D3EE;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #334155;}p,li{font-size:12px;line-height:1.7;color:#CBD5E1;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#22D3EE;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#F8FAFC;font-size:13px;}.ed{font-size:10px;color:#64748B;font-style:italic;}.ec{font-size:11px;color:#22D3EE;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#22D3EE;margin-right:6px;}.sn{color:#94A3B8;}</style></head><body><div class="page"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── CORPORATE TEMPLATE (Bold header, no-nonsense traditional) ────────────
function buildCorporateHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><div><span class="er">${esc(e.role)}</span><span class="ec"> · ${esc(e.company)}</span></div><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Professional Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><div><span class="er">${esc(e.degree)} in ${esc(e.field)}</span></div><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(" · ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Core Competencies</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Arial',sans-serif;background:#f3f4f6;color:#111827;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);}.header{background:#111827;color:#fff;padding:20mm 24mm 16mm;}h1{font-size:32px;font-weight:700;letter-spacing:1px;}.role{font-size:14px;color:#BFDBFE;margin-top:6px;font-weight:500;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:11px;color:#9CA3AF;margin-top:12px;}.body{padding:18mm 24mm;}section{margin-top:22px;}h2{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#1D4ED8;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #BFDBFE;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#1D4ED8;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;align-items:baseline;}.er{font-weight:700;color:#111827;font-size:13px;}.ec{color:#1D4ED8;font-weight:500;}.ed{font-size:11px;color:#9CA3AF;font-style:italic;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#111827;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── MILLENNIAL TEMPLATE (Skill charts, bright colors) ────────────────────
function buildMillennialHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><div class="sc">${esc(cat)}</div><div class="pills">${names.map((n) => `<span class="pill">${esc(n)}</span>`).join("")}</div></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Poppins','Segoe UI',sans-serif;background:#FDF2F8;color:#1E1B4B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);overflow:hidden;}.header{background:linear-gradient(135deg,#EC4899,#F472B6);color:#fff;padding:20mm 24mm 16mm;position:relative;}.header::after{content:"";position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#EC4899,#8B5CF6);}h1{font-size:28px;font-weight:800;}.role{font-size:12px;color:#FCE7F3;margin-top:4px;font-weight:600;letter-spacing:1px;}.contact{display:flex;gap:14px;flex-wrap:wrap;font-size:10px;color:#F9A8D4;margin-top:10px;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#EC4899;font-weight:700;margin-bottom:10px;display:flex;align-items:center;gap:8px;}h2::before{content:"";width:4px;height:14px;background:linear-gradient(180deg,#EC4899,#8B5CF6);border-radius:2px;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#EC4899;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E1B4B;font-size:13px;}.ed{font-size:10px;color:#9CA3AF;font-style:italic;}.ec{font-size:11px;color:#EC4899;margin-bottom:4px;}.sg{margin-bottom:10px;}.sc{font-size:10px;font-weight:700;color:#1E1B4B;margin-bottom:4px;text-transform:uppercase;letter-spacing:1px;}.pills{display:flex;flex-wrap:wrap;gap:5px;}.pill{font-size:10px;padding:3px 10px;background:#FDF2F8;border:1px solid #FBCFE8;border-radius:14px;color:#BE185D;font-weight:500;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${skillsHtml}${expHtml}${eduHtml}${certHtml}</div></div></body></html>`;
}

// ─── IVY LEAGUE TEMPLATE (Traditional serif, conservative, prestigious) ────
function buildIvyHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><div><span class="er">${esc(e.role)}</span>, <span class="ec">${esc(e.company)}</span></div><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Professional Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><div><span class="er">${esc(e.degree)} in ${esc(e.field)}</span></div><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join("; ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Areas of Expertise</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n");
    certHtml = `<section><h2>Honors & Awards</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Garamond','Georgia',serif;background:#FFF7ED;color:#1C1917;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:26mm 24mm;}.header{border-bottom:4px double #7C2D12;padding-bottom:14px;margin-bottom:20px;}h1{font-size:32px;font-weight:400;color:#1C1917;text-align:center;}.role{font-size:13px;color:#7C2D12;text-align:center;margin-top:6px;font-style:italic;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:11px;color:#78716C;margin-top:10px;}section{margin-top:22px;}h2{font-size:13px;color:#1C1917;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #FED7AA;text-transform:uppercase;letter-spacing:2px;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#7C2D12;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;align-items:baseline;}.er{font-weight:700;color:#1C1917;font-size:13px;}.ec{color:#7C2D12;font-style:italic;}.ed{font-size:11px;color:#A8A29E;font-style:italic;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1C1917;margin-right:6px;}.sn{color:#78716C;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── EVEREST TEMPLATE (Strong visual hierarchy, teal accent) ───────────────
function buildEverestHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue',sans-serif;background:#F0FDFA;color:#18181B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);padding:24mm 22mm;}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;border-bottom:3px solid #0D9488;margin-bottom:20px;}.header h1{font-size:30px;font-weight:700;color:#18181B;}.header .role{font-size:12px;color:#0D9488;font-weight:600;margin-top:4px;}.contact{font-size:10px;color:#71717A;text-align:right;line-height:1.8;}section{margin-top:22px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0D9488;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #99F6E4;}p,li{font-size:12px;line-height:1.7;color:#3F3F46;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#0D9488;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#18181B;font-size:13px;}.ed{font-size:10px;color:#A1A1AA;font-style:italic;}.ec{font-size:11px;color:#0D9488;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#18181B;margin-right:6px;}.sn{color:#71717A;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── QUICK TEMPLATE (Bold background, compact, fast-read) ──────────────────
function buildQuickHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span> <span class="ec">@ ${esc(e.company)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><span class="ec">${esc(e.institution)}</span></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<span class="st">${esc(cat)}: ${names.map(esc).join(", ")}</span>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li>${esc(c.name)}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Arial',sans-serif;background:#e0e7ff;color:#1E293B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#4338CA;box-shadow:0 4px 24px rgba(0,0,0,.2);padding:20mm 22mm;color:#E2E8F0;}h1{font-size:30px;font-weight:800;color:#fff;}.role{font-size:13px;color:#C7D2FE;margin-top:4px;font-weight:500;}.contact{display:flex;gap:14px;flex-wrap:wrap;font-size:10px;color:#A5B4FC;margin-top:10px;}.body{background:#fff;color:#1E293B;padding:16px 20px;border-radius:8px;margin-top:16px;}section{margin-top:18px;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#4338CA;font-weight:700;margin-bottom:8px;}p,li{font-size:11.5px;line-height:1.65;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#4338CA;}.exp{margin-bottom:12px;}.eh{display:flex;justify-content:space-between;align-items:baseline;}.er{font-weight:700;color:#1E293B;font-size:12.5px;}.ec{color:#4338CA;font-weight:500;}.ed{font-size:10px;color:#94A3B8;}.st{display:block;font-size:11px;margin-bottom:4px;color:#475569;}.st b{color:#1E293B;}</style></head><body><div class="page"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── PHOTO TEMPLATE (Photo-friendly, international layout) ─────────────────
function buildPhotoHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) {
    const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n");
    expHtml = `<section><h2>Experience</h2>${items}</section>`;
  }
  let eduHtml = "";
  if (p.education?.length) {
    const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n");
    eduHtml = `<section><h2>Education</h2>${items}</section>`;
  }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n");
    skillsHtml = `<section><h2>Skills</h2>${items}</section>`;
  }
  let certHtml = "";
  if (p.certifications?.length) {
    const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n");
    certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`;
  }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#F5F3FF;color:#1E293B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);display:grid;grid-template-columns:1fr 200px;}.main{padding:24mm 16mm 20mm 24mm;}.side{background:linear-gradient(180deg,#7C3AED,#6D28D9);color:#E9D5FF;padding:28mm 14mm 20mm;text-align:center;}.photo-placeholder{width:100px;height:100px;border-radius:50%;background:rgba(255,255,255,.15);margin:0 auto 16px;display:flex;align-items:center;justify-content:center;font-size:36px;color:rgba(255,255,255,.3);}.side h1{font-size:18px;color:#fff;font-weight:700;}.side .role{font-size:10px;color:#C4B5FD;margin-top:4px;text-transform:uppercase;letter-spacing:1.5px;}.side-contact{margin-top:16px;text-align:left;}.side-contact div{font-size:9.5px;color:#DDD6FE;margin-bottom:6px;}.side-section{margin-top:20px;text-align:left;}.side-section h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#C4B5FD;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.15);padding-bottom:4px;}.side-section p,.side-section li{font-size:9.5px;line-height:1.6;color:#E9D5FF;}main h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#7C3AED;font-weight:700;margin-bottom:10px;}section{margin-top:18px;}p,li{font-size:11.5px;line-height:1.65;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#7C3AED;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E293B;font-size:12.5px;}.ed{font-size:10px;color:#9CA3AF;font-style:italic;}.ec{font-size:11px;color:#7C3AED;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:11px;}.sc{font-weight:700;color:#1E293B;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="main">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${certHtml}</div><div class="side"><div class="photo-placeholder">👤</div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-section"><div class="side-contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${skillsHtml}</div></div></body></html>`;
}

// ─── CLEAN ELEGANT (Microsoft-inspired, refined spacing) ───────────────────
function buildCleanElegantHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Calibri','Segoe UI',sans-serif;background:#f8fafc;color:#1F2937;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:24mm 22mm;}h1{font-size:26px;font-weight:300;color:#1F2937;letter-spacing:1px;}h1 b{font-weight:700;}.role{font-size:12px;color:#475569;margin-top:4px;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#64748B;margin-top:12px;padding-top:12px;border-top:1px solid #CBD5E1;}section{margin-top:22px;}h2{font-size:11px;letter-spacing:2.5px;text-transform:uppercase;color:#475569;font-weight:600;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #E2E8F0;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#475569;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1F2937;font-size:13px;}.ed{font-size:10px;color:#94A3B8;font-style:italic;}.ec{font-size:11.5px;color:#475569;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1F2937;margin-right:6px;}.sn{color:#64748B;}</style></head><body><div class="page"><h1><b>${esc(p.name)}</b></h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── MODERN BASIC (Microsoft-inspired, clean organized) ───────────────────
function buildModernBasicHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><div><span class="er">${esc(e.role)}</span><span class="ec"> · ${esc(e.company)}</span></div><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><div><span class="er">${esc(e.degree)} in ${esc(e.field)}</span></div><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#eff6ff;color:#111827;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:22mm 20mm;}.topbar{background:#2563EB;color:#fff;padding:14px 20px;margin:-22mm -20mm 18px;display:flex;justify-content:space-between;align-items:center;}h1{font-size:24px;font-weight:700;color:#fff;}.role{font-size:12px;color:#BFDBFE;margin-top:2px;}.contact{font-size:10px;color:#DBEAFE;text-align:right;}section{margin-top:20px;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#2563EB;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #DBEAFE;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#2563EB;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;align-items:baseline;}.er{font-weight:700;color:#111827;font-size:13px;}.ec{color:#2563EB;font-weight:500;}.ed{font-size:10px;color:#9CA3AF;font-style:italic;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#111827;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="topbar"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── HARVARD (Classic single-column, maximum ATS) ─────────────────────────
function buildHarvardHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Professional Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Additional Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Garamond','Georgia',serif;background:#fef2f2;color:#1C1917;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:24mm 22mm;}.header{border-bottom:2px solid #A51C30;padding-bottom:12px;margin-bottom:18px;}h1{font-size:28px;font-weight:700;color:#A51C30;text-align:center;}.role{font-size:12px;color:#6B7280;text-align:center;margin-top:4px;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#6B7280;margin-top:10px;}section{margin-top:22px;}h2{font-size:12px;color:#A51C30;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #F5C6CB;text-transform:uppercase;letter-spacing:1.5px;}p,li{font-size:12px;line-height:1.7;color:#333333;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#A51C30;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1C1917;font-size:13px;}.ed{font-size:10px;color:#9CA3AF;font-style:italic;}.ec{font-size:11.5px;color:#A51C30;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1C1917;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── EUROPASS (EU standardized format) ────────────────────────────────────
function buildEuropassHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Work Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education and Training</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Personal Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}${c.date && c.date !== "null" ? ` (${esc(c.date)})` : ""}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Calibri',sans-serif;background:#E8EEF4;color:#1A1A1A;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);}.header{background:#003399;color:#fff;padding:16mm 20mm 12mm;display:flex;justify-content:space-between;align-items:flex-end;}h1{font-size:26px;font-weight:700;color:#fff;}.role{font-size:12px;color:#CCD5E0;margin-top:4px;}.contact{font-size:10px;color:#CCD5E0;text-align:right;line-height:1.8;}.body{padding:16mm 20mm;}section{margin-top:20px;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#003399;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #CCD5E0;}p,li{font-size:12px;line-height:1.7;color:#333333;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#003399;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1A1A1A;font-size:13px;}.ed{font-size:10px;color:#6B7280;font-style:italic;}.ec{font-size:11.5px;color:#003399;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1A1A1A;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div><div class="body">${about ? `<section><h2>Personal Statement</h2><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── METRO (Cyan tile-inspired, digital-first) ────────────────────────────
function buildMetroHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Segoe UI',sans-serif;background:#ecfeff;color:#0F172A;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);display:grid;grid-template-columns:1fr 220px;}.main{padding:22mm 16mm 20mm 22mm;}.side{background:linear-gradient(180deg,#06B6D4,#0891B2);color:#ecfeff;padding:26mm 14mm 20mm;}.side h1{font-size:20px;color:#fff;font-weight:700;}.side .role{font-size:11px;color:#A5F3FC;margin-top:4px;}.side-contact{margin-top:14px;}.side-contact div{font-size:9.5px;color:#CFFAFE;margin-bottom:6px;}.side h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#A5F3FC;margin-top:18px;margin-bottom:6px;border-bottom:1px solid rgba(255,255,255,.2);padding-bottom:4px;}main h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#06B6D4;font-weight:700;margin-bottom:10px;}section{margin-top:18px;}p,li{font-size:11.5px;line-height:1.65;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:4px;}li::marker{color:#06B6D4;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#0F172A;font-size:12.5px;}.ed{font-size:10px;color:#94A3B8;font-style:italic;}.ec{font-size:11px;color:#06B6D4;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#A5F3FC;margin-bottom:3px;text-transform:uppercase;letter-spacing:1px;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:2px 8px;background:rgba(255,255,255,.15);border-radius:10px;color:#fff;font-weight:500;}</style></head><body><div class="page"><div class="main">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${certHtml}</div><div class="side"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div>${skillsHtml}</div></div></body></html>`;
}

// ─── CREATIVE BEIGE (Warm two-tone Canva-style) ──────────────────────────
function buildCreativeBeigeHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Georgia',serif;background:#FEFCE8;color:#44403C;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);display:grid;grid-template-columns:1fr 210px;}.main{padding:24mm 16mm 20mm 24mm;}.side{background:#FEF3C7;padding:28mm 16mm 20mm;border-left:3px solid #D97706;}.side h1{font-size:20px;color:#44403C;font-weight:700;}.side .role{font-size:11px;color:#D97706;margin-top:4px;font-weight:600;}.side-contact{margin-top:14px;}.side-contact div{font-size:9.5px;color:#78716C;margin-bottom:6px;}.side h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#D97706;margin-top:18px;margin-bottom:6px;border-bottom:1px solid #FDE68A;padding-bottom:4px;}main h2{font-size:13px;color:#D97706;font-weight:700;margin-bottom:10px;}section{margin-top:18px;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#D97706;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#292524;font-size:13px;}.ed{font-size:10px;color:#A8A29E;font-style:italic;}.ec{font-size:11px;color:#D97706;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:11px;}.sc{font-weight:700;color:#44403C;margin-right:6px;}.sn{color:#78716C;}</style></head><body><div class="page"><div class="main">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${certHtml}</div><div class="side"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div>${skillsHtml}</div></div></body></html>`;
}

// ─── CORPORATE ATS (Blue minimalist, ATS-perfect) ─────────────────────────
function buildCorporateAtsHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${e.description ? `<p>${esc(e.description)}</p>` : ""}${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Professional Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Core Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li><b>${esc(c.name)}</b> — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Arial',sans-serif;background:#EFF6FF;color:#1E293B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:22mm 20mm;}.header{border-bottom:3px solid #1E40AF;padding-bottom:12px;margin-bottom:18px;}h1{font-size:28px;font-weight:700;color:#1E293B;}.role{font-size:13px;color:#1E40AF;font-weight:600;margin-top:4px;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#64748B;margin-top:10px;}section{margin-top:22px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#1E40AF;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #BFDBFE;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#1E40AF;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E293B;font-size:13px;}.ed{font-size:10px;color:#94A3B8;font-style:italic;}.ec{font-size:11.5px;color:#1E40AF;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1E293B;margin-right:6px;}.sn{color:#64748B;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── BOLD GRAPHIC (Red/black Canva-style for designers) ───────────────────
function buildBoldGraphicHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Arial Black','Impact',sans-serif;background:#FEF2F2;color:#1F2937;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.15);overflow:hidden;}.header{background:#DC2626;color:#fff;padding:20mm 24mm 16mm;display:flex;justify-content:space-between;align-items:flex-end;}h1{font-size:32px;font-weight:900;color:#fff;letter-spacing:1px;}.role{font-size:13px;color:#FCA5A5;margin-top:4px;}.contact{font-size:10px;color:#FEE2E2;text-align:right;line-height:1.8;}.body{padding:16mm 24mm;}section{margin-top:20px;}h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#DC2626;font-weight:900;margin-bottom:10px;padding-bottom:6px;border-bottom:3px solid #FCA5A5;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#DC2626;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:900;color:#1F2937;font-size:13px;}.ed{font-size:10px;color:#9CA3AF;}.ec{font-size:11px;color:#DC2626;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:900;color:#DC2626;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9.5px;padding:3px 10px;background:#FEE2E2;border-radius:4px;color:#991B1B;font-weight:700;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── SCIENCE ENGINEERING (Green/black, STEM-focused, Canva-style) ─────────
function buildScienceEngHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Research & Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · GPA: ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Technical Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Consolas','Courier New',monospace;background:#F0FDF4;color:#14532D;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:22mm 20mm;}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12px;border-bottom:3px solid #16A34A;margin-bottom:18px;}.header h1{font-size:24px;font-weight:700;color:#14532D;font-family:'Consolas',monospace;}.header .role{font-size:11px;color:#16A34A;text-transform:uppercase;letter-spacing:2px;margin-top:4px;}.contact{font-size:10px;color:#6B7280;text-align:right;}section{margin-top:20px;}h2{font-size:11px;letter-spacing:2px;text-transform:uppercase;color:#16A34A;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #BBF7D0;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#16A34A;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#14532D;font-size:13px;}.ed{font-size:10px;color:#9CA3AF;font-style:italic;}.ec{font-size:11px;color:#16A34A;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#14532D;margin-right:6px;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── CALLIGRAPHIC (Eye-catching section titles, balanced columns) ──────────
function buildCalligraphicHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(" | ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Palatino Linotype','Book Antiqua',Palatino,serif;background:#FAFAF9;color:#292524;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:26mm 22mm;}.header{text-align:center;padding-bottom:16px;border-bottom:1px solid #D6D3D1;margin-bottom:20px;}h1{font-size:34px;font-weight:400;color:#292524;font-style:italic;}.role{font-size:13px;color:#92400E;margin-top:6px;font-weight:600;}.contact{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;font-size:10.5px;color:#78716C;margin-top:10px;}section{margin-top:24px;}h2{font-size:14px;color:#292524;font-weight:400;font-style:italic;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #D6D3D1;text-align:center;letter-spacing:1px;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#92400E;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#292524;font-size:13px;}.ed{font-size:10px;color:#A8A29E;font-style:italic;}.ec{font-size:11.5px;color:#92400E;font-style:italic;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#292524;margin-right:6px;}.sn{color:#78716C;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── ELEGANT (Dark gold, Palatino, luxury) ────────────────────────────────
function buildElegantHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Professional Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Core Competencies</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Awards &amp; Honors</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Palatino Linotype',Georgia,serif;background:#1C1917;color:#333;}.page{width:210mm;min-height:297mm;margin:12px auto;background:linear-gradient(180deg,#FFFBEB 0%,#FEF3C7 100%);box-shadow:0 4px 32px rgba(0,0,0,.3);padding:24mm 22mm;}.header{text-align:center;border:2px solid #B8860B;padding:20px 24px;margin-bottom:20px;}h1{font-size:36px;font-weight:400;color:#B8860B;letter-spacing:3px;text-transform:uppercase;}.role{font-size:13px;color:#78350F;margin-top:6px;}.contact{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;font-size:10.5px;color:#92400E;margin-top:10px;}section{margin-top:24px;}h2{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#B8860B;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #D4A843;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#B8860B;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#78350F;font-size:13px;}.ed{font-size:10px;color:#A16207;font-style:italic;}.ec{font-size:11.5px;color:#B8860B;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#78350F;margin-right:6px;}.sn{color:#92400E;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── GRADIENT MODERN (Violet gradient header, Inter, card sections) ───────
function buildGradientHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter','Segoe UI',sans-serif;background:#EDE9FE;color:#1E1B4B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.15);overflow:hidden;}.header{background:linear-gradient(135deg,#6D28D9,#7C3AED,#8B5CF6);color:#fff;padding:28mm 24mm 20mm;position:relative;overflow:hidden;}h1{font-size:34px;font-weight:700;color:#fff;position:relative;z-index:1;}.role{font-size:13px;color:#DDD6FE;margin-top:6px;position:relative;z-index:1;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#E9D5FF;margin-top:12px;position:relative;z-index:1;}.body{padding:18mm 24mm;}section{margin-top:20px;background:#FAF5FF;border-radius:8px;padding:16px 20px;border:1px solid #E9D5FF;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#7C3AED;font-weight:700;margin-bottom:10px;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#7C3AED;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E1B4B;font-size:13px;}.ed{font-size:10px;color:#A78BFA;font-style:italic;}.ec{font-size:11px;color:#7C3AED;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#7C3AED;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:#EDE9FE;border-radius:20px;color:#5B21B6;font-weight:600;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── RETRO TYPEWRITER (Brown, Courier, vintage dashed) ────────────────────
function buildRetroHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>:: EXPERIENCE ::</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>:: EDUCATION ::</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">&gt; ${esc(cat)}:</span> <span class="sn">${names.map(esc).join(" | ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>:: SKILLS ::</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>[${esc(c.name)}] — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>:: CERTIFICATIONS ::</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Courier New',Consolas,monospace;background:#FEF3C7;color:#78350F;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FFFBEB;box-shadow:0 2px 12px rgba(0,0,0,.12);padding:22mm 20mm;border:2px dashed #B45309;}.header{border-bottom:2px dashed #D97706;padding-bottom:14px;margin-bottom:18px;}h1{font-size:28px;font-weight:700;color:#78350F;text-transform:uppercase;letter-spacing:3px;}.role{font-size:12px;color:#B45309;margin-top:4px;}.contact{font-size:10px;color:#92400E;margin-top:10px;}section{margin-top:22px;}h2{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#B45309;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px dashed #FDE68A;}p,li{font-size:12px;line-height:1.8;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#B45309;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#78350F;font-size:12.5px;}.ed{font-size:10px;color:#D97706;}.ec{font-size:11px;color:#92400E;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#B45309;margin-right:6px;}.sn{color:#78350F;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── CONSERVATIVE (Navy, Times New Roman, double-rule) ────────────────────
function buildConservativeHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Professional Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}:</span> <span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Areas of Competency</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Professional Affiliations</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Times New Roman',Georgia,serif;background:#EFF6FF;color:#1E3A5F;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.1);padding:24mm 22mm;}.header{text-align:center;padding-bottom:14px;border-top:3px double #1E3A5F;border-bottom:3px double #1E3A5F;padding:14px 0;margin-bottom:20px;}h1{font-size:30px;font-weight:700;color:#1E3A5F;letter-spacing:2px;text-transform:uppercase;}.role{font-size:13px;color:#1E3A5F;margin-top:4px;font-style:italic;}.contact{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;font-size:10.5px;color:#475569;margin-top:10px;}section{margin-top:24px;}h2{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#1E3A5F;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #93C5FD;}p,li{font-size:12.5px;line-height:1.7;color:#334155;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#1E3A5F;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E3A5F;font-size:13px;}.ed{font-size:10px;color:#64748B;font-style:italic;}.ec{font-size:11.5px;color:#1E40AF;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1E3A5F;margin-right:6px;}.sn{color:#475569;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── ARTISTIC (Fuchsia, Pacifico accent, paint-stroke) ────────────────────
function buildArtisticHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter','Segoe UI',sans-serif;background:#FDF2F8;color:#831843;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.15);overflow:hidden;}.header{background:#831843;color:#fff;padding:28mm 24mm 20mm;position:relative;}.header::after{content:"";position:absolute;bottom:-20px;left:0;right:0;height:40px;background:linear-gradient(135deg,transparent 33.33%,#831843 33.33%,#831843 66.66%,transparent 66.66%);opacity:.15;}h1{font-size:36px;font-weight:300;color:#fff;}.role{font-size:13px;color:#FBCFE8;margin-top:6px;font-style:italic;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#F5D0FE;margin-top:12px;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:13px;letter-spacing:1px;color:#BE185D;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #FBCFE8;position:relative;}h2::after{content:"";position:absolute;bottom:-2px;left:0;width:40px;height:2px;background:#BE185D;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#BE185D;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#831843;font-size:13px;}.ed{font-size:10px;color:#F472B6;font-style:italic;}.ec{font-size:11px;color:#BE185D;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#BE185D;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:#FDF2F8;border:1px solid #FBCFE8;border-radius:20px;color:#9D174D;font-weight:600;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── ULTRA MINIMAL (Extreme whitespace, Helvetica Neue Thin) ──────────────
function buildUltraminimalHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue','Arial',sans-serif;background:#FAFAFA;color:#000;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:30mm 28mm;}.header{margin-bottom:32px;}h1{font-size:28px;font-weight:200;color:#000;letter-spacing:4px;text-transform:uppercase;}.role{font-size:12px;color:#525252;margin-top:8px;font-weight:300;letter-spacing:2px;}.contact{display:flex;gap:24px;flex-wrap:wrap;font-size:10px;color:#A3A3A3;margin-top:16px;padding-top:16px;border-top:1px solid #E5E5E5;}section{margin-top:28px;}h2{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#000;font-weight:300;margin-bottom:14px;}p,li{font-size:12px;line-height:1.8;color:#525252;font-weight:300;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:6px;}li::marker{color:#000;}.exp{margin-bottom:16px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:400;color:#000;font-size:12px;}.ed{font-size:10px;color:#A3A3A3;}.ec{font-size:11px;color:#525252;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:400;color:#000;margin-right:6px;}.sn{color:#737373;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── TECH STACK (Emerald, JetBrains Mono, dark sidebar terminal) ──────────
function buildTechstackHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  const groups = groupByCategory(p.skills || []);
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'JetBrains Mono','Fira Code',monospace;background:#022C22;color:#D1FAE5;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.2);display:grid;grid-template-columns:220px 1fr;}.side{background:#064E3B;color:#D1FAE5;padding:22mm 14mm;}.side h1{font-size:16px;color:#A7F3D0;font-weight:700;}.side .role{font-size:10px;color:#34D399;margin-top:6px;}.side-contact{margin-top:14px;}.side-contact div{font-size:9px;color:#A7F3D0;margin-bottom:5px;word-break:break-all;}.side h3{font-size:9px;text-transform:uppercase;letter-spacing:2px;color:#34D399;margin-top:18px;margin-bottom:6px;padding-bottom:4px;border-bottom:1px solid rgba(167,243,208,.2);}.skill-cat{font-size:9px;color:#34D399;font-weight:700;margin-top:8px;margin-bottom:3px;}.skill-list{list-style:none;}.skill-list li{font-size:9px;color:#D1FAE5;margin-bottom:3px;padding-left:8px;position:relative;}.skill-list li::before{content:"$";position:absolute;left:0;color:#10B981;}.main{padding:22mm 18mm;}main h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#059669;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #A7F3D0;}section{margin-top:20px;}p,li{font-size:11.5px;line-height:1.7;color:#1F2937;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#059669;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#022C22;font-size:12.5px;}.ed{font-size:10px;color:#059669;}.ec{font-size:11px;color:#059669;margin-bottom:4px;}</style></head><body><div class="page"><div class="side"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="side-contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div>${Object.keys(groups).length ? `<h3>Skills</h3>${Object.entries(groups).map(([cat, names]) => `<div class="skill-cat">// ${esc(cat)}</div><ul class="skill-list">${names.map((n) => `<li>${esc(n)}</li>`).join("")}</ul>`).join("")}` : ""}</div><div class="main">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${certHtml}</div></div></body></html>`;
}

// ─── BUSINESS PRO (Blue, Georgia, card layout) ────────────────────────────
function buildBusinessproHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,'Times New Roman',serif;background:#EFF6FF;color:#1E3A5F;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.1);overflow:hidden;}.header{background:linear-gradient(135deg,#1E40AF,#1E3A5F);color:#fff;padding:28mm 24mm 20mm;position:relative;}.header::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:30px;background:#fff;clip-path:polygon(0 100%,100% 100%,100% 0,50% 80%,0 0);}h1{font-size:32px;font-weight:700;color:#fff;position:relative;z-index:1;}.role{font-size:13px;color:#BFDBFE;margin-top:6px;position:relative;z-index:1;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#DBEAFE;margin-top:12px;position:relative;z-index:1;}.body{padding:20mm 24mm;}section{margin-top:20px;background:#F8FAFC;border-left:4px solid #1E40AF;padding:14px 18px;border-radius:0 8px 8px 0;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#1E40AF;font-weight:700;margin-bottom:10px;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#1E40AF;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E3A5F;font-size:13px;}.ed{font-size:10px;color:#64748B;font-style:italic;}.ec{font-size:11px;color:#1E40AF;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1E3A5F;margin-right:6px;}.sn{color:#475569;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── ACADEMIC CV (Dark amber, Book Antiqua, numbered sections) ────────────
function buildAcademiccvHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>1. Professional Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}${e.grade && e.grade !== "null" ? ` · GPA: ${esc(e.grade)}` : ""}</div></div>`).join("\n"); eduHtml = `<section><h2>2. Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}:</span> <span class="sn">${names.map(esc).join("; ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>3. Research Areas</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>4. Publications &amp; Awards</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Book Antiqua','Palatino Linotype',serif;background:#FEF3C7;color:#1C1917;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FFFBEB;box-shadow:0 2px 12px rgba(0,0,0,.1);padding:24mm 22mm;}.header{padding-bottom:14px;border-bottom:3px solid #854D0E;margin-bottom:20px;}h1{font-size:28px;font-weight:700;color:#1C1917;}.role{font-size:13px;color:#854D0E;margin-top:4px;font-style:italic;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#78716C;margin-top:10px;}section{margin-top:24px;}h2{font-size:13px;letter-spacing:1px;color:#854D0E;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #D6D3D1;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#854D0E;font-weight:700;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1C1917;font-size:13px;}.ed{font-size:10px;color:#A8A29E;font-style:italic;}.ec{font-size:11.5px;color:#854D0E;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1C1917;margin-right:6px;}.sn{color:#78716C;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><h2>0. Summary</h2><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── MOSAIC (Purple, DM Sans, gradient cards) ─────────────────────────────
function buildMosaicHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="card"><div class="card-title">${esc(cat)}</div><div class="card-tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2><div class="mosaic">${items}</div></section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'DM Sans','Inter',sans-serif;background:#FAF5FF;color:#374151;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);padding:24mm 22mm;}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:14px;margin-bottom:18px;background:linear-gradient(135deg,#7E22CE,#9333EA);color:#fff;padding:20mm 22mm 16mm;border-radius:12px;margin:0 0 18px;}h1{font-size:32px;font-weight:700;color:#fff;}.role{font-size:13px;color:#E9D5FF;margin-top:6px;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#F3E8FF;margin-top:10px;}section{margin-top:20px;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#7E22CE;font-weight:700;margin-bottom:12px;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#7E22CE;}.exp{margin-bottom:14px;background:#FAF5FF;padding:14px;border-radius:8px;border:1px solid #E9D5FF;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#3B0764;font-size:13px;}.ed{font-size:10px;color:#A855F7;}.ec{font-size:11px;color:#7E22CE;margin-bottom:4px;}.mosaic{display:grid;grid-template-columns:1fr 1fr;gap:10px;}.card{background:linear-gradient(135deg,#FAF5FF,#F3E8FF);border:1px solid #E9D5FF;border-radius:8px;padding:12px;}.card-title{font-size:11px;font-weight:700;color:#7E22CE;margin-bottom:6px;}.card-tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:2px 8px;background:#7E22CE;color:#fff;border-radius:12px;font-weight:500;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── BRUTALIST (Raw, monospace, harsh borders, anti-design) ───────────────
function buildBrutalistHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>EXPERIENCE</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} / ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>EDUCATION</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(" / ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>SKILLS</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>CERTS</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Courier New',monospace;background:#F5F5F5;color:#171717;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;border:3px solid #000;padding:20mm 18mm;}.header{border-bottom:4px solid #000;padding-bottom:12px;margin-bottom:18px;}h1{font-size:36px;font-weight:900;color:#000;text-transform:uppercase;letter-spacing:-1px;}.role{font-size:14px;color:#404040;margin-top:4px;text-transform:uppercase;}.contact{display:flex;gap:16px;flex-wrap:wrap;font-size:11px;color:#404040;margin-top:10px;}section{margin-top:22px;}h2{font-size:14px;font-weight:900;text-transform:uppercase;color:#000;margin-bottom:10px;padding:4px 8px;background:#000;color:#fff;display:inline-block;}p,li{font-size:12px;line-height:1.7;color:#171717;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#000;}.exp{margin-bottom:14px;padding:10px;border:2px solid #000;}.eh{display:flex;justify-content:space-between;}.er{font-weight:900;font-size:13px;}.ed{font-size:10px;color:#404040;}.ec{font-size:11px;color:#404040;margin-bottom:4px;text-transform:uppercase;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:900;margin-right:6px;text-transform:uppercase;}.sn{color:#404040;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── WATERCOLOR (Soft purple, Playfair, artistic feel) ────────────────────
function buildWatercolorHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Playfair Display',Georgia,serif;background:#F5F3FF;color:#3B0764;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FEFBFF;box-shadow:0 2px 16px rgba(124,58,237,.1);padding:28mm 24mm;}.header{text-align:center;padding-bottom:18px;border-bottom:2px solid #DDD6FE;margin-bottom:22px;}h1{font-size:36px;font-weight:400;color:#3B0764;font-style:italic;}.role{font-size:13px;color:#7C3AED;margin-top:6px;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#A78BFA;margin-top:10px;}section{margin-top:24px;}h2{font-size:14px;color:#7C3AED;font-weight:400;font-style:italic;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #DDD6FE;text-align:center;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#A855F7;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#3B0764;font-size:13px;font-style:italic;}.ed{font-size:10px;color:#A855F7;font-style:italic;}.ec{font-size:11.5px;color:#7C3AED;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#3B0764;margin-right:6px;}.sn{color:#A78BFA;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── NEON (Dark bg, neon magenta, futuristic) ─────────────────────────────
function buildNeonHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>EXPERIENCE</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>EDUCATION</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>SKILLS</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>CERTIFICATIONS</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Orbitron','Courier New',monospace;background:#0A0A0A;color:#E4E4E7;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#111;box-shadow:0 0 40px rgba(255,0,255,.15);padding:22mm 20mm;border:1px solid #FF00FF;}.header{border-bottom:2px solid #FF00FF;padding-bottom:12px;margin-bottom:18px;}h1{font-size:28px;font-weight:700;color:#FF00FF;text-shadow:0 0 10px rgba(255,0,255,.5);}.role{font-size:11px;color:#A855F7;margin-top:4px;letter-spacing:2px;text-transform:uppercase;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10px;color:#E879F9;margin-top:10px;}section{margin-top:20px;}h2{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#FF00FF;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid rgba(255,0,255,.3);}p,li{font-size:11.5px;line-height:1.7;color:#D4D4D8;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#FF00FF;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#FF00FF;font-size:12.5px;}.ed{font-size:10px;color:#A855F7;}.ec{font-size:11px;color:#E879F9;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#FF00FF;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:rgba(255,0,255,.1);border:1px solid #FF00FF;border-radius:2px;color:#FF00FF;font-weight:500;text-shadow:0 0 4px rgba(255,0,255,.3);}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── VINTAGE (Brown, Garamond, aged paper, decorative) ───────────────────
function buildVintageHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>~ Experience ~</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>~ Education ~</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}:</span> <span class="sn">${names.map(esc).join(" · ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>~ Skills ~</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>~ Honors ~</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Garamond','Georgia',serif;background:#D6D3D1;color:#451A03;}.page{width:210mm;min-height:297mm;margin:12px auto;background:linear-gradient(180deg,#FEFCE8,#FEF3C7);box-shadow:0 2px 16px rgba(0,0,0,.15);padding:26mm 22mm;border:1px solid #D6D3D1;}.header{text-align:center;padding-bottom:16px;border-bottom:3px double #92400E;margin-bottom:20px;}h1{font-size:34px;font-weight:400;color:#451A03;}.role{font-size:13px;color:#92400E;margin-top:6px;font-style:italic;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#78716C;margin-top:10px;}section{margin-top:24px;}h2{font-size:14px;color:#92400E;font-weight:400;text-align:center;margin-bottom:10px;letter-spacing:1px;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#B45309;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#451A03;font-size:13px;}.ed{font-size:10px;color:#A8A29E;font-style:italic;}.ec{font-size:11.5px;color:#92400E;font-style:italic;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#451A03;margin-right:6px;}.sn{color:#78716C;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── GEOMETRIC (Cyan, Montserrat, shapes) ─────────────────────────────────
function buildGeometricHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Montserrat','Segoe UI',sans-serif;background:#ECFEFF;color:#164E63;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.08);overflow:hidden;}.header{background:linear-gradient(135deg,#0891B2,#06B6D4,#22D3EE);padding:24mm 24mm 20mm;position:relative;}.header::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:40px;background:#fff;clip-path:polygon(0 100%,100% 100%,100% 0);}h1{font-size:30px;font-weight:700;color:#fff;position:relative;z-index:1;}.role{font-size:13px;color:#CFFAFE;margin-top:6px;position:relative;z-index:1;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#E0F2FE;margin-top:12px;position:relative;z-index:1;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0891B2;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #A5F3FC;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#0891B2;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#164E63;font-size:13px;}.ed{font-size:10px;color:#67E8F9;}.ec{font-size:11px;color:#0891B2;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#0891B2;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:#ECFEFF;border:1px solid #A5F3FC;border-radius:4px;color:#0E7490;font-weight:600;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── MAGAZINE (Red, multi-column, editorial) ──────────────────────────────
function buildMagazineHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Arial',sans-serif;background:#FEF2F2;color:#1F2937;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.1);padding:20mm 18mm;}.header{display:flex;justify-content:space-between;align-items:flex-end;border-bottom:4px solid #DC2626;padding-bottom:12px;margin-bottom:18px;}h1{font-size:42px;font-weight:900;color:#1F2937;line-height:1;}.role{font-size:12px;color:#DC2626;font-weight:700;text-transform:uppercase;letter-spacing:3px;margin-top:6px;}.contact{font-size:10px;color:#6B7280;text-align:right;line-height:1.8;}section{margin-top:20px;}h2{font-size:20px;color:#1F2937;font-weight:900;margin-bottom:10px;padding-bottom:6px;border-bottom:3px solid #DC2626;display:inline-block;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#DC2626;font-weight:700;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:900;color:#1F2937;font-size:13px;}.ed{font-size:10px;color:#DC2626;font-weight:700;}.ec{font-size:11px;color:#DC2626;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:900;color:#1F2937;margin-right:6px;text-transform:uppercase;}.sn{color:#6B7280;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div>${about ? `<section><p style="font-size:14px;font-style:italic;color:#374151;border-left:4px solid #DC2626;padding-left:12px;margin-bottom:18px;">${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── MONOCHROME (Grayscale only, Helvetica Neue, ultra-clean) ─────────────
function buildMonochromeHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Helvetica Neue','Arial',sans-serif;background:#E5E5E5;color:#18181B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.08);padding:28mm 26mm;}.header{margin-bottom:24px;}h1{font-size:28px;font-weight:300;color:#18181B;letter-spacing:2px;text-transform:uppercase;}.role{font-size:12px;color:#525252;margin-top:6px;letter-spacing:1px;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:10px;color:#A3A3A3;margin-top:14px;padding-top:14px;border-top:1px solid #E4E4E7;}section{margin-top:28px;}h2{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#18181B;font-weight:400;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #E4E4E7;}p,li{font-size:12px;line-height:1.8;color:#525252;font-weight:300;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:6px;}li::marker{color:#18181B;}.exp{margin-bottom:16px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:500;color:#18181B;font-size:12px;}.ed{font-size:10px;color:#A3A3A3;}.ec{font-size:11px;color:#525252;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:500;color:#18181B;margin-right:6px;}.sn{color:#737373;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── COPPER (Warm copper, Georgia, metallic) ──────────────────────────────
function buildCopperHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:Georgia,'Times New Roman',serif;background:#FEF3C7;color:#451A03;}.page{width:210mm;min-height:297mm;margin:12px auto;background:linear-gradient(180deg,#FFFBEB,#FEF3C7);box-shadow:0 2px 16px rgba(0,0,0,.1);padding:24mm 22mm;}.header{text-align:center;padding-bottom:14px;border-bottom:3px solid #B45309;margin-bottom:20px;}h1{font-size:32px;font-weight:700;color:#451A03;}.role{font-size:13px;color:#B45309;margin-top:6px;font-style:italic;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#92400E;margin-top:10px;}section{margin-top:22px;}h2{font-size:13px;letter-spacing:1.5px;text-transform:uppercase;color:#B45309;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #FDE68A;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#B45309;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#451A03;font-size:13px;}.ed{font-size:10px;color:#D97706;font-style:italic;}.ec{font-size:11.5px;color:#B45309;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#451A03;margin-right:6px;}.sn{color:#92400E;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── FOREST (Green, Merriweather, nature-inspired) ────────────────────────
function buildForestHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Merriweather','Georgia',serif;background:#F0FDF4;color:#14532D;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 12px rgba(0,0,0,.08);overflow:hidden;}.header{background:linear-gradient(135deg,#166534,#15803D);color:#fff;padding:26mm 24mm 20mm;position:relative;}.header::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:30px;background:#fff;clip-path:polygon(0 60%,100% 0,100% 100%,0 100%);}h1{font-size:30px;font-weight:700;color:#fff;position:relative;z-index:1;}.role{font-size:13px;color:#BBF7D0;margin-top:6px;position:relative;z-index:1;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#D1FAE5;margin-top:12px;position:relative;z-index:1;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:13px;letter-spacing:1px;text-transform:uppercase;color:#166534;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #BBF7D0;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#166534;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#14532D;font-size:13px;}.ed{font-size:10px;color:#22C55E;}.ec{font-size:11px;color:#166534;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#14532D;margin-right:6px;}.sn{color:#166534;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── ROYAL (Purple + gold, Palatino, ornate) ──────────────────────────────
function buildRoyalHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Professional Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join("; ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Areas of Expertise</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Honors</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Palatino Linotype','Book Antiqua',serif;background:#E9D5FF;color:#3B0764;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FEFBFF;box-shadow:0 4px 32px rgba(88,28,135,.2);padding:24mm 22mm;}.header{text-align:center;padding:20px;border:2px solid #581C87;margin-bottom:20px;background:linear-gradient(180deg,#FAF5FF,#F3E8FF);}h1{font-size:34px;font-weight:400;color:#3B0764;letter-spacing:2px;}.role{font-size:13px;color:#581C87;margin-top:6px;font-style:italic;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#7E22CE;margin-top:10px;}section{margin-top:24px;}h2{font-size:13px;letter-spacing:2px;text-transform:uppercase;color:#581C87;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #DDD6FE;text-align:center;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#7C3AED;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#3B0764;font-size:13px;}.ed{font-size:10px;color:#A855F7;font-style:italic;}.ec{font-size:11.5px;color:#581C87;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#3B0764;margin-right:6px;}.sn{color:#7E22CE;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── FUTURISTIC (Cyan, Rajdhani, geometric lines) ─────────────────────────
function buildFuturisticHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Rajdhani','Segoe UI',sans-serif;background:#ECFEFF;color:#0E7490;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 2px 16px rgba(0,0,0,.08);padding:22mm 20mm;border-top:4px solid #06B6D4;}.header{display:flex;justify-content:space-between;align-items:flex-end;padding-bottom:12px;border-bottom:1px solid #A5F3FC;margin-bottom:18px;}h1{font-size:28px;font-weight:700;color:#0E7490;letter-spacing:1px;}.role{font-size:12px;color:#06B6D4;text-transform:uppercase;letter-spacing:2px;margin-top:4px;}.contact{display:flex;gap:16px;flex-wrap:wrap;font-size:10px;color:#67E8F9;text-align:right;}section{margin-top:20px;}h2{font-size:11px;letter-spacing:3px;text-transform:uppercase;color:#06B6D4;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #A5F3FC;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#06B6D4;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#0E7490;font-size:13px;}.ed{font-size:10px;color:#22D3EE;}.ec{font-size:11px;color:#06B6D4;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#06B6D4;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:#ECFEFF;border:1px solid #A5F3FC;border-radius:4px;color:#0E7490;font-weight:600;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── HANDWRITTEN (Brown, Caveat, personal) ────────────────────────────────
function buildHandwrittenHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Work Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Caveat',cursive;background:#FEF3C7;color:#451A03;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FFFBEB;box-shadow:0 2px 12px rgba(0,0,0,.1);padding:26mm 24mm;border-left:6px solid #B45309;}h1{font-size:42px;font-weight:700;color:#451A03;}.role{font-size:16px;color:#92400E;margin-top:4px;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:12px;color:#78716C;margin-top:12px;padding-bottom:12px;border-bottom:2px dashed #D6D3D1;}section{margin-top:24px;}h2{font-size:18px;color:#92400E;margin-bottom:10px;padding-bottom:4px;border-bottom:1px dashed #D6D3D1;}p,li{font-size:13px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#B45309;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#451A03;font-size:14px;}.ed{font-size:11px;color:#D97706;}.ec{font-size:12px;color:#92400E;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:13px;}.sc{font-weight:700;color:#451A03;margin-right:6px;}.sn{color:#78716C;}</style></head><body><div class="page"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── ZEN (Teal, Inter, minimal, meditative) ──────────────────────────────
function buildZenHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Inter','Segoe UI',sans-serif;background:#F0FDFA;color:#134E4A;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:32mm 28mm;}.header{margin-bottom:32px;text-align:center;}h1{font-size:28px;font-weight:200;color:#134E4A;letter-spacing:3px;}.role{font-size:12px;color:#0F766E;margin-top:8px;font-weight:300;letter-spacing:2px;}.contact{display:flex;justify-content:center;gap:24px;flex-wrap:wrap;font-size:10px;color:#99F6E4;margin-top:16px;}section{margin-top:28px;}h2{font-size:10px;letter-spacing:4px;text-transform:uppercase;color:#0F766E;font-weight:300;margin-bottom:14px;padding-bottom:6px;border-bottom:1px solid #99F6E4;}p,li{font-size:12px;line-height:1.8;color:#374151;font-weight:300;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:6px;}li::marker{color:#0F766E;}.exp{margin-bottom:16px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:400;color:#134E4A;font-size:12px;}.ed{font-size:10px;color:#99F6E4;}.ec{font-size:11px;color:#0F766E;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:400;color:#134E4A;margin-right:6px;}.sn{color:#5EEAD4;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── POP ART (Rose, Poppins, bold colors, geometric) ─────────────────────
function buildPopHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Poppins','Segoe UI',sans-serif;background:#FFF1F2;color:#1F2937;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.12);overflow:hidden;}.header{background:#E11D48;color:#fff;padding:20mm 24mm 16mm;display:flex;justify-content:space-between;align-items:flex-end;}h1{font-size:36px;font-weight:900;color:#fff;}.role{font-size:13px;color:#FECDD3;margin-top:4px;}.contact{font-size:10px;color:#FFE4E6;text-align:right;line-height:1.8;}.body{padding:16mm 24mm;}section{margin-top:20px;}h2{font-size:14px;letter-spacing:1px;text-transform:uppercase;color:#E11D48;font-weight:900;margin-bottom:10px;padding-bottom:6px;border-bottom:3px solid #FECDD3;}p,li{font-size:12px;line-height:1.7;color:#374151;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#E11D48;}.exp{margin-bottom:14px;background:#FFF1F2;padding:12px;border-radius:8px;border-left:4px solid #E11D48;}.eh{display:flex;justify-content:space-between;}.er{font-weight:900;color:#1F2937;font-size:13px;}.ed{font-size:10px;color:#FB7185;}.ec{font-size:11px;color:#E11D48;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:900;color:#E11D48;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:#E11D48;color:#fff;border-radius:20px;font-weight:700;}</style></head><body><div class="page"><div class="header"><div><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div></div><div class="contact">${contact.map((c) => `<div>${esc(c)}</div>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── CARBON (Dark gray, Source Code Pro, carbon fiber) ────────────────────
function buildCarbonHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>EXPERIENCE</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>EDUCATION</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>SKILLS</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>CERTIFICATIONS</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Source Code Pro','Courier New',monospace;background:#0A0A0A;color:#D4D4D8;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#18181B;box-shadow:0 4px 24px rgba(0,0,0,.3);padding:22mm 20mm;border:1px solid #3F3F46;}.header{border-bottom:1px solid #3F3F46;padding-bottom:12px;margin-bottom:18px;}h1{font-size:24px;font-weight:700;color:#F5F5F4;}.role{font-size:11px;color:#525252;margin-top:4px;letter-spacing:1px;text-transform:uppercase;}.contact{display:flex;gap:16px;flex-wrap:wrap;font-size:10px;color:#A3A3A3;margin-top:10px;}section{margin-top:20px;}h2{font-size:10px;letter-spacing:3px;text-transform:uppercase;color:#525252;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #3F3F46;}p,li{font-size:11.5px;line-height:1.7;color:#D4D4D8;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#525252;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#F5F5F4;font-size:12.5px;}.ed{font-size:10px;color:#525252;}.ec{font-size:11px;color:#A3A3A3;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#737373;margin-right:6px;text-transform:uppercase;}.sn{color:#D4D4D8;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── PEARL (Light gray, Cormorant, elegant subtle) ────────────────────────
function buildPearlHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Cormorant Garamond','Georgia',serif;background:#F5F5F4;color:#292524;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FAFAF9;box-shadow:0 1px 8px rgba(0,0,0,.06);padding:28mm 26mm;}.header{text-align:center;margin-bottom:28px;}h1{font-size:36px;font-weight:300;color:#292524;letter-spacing:3px;}.role{font-size:13px;color:#78716C;margin-top:8px;font-style:italic;}.contact{display:flex;justify-content:center;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#A8A29E;margin-top:14px;padding-top:14px;border-top:1px solid #E7E5E4;}section{margin-top:26px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#78716C;font-weight:400;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #E7E5E4;text-align:center;}p,li{font-size:12.5px;line-height:1.7;color:#44403C;font-weight:300;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#A8A29E;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:500;color:#292524;font-size:13px;}.ed{font-size:10px;color:#A8A29E;font-style:italic;}.ec{font-size:11.5px;color:#78716C;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:500;color:#78716C;margin-right:6px;}.sn{color:#A8A29E;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── SUNSET (Orange, Nunito, warm gradient) ──────────────────────────────
function buildSunsetHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><div class="tags">${names.map((n) => `<span class="tag">${esc(n)}</span>`).join("")}</div></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Nunito','Segoe UI',sans-serif;background:#FFF7ED;color:#431407;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.1);overflow:hidden;}.header{background:linear-gradient(135deg,#EA580C,#F97316);color:#fff;padding:24mm 24mm 20mm;position:relative;}.header::after{content:"";position:absolute;bottom:-1px;left:0;right:0;height:30px;background:#fff;clip-path:ellipse(55% 100% at 50% 100%);}h1{font-size:32px;font-weight:700;color:#fff;position:relative;z-index:1;}.role{font-size:13px;color:#FED7AA;margin-top:6px;position:relative;z-index:1;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#FFEDD5;margin-top:12px;position:relative;z-index:1;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#EA580C;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #FED7AA;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#EA580C;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#431407;font-size:13px;}.ed{font-size:10px;color:#FB923C;}.ec{font-size:11px;color:#EA580C;margin-bottom:4px;}.sg{margin-bottom:8px;}.sc{font-size:10px;font-weight:700;color:#EA580C;margin-bottom:3px;text-transform:uppercase;}.tags{display:flex;flex-wrap:wrap;gap:4px;}.tag{font-size:9px;padding:3px 10px;background:#FFF7ED;border:1px solid #FED7AA;border-radius:20px;color:#C2410C;font-weight:600;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── ARCTIC (Sky blue, Quicksand, cold clean) ────────────────────────────
function buildArcticHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Quicksand','Segoe UI',sans-serif;background:#F0F9FF;color:#0C4A6E;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 1px 12px rgba(0,0,0,.06);padding:28mm 24mm;}.header{text-align:center;margin-bottom:28px;padding-bottom:20px;border-bottom:2px solid #BAE6FD;}h1{font-size:30px;font-weight:600;color:#0C4A6E;}.role{font-size:13px;color:#0EA5E9;margin-top:6px;}.contact{display:flex;justify-content:center;gap:22px;flex-wrap:wrap;font-size:10.5px;color:#7DD3FC;margin-top:12px;}section{margin-top:26px;}h2{font-size:12px;letter-spacing:2px;text-transform:uppercase;color:#0EA5E9;font-weight:600;margin-bottom:12px;padding-bottom:6px;border-bottom:1px solid #BAE6FD;text-align:center;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#0EA5E9;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#0C4A6E;font-size:13px;}.ed{font-size:10px;color:#7DD3FC;}.ec{font-size:11px;color:#0EA5E9;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:600;color:#0C4A6E;margin-right:6px;}.sn{color:#0EA5E9;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── TERRACOTTA (Warm earthy, Lora serif) ─────────────────────────────────
function buildTerracottaHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Lora','Georgia',serif;background:#FFF7ED;color:#431407;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#FFFBEB;box-shadow:0 2px 12px rgba(0,0,0,.08);padding:26mm 24mm;border-left:6px solid #C2410C;}.header{margin-bottom:22px;}h1{font-size:32px;font-weight:700;color:#431407;}.role{font-size:13px;color:#C2410C;margin-top:6px;font-style:italic;}.contact{display:flex;gap:20px;flex-wrap:wrap;font-size:10.5px;color:#A16207;margin-top:10px;padding-top:10px;border-top:1px solid #FDE68A;}section{margin-top:24px;}h2{font-size:14px;color:#C2410C;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:1px solid #FDE68A;}p,li{font-size:12px;line-height:1.7;color:#44403C;}ul{margin-left:16px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#C2410C;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#431407;font-size:13px;}.ed{font-size:10px;color:#D97706;font-style:italic;}.ec{font-size:11.5px;color:#C2410C;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#431407;margin-right:6px;}.sn{color:#92400E;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div>${about ? `<section><p>${esc(about)}</p></section>` : ""}${eduHtml}${expHtml}${skillsHtml}${certHtml}</div></body></html>`;
}

// ─── INDIGO NIGHT (Deep indigo, Work Sans, professional) ──────────────────
function buildIndigoHtml(p: PortfolioData): string {
  const contact = contactParts(p);
  const about = p.about ? stripHtml(p.about) : "";
  let expHtml = "";
  if (p.experience?.length) { const items = p.experience.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.role)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.company)}</div>${(e.accomplishments||[]).length ? `<ul>${bulletHtml(e.accomplishments || [])}</ul>` : ""}</div>`).join("\n"); expHtml = `<section><h2>Experience</h2>${items}</section>`; }
  let eduHtml = "";
  if (p.education?.length) { const items = p.education.map((e) => `<div class="exp"><div class="eh"><span class="er">${esc(e.degree)} in ${esc(e.field)}</span><span class="ed">${esc(e.startDate)} – ${esc(e.endDate || "Present")}</span></div><div class="ec">${esc(e.institution)}</div></div>`).join("\n"); eduHtml = `<section><h2>Education</h2>${items}</section>`; }
  let skillsHtml = "";
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { const items = Object.entries(groups).map(([cat, names]) => `<div class="sg"><span class="sc">${esc(cat)}</span><span class="sn">${names.map(esc).join(", ")}</span></div>`).join("\n"); skillsHtml = `<section><h2>Skills</h2>${items}</section>`; }
  let certHtml = "";
  if (p.certifications?.length) { const items = p.certifications.map((c) => `<li>${esc(c.name)} — ${esc(c.issuer)}</li>`).join("\n"); certHtml = `<section><h2>Certifications</h2><ul>${items}</ul></section>`; }
  return `<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"><title>${esc(p.name)} — CV</title><style>@page{size:A4;margin:0;}*{box-sizing:border-box;margin:0;padding:0;}body{font-family:'Work Sans','Segoe UI',sans-serif;background:#EEF2FF;color:#1E1B4B;}.page{width:210mm;min-height:297mm;margin:12px auto;background:#fff;box-shadow:0 4px 24px rgba(0,0,0,.1);overflow:hidden;}.header{background:linear-gradient(135deg,#312E81,#3730A3);color:#fff;padding:26mm 24mm 20mm;}.header::after{content:"";display:block;height:4px;background:linear-gradient(90deg,#818CF8,#C7D2FE,#818CF8);}h1{font-size:32px;font-weight:700;color:#fff;}.role{font-size:13px;color:#C7D2FE;margin-top:6px;}.contact{display:flex;gap:18px;flex-wrap:wrap;font-size:10.5px;color:#E0E7FF;margin-top:12px;}.body{padding:18mm 24mm;}section{margin-top:20px;}h2{font-size:12px;letter-spacing:1.5px;text-transform:uppercase;color:#3730A3;font-weight:700;margin-bottom:10px;padding-bottom:6px;border-bottom:2px solid #C7D2FE;}p,li{font-size:12px;line-height:1.7;color:#334155;}ul{margin-left:14px;margin-top:4px;}li{margin-bottom:5px;}li::marker{color:#3730A3;}.exp{margin-bottom:14px;}.eh{display:flex;justify-content:space-between;}.er{font-weight:700;color:#1E1B4B;font-size:13px;}.ed{font-size:10px;color:#818CF8;}.ec{font-size:11px;color:#3730A3;margin-bottom:4px;}.sg{margin-bottom:5px;font-size:12px;}.sc{font-weight:700;color:#1E1B4B;margin-right:6px;}.sn{color:#4338CA;}</style></head><body><div class="page"><div class="header"><h1>${esc(p.name)}</h1><div class="role">${esc(p.title)}</div><div class="contact">${contact.map((c) => `<span>${esc(c)}</span>`).join("")}</div></div><div class="body">${about ? `<section><p>${esc(about)}</p></section>` : ""}${expHtml}${eduHtml}${skillsHtml}${certHtml}</div></div></body></html>`;
}

// ─── PUBLIC API ────────────────────────────────────────────────────────────

function buildHtmlTemplate(p: PortfolioData, template: CvTemplate): string {
  switch (template) {
    case "executive": return buildExecutiveHtml(p);
    case "minimal": return buildMinimalHtml(p);
    case "sidebar": return buildSidebarHtml(p);
    case "simplified": return buildSimplifiedHtml(p);
    case "modern": return buildModernHtml(p);
    case "creative": return buildCreativeHtml(p);
    case "minimalist": return buildMinimalistHtml(p);
    case "freshgraduate": return buildFreshGraduateHtml(p);
    case "techportfolio": return buildTechPortfolioHtml(p);
    case "functional": return buildFunctionalHtml(p);
    case "combination": return buildCombinationHtml(p);
    case "academic": return buildAcademicHtml(p);
    case "timeline": return buildTimelineHtml(p);
    case "twocol": return buildTwocolHtml(p);
    case "infographic": return buildInfographicHtml(p);
    case "darkmode": return buildDarkmodeHtml(p);
    case "corporate": return buildCorporateHtml(p);
    case "millennial": return buildMillennialHtml(p);
    case "ivy": return buildIvyHtml(p);
    case "everest": return buildEverestHtml(p);
    case "quick": return buildQuickHtml(p);
    case "photo": return buildPhotoHtml(p);
    case "cleanelegant": return buildCleanElegantHtml(p);
    case "modernbasic": return buildModernBasicHtml(p);
    case "harvard": return buildHarvardHtml(p);
    case "europass": return buildEuropassHtml(p);
    case "metro": return buildMetroHtml(p);
    case "creativebeige": return buildCreativeBeigeHtml(p);
    case "corporateats": return buildCorporateAtsHtml(p);
    case "boldgraphic": return buildBoldGraphicHtml(p);
    case "scienceeng": return buildScienceEngHtml(p);
    case "calligraphic": return buildCalligraphicHtml(p);
    case "elegant": return buildElegantHtml(p);
    case "gradient": return buildGradientHtml(p);
    case "retro": return buildRetroHtml(p);
    case "conservative": return buildConservativeHtml(p);
    case "artistic": return buildArtisticHtml(p);
    case "ultraminimal": return buildUltraminimalHtml(p);
    case "techstack": return buildTechstackHtml(p);
    case "businesspro": return buildBusinessproHtml(p);
    case "academiccv": return buildAcademiccvHtml(p);
    case "mosaic": return buildMosaicHtml(p);
    case "brutalist": return buildBrutalistHtml(p);
    case "watercolor": return buildWatercolorHtml(p);
    case "neon": return buildNeonHtml(p);
    case "vintage": return buildVintageHtml(p);
    case "geometric": return buildGeometricHtml(p);
    case "magazine": return buildMagazineHtml(p);
    case "monochrome": return buildMonochromeHtml(p);
    case "copper": return buildCopperHtml(p);
    case "forest": return buildForestHtml(p);
    case "royal": return buildRoyalHtml(p);
    case "futuristic": return buildFuturisticHtml(p);
    case "handwritten": return buildHandwrittenHtml(p);
    case "zen": return buildZenHtml(p);
    case "pop": return buildPopHtml(p);
    case "carbon": return buildCarbonHtml(p);
    case "pearl": return buildPearlHtml(p);
    case "sunset": return buildSunsetHtml(p);
    case "arctic": return buildArcticHtml(p);
    case "terracotta": return buildTerracottaHtml(p);
    case "indigo": return buildIndigoHtml(p);
    default: return buildExecutiveHtml(p);
  }
}

function buildSimplifiedDocx(p: PortfolioData): Document {
  const c = COLORS.simplified;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 28, font: "Arial", color: c.heading })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 60 },
    children: [new TextRun({ text: p.title, size: 19, font: "Arial", color: "666666" })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 100 },
    children: contactParts(p).map((c, i, arr) =>
      new TextRun({ text: c + (i < arr.length - 1 ? "  |  " : ""), size: 17, font: "Arial", color: "666666" }),
    ),
  }));

  if (p.about) {
    children.push(sectionHeading("Professional Summary", c.heading));
    children.push(new Paragraph({ spacing: { after: 80 }, alignment: AlignmentType.JUSTIFIED, children: [new TextRun({ text: stripHtml(p.about), size: 20, font: "Arial", color: "333333" })] }));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Professional Experience", c.heading));
    for (const e of p.experience) {
      children.push(new Paragraph({
        spacing: { before: 180, after: 40 },
        children: [
          new TextRun({ text: e.role, bold: true, size: 21, font: "Arial", color: c.heading }),
          new TextRun({ text: ` — ${e.company}`, size: 21, font: "Arial", color: "555555" }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 17, font: "Arial", color: "999999" }),
        ],
      }));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.heading));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} — ${e.institution}`, bold: true, size: 20, font: "Arial", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 17, font: "Arial", color: "999999" }),
        ],
      }));
      if (e.grade && e.grade !== "null") children.push(bodyText(`Grade: ${e.grade}`, { size: 17, color: "999999" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Core Competencies", c.heading));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }),
          new TextRun({ text: names.join(", "), size: 20, font: "Arial", color: "444444" }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications & Qualifications", c.heading));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, size: 20, font: "Arial", color: c.heading }),
          new TextRun({ text: cert.issuer ? ` — ${cert.issuer}` : "", size: 20, font: "Arial", color: "666666" }),
          new TextRun({ text: cert.date && cert.date !== "null" ? ` (${cert.date})` : "", size: 18, font: "Arial", color: "999999" }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── MODERN DOCX ──────────────────────────────────────────────────────────
function buildModernDocx(p: PortfolioData): Document {
  const c = COLORS.modern;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 36, font: "Calibri", color: "FFFFFF" })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 18, font: "Calibri", color: c.accent, characterSpacing: 60 })],
  }));
  children.push(contactLine(p, "94A3B8"));

  if (p.about) {
    children.push(sectionHeading("Profile", c.accent));
    children.push(bodyText(stripHtml(p.about)));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "94A3B8" }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, color: "64748B" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Skills", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: names.join(" · "), size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── CREATIVE DOCX ────────────────────────────────────────────────────────
function buildCreativeDocx(p: PortfolioData): Document {
  const c = COLORS.creative;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Calibri", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Calibri", color: c.accent, characterSpacing: 60 })],
  }));
  children.push(contactLine(p, c.accent));

  if (p.about) {
    children.push(sectionHeading("Profile", c.accent));
    children.push(bodyText(stripHtml(p.about)));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "94A3B8" }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, color: "64748B" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Skills", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── MINIMALIST DOCX ──────────────────────────────────────────────────────
function buildMinimalistDocx(p: PortfolioData): Document {
  const c = COLORS.minimalist;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, size: 36, font: "Calibri Light", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 18, font: "Calibri", color: c.accent, characterSpacing: 80 })],
  }));
  children.push(contactLine(p, "71717A"));

  if (p.about) {
    children.push(sectionHeading("Profile", c.accent));
    children.push(bodyText(stripHtml(p.about)));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "A1A1AA" }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, color: "71717A" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Skills", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: "71717A" }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: "71717A" }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── FRESH GRADUATE DOCX ──────────────────────────────────────────────────
function buildFreshGraduateDocx(p: PortfolioData): Document {
  const c = COLORS.freshgraduate;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Calibri", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Calibri", color: c.accent, characterSpacing: 60 })],
  }));
  children.push(contactLine(p, "6B7280"));

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "9CA3AF" }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · GPA: ${e.grade}` : ""), { size: 20, color: "6B7280" }));
    }
  }

  if (p.about) {
    children.push(sectionHeading("Professional Summary", c.accent));
    children.push(bodyText(stripHtml(p.about)));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Skills", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── TECH PORTFOLIO DOCX ──────────────────────────────────────────────────
function buildTechPortfolioDocx(p: PortfolioData): Document {
  const c = COLORS.techportfolio;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 30, font: "Consolas", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Consolas", color: c.accent, characterSpacing: 40 })],
  }));
  children.push(contactLine(p, "A8A29E"));

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Technical Skills", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Consolas", color: c.heading }),
          new TextRun({ text: names.join(", "), size: 20, font: "Consolas", color: c.text }),
        ],
      }));
    }
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Consolas", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Consolas", color: "A8A29E" }),
        ],
      }));
      children.push(bodyText(e.institution, { size: 20, font: "Consolas", color: "44403C" }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Consolas", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Consolas", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── FUNCTIONAL DOCX ──────────────────────────────────────────────────────
function buildFunctionalDocx(p: PortfolioData): Document {
  const c = COLORS.functional;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, size: 32, font: "Georgia", color: c.heading })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Georgia", color: c.accent, characterSpacing: 60 })],
  }));
  children.push(contactLine(p, "6B7280"));

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Core Competencies", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 60 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Georgia", color: c.heading }),
          new TextRun({ text: names.join(", "), size: 20, font: "Georgia", color: c.text }),
        ],
      }));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Georgia", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Georgia", color: "9CA3AF" }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, font: "Georgia", color: "6B7280" }));
    }
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Relevant Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Georgia", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Georgia", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── COMBINATION DOCX ─────────────────────────────────────────────────────
function buildCombinationDocx(p: PortfolioData): Document {
  const c = COLORS.combination;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Calibri", color: c.heading })],
  }));
  children.push(new Paragraph({
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Calibri", color: c.accent, characterSpacing: 60 })],
  }));
  children.push(contactLine(p, "64748B"));

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Skills Summary", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: names.join(" · "), size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  if (p.about) {
    children.push(sectionHeading("Professional Summary", c.accent));
    children.push(bodyText(stripHtml(p.about)));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Professional Experience", c.accent));
    for (const e of p.experience) {
      children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text));
    }
  }

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "94A3B8" }),
        ],
      }));
      children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, color: "64748B" }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Calibri", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── ACADEMIC DOCX ────────────────────────────────────────────────────────
function buildAcademicDocx(p: PortfolioData): Document {
  const c = COLORS.academic;
  const children: Paragraph[] = [];

  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 40 },
    children: [new TextRun({ text: p.name, size: 34, font: "Garamond", color: c.heading })],
  }));
  children.push(new Paragraph({
    alignment: AlignmentType.CENTER,
    spacing: { after: 80 },
    children: [new TextRun({ text: p.title, italic: true, size: 18, font: "Garamond", color: c.accent })],
  }));
  children.push(contactLine(p, "78716C"));

  if (p.education?.length) {
    children.push(sectionHeading("Education", c.accent));
    for (const e of p.education) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Garamond", color: c.heading }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Garamond", color: "A8A29E" }),
        ],
      }));
      children.push(bodyText(e.institution, { size: 20, font: "Garamond", color: "78716C" }));
      if (e.grade && e.grade !== "null") {
        children.push(new Paragraph({
          spacing: { after: 40 },
          children: [new TextRun({ text: `GPA: ${e.grade}`, bold: true, size: 20, font: "Garamond", color: c.accent })],
        }));
      }
    }
  }

  if (p.about) {
    children.push(sectionHeading("Research Interests", c.accent));
    children.push(bodyText(stripHtml(p.about), { font: "Garamond" }));
  }

  if (p.experience?.length) {
    children.push(sectionHeading("Research & Experience", c.accent));
    for (const e of p.experience) {
      children.push(new Paragraph({
        spacing: { before: 120, after: 40 },
        children: [
          new TextRun({ text: e.role, bold: true, size: 21, font: "Garamond", color: c.heading }),
          new TextRun({ text: ` — `, size: 20, font: "Garamond", color: "D6D3D1" }),
          new TextRun({ text: e.company, italics: true, size: 20, font: "Garamond", color: c.accent }),
          new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Garamond", color: "A8A29E" }),
        ],
      }));
      if (e.description) children.push(bodyText(e.description, { font: "Garamond" }));
      for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Garamond" }));
    }
  }

  const groups = groupByCategory(p.skills || []);
  if (Object.keys(groups).length) {
    children.push(sectionHeading("Areas of Expertise", c.accent));
    for (const [cat, names] of Object.entries(groups)) {
      children.push(new Paragraph({
        spacing: { after: 40 },
        children: [
          new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Garamond", color: c.heading }),
          new TextRun({ text: names.join("; "), size: 20, font: "Garamond", color: "78716C" }),
        ],
      }));
    }
  }

  if (p.certifications?.length) {
    children.push(sectionHeading("Certifications & Awards", c.accent));
    for (const cert of p.certifications) {
      children.push(new Paragraph({
        bullet: { level: 0 },
        spacing: { after: 40 },
        children: [
          new TextRun({ text: cert.name, bold: true, size: 20, font: "Garamond", color: c.heading }),
          new TextRun({ text: ` — ${cert.issuer}${cert.date && cert.date !== "null" ? ` (${cert.date})` : ""}`, size: 20, font: "Garamond", color: c.text }),
        ],
      }));
    }
  }

  return new Document({ sections: [{ children }] });
}

// ─── TIMELINE DOCX ────────────────────────────────────────────────────────
function buildTimelineDocx(p: PortfolioData): Document {
  const c = COLORS.timeline;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Segoe UI", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Segoe UI", color: c.accent, characterSpacing: 60 })] }));
  children.push(contactLine(p, "6B7280"));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Segoe UI", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Segoe UI", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, color: "6B7280" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Segoe UI", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Segoe UI", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Segoe UI", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Segoe UI", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── TWO-COLUMN DOCX ──────────────────────────────────────────────────────
function buildTwocolDocx(p: PortfolioData): Document {
  const c = COLORS.twocol;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 30, font: "Helvetica Neue", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Helvetica Neue", color: c.accent, characterSpacing: 40 })] }));
  children.push(contactLine(p, "64748B"));
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Helvetica Neue", color: "94A3B8" })] })); children.push(bodyText(e.institution, { size: 20, color: "64748B" })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── INFOGRAPHIC DOCX ─────────────────────────────────────────────────────
function buildInfographicDocx(p: PortfolioData): Document {
  const c = COLORS.infographic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Segoe UI", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Segoe UI", color: c.accent, characterSpacing: 60 })] }));
  children.push(contactLine(p, "6B7280"));
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Segoe UI", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Segoe UI", color: c.text })] })); } }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Segoe UI", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Segoe UI", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, color: "6B7280" })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Segoe UI", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Segoe UI", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── DARK MODE DOCX ───────────────────────────────────────────────────────
function buildDarkmodeDocx(p: PortfolioData): Document {
  const c = COLORS.darkmode;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Consolas", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Consolas", color: c.accent, characterSpacing: 40 })] }));
  children.push(contactLine(p, "64748B"));
  if (p.about) { children.push(sectionHeading("Profile", c.accent)); children.push(bodyText(stripHtml(p.about), { color: "CBD5E1" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Consolas", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Consolas", color: "64748B" })] })); children.push(bodyText(e.institution, { size: 20, font: "Consolas", color: "CBD5E1" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Consolas", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Consolas", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Consolas", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Consolas", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CORPORATE DOCX ───────────────────────────────────────────────────────
function buildCorporateDocx(p: PortfolioData): Document {
  const c = COLORS.corporate;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 34, font: "Arial", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Arial", color: c.accent, characterSpacing: 80 })] }));
  children.push(contactLine(p, "9CA3AF"));
  if (p.about) { children.push(sectionHeading("Professional Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Arial", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Arial", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, color: "6B7280" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Core Competencies", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: names.join(" · "), size: 20, font: "Arial", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Arial", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── MILLENNIAL DOCX ──────────────────────────────────────────────────────
function buildMillennialDocx(p: PortfolioData): Document {
  const c = COLORS.millennial;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Poppins", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Poppins", color: c.accent, characterSpacing: 60 })] }));
  children.push(contactLine(p, "6B7280"));
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Poppins", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Poppins", color: c.text })] })); } }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Poppins", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Poppins", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, color: "6B7280" })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Poppins", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Poppins", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── IVY LEAGUE DOCX ──────────────────────────────────────────────────────
function buildIvyDocx(p: PortfolioData): Document {
  const c = COLORS.ivy;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, size: 34, font: "Garamond", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italic: true, size: 18, font: "Garamond", color: c.accent })] }));
  children.push(contactLine(p, "78716C"));
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Garamond", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Garamond", color: "A8A29E" })] })); children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, font: "Garamond", color: "78716C" })); } }
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Garamond" })); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Garamond" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Areas of Expertise", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: names.join("; "), size: 20, font: "Garamond", color: "78716C" })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Honors & Awards", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Garamond", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── EVEREST DOCX ─────────────────────────────────────────────────────────
function buildEverestDocx(p: PortfolioData): Document {
  const c = COLORS.everest;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Helvetica Neue", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Helvetica Neue", color: c.accent, characterSpacing: 60 })] }));
  children.push(contactLine(p, "71717A"));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Helvetica Neue", color: "A1A1AA" })] })); children.push(bodyText(e.institution, { size: 20, color: "71717A" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── QUICK DOCX ───────────────────────────────────────────────────────────
function buildQuickDocx(p: PortfolioData): Document {
  const c = COLORS.quick;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Arial", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Arial", color: c.accent, characterSpacing: 60 })] }));
  children.push(contactLine(p, "A5B4FC"));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Arial", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Arial", color: "94A3B8" })] })); children.push(bodyText(e.institution, { size: 20, color: "475569" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Arial", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Arial", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── PHOTO DOCX ───────────────────────────────────────────────────────────
function buildPhotoDocx(p: PortfolioData): Document {
  const c = COLORS.photo;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Segoe UI", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Segoe UI", color: c.accent, characterSpacing: 60 })] }));
  children.push(contactLine(p, "6B7280"));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Segoe UI", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Segoe UI", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, color: "6B7280" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Segoe UI", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Segoe UI", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Segoe UI", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Segoe UI", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CLEAN ELEGANT DOCX ───────────────────────────────────────────────────
function buildCleanElegantDocx(p: PortfolioData): Document {
  const c = COLORS.cleanelegant;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, size: 36, font: "Calibri", color: c.heading, bold: true })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, size: 20, font: "Calibri", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: "D1D5DB", space: 4, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Calibri", color: "6B7280" })] }));
  if (p.about) { children.push(sectionHeading("Professional Summary", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Calibri" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Calibri" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Calibri" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, font: "Calibri", color: "6B7280" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── MODERN BASIC DOCX ────────────────────────────────────────────────────
function buildModernBasicDocx(p: PortfolioData): Document {
  const c = COLORS.modernbasic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: c.accent }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 36, font: "Inter", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: c.accent }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Inter", color: "E0E7FF" })] }));
  children.push(contactLine(p, "475569"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Inter" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Inter" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Inter" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Inter", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Inter", color: "94A3B8" })] })); children.push(bodyText(e.institution, { size: 20, font: "Inter", color: "475569" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Inter", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Inter", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Inter", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Inter", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── HARVARD DOCX ─────────────────────────────────────────────────────────
function buildHarvardDocx(p: PortfolioData): Document {
  const c = COLORS.harvard;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 2 } }, children: [new TextRun({ text: p.name, size: 36, font: "Garamond", color: c.heading, bold: true })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italic: true, size: 20, font: "Garamond", color: c.accent })] }));
  children.push(contactLine(p, "78716C"));
  if (p.about) { children.push(sectionHeading("Personal Statement", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Garamond" })); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Garamond" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Garamond" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Garamond", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Garamond", color: "A8A29E" })] })); children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · ${e.grade}` : ""), { size: 20, font: "Garamond", color: "78716C" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Areas of Expertise", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: names.join("; "), size: 20, font: "Garamond", color: "78716C" })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Honors & Awards", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Garamond", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── EUROPASS DOCX ────────────────────────────────────────────────────────
function buildEuropassDocx(p: PortfolioData): Document {
  const c = COLORS.europass;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: c.accent }, children: [new TextRun({ text: `    ${p.name.toUpperCase()}`, bold: true, size: 32, font: "Calibri", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, shading: { fill: "DBEAFE" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Calibri", color: c.accent })] }));
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: "Personal Information", bold: true, size: 22, font: "Calibri", color: c.accent })] }));
  children.push(contactLine(p, "4B5563"));
  if (p.about) { children.push(sectionHeading("I Seek To", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Calibri" })); }
  if (p.experience?.length) { children.push(sectionHeading("Work Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Calibri" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Calibri" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education and Training", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "9CA3AF" })] })); children.push(bodyText(e.institution, { size: 20, font: "Calibri", color: "4B5563" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Personal Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Additional Information", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── METRO DOCX ───────────────────────────────────────────────────────────
function buildMetroDocx(p: PortfolioData): Document {
  const c = COLORS.metro;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 34, font: "Arial", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Arial", color: c.accent, characterSpacing: 80 })] }));
  children.push(contactLine(p, "64748B"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Arial" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Arial" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Arial" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Arial", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Arial", color: "94A3B8" })] })); children.push(bodyText(e.institution, { size: 20, font: "Arial", color: "64748B" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Arial", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Arial", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CREATIVE BEIGE DOCX ──────────────────────────────────────────────────
function buildCreativeBeigeDocx(p: PortfolioData): Document {
  const c = COLORS.creativebeige;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 34, font: "Georgia", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title, size: 20, font: "Georgia", color: c.accent })] }));
  children.push(contactLine(p, "A16207"));
  if (p.about) { children.push(sectionHeading("About Me", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Georgia" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Georgia" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Georgia" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Georgia", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Georgia", color: "92400E" })] })); children.push(bodyText(e.institution, { size: 20, font: "Georgia", color: "A16207" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Georgia", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Georgia", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Georgia", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Georgia", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CORPORATE ATS DOCX ──────────────────────────────────────────────────
function buildCorporateAtsDocx(p: PortfolioData): Document {
  const c = COLORS.corporateats;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 32, font: "Arial", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title, size: 20, font: "Arial", color: c.accent })] }));
  children.push(contactLine(p, "374151"));
  if (p.about) { children.push(sectionHeading("Professional Summary", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Arial" })); }
  if (p.experience?.length) { children.push(sectionHeading("Work Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Arial" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Arial" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Arial", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Arial", color: "6B7280" })] })); children.push(bodyText(e.institution, { size: 20, font: "Arial", color: "374151" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Core Competencies", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Arial", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Arial", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── BOLD GRAPHIC DOCX ───────────────────────────────────────────────────
function buildBoldGraphicDocx(p: PortfolioData): Document {
  const c = COLORS.boldgraphic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: c.accent }, children: [new TextRun({ text: `    ${p.name.toUpperCase()}`, bold: true, size: 36, font: "Arial", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: c.accent }, children: [new TextRun({ text: `    ${p.title}`, bold: true, size: 20, font: "Arial", color: "FCA5A5" })] }));
  children.push(contactLine(p, "1F2937"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Arial" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Arial" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Arial" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Arial", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Arial", color: "6B7280" })] })); children.push(bodyText(e.institution, { size: 20, font: "Arial", color: "1F2937" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Arial", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Arial", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── SCIENCE ENGINEERING DOCX ─────────────────────────────────────────────
function buildScienceEngDocx(p: PortfolioData): Document {
  const c = COLORS.scienceeng;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Courier New", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, size: 20, font: "Courier New", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 4, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join(" | "), size: 18, font: "Courier New", color: "374151" })] }));
  if (p.about) { children.push(sectionHeading("Research Interests", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Courier New" })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Courier New" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Courier New" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Courier New", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Courier New", color: "6B7280" })] })); children.push(bodyText(e.institution, { size: 20, font: "Courier New", color: "374151" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Technical Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Courier New", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Publications & Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Courier New", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CALLIGRAPHIC DOCX ────────────────────────────────────────────────────
function buildCalligraphicDocx(p: PortfolioData): Document {
  const c = COLORS.calligraphic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, italics: true, size: 36, font: "Palatino Linotype", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Palatino Linotype", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Palatino Linotype", color: "92400E" })] }));
  if (p.about) { children.push(sectionHeading("Personal Summary", c.accent)); children.push(bodyText(stripHtml(p.about), { font: "Palatino Linotype" })); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent, { font: "Palatino Linotype" })); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text, { font: "Palatino Linotype" })); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Palatino Linotype", color: "92400E" })] })); children.push(bodyText(e.institution, { size: 20, font: "Palatino Linotype", color: "A16207" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Areas of Expertise", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: names.join("; "), size: 20, font: "Palatino Linotype", color: "92400E" })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Awards & Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ELEGANT DOCX ─────────────────────────────────────────────────────────
function buildElegantDocx(p: PortfolioData): Document {
  const c = COLORS.elegant;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, border: { color: c.accent, style: BorderStyle.SINGLE, size: 2 }, children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 36, font: "Palatino Linotype", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Palatino Linotype", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 4, style: BorderStyle.SINGLE, size: 2 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Palatino Linotype", color: "92400E" })] }));
  if (p.about) { children.push(sectionHeading("Professional Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Palatino Linotype", color: "A16207" })] })); children.push(bodyText(e.institution, { size: 20, color: "92400E" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Core Competencies", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Awards & Honors", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── GRADIENT DOCX ────────────────────────────────────────────────────────
function buildGradientDocx(p: PortfolioData): Document {
  const c = COLORS.gradient;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "6D28D9" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Inter", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "7C3AED" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Inter", color: "DDD6FE" })] }));
  children.push(contactLine(p, "7C3AED"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Inter", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Inter", color: "A78BFA" })] })); children.push(bodyText(e.institution, { size: 20, color: "7C3AED" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Inter", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Inter", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Inter", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Inter", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── RETRO DOCX ───────────────────────────────────────────────────────────
function buildRetroDocx(p: PortfolioData): Document {
  const c = COLORS.retro;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, border: { bottom: { color: c.accent, space: 4, style: BorderStyle.DASHED, size: 2 } }, children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 30, font: "Courier New", color: c.heading, characterSpacing: 200 })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `> ${p.title}`, size: 18, font: "Courier New", color: c.accent })] }));
  children.push(contactLine(p, "92400E"));
  if (p.about) { children.push(sectionHeading(":: SUMMARY ::", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading(":: EXPERIENCE ::", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading(":: EDUCATION ::", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Courier New", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Courier New", color: "D97706" })] })); children.push(bodyText(e.institution, { size: 20, color: "92400E" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading(":: SKILLS ::", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `> ${cat}: `, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: names.join(" | "), size: 20, font: "Courier New", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading(":: CERTIFICATIONS ::", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: `[${cert.name}]`, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Courier New", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CONSERVATIVE DOCX ────────────────────────────────────────────────────
function buildConservativeDocx(p: PortfolioData): Document {
  const c = COLORS.conservative;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, border: { top: { color: c.accent, space: 6, style: BorderStyle.DOUBLE, size: 3 }, bottom: { color: c.accent, space: 6, style: BorderStyle.DOUBLE, size: 3 } }, children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 32, font: "Times New Roman", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Times New Roman", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: contactParts(p).join("  |  "), size: 18, font: "Times New Roman", color: "475569" })] }));
  if (p.about) { children.push(sectionHeading("Professional Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Times New Roman", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Times New Roman", color: "64748B" })] })); children.push(bodyText(e.institution, { size: 20, color: "475569" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Areas of Competency", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Times New Roman", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Times New Roman", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Professional Affiliations", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Times New Roman", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Times New Roman", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ARTISTIC DOCX ────────────────────────────────────────────────────────
function buildArtisticDocx(p: PortfolioData): Document {
  const c = COLORS.artistic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "831843" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Calibri", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "831843" }, children: [new TextRun({ text: `    ${p.title}`, italics: true, size: 20, font: "Calibri", color: "FBCFE8" })] }));
  children.push(contactLine(p, "BE185D"));
  if (p.about) { children.push(sectionHeading("About Me", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "F472B6" })] })); children.push(bodyText(e.institution, { size: 20, color: "BE185D" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ULTRA MINIMAL DOCX ───────────────────────────────────────────────────
function buildUltraminimalDocx(p: PortfolioData): Document {
  const c = COLORS.ultraminimal;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.name.toUpperCase(), size: 28, font: "Helvetica Neue", color: c.heading, characterSpacing: 400 })] }));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: p.title, size: 18, font: "Helvetica Neue", color: "A3A3A3" })] }));
  children.push(new Paragraph({ spacing: { after: 120 }, border: { top: { color: "E5E5E5", space: 8, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("   "), size: 16, font: "Helvetica Neue", color: "A3A3A3" })] }));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, size: 21, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Helvetica Neue", color: "A3A3A3" })] })); children.push(bodyText(e.institution, { size: 20, color: "737373" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── TECH STACK DOCX ──────────────────────────────────────────────────────
function buildTechstackDocx(p: PortfolioData): Document {
  const c = COLORS.techstack;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "064E3B" }, children: [new TextRun({ text: `    $ ${p.name}`, bold: true, size: 28, font: "Courier New", color: "A7F3D0" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "064E3B" }, children: [new TextRun({ text: `    // ${p.title}`, size: 18, font: "Courier New", color: "34D399" })] }));
  children.push(contactLine(p, "059669"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Courier New", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Courier New", color: "059669" })] })); children.push(bodyText(e.institution, { size: 20, color: "059669" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `// ${cat}: `, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Courier New", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Courier New", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── BUSINESS PRO DOCX ────────────────────────────────────────────────────
function buildBusinessproDocx(p: PortfolioData): Document {
  const c = COLORS.businesspro;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "1E40AF" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Georgia", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "1E40AF" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Georgia", color: "BFDBFE" })] }));
  children.push(contactLine(p, "1E40AF"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Georgia", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Georgia", color: "64748B" })] })); children.push(bodyText(e.institution, { size: 20, color: "1E40AF" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Georgia", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Georgia", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Georgia", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Georgia", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ACADEMIC CV DOCX ─────────────────────────────────────────────────────
function buildAcademiccvDocx(p: PortfolioData): Document {
  const c = COLORS.academiccv;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 28, font: "Book Antiqua", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Book Antiqua", color: c.accent })] }));
  children.push(new Paragraph({ spacing: { after: 120 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 2 } }, children: [new TextRun({ text: contactParts(p).join("  |  "), size: 18, font: "Book Antiqua", color: "78716C" })] }));
  if (p.about) { children.push(sectionHeading("0. Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.education?.length) { children.push(sectionHeading("1. Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Book Antiqua", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Book Antiqua", color: "A8A29E" })] })); children.push(bodyText(e.institution + (e.grade && e.grade !== "null" ? ` · GPA: ${e.grade}` : ""), { size: 20, color: "78716C" })); } }
  if (p.experience?.length) { children.push(sectionHeading("2. Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("3. Research Areas", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Book Antiqua", color: c.heading }), new TextRun({ text: names.join("; "), size: 20, font: "Book Antiqua", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("4. Publications & Awards", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Book Antiqua", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Book Antiqua", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── MOSAIC DOCX ──────────────────────────────────────────────────────────
function buildMosaicDocx(p: PortfolioData): Document {
  const c = COLORS.mosaic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "7E22CE" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Calibri", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "9333EA" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Calibri", color: "E9D5FF" })] }));
  children.push(contactLine(p, "7E22CE"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "A855F7" })] })); children.push(bodyText(e.institution, { size: 20, color: "7E22CE" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── BRUTALIST DOCX ───────────────────────────────────────────────────────
function buildBrutalistDocx(p: PortfolioData): Document {
  const c = COLORS.brutalist;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, border: { bottom: { color: "000000", space: 4, style: BorderStyle.SINGLE, size: 6 } }, children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 36, font: "Courier New", color: c.heading, characterSpacing: 100 })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: `> ${p.title}`, size: 18, font: "Courier New", color: c.accent })] }));
  children.push(contactLine(p, "404040"));
  if (p.about) { children.push(sectionHeading("ABOUT", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("EXPERIENCE", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("EDUCATION", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} / ${e.field}`, bold: true, size: 21, font: "Courier New", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Courier New", color: "404040" })] })); children.push(bodyText(e.institution, { size: 20, color: "404040" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("SKILLS", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `> ${cat}: `, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: names.join(" / "), size: 20, font: "Courier New", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("CERTS", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Courier New", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── WATERCOLOR DOCX ──────────────────────────────────────────────────────
function buildWatercolorDocx(p: PortfolioData): Document {
  const c = COLORS.watercolor;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, italics: true, size: 36, font: "Palatino Linotype", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Palatino Linotype", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Palatino Linotype", color: "A78BFA" })] }));
  if (p.about) { children.push(sectionHeading("About Me", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Palatino Linotype", color: "A855F7" })] })); children.push(bodyText(e.institution, { size: 20, color: "A78BFA" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── NEON DOCX ────────────────────────────────────────────────────────────
function buildNeonDocx(p: PortfolioData): Document {
  const c = COLORS.neon;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "111111" }, children: [new TextRun({ text: `    ${p.name.toUpperCase()}`, bold: true, size: 32, font: "Courier New", color: c.accent })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "111111" }, children: [new TextRun({ text: `    ${p.title}`, size: 18, font: "Courier New", color: "A855F7" })] }));
  children.push(contactLine(p, "E879F9"));
  if (p.about) { children.push(sectionHeading("ABOUT", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("EXPERIENCE", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("EDUCATION", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Courier New", color: c.accent }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Courier New", color: "A855F7" })] })); children.push(bodyText(e.institution, { size: 20, color: "E879F9" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("SKILLS", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Courier New", color: c.accent }), new TextRun({ text: names.join(", "), size: 20, font: "Courier New", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("CERTS", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Courier New", color: c.accent }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Courier New", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── VINTAGE DOCX ─────────────────────────────────────────────────────────
function buildVintageDocx(p: PortfolioData): Document {
  const c = COLORS.vintage;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, border: { top: { color: c.accent, space: 6, style: BorderStyle.DOUBLE, size: 2 }, bottom: { color: c.accent, space: 6, style: BorderStyle.DOUBLE, size: 2 } }, children: [new TextRun({ text: p.name, size: 34, font: "Garamond", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Garamond", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Garamond", color: "78716C" })] }));
  if (p.about) { children.push(sectionHeading("~ Summary ~", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("~ Experience ~", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("~ Education ~", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Garamond", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Garamond", color: "A8A29E" })] })); children.push(bodyText(e.institution, { size: 20, color: "78716C" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("~ Skills ~", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: names.join(" · "), size: 20, font: "Garamond", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("~ Honors ~", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Garamond", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── GEOMETRIC DOCX ───────────────────────────────────────────────────────
function buildGeometricDocx(p: PortfolioData): Document {
  const c = COLORS.geometric;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "0891B2" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Calibri", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "06B6D4" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Calibri", color: "E0F2FE" })] }));
  children.push(contactLine(p, "0891B2"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "67E8F9" })] })); children.push(bodyText(e.institution, { size: 20, color: "0891B2" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── MAGAZINE DOCX ────────────────────────────────────────────────────────
function buildMagazineDocx(p: PortfolioData): Document {
  const c = COLORS.magazine;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, border: { bottom: { color: c.accent, space: 4, style: BorderStyle.SINGLE, size: 6 } }, children: [new TextRun({ text: p.name.toUpperCase(), bold: true, size: 42, font: "Arial", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title, bold: true, size: 16, font: "Arial", color: c.accent, characterSpacing: 200 })] }));
  children.push(contactLine(p, "6B7280"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: stripHtml(p.about), italics: true, size: 22, font: "Georgia", color: "374151" })] })); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Arial", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Arial", color: "DC2626" })] })); children.push(bodyText(e.institution, { size: 20, color: "6B7280" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Arial", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Arial", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Arial", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── MONOCHROME DOCX ──────────────────────────────────────────────────────
function buildMonochromeDocx(p: PortfolioData): Document {
  const c = COLORS.monochrome;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.name.toUpperCase(), size: 28, font: "Helvetica Neue", color: c.heading, characterSpacing: 400 })] }));
  children.push(new Paragraph({ spacing: { after: 120 }, children: [new TextRun({ text: p.title, size: 18, font: "Helvetica Neue", color: "A3A3A3" })] }));
  children.push(new Paragraph({ spacing: { after: 120 }, border: { top: { color: "E4E4E7", space: 8, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("   "), size: 16, font: "Helvetica Neue", color: "A3A3A3" })] }));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, size: 21, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Helvetica Neue", color: "A3A3A3" })] })); children.push(bodyText(e.institution, { size: 20, color: "737373" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── COPPER DOCX ──────────────────────────────────────────────────────────
function buildCopperDocx(p: PortfolioData): Document {
  const c = COLORS.copper;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Georgia", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Georgia", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 2 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Georgia", color: "92400E" })] }));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Georgia", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Georgia", color: "D97706" })] })); children.push(bodyText(e.institution, { size: 20, color: "92400E" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Georgia", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Georgia", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Georgia", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Georgia", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── FOREST DOCX ──────────────────────────────────────────────────────────
function buildForestDocx(p: PortfolioData): Document {
  const c = COLORS.forest;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "166534" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 32, font: "Merriweather", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "15803D" }, children: [new TextRun({ text: `    ${p.title}`, italics: true, size: 20, font: "Merriweather", color: "BBF7D0" })] }));
  children.push(contactLine(p, "166534"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Merriweather", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Merriweather", color: "22C55E" })] })); children.push(bodyText(e.institution, { size: 20, color: "166534" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Merriweather", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Merriweather", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Merriweather", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Merriweather", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ROYAL DOCX ───────────────────────────────────────────────────────────
function buildRoyalDocx(p: PortfolioData): Document {
  const c = COLORS.royal;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, border: { color: c.accent, style: BorderStyle.SINGLE, size: 2 }, children: [new TextRun({ text: p.name, size: 34, font: "Palatino Linotype", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Palatino Linotype", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 2 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Palatino Linotype", color: "7E22CE" })] }));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Professional Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Palatino Linotype", color: "A855F7" })] })); children.push(bodyText(e.institution, { size: 20, color: "7E22CE" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Areas of Expertise", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: names.join("; "), size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Honors", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── FUTURISTIC DOCX ──────────────────────────────────────────────────────
function buildFuturisticDocx(p: PortfolioData): Document {
  const c = COLORS.futuristic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, border: { bottom: { color: c.accent, space: 4, style: BorderStyle.SINGLE, size: 4 } }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Calibri", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title.toUpperCase(), bold: true, size: 16, font: "Calibri", color: c.accent, characterSpacing: 200 })] }));
  children.push(contactLine(p, "67E8F9"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "22D3EE" })] })); children.push(bodyText(e.institution, { size: 20, color: "06B6D4" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── HANDWRITTEN DOCX ─────────────────────────────────────────────────────
function buildHandwrittenDocx(p: PortfolioData): Document {
  const c = COLORS.handwritten;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, border: { bottom: { color: c.accent, space: 4, style: BorderStyle.DASHED, size: 2 } }, children: [new TextRun({ text: p.name, size: 42, font: "Garamond", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Garamond", color: c.accent })] }));
  children.push(contactLine(p, "78716C"));
  if (p.about) { children.push(sectionHeading("About Me", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Work Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Garamond", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Garamond", color: "D97706" })] })); children.push(bodyText(e.institution, { size: 20, color: "92400E" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Garamond", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Garamond", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Garamond", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ZEN DOCX ─────────────────────────────────────────────────────────────
function buildZenDocx(p: PortfolioData): Document {
  const c = COLORS.zen;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.name.toUpperCase(), size: 28, font: "Helvetica Neue", color: c.heading, characterSpacing: 300 })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: p.title, size: 18, font: "Helvetica Neue", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: contactParts(p).join("   "), size: 16, font: "Helvetica Neue", color: "5EEAD4" })] }));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, size: 21, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Helvetica Neue", color: "5EEAD4" })] })); children.push(bodyText(e.institution, { size: 20, color: "0F766E" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, size: 20, font: "Helvetica Neue", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Helvetica Neue", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── POP ART DOCX ─────────────────────────────────────────────────────────
function buildPopDocx(p: PortfolioData): Document {
  const c = COLORS.pop;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "E11D48" }, children: [new TextRun({ text: `    ${p.name.toUpperCase()}`, bold: true, size: 36, font: "Poppins", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "E11D48" }, children: [new TextRun({ text: `    ${p.title}`, bold: true, size: 18, font: "Poppins", color: "FECDD3" })] }));
  children.push(contactLine(p, "E11D48"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Poppins", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Poppins", color: "FB7185" })] })); children.push(bodyText(e.institution, { size: 20, color: "E11D48" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Poppins", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Poppins", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Poppins", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Poppins", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── CARBON DOCX ──────────────────────────────────────────────────────────
function buildCarbonDocx(p: PortfolioData): Document {
  const c = COLORS.carbon;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, shading: { fill: "27272A" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 30, font: "Courier New", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, shading: { fill: "27272A" }, children: [new TextRun({ text: `    ${p.title.toUpperCase()}`, size: 16, font: "Courier New", color: "525252", characterSpacing: 100 })] }));
  children.push(contactLine(p, "A3A3A3"));
  if (p.about) { children.push(sectionHeading("ABOUT", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("EXPERIENCE", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("EDUCATION", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Courier New", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Courier New", color: "525252" })] })); children.push(bodyText(e.institution, { size: 20, color: "A3A3A3" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("SKILLS", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Courier New", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("CERTS", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Courier New", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Courier New", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── PEARL DOCX ───────────────────────────────────────────────────────────
function buildPearlDocx(p: PortfolioData): Document {
  const c = COLORS.pearl;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.name, size: 36, font: "Palatino Linotype", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Palatino Linotype", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 120 }, border: { bottom: { color: "E7E5E4", space: 8, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 16, font: "Palatino Linotype", color: "A8A29E" })] }));
  if (p.about) { children.push(sectionHeading("Summary", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, size: 21, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Palatino Linotype", color: "A8A29E" })] })); children.push(bodyText(e.institution, { size: 20, color: "78716C" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, size: 20, font: "Palatino Linotype", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Palatino Linotype", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── SUNSET DOCX ──────────────────────────────────────────────────────────
function buildSunsetDocx(p: PortfolioData): Document {
  const c = COLORS.sunset;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "EA580C" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Calibri", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "F97316" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Calibri", color: "FFEDD5" })] }));
  children.push(contactLine(p, "C2410C"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "FB923C" })] })); children.push(bodyText(e.institution, { size: 20, color: "EA580C" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── ARCTIC DOCX ──────────────────────────────────────────────────────────
function buildArcticDocx(p: PortfolioData): Document {
  const c = COLORS.arctic;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Calibri", color: c.heading })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 80 }, children: [new TextRun({ text: p.title, size: 20, font: "Calibri", color: c.accent })] }));
  children.push(new Paragraph({ alignment: AlignmentType.CENTER, spacing: { after: 160 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("  ·  "), size: 18, font: "Calibri", color: "7DD3FC" })] }));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "7DD3FC" })] })); children.push(bodyText(e.institution, { size: 20, color: "0EA5E9" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── TERRACOTTA DOCX ──────────────────────────────────────────────────────
function buildTerracottaDocx(p: PortfolioData): Document {
  const c = COLORS.terracotta;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: p.name, bold: true, size: 32, font: "Lora", color: c.heading })] }));
  children.push(new Paragraph({ spacing: { after: 80 }, children: [new TextRun({ text: p.title, italics: true, size: 20, font: "Lora", color: c.accent })] }));
  children.push(new Paragraph({ spacing: { after: 120 }, border: { bottom: { color: c.accent, space: 6, style: BorderStyle.SINGLE, size: 1 } }, children: [new TextRun({ text: contactParts(p).join("  |  "), size: 18, font: "Lora", color: "A16207" })] }));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 22, font: "Lora", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, italics: true, size: 18, font: "Lora", color: "D97706" })] })); children.push(bodyText(e.institution, { size: 20, color: "92400E" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Lora", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Lora", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Lora", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Lora", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

// ─── INDIGO NIGHT DOCX ────────────────────────────────────────────────────
function buildIndigoDocx(p: PortfolioData): Document {
  const c = COLORS.indigo;
  const children: Paragraph[] = [];
  children.push(new Paragraph({ spacing: { after: 20 }, shading: { fill: "312E81" }, children: [new TextRun({ text: `    ${p.name}`, bold: true, size: 34, font: "Calibri", color: "FFFFFF" })] }));
  children.push(new Paragraph({ spacing: { after: 100 }, shading: { fill: "3730A3" }, children: [new TextRun({ text: `    ${p.title}`, size: 20, font: "Calibri", color: "C7D2FE" })] }));
  children.push(contactLine(p, "818CF8"));
  if (p.about) { children.push(sectionHeading("About", c.accent)); children.push(bodyText(stripHtml(p.about))); }
  if (p.experience?.length) { children.push(sectionHeading("Experience", c.accent)); for (const e of p.experience) { children.push(jobParagraph(e.role, e.company, `${e.startDate} – ${e.endDate || "Present"}`, c.heading, c.accent)); for (const a of (e.accomplishments || [])) children.push(bulletPoint(a, c.text)); } }
  if (p.education?.length) { children.push(sectionHeading("Education", c.accent)); for (const e of p.education) { children.push(new Paragraph({ spacing: { before: 120, after: 40 }, children: [new TextRun({ text: `${e.degree} in ${e.field}`, bold: true, size: 21, font: "Calibri", color: c.heading }), new TextRun({ text: `    ${e.startDate} – ${e.endDate || "Present"}`, size: 18, font: "Calibri", color: "818CF8" })] })); children.push(bodyText(e.institution, { size: 20, color: "3730A3" })); } }
  const groups = groupByCategory(p.skills || []); if (Object.keys(groups).length) { children.push(sectionHeading("Skills", c.accent)); for (const [cat, names] of Object.entries(groups)) { children.push(new Paragraph({ spacing: { after: 40 }, children: [new TextRun({ text: `${cat}: `, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: names.join(", "), size: 20, font: "Calibri", color: c.text })] })); } }
  if (p.certifications?.length) { children.push(sectionHeading("Certifications", c.accent)); for (const cert of p.certifications) { children.push(new Paragraph({ bullet: { level: 0 }, spacing: { after: 40 }, children: [new TextRun({ text: cert.name, bold: true, size: 20, font: "Calibri", color: c.heading }), new TextRun({ text: ` — ${cert.issuer}`, size: 20, font: "Calibri", color: c.text })] })); } }
  return new Document({ sections: [{ children }] });
}

function buildDocxTemplate(p: PortfolioData, template: CvTemplate): Document {
  switch (template) {
    case "executive": return buildExecutiveDocx(p);
    case "minimal": return buildMinimalDocx(p);
    case "sidebar": return buildSidebarDocx(p);
    case "simplified": return buildSimplifiedDocx(p);
    case "modern": return buildModernDocx(p);
    case "creative": return buildCreativeDocx(p);
    case "minimalist": return buildMinimalistDocx(p);
    case "freshgraduate": return buildFreshGraduateDocx(p);
    case "techportfolio": return buildTechPortfolioDocx(p);
    case "functional": return buildFunctionalDocx(p);
    case "combination": return buildCombinationDocx(p);
    case "academic": return buildAcademicDocx(p);
    case "timeline": return buildTimelineDocx(p);
    case "twocol": return buildTwocolDocx(p);
    case "infographic": return buildInfographicDocx(p);
    case "darkmode": return buildDarkmodeDocx(p);
    case "corporate": return buildCorporateDocx(p);
    case "millennial": return buildMillennialDocx(p);
    case "ivy": return buildIvyDocx(p);
    case "everest": return buildEverestDocx(p);
    case "quick": return buildQuickDocx(p);
    case "photo": return buildPhotoDocx(p);
    case "cleanelegant": return buildCleanElegantDocx(p);
    case "modernbasic": return buildModernBasicDocx(p);
    case "harvard": return buildHarvardDocx(p);
    case "europass": return buildEuropassDocx(p);
    case "metro": return buildMetroDocx(p);
    case "creativebeige": return buildCreativeBeigeDocx(p);
    case "corporateats": return buildCorporateAtsDocx(p);
    case "boldgraphic": return buildBoldGraphicDocx(p);
    case "scienceeng": return buildScienceEngDocx(p);
    case "calligraphic": return buildCalligraphicDocx(p);
    case "elegant": return buildElegantDocx(p);
    case "gradient": return buildGradientDocx(p);
    case "retro": return buildRetroDocx(p);
    case "conservative": return buildConservativeDocx(p);
    case "artistic": return buildArtisticDocx(p);
    case "ultraminimal": return buildUltraminimalDocx(p);
    case "techstack": return buildTechstackDocx(p);
    case "businesspro": return buildBusinessproDocx(p);
    case "academiccv": return buildAcademiccvDocx(p);
    case "mosaic": return buildMosaicDocx(p);
    case "brutalist": return buildBrutalistDocx(p);
    case "watercolor": return buildWatercolorDocx(p);
    case "neon": return buildNeonDocx(p);
    case "vintage": return buildVintageDocx(p);
    case "geometric": return buildGeometricDocx(p);
    case "magazine": return buildMagazineDocx(p);
    case "monochrome": return buildMonochromeDocx(p);
    case "copper": return buildCopperDocx(p);
    case "forest": return buildForestDocx(p);
    case "royal": return buildRoyalDocx(p);
    case "futuristic": return buildFuturisticDocx(p);
    case "handwritten": return buildHandwrittenDocx(p);
    case "zen": return buildZenDocx(p);
    case "pop": return buildPopDocx(p);
    case "carbon": return buildCarbonDocx(p);
    case "pearl": return buildPearlDocx(p);
    case "sunset": return buildSunsetDocx(p);
    case "arctic": return buildArcticDocx(p);
    case "terracotta": return buildTerracottaDocx(p);
    case "indigo": return buildIndigoDocx(p);
    default: return buildExecutiveDocx(p);
  }
}

export function getCvHtml(portfolio: PortfolioData, options: ExportCvOptions = {}): string {
  const template = options.template ?? "executive";
  return buildHtmlTemplate(portfolio, template);
}

export async function downloadCv(portfolio: PortfolioData, options: ExportCvOptions = {}): Promise<void> {
  const template = options.template ?? "executive";
  const sections = options.sections;
  let filtered = portfolio;
  if (sections) {
    filtered = { ...portfolio };
    if (sections.experience === false) filtered.experience = [];
    if (sections.education === false) filtered.education = [];
    if (sections.skills === false) filtered.skills = [];
    if (sections.certifications === false) filtered.certifications = [];
    if (sections.blogs === false) filtered.blogs = [];
    if (sections.customSections === false) filtered.customSections = [];
  }
  const doc = buildDocxTemplate(filtered, template);
  const blob = await Packer.toBlob(doc);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${portfolio.name.replace(/\s+/g, "_")}_CV.docx`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
