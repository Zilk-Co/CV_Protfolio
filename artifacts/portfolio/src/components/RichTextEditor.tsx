import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Underline from "@tiptap/extension-underline";
import { Bold, Italic, UnderlineIcon, List, ListOrdered, Heading2, Minus, Undo, Redo } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useEffect } from "react";
import DOMPurify from "dompurify";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({ content, onChange, placeholder = "Write something...", minHeight = "150px" }: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Underline,
    ],
    content,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        class: "prose prose-sm prose-invert max-w-none focus:outline-none p-3 min-h-[inherit]",
        style: `min-height: ${minHeight}`,
      },
    },
  });

  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content);
    }
  }, [content]);

  if (!editor) return null;

  const btnClass = (active: boolean) =>
    `h-7 w-7 p-0 rounded hover:bg-muted transition-colors ${active ? "bg-muted text-foreground" : "text-muted-foreground"}`;

  return (
    <div className="border border-input rounded-lg overflow-hidden bg-background text-foreground">
      <div className="flex flex-wrap items-center gap-0.5 px-2 py-1.5 border-b border-input bg-muted/30">
        <button type="button" className={btnClass(editor.isActive("bold"))} onClick={() => editor.chain().focus().toggleBold().run()} title="Bold">
          <Bold className="w-3.5 h-3.5 mx-auto" />
        </button>
        <button type="button" className={btnClass(editor.isActive("italic"))} onClick={() => editor.chain().focus().toggleItalic().run()} title="Italic">
          <Italic className="w-3.5 h-3.5 mx-auto" />
        </button>
        <button type="button" className={btnClass(editor.isActive("underline"))} onClick={() => editor.chain().focus().toggleUnderline().run()} title="Underline">
          <UnderlineIcon className="w-3.5 h-3.5 mx-auto" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button type="button" className={btnClass(editor.isActive("heading", { level: 2 }))} onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()} title="Heading">
          <Heading2 className="w-3.5 h-3.5 mx-auto" />
        </button>
        <button type="button" className={btnClass(editor.isActive("bulletList"))} onClick={() => editor.chain().focus().toggleBulletList().run()} title="Bullet list">
          <List className="w-3.5 h-3.5 mx-auto" />
        </button>
        <button type="button" className={btnClass(editor.isActive("orderedList"))} onClick={() => editor.chain().focus().toggleOrderedList().run()} title="Numbered list">
          <ListOrdered className="w-3.5 h-3.5 mx-auto" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button type="button" className={btnClass(false)} onClick={() => editor.chain().focus().setHorizontalRule().run()} title="Divider">
          <Minus className="w-3.5 h-3.5 mx-auto" />
        </button>
        <div className="w-px h-4 bg-border mx-0.5" />
        <button type="button" className={btnClass(false)} onClick={() => editor.chain().focus().undo().run()} disabled={!editor.can().undo()} title="Undo">
          <Undo className="w-3.5 h-3.5 mx-auto" />
        </button>
        <button type="button" className={btnClass(false)} onClick={() => editor.chain().focus().redo().run()} disabled={!editor.can().redo()} title="Redo">
          <Redo className="w-3.5 h-3.5 mx-auto" />
        </button>
      </div>
      <EditorContent editor={editor} />
    </div>
  );
}

export function RichTextDisplay({ html = "", className = "" }: { html?: string | null; className?: string }) {
  const rawHtml = html || "";
  const isHtml = rawHtml.includes("<");
  if (!isHtml) return <p className={`text-sm leading-relaxed opacity-90 whitespace-pre-wrap ${className}`}>{rawHtml}</p>;
  const safeHtml = DOMPurify.sanitize(rawHtml, { ALLOWED_TAGS: ["p", "br", "strong", "em", "u", "s", "h1", "h2", "h3", "ul", "ol", "li", "a", "hr", "blockquote", "code", "pre", "img"], ALLOWED_ATTR: ["href", "src", "alt", "class", "target", "rel"] });
  return <div className={`prose prose-sm max-w-none ${className}`} dangerouslySetInnerHTML={{ __html: safeHtml }} />;
}
