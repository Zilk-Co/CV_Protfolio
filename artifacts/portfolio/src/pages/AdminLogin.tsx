import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Lock, User, ArrowRight, ArrowLeft, ShieldCheck, Loader2 } from "lucide-react";
import { apiFetch } from "@/lib/api";

const SUPER_ADMIN_USERNAME = "Ayaan&Mustafa";
const SUPER_ADMIN_PASSWORD = "Master_admin1_KLM";

export default function AdminLogin() {
  const [, setLocation] = useLocation();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username || !password) { setError("Enter both username and password"); return; }
    setLoading(true); setError("");

    try {
      if (username === SUPER_ADMIN_USERNAME && password === SUPER_ADMIN_PASSWORD) {
        localStorage.setItem("is_super_admin", "true");
        setLocation("/admin/clients");
        return;
      }
      const res = await apiFetch("/api/portfolio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      localStorage.setItem("portfolio_slug", data.slug);
      localStorage.setItem("portfolio_token", data.token);
      window.location.href = `/admin/${data.slug}`;
    } catch (err: any) {
      setError(err.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#111] flex items-center justify-center p-4 relative overflow-hidden">
      {/* Background glows */}
      <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#d97706]/5 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-[#d97706]/3 rounded-full blur-[120px]" />

      {/* Grain */}
      <div className="fixed inset-0 pointer-events-none opacity-[0.015]" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        backgroundRepeat: "repeat",
      }} />

      <div className="w-full max-w-md relative z-10">
        {/* Back button */}
        <a href="/" className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs mb-6 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" /> Back to site
        </a>

        {/* Login card */}
        <div className="bg-[#1a1a1a] border border-white/[.08] rounded-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="px-8 pt-8 pb-6 text-center border-b border-white/[.06]">
            <div className="w-14 h-14 bg-[#d97706]/10 border border-[#d97706]/20 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <ShieldCheck className="w-6 h-6 text-[#d97706]" />
            </div>
            <h1 className="text-xl font-heading font-bold text-white tracking-tight">Admin Login</h1>
            <p className="text-white/30 text-sm mt-1.5">Sign in to manage your portfolio</p>
          </div>

          {/* Form */}
          <form onSubmit={handleLogin} className="px-8 py-6 space-y-4">
            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Username</label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20" />
                <Input
                  className="bg-white/[.05] border-white/[.1] pl-10 h-11 rounded-xl text-white placeholder:text-white/20 focus:ring-[#d97706]/30 focus:border-[#d97706]/50"
                  placeholder="Enter your username"
                  value={username}
                  onChange={e => setUsername(e.target.value)}
                  autoFocus
                />
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Password</label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 z-10" />
                <PasswordInput
                  className="bg-white/[.05] border-white/[.1] pl-10 h-11 rounded-xl text-white placeholder:text-white/20 focus:ring-[#d97706]/30 focus:border-[#d97706]/50"
                  placeholder="Enter your password"
                  value={password}
                  onChange={e => setPassword(e.target.value)}
                />
              </div>
            </div>

            {error && (
              <p className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-xl px-3 py-2.5">{error}</p>
            )}

            <Button
              type="submit"
              className="w-full bg-[#d97706] hover:bg-[#c2660a] h-11 rounded-xl font-bold text-white transition-all"
              disabled={loading || !username || !password}
            >
              {loading ? (
                <><Loader2 className="w-4 h-4 animate-spin mr-2" /> Signing in...</>
              ) : (
                <><span>Sign in</span> <ArrowRight className="w-4 h-4 ml-1.5" /></>
              )}
            </Button>
          </form>

          {/* Footer */}
          <div className="px-8 pb-6 pt-2 border-t border-white/[.06]">
            <a href="/" className="block w-full text-center text-white/20 text-xs hover:text-white/40 transition-colors py-1">
              Go back without signing in
            </a>
          </div>
        </div>

        <p className="text-center text-white/15 text-[10px] mt-6 tracking-widest uppercase">Zilk Co. Portfolio System</p>
      </div>
    </div>
  );
}
