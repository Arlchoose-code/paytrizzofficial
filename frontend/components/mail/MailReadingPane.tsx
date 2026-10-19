"use client";

import { useState, useEffect, useMemo } from "react";
import { Mail, AlertTriangle } from "lucide-react";
import type { MessageItem, MailLabelItem } from "@/types/mail";
import type { MailboxItem } from "./MailSidebar";
import { MailReadingPaneHeader } from "./MailReadingPaneHeader";
import { MailThreadItem } from "./MailThreadItem";
import { MailReplyBox } from "./MailReplyBox";
import { buildReplyQuote, buildForwardQuote } from "./mailQuoteHelpers";

export type { MessageItem } from "@/types/mail";

interface MailReadingPaneProps {
  selectedMessage: MessageItem | null;
  readOnly: boolean;
  allLabels?: MailLabelItem[];
  mailboxes?: MailboxItem[];
  selectedMailboxId?: number | null;
  onSelectMailbox?: (id: number) => void;
  onReply: (
    to: string,
    subject: string,
    quotedHtml?: string,
    originalAtts?: any[],
    initialCc?: string,
    inReplyTo?: string,
    mailboxId?: number
  ) => void;
  onForward?: (
    subject: string,
    quotedHtml: string,
    originalAtts?: any[],
    mailboxId?: number
  ) => void;
  onEditDraft?: (msg: MessageItem) => void;
  onSnooze: (id: number) => void;
  onToggleStar: (id: number, currentStarred: boolean) => void;
  onMoveFolder: (id: number, folder: string) => void;
  onAssignLabels?: (messageId: number, labelIds: number[]) => Promise<void>;
  onBack?: () => void;
}

export function MailReadingPane({
  selectedMessage,
  readOnly,
  allLabels = [],
  mailboxes,
  selectedMailboxId,
  onSelectMailbox,
  onReply,
  onForward,
  onEditDraft,
  onSnooze,
  onToggleStar,
  onMoveFolder,
  onAssignLabels,
  onBack,
}: MailReadingPaneProps) {
  const [showImages, setShowImages] = useState(false);
  const [expandedIds, setExpandedIds] = useState<Set<number>>(new Set());

  // Determine conversation thread messages sorted chronologically (sort_at ASC)
  const threadMessages = useMemo<MessageItem[]>(() => {
    if (!selectedMessage) return [];
    if (selectedMessage.thread_messages && selectedMessage.thread_messages.length > 0) {
      return [...selectedMessage.thread_messages].sort(
        (a, b) => new Date(a.sort_at).getTime() - new Date(b.sort_at).getTime()
      );
    }
    return [selectedMessage];
  }, [selectedMessage]);

  const latestMessage = threadMessages.length > 0 ? threadMessages[threadMessages.length - 1] : selectedMessage;

  const latestMessageId = latestMessage?.id;
  // By default, latest message in conversation is expanded
  useEffect(() => {
    if (latestMessageId) {
      setExpandedIds(new Set([latestMessageId]));
      setShowImages(false);
    }
  }, [latestMessageId]);

  // Clean subject without Re:/Fwd: prefixes for conversation header (Gmail style)
  const rawSubject = selectedMessage?.subject;
  const conversationSubject = useMemo(() => {
    if (!rawSubject) return "(Tanpa Subjek)";
    const clean = rawSubject
      .replace(/^(?:\[(?:external|spam)\]\s*:?|(?:\b(?:re|fwd|fw|aw|sv|vs|balas|teruskan)(?:\[\d+\]|\(\d+\))?)\s*:\s*)+/gi, "")
      .trim();
    return clean || rawSubject;
  }, [rawSubject]);

  const isAllExpanded = useMemo(() => {
    return threadMessages.length > 0 && threadMessages.every((m) => expandedIds.has(m.id));
  }, [threadMessages, expandedIds]);

  const handleToggleExpandAll = () => {
    if (isAllExpanded) {
      if (latestMessageId) setExpandedIds(new Set([latestMessageId]));
    } else {
      setExpandedIds(new Set(threadMessages.map((m) => m.id)));
    }
  };

  const toggleExpand = (id: number) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleReplyMessage = (msg: MessageItem) => {
    const subjectPrefix = msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`;
    const quoted = buildReplyQuote(msg);
    const inReplyTo = msg.rfc_message_id || String(msg.id);
    onReply(msg.from_address, subjectPrefix, quoted, msg.attachments || [], undefined, inReplyTo, msg.mailbox_id);
  };

  const handleReplyAllMessage = (msg: MessageItem) => {
    const subjectPrefix = msg.subject.startsWith("Re:") ? msg.subject : `Re: ${msg.subject}`;
    const quoted = buildReplyQuote(msg);
    const allCc: string[] = [];
    (msg.cc_json || []).forEach((c) => {
      if (c.address && c.address !== msg.from_address && !allCc.includes(c.address)) {
        allCc.push(c.address);
      }
    });
    (msg.to_json || []).forEach((t) => {
      if (t.address && t.address !== msg.from_address && !allCc.includes(t.address)) {
        allCc.push(t.address);
      }
    });
    const inReplyTo = msg.rfc_message_id || String(msg.id);
    onReply(msg.from_address, subjectPrefix, quoted, msg.attachments || [], allCc.join(", "), inReplyTo, msg.mailbox_id);
  };

  const handleForwardMessage = (msg: MessageItem) => {
    if (!onForward) return;
    const subjectPrefix = msg.subject.startsWith("Fwd:") ? msg.subject : `Fwd: ${msg.subject}`;
    const quoted = buildForwardQuote(msg);
    onForward(subjectPrefix, quoted, msg.attachments || [], msg.mailbox_id);
  };

  if (!selectedMessage || !latestMessage) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center p-8 text-center bg-white">
        <div className="w-16 h-16 rounded-full bg-brand-50 flex items-center justify-center text-brand-600 mb-4">
          <Mail className="w-8 h-8" />
        </div>
        <h3 className="text-base font-bold text-ink-900">Select an email to read</h3>
        <p className="text-xs text-ink-500 max-w-sm mt-1">
          Choose an email or conversation thread from the list on the left to read history and reply.
        </p>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col h-full overflow-hidden bg-white">
      {/* Top Toolbar */}
      <MailReadingPaneHeader
        message={selectedMessage}
        readOnly={readOnly}
        allLabels={allLabels}
        onReply={() => handleReplyMessage(latestMessage)}
        onForward={() => handleForwardMessage(latestMessage)}
        onEditDraft={onEditDraft}
        onSnooze={onSnooze}
        onToggleStar={onToggleStar}
        onMoveFolder={onMoveFolder}
        onAssignLabels={onAssignLabels}
        onBack={onBack}
      />

      {/* Conversation Thread Header */}
      <div className="px-6 py-4 border-b border-ink-100 bg-white space-y-2 shrink-0">
        {selectedMessage.delivery_status === "bounced" && (
          <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-danger text-xs flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>
              This message could not be delivered to the recipient. {selectedMessage.delivery_detail || "Bounced by remote mail server."}
            </span>
          </div>
        )}

        <div className="flex items-start justify-between gap-4">
          <div className="space-y-1.5 min-w-0">
            <div className="flex items-center gap-2.5 flex-wrap">
              <h2 className="text-lg font-bold text-ink-900 leading-snug">
                {conversationSubject}
              </h2>
              {threadMessages.length > 1 && (
                <div className="flex items-center gap-1.5">
                  <span className="px-2 py-0.5 rounded-full bg-brand-100 text-brand-900 font-bold text-[10px]">
                    {threadMessages.length} messages
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleExpandAll}
                    className="text-[11px] font-medium text-ink-500 hover:text-ink-900 px-2 py-0.5 rounded-md hover:bg-ink-100 transition cursor-pointer select-none"
                    title={isAllExpanded ? "Collapse all messages" : "Expand all messages"}
                  >
                    {isAllExpanded ? "Collapse all" : "Expand all"}
                  </button>
                </div>
              )}
            </div>

            {selectedMessage.labels && selectedMessage.labels.length > 0 && (
              <div className="flex items-center gap-1.5 flex-wrap">
                {selectedMessage.labels.map((lbl) => (
                  <span
                    key={lbl.id}
                    className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[10px] font-bold text-ink-900"
                    style={{ backgroundColor: `${lbl.color}30`, borderColor: lbl.color, borderWidth: 1 }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: lbl.color }} />
                    {lbl.name}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Gmail-style Stacked Conversation Cards */}
      <div className="flex-1 p-6 overflow-y-auto bg-white space-y-3.5">
        {threadMessages.map((msg, index) => {
          const isLatest = index === threadMessages.length - 1;
          const isExpanded = expandedIds.has(msg.id);

          return (
            <MailThreadItem
              key={msg.id}
              message={msg}
              isLatest={isLatest}
              isExpanded={isExpanded}
              onToggleExpand={() => toggleExpand(msg.id)}
              showImages={showImages}
              onShowImages={() => setShowImages(true)}
              onReplyToMessage={handleReplyMessage}
              onForwardMessage={handleForwardMessage}
            />
          );
        })}
      </div>

      {/* Bottom Action Buttons (Reply, Reply All, Forward, Reactions) */}
      <MailReplyBox
        message={latestMessage}
        readOnly={readOnly}
        mailboxes={mailboxes}
        selectedMailboxId={selectedMailboxId}
        onSelectMailbox={onSelectMailbox}
        onReply={() => handleReplyMessage(latestMessage)}
        onReplyAll={() => handleReplyAllMessage(latestMessage)}
        onForward={() => handleForwardMessage(latestMessage)}
      />
    </div>
  );
}
