import { useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Check, Plus, ArrowLeft, Loader2, Globe, Lock, User, Bot, Compass, Target, FileText, Sparkles, BookOpen } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { apiFetch } from "@/lib/api";

export default function CreateClientForm() {
  const [, setLocation] = useLocation();
  const { toast } = useToast();
  
  const [formData, setFormData] = useState({
    name: "",
    slug: "",
    password: "",
    features: {
      cvImportExport: true,
      themeSelector: true,
      blogPage: true,
      aiChat: true,
      exploreAccess: false,
      aiMatchAccess: false
    }
  });
  const [loading, setLoading] = useState(false);
  const [successData, setSuccessData] = useState<{ slug: string; password: string } | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.name || !formData.slug || !formData.password) return;
    
    setLoading(true);
    try {
      const response = await apiFetch("/api/portfolio/create-client", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });

      const data = await response.json();
      if (response.ok) {
        setSuccessData({ slug: formData.slug, password: formData.password });
        toast({
          title: "Success!",
          description: `Client ${formData.name} has been created.`,
        });
      } else {
        toast({
          variant: "destructive",
          title: "Error",
          description: data.error || "Failed to create client.",
        });
      }
    } catch (err) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to connect to the server.",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSlugChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-');
    setFormData({ ...formData, slug: val });
  };

  const toggleFeature = (feature: keyof typeof formData.features) => {
    // Blog Page is now mandatory and cannot be disabled
    if (feature === 'blogPage') return;
    
    setFormData({
      ...formData,
      features: {
        ...formData.features,
        [feature]: !formData.features[feature]
      }
    });
  };

  if (successData) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center p-6 text-white">
        <Card className="max-w-md w-full bg-slate-900 border-slate-800 text-white shadow-2xl">
          <CardHeader className="text-center border-b border-slate-800 pb-6">
            <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4 border border-green-500/30">
              <Check className="w-8 h-8 text-green-400" />
            </div>
            <CardTitle className="text-2xl font-bold text-green-400">Client Created!</CardTitle>
            <CardDescription className="text-slate-400 mt-2">
              Share these credentials with the client.
            </CardDescription>
          </CardHeader>
          <CardContent className="py-8 space-y-6">
            <div className="bg-slate-950/50 p-4 rounded-xl border border-slate-800 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Portfolio URL</span>
                <a 
                  href={`/${successData.slug}`} 
                  target="_blank" 
                  rel="noreferrer"
                  className="text-sm font-mono text-blue-400 hover:underline flex items-center gap-1"
                >
                  /{successData.slug} <Globe className="w-3 h-3" />
                </a>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Login Slug</span>
                <span className="text-sm font-mono text-white">{successData.slug}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-slate-400">Temp Password</span>
                <span className="text-sm font-mono text-white bg-white/10 px-2 py-0.5 rounded">{successData.password}</span>
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex flex-col gap-3">
            <Button className="w-full bg-blue-600 hover:bg-blue-700 font-bold" onClick={() => setLocation("/")}>
              Go to Homepage
            </Button>
            <Button variant="ghost" className="w-full text-slate-400" onClick={() => setSuccessData(null)}>
              Create Another
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-6 text-white relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]" />

      <div className="w-full max-w-lg relative z-10">
        <Button 
          variant="ghost" 
          className="mb-8 text-slate-400 hover:text-white -ml-4"
          onClick={() => setLocation("/")}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Back to Portfolios
        </Button>

        <Card className="bg-slate-900 border-slate-800 text-white shadow-2xl overflow-hidden">
          <div className="h-1 w-full bg-gradient-to-r from-blue-600 via-purple-600 to-pink-600" />
          <CardHeader className="pt-8 px-8 pb-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 bg-blue-600/20 rounded-lg flex items-center justify-center border border-blue-500/30">
                <Plus className="w-6 h-6 text-blue-400" />
              </div>
              <CardTitle className="text-2xl font-bold tracking-tight">Setup New Client</CardTitle>
            </div>
            <CardDescription className="text-slate-400">
              Create a new portfolio apartment for a Zilk Co. student.
            </CardDescription>
          </CardHeader>
          <CardContent className="px-8 pb-8 pt-4">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="space-y-2">
                <Label htmlFor="name" className="text-slate-300">Full Name</Label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    id="name"
                    placeholder="e.g. Sarah Tech" 
                    className="bg-slate-950 border-slate-800 pl-10 focus:ring-blue-500 focus:border-blue-500"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug" className="text-slate-300">URL Slug</Label>
                <div className="relative">
                  <Globe className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    id="slug"
                    placeholder="e.g. sarah-tech" 
                    className="bg-slate-950 border-slate-800 pl-10 focus:ring-blue-500 focus:border-blue-500"
                    required
                    value={formData.slug}
                    onChange={handleSlugChange}
                  />
                </div>
                {formData.slug && (
                  <p className="text-xs text-slate-500 mt-1">
                    Your portfolio will be at: <span className="text-blue-400">zilkco.com/{formData.slug}</span>
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="password" className="text-slate-300">Admin Password</Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  <Input 
                    id="password"
                    type="password"
                    placeholder="••••••••" 
                    className="bg-slate-950 border-slate-800 pl-10 focus:ring-blue-500 focus:border-blue-500"
                    required
                    value={formData.password}
                    onChange={(e) => setFormData({...formData, password: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-slate-500">Provide a temporary password for the student.</p>
              </div>

              <div className="space-y-3 pt-2">
                <Label className="text-slate-300 text-sm font-semibold uppercase tracking-wider">Enabled Features</Label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {[
                    { id: 'cvImportExport', label: 'CV Import & Export', icon: FileText },
                    { id: 'themeSelector', label: 'Theme Selector', icon: Sparkles },
                    { id: 'blogPage', label: 'Blog Page', icon: BookOpen },
                    { id: 'aiChat', label: 'AI Chat Widget', icon: Bot },
                    { id: 'exploreAccess', label: 'Explore Page', icon: Compass },
                    { id: 'aiMatchAccess', label: 'AI Match', icon: Target },
                  ].map((feat) => {
                    const Icon = feat.icon;
                    const isEnabled = formData.features[feat.id as keyof typeof formData.features];
                    const isMandatory = feat.id === 'blogPage'; // Blog is now mandatory
                    return (
                      <div 
                        key={feat.id}
                        onClick={() => !isMandatory && toggleFeature(feat.id as keyof typeof formData.features)}
                        className={`flex items-center gap-3 p-3 rounded-xl border ${
                          isMandatory ? 'cursor-not-allowed' : 'cursor-pointer'
                        } transition-all ${
                          isEnabled 
                            ? 'bg-blue-600/10 border-blue-500/50 text-white' 
                            : 'bg-slate-950 border-slate-800 text-slate-500 opacity-60'
                        }`}
                        title={isMandatory ? "Blog feature is mandatory in all plans" : ""}
                      >
                        <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${isEnabled ? 'bg-blue-600/20' : 'bg-slate-900'}`}>
                          <Icon className={`w-4 h-4 ${isEnabled ? 'text-blue-400' : 'text-slate-600'}`} />
                        </div>
                        <span className="text-xs font-medium">{feat.label}{isMandatory ? ' (Mandatory)' : ''}</span>
                        {isEnabled && <Check className="w-3 h-3 ml-auto text-blue-400" />}
                      </div>
                    );
                  })}
                </div>
              </div>

              <Button 
                type="submit" 
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold h-11 transition-all"
                disabled={loading}
              >
                {loading ? (
                  <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Provisioning Apartment...</>
                ) : (
                  "Create Portfolio Apartment"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        <p className="mt-8 text-center text-slate-500 text-xs">
          &copy; 2026 Zilk Co. Managed Portfolio SaaS. All rights reserved.
        </p>
      </div>
    </div>
  );
}
