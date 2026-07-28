import { useState, useCallback, useEffect } from "react";
import { Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  useGetPortfolio,
  useAddBlog,
  useUpdateBlog,
  useDeleteBlog,
  getGetPortfolioQueryKey,
} from "@workspace/api-client-react";
import type { Blog } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { RichTextEditor, RichTextDisplay } from "@/components/RichTextEditor";
import { ArrowLeft, Plus, Pencil, Trash2, ChevronUp, ChevronDown, Loader2, BookOpen, CalendarDays } from "lucide-react";

export default function BlogsPage() {
  const qc = useQueryClient();
  const { data: portfolio, isLoading } = useGetPortfolio();
  const addBlog = useAddBlog();
  const updateBlog = useUpdateBlog();
  const deleteBlog = useDeleteBlog();

  // Admin check: user has a password AND owns this portfolio
  const [isAdmin, setIsAdmin] = useState(false);
  
  useEffect(() => {
    if (portfolio) {
      const token = localStorage.getItem("portfolio_token");
      const password = localStorage.getItem("portfolio_password");
      const storedSlug = localStorage.getItem("portfolio_slug");
      const isOwner = storedSlug === portfolio.slug;
      const hasAuth = !!(token || (password && password.length > 0));
      setIsAdmin(isOwner && hasAuth);
    }
  }, [portfolio]);

  const [showDialog, setShowDialog] = useState(false);
  const [editingBlog, setEditingBlog] = useState<Blog | null>(null);
  const [blogTitle, setBlogTitle] = useState("");
  const [blogSummary, setBlogSummary] = useState("");
  const [blogContent, setBlogContent] = useState("");
  const [deletingBlogId, setDeletingBlogId] = useState<number | null>(null);

  const invalidate = useCallback(() => qc.invalidateQueries({ queryKey: getGetPortfolioQueryKey() }), [qc]);

  const openAdd = () => {
    setEditingBlog(null);
    setBlogTitle("");
    setBlogSummary("");
    setBlogContent("");
    setShowDialog(true);
  };

  const openEdit = (blog: Blog) => {
    setEditingBlog(blog);
    setBlogTitle(blog.title);
    setBlogSummary(blog.summary || "");
    setBlogContent(blog.content);
    setShowDialog(true);
  };

  const moveUp = async (idx: number, blogs: Blog[]) => {
    if (idx === 0) return;
    const a = blogs[idx - 1];
    const b = blogs[idx];
    await Promise.all([
      updateBlog.mutateAsync({ id: a.id, data: { orderIndex: b.orderIndex } }),
      updateBlog.mutateAsync({ id: b.id, data: { orderIndex: a.orderIndex } }),
    ]);
    invalidate();
  };

  const moveDown = async (idx: number, blogs: Blog[]) => {
    if (idx === blogs.length - 1) return;
    const a = blogs[idx];
    const b = blogs[idx + 1];
    await Promise.all([
      updateBlog.mutateAsync({ id: a.id, data: { orderIndex: b.orderIndex } }),
      updateBlog.mutateAsync({ id: b.id, data: { orderIndex: a.orderIndex } }),
    ]);
    invalidate();
  };

  if (isLoading) return (
    <div className="portfolio-root theme-orbital min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary" />
    </div>
  );

  const theme = portfolio?.theme || "orbital";
  const blogs = portfolio?.blogs || [];

  return (
    <div className={`portfolio-root theme-${theme} min-h-screen`}>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="mb-12">
          <Button variant="ghost" size="sm" className="gap-2 mb-4" onClick={() => window.history.back()}>
            <ArrowLeft className="w-4 h-4" />
            Back to Portfolio
          </Button>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <BookOpen className="w-8 h-8 text-primary" />
              <h1 className="text-4xl font-bold section-heading" style={{ border: "none", paddingBottom: 0 }}>
                Blog Posts
              </h1>
            </div>
            {isAdmin && (
              <Button onClick={openAdd} className="gap-2 h-10">
                <Plus className="w-4 h-4" /> Write Post
              </Button>
            )}
          </div>
        </div>

        {blogs.length === 0 && (
          <div className="text-center py-20 text-muted-foreground">
            <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
            <p>No blog posts yet.</p>
          </div>
        )}

        <div className="space-y-6">
          {blogs.map((blog, idx) => (
            <article key={blog.id} className="section-card p-6 rounded-xl">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground mb-2">
                    <CalendarDays className="w-3 h-3" />
                    {new Date(blog.publishedAt).toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}
                  </div>
                  <h2 className="text-2xl font-bold mb-2">{blog.title}</h2>
                  {blog.summary && <p className="text-muted-foreground mb-4 text-base italic">{blog.summary}</p>}
                  <div className="mt-3">
                    <RichTextDisplay html={blog.content} />
                  </div>
                </div>
                {isAdmin && (
                  <div className="flex flex-col gap-1 ml-4 flex-shrink-0">
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === 0} onClick={() => moveUp(idx, blogs)}>
                      <ChevronUp className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" disabled={idx === blogs.length - 1} onClick={() => moveDown(idx, blogs)}>
                      <ChevronDown className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => openEdit(blog)}>
                      <Pencil className="w-3 h-3" />
                    </Button>
                    <Button size="icon" variant="ghost" className="h-7 w-7 text-destructive" onClick={() => setDeletingBlogId(blog.id)}>
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                )}
              </div>
            </article>
          ))}
        </div>
      </div>

      <Dialog open={showDialog} onOpenChange={(o) => { if (!o) { setShowDialog(false); setEditingBlog(null); } }}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader><DialogTitle>{editingBlog ? "Edit Blog Post" : "Write New Blog Post"}</DialogTitle></DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium block mb-1">Post Title *</label>
              <Input value={blogTitle} onChange={(e) => setBlogTitle(e.target.value)} placeholder="What's this post about?" className="text-base" />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">One-line Summary (shown in preview)</label>
              <Input value={blogSummary} onChange={(e) => setBlogSummary(e.target.value)} placeholder="A short description for the main page..." />
            </div>
            <div>
              <label className="text-sm font-medium block mb-1">Full Content *</label>
              <RichTextEditor content={blogContent} onChange={setBlogContent} placeholder="Share your experience, what you did, how you accomplished it..." minHeight="250px" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setShowDialog(false); setEditingBlog(null); }}>Cancel</Button>
            <Button
              disabled={!blogTitle || !blogContent}
              onClick={async () => {
                if (editingBlog) {
                  await updateBlog.mutateAsync({ id: editingBlog.id, data: { title: blogTitle, summary: blogSummary, content: blogContent } });
                } else {
                  await addBlog.mutateAsync({ data: { title: blogTitle, summary: blogSummary, content: blogContent } });
                }
                setShowDialog(false);
                setEditingBlog(null);
                invalidate();
              }}
            >Publish Post</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deletingBlogId !== null} onOpenChange={(open) => { if (!open) setDeletingBlogId(null); }}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Blog Post?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete this blog post and remove it from your portfolio.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={async () => {
                if (deletingBlogId) {
                  await deleteBlog.mutateAsync({ id: String(deletingBlogId) });
                  setDeletingBlogId(null);
                  invalidate();
                }
              }}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

