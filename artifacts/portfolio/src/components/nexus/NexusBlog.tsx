import { motion } from "framer-motion";
import { BookOpen, Plus, Trash2, ExternalLink } from "lucide-react";

export function NexusBlog({
  blogs,
  isAdmin,
  onDelete,
  onWritePost,
}: {
  blogs: { id: number; title: string; summary?: string; content: string; publishedAt: string }[];
  isAdmin: boolean;
  onDelete: (id: string) => void;
  onWritePost: () => void;
}) {
  return (
    <div className="nexus-blog">
      <div className="nexus-section-header">
        <div className="nexus-section-icon"><BookOpen className="w-5 h-5" /></div>
        <h2 className="nexus-section-title">Blog</h2>
        {isAdmin && (
          <button className="nexus-add-btn" onClick={onWritePost}><Plus className="w-4 h-4" /> Write Post</button>
        )}
      </div>
      <div className="nexus-blog-scroll">
        {blogs.map((blog, i) => (
          <motion.article
            key={blog.id}
            className="nexus-blog-card"
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-30px" }}
            transition={{ duration: 0.5, delay: i * 0.1 }}
            whileHover={{ y: -4 }}
          >
            <div className="nexus-blog-card-inner">
              <div className="nexus-blog-meta">
                <span className="nexus-blog-date">
                  {new Date(blog.publishedAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                </span>
                <span className="nexus-blog-read">
                  {Math.max(1, Math.ceil((blog.content?.length || 0) / 1000))} min read
                </span>
              </div>
              <h3 className="nexus-blog-title">{blog.title}</h3>
              {blog.summary && <p className="nexus-blog-summary">{blog.summary}</p>}
              <div className="nexus-blog-footer">
                <a href={`/blogs/${blog.id}`} className="nexus-blog-link">
                  Read more <ExternalLink className="w-3.5 h-3.5" />
                </a>
                {isAdmin && (
                  <button className="nexus-delete" onClick={() => onDelete(String(blog.id))}>
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          </motion.article>
        ))}
        {blogs.length === 0 && (
          <div className="nexus-blog-empty">
            <BookOpen className="w-10 h-10 opacity-20" />
            <p>No blog posts yet</p>
          </div>
        )}
      </div>
    </div>
  );
}
