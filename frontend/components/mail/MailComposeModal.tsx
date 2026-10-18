"use client";

import { useState, useRef } from "react";
import {
  X,
  Clock,
  Minus,
  Maximize2,
  Minimize2,
} from "lucide-react";
import { useEditor, EditorContent } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Link from "@tiptap/extension-link";
import Underline from "@tiptap/extension-underline";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MailRecipientFields } from "./MailRecipientFields";
import { MailFormattingBar } from "./MailFormattingBar";
import { MailBottomBar } from "./MailBottomBar";
import { MailLinkModal } from "./MailLinkModal";
import { MailComposeMinimized } from "./MailComposeMinimized";
import { MailComposeAttachments, type AttachmentItem } from "./MailComposeAttachments";
import {
  parseInitialAddresses,
  handleKeyDownChip,
  handleBlurChip,
  handlePasteChip,
  parseFinalAddresses,
} from "./mailChipHelpers";

export type { AttachmentItem };

export interface MailboxItem {
  id: number;
  address: string;
  display_name: string;
  color: string;
}

interface MailComposeModalProps {
  mailboxes: MailboxItem[];
  defaultMailboxId?: number;
  initialDraftId?: number;
  initialTo?: string;
  initialCc?: string;
  initialBcc?: string;
  initialSubject?: string;
  initialBody?: string;
  initialBodyHtml?: string;
  initialInReplyTo?: string;
  initialReferences?: string;
  initialAttachments?: AttachmentItem[];
  onClose: () => void;
  onSent: (msgId: number, canUndo: boolean) => void;
}

export function MailComposeModal({
  mailboxes,
  defaultMailboxId,
  initialDraftId,
  initialTo = "",
  initialCc = "",
  initialBcc = "",
  initialSubject = "",
  initialBody = "",
  initialBodyHtml = "",
  initialInReplyTo,
  initialReferences,
  initialAttachments = [],
  onClose,
  onSent,
}: MailComposeModalProps) {
  // Window Docking State: 'dock' (normal floating bottom-right) | 'minimized' | 'expanded' (full size)
  const [windowMode, setWindowMode] = useState<"dock" | "minimized" | "expanded">("dock");

  const [draftId, setDraftId] = useState<number | undefined>(initialDraftId);
  const [selectedMailboxId, setSelectedMailboxId] = useState<number>(
    defaultMailboxId || (mailboxes.length > 0 ? mailboxes[0].id : 0)
  );

  const [toChips, setToChips] = useState<string[]>(parseInitialAddresses(initialTo));
  const [toInput, setToInput] = useState("");

  const [ccChips, setCcChips] = useState<string[]>(parseInitialAddresses(initialCc));
  const [ccInput, setCcInput] = useState("");
  const [showCc, setShowCc] = useState(Boolean(initialCc) || parseInitialAddresses(initialCc).length > 0);

  const [bccChips, setBccChips] = useState<string[]>(parseInitialAddresses(initialBcc));
  const [bccInput, setBccInput] = useState("");
  const [showBcc, setShowBcc] = useState(Boolean(initialBcc) || parseInitialAddresses(initialBcc).length > 0);

  const [subject, setSubject] = useState(initialSubject);
  const [attachments, setAttachments] = useState<AttachmentItem[]>(initialAttachments);
  const [uploading, setUploading] = useState(false);
  const [sending, setSending] = useState(false);

  // Formatting toolbar toggle (Aa)
  const [showToolbar, setShowToolbar] = useState(true);

  // Schedule send state
  const [isScheduled, setIsScheduled] = useState(false);
  const [scheduledDate, setScheduledDate] = useState("");
  const [showScheduleDropdown, setShowScheduleDropdown] = useState(false);

  // Link dialog modal state
  const [showLinkModal, setShowLinkModal] = useState(false);
  const [linkText, setLinkText] = useState("");
  const [linkUrl, setLinkUrl] = useState("");

  // Emoji picker popup state
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const imageInputRef = useRef<HTMLInputElement>(null);
  const toInputRef = useRef<HTMLInputElement>(null);
  const ccInputRef = useRef<HTMLInputElement>(null);
  const bccInputRef = useRef<HTMLInputElement>(null);

  // TipTap Rich Editor initialization
  const initialContent = initialBodyHtml
    ? initialBodyHtml
    : initialBody
    ? `<p>${initialBody.replace(/\n/g, "<br/>")}</p>`
    : "<p></p>";

  const editor = useEditor({
    extensions: [
      StarterKit.configure({
        bulletList: { keepMarks: true, keepAttributes: false },
        orderedList: { keepMarks: true, keepAttributes: false },
      }),
      Underline,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: "text-blue-600 underline font-medium cursor-pointer",
        },
      }),
    ],
    content: initialContent,
    immediatelyRender: false,
    editorProps: {
      attributes: {
        class:
          "prose prose-sm max-w-none focus:outline-none min-h-[160px] p-4 text-neutral-900 leading-relaxed font-sans",
      },
    },
  });


  const openLinkModal = () => {
    if (!editor) return;
    const { from, to } = editor.state.selection;
    const selected = editor.state.doc.textBetween(from, to, " ");
    const currentHref = editor.getAttributes("link").href || "";
    setLinkText(selected);
    setLinkUrl(currentHref);
    setShowLinkModal(true);
  };

  const applyLink = () => {
    if (!editor) return;
    const url = linkUrl.trim();
    if (!url) {
      editor.chain().focus().unsetLink().run();
    } else {
      const validUrl = url.startsWith("http://") || url.startsWith("https://") || url.startsWith("mailto:")
        ? url
        : `https://${url}`;

      if (linkText) {
        editor
          .chain()
          .focus()
          .insertContent(`<a href="${validUrl}" target="_blank" rel="noopener noreferrer">${linkText}</a> `)
          .run();
      } else {
        editor
          .chain()
          .focus()
          .extendMarkRange("link")
          .setLink({ href: validUrl, target: "_blank" })
          .run();
      }
    }
    setShowLinkModal(false);
    setLinkText("");
    setLinkUrl("");
  };

  const insertEmoji = (emoji: string) => {
    if (!editor) return;
    editor.chain().focus().insertContent(emoji).run();
    setShowEmojiPicker(false);
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const formData = new FormData();
    for (let i = 0; i < files.length; i++) {
      formData.append("files", files[i]);
    }

    setUploading(true);
    try {
      const res = await fetch("/api/proxy/mail/attachments", {
        method: "POST",
        body: formData,
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Upload failed");
      const newItems: AttachmentItem[] = Array.isArray(json.data) ? json.data : [json.data];
      setAttachments((prev) => [...prev, ...newItems]);
      toast.success(`${newItems.length} file(s) attached`);
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Upload failed";
      toast.error(msg);
    } finally {
      setUploading(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
      if (imageInputRef.current) imageInputRef.current.value = "";
    }
  };

  const handleRemoveAttachment = async (id: number) => {
    setAttachments((prev) => prev.filter((a) => a.id !== id));
    try {
      await fetch(`/api/proxy/mail/attachments/${id}`, { method: "DELETE" });
    } catch {}
  };

  const handleDiscard = async () => {
    if (draftId) {
      try {
        await fetch(`/api/proxy/mail/messages/${draftId}`, { method: "DELETE" });
        toast.info("Draf dibuang");
      } catch {}
    } else {
      toast.info("Draf dibuang");
    }
    onClose();
  };

  const handleSend = async (asDraft = false) => {
    const finalTo = parseFinalAddresses(toChips, toInput);
    const finalCc = parseFinalAddresses(ccChips, ccInput);
    const finalBcc = parseFinalAddresses(bccChips, bccInput);

    if (!asDraft && finalTo.length === 0) {
      toast.error("Silakan tentukan minimal satu penerima (To)");
      return;
    }

    const htmlBody = editor ? editor.getHTML() : `<p>${initialBody.replace(/\n/g, "<br/>")}</p>`;
    const textBody = editor ? editor.getText() : initialBody;

    setSending(true);
    try {
      const payload: Record<string, any> = {
        mailbox_id: selectedMailboxId,
        to: finalTo.map((addr) => ({ name: "", address: addr })),
        cc: finalCc.map((addr) => ({ name: "", address: addr })),
        bcc: finalBcc.map((addr) => ({ name: "", address: addr })),
        subject: subject.trim(),
        body_text: textBody,
        body_html: htmlBody,
        attachment_ids: attachments.map((a) => a.id),
        is_draft: asDraft,
      };

      if (initialInReplyTo) {
        payload.in_reply_to = initialInReplyTo;
      }
      if (initialReferences) {
        payload.references_hdr = initialReferences;
      }

      if (isScheduled && scheduledDate && !asDraft) {
        payload.scheduled_at = new Date(scheduledDate).toISOString();
      }

      const url = draftId ? `/api/proxy/mail/messages/${draftId}` : "/api/proxy/mail/messages";
      const method = draftId ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to process message");

      if (asDraft) {
        toast.info("Draf disimpan");
        if (json.data?.id) setDraftId(json.data.id);
        onClose();
      } else if (payload.scheduled_at) {
        toast.success("Pesan dijadwalkan!", {
          description: `Akan dikirim otomatis pada ${new Date(scheduledDate).toLocaleString("id-ID")}`,
        });
        onClose();
        onSent(json.data.id, false);
      } else {
        toast.success("Pesan terkirim", {
          description: "Tersedia pembatalan pengiriman (Urungkan) selama 8 detik.",
          action: {
            label: "Urungkan",
            onClick: async () => {
              try {
                const undoRes = await fetch(`/api/proxy/mail/messages/${json.data.id}/undo`, {
                  method: "POST",
                });
                if (undoRes.ok) {
                  toast.info("Pengiriman dibatalkan. Pesan kembali ke Draf.");
                }
              } catch {}
            },
          },
        });
        onClose();
        onSent(json.data.id, true);
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Gagal memproses pesan";
      toast.error(msg);
    } finally {
      setSending(false);
    }
  };

  if (windowMode === "minimized") {
    return (
      <MailComposeMinimized
        subject={subject}
        onRestore={() => setWindowMode("dock")}
        onClose={onClose}
      />
    );
  }

  return (
    <div
      className={cn(
        "z-50 bg-white flex flex-col overflow-hidden transition-all duration-200 border border-neutral-300",
        windowMode === "expanded"
          ? "fixed inset-0 sm:inset-6 sm:rounded-2xl shadow-2xl"
          : "fixed inset-x-0 bottom-0 sm:inset-x-auto sm:right-8 sm:w-[580px] h-[85vh] sm:h-[570px] max-h-[100vh] sm:max-h-[90vh] rounded-t-2xl shadow-2xl"
      )}
    >
      {/* 1. Header (Pesan Baru with minimize, expand, close) */}
      <div className="px-4 py-2.5 bg-[#f2f6fc] border-b border-neutral-200 flex items-center justify-between select-none">
        <span className="text-xs font-semibold text-neutral-800 truncate mr-2">
          {subject ? subject : "Pesan Baru"}
        </span>
        <div className="flex items-center gap-1 text-neutral-600">
          <button
            type="button"
            onClick={() => setWindowMode("minimized")}
            className="p-1.5 hover:bg-neutral-200/70 rounded-md transition-colors text-neutral-600 hover:text-neutral-900 cursor-pointer"
            title="Minimalkan"
          >
            <Minus className="w-3.5 h-3.5" />
          </button>
          <button
            type="button"
            onClick={() => setWindowMode(windowMode === "expanded" ? "dock" : "expanded")}
            className="p-1.5 hover:bg-neutral-200/70 rounded-md transition-colors text-neutral-600 hover:text-neutral-900 cursor-pointer"
            title={windowMode === "expanded" ? "Keluar layar penuh" : "Layar penuh"}
          >
            {windowMode === "expanded" ? (
              <Minimize2 className="w-3.5 h-3.5" />
            ) : (
              <Maximize2 className="w-3.5 h-3.5" />
            )}
          </button>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 hover:bg-neutral-200/70 rounded-md transition-colors text-neutral-600 hover:text-neutral-900 cursor-pointer"
            title="Simpan dan tutup"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* 2. Sender Selector & Recipient Fields */}
      <div className="flex-1 flex flex-col overflow-y-auto">
        {mailboxes.length > 1 && (
          <div className="flex items-center px-4 py-1.5 border-b border-neutral-100 text-xs">
            <span className="text-neutral-500 w-16 font-medium">Dari</span>
            <select
              value={selectedMailboxId}
              onChange={(e) => setSelectedMailboxId(Number(e.target.value))}
              className="flex-1 font-medium text-neutral-900 bg-transparent outline-none cursor-pointer py-1"
            >
              {mailboxes.map((b) => (
                <option key={b.id} value={b.id}>
                  {b.display_name} &lt;{b.address}&gt;
                </option>
              ))}
            </select>
          </div>
        )}

        <MailRecipientFields
          toChips={toChips}
          setToChips={setToChips}
          toInput={toInput}
          setToInput={setToInput}
          toInputRef={toInputRef}
          ccChips={ccChips}
          setCcChips={setCcChips}
          ccInput={ccInput}
          setCcInput={setCcInput}
          ccInputRef={ccInputRef}
          showCc={showCc}
          setShowCc={setShowCc}
          bccChips={bccChips}
          setBccChips={setBccChips}
          bccInput={bccInput}
          setBccInput={setBccInput}
          bccInputRef={bccInputRef}
          showBcc={showBcc}
          setShowBcc={setShowBcc}
          onKeyDownChip={handleKeyDownChip}
          onBlurChip={handleBlurChip}
          onPasteChip={handlePasteChip}
        />

        {/* Subject */}
        <div className="flex items-center px-4 py-2 border-b border-neutral-200 text-xs">
          <input
            type="text"
            value={subject}
            onChange={(e) => setSubject(e.target.value)}
            placeholder="Subjek"
            className="w-full text-xs font-medium text-neutral-900 outline-none bg-transparent py-0.5 placeholder:text-neutral-400"
          />
        </div>

        {/* Schedule Bar */}
        {isScheduled && (
          <div className="px-4 py-2 bg-blue-50 border-b border-blue-200 flex items-center justify-between text-xs text-blue-900">
            <div className="flex items-center gap-2">
              <Clock className="w-3.5 h-3.5 text-blue-600 shrink-0" />
              <span>Kirim terjadwal:</span>
              <input
                type="datetime-local"
                value={scheduledDate}
                onChange={(e) => setScheduledDate(e.target.value)}
                className="px-2 py-0.5 bg-white border border-blue-300 rounded text-xs font-semibold"
              />
            </div>
            <button
              type="button"
              onClick={() => setIsScheduled(false)}
              className="text-xs text-blue-700 hover:underline font-medium cursor-pointer"
            >
              Batalkan
            </button>
          </div>
        )}

        {/* Rich Text Editor */}
        <div className="flex-1 min-h-[160px] overflow-y-auto cursor-text" onClick={() => editor?.commands.focus()}>
          <EditorContent editor={editor} />
        </div>

        {/* Attachment Chips */}
        <MailComposeAttachments
          attachments={attachments}
          onRemove={handleRemoveAttachment}
        />
      </div>

      {/* 4. Formatting Toolbar (Aa Bar) */}
      {showToolbar && <MailFormattingBar editor={editor} />}

      {/* 5. Bottom Action Bar */}
      <MailBottomBar
        sending={sending}
        uploading={uploading}
        isScheduled={isScheduled}
        showScheduleDropdown={showScheduleDropdown}
        setShowScheduleDropdown={setShowScheduleDropdown}
        showToolbar={showToolbar}
        setShowToolbar={setShowToolbar}
        showEmojiPicker={showEmojiPicker}
        setShowEmojiPicker={setShowEmojiPicker}
        isLinkActive={Boolean(editor?.isActive("link"))}
        onSend={handleSend}
        onScheduleSelect={() => {
          setIsScheduled(true);
          const tomorrow = new Date();
          tomorrow.setDate(tomorrow.getDate() + 1);
          tomorrow.setHours(8, 0, 0, 0);
          setScheduledDate(tomorrow.toISOString().slice(0, 16));
          setShowScheduleDropdown(false);
        }}
        onAttachClick={() => fileInputRef.current?.click()}
        onLinkClick={openLinkModal}
        onImageClick={() => imageInputRef.current?.click()}
        onInsertEmoji={insertEmoji}
        onClose={onClose}
        onDiscard={handleDiscard}
      />

      {/* Hidden File Inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleFileUpload}
        multiple
        className="hidden"
      />
      <input
        type="file"
        ref={imageInputRef}
        onChange={handleFileUpload}
        accept="image/*"
        multiple
        className="hidden"
      />

      {/* 6. Interactive Link Modal */}
      <MailLinkModal
        isOpen={showLinkModal}
        linkText={linkText}
        setLinkText={setLinkText}
        linkUrl={linkUrl}
        setLinkUrl={setLinkUrl}
        onApply={applyLink}
        onClose={() => setShowLinkModal(false)}
      />
    </div>
  );
}
