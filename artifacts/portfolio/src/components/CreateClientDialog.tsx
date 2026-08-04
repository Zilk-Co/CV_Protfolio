import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Check, Loader2, Shield, AlertTriangle } from "lucide-react";
import { apiFetch } from "@/lib/api";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function validatePassword(pw: string, name: string, slug: string): string | null {
  if (pw.length < 8) return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(pw)) return "Password must contain an uppercase letter";
  if (!/[a-z]/.test(pw)) return "Password must contain a lowercase letter";
  if (!/[0-9]/.test(pw)) return "Password must contain a number";
  if (name && pw.toLowerCase() === name.toLowerCase()) return "Password cannot be the same as the name";
  if (slug && pw.toLowerCase() === slug.toLowerCase()) return "Password cannot be the same as the slug";
  return null;
}

export const CreateClientDialog = memo(function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [pwError, setPwError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setSlug(""); setPassword(""); setAdminPassword("");
    setError(""); setPwError(""); setSuccess(false); setLoading(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handlePasswordChange = (val: string) => {
    setPassword(val);
    if (val) {
      const err = validatePassword(val, name, slug);
      setPwError(err || "");
    } else {
      setPwError("");
    }
  };

  const handleCreate = async () => {
    setError(""); setLoading(true);
    const validationErr = validatePassword(password, name, slug);
    if (validationErr) { setError(validationErr); setLoading(false); return; }
    try {
      const res = await apiFetch("/api/portfolio/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ name, slug, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Failed to create client"); setLoading(false); return; }
      setSuccess(true);
    } catch {
      setError("Network error. Please try again.");
    }
    setLoading(false);
  };

  const canSubmit = name && slug && password && adminPassword && !pwError && !loading;

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm bg-[#1a1a1a] border-white/[.08]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <div className="w-8 h-8 rounded-lg bg-[#d97706]/20 flex items-center justify-center">
              <Plus className="w-4 h-4 text-[#d97706]" />
            </div>
            Add New Client
          </DialogTitle>
          <DialogDescription className="text-white/40 text-sm">
            Create a new portfolio with login credentials.
          </DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="py-4 space-y-3">
            <div className="flex items-center gap-2 text-green-400 font-medium text-sm">
              <Check className="w-4 h-4" /> Client created successfully
            </div>
            <div className="text-xs text-white/50 space-y-2 bg-white/[.03] border border-white/[.06] rounded-xl p-4">
              <div className="flex justify-between"><span className="text-white/40">Portfolio URL</span><a href={`/${slug}`} className="text-[#d97706] hover:underline font-mono" target="_blank">/{slug}</a></div>
              <div className="flex justify-between"><span className="text-white/40">Login Slug</span><span className="text-white font-mono">{slug}</span></div>
              <div className="flex justify-between"><span className="text-white/40">Password</span><span className="text-white font-mono bg-white/10 px-2 py-0.5 rounded">{password}</span></div>
            </div>
            <Button className="w-full bg-white hover:bg-white/90 text-black font-bold h-11 rounded-xl" onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Portfolio Slug *</label>
                <Input
                  className="mt-1 bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                  value={slug}
                  onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))}
                  placeholder="e.g. umer-tsa"
                />
                {slug && <p className="text-[10px] text-white/30 mt-1">zilkco.com/<span className="text-[#d97706]">{slug}</span></p>}
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Name *</label>
                <Input
                  className="mt-1 bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Umer"
                />
              </div>
              <div>
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Password *</label>
                <PasswordInput
                  className="mt-1 bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                  value={password}
                  onChange={(e) => handlePasswordChange(e.target.value)}
                  placeholder="Min 8 chars, A-Z, a-z, 0-9"
                />
                {pwError && (
                  <p className="text-[10px] text-red-400 mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" />{pwError}</p>
                )}
              </div>
              <div className="pt-1 border-t border-white/[.06]">
                <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold flex items-center gap-1.5">
                  <Shield className="w-3 h-3" /> Super Admin Password *
                </label>
                <PasswordInput
                  className="mt-1 bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  placeholder="Required to authorize creation"
                />
              </div>
              {error && (
                <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg px-3 py-2 flex items-center gap-1.5">
                  <AlertTriangle className="w-3.5 h-3.5 shrink-0" /> {error}
                </p>
              )}
            </div>
            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button variant="ghost" className="text-white/40 hover:text-white hover:bg-white/[.05]" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
              <Button
                className="bg-white hover:bg-white/90 text-black font-bold h-10 rounded-xl px-6"
                disabled={!canSubmit}
                onClick={handleCreate}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : null}
                Create Client
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});
