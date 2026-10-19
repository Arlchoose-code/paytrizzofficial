"use client";

import { useState, useMemo } from "react";
import {
  CornerUpLeft,
  CornerUpRight,
  Paperclip,
  Download,
  Image as ImageIcon,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import { cn } from "@/lib/utils";
import type { MessageItem } from "@/types/mail";

interface MailThreadItemProps {
  message: MessageItem;
  isLatest: boolean;
  isExpanded: boolean;
  onToggleExpand: () => void;
  showImages: boolean;
  onShowImages: () => void;
  onReplyToMessage: (msg: MessageItem) => void;
  onForwardMessage: (msg: MessageItem) => void;
}

export function MailThreadItem({
  message,
  isLatest,
  isExpanded,
  onToggleExpand,
  showImages,
  onShowImages,
  onReplyToMessage,
  onForwardMessage,
}: MailThreadItemProps) {
  const [showQuote, setShowQuote] = useState(false);

  const senderName = message.from_name || message.from_address.split("@")[0] || "Unknown";
  const senderInitial = (senderName || message.from_address || "U").charAt(0).toUpperCase();

  const formattedDate = new Date(message.sort_at).toLocaleString("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Check if body has quoted reply text
  const hasHtmlQuote = Boolean(
    message.body_html &&
      (message.body_html.includes("gmail_quote") ||
        message.body_html.includes("<blockquote") ||
        message.body_html.includes("class=\"quote\""))
  );

  const textQuoteSplit = useMemo(() => {
    if (!message.body_text || message.body_html) return { main: message.body_text || "", quote: "" };
    const patterns = [
      /\n\s*(?:Pada\s+[A-Za-z0-9,\.\s:]+menulis:)/i,
      /\n\s*(?:On\s+[A-Za-z0-9,\.\s:]+wrote:)/i,
      /\n\s*-{3,}\s*(?:Pesan yang diteruskan|Original Message|Forwarded message)\s*-{3,}/i,
      /\n\s*>/,
    ];
    for (const pat of patterns) {
      const match = pat.exec(message.body_text);
      if (match && match.index !== undefined) {
        return {
          main: message.body_text.slice(0, match.index).trim(),
          quote: message.body_text.slice(match.index).trim(),
        };
      }
    }
    return { main: message.body_text, quote: "" };
  }, [message.body_text, message.body_html]);

  const hasTextQuote = Boolean(textQuoteSplit.quote);
  const hasQuotedContent = hasHtmlQuote || hasTextQuote;

  // Collapsed Card View (Gmail Stacked Thread Item)
  if (!isExpanded) {
    return (
      <div
        role="button"
        tabIndex={0}
        onClick={onToggleExpand}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onToggleExpand();
          }
        }}
        className="w-full group flex items-center justify-between gap-3 p-3.5 rounded-xl border border-ink-100 bg-[#FAFAFA] hover:bg-neutral-100/90 hover:border-neutral-300 transition-all cursor-pointer select-none text-left shadow-2xs"
      >
        <div className="flex items-center gap-3 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-full bg-brand-500/20 text-brand-900 font-bold flex items-center justify-center text-xs shrink-0 select-none">
            {senderInitial}
          </div>
          <span className="text-xs font-bold text-ink-900 shrink-0 max-w-[160px] truncate">
            {senderName}
          </span>
          <span className="text-xs text-ink-500 truncate flex-1 font-normal">
            {message.snippet || message.body_text?.slice(0, 100) || "(No snippet)"}
          </span>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          {(message.has_attachments || (message.attachments && message.attachments.length > 0)) && (
            <Paperclip className="w-3.5 h-3.5 text-ink-400 group-hover:text-ink-600 transition-colors" />
          )}
          <span className="text-[11px] text-ink-400 group-hover:text-ink-600 font-normal">
            {formattedDate}
          </span>
          <ChevronDown className="w-3.5 h-3.5 text-ink-400 group-hover:text-ink-600 transition-transform" />
        </div>
      </div>
    );
  }

  // Expanded Card View
  return (
    <div
      className={cn(
        "rounded-2xl border transition-all bg-white p-5 space-y-4 shadow-2xs",
        isLatest ? "border-brand-300/80 ring-1 ring-brand-200/50" : "border-ink-100"
      )}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div className="w-9 h-9 rounded-full bg-brand-500 text-ink-900 font-bold flex items-center justify-center text-xs shadow-xs shrink-0 select-none">
            {senderInitial}
          </div>
          <div className="min-w-0">
            <div className="text-xs font-bold text-ink-900 flex items-center gap-1.5 flex-wrap">
              <span>{senderName}</span>
              <span className="font-mono font-normal text-ink-500 text-[11px]">
                &lt;{message.from_address}&gt;
              </span>
            </div>
            <div className="text-[11px] text-ink-400 truncate">
              to {message.to_json?.map((t) => t.address).join(", ") || "me"}
            </div>
            {message.cc_json && message.cc_json.length > 0 && (
              <div className="text-[11px] text-ink-400 truncate">
                cc {message.cc_json.map((c) => (c.name ? `${c.name} <${c.address}>` : c.address)).join(", ")}
              </div>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-ink-400 whitespace-nowrap">{formattedDate}</span>

          <button
            type="button"
            onClick={onToggleExpand}
            className="p-1 rounded-lg text-ink-400 hover:text-ink-700 hover:bg-ink-100 transition cursor-pointer"
            title="Collapse message"
          >
            <ChevronUp className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Remote images warning */}
      {message.body_html && message.body_html.includes("<img") && !showImages && (
        <div className="p-2.5 rounded-xl bg-brand-50 border border-brand-200 text-ink-900 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ImageIcon className="w-4 h-4 text-ink-700" />
            <span>External images are blocked for privacy.</span>
          </div>
          <button
            type="button"
            onClick={onShowImages}
            className="px-3 py-1 rounded-full bg-brand-500 text-ink-900 font-bold text-[11px] hover:bg-brand-400 transition cursor-pointer"
          >
            Show images
          </button>
        </div>
      )}

      {/* Message Body */}
      <div className="text-xs leading-relaxed text-ink-900 overflow-x-auto py-1">
        {message.body_html ? (
          <div>
            <div
              dangerouslySetInnerHTML={{ __html: message.body_html }}
              className={cn(
                "prose prose-xs max-w-none text-xs text-ink-900",
                !showImages && "[&_img]:hidden",
                !showQuote && "[&_.gmail_quote]:hidden [&_blockquote]:hidden [&_.quote]:hidden"
              )}
            />
          </div>
        ) : (
          <div>
            <pre className="whitespace-pre-wrap font-sans text-xs text-ink-900">
              {textQuoteSplit.main || message.body_text}
            </pre>
            {showQuote && textQuoteSplit.quote && (
              <div className="mt-2.5 pl-3 border-l-2 border-neutral-300 text-neutral-600">
                <pre className="whitespace-pre-wrap font-sans text-xs">
                  {textQuoteSplit.quote}
                </pre>
              </div>
            )}
          </div>
        )}

        {/* Collapsible Quote Toggle Button (Gmail-style) */}
        {hasQuotedContent && (
          <button
            type="button"
            onClick={() => setShowQuote(!showQuote)}
            className="inline-flex items-center gap-1 px-2 py-0.5 mt-2 rounded bg-neutral-200/80 hover:bg-neutral-300 text-neutral-600 font-bold text-[11px] transition-colors cursor-pointer select-none"
            title={showQuote ? "Hide quoted text" : "Show trimmed content"}
          >
            <span>···</span>
          </button>
        )}
      </div>

      {/* Attachments Section */}
      {message.attachments && message.attachments.length > 0 && (
        <div className="pt-3 border-t border-ink-100">
          <h4 className="text-[11px] font-bold text-ink-900 mb-2 flex items-center gap-1.5">
            <Paperclip className="w-3 h-3 text-neutral-600" />
            Attachments ({message.attachments.length})
          </h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {message.attachments.map((att) => {
              const name = att.original_name || att.filename || "attachment";
              const downloadHref = att.download_url || att.file_path || `/api/proxy/mail/attachments/${att.id}/download`;
              const isImage = att.mime?.startsWith("image/") || /\.(png|jpe?g|gif|webp|svg)$/i.test(name);
              return (
                <div
                  key={att.id}
                  className="flex items-center justify-between p-2.5 rounded-xl border border-ink-200 bg-[#FBFBFC] hover:bg-ink-50 transition-colors"
                >
                  <div className="flex items-center gap-2.5 truncate mr-2 min-w-0">
                    <div className="w-7 h-7 rounded-lg bg-brand-100 text-ink-900 flex items-center justify-center shrink-0">
                      {isImage ? <ImageIcon className="w-3.5 h-3.5 text-brand-700" /> : <Paperclip className="w-3.5 h-3.5 text-ink-600" />}
                    </div>
                    <div className="truncate">
                      <p className="text-xs font-semibold text-ink-900 truncate" title={name}>
                        {name}
                      </p>
                      <p className="text-[10px] text-ink-400">
                        {att.size_bytes
                          ? att.size_bytes > 1048576
                            ? `${(att.size_bytes / 1048576).toFixed(1)} MB`
                            : `${(att.size_bytes / 1024).toFixed(0)} KB`
                          : ""}
                      </p>
                    </div>
                  </div>
                  <a
                    href={downloadHref}
                    download={name}
                    target="_blank"
                    rel="noreferrer"
                    className="p-1.5 text-ink-600 hover:text-ink-900 hover:bg-ink-100 rounded-lg transition-colors shrink-0 cursor-pointer"
                    title={`Download ${name}`}
                  >
                    <Download className="w-3.5 h-3.5" />
                  </a>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Individual Message Action Footer (if not latest) */}
      {!isLatest && (
        <div className="pt-2 border-t border-ink-100 flex items-center gap-2">
          <button
            type="button"
            onClick={() => onReplyToMessage(message)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium text-xs transition cursor-pointer"
          >
            <CornerUpLeft className="w-3 h-3 text-neutral-500" />
            <span>Reply to this message</span>
          </button>
          <button
            type="button"
            onClick={() => onForwardMessage(message)}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-neutral-200 hover:bg-neutral-100 text-neutral-700 font-medium text-xs transition cursor-pointer"
          >
            <CornerUpRight className="w-3 h-3 text-neutral-500" />
            <span>Forward</span>
          </button>
        </div>
      )}
    </div>
  );
}
