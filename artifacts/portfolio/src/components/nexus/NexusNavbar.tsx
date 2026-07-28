import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, Settings, FileText, Download, Lock, LogOut, Users, Sparkles } from "lucide-react";

const NAV_LINKS = [
  { label: "About", href: "#about" },
  { label: "Experience", href: "#experience" },
  { label: "Skills", href: "#skills" },
  { label: "Certifications", href: "#certifications" },
  { label: "Blog", href: "#blog" },
  { label: "Contact", href: "#contact" },
];

export function NexusNavbar({
  isAdmin,
  portfolio,
  features,
  theme,
  onThemeChange,
  onExport,
  isExporting,
  onImportCV,
  onReset,
  onChangePassword,
  onLogout,
  statusLabel,
  onStatusChange,
  selectedCvTemplate,
  onCvTemplateChange,
  cvTemplates,
  statusOptions,
}: {
  isAdmin: boolean;
  portfolio: any;
  features: any;
  theme: string;
  onThemeChange: (t: string) => void;
  onExport: () => void;
  isExporting: boolean;
  onImportCV: () => void;
  onReset: () => void;
  onChangePassword: () => void;
  onLogout: () => void;
  statusLabel: string;
  onStatusChange: (s: string) => void;
  selectedCvTemplate: string;
  onCvTemplateChange: (t: string) => void;
  cvTemplates: { id: string; name: string }[];
  statusOptions: { value: string; label: string }[];
}) {
  const [visible, setVisible] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [activeSection, setActiveSection] = useState("");

  useEffect(() => {
    const onScroll = () => {
      setVisible(window.scrollY > 100);
      const sections = NAV_LINKS.map(l => l.href.slice(1));
      for (let i = sections.length - 1; i >= 0; i--) {
        const el = document.getElementById(sections[i]);
        if (el && el.getBoundingClientRect().top < 200) {
          setActiveSection(sections[i]);
          break;
        }
      }
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      <AnimatePresence>
        {visible && (
          <motion.nav
            className="nexus-nav"
            initial={{ y: -80, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -80, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.25, 0.1, 0.25, 1] }}
          >
            <div className="nexus-nav-inner">
              <a href="#" className="nexus-nav-logo">Zilk Co</a>
              <div className="nexus-nav-links">
                {NAV_LINKS.map(link => (
                  <a
                    key={link.href}
                    href={link.href}
                    className={`nexus-nav-link ${activeSection === link.href.slice(1) ? "active" : ""}`}
                  >
                    {link.label}
                  </a>
                ))}
              </div>
              {isAdmin && (
                <div className="nexus-nav-admin">
                  <select
                    className="nexus-nav-select"
                    value={theme}
                    onChange={(e) => onThemeChange(e.target.value)}
                  >
                    <option value="orbital">Orbital</option>
                    <option value="holo">Holo</option>
                    <option value="atlas">Atlas</option>
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
                  </select>
                  <button className="nexus-nav-btn" onClick={onImportCV}>
                    <FileText className="w-3.5 h-3.5" />
                  </button>
                  <button className="nexus-nav-btn" onClick={onExport} disabled={isExporting}>
                    <Download className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* Mobile menu button */}
      {isAdmin && (
        <button className="nexus-mobile-toggle" onClick={() => setMobileOpen(!mobileOpen)}>
          {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
        </button>
      )}

      <AnimatePresence>
        {mobileOpen && isAdmin && (
          <motion.div
            className="nexus-mobile-menu"
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <div className="nexus-mobile-section">
              <span className="nexus-mobile-label"><Sparkles className="w-3 h-3" /> Theme</span>
              <select className="nexus-mobile-select" value={theme} onChange={(e) => { onThemeChange(e.target.value); setMobileOpen(false); }}>
                <option value="orbital">Orbital</option>
                <option value="holo">Holo</option>
                <option value="atlas">Atlas</option>
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
              </select>
            </div>
            <div className="nexus-mobile-section">
              <span className="nexus-mobile-label">Resume</span>
              <select className="nexus-mobile-select" value={selectedCvTemplate} onChange={(e) => { onCvTemplateChange(e.target.value); setMobileOpen(false); }}>
                {cvTemplates.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="nexus-mobile-section">
              <span className="nexus-mobile-label">Status</span>
              <select className="nexus-mobile-select" value={portfolio.status} onChange={(e) => { onStatusChange(e.target.value); setMobileOpen(false); }}>
                {statusOptions.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
            </div>
            <div className="nexus-mobile-actions">
              <button className="nexus-mobile-btn" onClick={() => { onImportCV(); setMobileOpen(false); }}>
                <FileText className="w-4 h-4" /> Import CV
              </button>
              <button className="nexus-mobile-btn" onClick={() => { onExport(); setMobileOpen(false); }}>
                <Download className="w-4 h-4" /> Export CV
              </button>
              <button className="nexus-mobile-btn" onClick={() => { onChangePassword(); setMobileOpen(false); }}>
                <Lock className="w-4 h-4" /> Password
              </button>
              <button className="nexus-mobile-btn nexus-mobile-btn-danger" onClick={() => { onReset(); setMobileOpen(false); }}>
                <Settings className="w-4 h-4" /> Reset
              </button>
              <button className="nexus-mobile-btn" onClick={onLogout}>
                <LogOut className="w-4 h-4" /> Logout
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
