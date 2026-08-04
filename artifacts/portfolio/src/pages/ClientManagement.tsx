import React, { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/api";
import {
  Users,
  Settings,
  Trash2,
  ChevronLeft,
  Search,
  FileText,
  Sparkles,
  BookOpen,
  Bot,
  Compass,
  Target,
  Check,
  X,
  Lock,
  ArrowRight,
  ArrowLeft,
  ShieldAlert,
  Loader2,
  Globe,
  Plus,
  Calendar,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  UserPlus,
  ShieldCheck,
  Mail,
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ClientFeatures {
  cvImportExport: boolean;
  themeSelector: boolean;
  blogPage: boolean;
  aiChat: boolean;
  exploreAccess: boolean;
  aiMatchAccess: boolean;
  recruiterAiAccess: boolean;
}

interface Client {
  id: number;
  slug: string;
  name: string;
  email: string;
  theme: string;
  status: string;
  features: ClientFeatures;
  trialStartsAt: string | null;
  adminLabel: string | null;
}

export default function ClientManagement() {
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [adminPassword, setAdminPassword] = useState("");
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [isDeleting, setIsDeleting] = useState<number | null>(null);
  const [editingPasswordFor, setEditingPasswordFor] = useState<Client | null>(null);
  const [newPassword, setNewPassword] = useState("");
  const [passwordLoading, setPasswordLoading] = useState(false);
  const [showAddClient, setShowAddClient] = useState(false);
  const [showPassword, setShowPassword] = useState<number | null>(null);
  const [tcPopup, setTcPopup] = useState<{ client: Client; action: 'activate' | 'deactivate' } | null>(null);
  const [tcAccepted, setTcAccepted] = useState(false);
  const [adminLabelInput, setAdminLabelInput] = useState("");
  const { toast } = useToast();

  // New client form state
  const [newClient, setNewClient] = useState({
    slug: "",
    password: "",
    name: "",
    email: "",
  });

  useEffect(() => {
    if (isAuthorized) fetchClients();
  }, [isAuthorized]);

  const handleAuthorize = async () => {
    if (!adminPassword) return;
    try {
      const response = await apiFetch("/api/portfolio/clients", {
        headers: { "x-admin-password": adminPassword }
      });
      if (response.ok) {
        setIsAuthorized(true);
        const data = await response.json();
        setClients(data);
      } else {
        toast({ variant: "destructive", title: "Access Denied", description: "Invalid admin password." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Connection failed." });
    }
  };

  const fetchClients = async () => {
    setLoading(true);
    try {
      const response = await apiFetch("/api/portfolio/clients", {
        headers: { "x-admin-password": adminPassword }
      });
      if (response.ok) {
        const data = await response.json();
        setClients(data);
      } else {
        toast({ variant: "destructive", title: "Error", description: "Could not fetch clients." });
        setIsAuthorized(false);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Connection failed." });
    } finally {
      setLoading(false);
    }
  };

  const handleCreateClient = async () => {
    if (!newClient.slug || !newClient.password) {
      toast({ variant: "destructive", title: "Error", description: "Slug and password are required." });
      return;
    }
    try {
      const response = await apiFetch("/api/portfolio/create-client", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword,
        },
        body: JSON.stringify(newClient),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Failed to create");
      toast({ title: "Client Created", description: `/${newClient.slug} is live!` });
      setShowAddClient(false);
      setNewClient({ slug: "", password: "", name: "", email: "" });
      fetchClients();
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to create client." });
    }
  };

  const handleUpdateFeatures = async (client: Client, newFeatures: ClientFeatures) => {
    try {
      const response = await apiFetch(`/api/portfolio/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({ features: newFeatures })
      });
      if (response.ok) {
        setClients(clients.map(c => c.id === client.id ? { ...c, features: newFeatures } : c));
        toast({ title: "Updated", description: `Features for ${client.slug} updated.` });
        setEditingClient(null);
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update." });
    }
  };

  const handleChangePassword = async (client: Client) => {
    if (!newPassword) { toast({ variant: "destructive", title: "Error", description: "Enter a new password." }); return; }
    setPasswordLoading(true);
    try {
      const res = await apiFetch(`/api/portfolio/clients/${client.id}/password`, {
        method: "PUT",
        headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setClients(clients.map(c => c.id === client.id ? { ...c } : c));
      toast({ title: "Password Updated", description: `Password for ${client.slug} changed.` });
      setEditingPasswordFor(null);
      setNewPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteClient = async (id: number, slug: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${slug}? All data will be lost.`)) return;
    setIsDeleting(id);
    try {
      const response = await apiFetch(`/api/portfolio/clients/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });
      const data = await response.json();
      if (response.ok) {
        setClients(clients.filter(c => c.id !== id));
        toast({ title: "Deleted", description: `Client ${slug} removed.` });
      } else {
        toast({ variant: "destructive", title: "Delete Failed", description: data.error || "Could not delete client." });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
    } finally {
      setIsDeleting(null);
    }
  };

  const handleTrialToggle = async (client: Client) => {
    if (client.status === 'locked') {
      // Activate trial
      setTcPopup({ client, action: 'activate' });
    } else {
      // Deactivate (lock)
      setTcPopup({ client, action: 'deactivate' });
    }
  };

  const confirmTrialToggle = async () => {
    if (!tcPopup) return;
    const { client, action } = tcPopup;
    const newStatus = action === 'activate' ? 'open' : 'locked';
    try {
      const response = await apiFetch(`/api/portfolio/clients/${client.id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({ status: newStatus })
      });
      if (response.ok) {
        setClients(clients.map(c => c.id === client.id ? { ...c, status: newStatus } : c));
        toast({ title: action === 'activate' ? "Trial Activated" : "Trial Deactivated", description: `${client.slug} is now ${newStatus}.` });
      }
    } catch {
      toast({ variant: "destructive", title: "Error", description: "Failed to update status." });
    }
    setTcPopup(null);
    setTcAccepted(false);
  };

  const filteredClients = clients.filter(c =>
    c.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const featureList = [
    { key: 'cvImportExport', icon: FileText, label: 'CV Import/Export' },
    { key: 'themeSelector', icon: Sparkles, label: 'Theme Selector' },
    { key: 'blogPage', icon: BookOpen, label: 'Blog Page' },
    { key: 'aiChat', icon: Bot, label: 'AI Chat' },
    { key: 'exploreAccess', icon: Compass, label: 'Explore' },
    { key: 'aiMatchAccess', icon: Target, label: 'AI Match' },
    { key: 'recruiterAiAccess', icon: ShieldCheck, label: 'Recruiter AI' },
  ] as const;

  // ─── Login Screen ──────────────────────────────────────────────
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-[#111] flex items-center justify-center p-4 relative overflow-hidden">
        {/* Background glows */}
        <div className="absolute top-1/3 -left-20 w-96 h-96 bg-[#d97706]/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/3 -right-20 w-96 h-96 bg-[#d97706]/3 rounded-full blur-[120px]" />

        <div className="w-full max-w-sm relative z-10">
          <button onClick={() => window.location.href = "/"} className="flex items-center gap-1.5 text-white/30 hover:text-white/60 text-xs mb-6 transition-colors">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to site
          </button>

          <div className="bg-[#1a1a1a] border border-white/[.08] rounded-2xl shadow-2xl overflow-hidden">
            <div className="px-8 pt-8 pb-6 text-center border-b border-white/[.06]">
              <div className="w-14 h-14 rounded-2xl bg-[#d97706]/10 border border-[#d97706]/20 flex items-center justify-center mx-auto mb-4">
                <ShieldCheck className="w-6 h-6 text-[#d97706]" />
              </div>
              <h1 className="text-xl font-heading font-bold text-white tracking-tight">Admin Dashboard</h1>
              <p className="text-white/30 text-sm mt-1.5">Enter super admin password to continue</p>
            </div>

            <div className="px-8 py-6 space-y-4">
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 z-10" />
                  <PasswordInput
                    value={adminPassword}
                    onChange={(e) => setAdminPassword(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
                    className="bg-white/[.05] border-white/[.1] pl-10 h-11 rounded-xl text-white placeholder:text-white/20 focus:ring-[#d97706]/30 focus:border-[#d97706]/50"
                    placeholder="Enter super admin password"
                  />
                </div>
              </div>
              <Button
                onClick={handleAuthorize}
                className="w-full bg-[#d97706] hover:bg-[#c2660a] h-11 rounded-xl font-bold text-white transition-all"
                disabled={!adminPassword}
              >
                Enter Dashboard <ArrowRight className="w-4 h-4 ml-1.5" />
              </Button>
            </div>

            <div className="px-8 pb-6 pt-2 border-t border-white/[.06]">
              <button onClick={() => window.location.href = "/"} className="w-full text-center text-white/20 text-xs hover:text-white/40 transition-colors py-1">
                Go back without signing in
              </button>
            </div>
          </div>

          <p className="text-center text-white/15 text-[10px] mt-6 tracking-widest uppercase">Zilk Co. Portfolio System</p>
        </div>
      </div>
    );
  }

  // ─── Dashboard ────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#111] text-white">
      <div className="max-w-6xl mx-auto p-4 sm:p-8 space-y-8">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <button onClick={() => window.location.href = "/"} className="flex items-center gap-1 text-xs text-[#d97706] hover:text-[#f59e0b] mb-3 transition-colors">
              <ChevronLeft className="w-3 h-3" /> Back to Home
            </button>
            <h1 className="text-3xl font-heading font-black tracking-tight flex items-center gap-3">
              <Users className="w-8 h-8 text-[#d97706]" /> Client Management
            </h1>
            <p className="text-white/40 text-sm mt-1">Manage portfolios, features, and trial status</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30 group-focus-within:text-[#d97706] transition-colors" />
              <Input
                placeholder="Search clients..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="bg-white/[.05] border-white/[.1] pl-10 h-10 rounded-xl w-48 focus:ring-[#d97706]/50 text-white placeholder:text-white/30"
              />
            </div>
            <Button
              onClick={() => setShowAddClient(true)}
              className="bg-[#d97706] hover:bg-[#c2660a] h-10 rounded-xl font-bold text-white gap-1.5"
            >
              <Plus className="w-4 h-4" /> New Client
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', val: clients.length, icon: Users, color: '#d97706' },
            { label: 'Active (Paid)', val: clients.filter(c => c.status === 'open').length, icon: Globe, color: '#10b981' },
            { label: 'Locked (Trial Expired)', val: clients.filter(c => c.status === 'locked').length, icon: Lock, color: '#ef4444' },
            { label: 'In Trial (< 7d)', val: clients.filter(c => {
              if (!c.trialStartsAt || c.status !== 'open') return false;
              const diff = Date.now() - new Date(c.trialStartsAt).getTime();
              return diff < 7 * 24 * 60 * 60 * 1000;
            }).length, icon: Clock, color: '#f59e0b' },
          ].map((stat, i) => (
            <div key={i} className="bg-[#1a1a1a] border border-white/[.06] p-5 rounded-2xl">
              <div className="flex items-center gap-2 mb-2">
                <stat.icon className="w-4 h-4" style={{ color: stat.color }} />
                <span className="text-[10px] uppercase tracking-widest text-white/40 font-bold">{stat.label}</span>
              </div>
              <p className="text-3xl font-black">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Client Cards */}
        <div className="space-y-4">
          {loading ? (
            <div className="bg-[#1a1a1a] border border-white/[.06] rounded-2xl p-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin mx-auto mb-3 text-[#d97706]/30" />
              <p className="text-white/40 text-sm">Loading clients...</p>
            </div>
          ) : filteredClients.length === 0 ? (
            <div className="bg-[#1a1a1a] border border-white/[.06] rounded-2xl p-20 text-center">
              <Users className="w-10 h-10 mx-auto mb-3 text-white/10" />
              <p className="text-white/40 text-sm">No clients found</p>
            </div>
          ) : (
            filteredClients.map((client) => (
              <div key={client.id} className="bg-[#1a1a1a] border border-white/[.06] rounded-2xl p-5 hover:border-white/[.12] transition-all">
                {/* Row 1: Identity + Status */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-11 h-11 rounded-xl bg-[#d97706]/10 border border-[#d97706]/20 flex items-center justify-center text-sm font-bold text-[#d97706]">
                      {client.slug.substring(0, 2).toUpperCase()}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-bold text-white">{client.name}</p>
                        {client.adminLabel && (
                          <span className="px-2 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-wider bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            {client.adminLabel}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-[#d97706] font-mono">/{client.slug}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      client.status === 'open'
                        ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                        : 'bg-red-500/10 text-red-400 border border-red-500/20'
                    }`}>
                      {client.status === 'open' ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      {client.status === 'open' ? 'Active' : 'Locked'}
                    </span>
                    {client.trialStartsAt && (() => {
                      const start = new Date(client.trialStartsAt).getTime();
                      const now = Date.now();
                      const diff = now - start;
                      const daysLeft = 7 - Math.floor(diff / (1000 * 60 * 60 * 24));
                      if (daysLeft > 0 && client.status === 'open') {
                        return (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-[10px] font-bold bg-amber-500/10 text-amber-400 border border-amber-500/20">
                            <Clock className="w-3 h-3" />
                            {daysLeft}d trial left
                          </span>
                        );
                      }
                      return null;
                    })()}
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 px-3 rounded-lg text-[10px] font-bold ${
                        client.status === 'open'
                          ? 'hover:bg-red-600/10 hover:text-red-400 text-white/40'
                          : 'hover:bg-emerald-600/10 hover:text-emerald-400 text-white/40'
                      }`}
                      onClick={() => handleTrialToggle(client)}
                    >
                      {client.status === 'open' ? 'Lock' : 'Activate'}
                    </Button>
                  </div>
                </div>

                {/* Row 2: Features */}
                <div className="flex flex-wrap gap-1.5 mb-4">
                  {featureList.map((f) => {
                    const active = client.features[f.key as keyof ClientFeatures];
                    return (
                      <div
                        key={f.key}
                        title={f.label}
                        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[10px] font-bold transition-all ${
                          active
                            ? 'bg-[#d97706]/10 text-[#d97706] border border-[#d97706]/20'
                            : 'bg-white/[.03] text-white/20 border border-white/[.05]'
                        }`}
                      >
                        <f.icon className="w-3 h-3" />
                        {f.label}
                      </div>
                    );
                  })}
                </div>

                {/* Row 3: Actions */}
                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-white/[.05]">
                  <div className="flex items-center gap-1.5 text-xs text-white/30 mr-auto">
                    <Mail className="w-3 h-3" />
                    {client.email || 'No email'}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs hover:bg-[#d97706]/10 hover:text-[#d97706] text-white/50"
                    onClick={() => { setEditingClient(client); setAdminLabelInput(client.adminLabel || ""); }}
                  >
                    <Settings className="w-3.5 h-3.5 mr-1" /> Features
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs hover:bg-amber-600/10 hover:text-amber-400 text-white/50"
                    onClick={() => { setEditingPasswordFor(client); setNewPassword(""); }}
                  >
                    <Lock className="w-3.5 h-3.5 mr-1" /> Password
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 px-3 rounded-lg text-xs hover:bg-blue-600/10 hover:text-blue-400 text-white/50"
                    onClick={() => window.open(`/${client.slug}`, '_blank')}
                  >
                    <Eye className="w-3.5 h-3.5 mr-1" /> View
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    disabled={isDeleting === client.id}
                    className="h-8 px-3 rounded-lg text-xs hover:bg-rose-600/10 hover:text-rose-400 text-white/30"
                    onClick={() => handleDeleteClient(client.id, client.slug)}
                  >
                    {isDeleting === client.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5 mr-1" />}
                    Delete
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* ─── Add Client Modal ─── */}
      {showAddClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/[.1] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <UserPlus className="w-5 h-5 text-[#d97706]" />
                <h2 className="text-lg font-heading font-bold">Add New Client</h2>
              </div>
              <button onClick={() => { setShowAddClient(false); setNewClient({ slug: "", password: "", name: "", email: "" }); }} className="p-2 hover:bg-white/[.05] rounded-xl text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Portfolio Slug *</Label>
                <Input
                  value={newClient.slug}
                  onChange={(e) => setNewClient({ ...newClient, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '') })}
                  placeholder="e.g. john-doe"
                  className="bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Name</Label>
                <Input
                  value={newClient.name}
                  onChange={(e) => setNewClient({ ...newClient, name: e.target.value })}
                  placeholder="e.g. John Doe"
                  className="bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Email</Label>
                <Input
                  type="email"
                  value={newClient.email}
                  onChange={(e) => setNewClient({ ...newClient, email: e.target.value })}
                  placeholder="e.g. john@example.com"
                  className="bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                />
              </div>
              <div>
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold mb-1.5 block">Password *</Label>
                <Input
                  type="text"
                  value={newClient.password}
                  onChange={(e) => setNewClient({ ...newClient, password: e.target.value })}
                  placeholder="Min 8 chars, A-Z, a-z, 0-9"
                  className="bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                />
              </div>
            </div>

            <Button
              onClick={handleCreateClient}
              className="w-full bg-[#d97706] hover:bg-[#c2660a] h-11 rounded-xl font-bold text-white"
              disabled={!newClient.slug || !newClient.password}
            >
              Create Client Portfolio
            </Button>
          </div>
        </div>
      )}

      {/* ─── Edit Features Modal ─── */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/[.1] rounded-2xl shadow-2xl flex flex-col max-h-[90vh]">
            {/* Header */}
            <div className="flex items-center justify-between px-6 pt-5 pb-3 border-b border-white/[.06] flex-shrink-0">
              <div>
                <h2 className="text-lg font-heading font-bold">Edit Features</h2>
                <p className="text-white/40 text-xs">for <span className="text-[#d97706] font-mono">/{editingClient.slug}</span></p>
              </div>
              <button onClick={() => setEditingClient(null)} className="p-2 hover:bg-white/[.05] rounded-xl text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Scrollable content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
              <div className="space-y-2">
                {[
                  { id: 'cvImportExport', icon: FileText, label: 'CV Import & Export', desc: 'Allow PDF imports and resume exports' },
                  { id: 'themeSelector', icon: Sparkles, label: 'Theme Selector', desc: 'Allow user to swap between themes' },
                  { id: 'blogPage', icon: BookOpen, label: 'Blog Page', desc: 'Enable the dedicated blogs section' },
                  { id: 'aiChat', icon: Bot, label: 'AI Chat Widget', desc: 'Floating AI assistant on portfolio' },
                  { id: 'exploreAccess', icon: Compass, label: 'Explore Page', desc: 'Allow access to community explore' },
                  { id: 'aiMatchAccess', icon: Target, label: 'AI Match (Explore)', desc: 'AI-powered candidate matching' },
                  { id: 'recruiterAiAccess', icon: ShieldCheck, label: 'Recruiter AI', desc: 'AI answers recruiter questions about profile' },
                ].map((feat) => {
                  const active = editingClient.features[feat.id as keyof ClientFeatures];
                  return (
                    <div
                      key={feat.id}
                      onClick={() => setEditingClient({
                        ...editingClient,
                        features: { ...editingClient.features, [feat.id]: !active }
                      })}
                      className={`flex items-center gap-3 p-3 rounded-xl border cursor-pointer transition-all ${
                        active ? 'bg-[#d97706]/10 border-[#d97706]/30' : 'bg-white/[.02] border-white/[.06] opacity-50 hover:opacity-75'
                      }`}
                    >
                      <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${active ? 'bg-[#d97706]/20' : 'bg-white/[.05]'}`}>
                        <feat.icon className={`w-4 h-4 ${active ? 'text-[#d97706]' : 'text-white/30'}`} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold">{feat.label}</p>
                        <p className="text-[10px] text-white/30">{feat.desc}</p>
                      </div>
                      {active && <Check className="w-4 h-4 text-[#d97706] flex-shrink-0" />}
                    </div>
                  );
                })}
              </div>

              {/* Admin Label */}
              <div className="space-y-2">
                <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">Admin Label (optional)</Label>
                <Input
                  value={adminLabelInput}
                  onChange={(e) => setAdminLabelInput(e.target.value)}
                  placeholder="e.g. HR, Developer, Designer"
                  className="bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                />
                <p className="text-[10px] text-white/30">Label shown in super admin to identify client role</p>
              </div>
            </div>

            {/* Fixed footer */}
            <div className="px-6 py-4 border-t border-white/[.06] flex-shrink-0">
              <Button
                className="w-full bg-[#d97706] hover:bg-[#c2660a] h-11 rounded-xl font-bold text-white"
                onClick={async () => {
                  if (editingClient) {
                    await handleUpdateFeatures(editingClient, editingClient.features);
                    if (adminLabelInput !== (editingClient.adminLabel || "")) {
                      try {
                        await apiFetch(`/api/portfolio/clients/${editingClient.id}`, {
                          method: "PUT",
                          headers: { "Content-Type": "application/json", "x-admin-password": adminPassword },
                          body: JSON.stringify({ adminLabel: adminLabelInput || null })
                        });
                        setClients(clients.map(c => c.id === editingClient.id ? { ...c, adminLabel: adminLabelInput || null } : c));
                      } catch {}
                    }
                  }
                }}
              >
                Save Changes
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* ─── Change Password Modal ─── */}
      {editingPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 backdrop-blur-xl bg-black/70">
          <div className="w-full max-w-md bg-[#1a1a1a] border border-white/[.1] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-lg font-heading font-bold">Change Password</h2>
                <p className="text-white/40 text-xs">for <span className="text-[#d97706] font-mono">/{editingPasswordFor.slug}</span></p>
              </div>
              <button onClick={() => { setEditingPasswordFor(null); setNewPassword(""); }} className="p-2 hover:bg-white/[.05] rounded-xl text-white/40 hover:text-white transition-colors">
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="bg-white/[.03] border border-white/[.06] rounded-xl p-3">
              <p className="text-[10px] uppercase tracking-widest text-white/30 font-bold mb-1">Password</p>
              <p className="text-sm text-white/40">Only the account holder knows this password</p>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] uppercase tracking-widest text-white/40 font-bold">New Password</Label>
              <PasswordInput
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="Min 8 chars, A-Z, a-z, 0-9"
                className="bg-white/[.05] border-white/[.1] h-10 rounded-xl text-white placeholder:text-white/20"
                onKeyDown={(e) => e.key === 'Enter' && handleChangePassword(editingPasswordFor)}
              />
            </div>

            <Button
              className="w-full bg-white hover:bg-white/90 h-11 rounded-xl font-bold text-black"
              onClick={() => handleChangePassword(editingPasswordFor)}
              disabled={passwordLoading || !newPassword}
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Update Password
            </Button>
          </div>
        </div>
      )}

      {/* ─── Terms & Conditions Popup ─── */}
      {tcPopup && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 backdrop-blur-xl bg-black/80">
          <div className="w-full max-w-lg bg-[#1a1a1a] border border-white/[.1] rounded-2xl shadow-2xl p-6 space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                <AlertTriangle className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <h2 className="text-lg font-heading font-bold">
                  {tcPopup.action === 'activate' ? 'Activate Trial' : 'Deactivate Portfolio'}
                </h2>
                <p className="text-white/40 text-xs">
                  {tcPopup.action === 'activate'
                    ? `Activating trial for /${tcPopup.client.slug}`
                    : `Locking portfolio /${tcPopup.client.slug}`}
                </p>
              </div>
            </div>

            <div className="bg-white/[.03] border border-white/[.06] rounded-xl p-4 max-h-60 overflow-y-auto space-y-3 text-[11px] text-white/50 leading-relaxed">
              <p className="font-semibold text-white/70 text-xs">Terms & Conditions</p>
              <div>
                <p className="font-semibold text-white/60 mb-0.5">1. Your Data Is Yours</p>
                <p>We do not steal, sell, or misuse your data. Everything you upload stays yours. We only store what you choose to put on your portfolio.</p>
              </div>
              <div>
                <p className="font-semibold text-white/60 mb-0.5">2. What You Make Public</p>
                <p>Any information you display on your portfolio (name, photo, contact info, work) will be visible to anyone who visits your portfolio link. This is the purpose — recruiters and clients need to see and contact you.</p>
              </div>
              <div>
                <p className="font-semibold text-white/60 mb-0.5">3. Contact Info Usage</p>
                <p>Contact details you provide are only used to reach you about your account, trial, and portfolio. We never share them with third parties.</p>
              </div>
              <div>
                <p className="font-semibold text-white/60 mb-0.5">4. Password & Account Security</p>
                <p>Your password is encrypted and stored securely. We cannot see it. Only you can access your portfolio admin panel.</p>
              </div>
              <div>
                <p className="font-semibold text-white/60 mb-0.5">5. Free Trial</p>
                <p>The 7-day free trial gives full access to all features. No credit card required. After the trial, choose a plan (PKR 400/mo or PKR 800/mo with AI) to keep it live.</p>
              </div>
              <div>
                <p className="font-semibold text-white/60 mb-0.5">6. Cancellation</p>
                <p>Stop paying and your portfolio locks. Your data remains for 30 days in case you return.</p>
              </div>
            </div>

            <label className="flex items-start gap-3 cursor-pointer p-3 bg-white/[.03] border border-white/[.06] rounded-xl">
              <input
                type="checkbox"
                checked={tcAccepted}
                onChange={(e) => setTcAccepted(e.target.checked)}
                className="mt-0.5 w-4 h-4 rounded border-white/20 bg-white/[.05] text-[#d97706] focus:ring-[#d97706]/50"
              />
              <span className="text-xs text-white/60">I have read and agree to the Terms & Conditions above</span>
            </label>

            <div className="flex gap-3">
              <Button
                variant="ghost"
                className="flex-1 h-11 rounded-xl border border-white/[.1] text-white/60 hover:bg-white/[.05]"
                onClick={() => { setTcPopup(null); setTcAccepted(false); }}
              >
                Cancel
              </Button>
              <Button
                className={`flex-1 h-11 rounded-xl font-bold text-white ${
                  tcPopup.action === 'activate'
                    ? 'bg-emerald-600 hover:bg-emerald-700'
                    : 'bg-red-600 hover:bg-red-700'
                }`}
                disabled={!tcAccepted}
                onClick={confirmTrialToggle}
              >
                {tcPopup.action === 'activate' ? 'Activate Trial' : 'Lock Portfolio'}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
