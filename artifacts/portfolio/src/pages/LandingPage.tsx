import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles, ArrowRight, Check, X, Zap, Palette, FileText, Brain,
  Globe, Star, Users, ChevronRight, ChevronDown, MessageCircle, Shield, Rocket,
  Mail, Phone, MapPin, Eye, Code, Layout, Wand2, ArrowUpRight,
  TrendingUp, Clock, CreditCard, Lock, Send, ExternalLink, Copy, CheckCircle2,
  Briefcase, GraduationCap, Award, BookOpen, Layers, ArrowUp
} from "lucide-react";

const WHATSAPP_URL = "https://wa.me/923122787385?text=Hi,%20I%27m%20interested%20in%20Zilk%20Co%20Portfolio%20Builder.%20I%20want%20to%20start%20my%20free%20trial.";

const DEMOS = [
  {
    slug: "mustafa-protfolio",
    name: "Mustafa Muneer",
    role: "Zilk Co Founder & CTO",
    initials: "MM",
    tags: ["AI Chat", "Nexus Theme", "CV Export"],
    tagline: "Software & Web Developer",
    skills: ["React", "Node.js", "TypeScript", "AI"],
    gradient: "from-violet-500/10 to-indigo-500/10",
    img: "/mustafa.jpg",
  },
  {
    slug: "ayaan-protfolio",
    name: "Ayaan",
    role: "Finance Professional",
    initials: "AY",
    tags: ["AI Chat", "Blog", "Orbital Theme"],
    tagline: "ACCA & Finance Expert",
    skills: ["ACCA", "Finance", "Excel", "Analysis"],
    gradient: "from-amber-500/10 to-orange-500/10",
  },
  {
    slug: "agha-protfolio",
    name: "Agha",
    role: "Social Media Expert",
    initials: "AG",
    tags: ["Social Media", "Marketing", "Legacy Theme"],
    tagline: "Social Media & Marketing",
    skills: ["Instagram", "TikTok", "Content", "Marketing"],
    gradient: "from-emerald-500/10 to-teal-500/10",
  },
];

const FEATURES = [
  { icon: Brain, title: "AI Assistant", desc: "Answers recruiter questions about your profile 24/7. Always selling, always on.", accent: "#d97706" },
  { icon: Palette, title: "10+ Themes", desc: "Nexus, Orbital, Holo, Atlas, Legacy, Noir and more. One click to switch.", accent: "#475569" },
  { icon: FileText, title: "CV Import", desc: "Upload your CV. AI extracts everything. Your portfolio is live in minutes.", accent: "#059669" },
  { icon: Globe, title: "Live Link", desc: "Your name becomes your URL. Share on LinkedIn, WhatsApp, or your CV.", accent: "#2563eb" },
  { icon: Rocket, title: "Blog", desc: "Write articles, share expertise. SEO-optimized for Google visibility.", accent: "#dc2626" },
  { icon: Shield, title: "Secure", desc: "Password-protected. Encrypted storage. Only you can edit.", accent: "#475569" },
];

const STEPS = [
  { num: "01", title: "Import CV", desc: "Upload your existing CV. AI reads and extracts all your data." },
  { num: "02", title: "Pick Theme", desc: "Choose from 6 premium designs. Switch anytime." },
  { num: "03", title: "Share Link", desc: "Your portfolio is live. Share the link everywhere." },
  { num: "04", title: "Get Hired", desc: "Recruiters find you, interact with AI, and contact you." },
];

const FAQS = [
  { q: "How does the 7-day free trial work?", a: "Sign up, get your portfolio live instantly. Use all features for 7 days. No credit card needed. When trial ends, pay via EasyPaisa/JazzCash to keep it active." },
  { q: "How do I pay?", a: "Send PKR 400 or 800 via EasyPaisa/JazzCash to our WhatsApp number. We'll activate your account within minutes." },
  { q: "Can I change themes later?", a: "Yes! Switch themes anytime from your dashboard. Your content stays the same." },
  { q: "What happens if I stop paying?", a: "Your portfolio goes into 'locked' mode. Recruiters see a contact screen. Re-subscribe to reactivate." },
  { q: "How does /username work?", a: "Each user gets a unique link like cv-protfolio-hub.vercel.app/your-name. Share it anywhere. Recruiters click and see your portfolio." },
  { q: "Is my data safe?", a: "Yes. Encrypted, password-protected, hosted on secure servers. We never share your data." },
];

/* ─── Reactive Background ─── */
function ReactiveBackground() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const mouseRef = useRef({ x: 0, y: 0 });
  const blobsRef = useRef([
    { x: 0.2, y: 0.3, vx: 0.0003, vy: 0.0002, r: 300, color: "rgba(120,120,120,0.06)" },
    { x: 0.7, y: 0.6, vx: -0.0002, vy: 0.0003, r: 250, color: "rgba(100,100,100,0.04)" },
    { x: 0.5, y: 0.8, vx: 0.00025, vy: -0.0002, r: 200, color: "rgba(90,90,90,0.03)" },
  ]);
  const particlesRef = useRef<Array<{ x: number; y: number; vx: number; vy: number; size: number; opacity: number }>>([]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);

    // Init particles
    const particles = particlesRef.current;
    for (let i = 0; i < 40; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        opacity: Math.random() * 0.3 + 0.05,
      });
    }

    const onMove = (e: MouseEvent) => { mouseRef.current = { x: e.clientX, y: e.clientY }; };
    window.addEventListener("mousemove", onMove);

    let raf: number;
    const draw = () => {
      const w = canvas.width;
      const h = canvas.height;
      ctx.clearRect(0, 0, w, h);

      // Draw grid dots
      ctx.fillStyle = "rgba(0,0,0,0.03)";
      const gap = 40;
      for (let x = gap; x < w; x += gap) {
        for (let y = gap; y < h; y += gap) {
          // Distance from mouse
          const dx = x - mouseRef.current.x;
          const dy = y - mouseRef.current.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          const scale = Math.max(0, 1 - dist / 200);
          const radius = 1 + scale * 1.5;
          const alpha = 0.03 + scale * 0.08;
          ctx.globalAlpha = alpha;
          ctx.beginPath();
          ctx.arc(x, y, radius, 0, Math.PI * 2);
          ctx.fill();
        }
      }

      // Draw blobs
      const blobs = blobsRef.current;
      for (const b of blobs) {
        // Mouse influence
        const mx = mouseRef.current.x / w;
        const my = mouseRef.current.y / h;
        const dx = mx - b.x;
        const dy = my - b.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        const pull = Math.max(0, 1 - dist * 3) * 0.001;
        b.x += b.vx + dx * pull;
        b.y += b.vy + dy * pull;

        // Bounds
        if (b.x < -0.1 || b.x > 1.1) b.vx *= -1;
        if (b.y < -0.1 || b.y > 1.1) b.vy *= -1;

        const cx = b.x * w;
        const cy = b.y * h;

        // Pulsing radius
        const pulse = Math.sin(Date.now() * 0.001 + b.x * 10) * 20;
        const r = b.r + pulse;

        const grad = ctx.createRadialGradient(cx, cy, 0, cx, cy, r);
        grad.addColorStop(0, b.color);
        grad.addColorStop(1, "transparent");
        ctx.globalAlpha = 1;
        ctx.fillStyle = grad;
        ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
      }

      // Draw particles
      for (const p of particles) {
        // Mouse repulsion
        const dx = p.x - mouseRef.current.x;
        const dy = p.y - mouseRef.current.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        if (dist < 150) {
          const force = (150 - dist) / 150 * 0.5;
          p.vx += (dx / dist) * force;
          p.vy += (dy / dist) * force;
        }

        p.x += p.vx;
        p.y += p.vy;
        p.vx *= 0.99;
        p.vy *= 0.99;

        // Wrap
        if (p.x < 0) p.x = w;
        if (p.x > w) p.x = 0;
        if (p.y < 0) p.y = h;
        if (p.y > h) p.y = 0;

        ctx.globalAlpha = p.opacity;
        ctx.fillStyle = "#555";
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
        ctx.fill();
      }

      // Draw connection lines between nearby particles
      ctx.globalAlpha = 1;
      ctx.strokeStyle = "rgba(80,80,80,0.06)";
      ctx.lineWidth = 0.5;
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x;
          const dy = particles[i].y - particles[j].y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          if (dist < 120) {
            ctx.globalAlpha = (1 - dist / 120) * 0.15;
            ctx.beginPath();
            ctx.moveTo(particles[i].x, particles[i].y);
            ctx.lineTo(particles[j].x, particles[j].y);
            ctx.stroke();
          }
        }
      }

      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(draw);
    };
    raf = requestAnimationFrame(draw);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      window.removeEventListener("mousemove", onMove);
    };
  }, []);

  return (
    <>
      <canvas ref={canvasRef} className="fixed inset-0 pointer-events-none z-0" style={{ opacity: 0.8 }} />
      {/* Grain texture overlay */}
      <div className="fixed inset-0 pointer-events-none z-0 opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }} />
    </>
  );
}

/* ─── Scroll Progress ─── */
function ScrollProgress() {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    const onScroll = () => {
      const h = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(h > 0 ? window.scrollY / h : 0);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);
  return <div className="fixed top-0 left-0 right-0 h-[2px] z-[60] bg-transparent"><div className="h-full bg-gradient-to-r from-[#d97706] to-[#ea580c] scroll-progress" style={{ transform: `scaleX(${progress})` }} /></div>;
}

/* ─── Cursor Glow ─── */
function CursorGlow() {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const onMove = (e: MouseEvent) => { setPos({ x: e.clientX, y: e.clientY }); setVisible(true); };
    const onLeave = () => setVisible(false);
    window.addEventListener("mousemove", onMove);
    document.addEventListener("mouseleave", onLeave);
    return () => { window.removeEventListener("mousemove", onMove); document.removeEventListener("mouseleave", onLeave); };
  }, []);
  if (!visible) return null;
  return <div className="fixed pointer-events-none z-[2] w-[400px] h-[400px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-[#d97706]/[.03] blur-[100px] transition-opacity duration-300" style={{ left: pos.x, top: pos.y }} />;
}

/* ─── Tilt Card ─── */
function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [style, setStyle] = useState<React.CSSProperties>({});
  const onMove = (e: React.MouseEvent) => {
    if (!ref.current) return;
    const r = ref.current.getBoundingClientRect();
    const x = (e.clientX - r.left) / r.width - 0.5;
    const y = (e.clientY - r.top) / r.height - 0.5;
    setStyle({ transform: `perspective(600px) rotateY(${x * 8}deg) rotateX(${-y * 8}deg) scale(1.02)` });
  };
  const onLeave = () => setStyle({ transform: "perspective(600px) rotateY(0) rotateX(0) scale(1)" });
  return <div ref={ref} className={`tilt-card ${className}`} style={style} onMouseMove={onMove} onMouseLeave={onLeave}>{children}</div>;
}

/* ─── Hooks ─── */
function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setShow(true); obs.disconnect(); } }, { threshold });
    obs.observe(el);
    return () => obs.disconnect();
  }, [threshold]);
  return { ref, show };
}

function AnimatedSection({ children, className = "", delay = 0 }: { children: React.ReactNode; className?: string; delay?: number }) {
  const { ref, show } = useInView();
  return (
    <div ref={ref} className={className} style={{ opacity: show ? 1 : 0, transform: show ? "translateY(0)" : "translateY(24px)", transition: `opacity .5s ease ${delay}s, transform .5s ease ${delay}s` }}>
      {children}
    </div>
  );
}

function Counter({ to, suffix = "" }: { to: number; suffix?: string }) {
  const [n, setN] = useState(0);
  const { ref, show } = useInView(0.5);
  const done = useRef(false);
  useEffect(() => {
    if (!show || done.current) return;
    done.current = true;
    let start = 0;
    const step = (ts: number) => {
      if (!start) start = ts;
      const p = Math.min((ts - start) / 1200, 1);
      setN(Math.floor(p * to));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }, [show, to]);
  return <span ref={ref}>{n}{suffix}</span>;
}

function Typewriter({ words }: { words: string[] }) {
  const [i, setI] = useState(0);
  const [c, setC] = useState(0);
  const [del, setDel] = useState(false);
  const [txt, setTxt] = useState("");
  useEffect(() => {
    const w = words[i];
    const t = setTimeout(() => {
      if (!del) {
        setTxt(w.slice(0, c + 1));
        setC(v => v + 1);
        if (c + 1 === w.length) setTimeout(() => setDel(true), 1800);
      } else {
        setTxt(w.slice(0, c - 1));
        setC(v => v - 1);
        if (c - 1 === 0) { setDel(false); setI(v => (v + 1) % words.length); }
      }
    }, del ? 35 : 70);
    return () => clearTimeout(t);
  }, [c, del, i, words]);
  return <span>{txt}<span className="inline-block w-[2px] h-[1em] bg-[#1a1a1a]/40 ml-px animate-pulse align-middle" /></span>;
}

function GlowCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const [pos, setPos] = useState({ x: 0, y: 0 });
  const [on, setOn] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  return (
    <div ref={ref}
      className={`relative overflow-hidden rounded-2xl border transition-all duration-300 bg-white/[.10] backdrop-blur-sm ${on ? "border-[#d97706]/30 shadow-lg shadow-[#d97706]/10 bg-white/[.15]" : "border-white/[.12]"} ${className}`}
      onMouseMove={e => { if (!ref.current) return; const r = ref.current.getBoundingClientRect(); setPos({ x: e.clientX - r.left, y: e.clientY - r.top }); }}
      onMouseEnter={() => setOn(true)} onMouseLeave={() => setOn(false)}>
      {on && <div className="absolute w-40 h-40 bg-[#d97706]/[.08] rounded-full blur-3xl pointer-events-none" style={{ left: pos.x - 80, top: pos.y - 80 }} />}
      <div className="relative z-10">{children}</div>
    </div>
  );
}

/* ─── Page ─── */
export default function LandingPage() {
  const [showMembershipPopup, setShowMembershipPopup] = useState(false);
  const [showTcPopup, setShowTcPopup] = useState(false);
  const [tcAccepted, setTcAccepted] = useState(false);
  const [faq, setFaq] = useState<number | null>(null);
  const [slug, setSlug] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [wa, setWa] = useState("");
  const [done, setDone] = useState(false);
  const [loading, setLoading] = useState(false);
  const [copied, setCopied] = useState<string | null>(null);
  const [activeDemo, setActiveDemo] = useState(0);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!slug || !name || !email) return;
    setLoading(true);
    try {
      await fetch("https://formsubmit.co/zilkjiro@gmail.com", {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          _subject: `🟢 New Trial Signup: ${slug}`,
          portfolio_slug: slug,
          name,
          email,
          whatsapp: wa || "Not provided",
          message: `New trial signup!\n\nSlug: ${slug}\nName: ${name}\nEmail: ${email}\nWhatsApp: ${wa || "Not provided"}\n\nAction needed: Activate trial for this user.`,
        }),
      });
    } catch {}
    setDone(true);
    setLoading(false);
  };

  const copy = (s: string) => {
    navigator.clipboard.writeText(`cv-protfolio-hub.vercel.app/${s}`);
    setCopied(s);
    setTimeout(() => setCopied(null), 1800);
  };

  useEffect(() => {
    const t = setInterval(() => setActiveDemo(d => (d + 1) % DEMOS.length), 3500);
    return () => clearInterval(t);
  }, []);

  return (
    <div className="min-h-screen text-white selection:bg-[#d97706]/30 relative font-body">
      <ScrollProgress />
      <CursorGlow />
      <ReactiveBackground />
      {/* Dark grey background */}
      <div className="fixed inset-0 -z-10">
        <div className="absolute inset-0 bg-gradient-to-br from-[#2a2a2a] via-[#333333] to-[#2a2a2a]" />
        <div className="absolute top-0 left-0 w-[600px] h-[600px] bg-[#404040]/[0.4] rounded-full blur-[120px] -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-[500px] h-[500px] bg-[#383838]/[0.3] rounded-full blur-[100px] translate-x-1/4 translate-y-1/4" />
        <div className="absolute top-1/2 left-1/2 w-[400px] h-[400px] bg-[#454545]/[0.3] rounded-full blur-[80px] -translate-x-1/2 -translate-y-1/2" />
      </div>
      {/* Grain texture */}
      <div className="fixed inset-0 pointer-events-none z-[1] opacity-[0.04]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }} />
      <style>{`
        @keyframes float { 0%,100%{transform:translateY(0)} 50%{transform:translateY(-12px)} }
        @keyframes pulse-dot { 0%,100%{opacity:.4} 50%{opacity:1} }
        @keyframes slide-in { from{opacity:0;transform:translateX(-12px)} to{opacity:1;transform:translateX(0)} }
        @keyframes fade-up { from{opacity:0;transform:translateY(20px)} to{opacity:1;transform:translateY(0)} }
        @keyframes gradient-shift { 0%{background-position:0% 50%} 50%{background-position:100% 50%} 100%{background-position:0% 50%} }
        .anim-float { animation: float 5s ease-in-out infinite; }
        .anim-float-d { animation: float 6s ease-in-out infinite .8s; }
        .anim-pulse-dot { animation: pulse-dot 2s ease-in-out infinite; }
        .portfolio-preview { transition: all .4s cubic-bezier(.4,0,.2,1); }
        .portfolio-preview:hover { transform: translateY(-6px) scale(1.01); box-shadow: 0 20px 40px -12px rgba(0,0,0,.12); }
        .portfolio-preview:hover .preview-overlay { opacity: 1; }
        .preview-overlay { opacity: 0; transition: opacity .3s ease; }
        .skill-pill { transition: all .2s ease; }
        .skill-pill:hover { background: #475569; color: white; transform: scale(1.05); }
        .hero-glow { pointer-events: none; }
        .section-label { letter-spacing: .12em; }
        .hero-gradient-text {
          background: linear-gradient(135deg, #d97706 0%, #ea580c 25%, #dc2626 50%, #d97706 75%);
          background-size: 200% 200%;
          animation: gradient-shift 4s ease infinite;
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
        }
        .stat-number { font-variant-numeric: tabular-nums; }
        .tilt-card { transition: transform .15s ease-out, box-shadow .3s ease; transform-style: preserve-3d; }
        .tilt-card:hover { box-shadow: 0 25px 50px -12px rgba(0,0,0,.25); }
        .scroll-progress { transform-origin: left; }
        @keyframes float-badge { 0%,100%{transform:translateY(0) rotate(-2deg)} 50%{transform:translateY(-8px) rotate(2deg)} }
        .float-badge { animation: float-badge 3s ease-in-out infinite; }
        .float-badge-d { animation: float-badge 4s ease-in-out infinite .5s; }
        .float-badge-d2 { animation: float-badge 3.5s ease-in-out infinite 1s; }
        @keyframes shimmer { 0%{background-position:-200% 0} 100%{background-position:200% 0} }
        .shimmer { background: linear-gradient(90deg, transparent 0%, rgba(255,255,255,.08) 50%, transparent 100%); background-size: 200% 100%; animation: shimmer 3s infinite; }
        @keyframes count-pulse { 0%,100%{transform:scale(1)} 50%{transform:scale(1.05)} }
        .count-pulse { animation: count-pulse 2s ease-in-out infinite; }
        html { scroll-behavior: smooth; }
      `}</style>

      {/* ─── Nav ─── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-[#1a1a1a]/90 backdrop-blur-2xl border-b border-white/[.06]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-heading font-bold text-lg tracking-tight">
            <img src="/zilkco-logo.png" alt="Zilk Co" className="w-8 h-8 rounded-lg shadow-sm object-contain bg-white p-0.5" />
            <span className="text-white">Zilk Co</span>
          </Link>
          <div className="flex items-center gap-0.5">
            {DEMOS.map(d => (
              <Link key={d.slug} href={`/${d.slug}`} className="text-xs text-white/60 hover:text-white transition-colors px-2 py-1.5 rounded-md hover:bg-white/[.08] hidden sm:flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-white/40" />
                {d.name.split(" ")[0]}
              </Link>
            ))}
            <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
              <Button size="sm" className="ml-1 h-7 px-2.5 bg-white text-[#1a1a1a] hover:bg-white/90 text-xs rounded-lg gap-1 font-medium">
                <MessageCircle className="w-3 h-3" /> Contact
              </Button>
            </a>
          </div>
        </div>
      </nav>

      {/* ─── Hero ─── */}
      <section className="pt-24 pb-12 sm:pt-32 sm:pb-20 px-4 sm:px-6 relative overflow-hidden">
        <div className="hero-glow absolute inset-0 pointer-events-none" />
        {/* Floating orbs */}
        <div className="absolute top-20 right-[15%] w-64 h-64 bg-[#475569]/[.03] rounded-full blur-3xl anim-float pointer-events-none" />
        <div className="absolute bottom-10 left-[10%] w-48 h-48 bg-[#8b5cf6]/[.03] rounded-full blur-3xl anim-float-d pointer-events-none" />

        {/* Floating notification badges */}
        <div className="hidden lg:block">
          <div className="absolute top-32 left-[8%] float-badge">
            <div className="px-3 py-2 rounded-xl bg-white/[.08] backdrop-blur-sm border border-white/[.1] text-xs text-white/70 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-emerald-400" />
              Portfolio viewed by recruiter
            </div>
          </div>
          <div className="absolute top-48 right-[5%] float-badge-d">
            <div className="px-3 py-2 rounded-xl bg-white/[.08] backdrop-blur-sm border border-white/[.1] text-xs text-white/70 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-[#d97706]" />
              AI answered 3 questions
            </div>
          </div>
          <div className="absolute bottom-32 left-[12%] float-badge-d2">
            <div className="px-3 py-2 rounded-xl bg-white/[.08] backdrop-blur-sm border border-white/[.1] text-xs text-white/70 flex items-center gap-2 shadow-lg">
              <span className="w-2 h-2 rounded-full bg-blue-400" />
              CV imported successfully
            </div>
          </div>
        </div>

        <div className="max-w-4xl mx-auto text-center relative z-10">
          <AnimatedSection>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/10 backdrop-blur-sm border border-white/10 text-xs text-white/70 mb-6 shadow-sm">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 anim-pulse-dot" />
              Trusted by 38+ professionals in Pakistan
            </div>
          </AnimatedSection>

          <AnimatedSection delay={.08}>
            <h1 className="text-[2.75rem] sm:text-5xl md:text-6xl font-heading font-bold tracking-tight leading-[1.08] mb-5">
              Your CV Gets Deleted.
              <br />
              <span className="hero-gradient-text">Your Portfolio Gets You Hired.</span>
            </h1>
          </AnimatedSection>

          <AnimatedSection delay={.16}>
            <p className="text-[15px] sm:text-base text-white/60 mb-2 max-w-lg mx-auto leading-relaxed">
              Recruiters spend 7 seconds on a CV. A professional digital portfolio keeps them reading.
            </p>
            <p className="text-base sm:text-lg font-semibold mb-7 h-6 font-heading text-white">
              Build yours in 5 minutes with{" "}
              <Typewriter words={["AI Power", "10+ Themes", "50+ Templates", "One Click"]} />
            </p>
          </AnimatedSection>

          <AnimatedSection delay={.24}>
            <div className="flex flex-col sm:flex-row gap-3 justify-center mb-5">
              <a href="#trial">
                <Button className="gap-2 bg-gradient-to-r from-[#d97706] to-[#ea580c] hover:from-[#c2660a] hover:to-[#d44d0a] text-white h-10 px-6 rounded-xl text-sm font-medium shadow-lg shadow-[#d97706]/20 transition-all">
                  Start Free Trial <ArrowRight className="w-4 h-4" />
                </Button>
              </a>
              <a href="#demos">
                <Button variant="outline" className="gap-2 h-10 px-6 rounded-xl text-sm font-medium border-white/20 text-white hover:bg-white/[.08]">
                  See Live Demos <Eye className="w-4 h-4" />
                </Button>
              </a>
            </div>
            <div className="flex items-center justify-center gap-3 text-[11px] text-white/50">
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> No credit card</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Live in 5 min</span>
              <span className="w-1 h-1 rounded-full bg-white/20" />
              <span className="flex items-center gap-1"><CheckCircle2 className="w-3 h-3 text-emerald-400" /> Cancel anytime</span>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Stats ─── */}
      <section className="py-10 border-y border-white/[.08] bg-white/[.03] backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 grid grid-cols-4 gap-4 text-center">
          {[{ v: 38, s: "+", l: "Users" }, { v: 50, s: "+", l: "Templates" }, { v: 10, s: "+", l: "Themes" }, { v: 7, s: "d", l: "Free Trial" }].map((x, i) => (
            <div key={i}>
              <div className="text-2xl sm:text-3xl font-heading font-bold text-[#d97706] stat-number"><Counter to={x.v} suffix={x.s} /></div>
              <div className="text-[10px] text-white/50 uppercase tracking-widest mt-0.5 font-medium">{x.l}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ─── Portfolio Demos ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" id="demos">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="flex items-end justify-between mb-8">
              <div>
                <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">Live Portfolios</p>
                <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">See What You'll Build</h2>
              </div>
              <button onClick={() => setShowMembershipPopup(true)} className="text-xs text-[#d97706] hover:underline hidden sm:flex items-center gap-1 cursor-pointer">
                View all <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </AnimatedSection>

          {/* Portfolio Cards */}
          <div className="grid sm:grid-cols-3 gap-4 mb-6">
            {DEMOS.map((d, i) => (
              <AnimatedSection key={d.slug} delay={i * .08}>
                  <TiltCard className="rounded-2xl">
                    <Link href={`/${d.slug}`}>
                    <div className="portfolio-preview rounded-2xl bg-white/[.12] backdrop-blur-sm border border-white/[.15] cursor-pointer group overflow-hidden hover:bg-white/[.18] transition-all">
                    {/* Preview Header */}
                    <div className={`h-32 sm:h-36 bg-gradient-to-br ${d.gradient} relative flex items-center justify-center`}>
                      <div className="absolute inset-0 bg-black/20" />
                      {/* Mock UI elements */}
                      <div className="relative z-10 w-[85%] space-y-2">
                        <div className="flex items-center gap-2">
                          {d.img ? (
                            <img src={d.img} alt={d.name} className="w-8 h-8 rounded-lg object-cover border border-white/20" />
                          ) : (
                            <div className="w-8 h-8 rounded-lg bg-white/90 backdrop-blur flex items-center justify-center text-xs font-bold text-[#475569]">{d.initials}</div>
                          )}
                          <div className="flex-1">
                            <div className="h-2 w-20 bg-white/70 rounded-full" />
                            <div className="h-1.5 w-14 bg-white/50 rounded-full mt-1" />
                          </div>
                        </div>
                        <div className="h-1.5 w-full bg-white/60 rounded-full" />
                        <div className="h-1.5 w-3/4 bg-white/50 rounded-full" />
                        <div className="flex gap-1.5 mt-2">
                          {d.skills.slice(0, 3).map((s, j) => (
                            <span key={j} className="skill-pill text-[9px] px-2 py-0.5 rounded-full bg-white/80 text-[#475569] font-medium cursor-default">{s}</span>
                          ))}
                        </div>
                      </div>
                      {/* Hover overlay */}
                      <div className="preview-overlay absolute inset-0 bg-black/50 flex items-center justify-center z-20">
                        <div className="flex items-center gap-2 text-white text-sm font-medium">
                          <Eye className="w-4 h-4" /> View Portfolio
                        </div>
                      </div>
                    </div>

                    {/* Card Info */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                           <h3 className="font-bold text-sm text-white group-hover:text-[#d97706] transition-colors">{d.name}</h3>
                          <p className="text-[11px] text-white/50">{d.tagline}</p>
                        </div>
                         <ArrowUpRight className="w-4 h-4 text-white/30 group-hover:text-[#d97706] group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all flex-shrink-0 mt-0.5" />
                      </div>
                      <div className="flex flex-wrap gap-1 mb-3">
                        {d.tags.map((t, j) => (
                          <span key={j} className="text-[9px] px-2 py-0.5 rounded-full bg-white/[.08] text-white/60">{t}</span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between pt-2 border-t border-white/[.08]">
                        <span className="text-[11px] text-white/40 font-mono">/{d.slug}</span>
                        <button onClick={e => { e.preventDefault(); e.stopPropagation(); copy(d.slug); }}
                          className="text-[10px] text-white/40 hover:text-white flex items-center gap-1 transition-colors">
                          {copied === d.slug ? <><Check className="w-3 h-3 text-emerald-400" /> Copied</> : <><Copy className="w-3 h-3" /> Copy</>}
                        </button>
                      </div>
                    </div>
                  </div>
                    </Link>
                  </TiltCard>
              </AnimatedSection>
            ))}
          </div>

          {/* URL Explainer */}
          <AnimatedSection delay={.2}>
            <div className="p-4 sm:p-5 rounded-2xl bg-white/[.10] backdrop-blur-sm border border-white/[.12]">
              <div className="flex items-center gap-2 mb-2">
                <div className="w-7 h-7 rounded-lg bg-white/10 flex items-center justify-center">
                  <Globe className="w-3.5 h-3.5 text-[#d97706]" />
                </div>
                <h3 className="font-bold text-sm text-white">Your Link, Your Brand</h3>
              </div>
              <p className="text-xs text-white/50 mb-3">Every user gets a unique link. Share it on LinkedIn, WhatsApp, your CV, or email. Recruiters click and see your portfolio instantly.</p>
              <div className="flex items-center gap-0 font-mono text-xs bg-white/[.06] border border-white/[.1] rounded-lg overflow-hidden max-w-md">
                <span className="px-3 py-2 bg-white/[.04] text-white/40 border-r border-white/[.08] whitespace-nowrap">cv-protfolio-hub.vercel.app/</span>
                 <span className="px-3 py-2 font-bold text-[#d97706]">your-name</span>
              </div>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-3 text-[11px] text-white/40">
                <span className="hover:text-white/70 transition-colors cursor-pointer" onClick={() => window.location.href = '/mustafa-protfolio'}><span className="font-semibold text-[#d97706]">/mustafa-protfolio</span> — Mustafa Muneer</span>
                <span className="hover:text-white/70 transition-colors cursor-pointer" onClick={() => window.location.href = '/ayaan-protfolio'}><span className="font-semibold text-[#d97706]">/ayaan-protfolio</span> — Ayaan</span>
                <span className="hover:text-white/70 transition-colors cursor-pointer" onClick={() => window.location.href = '/agha-protfolio'}><span className="font-semibold text-[#d97706]">/agha-protfolio</span> — Agha</span>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Problem ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="mb-10">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">The Problem</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">Why Plain CVs Fail</h2>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-3 gap-5">
            {[
              { n: "01", t: "PDFs Get Deleted", d: "200+ PDFs daily. Yours gets buried. Never opened.", s: "95% never opened", icon: "🗑️" },
              { n: "02", t: "No Differentiation", d: "Same Word template. Same fonts. Same layout.", s: "3 sec average scan", icon: "📋" },
              { n: "03", t: "Zero Engagement", d: "Static PDFs can't answer questions or impress.", s: "0% interactive", icon: "💤" },
            ].map((x, i) => (
              <AnimatedSection key={i} delay={i * .08}>
                <TiltCard className="h-full">
                  <div className="p-6 rounded-2xl bg-white/[.08] backdrop-blur-sm border border-white/[.10] hover:border-red-500/30 hover:bg-white/[.12] transition-all h-full group">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-3xl font-heading font-bold text-white/15 group-hover:text-red-400/40 transition-colors">{x.n}</span>
                      <span className="text-xl group-hover:scale-110 transition-transform">{x.icon}</span>
                    </div>
                    <h3 className="font-bold text-sm mb-2 text-white/90 group-hover:text-white transition-colors">{x.t}</h3>
                    <p className="text-xs text-white/60 leading-relaxed mb-4">{x.d}</p>
                    <div className="pt-3 border-t border-white/[.08]">
                      <span className="text-[11px] font-heading font-bold text-red-400/70">{x.s}</span>
                    </div>
                  </div>
                </TiltCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Before vs After ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="mb-10 text-center">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">The Difference</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">Before vs After Zilk</h2>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 gap-6">
            {/* Before */}
            <AnimatedSection delay={0.1}>
              <div className="rounded-2xl border border-red-500/20 bg-red-500/[.04] p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-red-500/10 flex items-center justify-center"><X className="w-4 h-4 text-red-400" /></div>
                  <span className="text-xs font-heading font-bold text-red-400 uppercase tracking-wider">Before</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/50"><X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" /> PDF sent via email, never opened</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" /> Same Word template as everyone</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" /> No way to stand out</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" /> Recruiters spend 3 seconds max</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><X className="w-3.5 h-3.5 text-red-400/60 flex-shrink-0" /> Zero engagement, zero responses</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.06]">
                  <div className="text-[10px] text-white/30 mb-1">Average result</div>
                  <div className="text-lg font-heading font-bold text-red-400/80">2% response rate</div>
                </div>
              </div>
            </AnimatedSection>
            {/* After */}
            <AnimatedSection delay={0.2}>
              <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/[.04] p-6 h-full">
                <div className="flex items-center gap-2 mb-4">
                  <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center"><CheckCircle2 className="w-4 h-4 text-emerald-400" /></div>
                  <span className="text-xs font-heading font-bold text-emerald-400 uppercase tracking-wider">After</span>
                </div>
                <div className="space-y-3 mb-6">
                  <div className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" /> Live portfolio link shared everywhere</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" /> 6 premium themes, professional look</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" /> AI answers recruiter questions 24/7</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" /> Unique URL: your-name.com</div>
                  <div className="flex items-center gap-2 text-sm text-white/50"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-400/60 flex-shrink-0" /> Blog, CV export, instant updates</div>
                </div>
                <div className="p-3 rounded-xl bg-white/[.04] border border-white/[.06]">
                  <div className="text-[10px] text-white/30 mb-1">Average result</div>
                  <div className="text-lg font-heading font-bold text-emerald-400/80">5x more responses</div>
                </div>
              </div>
            </AnimatedSection>
          </div>
        </div>
      </section>

      {/* ─── Solution ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="mb-10">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">The Solution</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">Your Digital Portfolio That Gets You Hired</h2>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Zap, t: "Live in 5 Min", d: "Import CV. AI extracts. Portfolio live. Start getting noticed." },
              { icon: Brain, t: "AI Sells 24/7", d: "Recruiters ask, AI answers. Always on, always selling." },
              { icon: Star, t: "Premium Design", d: "10+ themes. $5,000 look. No design skills needed." },
            ].map((x, i) => (
              <AnimatedSection key={i} delay={i * .08}>
                <GlowCard className="h-full">
                  <div className="p-5">
                    <x.icon className="w-5 h-5 text-[#d97706] mb-2.5" />
                    <h3 className="font-bold text-sm mb-1 text-white">{x.t}</h3>
                    <p className="text-xs text-white/50 leading-relaxed">{x.d}</p>
                  </div>
                </GlowCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── How It Works ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="mb-10 text-center">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">How It Works</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">4 Steps to Your Dream Job</h2>
              <p className="text-xs text-white/40 mt-2">From zero to hired in 5 minutes</p>
            </div>
          </AnimatedSection>
          <div className="relative">
            {/* Connection line */}
            <div className="hidden sm:block absolute top-8 left-[12%] right-[12%] h-[1px] bg-gradient-to-r from-transparent via-white/10 to-transparent" />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
              {STEPS.map((s, i) => (
                <AnimatedSection key={i} delay={i * .1}>
                  <TiltCard className="h-full">
                    <div className="p-5 rounded-2xl bg-white/[.08] backdrop-blur-sm border border-white/[.10] hover:border-[#d97706]/30 transition-all h-full group text-center sm:text-left relative">
                      <div className="w-10 h-10 rounded-full bg-[#d97706]/10 border border-[#d97706]/20 flex items-center justify-center mb-3 mx-auto sm:mx-0 group-hover:bg-[#d97706]/20 transition-colors">
                        <span className="text-sm font-heading font-bold text-[#d97706]">{s.num}</span>
                      </div>
                      <h3 className="font-bold text-sm mb-1 text-white">{s.title}</h3>
                      <p className="text-[11px] text-white/50 leading-relaxed">{s.desc}</p>
                    </div>
                  </TiltCard>
                </AnimatedSection>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ─── Features ─── */}
      <section className="py-16 sm:py-24 px-4 sm:px-6">
        <div className="max-w-5xl mx-auto">
          <AnimatedSection>
            <div className="mb-10">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">Features</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">Everything You Need to Get Hired</h2>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {FEATURES.map((f, i) => (
              <AnimatedSection key={i} delay={i * .04}>
                <GlowCard className="h-full">
                  <div className="p-4">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center mb-2.5" style={{ backgroundColor: `${f.accent}15` }}>
                      <f.icon className="w-4 h-4" style={{ color: f.accent }} />
                    </div>
                    <h3 className="font-bold text-xs mb-1 text-white">{f.title}</h3>
                    <p className="text-[11px] text-white/50 leading-relaxed">{f.desc}</p>
                  </div>
                </GlowCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trust Bar ─── */}
      <section className="py-10 px-4 sm:px-6 border-y border-white/[.06]">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="flex flex-wrap items-center justify-center gap-8 sm:gap-12">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center"><Shield className="w-4 h-4 text-emerald-400" /></div>
                <div>
                  <div className="text-xs font-heading font-bold text-white">Secure</div>
                  <div className="text-[10px] text-white/40">Encrypted storage</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-blue-500/10 flex items-center justify-center"><Globe className="w-4 h-4 text-blue-400" /></div>
                <div>
                  <div className="text-xs font-heading font-bold text-white">99.9% Uptime</div>
                  <div className="text-[10px] text-white/40">Always online</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-[#d97706]/10 flex items-center justify-center"><Zap className="w-4 h-4 text-[#d97706]" /></div>
                <div>
                  <div className="text-xs font-heading font-bold text-white">Fast</div>
                  <div className="text-[10px] text-white/40">Loads in under 1s</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-full bg-purple-500/10 flex items-center justify-center"><Brain className="w-4 h-4 text-purple-400" /></div>
                <div>
                  <div className="text-xs font-heading font-bold text-white">AI Powered</div>
                  <div className="text-[10px] text-white/40">GPT-4 integrated</div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Pricing ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" id="pricing">
        <div className="max-w-3xl mx-auto">
          <AnimatedSection>
            <div className="mb-8 text-center">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">Pricing</p>
              <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight text-white">Honest Pricing</h2>
              <p className="text-xs text-white/50 mt-1">Pay via EasyPaisa/JazzCash. No hidden fees.</p>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-2 gap-4">
            {[
              { name: "Starter", price: "400", desc: "Professional basics", features: ["6 Themes", "CV Import & Export", "50+ Templates", "Blog Page", "Live Link", "Password Protection"], notIncluded: ["AI Assistant", "AI Matching"], popular: false },
              { name: "Pro (AI)", price: "800", desc: "AI-powered portfolio", features: ["Everything in Starter", "AI Assistant", "AI Job Matching", "AI CV Summary", "Priority Support", "Custom Domain"], notIncluded: [], popular: true },
            ].map((p, i) => (
              <AnimatedSection key={i} delay={i * .1}>
                <GlowCard className={`h-full ${p.popular ? "!border-[#d97706]/25" : ""}`}>
                  <div className="p-5">
                    {p.popular && <Badge className="mb-3 bg-[#d97706] text-white text-[10px] px-2 h-5">Popular</Badge>}
                    <h3 className="font-bold text-sm text-white">{p.name}</h3>
                    <p className="text-[11px] text-white/50 mb-3">{p.desc}</p>
                    <div className="mb-4">
                      <span className="text-3xl font-heading font-bold text-white">PKR {p.price}</span>
                      <span className="text-[11px] text-white/40">/mo</span>
                    </div>
                    {p.popular && (
                      <div className="mb-4 px-3 py-2 rounded-lg bg-[#d97706]/[.1] border border-[#d97706]/20">
                        <p className="text-[10px] font-medium text-[#d97706]">Limited to 50 users — 38 spots filled</p>
                      </div>
                    )}
                    <ul className="space-y-1.5 mb-5">
                      {p.features.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-[11px] text-white/70">
                          <Check className="w-3 h-3 text-emerald-400 mt-0.5 flex-shrink-0" /> {f}
                        </li>
                      ))}
                      {p.notIncluded.map((f, j) => (
                        <li key={j} className="flex items-start gap-2 text-[11px] text-white/30">
                          <X className="w-3 h-3 mt-0.5 flex-shrink-0" /> <span className="line-through">{f}</span>
                        </li>
                      ))}
                    </ul>
                    <a href="#trial">
                      <Button className={`w-full h-8 text-xs rounded-lg ${p.popular ? "bg-[#d97706] hover:bg-[#c2660a] text-white" : "bg-white/10 hover:bg-white/15 text-white border-white/10"}`} variant={p.popular ? "default" : "outline"}>
                        Start Free Trial
                      </Button>
                    </a>
                  </div>
                </GlowCard>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Trial ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6" id="trial">
        <div className="max-w-md mx-auto">
          <AnimatedSection>
            <div className="mb-6 text-center">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">Free Trial</p>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-white">Start Your Free Trial</h2>
              <p className="text-xs text-white/50 mt-1">7 days free. No credit card.</p>
            </div>
          </AnimatedSection>
          {done ? (
            <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-500/10 text-center">
              <CheckCircle2 className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
              <h3 className="font-bold mb-1 text-white">Request Sent!</h3>
              <p className="text-xs text-white/60 mb-2">We'll activate your trial and notify you on <span className="font-medium text-white">WhatsApp</span> and <span className="font-medium text-white">Gmail</span> once it's ready.</p>
              <p className="text-[10px] text-white/40 mb-3">Usually within 10 minutes during business hours.</p>
              <a href={`https://wa.me/923122787385?text=Hi,%20I%20just%20signed%20up%20for%20a%20trial.%20Slug:%20${slug}`} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 text-xs text-[#25D366] font-medium hover:underline">
                <MessageCircle className="w-3.5 h-3.5" /> Contact us on WhatsApp for faster reply
              </a>
            </div>
          ) : (
            <form onSubmit={submit} className="p-4 rounded-2xl border border-white/[.12] bg-white/[.10] backdrop-blur-sm space-y-2.5">
              <div>
                <label className="text-[11px] font-medium mb-1 block text-white/60">Portfolio Link</label>
                <div className="flex items-center gap-0">
                  <span className="px-2 py-2 bg-white/[.04] border border-r-0 border-white/[.08] rounded-l-lg text-[10px] text-white/40 font-mono whitespace-nowrap">...vercel.app/</span>
                  <Input value={slug} onChange={e => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="your-name" className="rounded-l-none h-8 text-xs font-mono bg-white/[.06] border-white/[.1] text-white placeholder:text-white/30" required />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-medium mb-1 block text-white/60">Name</label>
                  <Input value={name} onChange={e => setName(e.target.value)} placeholder="Ali Khan" className="h-8 text-xs bg-white/[.06] border-white/[.1] text-white placeholder:text-white/30" required />
                </div>
                <div>
                  <label className="text-[11px] font-medium mb-1 block text-white/60">WhatsApp</label>
                  <Input value={wa} onChange={e => setWa(e.target.value)} placeholder="03XX" className="h-8 text-xs bg-white/[.06] border-white/[.1] text-white placeholder:text-white/30" />
                </div>
              </div>
              <div>
                <label className="text-[11px] font-medium mb-1 block text-white/60">Email</label>
                <Input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="ali@example.com" className="h-8 text-xs bg-white/[.06] border-white/[.1] text-white placeholder:text-white/30" required />
              </div>
              <Button type="button" className="w-full h-8 text-xs bg-[#d97706] hover:bg-[#c2660a] text-white rounded-lg" onClick={() => { if (!slug || !name || !email) return; setShowTcPopup(true); }}>
                Start 7-Day Free Trial
              </Button>
              <p className="text-[10px] text-center text-white/30 pt-1">
                We'll notify you on WhatsApp & Gmail when your trial is activated.
              </p>
              <p className="text-[10px] text-center text-[#25D366] font-medium pt-0.5">
                <a href="https://wa.me/923122787385?text=Hi,%20I%20just%20signed%20up%20for%20a%20trial." target="_blank" rel="noopener noreferrer" className="hover:underline">
                  Message us on WhatsApp 0312-2787385 for faster activation
                </a>
              </p>
            </form>
          )}
        </div>
      </section>

      {/* ─── FAQ ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatedSection>
            <div className="mb-6 text-center">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">FAQ</p>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-white">Questions?</h2>
            </div>
          </AnimatedSection>
          <div className="space-y-1.5">
            {FAQS.map((f, i) => (
              <AnimatedSection key={i} delay={i * .03}>
                <div className="border border-white/[.12] rounded-xl overflow-hidden bg-white/[.08]">
                  <button onClick={() => setFaq(faq === i ? null : i)} className="w-full px-4 py-2.5 text-left flex items-center justify-between hover:bg-white/[.06] transition-colors">
                    <span className="font-medium text-xs pr-3 text-white">{f.q}</span>
                    <ChevronDown className={`w-3.5 h-3.5 flex-shrink-0 text-white/40 transition-transform duration-200 ${faq === i ? "rotate-180" : ""}`} />
                  </button>
                   <div className={`overflow-hidden transition-all duration-200 ${faq === i ? "max-h-32 opacity-100" : "max-h-0 opacity-0"}`}>
                    <div className="px-4 pb-2.5 text-[11px] text-white/50 leading-relaxed">{f.a}</div>
                  </div>
                </div>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Contact ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-4xl mx-auto">
          <AnimatedSection>
            <div className="mb-8 text-center">
              <p className="section-label text-[10px] uppercase text-white/40 mb-1.5">Contact</p>
              <h2 className="text-xl sm:text-2xl font-heading font-bold tracking-tight text-white">Ready to Start?</h2>
              <p className="text-xs text-white/50 mt-1">We respond within minutes.</p>
            </div>
          </AnimatedSection>
          <div className="grid sm:grid-cols-3 gap-3 max-w-2xl mx-auto">
            {[
              { icon: MessageCircle, label: "WhatsApp", value: "0312-2787385", color: "#10b981", href: WHATSAPP_URL, sub: "Instant replies" },
              { icon: Mail, label: "Email", value: "zilkjiro@gmail.com", color: "#3b82f6", href: "mailto:zilkjiro@gmail.com", sub: "24-hour response" },
               { icon: Phone, label: "Call / SMS", value: "0312-2787385", color: "#d97706", href: null, sub: "Mon–Sat 10am–8pm" },
            ].map((c, i) => (
              <AnimatedSection key={i} delay={i * .08}>
                {c.href ? (
                  <a href={c.href} target="_blank" rel="noopener noreferrer" className="block">
                    <GlowCard className="h-full"><ContactCard {...c} /></GlowCard>
                  </a>
                ) : (
                  <GlowCard className="h-full"><ContactCard {...c} /></GlowCard>
                )}
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Final CTA ─── */}
      <section className="py-14 sm:py-20 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto text-center">
          <AnimatedSection>
            <h2 className="text-2xl sm:text-3xl font-heading font-bold tracking-tight mb-3 text-white">Ready to Get Hired?</h2>
            <p className="text-xs sm:text-sm text-white/50 mb-5 max-w-md mx-auto">
              Join 38+ professionals who stopped sending PDFs and started sharing portfolios.
              Your next employer is searching. Make sure they find <span className="font-semibold text-white">yours</span>.
            </p>
            <div className="flex flex-col sm:flex-row gap-2.5 justify-center">
              <a href="#trial">
                <Button className="gap-1.5 bg-[#d97706] hover:bg-[#c2660a] text-white h-9 px-5 rounded-xl text-xs font-medium">
                  Start Free Trial <ArrowRight className="w-3.5 h-3.5" />
                </Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="gap-1.5 h-9 px-5 rounded-xl text-xs font-medium border-white/20 text-white hover:bg-white/[.08]">
                  <MessageCircle className="w-3.5 h-3.5" /> Chat on WhatsApp
                </Button>
              </a>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Terms & Conditions ─── */}
      <section className="py-12 sm:py-16 px-4 sm:px-6">
        <div className="max-w-2xl mx-auto">
          <AnimatedSection>
            <div className="border border-white/[.1] rounded-2xl bg-white/[.05] overflow-hidden">
              <button onClick={() => setFaq(faq === -2 ? null : -2)} className="w-full px-5 py-3 text-left flex items-center justify-between hover:bg-white/[.04] transition-colors">
                <div className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-[#d97706]" />
                  <span className="font-semibold text-sm text-white">Terms &amp; Conditions</span>
                </div>
                <ChevronDown className={`w-4 h-4 text-white/40 transition-transform duration-200 ${faq === -2 ? "rotate-180" : ""}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${faq === -2 ? "max-h-[600px] opacity-100" : "max-h-0 opacity-0"}`}>
                <div className="px-5 pb-5 space-y-3 text-[11px] text-white/50 leading-relaxed">
                  <div>
                    <p className="font-semibold text-white/70 mb-1">1. Your Data Is Yours</p>
                    <p>We do not steal, sell, or misuse your data. Everything you upload stays yours. We only store what you choose to put on your portfolio.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white/70 mb-1">2. What You Make Public</p>
                    <p>Any information you choose to display on your portfolio (name, photo, contact info, work, etc.) will be visible to anyone who visits your portfolio link. This is the whole point — recruiters and clients need to see and contact you.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white/70 mb-1">3. Contact Info Usage</p>
                    <p>The contact details you provide (email, WhatsApp, etc.) are only used to reach you about your account, trial status, and portfolio. We will never share them with third parties or spam you.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white/70 mb-1">4. Password &amp; Account Security</p>
                    <p>Your password is encrypted and stored securely. We cannot see it. Only you can access your portfolio admin panel with your password.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white/70 mb-1">5. Free Trial</p>
                    <p>The 7-day free trial gives full access to all features. No credit card required. After the trial, choose a plan (PKR 400/mo or PKR 800/mo with AI) to keep your portfolio live.</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white/70 mb-1">6. Payments</p>
                    <p>Payments are made via EasyPaisa or JazzCash. Plans auto-renew monthly. Stop paying and your portfolio goes into locked mode (visible but not editable).</p>
                  </div>
                  <div>
                    <p className="font-semibold text-white/70 mb-1">7. Cancellation</p>
                    <p>You can stop using the service anytime. Simply stop paying and your portfolio will lock. Your data remains for 30 days in case you want to return.</p>
                  </div>
                </div>
              </div>
            </div>
          </AnimatedSection>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="py-6 px-4 sm:px-6 border-t border-white/[.06] bg-black/20 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-5 mb-5">
            <div>
              <div className="flex items-center gap-1.5 font-heading font-bold text-sm mb-1.5">
                <img src="/zilkco-logo.png" alt="Zilk Co" className="w-7 h-7 rounded-md object-contain bg-white p-0.5" />
                <span className="text-white">Zilk Co</span>
              </div>
              <p className="text-[11px] text-white/40 leading-relaxed">Build your professional portfolio in minutes.</p>
            </div>
            <div>
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Portfolios</h4>
              <div className="space-y-1">
                {DEMOS.map(d => (
                  <Link key={d.slug} href={`/${d.slug}`} className="block text-[11px] text-white/50 hover:text-white transition-colors">{d.name}</Link>
                ))}
                <button onClick={() => setShowMembershipPopup(true)} className="block text-[11px] text-white/50 hover:text-white transition-colors text-left cursor-pointer">All Portfolios</button>
              </div>
            </div>
            <div>
              <h4 className="font-bold text-[10px] uppercase tracking-wider text-white/40 mb-1.5">Contact</h4>
              <div className="space-y-1">
                <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white transition-colors">
                  <MessageCircle className="w-3 h-3 text-emerald-400" /> WhatsApp
                </a>
                <a href="mailto:zilkjiro@gmail.com" className="flex items-center gap-1.5 text-[11px] text-white/50 hover:text-white transition-colors">
                  <Mail className="w-3 h-3 text-blue-400" /> zilkjiro@gmail.com
                </a>
                <div className="flex items-center gap-1.5 text-[11px] text-white/50">
                  <Phone className="w-3 h-3 text-[#d97706]" /> 0312-2787385
                </div>
              </div>
            </div>
          </div>
          <div className="pt-3 border-t border-white/[.06] flex flex-col sm:flex-row items-center justify-between gap-2 text-[10px] text-white/30">
            <span>© 2026 Zilk Co</span>
            <div className="flex items-center gap-3">
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer" className="hover:text-white/60 transition-colors">WhatsApp</a>
              <a href="mailto:zilkjiro@gmail.com" className="hover:text-white/60 transition-colors">Email</a>
              <button onClick={() => setShowMembershipPopup(true)} className="hover:text-white/60 transition-colors cursor-pointer">Explore</button>
            </div>
          </div>
        </div>
      </footer>

      {/* ─── Membership Required Popup ─── */}
      {showMembershipPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80" onClick={() => setShowMembershipPopup(false)}>
          <div className="w-full max-w-sm bg-[#1a1a1a] border border-white/[.1] rounded-2xl shadow-2xl p-6 text-center space-y-4" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center mx-auto">
              <Lock className="w-6 h-6 text-amber-400" />
            </div>
            <h2 className="text-lg font-heading font-bold text-white">Membership Required</h2>
            <p className="text-xs text-white/50 leading-relaxed">
              The Explore page is available to <span className="text-white font-semibold">active members only</span>.<br />
              Start your free trial or subscribe to browse all portfolios.
            </p>
            <div className="flex flex-col gap-2 pt-2">
              <a href="#trial">
                <Button className="w-full bg-[#d97706] hover:bg-[#c2660a] h-10 rounded-xl text-xs font-bold text-white" onClick={() => setShowMembershipPopup(false)}>
                  Start Free Trial
                </Button>
              </a>
              <a href={WHATSAPP_URL} target="_blank" rel="noopener noreferrer">
                <Button variant="outline" className="w-full h-10 rounded-xl text-xs font-bold border-white/20 text-white hover:bg-white/[.08]" onClick={() => setShowMembershipPopup(false)}>
                  <MessageCircle className="w-3.5 h-3.5 mr-1" /> Message on WhatsApp
                </Button>
              </a>
            </div>
            <button onClick={() => setShowMembershipPopup(false)} className="text-[10px] text-white/30 hover:text-white/60 transition-colors">
              Close
            </button>
          </div>
        </div>
      )}

      {/* ─── Terms & Conditions Popup (Trial Signup) ─── */}
      {showTcPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80" onClick={() => { setShowTcPopup(false); setTcAccepted(false); }}>
          <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/[.1] rounded-2xl shadow-2xl p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center flex-shrink-0">
                <Lock className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold text-white">Terms &amp; Conditions</h2>
                <p className="text-[10px] text-white/40">Please accept to start your free trial</p>
              </div>
            </div>

            <div className="bg-white/[.03] border border-white/[.06] rounded-xl p-4 max-h-56 overflow-y-auto space-y-2.5 text-[11px] text-white/50 leading-relaxed">
              <div>
                <p className="font-semibold text-white/70 mb-0.5">1. Your Data Is Yours</p>
                <p>We do not steal, sell, or misuse your data. Everything you upload stays yours.</p>
              </div>
              <div>
                <p className="font-semibold text-white/70 mb-0.5">2. What You Make Public</p>
                <p>Any information you display on your portfolio (name, photo, contact info, work) will be visible to anyone who visits your portfolio link.</p>
              </div>
              <div>
                <p className="font-semibold text-white/70 mb-0.5">3. Contact Info Usage</p>
                <p>Contact details you provide are only used to reach you about your account and portfolio. We never share them with third parties.</p>
              </div>
              <div>
                <p className="font-semibold text-white/70 mb-0.5">4. Password &amp; Account Security</p>
                <p>Your password is encrypted and stored securely. We cannot see it.</p>
              </div>
              <div>
                <p className="font-semibold text-white/70 mb-0.5">5. Free Trial</p>
                <p>7-day free trial with full features. No credit card required. After trial, choose a plan (PKR 400/mo or PKR 800/mo with AI).</p>
              </div>
              <div>
                <p className="font-semibold text-white/70 mb-0.5">6. Cancellation</p>
                <p>Stop paying and your portfolio locks. Data remains for 30 days.</p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-white/[.03] border border-white/[.06] rounded-xl">
              <input
                type="checkbox"
                checked={tcAccepted}
                onChange={(e) => setTcAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[.05] text-[#d97706] focus:ring-[#d97706]/50"
              />
              <span className="text-xs text-white/60">I have read and agree to the Terms &amp; Conditions</span>
            </label>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-10 rounded-xl border border-white/[.1] text-white/60 hover:bg-white/[.05]"
                onClick={() => { setShowTcPopup(false); setTcAccepted(false); }}
              >
                Decline
              </Button>
              <Button
                className="flex-1 h-10 rounded-xl font-bold text-white bg-[#d97706] hover:bg-[#c2660a]"
                disabled={!tcAccepted}
                onClick={async () => {
                  setShowTcPopup(false);
                  setTcAccepted(false);
                  await submit(new Event("submit") as any);
                }}
              >
                Accept &amp; Submit
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Back to top */}
      <button onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
        className="fixed bottom-4 right-4 w-9 h-9 rounded-full bg-white/10 backdrop-blur-sm text-white flex items-center justify-center shadow-lg hover:bg-white/20 transition-colors z-50 border border-white/10">
        <ArrowUp className="w-4 h-4" />
      </button>
    </div>
  );
}

function ContactCard({ icon: Icon, label, value, color, sub }: { icon: any; label: string; value: string; color: string; sub: string }) {
  return (
    <div className="p-4 text-center group">
      <div className="w-9 h-9 rounded-xl flex items-center justify-center mx-auto mb-2 transition-colors" style={{ backgroundColor: `${color}15` }}>
        <Icon className="w-4 h-4" style={{ color }} />
      </div>
      <h3 className="font-bold text-xs mb-0.5 text-white">{label}</h3>
      <p className="text-xs font-medium" style={{ color }}>{value}</p>
      <p className="text-[10px] text-white/40 mt-0.5">{sub}</p>
    </div>
  );
}
