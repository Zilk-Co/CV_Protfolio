import { useState } from "react";
import { motion } from "framer-motion";
import { Layers, Plus, Pencil, Trash2, ChevronUp, ChevronDown } from "lucide-react";
import type { CustomSection, CustomSectionItem } from "@workspace/api-client-react";
import { RichTextDisplay } from "@/components/RichTextEditor";

export function NexusCustomSections({
  sections,
  isAdmin,
  onEditSection,
  onDeleteSection,
  onAddSection,
  onAddItem,
  onEditItem,
  onDeleteItem,
  onMoveItemUp,
  onMoveItemDown,
}: {
  sections: (CustomSection & { items: CustomSectionItem[] })[];
  isAdmin: boolean;
  onEditSection: (s: CustomSection) => void;
  onDeleteSection: (id: string) => void;
  onAddSection: () => void;
  onAddItem: (sectionId: number, sectionTitle: string) => void;
  onEditItem: (item: CustomSectionItem, sectionId: number, sectionTitle: string) => void;
  onDeleteItem: (id: string) => void;
  onMoveItemUp: (items: CustomSectionItem[], index: number, sectionId: number) => void;
  onMoveItemDown: (items: CustomSectionItem[], index: number, sectionId: number) => void;
}) {
  return (
    <>
      {sections.map((section, si) => (
        <div key={section.id} className="nexus-custom-section" data-section={`custom_${section.id}`}>
          <div className="nexus-section-header">
            <div className="nexus-section-icon"><Layers className="w-5 h-5" /></div>
            <h2 className="nexus-section-title">{section.title}</h2>
            {isAdmin && (
              <div className="nexus-section-actions">
                <button className="nexus-add-btn" onClick={() => onAddItem(section.id, section.title)}>
                  <Plus className="w-4 h-4" /> Add Item
                </button>
                <button className="nexus-add-btn" onClick={() => onEditSection(section)}>
                  <Pencil className="w-4 h-4" />
                </button>
                <button className="nexus-add-btn nexus-delete" onClick={() => onDeleteSection(String(section.id))}>
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
          {section.content && (
            <div className="nexus-custom-content">
              <RichTextDisplay html={section.content} />
            </div>
          )}
          <div className="nexus-custom-items">
            {(section.items || []).map((item, i) => (
              <motion.div
                key={item.id}
                className="nexus-custom-item"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-30px" }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
              >
                <div className="nexus-custom-item-header">
                  <div>
                    <h3 className="nexus-custom-item-title">{item.title}</h3>
                    {item.subtitle && <p className="nexus-custom-item-subtitle">{item.subtitle}</p>}
                    {(item.startDate || item.endDate) && (
                      <p className="nexus-custom-item-date">{item.startDate} – {item.endDate || "Present"}</p>
                    )}
                  </div>
                  {isAdmin && (
                    <div className="nexus-custom-item-actions">
                      <button disabled={i === 0} onClick={() => onMoveItemUp(section.items, i, section.id)}><ChevronUp className="w-3 h-3" /></button>
                      <button disabled={i === (section.items || []).length - 1} onClick={() => onMoveItemDown(section.items, i, section.id)}><ChevronDown className="w-3 h-3" /></button>
                      <button onClick={() => onEditItem(item, section.id, section.title)}><Pencil className="w-3 h-3" /></button>
                      <button className="nexus-delete" onClick={() => onDeleteItem(String(item.id))}><Trash2 className="w-3 h-3" /></button>
                    </div>
                  )}
                </div>
                {item.description && <p className="nexus-custom-item-desc">{item.description}</p>}
                {item.accomplishments && item.accomplishments.length > 0 && (
                  <ul className="nexus-custom-item-list">
                    {item.accomplishments.map((a, j) => <li key={j}>{a}</li>)}
                  </ul>
                )}
                {item.url && (
                  <a href={item.url} target="_blank" rel="noopener noreferrer" className="nexus-custom-item-link">
                    View Details →
                  </a>
                )}
              </motion.div>
            ))}
          </div>
        </div>
      ))}
      {isAdmin && (
        <div className="nexus-add-section">
          <button className="nexus-add-section-btn" onClick={onAddSection}>
            <Plus className="w-4 h-4" /> Add Custom Section
          </button>
        </div>
      )}
    </>
  );
}
