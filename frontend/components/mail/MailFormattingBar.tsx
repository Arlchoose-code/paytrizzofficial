"use client";

import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  List,
  ListOrdered,
  Quote,
  Code,
  RotateCcw,
  RotateCw,
  RemoveFormatting,
} from "lucide-react";
import type { Editor } from "@tiptap/react";
import { cn } from "@/lib/utils";

interface MailFormattingBarProps {
  editor: Editor | null;
}

export function MailFormattingBar({ editor }: MailFormattingBarProps) {
  if (!editor) return null;

  return (
    <div className="px-3 py-1.5 bg-[#f9fafb] border-t border-neutral-200 flex items-center flex-wrap gap-0.5 text-neutral-700 text-xs select-none">
      {/* Undo / Redo */}
      <button
        type="button"
        onClick={() => editor.chain().focus().undo().run()}
        disabled={!editor.can().undo()}
        className="p-1.5 hover:bg-neutral-200/80 rounded transition-colors disabled:opacity-40"
        title="Urungkan (Ctrl+Z)"
      >
        <RotateCcw className="w-3.5 h-3.5" />
      </button>
      <button
        type="button"
        onClick={() => editor.chain().focus().redo().run()}
        disabled={!editor.can().redo()}
        className="p-1.5 hover:bg-neutral-200/80 rounded transition-colors disabled:opacity-40"
        title="Ulangi (Ctrl+Y)"
      >
        <RotateCw className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-neutral-300 mx-1" />

      {/* Bold */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBold().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors font-bold",
          editor.isActive("bold") && "bg-neutral-200 text-neutral-900 font-extrabold"
        )}
        title="Tebal (Ctrl+B)"
      >
        <Bold className="w-3.5 h-3.5" />
      </button>

      {/* Italic */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleItalic().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors italic",
          editor.isActive("italic") && "bg-neutral-200 text-neutral-900"
        )}
        title="Miring (Ctrl+I)"
      >
        <Italic className="w-3.5 h-3.5" />
      </button>

      {/* Underline */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleUnderline().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors underline",
          editor.isActive("underline") && "bg-neutral-200 text-neutral-900"
        )}
        title="Garis bawah (Ctrl+U)"
      >
        <UnderlineIcon className="w-3.5 h-3.5" />
      </button>

      {/* Strikethrough */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleStrike().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors",
          editor.isActive("strike") && "bg-neutral-200 text-neutral-900"
        )}
        title="Coret"
      >
        <Strikethrough className="w-3.5 h-3.5" />
      </button>

      <div className="w-[1px] h-4 bg-neutral-300 mx-1" />

      {/* Bullet List */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBulletList().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors",
          editor.isActive("bulletList") && "bg-neutral-200 text-neutral-900"
        )}
        title="Daftar bertanda"
      >
        <List className="w-3.5 h-3.5" />
      </button>

      {/* Ordered List */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleOrderedList().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors",
          editor.isActive("orderedList") && "bg-neutral-200 text-neutral-900"
        )}
        title="Daftar bernomor"
      >
        <ListOrdered className="w-3.5 h-3.5" />
      </button>

      {/* Quote */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleBlockquote().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors",
          editor.isActive("blockquote") && "bg-neutral-200 text-neutral-900"
        )}
        title="Kutipan"
      >
        <Quote className="w-3.5 h-3.5" />
      </button>

      {/* Code block */}
      <button
        type="button"
        onClick={() => editor.chain().focus().toggleCodeBlock().run()}
        className={cn(
          "p-1.5 hover:bg-neutral-200/80 rounded transition-colors",
          editor.isActive("codeBlock") && "bg-neutral-200 text-neutral-900"
        )}
        title="Blok kode"
      >
        <Code className="w-3.5 h-3.5" />
      </button>

      {/* Clear formatting */}
      <button
        type="button"
        onClick={() => editor.chain().focus().unsetAllMarks().clearNodes().run()}
        className="p-1.5 hover:bg-neutral-200/80 rounded transition-colors text-neutral-500 hover:text-neutral-900"
        title="Hapus format"
      >
        <RemoveFormatting className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}
