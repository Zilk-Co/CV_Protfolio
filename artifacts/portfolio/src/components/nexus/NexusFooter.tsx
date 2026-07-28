import { ArrowUp } from "lucide-react";

export function NexusFooter({ name }: { name: string }) {
  return (
    <footer className="nexus-footer">
      <div className="nexus-footer-divider" />
      <div className="nexus-footer-inner">
        <p className="nexus-footer-text">
          Built with care by <span className="nexus-footer-brand">Zilk Co</span>
        </p>
        <p className="nexus-footer-copy">
          &copy; {new Date().getFullYear()} {name}. All rights reserved.
        </p>
        <button className="nexus-back-to-top" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}>
          <ArrowUp className="w-4 h-4" /> Back to Top
        </button>
      </div>
    </footer>
  );
}
