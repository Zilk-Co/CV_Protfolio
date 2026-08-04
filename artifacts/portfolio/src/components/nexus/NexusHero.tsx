import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { ArrowRight, Download, User, Upload, ImageOff, Pencil, Check, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import DOMPurify from "dompurify";
import type { Portfolio } from "@workspace/api-client-react";

function buildTitles(portfolio: Portfolio): string[] {
  const titles: string[] = [];
  if (portfolio.title) titles.push(portfolio.title);
  const skillCategories = [...new Set((portfolio.skills || []).map((s: any) => s.category).filter(Boolean))];
  for (const cat of skillCategories.slice(0, 3)) titles.push(cat);
  if (titles.length === 0) titles.push("Professional", "Creative Thinker", "Problem Solver");
  return titles;
}

function InlineEditHero({ value, onSave, className = "" }: {
  value: string; onSave: (v: string) => void; className?: string;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);
  useEffect(() => { setDraft(value); }, [value]);
  const commit = () => { onSave(draft); setEditing(false); };
  const cancel = () => { setDraft(value); setEditing(false); };
  const plainText = value?.replace(/<[^>]*>/g, "").trim() || "";
  if (!editing) return (
    <span className={`group relative cursor-pointer hover:opacity-80 ${className}`} onClick={() => setEditing(true)} title="Click to edit">
      {plainText ? (
        <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(value) }} />
      ) : (
        <span className="opacity-40">Click to edit...</span>
      )}
      <Pencil className="inline ml-1 w-3 h-3 opacity-0 group-hover:opacity-60 transition-opacity" />
    </span>
  );
  return (
    <div className="w-full">
      <textarea
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        rows={3}
        className="w-full rounded-lg border border-border bg-background text-foreground p-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
        autoFocus
      />
      <div className="flex items-center gap-2 mt-2">
        <button onClick={commit} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-green-600 text-white text-xs font-medium hover:bg-green-700">
          <Check className="w-3 h-3" /> Save
        </button>
        <button onClick={cancel} className="flex items-center gap-1 px-3 py-1 rounded-lg bg-muted text-muted-foreground text-xs font-medium hover:bg-muted/80">
          <X className="w-3 h-3" /> Cancel
        </button>
      </div>
    </div>
  );
}

export function NexusHero({
  portfolio,
  isAdmin,
  onPhotoClick,
  onRemovePhoto,
  onExport,
  onFieldSave,
  features,
}: {
  portfolio: Portfolio;
  isAdmin: boolean;
  onPhotoClick: () => void;
  onRemovePhoto: () => void;
  onExport: () => void;
  onFieldSave?: (field: Record<string, any>) => void;
  features: { cvImportExport: boolean };
}) {
  const titles = buildTitles(portfolio);
  const [titleIdx, setTitleIdx] = useState(0);
  const [displayed, setDisplayed] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const heroRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const target = titles[titleIdx] || "Professional";
    let timer: ReturnType<typeof setTimeout>;
    if (!deleting) {
      if (displayed.length < target.length) {
        timer = setTimeout(() => setDisplayed(target.slice(0, displayed.length + 1)), 55);
      } else {
        timer = setTimeout(() => setDeleting(true), 2200);
      }
    } else {
      if (displayed.length > 0) {
        timer = setTimeout(() => setDisplayed(displayed.slice(0, -1)), 30);
      } else {
        setDeleting(false);
        setTitleIdx((i) => (i + 1) % titles.length);
      }
    }
    return () => clearTimeout(timer);
  }, [displayed, deleting, titleIdx, titles]);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!heroRef.current) return;
    const rect = heroRef.current.getBoundingClientRect();
    setMousePos({
      x: ((e.clientX - rect.left) / rect.width - 0.5) * 20,
      y: ((e.clientY - rect.top) / rect.height - 0.5) * 20,
    });
  }, []);

  const btnRipple = useCallback((e: React.MouseEvent<HTMLButtonElement>) => {
    const btn = e.currentTarget;
    const rect = btn.getBoundingClientRect();
    const ripple = document.createElement("span");
    ripple.style.cssText = `
      position:absolute;border-radius:50%;background:rgba(255,255,255,0.3);
      width:20px;height:20px;transform:scale(0);animation:nexus-ripple 0.6s linear;
      pointer-events:none;left:${e.clientX - rect.left - 10}px;top:${e.clientY - rect.top - 10}px;
    `;
    btn.appendChild(ripple);
    setTimeout(() => ripple.remove(), 600);
  }, []);

  return (
    <section ref={heroRef} className="nexus-hero" onMouseMove={handleMouseMove}>
      <div className="nexus-hero-bg">
        <div className="nexus-mesh-1" />
        <div className="nexus-mesh-2" />
        <div className="nexus-mesh-3" />
        <div className="nexus-noise" />
        {[...Array(20)].map((_, i) => (
          <div key={i} className="nexus-particle" style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
            animationDelay: `${Math.random() * 8}s`,
            animationDuration: `${6 + Math.random() * 8}s`,
          }} />
        ))}
      </div>

      <div className="nexus-hero-grid">
        <motion.div
          className="nexus-hero-left"
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: `translate(${mousePos.x * 0.02}px, ${mousePos.y * 0.02}px)` }}
        >
          <motion.p
            className="nexus-hero-hello"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2, duration: 0.6 }}
          >
            Hello, I'm
          </motion.p>

          <h1 className="nexus-hero-name">
            {portfolio.name || "Your Name"}
          </h1>

          <div className="nexus-typewriter-row">
            <span className="nexus-typewriter-text">{displayed}</span>
            <span className="nexus-typewriter-cursor">|</span>
          </div>

          <motion.div
            className="nexus-hero-bio"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.8 }}
          >
            {isAdmin && onFieldSave ? (
              <InlineEditHero
                value={portfolio.about || ""}
                onSave={(v) => onFieldSave({ about: v })}
              />
            ) : portfolio.about ? (
              <span dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(portfolio.about) }} />
            ) : (
              "Passionate about building impactful digital experiences."
            )}
          </motion.div>

          <motion.div
            className="nexus-hero-buttons"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.7 }}
          >
            {features.cvImportExport && (
              <button className="nexus-btn-primary" onClick={(e) => { btnRipple(e); onExport(); }}>
                <Download className="w-4 h-4" /> Download Resume
                <span className="nexus-btn-arrow"><ArrowRight className="w-4 h-4" /></span>
              </button>
            )}
          </motion.div>

          <motion.div
            className="nexus-hero-stats"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8, duration: 0.7 }}
          >
            <div className="nexus-stat-card">
              <div className="nexus-stat-value">{(portfolio.skills || []).length || 0}</div>
              <div className="nexus-stat-label">Skills</div>
            </div>
            <div className="nexus-stat-card">
              <div className="nexus-stat-value">{(portfolio.experience || []).length || 0}</div>
              <div className="nexus-stat-label">Experiences</div>
            </div>
            <div className="nexus-stat-card">
              <div className="nexus-stat-value">{portfolio.location?.split(",")[0] || "Location"}</div>
              <div className="nexus-stat-label">{portfolio.location?.split(",")[1]?.trim() || ""}</div>
            </div>
          </motion.div>
        </motion.div>

        <motion.div
          className="nexus-hero-right"
          initial={{ opacity: 0, scale: 0.85, rotate: -6 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 0.3, duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
          style={{ transform: `perspective(800px) rotateY(${mousePos.x * 0.03}deg) rotateX(${-mousePos.y * 0.03}deg)` }}
        >
          <div className="nexus-profile-showcase">
            <div className="nexus-profile-glow" />
            <div className="nexus-ring nexus-ring-3" />
            <div className="nexus-ring nexus-ring-2" />
            <div className="nexus-ring nexus-ring-1" />

            <div className="nexus-profile-img-wrap">
              {portfolio.photoUrl ? (
                <img src={portfolio.photoUrl} alt={portfolio.name} className="nexus-profile-img" />
              ) : (
                <div className="nexus-profile-img nexus-profile-placeholder">
                  <User className="w-24 h-24 opacity-20" />
                </div>
              )}
              {isAdmin && (
                <>
                  <button className="nexus-photo-btn nexus-photo-btn-upload" onClick={onPhotoClick}>
                    <Upload className="w-4 h-4" />
                  </button>
                  {portfolio.photoUrl && (
                    <button className="nexus-photo-btn nexus-photo-btn-remove" onClick={onRemovePhoto}>
                      <ImageOff className="w-4 h-4" />
                    </button>
                  )}
                </>
              )}
            </div>
          </div>
        </motion.div>
      </div>

      <motion.div
        className="nexus-scroll-indicator"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.5, duration: 0.8 }}
      >
        <div className="nexus-scroll-line" />
      </motion.div>
    </section>
  );
}
