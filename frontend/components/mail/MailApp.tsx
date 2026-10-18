"use client";

import { useState, useEffect, useCallback } from "react";
import { AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { MailModals } from "./MailModals";
import { useMailBulkActions } from "./useMailBulkActions";
import { MailSidebar, MailboxItem, FolderCounts, MailLabel } from "./MailSidebar";
import { MailReadingPane, MessageItem } from "./MailReadingPane";
import { MailMessageList } from "./MailMessageList";
import { WebmailHeader } from "./WebmailHeader";

interface MailAppProps {
  scope: "company" | "talent";
  readOnly?: boolean;
  monitoredMailboxId?: number;
  monitoredMailboxAddress?: string;
  monitoredTalentName?: string;
  standalone?: boolean;
}

export function MailApp({
  scope,
  readOnly = false,
  monitoredMailboxId,
  monitoredMailboxAddress,
  monitoredTalentName,
  standalone = false,
}: MailAppProps) {
  // Navigation & Mailbox selection
  const [mailboxes, setMailboxes] = useState<MailboxItem[]>([]);
  const [selectedMailboxId, setSelectedMailboxId] = useState<number | null>(monitoredMailboxId || null);
  const [activeFolder, setActiveFolder] = useState<string>("inbox");
  const [folderCounts, setFolderCounts] = useState<FolderCounts>({
    inbox: 0,
    starred: 0,
    snoozed: 0,
    sent: 0,
    drafts: 0,
    scheduled: 0,
    all_mail: 0,
    spam: 0,
    trash: 0,
  });

  // Messages & View State
  const [messages, setMessages] = useState<MessageItem[]>([]);
  const [selectedMessage, setSelectedMessage] = useState<MessageItem | null>(null);
  const [selectedIds, setSelectedIds] = useState<number[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [mobileFoldersOpen, setMobileFoldersOpen] = useState(false);

  // Modals & Reply
  const [showCompose, setShowCompose] = useState(false);
  const [editingDraft, setEditingDraft] = useState<MessageItem | null>(null);
  const [showAddMailbox, setShowAddMailbox] = useState(false);
  const [showManageMailboxes, setShowManageMailboxes] = useState(false);
  const [showManageLabels, setShowManageLabels] = useState(false);
  const [showManageSubscriptions, setShowManageSubscriptions] = useState(false);
  const [labels, setLabels] = useState<MailLabel[]>([]);
  const [activeLabelId, setActiveLabelId] = useState<number | null>(null);
  const [snoozeTargetId, setSnoozeTargetId] = useState<number | null>(null);
  const [composeInitialTo, setComposeInitialTo] = useState("");
  const [composeInitialCc, setComposeInitialCc] = useState("");
  const [composeInitialBcc, setComposeInitialBcc] = useState("");
  const [composeInitialSubject, setComposeInitialSubject] = useState("");
  const [composeInitialBodyHtml, setComposeInitialBodyHtml] = useState("");
  const [composeInitialInReplyTo, setComposeInitialInReplyTo] = useState("");
  const [composeInitialMailboxId, setComposeInitialMailboxId] = useState<number | undefined>(undefined);
  const [composeInitialAttachments, setComposeInitialAttachments] = useState<any[]>([]);
  const [inlineReplyText, setInlineReplyText] = useState("");
  const [replySending, setReplySending] = useState(false);

  const handleOpenNewCompose = () => {
    setEditingDraft(null);
    setComposeInitialMailboxId(selectedMailboxId || undefined);
    setComposeInitialTo("");
    setComposeInitialCc("");
    setComposeInitialBcc("");
    setComposeInitialSubject("");
    setComposeInitialBodyHtml("");
    setComposeInitialInReplyTo("");
    setComposeInitialAttachments([]);
    setShowCompose(true);
  };

  const handleEditDraft = (msg: MessageItem) => {
    setEditingDraft(msg);
    setComposeInitialMailboxId(msg.mailbox_id);
    setComposeInitialTo((msg.to_json || []).map((t) => t.address).join(", "));
    setComposeInitialCc((msg.cc_json || []).map((c) => c.address).join(", "));
    setComposeInitialBcc("");
    setComposeInitialSubject(msg.subject || "");
    setComposeInitialBodyHtml(
      msg.body_html || (msg.body_text ? `<p>${msg.body_text.replace(/\n/g, "<br/>")}</p>` : "")
    );
    setComposeInitialInReplyTo(msg.in_reply_to || "");
    setComposeInitialAttachments(
      msg.attachments?.map((a) => ({
        id: a.id,
        original_name: a.original_name || a.filename || "attachment",
        size_bytes: a.size_bytes,
        mime: a.mime || "application/octet-stream",
        download_url: a.download_url,
      })) || []
    );
    setShowCompose(true);
  };

  // 1. Fetch Mailboxes
  const fetchMailboxes = useCallback(async () => {
    if (readOnly && monitoredMailboxId) {
      setMailboxes([
        {
          id: monitoredMailboxId,
          address: monitoredMailboxAddress || "talent@paytrizz.com",
          display_name: monitoredTalentName || "Monitored Talent",
          color: "#FCCF00",
          unread_count: 0,
        },
      ]);
      setSelectedMailboxId(monitoredMailboxId);
      return;
    }
    try {
      const res = await fetch("/api/proxy/mail/mailboxes");
      const json = await res.json();
      if (res.ok && json.data) {
        setMailboxes(json.data);
      }
    } catch {}
  }, [readOnly, monitoredMailboxId, monitoredMailboxAddress, monitoredTalentName]);

  // 2. Fetch Folder Counts
  const fetchCounts = useCallback(async () => {
    if (readOnly) return;
    try {
      const boxQuery = selectedMailboxId ? `?mailbox_id=${selectedMailboxId}` : "";
      const res = await fetch(`/api/proxy/mail/counts${boxQuery}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setFolderCounts(json.data);
      }
    } catch {}
  }, [selectedMailboxId, readOnly]);

  // 3. Fetch Labels (PRD 4.10)
  const fetchLabels = useCallback(async () => {
    if (readOnly) return;
    try {
      const res = await fetch("/api/proxy/mail/labels");
      const json = await res.json();
      if (res.ok && json.success) {
        setLabels(Array.isArray(json.data) ? json.data : []);
      }
    } catch {}
  }, [readOnly]);

  // 4. Fetch Messages List
  const fetchMessages = useCallback(async () => {
    setLoading(true);
    try {
      let url = "";
      if (readOnly && monitoredMailboxId) {
        url = `/api/proxy/admin/mail-monitor/${monitoredMailboxId}?folder=${activeFolder}`;
      } else {
        const params = new URLSearchParams({ folder: activeFolder });
        if (selectedMailboxId) params.append("mailbox_id", selectedMailboxId.toString());
        if (activeLabelId) params.append("label_id", activeLabelId.toString());
        if (searchQuery) params.append("search", searchQuery);
        url = `/api/proxy/mail/messages?${params.toString()}`;
      }

      const res = await fetch(url);
      const json = await res.json();
      if (res.ok && json.data) {
        let list: MessageItem[] = [];
        if (Array.isArray(json.data.messages)) {
          list = json.data.messages;
        } else if (Array.isArray(json.data.data?.messages)) {
          list = json.data.data.messages;
        } else if (Array.isArray(json.data.data)) {
          list = json.data.data;
        } else if (Array.isArray(json.data)) {
          list = json.data;
        }
        setMessages(list);
        if (selectedMessage && !list.find((m: MessageItem) => m.id === selectedMessage.id)) {
          setSelectedMessage(null);
        }
      }
    } catch {
      toast.error("Failed to load messages");
    } finally {
      setLoading(false);
    }
  }, [activeFolder, selectedMailboxId, activeLabelId, searchQuery, readOnly, monitoredMailboxId, selectedMessage]);

  useEffect(() => {
    fetchMailboxes();
    fetchLabels();
  }, [fetchMailboxes, fetchLabels]);

  useEffect(() => {
    fetchCounts();
    fetchMessages();
  }, [fetchCounts, fetchMessages]);

  // 4. Real-time SSE Stream
  useEffect(() => {
    if (readOnly) return;

    let eventSource: EventSource | null = null;
    try {
      eventSource = new EventSource("/api/proxy/mail/stream");
      eventSource.addEventListener("new_message", (e) => {
        try {
          const data = JSON.parse(e.data);
          toast.info(`New email from ${data.from_name || data.from_address}`, {
            description: data.subject,
          });
          fetchMessages();
          fetchCounts();
        } catch {}
      });

      eventSource.addEventListener("unread_counts", () => {
        fetchCounts();
      });
    } catch {}

    return () => {
      if (eventSource) eventSource.close();
    };
  }, [readOnly, fetchMessages, fetchCounts]);

  // 5. Message Detail on Select
  const handleSelectMessage = async (msg: MessageItem) => {
    setSelectedMessage(msg);
    try {
      const res = await fetch(`/api/proxy/mail/messages/${msg.id}`);
      const json = await res.json();
      if (res.ok && json.data) {
        setSelectedMessage(json.data);
      }
    } catch {}

    if (!readOnly && !msg.is_read) {
      try {
        await fetch(`/api/proxy/mail/messages/${msg.id}/read`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ is_read: true }),
        });
        setMessages((prev) => prev.map((m) => (m.id === msg.id ? { ...m, is_read: true } : m)));
        fetchCounts();
      } catch {}
    }
  };

  // 6. Star Toggle
  const handleToggleStar = async (id: number, currentStarred: boolean, e?: React.MouseEvent) => {
    if (e) e.stopPropagation();
    if (readOnly) return;
    try {
      const next = !currentStarred;
      await fetch(`/api/proxy/mail/messages/${id}/star`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_starred: next }),
      });
      setMessages((prev) => prev.map((m) => (m.id === id ? { ...m, is_starred: next } : m)));
      if (selectedMessage && selectedMessage.id === id) {
        setSelectedMessage((prev) => (prev ? { ...prev, is_starred: next } : null));
      }
      fetchCounts();
    } catch {
      toast.error("Failed to update star");
    }
  };

  // 7. Move Folder / Trash
  const handleMoveFolder = async (id: number, targetFolder: string) => {
    if (readOnly) return;
    try {
      if (activeFolder === "trash" && targetFolder === "trash") {
        await fetch(`/api/proxy/mail/messages/${id}`, {
          method: "DELETE",
        });
        toast.success("Message permanently deleted");
      } else {
        await fetch(`/api/proxy/mail/messages/${id}/move`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: targetFolder }),
        });
        toast.success(`Moved to ${targetFolder}`);
      }
      fetchMessages();
      fetchCounts();
      if (selectedMessage?.id === id) setSelectedMessage(null);
    } catch {
      toast.error("Failed to process message");
    }
  };

  // 8. Bulk Selection & Label Handlers (Modularized hook)
  const {
    handleToggleSelectAll,
    handleToggleSelectOne,
    handleBulkMarkRead,
    handleBulkTrash,
    handleAssignLabels,
    handleBulkAssignLabel,
  } = useMailBulkActions({
    readOnly,
    messages,
    selectedIds,
    setSelectedIds,
    activeFolder,
    selectedMessage,
    setSelectedMessage,
    setMessages,
    fetchMessages,
    fetchCounts,
    fetchLabels,
  });

  // 10. Inline Reply with Undo Send
  const handleSendReply = async () => {
    if (!selectedMessage || !inlineReplyText.trim()) return;
    setReplySending(true);
    try {
      const recipientAddr =
        selectedMessage.folder === "sent" && selectedMessage.to_json?.[0]?.address
          ? selectedMessage.to_json[0].address
          : selectedMessage.from_address;
      const recipientName =
        selectedMessage.folder === "sent" && selectedMessage.to_json?.[0]?.name
          ? selectedMessage.to_json[0].name
          : selectedMessage.from_name;
      const inReplyTo = selectedMessage.rfc_message_id || String(selectedMessage.id);

      const payload = {
        mailbox_id: selectedMailboxId || selectedMessage.mailbox_id,
        to: [{ name: recipientName, address: recipientAddr }],
        subject: selectedMessage.subject.startsWith("Re:") ? selectedMessage.subject : `Re: ${selectedMessage.subject}`,
        body_text: inlineReplyText,
        body_html: `<p>${inlineReplyText.replace(/\n/g, "<br/>")}</p>`,
        in_reply_to: inReplyTo,
      };

      const res = await fetch("/api/proxy/mail/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const json = await res.json();
      if (!res.ok) throw new Error(json.message || "Failed to dispatch reply");

      const sentMsgId = json.data?.id;
      setInlineReplyText("");

      toast.success("Reply queued! (Undoable within 8s)", {
        action: {
          label: "Undo Send",
          onClick: async () => {
            if (sentMsgId) {
              await fetch(`/api/proxy/mail/messages/${sentMsgId}/undo`, { method: "POST" });
              toast.info("Reply sending was undone and returned to drafts.");
              fetchMessages();
            }
          },
        },
        duration: 8000,
      });

      fetchMessages();
      fetchCounts();
      if (selectedMessage) {
        handleSelectMessage(selectedMessage);
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to send reply");
    } finally {
      setReplySending(false);
    }
  };

  return (
    <div
      className={cn(
        "flex flex-col bg-white overflow-hidden",
        standalone
          ? "h-screen w-screen rounded-none border-0 shadow-none fixed inset-0 z-40"
          : "h-[calc(100vh-80px)] rounded-2xl border border-ink-100 shadow-sm"
      )}
    >
      {/* Standalone Full-Screen Webmail Top Header */}
      {standalone && (
        <WebmailHeader
          mailboxes={mailboxes}
          selectedMailboxId={selectedMailboxId}
          setSelectedMailboxId={(id) => setSelectedMailboxId(id)}
          searchQuery={searchQuery}
          setSearchQuery={setSearchQuery}
          onOpenCompose={handleOpenNewCompose}
          scope={scope}
          onOpenMobileFolders={() => setMobileFoldersOpen(true)}
        />
      )}

      {/* Read-Only Admin Alert Banner */}
      {readOnly && (
        <div className="px-6 py-3 bg-brand-500/20 border-b border-brand-500/40 flex items-center justify-between text-ink-900 select-none">
          <div className="flex items-center gap-2.5">
            <AlertTriangle className="w-5 h-5 text-ink-900 flex-shrink-0" />
            <div>
              <span className="font-bold text-xs uppercase tracking-wider text-ink-900 mr-2">
                Audit Monitored View:
              </span>
              <span className="text-xs font-semibold text-ink-800">
                You are inspecting talent mailbox{" "}
                <code className="px-1.5 py-0.5 bg-brand-500/30 rounded font-mono font-bold">
                  {monitoredMailboxAddress || "selected box"}
                </code>{" "}
                ({monitoredTalentName || "Talent Account"}). This action is logged permanently to the audit log.
              </span>
            </div>
          </div>
          <span className="text-[11px] font-bold px-2 py-1 rounded bg-brand-500 text-ink-900">READ-ONLY</span>
        </div>
      )}

      {/* Mobile Slide-Over Folders Drawer */}
      <div
        className={cn(
          "fixed inset-0 z-50 lg:hidden flex transition-all duration-300",
          mobileFoldersOpen ? "pointer-events-auto visible" : "pointer-events-none invisible"
        )}
      >
        <div
          className={cn(
            "fixed inset-0 bg-ink-900/50 transition-opacity duration-300 ease-in-out",
            mobileFoldersOpen ? "opacity-100" : "opacity-0"
          )}
          onClick={() => setMobileFoldersOpen(false)}
        />
        <div
          className={cn(
            "relative w-72 bg-[#FAFAFA] flex flex-col z-10 shadow-2xl transition-transform duration-300 ease-in-out h-full",
            mobileFoldersOpen ? "translate-x-0" : "-translate-x-full"
          )}
        >
          <MailSidebar
            scope={scope}
            readOnly={readOnly}
            mailboxes={mailboxes}
            selectedMailboxId={selectedMailboxId}
            onSelectMailbox={(id) => setSelectedMailboxId(id)}
            activeFolder={activeFolder}
            onSelectFolder={(f) => {
              setActiveFolder(f);
              setActiveLabelId(null);
              setSelectedMessage(null);
              setMobileFoldersOpen(false);
            }}
            folderCounts={folderCounts}
            labels={labels}
            activeLabelId={activeLabelId}
            onSelectLabel={(id) => {
              setActiveLabelId(id);
              setActiveFolder("");
              setSelectedMessage(null);
              setMobileFoldersOpen(false);
            }}
            onOpenCompose={() => {
              setMobileFoldersOpen(false);
              handleOpenNewCompose();
            }}
            onOpenAddMailbox={() => {
              setMobileFoldersOpen(false);
              setShowAddMailbox(true);
            }}
            onManageMailboxes={() => {
              setMobileFoldersOpen(false);
              setShowManageMailboxes(true);
            }}
            onOpenManageLabels={() => {
              setMobileFoldersOpen(false);
              setShowManageLabels(true);
            }}
            onOpenManageSubscriptions={() => {
              setMobileFoldersOpen(false);
              setShowManageSubscriptions(true);
            }}
            isMobileDrawer={true}
            onCloseMobileDrawer={() => setMobileFoldersOpen(false)}
          />
        </div>
      </div>

      {/* Main 3-Column Split */}
      <div className="flex-1 flex overflow-hidden relative">
        {/* Left Column: Sidebar & Folders (Desktop Only) */}
        <MailSidebar
          scope={scope}
          readOnly={readOnly}
          mailboxes={mailboxes}
          selectedMailboxId={selectedMailboxId}
          onSelectMailbox={(id) => setSelectedMailboxId(id)}
          activeFolder={activeFolder}
          onSelectFolder={(f) => {
            setActiveFolder(f);
            setActiveLabelId(null);
            setSelectedMessage(null);
          }}
          folderCounts={folderCounts}
          labels={labels}
          activeLabelId={activeLabelId}
          onSelectLabel={(id) => {
            setActiveLabelId(id);
            setActiveFolder("");
            setSelectedMessage(null);
          }}
          onOpenCompose={handleOpenNewCompose}
          onOpenAddMailbox={() => setShowAddMailbox(true)}
          onManageMailboxes={() => setShowManageMailboxes(true)}
          onOpenManageLabels={() => setShowManageLabels(true)}
          onOpenManageSubscriptions={() => setShowManageSubscriptions(true)}
          isMobileDrawer={false}
        />

        {/* Center Column: Message List Pane (full width on mobile if no message selected, hidden on mobile if message selected) */}
        <div
          className={cn(
            "h-full overflow-hidden flex flex-col",
            selectedMessage ? "hidden lg:flex" : "flex w-full lg:w-auto"
          )}
        >
          <MailMessageList
            messages={messages}
            loading={loading}
            selectedMessage={selectedMessage}
            selectedIds={selectedIds}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            activeFolder={activeFolder}
            readOnly={readOnly}
            labels={labels}
            onSelectMessage={handleSelectMessage}
            onToggleSelectAll={handleToggleSelectAll}
            onToggleSelectOne={handleToggleSelectOne}
            onToggleStar={handleToggleStar}
            onBulkMarkRead={handleBulkMarkRead}
            onBulkTrash={handleBulkTrash}
            onBulkAssignLabel={handleBulkAssignLabel}
            onRefresh={() => {
              fetchMessages();
              fetchCounts();
            }}
            onOpenMobileFolders={standalone ? undefined : () => setMobileFoldersOpen(true)}
          />
        </div>

        {/* Right Column: Reading Pane (hidden on mobile if no message selected, full width on mobile if message selected) */}
        <div
          className={cn(
            "flex-1 h-full overflow-hidden flex flex-col",
            selectedMessage ? "flex" : "hidden lg:flex"
          )}
        >
          <MailReadingPane
            selectedMessage={selectedMessage}
            readOnly={readOnly}
            allLabels={labels}
            mailboxes={mailboxes}
            selectedMailboxId={selectedMailboxId}
            onSelectMailbox={(id) => setSelectedMailboxId(id)}
            onAssignLabels={handleAssignLabels}
            onBack={() => setSelectedMessage(null)}
            onReply={(to, subj, quotedHtml, originalAtts, initialCc, inReplyTo, mailboxId) => {
              setEditingDraft(null);
              setComposeInitialMailboxId(mailboxId || selectedMailboxId || undefined);
              setComposeInitialTo(to);
              setComposeInitialCc(initialCc || "");
              setComposeInitialBcc("");
              setComposeInitialSubject(subj);
              setComposeInitialBodyHtml(quotedHtml || "");
              setComposeInitialInReplyTo(inReplyTo || "");
              setComposeInitialAttachments(
                (originalAtts || []).map((a: any) => ({
                  id: a.id,
                  original_name: a.original_name || a.filename || "attachment",
                  size_bytes: a.size_bytes,
                  mime: a.mime || "application/octet-stream",
                  download_url: a.download_url,
                }))
              );
              setShowCompose(true);
            }}
            onForward={(subj, quotedHtml, originalAtts, mailboxId) => {
              setEditingDraft(null);
              setComposeInitialMailboxId(mailboxId || selectedMailboxId || undefined);
              setComposeInitialTo("");
              setComposeInitialCc("");
              setComposeInitialBcc("");
              setComposeInitialSubject(subj);
              setComposeInitialBodyHtml(quotedHtml || "");
              setComposeInitialAttachments(
                (originalAtts || []).map((a: any) => ({
                  id: a.id,
                  original_name: a.original_name || a.filename || "attachment",
                  size_bytes: a.size_bytes,
                  mime: a.mime || "application/octet-stream",
                  download_url: a.download_url,
                }))
              );
              setShowCompose(true);
            }}
            onEditDraft={handleEditDraft}
            onSnooze={(id) => setSnoozeTargetId(id)}
            onToggleStar={(id, star) => handleToggleStar(id, star)}
            onMoveFolder={(id, fld) => handleMoveFolder(id, fld)}
            inlineReplyText={inlineReplyText}
            setInlineReplyText={setInlineReplyText}
            replySending={replySending}
            onSendReply={handleSendReply}
          />
        </div>
      </div>

      {/* Modals */}
      <MailModals
        scope={scope}
        mailboxes={mailboxes}
        selectedMailboxId={selectedMailboxId}
        labels={labels}
        selectedMessage={selectedMessage}
        setSelectedMessage={setSelectedMessage}
        showCompose={showCompose}
        setShowCompose={setShowCompose}
        editingDraft={editingDraft}
        setEditingDraft={setEditingDraft}
        composeInitialTo={composeInitialTo}
        setComposeInitialTo={setComposeInitialTo}
        composeInitialCc={composeInitialCc}
        setComposeInitialCc={setComposeInitialCc}
        composeInitialBcc={composeInitialBcc}
        setComposeInitialBcc={setComposeInitialBcc}
        composeInitialSubject={composeInitialSubject}
        setComposeInitialSubject={setComposeInitialSubject}
        composeInitialBodyHtml={composeInitialBodyHtml}
        setComposeInitialBodyHtml={setComposeInitialBodyHtml}
        composeInitialInReplyTo={composeInitialInReplyTo}
        setComposeInitialInReplyTo={setComposeInitialInReplyTo}
        composeInitialMailboxId={composeInitialMailboxId}
        setComposeInitialMailboxId={setComposeInitialMailboxId}
        composeInitialAttachments={composeInitialAttachments}
        setComposeInitialAttachments={setComposeInitialAttachments}
        showAddMailbox={showAddMailbox}
        setShowAddMailbox={setShowAddMailbox}
        showManageMailboxes={showManageMailboxes}
        setShowManageMailboxes={setShowManageMailboxes}
        showManageLabels={showManageLabels}
        setShowManageLabels={setShowManageLabels}
        showManageSubscriptions={showManageSubscriptions}
        setShowManageSubscriptions={setShowManageSubscriptions}
        snoozeTargetId={snoozeTargetId}
        setSnoozeTargetId={setSnoozeTargetId}
        fetchMailboxes={fetchMailboxes}
        fetchCounts={fetchCounts}
        fetchMessages={fetchMessages}
        fetchLabels={fetchLabels}
      />
    </div>
  );
}
