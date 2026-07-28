import { motion } from "framer-motion";
import { Briefcase, GraduationCap, Pencil, Trash2, ChevronUp, ChevronDown, Plus } from "lucide-react";
import type { Experience, Education } from "@workspace/api-client-react";

export function NexusTimeline({
  experiences,
  educations,
  isAdmin,
  onEditExp,
  onDeleteExp,
  onAddExp,
  onMoveExpUp,
  onMoveExpDown,
  onEditEdu,
  onDeleteEdu,
  onAddEdu,
  onMoveEduUp,
  onMoveEduDown,
}: {
  experiences: Experience[];
  educations: Education[];
  isAdmin: boolean;
  onEditExp: (e: Experience) => void;
  onDeleteExp: (id: string) => void;
  onAddExp: () => void;
  onMoveExpUp: (i: number) => void;
  onMoveExpDown: (i: number) => void;
  onEditEdu: (e: Education) => void;
  onDeleteEdu: (id: string) => void;
  onAddEdu: () => void;
  onMoveEduUp: (i: number) => void;
  onMoveEduDown: (i: number) => void;
}) {
  return (
    <div className="nexus-timeline-container">
      {/* Experience */}
      {experiences.length > 0 && (
        <div className="nexus-timeline-section" id="experience">
          <div className="nexus-timeline-header">
            <div className="nexus-timeline-icon"><Briefcase className="w-5 h-5" /></div>
            <h2 className="nexus-timeline-title">Experience</h2>
            {isAdmin && (
              <button className="nexus-add-btn" onClick={onAddExp}><Plus className="w-4 h-4" /> Add</button>
            )}
          </div>
          <div className="nexus-timeline-track">
            <div className="nexus-timeline-line" />
            {experiences.map((exp, i) => (
              <motion.div
                key={exp.id}
                className="nexus-timeline-item"
                initial={{ opacity: 0, x: i % 2 === 0 ? -40 : 40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="nexus-timeline-dot" />
                <div className="nexus-timeline-card">
                  <div className="nexus-timeline-card-header">
                    <div>
                      <h3 className="nexus-timeline-card-title">{exp.role}</h3>
                      <p className="nexus-timeline-card-company">{exp.company}</p>
                      <p className="nexus-timeline-card-date">{exp.startDate} – {exp.endDate || "Present"}</p>
                    </div>
                    {isAdmin && (
                      <div className="nexus-timeline-card-actions">
                        <button disabled={i === 0} onClick={() => onMoveExpUp(i)}><ChevronUp className="w-3 h-3" /></button>
                        <button disabled={i === experiences.length - 1} onClick={() => onMoveExpDown(i)}><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={() => onEditExp(exp)}><Pencil className="w-3 h-3" /></button>
                        <button className="nexus-delete" onClick={() => onDeleteExp(String(exp.id))}><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                  {exp.description && <p className="nexus-timeline-card-desc">{exp.description}</p>}
                  {exp.accomplishments && exp.accomplishments.length > 0 && (
                    <ul className="nexus-timeline-card-list">
                      {exp.accomplishments.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>
                  )}
                </div>
              </motion.div>
            ))}
            {isAdmin && experiences.length === 0 && (
              <button className="nexus-timeline-empty" onClick={onAddExp}>
                <Plus className="w-5 h-5" /> Add your first experience
              </button>
            )}
          </div>
        </div>
      )}

      {/* Education */}
      {educations.length > 0 && (
        <div className="nexus-timeline-section">
          <div className="nexus-timeline-header">
            <div className="nexus-timeline-icon"><GraduationCap className="w-5 h-5" /></div>
            <h2 className="nexus-timeline-title">Education</h2>
            {isAdmin && (
              <button className="nexus-add-btn" onClick={onAddEdu}><Plus className="w-4 h-4" /> Add</button>
            )}
          </div>
          <div className="nexus-timeline-track">
            <div className="nexus-timeline-line" />
            {educations.map((edu, i) => (
              <motion.div
                key={edu.id}
                className="nexus-timeline-item"
                initial={{ opacity: 0, x: i % 2 === 0 ? 40 : -40 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ duration: 0.6, delay: i * 0.1 }}
              >
                <div className="nexus-timeline-dot" />
                <div className="nexus-timeline-card">
                  <div className="nexus-timeline-card-header">
                    <div>
                      <h3 className="nexus-timeline-card-title">{edu.degree} {edu.field && `in ${edu.field}`}</h3>
                      <p className="nexus-timeline-card-company">{edu.institution}</p>
                      <p className="nexus-timeline-card-date">{edu.startDate} – {edu.endDate || "Present"}</p>
                    </div>
                    {isAdmin && (
                      <div className="nexus-timeline-card-actions">
                        <button disabled={i === 0} onClick={() => onMoveEduUp(i)}><ChevronUp className="w-3 h-3" /></button>
                        <button disabled={i === educations.length - 1} onClick={() => onMoveEduDown(i)}><ChevronDown className="w-3 h-3" /></button>
                        <button onClick={() => onEditEdu(edu)}><Pencil className="w-3 h-3" /></button>
                        <button className="nexus-delete" onClick={() => onDeleteEdu(String(edu.id))}><Trash2 className="w-3 h-3" /></button>
                      </div>
                    )}
                  </div>
                  {edu.grade && <p className="nexus-timeline-card-grade">Grade: {edu.grade}</p>}
                  {edu.description && <p className="nexus-timeline-card-desc">{edu.description}</p>}
                  {edu.accomplishments && edu.accomplishments.length > 0 && (
                    <ul className="nexus-timeline-card-list">
                      {edu.accomplishments.map((a, j) => <li key={j}>{a}</li>)}
                    </ul>
                  )}
                </div>
              </motion.div>
            ))}
            {isAdmin && educations.length === 0 && (
              <button className="nexus-timeline-empty" onClick={onAddEdu}>
                <Plus className="w-5 h-5" /> Add your first education
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
