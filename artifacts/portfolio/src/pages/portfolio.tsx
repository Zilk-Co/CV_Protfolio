import { useState, useRef, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import type { Portfolio } from "@workspace/api-client-react";
import {
  useGetPortfolio, useUpdatePortfolio,
  useAddEducation, useUpdateEducation, useDeleteEducation,
  useAddExperience, useUpdateExperience, useDeleteExperience,
  useAddSkill, useDeleteSkill,
  useAddCertification, useUpdateCertification, useDeleteCertification,
  useAddBlog, useUpdateBlog, useDeleteBlog,
  useAddCustomSection, useUpdateCustomSection, useDeleteCustomSection,
  useAddCustomSectionItem, useUpdateCustomSectionItem, useDeleteCustomSectionItem,
  useExtractCv, useChangePassword,
  getGetPortfolioQueryKey,
} from "@workspace/api-client-react";
import type { Education, Experience, Certification, CustomSection, CustomSectionItem } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor, RichTextDisplay } from "@/components/RichTextEditor";
import {
  Pencil, Check, X, Plus, Trash2, ChevronUp, ChevronDown,
  MessageCircle, Send, Upload, FileText, Loader2, Users,
  Mail, Phone, MapPin, User, Briefcase, GraduationCap, Wrench,
  Award, BookOpen, Layers, Sparkles, Lock, Eye, EyeOff, ExternalLink, AlignLeft,
  Settings, ImageOff, Menu, RotateCcw, Download, ArrowRight, SlidersHorizontal
} from "lucide-react";
import { NexusHero } from "@/components/nexus/NexusHero";
import { NexusNavbar } from "@/components/nexus/NexusNavbar";
import { NexusAbout } from "@/components/nexus/NexusAbout";
import { NexusTimeline } from "@/components/nexus/NexusTimeline";
import { NexusSkills } from "@/components/nexus/NexusSkills";
import { NexusCertifications } from "@/components/nexus/NexusCertifications";
import { NexusBlog } from "@/components/nexus/NexusBlog";
import { NexusContact } from "@/components/nexus/NexusContact";
import { NexusCustomSections } from "@/components/nexus/NexusCustomSections";
import { NexusFooter } from "@/components/nexus/NexusFooter";
import { CreateClientDialog } from "@/components/CreateClientDialog";


type CvTemplateKey = "executive" | "minimal" | "sidebar" | "simplified" | "modern" | "creative" | "minimalist" | "freshgraduate" | "techportfolio" | "functional" | "combination" | "academic" | "timeline" | "twocol" | "infographic" | "darkmode" | "corporate" | "millennial" | "ivy" | "everest" | "quick" | "photo" | "cleanelegant" | "modernbasic" | "harvard" | "europass" | "metro" | "creativebeige" | "corporateats" | "boldgraphic" | "scienceeng" | "calligraphic" | "elegant" | "gradient" | "retro" | "conservative" | "artistic" | "ultraminimal" | "techstack" | "businesspro" | "academiccv" | "mosaic" | "brutalist" | "watercolor" | "neon" | "vintage" | "geometric" | "magazine" | "monochrome" | "copper" | "forest" | "royal" | "futuristic" | "handwritten" | "zen" | "pop" | "carbon" | "pearl" | "sunset" | "arctic" | "terracotta" | "indigo";

const CV_TEMPLATE_OPTIONS: Array<{ id: CvTemplateKey; name: string; tagline: string; highlight: string }> = [
  { id: "executive", name: "Executive Classic", tagline: "Classic compliance layout", highlight: "Cream/navy, serif fonts, double-rule header" },
  { id: "minimal", name: "Minimal Modern", tagline: "Clean sans-serif layout", highlight: "Teal accents, pill-shaped skill tags" },
  { id: "sidebar", name: "Sidebar Pro", tagline: "Two-column dark sidebar", highlight: "Dark navy sidebar, clean main area" },
  { id: "simplified", name: "Simplified Clean", tagline: "Centered, ATS-friendly", highlight: "Arial, centered contact, 2-column grids" },
  { id: "modern", name: "Modern Gradient", tagline: "Dark gradient header", highlight: "Purple accent, Inter font, modern spacing" },
  { id: "creative", name: "Creative Split", tagline: "Bold two-column", highlight: "Rose accent bars, dark sidebar" },
  { id: "minimalist", name: "Minimalist", tagline: "Ultra-clean whitespace", highlight: "Blue accent, Helvetica Neue light" },
  { id: "freshgraduate", name: "Fresh Graduate", tagline: "Education-first, ATS", highlight: "Green accent, Calibri, 1-page" },
  { id: "techportfolio", name: "Tech Portfolio", tagline: "Skills+Projects first", highlight: "Monospace, dark sidebar, code-style" },
  { id: "functional", name: "Functional Skills", tagline: "Skills-first layout", highlight: "Purple accent, skill pills, centered" },
  { id: "combination", name: "Combination Hybrid", tagline: "Skills+chronological", highlight: "Sky blue, split header, skill rows" },
  { id: "academic", name: "Academic Research", tagline: "Grad school, research", highlight: "Garamond serif, GPA highlighted" },
  { id: "timeline", name: "Timeline", tagline: "Visual timeline dots", highlight: "Red accent, vertical line markers" },
  { id: "twocol", name: "Two-Column Pro", tagline: "Skill bars + side panel", highlight: "Blue accent, dark sidebar, bar charts" },
  { id: "infographic", name: "Infographic", tagline: "Visual skill bars", highlight: "Amber accent, pill tags, gradient header" },
  { id: "darkmode", name: "Dark Mode", tagline: "Dark background, light text", highlight: "Cyan accent, monospace, dark theme" },
  { id: "corporate", name: "Corporate", tagline: "Bold, no-nonsense", highlight: "Blue accent, dark header, Arial" },
  { id: "millennial", name: "Millennial", tagline: "Bright, skill charts", highlight: "Pink accent, gradient, modern" },
  { id: "ivy", name: "Ivy League", tagline: "Traditional serif, prestigious", highlight: "Brown accent, Garamond, conservative" },
  { id: "everest", name: "Everest", tagline: "Strong visual hierarchy", highlight: "Teal accent, clean lines, modern" },
  { id: "quick", name: "Quick", tagline: "Bold background, fast-read", highlight: "Indigo background, compact, concise" },
  { id: "photo", name: "Photo Layout", tagline: "Photo-friendly, international", highlight: "Purple sidebar, photo placeholder" },
  { id: "cleanelegant", name: "Clean Elegant", tagline: "Clean, professional, ATS", highlight: "Slate accent, Calibri, minimal borders" },
  { id: "modernbasic", name: "Modern Basic", tagline: "Modern, simple, effective", highlight: "Blue topbar, Inter, clean grids" },
  { id: "harvard", name: "Harvard", tagline: "Classic academic style", highlight: "Crimson accent, Garamond, serif" },
  { id: "europass", name: "Europass", tagline: "EU standard format", highlight: "EU blue, Calibri, structured" },
  { id: "metro", name: "Metro", tagline: "Urban modern layout", highlight: "Cyan accent, dark sidebar, metro" },
  { id: "creativebeige", name: "Creative Beige", tagline: "Warm, creative, unique", highlight: "Amber accent, beige sidebar" },
  { id: "corporateats", name: "Corporate ATS", tagline: "Corporate, ATS-optimized", highlight: "Deep blue, Arial, no columns" },
  { id: "boldgraphic", name: "Bold Graphic", tagline: "Bold, graphic, striking", highlight: "Red/black, Impact font, bold" },
  { id: "scienceeng", name: "Science Engineering", tagline: "Technical, precise", highlight: "Green accent, monospace, grid" },
  { id: "calligraphic", name: "Calligraphic", tagline: "Elegant, handwritten feel", highlight: "Brown accent, italic, Palatino" },
  { id: "elegant", name: "Elegant", tagline: "Dark gold, luxury serif", highlight: "Gold accent, Palatino, bordered header" },
  { id: "gradient", name: "Gradient Modern", tagline: "Violet gradient, card sections", highlight: "Violet gradient header, Inter, pill tags" },
  { id: "retro", name: "Retro Typewriter", tagline: "Brown, Courier, vintage dashed", highlight: "Brown accent, Courier New, dashed borders" },
  { id: "conservative", name: "Conservative", tagline: "Navy, Times New Roman, formal", highlight: "Navy accent, double-rule header, serif" },
  { id: "artistic", name: "Artistic", tagline: "Fuchsia, bold, paint-stroke", highlight: "Fuchsia accent, dark header, creative" },
  { id: "ultraminimal", name: "Ultra Minimal", tagline: "Extreme whitespace, thin", highlight: "Black, Helvetica Neue, ultra-clean" },
  { id: "techstack", name: "Tech Stack", tagline: "Terminal, dark sidebar, monospace", highlight: "Emerald, dark sidebar, Courier" },
  { id: "businesspro", name: "Business Pro", tagline: "Blue header, card sections", highlight: "Blue, Georgia, chevron header" },
  { id: "academiccv", name: "Academic CV", tagline: "Numbered sections, research", highlight: "Dark amber, Book Antiqua, numbered" },
  { id: "mosaic", name: "Mosaic", tagline: "Gradient cards, purple", highlight: "Purple, gradient cards, skill mosaic" },
  { id: "brutalist", name: "Brutalist", tagline: "Raw, monospace, anti-design", highlight: "Black, Courier New, harsh borders" },
  { id: "watercolor", name: "Watercolor", tagline: "Soft purple, artistic", highlight: "Purple, Playfair Display, italic" },
  { id: "neon", name: "Neon", tagline: "Dark bg, neon glow, sci-fi", highlight: "Magenta neon, dark bg, Orbitron" },
  { id: "vintage", name: "Vintage", tagline: "Brown, aged paper, serif", highlight: "Brown, Garamond, decorative borders" },
  { id: "geometric", name: "Geometric", tagline: "Cyan, shapes, modern", highlight: "Cyan, Montserrat, gradient header" },
  { id: "magazine", name: "Magazine", tagline: "Editorial, multi-column", highlight: "Red, Arial, bold headlines" },
  { id: "monochrome", name: "Monochrome", tagline: "Grayscale only, ultra-clean", highlight: "Black/white, Helvetica Neue" },
  { id: "copper", name: "Copper", tagline: "Warm copper, metallic", highlight: "Copper, Georgia, warm tones" },
  { id: "forest", name: "Forest", tagline: "Green, nature, earthy", highlight: "Green, Merriweather, gradient header" },
  { id: "royal", name: "Royal", tagline: "Purple + gold, ornate", highlight: "Deep purple, Palatino, bordered" },
  { id: "futuristic", name: "Futuristic", tagline: "Cyan, geometric, sci-fi", highlight: "Cyan, Rajdhani, sharp lines" },
  { id: "handwritten", name: "Handwritten", tagline: "Script-like, personal", highlight: "Brown, Caveat, cursive feel" },
  { id: "zen", name: "Zen", tagline: "Minimal, meditative, calm", highlight: "Teal, Inter, extreme whitespace" },
  { id: "pop", name: "Pop Art", tagline: "Bold, colorful, geometric", highlight: "Rose, Poppins, bold shapes" },
  { id: "carbon", name: "Carbon", tagline: "Dark fiber, monospace", highlight: "Dark gray, Source Code Pro" },
  { id: "pearl", name: "Pearl", tagline: "Elegant, subtle, light", highlight: "Gray, Cormorant, ultra-refined" },
  { id: "sunset", name: "Sunset", tagline: "Warm gradient, orange", highlight: "Orange, Nunito, warm gradient" },
  { id: "arctic", name: "Arctic", tagline: "Cold, clean, airy", highlight: "Sky blue, Quicksand, clean" },
  { id: "terracotta", name: "Terracotta", tagline: "Warm earthy, serif", highlight: "Terracotta, Lora, warm tones" },
  { id: "indigo", name: "Indigo Night", tagline: "Deep blue, professional", highlight: "Indigo, Work Sans, gradient" },
];

// ─── Inline edit (for short text fields only) ─────────────────────────────
function InlineEdit({ value, onSave, className = "", placeholder = "Click to edit..." }: {
  value: string; onSave: (v: string) => void; className?: string; placeholder?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };

  if (!editing) return (
    <span className={`group relative cursor-pointer hover:opacity-80 ${className}`} onClick={() => setEditing(true)} title="Click to edit">
      {value || <span className="opacity-40">{placeholder}</span>}
      <Pencil className="inline ml-1 w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </span>
  );

  return (
    <span className="inline-flex items-center gap-1 flex-wrap">
      <Input className={`h-7 py-0 ${className}`} value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => { if (e.key === "Enter") commit(); if (e.key === "Escape") cancel(); }}
        autoFocus
      />
      <button onClick={commit} className="text-green-500 flex-shrink-0"><Check className="w-4 h-4" /></button>
      <button onClick={cancel} className="text-red-400 flex-shrink-0"><X className="w-4 h-4" /></button>
    </span>
  );
}

// ─── About edit dialog (fixes collapse bug) ───────────────────────────────
function AboutEditDialog({ open, onClose, value, onSave }: {
  open: boolean; onClose: () => void; value: string; onSave: (v: string) => void;
}) {
  const [draft, setDraft] = useState(value);
  useEffect(() => { if (open) setDraft(value); }, [open, value]);
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-2xl">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><AlignLeft className="w-4 h-4" /> Edit About Section</DialogTitle>
          <DialogDescription className="sr-only">Edit the about section of your portfolio</DialogDescription>
        </DialogHeader>
        <RichTextEditor content={draft} onChange={setDraft} placeholder="Tell recruiters about yourself..." minHeight="180px" />
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => { onSave(draft); onClose(); }}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Experience dialog ────────────────────────────────────────────────────
type ExpForm = { company: string; role: string; startDate: string; endDate: string; description: string; accomplishments: string; };
function ExperienceDialog({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void;
  onSave: (d: Omit<ExpForm, "accomplishments"> & { accomplishments: string[] }) => void;
  initial?: Partial<ExpForm>;
}) {
  const [f, setF] = useState<ExpForm>({ company: "", role: "", startDate: "", endDate: "", description: "", accomplishments: "" });
  useEffect(() => {
    if (open) setF({ company: initial?.company || "", role: initial?.role || "", startDate: initial?.startDate || "", endDate: initial?.endDate || "", description: initial?.description || "", accomplishments: initial?.accomplishments || "" });
  }, [open, initial?.company]);
  const upd = (k: keyof ExpForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.company ? "Edit Experience" : "Add Experience"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">Company *</label><Input value={f.company} onChange={upd("company")} placeholder="Company name" /></div>
            <div><label className="text-sm font-medium">Role *</label><Input value={f.role} onChange={upd("role")} placeholder="Your role/title" /></div>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">Start Date *</label><Input value={f.startDate} onChange={upd("startDate")} placeholder="Jan 2022" /></div>
            <div><label className="text-sm font-medium">End Date</label><Input value={f.endDate} onChange={upd("endDate")} placeholder="Dec 2023 or Present" /></div>
          </div>
          <div><label className="text-sm font-medium">Description</label><Textarea value={f.description} onChange={upd("description")} placeholder="Role overview..." className="min-h-[80px]" /></div>
          <div><label className="text-sm font-medium">Key Accomplishments (one per line)</label><Textarea value={f.accomplishments} onChange={upd("accomplishments")} placeholder={"• Increased revenue 20%\n• Led team of 5"} className="min-h-[100px]" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...f, accomplishments: f.accomplishments.split("\n").map(s => s.trim()).filter(Boolean) })} disabled={!f.company || !f.role || !f.startDate}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Education dialog ─────────────────────────────────────────────────────
type EduForm = { institution: string; degree: string; field: string; startDate: string; endDate: string; grade: string; description: string; accomplishments: string; };
function EducationDialog({ open, onClose, onSave, initial }: {
  open: boolean; onClose: () => void;
  onSave: (d: Omit<EduForm, "accomplishments"> & { accomplishments: string[] }) => void;
  initial?: Partial<EduForm>;
}) {
  const [f, setF] = useState<EduForm>({ institution: "", degree: "", field: "", startDate: "", endDate: "", grade: "", description: "", accomplishments: "" });
  useEffect(() => {
    if (open) setF({ institution: initial?.institution || "", degree: initial?.degree || "", field: initial?.field || "", startDate: initial?.startDate || "", endDate: initial?.endDate || "", grade: initial?.grade || "", description: initial?.description || "", accomplishments: initial?.accomplishments || "" });
  }, [open, initial?.institution]);
  const upd = (k: keyof EduForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.institution ? "Edit Education" : "Add Education"}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-sm font-medium">Institution *</label><Input value={f.institution} onChange={upd("institution")} placeholder="University / College" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">Degree *</label><Input value={f.degree} onChange={upd("degree")} placeholder="Bachelor of Science" /></div>
            <div><label className="text-sm font-medium">Field *</label><Input value={f.field} onChange={upd("field")} placeholder="Computer Science" /></div>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div><label className="text-sm font-medium">Start *</label><Input value={f.startDate} onChange={upd("startDate")} placeholder="Sep 2020" /></div>
            <div><label className="text-sm font-medium">End</label><Input value={f.endDate} onChange={upd("endDate")} placeholder="Jun 2024" /></div>
            <div><label className="text-sm font-medium">Grade</label><Input value={f.grade} onChange={upd("grade")} placeholder="3.8 GPA" /></div>
          </div>
          <div><label className="text-sm font-medium">Description</label><Textarea value={f.description} onChange={upd("description")} className="min-h-[70px]" /></div>
          <div><label className="text-sm font-medium">Accomplishments (one per line)</label><Textarea value={f.accomplishments} onChange={upd("accomplishments")} className="min-h-[80px]" /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...f, accomplishments: f.accomplishments.split("\n").map(s => s.trim()).filter(Boolean) })} disabled={!f.institution || !f.degree || !f.field || !f.startDate}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Custom Section Item dialog ───────────────────────────────────────────
type CsiForm = { title: string; subtitle: string; startDate: string; endDate: string; description: string; accomplishments: string; url: string; };
function CustomSectionItemDialog({ open, onClose, onSave, initial, sectionTitle }: {
  open: boolean; onClose: () => void;
  onSave: (d: Omit<CsiForm, "accomplishments"> & { accomplishments: string[] }) => void;
  initial?: Partial<CsiForm>; sectionTitle: string;
}) {
  const [f, setF] = useState<CsiForm>({ title: "", subtitle: "", startDate: "", endDate: "", description: "", accomplishments: "", url: "" });
  useEffect(() => {
    if (open) setF({ title: initial?.title || "", subtitle: initial?.subtitle || "", startDate: initial?.startDate || "", endDate: initial?.endDate || "", description: initial?.description || "", accomplishments: initial?.accomplishments || "", url: initial?.url || "" });
  }, [open, initial?.title]);
  const upd = (k: keyof CsiForm) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => setF(p => ({ ...p, [k]: e.target.value }));
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{initial?.title ? `Edit ${sectionTitle} Entry` : `Add to ${sectionTitle}`}</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><label className="text-sm font-medium">Title *</label><Input value={f.title} onChange={upd("title")} placeholder="e.g. Project / Award / Role name" /></div>
          <div><label className="text-sm font-medium">Subtitle / Organization</label><Input value={f.subtitle} onChange={upd("subtitle")} placeholder="e.g. Company, Institution, Client" /></div>
          <div className="grid grid-cols-2 gap-3">
            <div><label className="text-sm font-medium">Start Date</label><Input value={f.startDate} onChange={upd("startDate")} placeholder="Jan 2022" /></div>
            <div><label className="text-sm font-medium">End Date</label><Input value={f.endDate} onChange={upd("endDate")} placeholder="Dec 2022 or Present" /></div>
          </div>
          <div><label className="text-sm font-medium">Description</label><Textarea value={f.description} onChange={upd("description")} placeholder="Describe what you did, achieved, or contributed..." className="min-h-[100px]" /></div>
          <div><label className="text-sm font-medium">Key Points / Accomplishments (one per line)</label><Textarea value={f.accomplishments} onChange={upd("accomplishments")} placeholder={"• Built X that saved Y\n• Achieved Z award"} className="min-h-[80px]" /></div>
          <div><label className="text-sm font-medium">Link / URL</label><Input value={f.url} onChange={upd("url")} placeholder="https://..." /></div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={onClose}>Cancel</Button>
          <Button onClick={() => onSave({ ...f, accomplishments: f.accomplishments.split("\n").map(s => s.trim()).filter(Boolean) })} disabled={!f.title}>Save</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Auth Helper ──────────────────────────────────────────────────────────
function getAuthHeaders(): Record<string, string> {
  const token = localStorage.getItem("portfolio_token");
  if (token) return { "Authorization": `Bearer ${token}` };
  return {};
}

// ─── AI Chat ─────────────────────────────────────────────────────────────
function AiChat({ portfolioName, slug }: { portfolioName: string; slug: string }) {
  const [open, setOpen] = useState(false);
  const [conversationId, setConversationId] = useState<number | null>(null);
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const DEFAULT_MESSAGES = [
    `What makes ${portfolioName} stand out?`,
    `What kind of roles would ${portfolioName} be a good fit for?`,
    `What are ${portfolioName}'s strongest skills?`,
    `Tell me about ${portfolioName}'s career journey`,
  ];

  // Reset chat context when switching portfolios
  useEffect(() => {
    setMessages([]);
    setConversationId(null);
    setOpen(false);
  }, [slug]);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const createConversation = async () => {
    console.log(`[AiChat] Creating conversation with slug: "${slug}"`);
    const res = await fetch(`/api/openai/conversations?slug=${encodeURIComponent(slug)}`, { 
      method: "POST", 
      headers: { 
        "Content-Type": "application/json",
        "x-portfolio-slug": slug,
        ...getAuthHeaders(),
      }, 
      body: JSON.stringify({ title: `Chat with ${portfolioName}` }) 
    });
    if (!res.ok) throw new Error("Could not create conversation");
    return (await res.json()).id as number;
  };

  const sendMessage = async (msg?: string) => {
    const content = (msg || input).trim();
    if (!content || loading) return;
    setInput("");
    setMessages(m => [...m, { role: "user", content }]);
    setLoading(true);
    let convId = conversationId;
    if (!convId) { convId = await createConversation(); setConversationId(convId); }
    console.log(`[AiChat] Sending message for slug: "${slug}", convId: ${convId}`);
    const res = await fetch(`/api/openai/conversations/${convId}/messages?slug=${encodeURIComponent(slug)}`, { 
      method: "POST", 
      headers: { 
        "Content-Type": "application/json",
        "x-portfolio-slug": slug,
        ...getAuthHeaders(),
      }, 
      body: JSON.stringify({ content }) 
    });
    const reader = res.body?.getReader();
    if (!reader) { setLoading(false); return; }
    let assistantContent = "";
    setMessages(m => [...m, { role: "assistant", content: "" }]);
    const decoder = new TextDecoder();
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      for (const line of decoder.decode(value).split("\n").filter(l => l.startsWith("data: "))) {
        try {
          const parsed = JSON.parse(line.slice(6));
          if (parsed.error) {
            assistantContent = "Sorry, something went wrong. Please try again.";
            setMessages(m => { const u = [...m]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; });
            break;
          }
          if (parsed.done) break;
          if (parsed.content) { assistantContent += parsed.content; setMessages(m => { const u = [...m]; u[u.length - 1] = { role: "assistant", content: assistantContent }; return u; }); }
        } catch {}
      }
      if (assistantContent === "Sorry, something went wrong. Please try again.") break;
    }
    setLoading(false);
  };

  return (
    <>
      <button
        onClick={() => setOpen(true)}
        className="ai-chat-trigger fixed bottom-6 right-6 z-50 group flex items-center gap-2.5 px-5 py-3 rounded-full text-white font-semibold text-sm shadow-2xl transition-all duration-300 hover:scale-105 active:scale-95"
      >
        {/* Pulse ring */}
        <span className="relative flex-shrink-0">
          <span className="absolute inset-0 rounded-full bg-white/30 animate-ping" style={{ animationDuration: "2s" }} />
          <Sparkles className="w-4 h-4 relative z-10" />
        </span>
        <span className="whitespace-nowrap">Chat with {portfolioName}'s AI</span>
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md h-[640px] flex flex-col p-0 overflow-hidden">
          <DialogHeader className="px-4 py-3 border-b flex-shrink-0">
            <DialogTitle className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-primary" />
              Ask about {portfolioName}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground mt-0.5">Discuss this candidate with the AI — ask anything about their background, skills, or fit.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {messages.length === 0 && (
              <div className="space-y-4">
                <div className="text-center text-muted-foreground text-sm pt-4">
                  <Sparkles className="w-8 h-8 mx-auto mb-2 opacity-30" />
                  <p className="font-medium mb-1">I know everything about {portfolioName}</p>
                  <p className="text-xs opacity-60">Ask me about their experience, skills, achievements, or suitability for your role.</p>
                </div>
                <div className="space-y-2">
                  <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Quick questions</p>
                  {DEFAULT_MESSAGES.map((msg) => (
                    <button key={msg} onClick={() => sendMessage(msg)} className="w-full text-left text-sm px-3 py-2 rounded-lg border border-primary/20 hover:bg-primary/5 hover:border-primary/40 transition-colors text-foreground">
                      {msg}
                    </button>
                  ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[82%] rounded-2xl px-3 py-2 text-sm whitespace-pre-wrap leading-relaxed ${m.role === "user" ? "bg-primary text-primary-foreground rounded-br-sm" : "bg-muted text-foreground rounded-bl-sm"}`}>
                  {m.content || <Loader2 className="w-3 h-3 animate-spin" />}
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>
          {messages.length > 0 && (
            <div className="px-4 pb-1 flex flex-wrap gap-1">
              {DEFAULT_MESSAGES.slice(0, 2).map((msg) => (
                <button key={msg} onClick={() => sendMessage(msg)} className="text-xs px-2 py-1 rounded-full border border-primary/20 hover:bg-primary/10 transition-colors text-muted-foreground">
                  {msg}
                </button>
              ))}
            </div>
          )}
          <div className="border-t p-3 flex gap-2 flex-shrink-0">
            <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask anything about this person..." onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()} disabled={loading} />
            <Button size="icon" onClick={() => sendMessage()} disabled={loading || !input.trim()}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}

// ─── CV Import ────────────────────────────────────────────────────────────
function CvImportModal({ open, onClose, onImport }: { open: boolean; onClose: () => void; onImport: (data: Record<string, unknown>) => Promise<void> }) {
  const [text, setText] = useState("");
  const [status, setStatus] = useState<"idle" | "extracting" | "importing" | "done">("idle");
  const extractCv = useExtractCv();

  const handleImport = async () => {
    if (!text.trim()) return;
    setStatus("extracting");
    try {
      const r = await extractCv.mutateAsync({ data: { text } });
      setStatus("importing");
      await onImport(r as Record<string, unknown>);
      setStatus("done");
      setTimeout(() => { setText(""); setStatus("idle"); onClose(); }, 1200);
    } catch {
      setStatus("idle");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o && status === "idle") { setText(""); onClose(); } }}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><FileText className="w-4 h-4" /> Import from CV</DialogTitle>
          <DialogDescription>Paste your CV to auto-fill portfolio fields via AI extraction.</DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
          <div className="flex items-start gap-2 p-3 rounded-lg bg-secondary border border-border text-muted-foreground text-xs">
            <span className="text-base leading-none">⚠️</span>
            <span><strong>This replaces all existing data.</strong> Your current experience, education, skills, and certifications will be deleted and replaced with data from this CV.</span>
          </div>
          <p className="text-sm text-muted-foreground">Paste your full CV text. AI will parse every field with precision and create skill categories automatically.</p>
          <Textarea value={text} onChange={(e) => setText(e.target.value)} placeholder="Paste your full CV / resume text here..." className="min-h-[220px] font-mono text-xs" disabled={status !== "idle"} />
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => { setText(""); setStatus("idle"); onClose(); }} disabled={status !== "idle" && status !== "done"}>Cancel</Button>
          <Button onClick={handleImport} disabled={!text.trim() || status !== "idle"} className="gap-2">
            {status === "extracting" && <><Loader2 className="w-4 h-4 animate-spin" /> Extracting with AI...</>}
            {status === "importing" && <><Loader2 className="w-4 h-4 animate-spin" /> Saving data...</>}
            {status === "done" && <><Check className="w-4 h-4" /> Imported!</>}
            {status === "idle" && "Extract & Replace"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Password dialog ───────────────────────────────────────────────
function ChangePasswordDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [current, setCurrent] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const changePassword = useChangePassword();

  const handleChange = async () => {
    setError("");
    if (newPw !== confirm) { setError("New passwords do not match"); return; }
    if (newPw.length < 8) { setError("Password must be at least 8 characters"); return; }
    try {
      await changePassword.mutateAsync({ data: { currentPassword: current, newPassword: newPw, confirmPassword: confirm } });
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); setCurrent(""); setNewPw(""); setConfirm(""); }, 1500);
    } catch (err: unknown) {
      const e = err as { data?: { error?: string } };
      setError(e?.data?.error || "Failed to change password");
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setError(""); setCurrent(""); setNewPw(""); setConfirm(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><Lock className="w-4 h-4" /> Change Password</DialogTitle></DialogHeader>
        {success ? (
          <div className="py-4 text-center text-green-500 font-medium flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Password changed successfully!
          </div>
        ) : (
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <div className="relative mt-1">
                <Input type={showCurrent ? "text" : "password"} value={current} onChange={(e) => setCurrent(e.target.value)} placeholder="Enter current password" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowCurrent(s => !s)}>
                  {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">New Password</label>
              <div className="relative mt-1">
                <Input type={showNew ? "text" : "password"} value={newPw} onChange={(e) => setNewPw(e.target.value)} placeholder="At least 4 characters" />
                <button className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground" onClick={() => setShowNew(s => !s)}>
                  {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Confirm New Password</label>
              <Input type="password" value={confirm} onChange={(e) => setConfirm(e.target.value)} placeholder="Repeat new password" className="mt-1" onKeyDown={(e) => e.key === "Enter" && handleChange()} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleChange} disabled={!current || !newPw || !confirm || changePassword.isPending}>
              {changePassword.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Password"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Change Username dialog ──────────────────────────────────────────────
function ChangeUsernameDialog({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [currentPw, setCurrentPw] = useState("");
  const [newUsername, setNewUsername] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleChange = async () => {
    setError("");
    if (!currentPw || !newUsername) { setError("All fields are required"); return; }
    if (newUsername.length < 3) { setError("Username must be at least 3 characters"); return; }
    if (!/^[a-zA-Z0-9_]+$/.test(newUsername)) { setError("Only letters, numbers, and underscores allowed"); return; }
    setLoading(true);
    try {
      const token = localStorage.getItem("portfolio_token");
      const res = await fetch("/api/portfolio/change-username", {
        method: "POST",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ currentPassword: currentPw, newUsername }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to change username");
      setSuccess(true);
      setTimeout(() => { onClose(); setSuccess(false); setCurrentPw(""); setNewUsername(""); }, 1500);
    } catch (err: any) {
      setError(err.message || "Failed to change username");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) { onClose(); setError(""); setCurrentPw(""); setNewUsername(""); } }}>
      <DialogContent className="max-w-sm">
        <DialogHeader><DialogTitle className="flex items-center gap-2"><User className="w-4 h-4" /> Change Login Username</DialogTitle></DialogHeader>
        {success ? (
          <div className="py-4 text-center text-green-500 font-medium flex items-center justify-center gap-2">
            <Check className="w-5 h-5" /> Username changed successfully!
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-muted-foreground">This is the username you use to sign in — it is separate from your display name.</p>
            <div>
              <label className="text-sm font-medium">Current Password</label>
              <Input type="password" value={currentPw} onChange={(e) => setCurrentPw(e.target.value)} placeholder="Enter current password" className="mt-1" />
            </div>
            <div>
              <label className="text-sm font-medium">New Username</label>
              <Input value={newUsername} onChange={(e) => setNewUsername(e.target.value)} placeholder="Letters, numbers, underscores" className="mt-1" onKeyDown={(e) => e.key === "Enter" && handleChange()} />
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
          </div>
        )}
        {!success && (
          <DialogFooter>
            <Button variant="outline" onClick={onClose}>Cancel</Button>
            <Button onClick={handleChange} disabled={!currentPw || !newUsername || loading}>
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Change Username"}
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────
export default function PortfolioPage() {
  const qc = useQueryClient();
  const currentSlug = (() => {
    const parts = window.location.pathname.split('/').filter(Boolean);
    const urlSlug = parts.length > 0 ? parts[0] : 'default';
    if (urlSlug === 'admin') {
      return localStorage.getItem("portfolio_slug") || 'default';
    }
    return urlSlug;
  })();
  const { data: portfolio, isLoading, error } = useGetPortfolio({
    query: { queryKey: [...getGetPortfolioQueryKey(), currentSlug] }
  });

  // Update SEO meta tags when portfolio data is loaded
  useEffect(() => {
    if (!portfolio?.name) return;

    const name = portfolio.name;
    const about = portfolio.about || "";
    const description = about.replace(/<[^>]*>/g, "").trim().slice(0, 160) || `${name}'s professional portfolio`;
    const photo = portfolio.photoUrl || "/opengraph.jpg";
    const url = window.location.href;

    document.title = `${name} - Portfolio`;

    const setMeta = (attr: string, key: string, content: string) => {
      let el = document.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement;
      if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
      el.setAttribute("content", content);
    };

    setMeta("name", "description", description);
    setMeta("property", "og:type", "profile");
    setMeta("property", "og:title", `${name} - Portfolio`);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", photo);
    setMeta("property", "og:url", url);
    setMeta("name", "twitter:card", "summary_large_image");
    setMeta("name", "twitter:title", `${name} - Portfolio`);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", photo);

    const canonical = document.querySelector("link[rel='canonical']") || document.createElement("link");
    canonical.setAttribute("rel", "canonical");
    canonical.setAttribute("href", url);
    if (!canonical.parentNode) document.head.appendChild(canonical);

    const jsonLd: Record<string, any> = {
      "@context": "https://schema.org",
      "@type": "Person",
      "name": name.replace(/[<>"'&]/g, ""),
      "url": url,
      "image": photo,
      "description": description.replace(/[<>"'&]/g, ""),
    };
    if (portfolio.email) jsonLd.email = portfolio.email.replace(/[<>"'&]/g, "");
    if (portfolio.phone) jsonLd.telephone = portfolio.phone.replace(/[<>"'&]/g, "");
    if (portfolio.location) jsonLd.address = { "@type": "PostalAddress", "addressLocality": portfolio.location.replace(/[<>"'&]/g, "") };

    let ldScript = document.querySelector("script[type='application/ld+json']") as HTMLScriptElement;
    if (!ldScript) { ldScript = document.createElement("script"); ldScript.type = "application/ld+json"; document.head.appendChild(ldScript); }
    ldScript.textContent = JSON.stringify(jsonLd);
  }, [portfolio]);

  const updatePortfolio = useUpdatePortfolio();

  // Auth
  const [themeOverride, setThemeOverride] = useState<string | null>(null);
  
  // /admin/:slug requires a valid JWT token — but skip /admin/clients and /admin/create (they have their own auth)
  const pathname = window.location.pathname;
  const isAdminRoute = /^\/admin\/[^/]+$/.test(pathname) && !pathname.includes('/admin/clients') && !pathname.includes('/admin/create');
  const [isAdmin, setIsAdmin] = useState(() => {
    if (!isAdminRoute) return false;
    const token = localStorage.getItem("portfolio_token");
    const slug = localStorage.getItem("portfolio_slug");
    if (!token || !slug) {
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    // Verify the slug in the URL matches the stored slug
    const urlSlug = window.location.pathname.split("/")[2];
    if (urlSlug !== slug) {
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    // Check JWT expiry (decode payload without verifying signature)
    try {
      const payload = JSON.parse(atob(token.split(".")[1]));
      if (payload.exp && payload.exp * 1000 < Date.now()) {
        localStorage.removeItem("portfolio_token");
        localStorage.removeItem("portfolio_slug");
        window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
        return false;
      }
    } catch {
      localStorage.removeItem("portfolio_token");
      localStorage.removeItem("portfolio_slug");
      window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`;
      return false;
    }
    return true;
  });
  // State for Create Client dialog
  const [showCreateClientDialog, setShowCreateClientDialog] = useState(false);

  const isDefaultPortfolio = currentSlug === 'default';

  // Section ordering
  const [sectionOrder, setSectionOrder] = useState<string[]>([]);

  // UI state
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isExporting, setIsExporting] = useState(false);

  // Dialog: About
  const [showAboutDialog, setShowAboutDialog] = useState(false);

  // Dialog: Experience
  const [showExpDialog, setShowExpDialog] = useState(false);
  const [editingExp, setEditingExp] = useState<Experience | null>(null);

  // Dialog: Education
  const [showEduDialog, setShowEduDialog] = useState(false);
  const [editingEdu, setEditingEdu] = useState<Education | null>(null);

  // Skill inline form
  const [showSkillForm, setShowSkillForm] = useState(false);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCat, setNewSkillCat] = useState('');

  // Dialog: Certification
  const [showCertDialog, setShowCertDialog] = useState(false);
  const [editingCert, setEditingCert] = useState<Certification | null>(null);
  const [certName, setCertName] = useState('');
  const [certIssuer, setCertIssuer] = useState('');
  const [certDate, setCertDate] = useState('');

  // Dialog: Custom Section
  const [showCustomSectionDialog, setShowCustomSectionDialog] = useState(false);
  const [editingCustomSection, setEditingCustomSection] = useState<CustomSection | null>(null);
  const [csTitle, setCsTitle] = useState('');
  const [csContent, setCsContent] = useState('');

  // Dialog: Custom Section Item
  const [showCsiDialog, setShowCsiDialog] = useState(false);
  const [editingCsi, setEditingCsi] = useState<CustomSectionItem | null>(null);
  const [csiSectionId, setCsiSectionId] = useState<number | null>(null);
  const [csiSectionTitle, setCsiSectionTitle] = useState('');

  // Dialog: Additional Info
  const [showAddInfoDialog, setShowAddInfoDialog] = useState(false);
  const [addInfoKey, setAddInfoKey] = useState('');
  const [addInfoVal, setAddInfoVal] = useState('');

  // Dialog: CV Import
  const [showCvModal, setShowCvModal] = useState(false);
  const [selectedCvTemplate, setSelectedCvTemplate] = useState<CvTemplateKey>("executive");

  // Dialog: CV Preview
  const [showCvPreview, setShowCvPreview] = useState(false);
  const [cvPreviewHtml, setCvPreviewHtml] = useState("");

  // CV Export Section Settings
  const defaultSections = { experience: true, education: true, skills: true, certifications: true, blogs: true, customSections: true };
  const [cvExportSections, setCvExportSections] = useState<Record<string, boolean>>((portfolio as any)?.cvExportSections || defaultSections);
  const [showExportSettings, setShowExportSettings] = useState(false);
  const [savingExportSettings, setSavingExportSettings] = useState(false);

  // Dialog: Reset Confirm
  const [showResetConfirm, setShowResetConfirm] = useState(false);

  // Dialog: Change Password
  const [showChangePw, setShowChangePw] = useState(false);
  const [showChangeUsername, setShowChangeUsername] = useState(false);

  // Photo upload ref
  const photoInputRef = useRef<HTMLInputElement>(null);

  // Mutations
  const addEducation = useAddEducation();
  const updateEducation = useUpdateEducation();
  const deleteEducation = useDeleteEducation();
  const addExperience = useAddExperience();
  const updateExperience = useUpdateExperience();
  const deleteExperience = useDeleteExperience();
  const addSkill = useAddSkill();
  const deleteSkill = useDeleteSkill();
  const addCert = useAddCertification();
  const updateCert = useUpdateCertification();
  const deleteCert = useDeleteCertification();
  const addBlog = useAddBlog();
  const deleteBlog = useDeleteBlog();
  const addCustomSection = useAddCustomSection();
  const updateCustomSection = useUpdateCustomSection();
  const deleteCustomSection = useDeleteCustomSection();
  const addCsi = useAddCustomSectionItem();
  const updateCsi = useUpdateCustomSectionItem();
  const deleteCsi = useDeleteCustomSectionItem();

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: getGetPortfolioQueryKey() }), [qc]);

  useEffect(() => {
    if (portfolio?.sectionOrder && sectionOrder.length === 0) setSectionOrder(portfolio.sectionOrder);
  }, [portfolio?.sectionOrder]);

  useEffect(() => {
    if (portfolio?.cvExportSections) setCvExportSections(portfolio.cvExportSections as Record<string, boolean>);
  }, [portfolio?.cvExportSections]);

  const saveField = useCallback(async (fields: Record<string, unknown>) => {
    await updatePortfolio.mutateAsync({ data: fields as never });
    invalidate();
  }, [updatePortfolio, invalidate]);

  const saveExportSections = async (newSections: Record<string, boolean>) => {
    setSavingExportSettings(true);
    try {
      const token = localStorage.getItem("portfolio_token");
      const res = await fetch("/api/portfolio/cv-export-sections", {
        method: "PUT",
        headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
        body: JSON.stringify({ sections: newSections }),
      });
      if (res.ok) {
        const data = await res.json();
        setCvExportSections(data.cvExportSections);
        invalidate();
      }
    } catch (e) { console.error("Failed to save export sections", e); }
    setSavingExportSettings(false);
  };

  const resizeImage = (file: File, maxPx = 800): Promise<string> =>
    new Promise((resolve, reject) => {
      const img = new Image();
      const url = URL.createObjectURL(file);
      img.onload = () => {
        const scale = Math.min(1, maxPx / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w; canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        URL.revokeObjectURL(url);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = reject;
      img.src = url;
    });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = "";
    try {
      const resized = await resizeImage(file);
      await saveField({ photoUrl: resized });
    } catch { console.error("Image resize failed"); }
  };

  const handleRemovePhoto = async () => {
    await saveField({ photoUrl: null });
  };

  const handleLogout = async () => {
    // Revoke JWT on server
    try { await fetch("/api/portfolio/logout", { method: "POST", ...getAuthHeaders() }); } catch {}
    localStorage.removeItem("portfolio_slug");
    localStorage.removeItem("portfolio_password");
    localStorage.removeItem("portfolio_token");
    // Redirect back to this portfolio's own public page (uses DB slug, not URL)
    const portfolioSlug = portfolio?.slug;
    window.location.href = (!portfolioSlug || portfolioSlug === 'default') ? '/' : `/${portfolioSlug}`;
  };

  const moveSectionUp = async (idx: number) => {
    if (idx === 0) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx - 1], newOrder[idx]] = [newOrder[idx], newOrder[idx - 1]];
    setSectionOrder(newOrder);
    await saveField({ sectionOrder: newOrder });
  };

  const moveSectionDown = async (idx: number) => {
    if (idx === sectionOrder.length - 1) return;
    const newOrder = [...sectionOrder];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    setSectionOrder(newOrder);
    await saveField({ sectionOrder: newOrder });
  };

  const moveItemOptimistic = useCallback(<T extends { id: number; orderIndex: number }>(
    items: T[],
    idxA: number,
    idxB: number,
    cacheKey: string,
    saveFn: (idA: number, oA: number, idB: number, oB: number) => void
  ) => {
    const a = items[idxA], b = items[idxB];
    const oA = a.orderIndex, oB = b.orderIndex;
    qc.setQueryData(getGetPortfolioQueryKey(), (old: Portfolio | undefined) => {
      if (!old) return old;
      if (cacheKey.startsWith("custom_")) {
        const csId = parseInt(cacheKey.replace("custom_", ""));
        const newSections = (old.customSections || []).map(cs => {
          if (cs.id !== csId) return cs;
          const newItems = (cs.items || []).map(item => {
            if (item.id === a.id) return { ...item, orderIndex: oB };
            if (item.id === b.id) return { ...item, orderIndex: oA };
            return item;
          }).sort((x, y) => x.orderIndex - y.orderIndex);
          return { ...cs, items: newItems };
        });
        return { ...old, customSections: newSections };
      }
      const arr = ((old as unknown as Record<string, T[]>)[cacheKey] || []).map(item => {
        if (item.id === a.id) return { ...item, orderIndex: oB };
        if (item.id === b.id) return { ...item, orderIndex: oA };
        return item;
      }).sort((x, y) => x.orderIndex - y.orderIndex);
      return { ...old, [cacheKey]: arr };
    });
    saveFn(a.id, oB, b.id, oA);
  }, [qc]);

  const moveItemUp = <T extends { id: number; orderIndex: number }>(
    items: T[], idx: number, cacheKey: string,
    updateFn: (id: number, data: { orderIndex: number }) => Promise<unknown>
  ) => {
    if (idx === 0) return;
    moveItemOptimistic(items, idx, idx - 1, cacheKey, (idA, oA, idB, oB) => {
      Promise.all([updateFn(idA, { orderIndex: oA }), updateFn(idB, { orderIndex: oB })]).catch(() => invalidate());
    });
  };

  const moveItemDown = <T extends { id: number; orderIndex: number }>(
    items: T[], idx: number, cacheKey: string,
    updateFn: (id: number, data: { orderIndex: number }) => Promise<unknown>
  ) => {
    if (idx === items.length - 1) return;
    moveItemOptimistic(items, idx, idx + 1, cacheKey, (idA, oA, idB, oB) => {
      Promise.all([updateFn(idA, { orderIndex: oA }), updateFn(idB, { orderIndex: oB })]).catch(() => invalidate());
    });
  };

  const handleCvImport = async (data: Record<string, unknown>) => {
    const res = await fetch("/api/portfolio/import-cv", {
      method: "POST",
      headers: { 
        "Content-Type": "application/json",
        "x-portfolio-slug": currentSlug,
        ...getAuthHeaders(),
      },
      body: JSON.stringify(data),
    });
    if (!res.ok) throw new Error("CV import failed");
    const fresh = await res.json();
    // Update cache and invalidate to ensure UI refreshes
    qc.setQueryData(getGetPortfolioQueryKey(), fresh);
    // Force refetch to ensure all subscribers get notified
    await qc.refetchQueries({ queryKey: getGetPortfolioQueryKey() });
  };

  const handleReset = async () => {
    setIsResetting(true);
    try {
      const res = await fetch("/api/portfolio/reset", { 
        method: "POST",
        headers: {
          "x-portfolio-slug": currentSlug,
          ...getAuthHeaders(),
        }
      });
      if (!res.ok) throw new Error("Reset failed");
      const fresh = await res.json();
      qc.setQueryData(getGetPortfolioQueryKey(), fresh);
      // Force refetch to ensure all subscribers get notified
      await qc.refetchQueries({ queryKey: getGetPortfolioQueryKey() });
      setSectionOrder(["experience", "education", "skills", "certifications", "blogs"]);
      setShowResetConfirm(false);
    } catch (e) {
      console.error(e);
    } finally {
      setIsResetting(false);
    }
  };

  const handleExport = async () => {
    if (!portfolio) return;
    setIsExporting(true);
    try {
      const { downloadCv } = await import("@/lib/exportCv");
      await downloadCv(portfolio as Parameters<typeof downloadCv>[0], { template: selectedCvTemplate });
    } catch (e) {
      console.error("Export failed", e);
    } finally {
      setIsExporting(false);
    }
  };

  const handlePreviewCv = async () => {
    if (!portfolio) return;
    try {
      const { getCvHtml } = await import("@/lib/exportCv");
      const html = getCvHtml(portfolio as Parameters<typeof getCvHtml>[0], { template: selectedCvTemplate });
      setCvPreviewHtml(html);
      setShowCvPreview(true);
    } catch (e) {
      console.error("Preview failed", e);
    }
  };

  // Apply theme class to body so dialogs (portaled outside .portfolio-root) get theme colors
  const theme = themeOverride ?? portfolio?.theme ?? "orbital";
  useEffect(() => {
    document.body.className = `theme-${theme}`;
    return () => { document.body.className = ""; };
  }, [theme]);

  // Nexus cursor tracking
  useEffect(() => {
    if (theme !== "nexus") return;
    const dot = document.querySelector(".nexus-cursor-dot") as HTMLElement;
    const ring = document.querySelector(".nexus-cursor-ring") as HTMLElement;
    const glow = document.querySelector(".nexus-mouse-glow") as HTMLElement;
    if (!dot || !ring) return;
    let mouseX = 0, mouseY = 0;
    let ringX = 0, ringY = 0;
    const onMove = (e: MouseEvent) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
      dot.style.left = mouseX + "px";
      dot.style.top = mouseY + "px";
      if (glow) { glow.style.left = mouseX + "px"; glow.style.top = mouseY + "px"; }
    };
    const onEnter = () => { dot.style.opacity = "1"; ring.style.opacity = "1"; };
    const onLeave = () => { dot.style.opacity = "0"; ring.style.opacity = "0"; };
    let raf: number;
    const animate = () => {
      ringX += (mouseX - ringX) * 0.15;
      ringY += (mouseY - ringY) * 0.15;
      ring.style.left = ringX + "px";
      ring.style.top = ringY + "px";
      raf = requestAnimationFrame(animate);
    };
    raf = requestAnimationFrame(animate);
    document.addEventListener("mousemove", onMove);
    document.addEventListener("mouseenter", onEnter);
    document.addEventListener("mouseleave", onLeave);
    return () => {
      cancelAnimationFrame(raf);
      document.removeEventListener("mousemove", onMove);
      document.removeEventListener("mouseenter", onEnter);
      document.removeEventListener("mouseleave", onLeave);
    };
  }, [theme]);

  // Nexus typewriter effect
  const [typewriterIdx, setTypewriterIdx] = useState(0);
  const [typewriterText, setTypewriterText] = useState("");
  const [typewriterDeleting, setTypewriterDeleting] = useState(false);
  const nexusTitles = [
    portfolio?.title || "Professional",
    "Finance Student",
    "ACCA Candidate",
    "Future Financial Analyst",
  ];
  useEffect(() => {
    if (theme !== "nexus") return;
    const current = nexusTitles[typewriterIdx] || "";
    let timeout: ReturnType<typeof setTimeout>;
    if (!typewriterDeleting) {
      if (typewriterText.length < current.length) {
        timeout = setTimeout(() => setTypewriterText(current.slice(0, typewriterText.length + 1)), 60);
      } else {
        timeout = setTimeout(() => setTypewriterDeleting(true), 2500);
      }
    } else {
      if (typewriterText.length > 0) {
        timeout = setTimeout(() => setTypewriterText(typewriterText.slice(0, -1)), 35);
      } else {
        setTypewriterDeleting(false);
        setTypewriterIdx((i) => (i + 1) % nexusTitles.length);
      }
    }
    return () => clearTimeout(timeout);
  }, [theme, typewriterText, typewriterDeleting, typewriterIdx]);

  // Nexus parallax scroll
  const [scrollY, setScrollY] = useState(0);
  useEffect(() => {
    if (theme !== "nexus") return;
    const onScroll = () => setScrollY(window.scrollY);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, [theme]);

  // Nexus hero entrance
  const [nexusHeroLoaded, setNexusHeroLoaded] = useState(false);
  useEffect(() => {
    if (theme !== "nexus") return;
    const t = setTimeout(() => setNexusHeroLoaded(true), 50);
    return () => clearTimeout(t);
  }, [theme]);

  // Nexus ripple handler
  const handleNexusRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.className = "nexus-ripple";
    ripple.style.left = (e.clientX - rect.left - 10) + "px";
    ripple.style.top = (e.clientY - rect.top - 10) + "px";
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  // ── Nexus handler wrappers ──────────────────────────────────────────────
  const nexusHandlers = theme === "nexus" ? {
    onEditExp: (e: Experience) => { setEditingExp(e); setShowExpDialog(true); },
    onDeleteExp: async (id: string) => { await deleteExperience.mutateAsync({ id }); invalidate(); },
    onAddExp: () => { setEditingExp(null); setShowExpDialog(true); },
    onMoveExpUp: (i: number) => moveItemUp(portfolio?.experience || [], i, "experience", (id, d) => updateExperience.mutateAsync({ id, data: d })),
    onMoveExpDown: (i: number) => moveItemDown(portfolio?.experience || [], i, "experience", (id, d) => updateExperience.mutateAsync({ id, data: d })),
    onEditEdu: (e: Education) => { setEditingEdu(e); setShowEduDialog(true); },
    onDeleteEdu: async (id: string) => { await deleteEducation.mutateAsync({ id }); invalidate(); },
    onAddEdu: () => { setEditingEdu(null); setShowEduDialog(true); },
    onMoveEduUp: (i: number) => moveItemUp(portfolio?.education || [], i, "education", (id, d) => updateEducation.mutateAsync({ id, data: d })),
    onMoveEduDown: (i: number) => moveItemDown(portfolio?.education || [], i, "education", (id, d) => updateEducation.mutateAsync({ id, data: d })),
    onDeleteSkill: async (id: string) => { await deleteSkill.mutateAsync({ id }); invalidate(); },
    onAddSkill: async (name: string, category: string) => { await addSkill.mutateAsync({ data: { name, category } }); invalidate(); },
    onEditCert: (c: Certification) => { setEditingCert(c); setCertName(c.name); setCertIssuer(c.issuer); setCertDate(c.date || ""); setShowCertDialog(true); },
    onDeleteCert: async (id: string) => { await deleteCert.mutateAsync({ id }); invalidate(); },
    onAddCert: () => { setEditingCert(null); setCertName(""); setCertIssuer(""); setCertDate(""); setShowCertDialog(true); },
    onDeleteBlog: async (id: string) => { await deleteBlog.mutateAsync({ id }); invalidate(); },
    onWritePost: () => { window.location.href = "/blogs"; },
    onEditSection: (s: CustomSection) => { setEditingCustomSection(s); setCsTitle(s.title); setCsContent(s.content); setShowCustomSectionDialog(true); },
    onDeleteSection: async (id: string) => { await deleteCustomSection.mutateAsync({ id }); invalidate(); },
    onAddSection: () => { setEditingCustomSection(null); setCsTitle(""); setCsContent(""); setShowCustomSectionDialog(true); },
    onAddItem: (sectionId: number, sectionTitle: string) => { setEditingCsi(null); setCsiSectionId(sectionId); setCsiSectionTitle(sectionTitle); setShowCsiDialog(true); },
    onEditItem: (item: CustomSectionItem, sectionId: number, sectionTitle: string) => { setEditingCsi(item); setCsiSectionId(sectionId); setCsiSectionTitle(sectionTitle); setShowCsiDialog(true); },
    onDeleteItem: async (id: string) => { await deleteCsi.mutateAsync({ id }); invalidate(); },
    onMoveNexusItemUp: (items: CustomSectionItem[], idx: number, sectionId: number) => moveItemUp(items, idx, `custom_${sectionId}`, (id, d) => updateCsi.mutateAsync({ id, data: d })),
    onMoveNexusItemDown: (items: CustomSectionItem[], idx: number, sectionId: number) => moveItemDown(items, idx, `custom_${sectionId}`, (id, d) => updateCsi.mutateAsync({ id, data: d })),
    onEditAbout: () => setShowAboutDialog(true),
    onDeleteInfo: (key: string) => { const u = { ...portfolio?.additionalInfo }; delete u[key]; saveField({ additionalInfo: u }); },
    onAddInfo: () => setShowAddInfoDialog(true),
    onThemeChange: (t: string) => { setThemeOverride(t); saveField({ theme: t }); },
    onImportCV: () => setShowCvModal(true),
    onReset: () => setShowResetConfirm(true),
    onChangePassword: () => setShowChangePw(true),
    onStatusChange: (s: string) => saveField({ status: s, employmentStatus: s }),
    onCvTemplateChange: (t: string) => setSelectedCvTemplate(t as CvTemplateKey),
  } : null;

  if (isLoading) return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  if (error || !portfolio) return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <div className="max-w-md text-center space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-destructive mb-2">Failed to Load Portfolio</h1>
          <p className="text-muted-foreground text-sm">
            {error ? "There was a problem loading your portfolio. This might be due to invalid credentials or a temporary server issue." : "The portfolio could not be found. Please check the URL and try again."}
          </p>
        </div>
        <div className="flex gap-3 justify-center">
          <Button variant="outline" onClick={() => window.location.reload()}>Try Again</Button>
          <Button variant="ghost" onClick={() => window.location.href = "/"}>Back Home</Button>
        </div>
      </div>
    </div>
  );

  const features = portfolio.features || { cvImportExport: true, aiChat: true, themeSelector: true, blogPage: true, exploreAccess: false, aiMatchAccess: false };

  const STATUS_OPTIONS = [
    { value: "open", label: "Open to Opportunities" },
    { value: "hiring", label: "Hiring" },
    { value: "employed", label: "Currently Employed" },
    { value: "freelance", label: "Available for Freelance" },
  ];

  const statusLabel = STATUS_OPTIONS.find(o => o.value === portfolio.status)?.label || portfolio.status;

  const skillsByCategory: Record<string, typeof portfolio.skills> = {};
  for (const skill of portfolio.skills || []) {
    if (!skillsByCategory[skill.category]) skillsByCategory[skill.category] = [];
    skillsByCategory[skill.category].push(skill);
  }

  // Section definitions
  type SectionDef = { key: string; label: string; icon: React.ReactNode; isEmpty: boolean };
  const coreSections: SectionDef[] = [
    { key: "experience", label: "Experience", icon: <Briefcase className="w-5 h-5" />, isEmpty: (portfolio.experience || []).length === 0 },
    { key: "education", label: "Education", icon: <GraduationCap className="w-5 h-5" />, isEmpty: (portfolio.education || []).length === 0 },
    { key: "skills", label: "Skills", icon: <Wrench className="w-5 h-5" />, isEmpty: (portfolio.skills || []).length === 0 },
    { key: "certifications", label: "Certifications", icon: <Award className="w-5 h-5" />, isEmpty: (portfolio.certifications || []).length === 0 },
    { key: "blogs", label: "Blog", icon: <BookOpen className="w-5 h-5" />, isEmpty: !features.blogPage || (portfolio.blogs || []).length === 0 },
  ];
  const customSectionDefs: SectionDef[] = (portfolio.customSections || []).map(cs => ({
    key: `custom_${cs.id}`,
    label: cs.title,
    icon: <Layers className="w-5 h-5" />,
    isEmpty: (cs.items || []).length === 0 && !cs.content,
  }));
  const allSections = [...coreSections, ...customSectionDefs];

  const orderedSections = [
    ...sectionOrder.map(k => allSections.find(s => s.key === k)).filter(Boolean) as SectionDef[],
    ...allSections.filter(s => !sectionOrder.includes(s.key)),
  ].filter(s => isAdmin || !s.isEmpty);

  return (
    <div className={`portfolio-root theme-${theme} min-h-screen`}>
      {/* Nexus interactive overlay elements */}
      {theme === "nexus" && (
        <>
          <div className="nexus-orb-1" />
          <div className="nexus-orb-2" />
          <div className="nexus-orb-3" />
          <div className="nexus-cursor-dot" style={{ opacity: 0 }} />
          <div className="nexus-cursor-ring" style={{ opacity: 0 }} />
          <div className="nexus-mouse-glow" />
        </>
      )}

      {/* ── Admin bar ─────────────────────────────────────────────────── */}
      <div className="portfolio-topbar fixed top-0 left-0 right-0 z-40 backdrop-blur border-b text-sm">
        <div className="flex items-center justify-between px-4 py-2">
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground">Zilk Co</span>
            <span className="text-xs text-muted-foreground hidden sm:inline">· created by Zilk Co</span>
          </div>
          <div className="flex items-center gap-2">
            {isAdmin && (
              <>
                {/* Desktop controls */}
                <div className="hidden sm:flex items-center gap-2">
                  {features.cvImportExport && (
                    <Button size="sm" variant="outline" onClick={() => setShowCvModal(true)} className="h-7 text-xs gap-1">
                      <FileText className="w-3 h-3" /> Import CV
                    </Button>
                  )}
                  {isAdminRoute && portfolio?.slug === 'default' && (
                    <div className="flex items-center gap-2 border-l border-r px-2 mx-1 border-border/50">
                      <Button size="sm" variant="outline" onClick={() => setShowCreateClientDialog(true)} className="h-7 text-xs gap-1">
                        <Plus className="w-3 h-3" /> Create Client
                      </Button>
                      <a href="/admin/clients" className="no-underline">
                        <Button size="sm" variant="outline" className="h-7 text-xs gap-1 bg-blue-600/10 border-blue-500/30 text-blue-400 hover:bg-blue-600/20">
                          <Settings className="w-3 h-3" /> Manage Clients
                        </Button>
                      </a>
                    </div>
                  )}
                  {features.exploreAccess && (
                    <a href="/explore" className="no-underline">
                      <Button size="sm" variant="outline" className="h-7 text-xs gap-1 bg-purple-600/10 border-purple-500/30 text-purple-400 hover:bg-purple-600/20">
                        <Users className="w-3 h-3" /> Explore
                      </Button>
                    </a>
                  )}
                  {features.cvImportExport && (
                    <Button size="sm" variant="outline" onClick={handleExport} disabled={isExporting} className="h-7 text-xs gap-1">
                      {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Export
                    </Button>
                  )}
                  {features.cvImportExport && (
                    <Button size="sm" variant="outline" onClick={() => setShowExportSettings(true)} className="h-7 text-xs gap-1">
                      <SlidersHorizontal className="w-3 h-3" /> Export Settings
                    </Button>
                  )}
                  <Button size="sm" variant="outline" onClick={() => setShowResetConfirm(true)} className="h-7 text-xs gap-1 text-destructive border-destructive/30 hover:bg-destructive/5">
                    <RotateCcw className="w-3 h-3" /> Reset
                  </Button>
                  {features.themeSelector && (
                    <select className="text-xs border rounded px-2 py-1 bg-background h-7" value={theme} onChange={(e) => { setThemeOverride(e.target.value); saveField({ theme: e.target.value }); }}>
                      <option value="orbital">Orbital Grid</option>
                      <option value="holo">Holo-Scroll</option>
                      <option value="atlas">Atlas Map</option>
                      <option value="legacy">Legacy</option>
                      <option value="noir">Noir</option>
                      <option value="brutalist">Brutalist</option>
                      <option value="sakura">Sakura</option>
                      <option value="abyss">Abyss</option>
                      <option value="nord">Nord</option>
                      <option value="neon-tokyo">Neon Tokyo</option>
                      <option value="cappuccino">Cappuccino</option>
                      <option value="horizon">Horizon</option>
                      <option value="midnight">Midnight</option>
                      <option value="jade">Jade</option>
                      <option value="nexus">Nexus</option>
                      <option value="cyberpunk">Cyberpunk</option>
                      <option value="aurora">Aurora</option>
                      <option value="quantum">Quantum</option>
                      <option value="void">Void</option>
                      <option value="prism">Prism</option>

                    </select>
                  )}
                  <select className="text-xs border rounded px-2 py-1 bg-background h-7" value={portfolio.status} onChange={(e) => saveField({ status: e.target.value, employmentStatus: e.target.value })}>
                    {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
                  </select>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowChangePw(true)}>
                    <Lock className="w-3 h-3" /> Password
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs gap-1" onClick={() => setShowChangeUsername(true)}>
                    <User className="w-3 h-3" /> Username
                  </Button>
                  <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={handleLogout}>
                    Logout
                  </Button>
                </div>
                {/* Mobile menu toggle */}
                <Button size="sm" variant="ghost" className="sm:hidden h-7 w-7 p-0" onClick={() => setShowMobileMenu(v => !v)}>
                  <Menu className="w-4 h-4" />
                </Button>
              </>
            )}
            {!isAdmin && (
              <Button size="sm" onClick={() => window.location.href = `/login?from=${encodeURIComponent(window.location.pathname)}`} className="h-7 text-xs gap-1">
                <User className="w-3 h-3" /> Admin Login
              </Button>
            )}
          </div>
        </div>
        {/* Mobile admin dropdown */}
        {isAdmin && showMobileMenu && (
          <div className="sm:hidden border-t px-4 py-3 flex flex-col gap-3 bg-background/98">
            <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground uppercase tracking-wider">
              <Settings className="w-3 h-3" /> Admin Controls
            </div>
            {features.themeSelector && (
              <div className="flex flex-col gap-2">
                <label className="text-xs text-muted-foreground">Theme</label>
                <select className="text-sm border rounded px-3 py-2 bg-background w-full" value={theme} onChange={(e) => { setThemeOverride(e.target.value); saveField({ theme: e.target.value }); setShowMobileMenu(false); }}>
                  <option value="orbital">Orbital Grid</option>
                  <option value="holo">Holo-Scroll</option>
                  <option value="atlas">Atlas Map</option>
                  <option value="legacy">Legacy</option>
                  <option value="noir">Noir</option>
                  <option value="brutalist">Brutalist</option>
                  <option value="sakura">Sakura</option>
                  <option value="abyss">Abyss</option>
                  <option value="nord">Nord</option>
                  <option value="neon-tokyo">Neon Tokyo</option>
                  <option value="cappuccino">Cappuccino</option>
                  <option value="horizon">Horizon</option>
                  <option value="midnight">Midnight</option>
                  <option value="jade">Jade</option>
                  <option value="nexus">Nexus</option>
                  <option value="cyberpunk">Cyberpunk</option>
                  <option value="aurora">Aurora</option>
                  <option value="quantum">Quantum</option>
                  <option value="void">Void</option>
                  <option value="prism">Prism</option>

                </select>
              </div>
            )}
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Status</label>
              <select className="text-sm border rounded px-3 py-2 bg-background w-full" value={portfolio.status} onChange={(e) => { saveField({ status: e.target.value, employmentStatus: e.target.value }); setShowMobileMenu(false); }}>
                {STATUS_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-xs text-muted-foreground">Resume Template</label>
              <select className="text-sm border rounded px-3 py-2 bg-background w-full" value={selectedCvTemplate} onChange={(e) => { setSelectedCvTemplate(e.target.value as CvTemplateKey); setShowMobileMenu(false); }}>
                {CV_TEMPLATE_OPTIONS.map((option) => <option key={option.id} value={option.id}>{option.name}</option>)}
              </select>
            </div>
            <div className="flex gap-2 flex-wrap">
              {features.cvImportExport && (
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setShowCvModal(true); setShowMobileMenu(false); }}>
                  <FileText className="w-3 h-3" /> Import CV
                </Button>
              )}
              {features.cvImportExport && (
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { handleExport(); setShowMobileMenu(false); }} disabled={isExporting}>
                  {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Export
                </Button>
              )}
              {features.cvImportExport && (
                <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setShowExportSettings(true); setShowMobileMenu(false); }}>
                  <SlidersHorizontal className="w-3 h-3" /> Export Settings
                </Button>
              )}
            </div>
            <div className="flex gap-2">
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setShowChangePw(true); setShowMobileMenu(false); }}>
                <Lock className="w-3 h-3" /> Password
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1" onClick={() => { setShowChangeUsername(true); setShowMobileMenu(false); }}>
                <User className="w-3 h-3" /> Username
              </Button>
              <Button size="sm" variant="outline" className="flex-1 gap-1 text-destructive border-destructive/30" onClick={() => { setShowResetConfirm(true); setShowMobileMenu(false); }}>
                <RotateCcw className="w-3 h-3" /> Reset
              </Button>
            </div>
            {features.exploreAccess && (
            <a href="/explore" className="no-underline">
              <Button size="sm" variant="outline" className="w-full gap-1 bg-purple-600/10 border-purple-500/30 text-purple-400 hover:bg-purple-600/20" onClick={() => setShowMobileMenu(false)}>
                <Users className="w-3 h-3" /> Explore Community
              </Button>
            </a>
            )}
            <Button size="sm" variant="ghost" className="text-destructive" onClick={handleLogout}>
              Logout
            </Button>
          </div>
        )}
      </div>

      <>
      {/* ── Floating Navbar (Nexus theme only) ─────────────────────────── */}
      {theme === "nexus" && (
        <NexusNavbar
          isAdmin={isAdmin}
          portfolio={portfolio}
          features={{ cvImportExport: !!features.cvImportExport }}
          theme={theme}
          onThemeChange={(t) => setTheme(t as any)}
          onExport={handleExport}
          isExporting={isExporting}
          onImportCV={() => setShowImportDialog(true)}
          onReset={() => setShowResetDialog(true)}
          onChangePassword={() => setShowChangePasswordDialog(true)}
          onLogout={handleLogout}
          statusLabel={statusLabel}
          onStatusChange={(s) => updatePortfolio({ status: s as any })}
          selectedCvTemplate={selectedCvTemplate}
          onCvTemplateChange={(t) => setSelectedCvTemplate(t)}
          cvTemplates={CV_TEMPLATE_OPTIONS}
          statusOptions={STATUS_OPTIONS}
        />
      )}

      {/* ── Hero ──────────────────────────────────────────────────────── */}
      {theme === "nexus" ? (
        <NexusHero
          portfolio={portfolio}
          isAdmin={isAdmin}
          onPhotoClick={() => photoInputRef.current?.click()}
          onRemovePhoto={handleRemovePhoto}
          onExport={handleExport}
          features={{ cvImportExport: !!features.cvImportExport }}
        />
      ) : (
      <section className="hero-section pt-16">
        <div className="max-w-5xl mx-auto px-6 py-14 flex flex-col md:flex-row items-center gap-10">
          {/* Photo */}
          <div className="relative flex-shrink-0">
            <div className="w-36 h-36 rounded-full overflow-hidden bg-muted border-4 border-primary/30 shadow-lg cursor-pointer" onClick={() => isAdmin && photoInputRef.current?.click()} title={isAdmin ? "Click to change photo" : ""}>
              {portfolio.photoUrl ? <img src={portfolio.photoUrl} alt={portfolio.name} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center"><User className="w-16 h-16 opacity-20" /></div>}
            </div>
            {isAdmin && (
              <>
                <button className="absolute bottom-0 right-0 bg-secondary text-muted-foreground rounded-full p-1.5 shadow-md border border-border hover:bg-secondary hover:text-foreground transition-colors" title="Upload photo" onClick={() => photoInputRef.current?.click()}>
                  <Upload className="w-3 h-3" />
                </button>
                {portfolio.photoUrl && (
                  <button className="absolute top-0 right-0 bg-secondary text-muted-foreground rounded-full p-1.5 shadow-md border border-border hover:bg-secondary hover:text-destructive transition-colors" title="Remove photo" onClick={handleRemovePhoto}>
                    <ImageOff className="w-3 h-3" />
                  </button>
                )}
              </>
            )}
            <input ref={photoInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoUpload} />
          </div>
          {/* Name & Info */}
          <div className="flex-1 text-center md:text-left">
            <h1 className="text-4xl md:text-5xl font-bold hero-name mb-2">
              {isAdmin ? <InlineEdit value={portfolio.name} onSave={(v) => saveField({ name: v })} /> : portfolio.name}
            </h1>
            <p className="text-lg md:text-xl hero-title mb-3 font-medium opacity-80">
              {isAdmin ? <InlineEdit value={portfolio.title} onSave={(v) => saveField({ title: v })} /> : portfolio.title}
            </p>
            <Badge className="status-badge mb-4">{statusLabel}</Badge>
            <div className="flex flex-wrap gap-4 justify-center md:justify-start text-sm mt-3">
              <span className="flex items-center gap-1.5 opacity-80">
                <Mail className="w-4 h-4 flex-shrink-0" />
                {isAdmin ? <InlineEdit value={portfolio.email} onSave={(v) => saveField({ email: v })} /> : portfolio.email}
              </span>
              <span className="flex items-center gap-1.5 opacity-80">
                <Phone className="w-4 h-4 flex-shrink-0" />
                {isAdmin ? <InlineEdit value={portfolio.phone} onSave={(v) => saveField({ phone: v })} /> : portfolio.phone}
              </span>
              <span className="flex items-center gap-1.5 opacity-80">
                <MapPin className="w-4 h-4 flex-shrink-0" />
                {isAdmin ? <InlineEdit value={portfolio.location} onSave={(v) => saveField({ location: v })} /> : portfolio.location}
              </span>
            </div>
          </div>
        </div>
      </section>
      )}

      {/* ── Resume template selector ──────────────────────────────────── */}
      {isAdmin && (
        <section className="max-w-5xl mx-auto px-6 py-4">
          <div className="section-card p-4 rounded-xl border border-border bg-card">
            <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between mb-3">
              <div className="flex items-center gap-3">
                <h2 className="text-sm font-bold whitespace-nowrap">CV Template</h2>
                <select
                  className="text-sm border rounded px-2 py-1 bg-background min-w-[180px]"
                  value={selectedCvTemplate}
                  onChange={(e) => setSelectedCvTemplate(e.target.value as CvTemplateKey)}
                >
                  {CV_TEMPLATE_OPTIONS.map((o) => (
                    <option key={o.id} value={o.id}>{o.name} — {o.tagline}</option>
                  ))}
                </select>
              </div>
              <div className="flex gap-1.5">
                <Button size="sm" variant="outline" onClick={handlePreviewCv} className="h-6 text-[10px] gap-1 px-2">
                  <Eye className="w-3 h-3" /> Preview
                </Button>
                <Button size="sm" onClick={handleExport} disabled={isExporting} className="h-6 text-[10px] gap-1 px-2">
                  {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Download
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {CV_TEMPLATE_OPTIONS.map((option) => (
                <button
                  key={option.id}
                  type="button"
                  title={option.highlight}
                  onClick={() => setSelectedCvTemplate(option.id)}
                  className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-all border ${
                    selectedCvTemplate === option.id
                      ? "border-primary bg-primary/10 text-primary shadow-sm"
                      : "border-border bg-background text-muted-foreground hover:border-primary/50 hover:text-foreground"
                  }`}
                >
                  {option.name}
                </button>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* ── About ─────────────────────────────────────────────────────── */}
      <section className="max-w-5xl mx-auto px-6 py-6">
        <div className="section-card p-6 rounded-xl">
          <div className="flex items-center justify-between mb-3">
            <h2 className="section-heading text-2xl font-bold">About</h2>
            {isAdmin && (
              <Button size="sm" variant="ghost" className="h-7 gap-1" onClick={() => setShowAboutDialog(true)}>
                <Pencil className="w-3 h-3" /> Edit
              </Button>
            )}
          </div>
          <RichTextDisplay html={portfolio.about} />
          <div className="mt-4 flex flex-wrap gap-2">
            {Object.entries(portfolio.additionalInfo || {}).map(([k, v]) => (
              <div key={k} className="info-chip flex items-center gap-2 rounded-full px-4 py-1 text-sm">
                <span className="font-medium">{k}:</span>
                <span>{isAdmin ? <InlineEdit value={v} onSave={(nv) => { const u = { ...portfolio.additionalInfo, [k]: nv }; saveField({ additionalInfo: u }); }} /> : v}</span>
                {isAdmin && <button className="text-destructive opacity-60 hover:opacity-100" onClick={() => { const u = { ...portfolio.additionalInfo }; delete u[k]; saveField({ additionalInfo: u }); }}><X className="w-3 h-3" /></button>}
              </div>
            ))}
            {isAdmin && <button className="info-chip-add flex items-center gap-1 rounded-full px-4 py-1 text-sm border border-dashed" onClick={() => setShowAddInfoDialog(true)}><Plus className="w-3 h-3" /> Add Info</button>}
          </div>
        </div>
      </section>

      {/* ── Sections ──────────────────────────────────────────────────── */}
      <main className="max-w-5xl mx-auto px-6 pb-24 space-y-8">
        {orderedSections.map((section, idx) => {
          const allOrdered = isAdmin ? [...coreSections, ...customSectionDefs].map(s => s.key) : orderedSections.map(s => s.key);
          const isFirst = idx === 0;
          const isLast = idx === orderedSections.length - 1;

          return (
            <section key={section.key} className="section-wrapper" data-section={section.key}>
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <span className="section-icon text-primary">{section.icon}</span>
                  <h2 className="section-heading text-2xl font-bold">{section.label}</h2>
                </div>
                {isAdmin && (
                  <div className="flex items-center gap-1">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={isFirst} onClick={() => moveSectionUp(idx)}><ChevronUp className="w-4 h-4" /></Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={isLast} onClick={() => moveSectionDown(idx)}><ChevronDown className="w-4 h-4" /></Button>
                  </div>
                )}
              </div>

              {/* ── Experience ── */}
              {section.key === "experience" && (
                <div className="space-y-4">
                  {(portfolio.experience || []).map((exp, eIdx) => (
                    <div key={exp.id} className="section-card p-5 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{exp.role}</h3>
                          <p className="text-primary font-medium">{exp.company}</p>
                          <p className="text-sm opacity-60">{exp.startDate} – {exp.endDate || "Present"}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={eIdx === 0} onClick={() => moveItemUp(portfolio.experience, eIdx, "experience", (id, d) => updateExperience.mutateAsync({ id, data: d }))}><ChevronUp className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={eIdx === (portfolio.experience || []).length - 1} onClick={() => moveItemDown(portfolio.experience, eIdx, "experience", (id, d) => updateExperience.mutateAsync({ id, data: d }))}><ChevronDown className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingExp(exp); setShowExpDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await deleteExperience.mutateAsync({ id: String(exp.id) }); invalidate(); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        )}
                      </div>
                      {exp.description && <p className="mt-2 text-sm opacity-80">{exp.description}</p>}
                      {(exp.accomplishments || []).length > 0 && <ul className="mt-2 space-y-0.5">{exp.accomplishments.map((a, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{a}</li>)}</ul>}
                    </div>
                  ))}
                  {isAdmin && <Button variant="outline" className="w-full border-dashed" onClick={() => { setEditingExp(null); setShowExpDialog(true); }}><Plus className="w-4 h-4 mr-2" /> Add Experience</Button>}
                </div>
              )}

              {/* ── Education ── */}
              {section.key === "education" && (
                <div className="space-y-4">
                  {(portfolio.education || []).map((edu, eIdx) => (
                    <div key={edu.id} className="section-card p-5 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold text-lg">{edu.degree} in {edu.field}</h3>
                          <p className="text-primary font-medium">{edu.institution}</p>
                          <p className="text-sm opacity-60">{edu.startDate}{edu.endDate ? ` – ${edu.endDate}` : ""}{edu.grade ? ` · Grade: ${edu.grade}` : ""}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 flex-shrink-0 ml-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={eIdx === 0} onClick={() => moveItemUp(portfolio.education, eIdx, "education", (id, d) => updateEducation.mutateAsync({ id, data: d }))}><ChevronUp className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" disabled={eIdx === (portfolio.education || []).length - 1} onClick={() => moveItemDown(portfolio.education, eIdx, "education", (id, d) => updateEducation.mutateAsync({ id, data: d }))}><ChevronDown className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingEdu(edu); setShowEduDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await deleteEducation.mutateAsync({ id: String(edu.id) }); invalidate(); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        )}
                      </div>
                      {edu.description && <p className="mt-2 text-sm opacity-80">{edu.description}</p>}
                      {(edu.accomplishments || []).length > 0 && <ul className="mt-2 space-y-0.5">{edu.accomplishments.map((a, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{a}</li>)}</ul>}
                    </div>
                  ))}
                  {isAdmin && <Button variant="outline" className="w-full border-dashed" onClick={() => { setEditingEdu(null); setShowEduDialog(true); }}><Plus className="w-4 h-4 mr-2" /> Add Education</Button>}
                </div>
              )}

              {/* ── Skills ── */}
              {section.key === "skills" && (
                <div className="section-card p-5 rounded-xl space-y-4">
                  {Object.entries(skillsByCategory).map(([cat, catSkills]) => (
                    <div key={cat}>
                      <h3 className="text-xs font-semibold opacity-50 uppercase tracking-widest mb-2">{cat}</h3>
                      <div className="flex flex-wrap gap-2">
                        {catSkills.map(skill => (
                          <div key={skill.id} className="flex items-center gap-1">
                            <Badge variant="secondary" className="skill-badge">{skill.name}</Badge>
                            {isAdmin && <button className="text-destructive opacity-50 hover:opacity-100" onClick={async () => { await deleteSkill.mutateAsync({ id: String(skill.id) }); invalidate(); }}><X className="w-3 h-3" /></button>}
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                  {isAdmin && (
                    showSkillForm ? (
                      <div className="flex gap-2 flex-wrap">
                        <Input className="w-40 h-8 text-sm" placeholder="Skill name" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)} />
                        <Input className="w-32 h-8 text-sm" placeholder="Category" value={newSkillCat} onChange={(e) => setNewSkillCat(e.target.value)} />
                        <Button size="sm" onClick={async () => { if (!newSkillName.trim()) return; await addSkill.mutateAsync({ data: { name: newSkillName, category: newSkillCat } }); setNewSkillName(""); setShowSkillForm(false); invalidate(); }}>Add</Button>
                        <Button size="sm" variant="ghost" onClick={() => setShowSkillForm(false)}>Cancel</Button>
                      </div>
                    ) : (
                      <Button variant="outline" size="sm" className="border-dashed" onClick={() => setShowSkillForm(true)}><Plus className="w-3 h-3 mr-1" /> Add Skill</Button>
                    )
                  )}
                </div>
              )}

              {/* ── Certifications ── */}
              {section.key === "certifications" && (
                <div className="space-y-3">
                  {(portfolio.certifications || []).map(cert => (
                    <div key={cert.id} className="section-card p-4 rounded-xl flex items-center justify-between">
                      <div>
                        <h3 className="font-semibold">{cert.name}</h3>
                        <p className="text-sm opacity-60">{cert.issuer}{cert.date ? ` · ${cert.date}` : ""}</p>
                      </div>
                      {isAdmin && (
                        <div className="flex gap-1">
                          <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingCert(cert); setCertName(cert.name); setCertIssuer(cert.issuer); setCertDate(cert.date || ""); setShowCertDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                          <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await deleteCert.mutateAsync({ id: String(cert.id) }); invalidate(); }}><Trash2 className="w-3 h-3" /></Button>
                        </div>
                      )}
                    </div>
                  ))}
                  {isAdmin && <Button variant="outline" className="w-full border-dashed" onClick={() => { setEditingCert(null); setCertName(""); setCertIssuer(""); setCertDate(""); setShowCertDialog(true); }}><Plus className="w-4 h-4 mr-2" /> Add Certification</Button>}
                </div>
              )}

              {/* ── Blogs (preview) ── */}
              {section.key === "blogs" && (
                <div className="space-y-3">
                  {(portfolio.blogs || []).slice(0, 3).map(blog => (
                    <div key={blog.id} className="section-card p-4 rounded-xl">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <h3 className="font-bold">{blog.title}</h3>
                          <p className="text-sm opacity-60 mt-0.5 line-clamp-1">{blog.summary || blog.content.replace(/<[^>]*>/g, "").slice(0, 100)}</p>
                          <p className="text-xs opacity-40 mt-1">{new Date(blog.publishedAt).toLocaleDateString()}</p>
                        </div>
                        {isAdmin && (
                          <div className="flex gap-1 ml-2">
                            <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await deleteBlog.mutateAsync({ id: String(blog.id) }); invalidate(); }}><Trash2 className="w-3 h-3" /></Button>
                          </div>
                        )}
                      </div>
                    </div>
                  ))}
                  <div className="flex gap-2">
                    <Link href="/blogs">
                      <Button variant="outline" className="gap-2">
                        <BookOpen className="w-4 h-4" />
                        {isAdmin ? "Manage All Blog Posts" : "Read All Posts"}
                        {(portfolio.blogs || []).length > 0 && <Badge variant="secondary" className="ml-1">{(portfolio.blogs || []).length}</Badge>}
                      </Button>
                    </Link>
                    {isAdmin && (
                      <Link href="/blogs">
                        <Button className="gap-2">
                          <Plus className="w-4 h-4" /> Write Post
                        </Button>
                      </Link>
                    )}
                  </div>
                </div>
              )}

              {/* ── Custom Sections ── */}
              {section.key.startsWith("custom_") && (() => {
                const csId = parseInt(section.key.replace("custom_", ""));
                const cs = (portfolio.customSections || []).find(s => s.id === csId);
                if (!cs) return null;
                const items = cs.items || [];
                return (
                  <div className="space-y-4">
                    {/* Section-level content (intro/description) */}
                    {cs.content && (
                      <div className="section-card p-5 rounded-xl">
                        <div className="flex items-start justify-between">
                          <RichTextDisplay html={cs.content} className="flex-1" />
                          {isAdmin && (
                            <Button size="icon" variant="ghost" className="h-7 w-7 ml-2" onClick={() => { setEditingCustomSection(cs); setCsTitle(cs.title); setCsContent(cs.content); setShowCustomSectionDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                          )}
                        </div>
                      </div>
                    )}
                    {/* Items */}
                    {items.map((item, iIdx) => (
                      <div key={item.id} className="section-card p-5 rounded-xl">
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <h3 className="font-bold text-lg">{item.title}</h3>
                              {item.url && /^(https?:\/\/|mailto:)/i.test(item.url) && <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-primary opacity-70 hover:opacity-100"><ExternalLink className="w-3.5 h-3.5" /></a>}
                            </div>
                            {item.subtitle && <p className="text-primary font-medium">{item.subtitle}</p>}
                            {(item.startDate || item.endDate) && <p className="text-sm opacity-60">{item.startDate}{item.startDate && item.endDate ? " – " : ""}{item.endDate || (item.startDate ? " – Present" : "")}</p>}
                          </div>
                          {isAdmin && (
                            <div className="flex gap-1 flex-shrink-0 ml-2">
                              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={iIdx === 0} onClick={() => moveItemUp(items, iIdx, `custom_${csId}`, (id, d) => updateCsi.mutateAsync({ id, data: d }))}><ChevronUp className="w-3 h-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" disabled={iIdx === items.length - 1} onClick={() => moveItemDown(items, iIdx, `custom_${csId}`, (id, d) => updateCsi.mutateAsync({ id, data: d }))}><ChevronDown className="w-3 h-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => { setEditingCsi(item); setCsiSectionId(csId); setCsiSectionTitle(cs.title); setShowCsiDialog(true); }}><Pencil className="w-3 h-3" /></Button>
                              <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={async () => { await deleteCsi.mutateAsync({ id: String(item.id) }); invalidate(); }}><Trash2 className="w-3 h-3" /></Button>
                            </div>
                          )}
                        </div>
                        {item.description && <p className="mt-2 text-sm opacity-80">{item.description}</p>}
                        {(item.accomplishments || []).length > 0 && <ul className="mt-2 space-y-0.5">{item.accomplishments.map((a, i) => <li key={i} className="text-sm flex items-start gap-2"><span className="text-primary mt-0.5">•</span>{a}</li>)}</ul>}
                      </div>
                    ))}
                    {isAdmin && (
                      <div className="flex gap-2">
                        <Button variant="outline" className="flex-1 border-dashed" onClick={() => { setEditingCsi(null); setCsiSectionId(csId); setCsiSectionTitle(cs.title); setShowCsiDialog(true); }}>
                          <Plus className="w-4 h-4 mr-2" /> Add {cs.title} Entry
                        </Button>
                        <Button variant="ghost" size="sm" className="gap-1 opacity-60" onClick={() => { setEditingCustomSection(cs); setCsTitle(cs.title); setCsContent(cs.content); setShowCustomSectionDialog(true); }}>
                          <Pencil className="w-3 h-3" /> Edit Section
                        </Button>
                        <Button variant="ghost" size="sm" className="text-destructive gap-1 opacity-60" onClick={async () => { await deleteCustomSection.mutateAsync({ id: String(cs.id) }); setSectionOrder(prev => prev.filter(k => k !== section.key)); invalidate(); }}>
                          <Trash2 className="w-3 h-3" /> Delete
                        </Button>
                      </div>
                    )}
                  </div>
                );
              })()}
            </section>
          );
        })}

        {/* Add Section */}
        {isAdmin && (
          <Button variant="outline" className="w-full border-dashed border-2 py-6 text-base" onClick={() => { setEditingCustomSection(null); setCsTitle(""); setCsContent(""); setShowCustomSectionDialog(true); }}>
            <Plus className="w-5 h-5 mr-2" /> Add Custom Section
          </Button>
        )}
      </main>
      </>

      {features.aiChat && <AiChat portfolioName={portfolio.name} slug={currentSlug} />}

      {/* ── Dialogs ─────────────────────────────────────────────────────── */}
      {/* Change Password */}
      <ChangePasswordDialog open={showChangePw} onClose={() => setShowChangePw(false)} />
      <ChangeUsernameDialog open={showChangeUsername} onClose={() => setShowChangeUsername(false)} />

      {/* About Edit */}
      <AboutEditDialog open={showAboutDialog} onClose={() => setShowAboutDialog(false)} value={portfolio.about} onSave={(v) => saveField({ about: v })} />

      {/* Experience */}
      <ExperienceDialog open={showExpDialog} onClose={() => { setShowExpDialog(false); setEditingExp(null); }}
        initial={editingExp ? { company: editingExp.company, role: editingExp.role, startDate: editingExp.startDate, endDate: editingExp.endDate || "", description: editingExp.description || "", accomplishments: (editingExp.accomplishments || []).join("\n") } : undefined}
        onSave={async (data) => {
          if (editingExp) await updateExperience.mutateAsync({ id: editingExp.id, data });
          else await addExperience.mutateAsync({ data });
          setShowExpDialog(false); setEditingExp(null); invalidate();
        }}
      />

      {/* Education */}
      <EducationDialog open={showEduDialog} onClose={() => { setShowEduDialog(false); setEditingEdu(null); }}
        initial={editingEdu ? { institution: editingEdu.institution, degree: editingEdu.degree, field: editingEdu.field, startDate: editingEdu.startDate, endDate: editingEdu.endDate || "", grade: editingEdu.grade || "", description: editingEdu.description || "", accomplishments: (editingEdu.accomplishments || []).join("\n") } : undefined}
        onSave={async (data) => {
          if (editingEdu) await updateEducation.mutateAsync({ id: editingEdu.id, data });
          else await addEducation.mutateAsync({ data });
          setShowEduDialog(false); setEditingEdu(null); invalidate();
        }}
      />

      {/* Certification */}
      <Dialog open={showCertDialog} onOpenChange={(o) => { if (!o) { setShowCertDialog(false); setEditingCert(null); } }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>{editingCert ? "Edit Certification" : "Add Certification"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Name *</label><Input value={certName} onChange={(e) => setCertName(e.target.value)} placeholder="AWS Solutions Architect" /></div>
            <div><label className="text-sm font-medium">Issuer *</label><Input value={certIssuer} onChange={(e) => setCertIssuer(e.target.value)} placeholder="Amazon Web Services" /></div>
            <div><label className="text-sm font-medium">Date</label><Input value={certDate} onChange={(e) => setCertDate(e.target.value)} placeholder="March 2024" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCertDialog(false); setEditingCert(null); }}>Cancel</Button>
            <Button disabled={!certName || !certIssuer} onClick={async () => {
              if (editingCert) await updateCert.mutateAsync({ id: editingCert.id, data: { name: certName, issuer: certIssuer, date: certDate || null } });
              else await addCert.mutateAsync({ data: { name: certName, issuer: certIssuer, date: certDate || null } });
              setShowCertDialog(false); setEditingCert(null); invalidate();
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom section meta dialog */}
      <Dialog open={showCustomSectionDialog} onOpenChange={(o) => { if (!o) { setShowCustomSectionDialog(false); setEditingCustomSection(null); } }}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingCustomSection ? "Edit Section" : "Add Custom Section"}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Section Title *</label><Input value={csTitle} onChange={(e) => setCsTitle(e.target.value)} placeholder="Projects, Volunteering, Awards, Publications..." /></div>
            <div><label className="text-sm font-medium">Section Introduction (optional)</label><RichTextEditor content={csContent} onChange={setCsContent} placeholder="Optional intro text for this section..." minHeight="100px" /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowCustomSectionDialog(false); setEditingCustomSection(null); }}>Cancel</Button>
            <Button disabled={!csTitle} onClick={async () => {
              if (editingCustomSection) {
                await updateCustomSection.mutateAsync({ id: editingCustomSection.id, data: { title: csTitle, content: csContent } });
              } else {
                const newCs = await addCustomSection.mutateAsync({ data: { title: csTitle, content: csContent, orderIndex: (portfolio.customSections?.length || 0) } });
                const newKey = `custom_${newCs.id}`;
                const newOrder = [...sectionOrder, newKey];
                setSectionOrder(newOrder);
                await saveField({ sectionOrder: newOrder });
              }
              setShowCustomSectionDialog(false); setEditingCustomSection(null); invalidate();
            }}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Custom Section Item dialog */}
      <CustomSectionItemDialog
        open={showCsiDialog}
        onClose={() => { setShowCsiDialog(false); setEditingCsi(null); setCsiSectionId(null); }}
        sectionTitle={csiSectionTitle}
        initial={editingCsi ? { title: editingCsi.title, subtitle: editingCsi.subtitle || "", startDate: editingCsi.startDate || "", endDate: editingCsi.endDate || "", description: editingCsi.description || "", accomplishments: (editingCsi.accomplishments || []).join("\n"), url: editingCsi.url || "" } : undefined}
        onSave={async (data) => {
          if (editingCsi) {
            await updateCsi.mutateAsync({ id: editingCsi.id, data });
          } else if (csiSectionId) {
            await addCsi.mutateAsync({ data: { ...data, customSectionId: csiSectionId } });
          }
          setShowCsiDialog(false); setEditingCsi(null); setCsiSectionId(null); invalidate();
        }}
      />

      {/* Additional Info dialog */}
      <Dialog open={showAddInfoDialog} onOpenChange={setShowAddInfoDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Add Information</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><label className="text-sm font-medium">Label</label><Input value={addInfoKey} onChange={(e) => setAddInfoKey(e.target.value)} placeholder="Languages, Availability, etc." /></div>
            <div><label className="text-sm font-medium">Value</label><Input value={addInfoVal} onChange={(e) => setAddInfoVal(e.target.value)} placeholder="English, Urdu..." /></div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddInfoDialog(false)}>Cancel</Button>
            <Button disabled={!addInfoKey || !addInfoVal} onClick={async () => {
              await saveField({ additionalInfo: { ...portfolio.additionalInfo, [addInfoKey]: addInfoVal } });
              setAddInfoKey(""); setAddInfoVal(""); setShowAddInfoDialog(false);
            }}>Add</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* CV Import */}
      <CvImportModal open={showCvModal} onClose={() => setShowCvModal(false)} onImport={handleCvImport} />

      {/* CV Preview Dialog */}
      <Dialog open={showCvPreview} onOpenChange={setShowCvPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh] p-0 overflow-hidden flex flex-col">
          <DialogHeader className="px-6 pt-5 pb-3">
            <DialogTitle>CV Preview — {CV_TEMPLATE_OPTIONS.find(o => o.id === selectedCvTemplate)?.name}</DialogTitle>
            <DialogDescription>Preview your CV before downloading. Select a different template to compare.</DialogDescription>
          </DialogHeader>
          <div className="flex-1 overflow-auto bg-muted px-4 pb-4">
            <iframe
              srcDoc={cvPreviewHtml}
              title="CV Preview"
              sandbox="allow-same-origin"
              className="w-full border rounded shadow-lg bg-white"
              style={{ minHeight: "800px" }}
            />
          </div>
          <div className="flex items-center justify-end gap-2 px-6 pb-4">
            <Button variant="outline" onClick={() => setShowCvPreview(false)}>Close</Button>
            <Button onClick={handleExport} disabled={isExporting} className="gap-1">
              {isExporting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Download className="w-3 h-3" />} Download
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Reset Confirmation */}
      <AlertDialog open={showResetConfirm} onOpenChange={setShowResetConfirm}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <RotateCcw className="w-5 h-5" /> Reset Portfolio to Blank Template?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <span className="block">This will permanently delete <strong>all</strong> your portfolio data:</span>
              <ul className="list-disc list-inside text-sm space-y-1 mt-2">
                <li>All experience, education, skills, certifications</li>
                <li>All blog posts and custom sections</li>
                <li>Your name, bio, contact info, and photo</li>
              </ul>
              <span className="block mt-2 text-sm">Your current theme and admin password will be kept. This action cannot be undone.</span>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <Button
              onClick={handleReset}
              disabled={isResetting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isResetting ? <><Loader2 className="w-4 h-4 animate-spin mr-2" />Resetting...</> : "Yes, Reset Everything"}
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Create Client Dialog */}
      <CreateClientDialog open={showCreateClientDialog} onOpenChange={setShowCreateClientDialog} />

      {/* Export Settings Modal */}
      {showExportSettings && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="max-w-md w-full bg-background border border-border rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-5 h-5 text-primary" />
                <h2 className="text-lg font-bold">CV Export Sections</h2>
              </div>
              <button onClick={() => setShowExportSettings(false)} className="p-1 hover:bg-muted rounded-lg text-muted-foreground">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-muted-foreground">Toggle which sections to include in your exported CV.</p>

            <div className="space-y-2">
              {[
                { key: 'experience', label: 'Work Experience', icon: Briefcase },
                { key: 'education', label: 'Education', icon: GraduationCap },
                { key: 'skills', label: 'Skills', icon: Wrench },
                { key: 'certifications', label: 'Certifications', icon: Award },
                { key: 'blogs', label: 'Blog Posts', icon: BookOpen },
                ...(portfolio.customSections || []).map(cs => ({ key: `custom_${cs.id}`, label: cs.title, icon: Layers })),
              ].map((section) => {
                const Icon = section.icon;
                const isCustom = section.key.startsWith('custom_');
                const enabled = isCustom
                  ? (cvExportSections[section.key] !== false)
                  : (cvExportSections[section.key] !== false);
                return (
                  <div key={section.key} className="flex items-center justify-between p-3 rounded-xl border border-border bg-card hover:bg-accent/50 transition-colors">
                    <div className="flex items-center gap-3">
                      <Icon className="w-4 h-4 text-muted-foreground" />
                      <span className="text-sm font-medium">{section.label}</span>
                    </div>
                    <button
                      onClick={() => {
                        const newSections = { ...cvExportSections, [section.key]: !enabled };
                        setCvExportSections(newSections);
                        saveExportSections(newSections);
                      }}
                      className={`relative w-10 h-5 rounded-full transition-colors ${enabled ? 'bg-primary' : 'bg-muted'}`}
                    >
                      <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${enabled ? 'left-5' : 'left-0.5'}`} />
                    </button>
                  </div>
                );
              })}
            </div>

            {savingExportSettings && (
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Loader2 className="w-3 h-3 animate-spin" /> Saving...
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
