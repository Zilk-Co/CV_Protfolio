import { useState, useEffect, useMemo, useRef, useCallback } from "react";
import { Link } from "wouter";
import { apiFetch } from "@/lib/api";
import { useGetPortfolio } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import {
  Users, BookOpen, Search, Loader2, MapPin, Briefcase, Sparkles, Mail, ArrowLeft,
  MessageSquare, Send, Bot, User as UserIcon, X, Lock, User
} from "lucide-react";
import Markdown from "react-markdown";
import remarkGfm from "remark-gfm";

export default function ExplorePage() {

  // Auth state — explore requires login every visit (no persistence)
  const [token, setToken] = useState<string | null>(null);
  const [slug, setSlug] = useState<string>("default");
  const [loginUsername, setLoginUsername] = useState("");
  const [loginPassword, setLoginPassword] = useState("");
  const [loginError, setLoginError] = useState("");
  const [loginLoading, setLoginLoading] = useState(false);

  // All remaining hooks MUST be declared before any early return
  const { data: portfolio } = useGetPortfolio({
    query: { queryKey: ["portfolio", slug], enabled: !!token }
  });

  const hasExploreAccess = (portfolio as any)?.features?.exploreAccess === true;
  const hasAiMatchAccess = (portfolio as any)?.features?.aiMatchAccess === true;

  const [searchTerm, setSearchTerm] = useState("");
  const [activeTab, setActiveTab] = useState<"profiles" | "blogs" | "ai-match">("profiles");
  const [profiles, setProfiles] = useState<any[]>([]);
  const [blogs, setBlogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  // AI Chat state
  const [aiMessages, setAiMessages] = useState<Array<{ role: "user" | "assistant"; content: string }>>([]);
  const [aiInput, setAiInput] = useState("");
  const [aiLoading, setAiLoading] = useState(false);
  const aiChatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!token) return;
    const fetchData = async () => {
      setLoading(true);
      try {
        const response = await apiFetch("/api/portfolio/explore", {
          headers: {
            "x-portfolio-slug": slug,
            Authorization: `Bearer ${token}`,
          },
        });
        if (response.status === 401) {
          setToken(null);
          return;
        }
        if (response.ok) {
          const data = await response.json();
          setProfiles(data.profiles || []);
          setBlogs(data.blogs || []);
        }
      } catch (e) {
        console.error("Failed to fetch explore data:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [slug, token]);

  const filteredProfiles = useMemo(() => {
    if (!profiles) return [];
    const terms = searchTerm.trim().toLowerCase().split(/\s+/).filter(Boolean);

    let filtered = profiles.filter(p => {
      if (p.slug === slug) return false;
      if (terms.length === 0) return true;

      const searchable = [
        p.name, p.title, p.location, p.about, p.email,
        ...(p.skills || []).map((s: any) => `${s.name} ${s.category}`),
        ...(p.experience || []).map((e: any) => `${e.role} ${e.company} ${e.description}`),
        ...(p.education || []).map((e: any) => `${e.degree} ${e.field} ${e.institution}`),
        ...(p.certifications || []).map((c: any) => `${c.name} ${c.issuer}`),
      ].filter(Boolean).join(" ").toLowerCase();

      return terms.every(term => searchable.includes(term));
    });

    filtered = filtered.map(p => {
      let score = 0;
      if (portfolio?.title && p.title && portfolio.title.toLowerCase() === p.title.toLowerCase()) score += 100;
      const userSkillsSet = new Set((portfolio?.skills || []).map((s: any) => s.name?.toLowerCase()));
      const matchingSkills = (p.skills || []).filter((s: any) => userSkillsSet.has(s.name?.toLowerCase())).length;
      score += matchingSkills * 10;
      return { ...p, matchScore: score };
    });

    return filtered.sort((a, b) => (b.matchScore || 0) - (a.matchScore || 0));
  }, [profiles, searchTerm, portfolio, slug]);

  const filteredBlogs = useMemo(() => {
    if (!blogs) return [];
    return blogs.filter(b =>
      (searchTerm === "" ||
       b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       b.summary?.toLowerCase().includes(searchTerm.toLowerCase()) ||
       b.author?.toLowerCase().includes(searchTerm.toLowerCase()))
    ).sort((a, b) => new Date(b.createdAt || 0).getTime() - new Date(a.createdAt || 0).getTime());
  }, [blogs, searchTerm]);

  const scrollToAiBottom = useCallback(() => {
    aiChatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  useEffect(() => { scrollToAiBottom(); }, [aiMessages, scrollToAiBottom]);

  const sendAiMessage = useCallback(async () => {
    const msg = aiInput.trim();
    if (!msg || aiLoading) return;

    const userMessage = { role: "user" as const, content: msg };
    setAiMessages(prev => [...prev, userMessage]);
    setAiInput("");
    setAiLoading(true);

    try {
      const res = await apiFetch("/api/portfolio/explore/match", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ jobDescription: msg }),
      });

      if (!res.ok) {
        setAiMessages(prev => [...prev, { role: "assistant", content: "Sorry, I couldn't process that request. Please try again." }]);
        setAiLoading(false);
        return;
      }

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";

      setAiMessages(prev => [...prev, { role: "assistant", content: "" }]);

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split("\n");
          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const data = JSON.parse(line.slice(6));
                if (data.content) {
                  assistantContent += data.content;
                  setAiMessages(prev => {
                    const updated = [...prev];
                    updated[updated.length - 1] = { role: "assistant", content: assistantContent };
                    return updated;
                  });
                }
              } catch {}
            }
          }
        }
      }
    } catch {
      setAiMessages(prev => [...prev, { role: "assistant", content: "Network error. Please try again." }]);
    }
    setAiLoading(false);
  }, [aiInput, aiLoading, token]);

  const handleExploreLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!loginUsername || !loginPassword) { setLoginError("Enter username and password"); return; }
    setLoginLoading(true);
    setLoginError("");
    try {
      const res = await apiFetch("/api/portfolio/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: loginUsername, password: loginPassword }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Login failed");
      setSlug(data.slug);
      setToken(data.token);
    } catch (err: any) {
      setLoginError(err.message || "Invalid credentials");
    } finally {
      setLoginLoading(false);
    }
  };

  // Not logged in — show login form (no hooks after this point)
  if (!token) {
    return (
      <div className="portfolio-root min-h-screen pt-16 pb-8 flex items-center justify-center">
        <div className="max-w-md w-full mx-4">
          <div className="section-card rounded-2xl p-8">
            <div className="text-center mb-6">
              <div className="w-14 h-14 rounded-xl bg-primary/10 flex items-center justify-center mx-auto mb-4">
                <Lock className="w-7 h-7 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Explore Access</h1>
              <p className="text-muted-foreground text-sm mt-1">Sign in with your portfolio account to explore the community</p>
            </div>
            <form onSubmit={handleExploreLogin} className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Username</label>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input className="pl-9" placeholder="Your login username" value={loginUsername} onChange={(e) => setLoginUsername(e.target.value)} autoFocus />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" className="pl-9" placeholder="Your password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)} />
                </div>
              </div>
              {loginError && <p className="text-sm text-destructive font-medium">{loginError}</p>}
              <Button type="submit" className="w-full" disabled={loginLoading}>
                {loginLoading ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
                {loginLoading ? "Signing in..." : "Sign in to Explore"}
              </Button>
            </form>
            <Button variant="ghost" className="w-full mt-2 text-muted-foreground" onClick={() => window.history.back()}>← Go back</Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="portfolio-root min-h-screen pt-16 pb-8">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        {/* Access Denied */}
        {hasExploreAccess === false && portfolio && (
          <div className="text-center py-24">
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mx-auto mb-4">
              <Lock className="w-8 h-8 text-muted-foreground" />
            </div>
            <h2 className="text-2xl font-bold mb-2">Access Restricted</h2>
            <p className="text-muted-foreground mb-6">You don't have permission to access the Explore page. Contact the admin to enable this feature.</p>
            <Button variant="outline" onClick={() => window.history.back()}>Go Back</Button>
          </div>
        )}

        {/* Header */}
        {hasExploreAccess !== false && (
        <>
        <div className="mb-8">
          <Button variant="ghost" size="sm" className="gap-2 mb-4" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back
          </Button>
          <h1 className="text-4xl font-bold mb-2 flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-primary" />
            Explore
          </h1>
          <p className="text-muted-foreground">Discover portfolios and insights from the community</p>
        </div>

        {/* Search */}
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-3 w-5 h-5 text-muted-foreground" />
          <Input
            placeholder="Search by name, title, skills, experience, or keywords (e.g. 'ACCA teacher')"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
          {searchTerm && (
            <button onClick={() => setSearchTerm("")} className="absolute right-3 top-3 text-muted-foreground hover:text-foreground">
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "profiles" | "blogs" | "ai-match")} className="w-full">
          <TabsList className={`grid w-full mb-6 grid-cols-2 ${hasAiMatchAccess ? 'sm:grid-cols-3' : ''}`}>
            <TabsTrigger value="profiles" className="gap-2">
              <Users className="w-4 h-4" />
              Profiles ({filteredProfiles.length})
            </TabsTrigger>
            <TabsTrigger value="blogs" className="gap-2">
              <BookOpen className="w-4 h-4" />
              Blogs ({filteredBlogs.length})
            </TabsTrigger>
            {hasAiMatchAccess && (
              <TabsTrigger value="ai-match" className="gap-2">
                <Bot className="w-4 h-4" />
                AI Match
              </TabsTrigger>
            )}
          </TabsList>

          {/* Profiles Tab */}
          <TabsContent value="profiles" className="space-y-4">
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
            {!loading && filteredProfiles.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No profiles found matching your search</p>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredProfiles.map((profile) => (
                <Link key={profile.slug} href={`/${profile.slug}`}>
                  <div className="section-card p-5 rounded-xl cursor-pointer hover:shadow-lg transition-shadow h-full relative">
                    <div className="absolute top-3 right-3">
                      {profile.employmentStatus === "hiring" && (
                        <div className="px-3 py-1 bg-green-500/20 border border-green-500/50 rounded-full text-xs font-semibold text-green-600 dark:text-green-400">
                          🔥 Hiring
                        </div>
                      )}
                      {profile.employmentStatus === "available" && (
                        <div className="px-3 py-1 bg-blue-500/20 border border-blue-500/50 rounded-full text-xs font-semibold text-blue-600 dark:text-blue-400">
                          ✓ Available
                        </div>
                      )}
                      {profile.employmentStatus === "open" && (
                        <div className="px-3 py-1 bg-purple-500/20 border border-purple-500/50 rounded-full text-xs font-semibold text-purple-600 dark:text-purple-400">
                          👋 Open to Opportunities
                        </div>
                      )}
                      {profile.employmentStatus === "employed" && (
                        <div className="px-3 py-1 bg-gray-500/20 border border-gray-500/50 rounded-full text-xs font-semibold text-gray-600 dark:text-gray-400">
                          💼 Currently Employed
                        </div>
                      )}
                    </div>
                    <div className="flex gap-4">
                      {profile.photoUrl && (
                        <img src={profile.photoUrl} alt={profile.name} className="w-16 h-16 rounded-lg object-cover flex-shrink-0" />
                      )}
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg truncate">{profile.name}</h3>
                        {profile.title && <p className="text-primary font-medium text-sm">{profile.title}</p>}
                        {profile.email && <p className="text-xs text-muted-foreground flex items-center gap-1"><Mail className="w-3 h-3" />{profile.email}</p>}
                        {profile.location && <p className="text-xs text-muted-foreground flex items-center gap-1"><MapPin className="w-3 h-3" />{profile.location}</p>}
                      </div>
                    </div>
                    {profile.about && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">{profile.about.replace(/<[^>]*>/g, "")}</p>
                    )}
                    {profile.skills && profile.skills.length > 0 && (
                      <div className="flex flex-wrap gap-2 mt-3">
                        {profile.skills.slice(0, 3).map((skill: any, i: number) => (
                          <Badge key={i} variant="secondary" className="text-xs">{skill.name}</Badge>
                        ))}
                        {profile.skills.length > 3 && <Badge variant="secondary" className="text-xs">+{profile.skills.length - 3}</Badge>}
                      </div>
                    )}
                    {profile.experience && profile.experience.length > 0 && (
                      <div className="mt-3 text-xs text-muted-foreground">
                        <Briefcase className="w-3 h-3 inline mr-1" />
                        {profile.experience.length} position{profile.experience.length !== 1 ? "s" : ""}
                      </div>
                    )}
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* Blogs Tab */}
          <TabsContent value="blogs" className="space-y-4">
            {loading && <div className="flex justify-center py-12"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>}
            {!loading && filteredBlogs.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <BookOpen className="w-12 h-12 mx-auto mb-4 opacity-50" />
                <p>No blog posts found matching your search</p>
              </div>
            )}
            <div className="space-y-4">
              {filteredBlogs.map((blog) => (
                <Link key={blog.id} href={`/${blog.portfolioSlug}/blogs#${blog.id}`}>
                  <div className="section-card p-5 rounded-xl cursor-pointer hover:shadow-lg transition-shadow">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <h3 className="font-bold text-lg mb-1">{blog.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">{blog.summary || blog.content?.replace(/<[^>]*>/g, "").slice(0, 150)}</p>
                        <div className="flex items-center gap-4 text-xs text-muted-foreground">
                          <span>By {blog.author}</span>
                          <span>{new Date(blog.createdAt).toLocaleDateString()}</span>
                        </div>
                      </div>
                      {blog.coverImage && (
                        <img src={blog.coverImage} alt={blog.title} className="w-24 h-24 rounded object-cover flex-shrink-0" />
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </TabsContent>

          {/* AI Match Tab */}
          <TabsContent value="ai-match" className="space-y-4">
            <div className="section-card rounded-xl overflow-hidden">
              {/* AI Chat header */}
              <div className="p-4 border-b flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h3 className="font-bold">AI Recruitment Assistant</h3>
                  <p className="text-xs text-muted-foreground">Paste a job description to find matching candidates</p>
                </div>
              </div>

              {/* Messages */}
              <div className="h-[60vh] max-h-[400px] overflow-y-auto p-4 space-y-4">
                {aiMessages.length === 0 && (
                  <div className="text-center py-12 text-muted-foreground">
                    <Bot className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="font-medium mb-1">Paste a job description below</p>
                    <p className="text-sm">I'll analyze all profiles and find the best matches for the role</p>
                    <div className="flex flex-wrap justify-center gap-2 mt-4">
                      {["Looking for a Python developer with 3 years experience", "Need an ACCA-certified accountant", "Seeking a project manager with PMP certification"].map((suggestion) => (
                        <button
                          key={suggestion}
                          onClick={() => { setAiInput(suggestion); }}
                          className="text-xs px-3 py-1.5 rounded-full border border-primary/30 text-primary hover:bg-primary/10 transition-colors"
                        >
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {aiMessages.map((msg, i) => (
                  <div key={i} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "assistant" && (
                      <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-4 h-4 text-primary" />
                      </div>
                    )}
                    <div className={`max-w-[80%] rounded-xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-primary text-primary-foreground"
                        : "bg-muted prose prose-sm dark:prose-invert max-w-none"
                    }`}>
                      {msg.role === "user" ? (
                        msg.content
                      ) : msg.content ? (
                        <Markdown remarkPlugins={[remarkGfm]}>{msg.content}</Markdown>
                      ) : (aiLoading && i === aiMessages.length - 1 ? (
                        <div className="flex items-center gap-1.5 py-1">
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "0ms" }} />
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "150ms" }} />
                          <span className="w-2 h-2 rounded-full bg-primary/60 animate-bounce" style={{ animationDelay: "300ms" }} />
                        </div>
                      ) : null)}
                    </div>
                    {msg.role === "user" && (
                      <div className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center flex-shrink-0">
                        <UserIcon className="w-4 h-4" />
                      </div>
                    )}
                  </div>
                ))}
                <div ref={aiChatEndRef} />
              </div>

              {/* Input */}
              <div className="p-4 border-t">
                <div className="flex gap-2">
                  <Input
                    value={aiInput}
                    onChange={(e) => setAiInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter" && !e.shiftKey) { e.preventDefault(); sendAiMessage(); } }}
                    placeholder="Paste a job description or describe the ideal candidate..."
                    disabled={aiLoading}
                  />
                  <Button onClick={sendAiMessage} disabled={!aiInput.trim() || aiLoading} size="icon">
                    {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        </>
        )}
      </div>
    </div>
  );
}
