import { motion } from "framer-motion";
import { Award, Plus, Pencil, Trash2 } from "lucide-react";
import type { Certification } from "@workspace/api-client-react";

export function NexusCertifications({
  certs,
  isAdmin,
  onEdit,
  onDelete,
  onAdd,
}: {
  certs: Certification[];
  isAdmin: boolean;
  onEdit: (c: Certification) => void;
  onDelete: (id: string) => void;
  onAdd: () => void;
}) {
  return (
    <div className="nexus-certs">
      <div className="nexus-section-header">
        <div className="nexus-section-icon"><Award className="w-5 h-5" /></div>
        <h2 className="nexus-section-title">Certifications</h2>
        {isAdmin && (
          <button className="nexus-add-btn" onClick={onAdd}><Plus className="w-4 h-4" /> Add</button>
        )}
      </div>
      <div className="nexus-certs-grid">
        {certs.map((cert, i) => (
          <motion.div
            key={cert.id}
            className="nexus-cert-card"
            initial={{ opacity: 0, y: 30, rotate: -2 }}
            whileInView={{ opacity: 1, y: 0, rotate: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.08 }}
            whileHover={{ y: -8, rotateX: 3, rotateY: -2 }}
          >
            <div className="nexus-cert-shine" />
            <div className="nexus-cert-icon"><Award className="w-8 h-8" /></div>
            <h3 className="nexus-cert-name">{cert.name}</h3>
            {cert.issuer && <p className="nexus-cert-issuer">{cert.issuer}</p>}
            {cert.date && <p className="nexus-cert-date">{cert.date}</p>}
            {isAdmin && (
              <div className="nexus-cert-actions">
                <button onClick={() => onEdit(cert)}><Pencil className="w-3 h-3" /></button>
                <button className="nexus-delete" onClick={() => onDelete(String(cert.id))}><Trash2 className="w-3 h-3" /></button>
              </div>
            )}
          </motion.div>
        ))}
        {isAdmin && certs.length === 0 && (
          <button className="nexus-timeline-empty" onClick={onAdd}>
            <Plus className="w-5 h-5" /> Add your first certification
          </button>
        )}
      </div>
    </div>
  );
}
