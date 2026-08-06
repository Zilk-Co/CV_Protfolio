import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Shield, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface TermsModalProps {
  onAccepted: () => void;
}

export default function TermsModal({ onAccepted }: TermsModalProps) {
  const [checked, setChecked] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleAccept = async () => {
    if (!checked) return;
    setLoading(true);
    setError("");
    try {
      const token = localStorage.getItem("portfolio_token");
      const res = await apiFetch("/api/portfolio/terms/accept", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to accept terms");
      onAccepted();
    } catch (err: any) {
      setError(err.message || "Failed to accept terms");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] bg-[#1a1a1a] border border-white/[.08] rounded-2xl shadow-2xl flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-6 pt-6 pb-4 border-b border-white/[.06] flex items-center gap-3 flex-shrink-0">
          <div className="w-10 h-10 rounded-xl bg-[#d97706]/10 border border-[#d97706]/20 flex items-center justify-center">
            <Shield className="w-5 h-5 text-[#d97706]" />
          </div>
          <div>
            <h1 className="text-lg font-heading font-bold text-white">Terms & Conditions</h1>
            <p className="text-[10px] text-white/30 uppercase tracking-widest">Version 1.0 — Last updated August 2026</p>
          </div>
        </div>

        {/* Scrollable content */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5 text-sm text-white/60 leading-relaxed">
          <section>
            <h2 className="text-white font-bold mb-2">1. Public Portfolio Visibility</h2>
            <p>Information uploaded to the portfolio may be publicly accessible. Portfolio profiles and selected information may appear on the Explore page and be searchable by other users. Users are responsible for ensuring they do not upload confidential or sensitive information they do not wish to share publicly.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">2. User Responsibility</h2>
            <p>The user agrees that: all information provided is accurate and truthful; they have the legal right to publish all uploaded content; they will keep their account credentials secure; they are solely responsible for all activity performed using their account.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">3. Prohibited Content</h2>
            <p>Users must not upload or publish content that: violates any applicable laws; infringes copyrights, trademarks, or intellectual property rights; contains malware, viruses, or malicious code; promotes hate speech, discrimination, violence, terrorism, or harassment; contains explicit, obscene, or illegal material; attempts to impersonate another individual or organization; contains misleading, fraudulent, or deceptive information.</p>
            <p className="mt-2">The platform reserves the right to remove such content without prior notice.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">4. Privacy</h2>
            <p>Only information intentionally entered into the public portfolio may be visible to other users. Internal account information, billing details, and administrative records are not publicly displayed. The platform may collect technical information such as IP address, browser type, device information, and login history for security, fraud prevention, analytics, and audit purposes.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">5. Payment Policy</h2>
            <p>Subscription fees must be paid according to the selected billing cycle. If payment is overdue: <strong className="text-white">15 days after the due date</strong> — portfolio access will be suspended. <strong className="text-white">30 days after the due date</strong> — the portfolio and associated data may be permanently deleted. Data recovery after deletion is not guaranteed.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">6. Service Availability</h2>
            <p>While reasonable efforts will be made to maintain uninterrupted service, the platform does not guarantee 100% uptime. Scheduled maintenance, upgrades, or unexpected outages may temporarily affect availability.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">7. Limitation of Liability</h2>
            <p>The platform shall not be liable for: data loss caused by user actions; incorrect information published by users; business losses arising from downtime; third-party misuse of publicly shared portfolio information; indirect, incidental, or consequential damages. Users are encouraged to maintain their own backups of important data.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">8. Intellectual Property</h2>
            <p>Users retain ownership of the content they upload. By publishing content on the platform, users grant the platform a non-exclusive license to display, host, process, and distribute that content as required to operate the service. Users must not upload copyrighted material unless they have permission to do so.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">9. Account Suspension or Termination</h2>
            <p>The platform reserves the right to suspend or terminate accounts that: violate these Terms; engage in fraudulent or abusive activities; attempt unauthorized access to the system; abuse platform resources or security.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">10. Changes to Terms</h2>
            <p>These Terms & Conditions may be updated periodically. If significant changes are made, a new Terms Version will be published. Users who accepted an older version must accept the updated version before continuing to use the platform.</p>
          </section>

          <section>
            <h2 className="text-white font-bold mb-2">11. Acceptance</h2>
            <p>By accepting these Terms, the user confirms that: they have read and understood the Terms & Conditions; they agree to comply with all platform policies; they understand the payment, suspension, and deletion policies; they acknowledge that public portfolio information may be visible to other users.</p>
          </section>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-white/[.06] flex-shrink-0 space-y-3">
          {error && (
            <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2">{error}</p>
          )}
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative mt-0.5">
              <input
                type="checkbox"
                checked={checked}
                onChange={(e) => setChecked(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-5 h-5 rounded-md border border-white/20 bg-white/[.05] peer-checked:bg-[#d97706] peer-checked:border-[#d97706] transition-all flex items-center justify-center">
                {checked && (
                  <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
            </div>
            <span className="text-sm text-white/50 group-hover:text-white/70 transition-colors">
              I have read, understood, and agree to the Terms & Conditions.
            </span>
          </label>
          <Button
            className="w-full bg-[#d97706] hover:bg-[#c2660a] h-11 rounded-xl font-bold text-white transition-all"
            disabled={!checked || loading}
            onClick={handleAccept}
          >
            {loading ? <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Accepting...</> : "Accept & Continue"}
          </Button>
        </div>
      </div>
    </div>
  );
}
