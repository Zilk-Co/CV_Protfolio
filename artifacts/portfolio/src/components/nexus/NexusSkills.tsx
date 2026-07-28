import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, X, Wrench } from "lucide-react";

export function NexusSkills({
  skills,
  isAdmin,
  onDelete,
  onAdd,
}: {
  skills: { id: number; name: string; category: string }[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onAdd: (name: string, category: string) => void;
}) {
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState("");
  const [cat, setCat] = useState("");

  const grouped = skills.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {} as Record<string, typeof skills>);

  const handleAdd = () => {
    if (name.trim() && cat.trim()) {
      onAdd(name.trim(), cat.trim());
      setName("");
      setCat("");
      setShowForm(false);
    }
  };

  return (
    <div className="nexus-skills">
      <div className="nexus-section-header">
        <div className="nexus-section-icon"><Wrench className="w-5 h-5" /></div>
        <h2 className="nexus-section-title">Skills</h2>
        {isAdmin && (
          <button className="nexus-add-btn" onClick={() => setShowForm(!showForm)}>
            <Plus className="w-4 h-4" /> Add Skill
          </button>
        )}
      </div>

      {isAdmin && showForm && (
        <motion.div
          className="nexus-skill-form"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
        >
          <input placeholder="Skill name" value={name} onChange={(e) => setName(e.target.value)} />
          <input placeholder="Category (e.g. Frontend, Backend)" value={cat} onChange={(e) => setCat(e.target.value)} />
          <button className="nexus-btn-primary nexus-btn-sm" onClick={handleAdd}>Add</button>
          <button className="nexus-btn-outline nexus-btn-sm" onClick={() => setShowForm(false)}>Cancel</button>
        </motion.div>
      )}

      <div className="nexus-skills-grid">
        {Object.entries(grouped).map(([category, items], gi) => (
          <motion.div
            key={category}
            className="nexus-skill-category"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: gi * 0.1 }}
          >
            <h3 className="nexus-skill-cat-name">{category}</h3>
            <div className="nexus-skill-items">
              {items.map((skill, si) => (
                <div key={skill.id} className="nexus-skill-item">
                  <span className="nexus-skill-name">{skill.name}</span>
                  <div className="nexus-skill-bar">
                    <motion.div
                      className="nexus-skill-bar-fill"
                      initial={{ width: 0 }}
                      whileInView={{ width: `${65 + Math.random() * 30}%` }}
                      viewport={{ once: true }}
                      transition={{ duration: 1, delay: si * 0.05, ease: "easeOut" }}
                    />
                  </div>
                  {isAdmin && (
                    <button className="nexus-skill-delete" onClick={() => onDelete(String(skill.id))}>
                      <X className="w-3 h-3" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
