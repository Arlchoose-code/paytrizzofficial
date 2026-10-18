"use client";

import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import {
  Bold,
  Italic,
  Strikethrough,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  Quote,
  Minus,
  Undo,
  Redo,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface RichTextEditorProps {
  content: string;
  onChange: (html: string) => void;
  placeholder?: string;
  minHeight?: string;
}

export function RichTextEditor({
  content,
  onChange,
  placeholder = "Write your content here...",
  minHeight = "220px",
}: RichTextEditorProps) {
  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        heading: {
          levels: [2, 3],
        },
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      onChange(editor.getHTML());
    },
    editorProps: {
      attributes: {
        placeholder,
        class: cn(
          "prose prose-sm max-w-none focus:outline-none p-4 text-ink-900 leading-relaxed",
          `min-h-[${minHeight}]`
        ),
      },
    },
  });

  // Sync external content update if changed outside
  useEffect(() => {
    if (editor && content !== editor.getHTML()) {
      editor.commands.setContent(content, { emitUpdate: false });
    }
  }, [content, editor]);

  if (!editor) {
    return (
      <div className="w-full h-48 border border-ink-200 rounded-2xl bg-ink-50/50 animate-pulse flex items-center justify-center text-xs text-ink-400">
        Loading editor...
      </div>
    );
  }

  return (
    <div className="w-full border border-ink-200 rounded-2xl overflow-hidden bg-white shadow-xs focus-within:border-ink-900 transition-colors">
      {/* Toolbar */}
      <div className="flex flex-wrap items-center gap-1 p-2 bg-ink-50 border-b border-ink-200 text-ink-700">
        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBold().run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("bold") ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Bold"
        >
          <Bold className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleItalic().run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("italic") ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Italic"
        >
          <Italic className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleStrike().run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("strike") ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Strikethrough"
        >
          <Strikethrough className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-ink-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("heading", { level: 2 }) ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Heading 2"
        >
          <Heading2 className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("heading", { level: 3 }) ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Heading 3"
        >
          <Heading3 className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-ink-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBulletList().run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("bulletList") ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Bullet List"
        >
          <List className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleOrderedList().run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("orderedList") ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Numbered List"
        >
          <ListOrdered className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().toggleBlockquote().run()}
          className={cn(
            "p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors",
            editor.isActive("blockquote") ? "bg-brand-500 text-ink-900 font-bold" : ""
          )}
          title="Quote"
        >
          <Quote className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().setHorizontalRule().run()}
          className="p-1.5 rounded-lg text-xs font-semibold hover:bg-ink-200 transition-colors"
          title="Horizontal Rule"
        >
          <Minus className="w-4 h-4" />
        </button>

        <div className="w-px h-4 bg-ink-300 mx-1" />

        <button
          type="button"
          onClick={() => editor.chain().focus().undo().run()}
          disabled={!editor.can().undo()}
          className="p-1.5 rounded-lg text-xs text-ink-600 hover:bg-ink-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Undo"
        >
          <Undo className="w-4 h-4" />
        </button>

        <button
          type="button"
          onClick={() => editor.chain().focus().redo().run()}
          disabled={!editor.can().redo()}
          className="p-1.5 rounded-lg text-xs text-ink-600 hover:bg-ink-200 disabled:opacity-30 disabled:pointer-events-none transition-colors"
          title="Redo"
        >
          <Redo className="w-4 h-4" />
        </button>
      </div>

      {/* Editor Surface */}
      <div style={{ minHeight }} className="cursor-text bg-white">
        <EditorContent editor={editor} />
      </div>
    </div>
  );
}
