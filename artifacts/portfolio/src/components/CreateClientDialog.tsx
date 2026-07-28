import { useState, memo } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Plus, Check, Loader2 } from "lucide-react";

interface CreateClientDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const CreateClientDialog = memo(function CreateClientDialog({ open, onOpenChange }: CreateClientDialogProps) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [password, setPassword] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);

  const reset = () => {
    setName(""); setSlug(""); setPassword(""); setAdminPassword(""); setError(""); setSuccess(false); setLoading(false);
  };

  const handleClose = (o: boolean) => {
    if (!o) reset();
    onOpenChange(o);
  };

  const handleCreate = async () => {
    setError(""); setLoading(true);
    try {
      const res = await fetch("/api/portfolio/create-client", {
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

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2"><Plus className="w-4 h-4" /> Create New Client</DialogTitle>
          <DialogDescription>Create a new client portfolio with a unique slug and admin password.</DialogDescription>
        </DialogHeader>
        {success ? (
          <div className="py-4 space-y-2">
            <p className="text-green-600 font-medium flex items-center gap-2"><Check className="w-4 h-4" /> Client created successfully!</p>
            <div className="text-xs text-muted-foreground space-y-1 bg-muted p-3 rounded-lg">
              <p><strong>Portfolio URL:</strong> <a href={`/${slug}`} className="text-primary underline" target="_blank">/{slug}</a></p>
              <p><strong>Login slug:</strong> {slug}</p>
              <p><strong>Password:</strong> {password}</p>
            </div>
            <Button className="w-full" onClick={() => { reset(); onOpenChange(false); }}>Done</Button>
          </div>
        ) : (
          <>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium">Full Name *</label>
                <Input className="mt-1" value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. Sarah Ahmed" />
              </div>
              <div>
                <label className="text-sm font-medium">URL Slug *</label>
                <Input className="mt-1" value={slug} onChange={(e) => setSlug(e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, "-"))} placeholder="e.g. sarah-ahmed" />
                {slug && <p className="text-xs text-muted-foreground mt-1">Portfolio URL: /{slug}</p>}
              </div>
              <div>
                <label className="text-sm font-medium">Admin Password *</label>
                <Input className="mt-1" type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="Set a login password" />
              </div>
              <div>
                <label className="text-sm font-medium">Your Super Admin Password *</label>
                <Input className="mt-1" type="password" value={adminPassword} onChange={(e) => setAdminPassword(e.target.value)} placeholder="Enter super admin password" />
              </div>
              {error && <p className="text-sm text-destructive">{error}</p>}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => { reset(); onOpenChange(false); }}>Cancel</Button>
              <Button disabled={!name || !slug || !password || !adminPassword || loading} onClick={handleCreate}>
                {loading ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : null}
                Create Client
              </Button>
            </DialogFooter>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
});
