import React, { useState, useEffect } from 'react';
import { apiFetch } from "@/lib/api";
import { 
  Users, 
  Settings, 
  Trash2, 
  ChevronLeft, 
  Search, 
  FileText, 
  MessageCircle, 
  Sparkles, 
  BookOpen,
  Check,
  X,
  Lock,
  ArrowRight,
  ShieldAlert,
  Loader2,
  Globe,
  Bot
} from 'lucide-react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";

interface ClientFeatures {
  cvImportExport: boolean;
  aiChat: boolean;
  themeSelector: boolean;
  blogPage: boolean;
  exploreAccess: boolean;
  aiMatchAccess: boolean;
}

interface Client {
  id: number;
  slug: string;
  name: string;
  email: string;
  theme: string;
  status: string;
  features: ClientFeatures;
  plainPassword: string;
}

const ADMIN_MGMT_PASSWORD = ""; // Removed: server validates via env var

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
  const { toast } = useToast();

  useEffect(() => {
    // Only fetch if authorized
    if (isAuthorized) {
      fetchClients();
    }
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
        toast({ variant: "destructive", title: "Error", description: "Invalid admin password." });
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
        toast({
          variant: "destructive",
          title: "Error",
          description: "Could not fetch clients. Check your password.",
        });
        setIsAuthorized(false);
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Connection failed.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateFeatures = async (client: Client, newFeatures: ClientFeatures) => {
    try {
      const response = await fetch(`/api/portfolio/clients/${client.id}`, {
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
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to update." });
    }
  };

  const handleChangePassword = async (client: Client) => {
    if (!newPassword) { toast({ variant: "destructive", title: "Error", description: "Enter a new password." }); return; }
    setPasswordLoading(true);
    try {
      const res = await fetch(`/api/portfolio/clients/${client.id}/password`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": adminPassword
        },
        body: JSON.stringify({ password: newPassword })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed");
      setClients(clients.map(c => c.id === client.id ? { ...c, plainPassword: newPassword } : c));
      toast({ title: "Password Updated", description: `Password for ${client.slug} changed.` });
      setEditingPasswordFor(null);
      setNewPassword("");
    } catch (err: any) {
      toast({ variant: "destructive", title: "Error", description: err.message || "Failed to change password." });
    } finally {
      setPasswordLoading(false);
    }
  };

  const handleDeleteClient = async (id: number, slug: string) => {
    if (!window.confirm(`Are you absolutely sure you want to delete ${slug}? All data will be lost.`)) return;
    
    setIsDeleting(id);
    try {
      const response = await fetch(`/api/portfolio/clients/${id}`, {
        method: "DELETE",
        headers: { "x-admin-password": adminPassword }
      });

      if (response.ok) {
        setClients(clients.filter(c => c.id !== id));
        toast({ title: "Deleted", description: `Client ${slug} removed.` });
      }
    } catch (err) {
      toast({ variant: "destructive", title: "Error", description: "Failed to delete." });
    } finally {
      setIsDeleting(null);
    }
  };

  const filteredClients = clients.filter(c => 
    c.slug.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <div className="max-w-md w-full space-y-8 bg-slate-900/50 p-8 rounded-3xl border border-slate-800 backdrop-blur-xl shadow-2xl">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-blue-600/20 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-blue-500/30">
              <ShieldAlert className="w-8 h-8 text-blue-400" />
            </div>
            <h1 className="text-3xl font-black tracking-tight">Admin Entry</h1>
            <p className="text-slate-400 text-sm">Enter the master password to manage clients.</p>
          </div>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">Master Password</Label>
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                <Input 
                  type="password" 
                  value={adminPassword}
                  onChange={(e) => setAdminPassword(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAuthorize()}
                  className="bg-slate-950 border-slate-800 pl-10 h-12 rounded-xl focus:ring-blue-500 focus:border-blue-500" 
                  placeholder="••••••••••••"
                />
              </div>
            </div>
            <Button 
              onClick={handleAuthorize}
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold gap-2"
            >
              Access Dashboard <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
          
          <button onClick={() => window.location.href = "/"} className="w-full text-slate-500 text-xs hover:text-slate-300 transition-colors">
            Return to Homepage
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-white p-4 sm:p-8">
      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="space-y-1">
            <button onClick={() => window.location.href = "/"} className="flex items-center gap-1 text-xs text-blue-400 hover:text-blue-300 mb-2 transition-colors">
              <ChevronLeft className="w-3 h-3" /> Back to Editor
            </button>
            <h1 className="text-4xl font-black tracking-tighter flex items-center gap-3">
              <Users className="w-10 h-10 text-blue-500" /> Client Control
            </h1>
            <p className="text-slate-400 text-sm">Manage access and features for your SaaS tenants.</p>
          </div>

          <div className="relative group w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 transition-colors group-focus-within:text-blue-400" />
            <Input 
              placeholder="Search by slug or name..." 
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="bg-slate-900 border-slate-800 pl-10 h-10 rounded-xl focus:ring-blue-500/50 transition-all"
            />
          </div>
        </div>

        {/* Dashboard Stats / Summary */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          {[
            { label: 'Total Clients', val: clients.length, color: 'blue' },
            { label: 'Active Plans', val: clients.filter(c => c.status === 'open').length, color: 'emerald' },
            { label: 'AI Enabled', val: clients.filter(c => c.features.aiChat).length, color: 'purple' },
            { label: 'Blog Enabled', val: clients.filter(c => c.features.blogPage).length, color: 'orange' },
          ].map((stat, i) => (
            <div key={i} className="bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
              <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">{stat.label}</p>
              <p className="text-2xl font-black">{stat.val}</p>
            </div>
          ))}
        </div>

        {/* Client List */}
        <div className="bg-slate-900/40 border border-slate-800 rounded-3xl overflow-hidden backdrop-blur-md shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-950/50 border-b border-slate-800">
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Identity</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Password</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Enabled Features</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500">Status</th>
                  <th className="px-6 py-4 text-xs font-bold uppercase tracking-wider text-slate-500 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/50">
                {loading ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">
                      <Loader2 className="w-10 h-10 animate-spin mx-auto mb-2 text-blue-500/20" />
                      Fetching clients...
                    </td>
                  </tr>
                ) : filteredClients.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-20 text-center text-slate-500">No clients found.</td>
                  </tr>
                ) : filteredClients.map((client) => (
                  <tr key={client.id} className="hover:bg-slate-800/20 transition-colors group">
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-xl bg-slate-800 flex items-center justify-center text-sm font-bold border border-slate-700">
                          {client.slug.substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-200">{client.name}</p>
                          <p className="text-xs text-blue-400">/{client.slug}</p>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs text-slate-400 bg-slate-800/50 px-2 py-1 rounded-lg border border-slate-700/50">
                          {client.plainPassword || "••••••••"}
                        </span>
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 rounded-lg hover:bg-amber-600/10 hover:text-amber-400 text-slate-600"
                          onClick={() => { setEditingPasswordFor(client); setNewPassword(""); }}
                          title="Change password"
                        >
                          <Lock className="w-3 h-3" />
                        </Button>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex gap-1.5 flex-wrap">
                        {[
                          { key: 'cvImportExport', icon: FileText, label: 'CV' },
                          { key: 'aiChat', icon: MessageCircle, label: 'AI Chat' },
                          { key: 'themeSelector', icon: Sparkles, label: 'Themes' },
                          { key: 'blogPage', icon: BookOpen, label: 'Blog' },
                          { key: 'exploreAccess', icon: Globe, label: 'Explore' },
                          { key: 'aiMatchAccess', icon: Bot, label: 'AI Match' },
                        ].map((f) => {
                          const Icon = f.icon;
                          const active = client.features[f.key as keyof ClientFeatures];
                          return (
                            <div 
                              key={f.key} 
                              title={f.label}
                              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all ${
                                active ? 'bg-blue-600/20 text-blue-400 border border-blue-500/30' : 'bg-slate-800/50 text-slate-700 border border-slate-800'
                              }`}
                            >
                              <Icon className="w-3.5 h-3.5" />
                            </div>
                          );
                        })}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                        client.status === 'open' ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' : 'bg-slate-800 text-slate-500 border border-slate-700'
                      }`}>
                        {client.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="h-8 w-8 p-0 rounded-lg hover:bg-blue-600/10 hover:text-blue-400"
                          onClick={() => setEditingClient(client)}
                        >
                          <Settings className="w-4 h-4" />
                        </Button>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          disabled={isDeleting === client.id}
                          className="h-8 w-8 p-0 rounded-lg hover:bg-rose-600/10 hover:text-rose-400 text-slate-600"
                          onClick={() => handleDeleteClient(client.id, client.slug)}
                        >
                          {isDeleting === client.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Edit Features Modal */}
      {editingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Edit Plan Access</h2>
                <p className="text-slate-400 text-xs">Configure features for <span className="text-blue-400 font-mono">/{editingClient.slug}</span></p>
              </div>
              <button onClick={() => setEditingClient(null)} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              {[
                { id: 'cvImportExport', label: 'CV Import & Export', icon: FileText, desc: 'Allow PDF imports and resume JSON exports' },
                { id: 'aiChat', label: 'AI Chat Box', icon: MessageCircle, desc: 'Enable floating AI assistant for visitors' },
                { id: 'themeSelector', label: 'Theme Selector', icon: Sparkles, desc: 'Allow user to swap between themes' },
                { id: 'blogPage', label: 'Blog Page', icon: BookOpen, desc: 'Enable the dedicated blogs section' },
                { id: 'exploreAccess', label: 'Explore Page', icon: Globe, desc: 'Allow access to the Explore community page' },
                { id: 'aiMatchAccess', label: 'AI Recruiter Match', icon: Bot, desc: 'Allow access to the AI recruitment matching tool' },
              ].map((feat) => {
                const Icon = feat.icon;
                const active = editingClient.features[feat.id as keyof ClientFeatures];
                return (
                  <div 
                    key={feat.id}
                    onClick={() => {
                      setEditingClient({
                        ...editingClient,
                        features: {
                          ...editingClient.features,
                          [feat.id]: !active
                        }
                      });
                    }}
                    className={`flex items-start gap-3 p-4 rounded-2xl border cursor-pointer transition-all ${
                      active ? 'bg-blue-600/10 border-blue-500/40' : 'bg-slate-950 border-slate-800 opacity-60'
                    }`}
                  >
                    <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center ${active ? 'bg-blue-600/20' : 'bg-slate-900'}`}>
                      <Icon className={`w-4 h-4 ${active ? 'text-blue-400' : 'text-slate-600'}`} />
                    </div>
                    <div className="flex-1">
                      <p className="text-xs font-bold">{feat.label}</p>
                      <p className="text-[10px] text-slate-500">{feat.desc}</p>
                    </div>
                    {active && <Check className="w-4 h-4 text-blue-400" />}
                  </div>
                );
              })}
            </div>

            <div className="bg-amber-600/10 border border-amber-500/20 rounded-xl p-3 text-xs text-amber-400">
              <p>💡 <span className="font-bold">Note:</span> The client needs to refresh their page to see feature changes.</p>
            </div>

            <Button 
              className="w-full bg-blue-600 hover:bg-blue-700 h-12 rounded-xl font-bold"
              onClick={() => handleUpdateFeatures(editingClient, editingClient.features)}
            >
              Save Feature Changes
            </Button>
          </div>
        </div>
      )}

      {/* Change Password Modal */}
      {editingPasswordFor && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 backdrop-blur-xl bg-black/60">
          <div className="max-w-md w-full bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl p-8 space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-xl font-black">Change Password</h2>
                <p className="text-slate-400 text-xs">Set new password for <span className="text-blue-400 font-mono">/{editingPasswordFor.slug}</span></p>
              </div>
              <button onClick={() => { setEditingPasswordFor(null); setNewPassword(""); }} className="p-2 hover:bg-slate-800 rounded-xl text-slate-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3">
              <div className="bg-slate-950 border border-slate-800 rounded-xl p-3">
                <p className="text-[10px] uppercase tracking-widest text-slate-500 font-bold mb-1">Current Password</p>
                <p className="font-mono text-sm text-amber-400">{editingPasswordFor.plainPassword || "Not available"}</p>
              </div>
              <div className="space-y-1">
                <Label className="text-xs uppercase tracking-widest text-slate-500 font-bold">New Password</Label>
                <Input
                  type="text"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="Enter new password (8+ chars, A-Z, a-z, 0-9)"
                  className="bg-slate-950 border-slate-800 rounded-xl"
                  onKeyDown={(e) => e.key === 'Enter' && handleChangePassword(editingPasswordFor)}
                />
              </div>
            </div>

            <Button
              className="w-full bg-amber-600 hover:bg-amber-700 h-12 rounded-xl font-bold"
              onClick={() => handleChangePassword(editingPasswordFor)}
              disabled={passwordLoading || !newPassword}
            >
              {passwordLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : <Lock className="w-4 h-4 mr-2" />}
              Update Password
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
