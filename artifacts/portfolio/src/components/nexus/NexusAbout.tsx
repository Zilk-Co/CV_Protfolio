import { motion } from "framer-motion";
import { AlignLeft, Pencil, Plus, X } from "lucide-react";
import DOMPurify from "dompurify";

export function NexusAbout({
  about,
  additionalInfo,
  isAdmin,
  onEditAbout,
  onDeleteInfo,
  onAddInfo,
}: {
  about: string;
  additionalInfo: Record<string, string>;
  isAdmin: boolean;
  onEditAbout: () => void;
  onDeleteInfo: (key: string) => void;
  onAddInfo: () => void;
}) {
  return (
    <div className="nexus-about" id="about">
      <div className="nexus-about-grid">
        <motion.div
          className="nexus-about-text"
          initial={{ opacity: 0, x: -30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6 }}
        >
          <div className="nexus-section-header">
            <div className="nexus-section-icon"><AlignLeft className="w-5 h-5" /></div>
            <h2 className="nexus-section-title">About</h2>
            {isAdmin && (
              <button className="nexus-add-btn" onClick={onEditAbout}><Pencil className="w-4 h-4" /> Edit</button>
            )}
          </div>
          <div className="nexus-about-content" dangerouslySetInnerHTML={{ __html: DOMPurify.sanitize(about || "<p>Tell the world about yourself...</p>") }} />
          <div className="nexus-about-chips">
            {Object.entries(additionalInfo || {}).map(([k, v]) => (
              <div key={k} className="nexus-about-chip">
                <span className="nexus-about-chip-key">{k}:</span>
                <span className="nexus-about-chip-val">{v}</span>
                {isAdmin && (
                  <button className="nexus-about-chip-delete" onClick={() => onDeleteInfo(k)}>
                    <X className="w-3 h-3" />
                  </button>
                )}
              </div>
            ))}
            {isAdmin && (
              <button className="nexus-about-chip nexus-about-chip-add" onClick={onAddInfo}>
                <Plus className="w-3 h-3" /> Add Info
              </button>
            )}
          </div>
        </motion.div>

        <motion.div
          className="nexus-about-visual"
          initial={{ opacity: 0, x: 30 }}
          whileInView={{ opacity: 1, x: 0 }}
          viewport={{ once: true, margin: "-50px" }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="nexus-about-graphic">
            <div className="nexus-about-ring nexus-about-ring-1" />
            <div className="nexus-about-ring nexus-about-ring-2" />
            <div className="nexus-about-ring nexus-about-ring-3" />
            <div className="nexus-about-center">
              <span className="nexus-about-center-text">?</span>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
