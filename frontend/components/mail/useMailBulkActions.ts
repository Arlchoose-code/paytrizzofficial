"use client";

import { toast } from "sonner";
import type { MessageItem } from "@/types/mail";

interface UseMailBulkActionsProps {
  readOnly: boolean;
  messages: MessageItem[];
  selectedIds: number[];
  setSelectedIds: React.Dispatch<React.SetStateAction<number[]>>;
  activeFolder: string;
  selectedMessage: MessageItem | null;
  setSelectedMessage: (msg: MessageItem | null) => void;
  setMessages: React.Dispatch<React.SetStateAction<MessageItem[]>>;
  fetchMessages: () => void;
  fetchCounts: () => void;
  fetchLabels: () => void;
}

export function useMailBulkActions({
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
}: UseMailBulkActionsProps) {
  const handleToggleSelectAll = () => {
    if (selectedIds.length === messages.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(messages.map((m) => m.id));
    }
  };

  const handleToggleSelectOne = (id: number, e: React.MouseEvent) => {
    e.stopPropagation();
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]));
  };

  const handleBulkMarkRead = async (isRead: boolean) => {
    if (readOnly || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      await fetch(`/api/proxy/mail/messages/${id}/read`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ is_read: isRead }),
      }).catch(() => {});
    }
    toast.success(`Marked ${selectedIds.length} messages as ${isRead ? "read" : "unread"}`);
    setSelectedIds([]);
    fetchMessages();
    fetchCounts();
  };

  const handleBulkTrash = async () => {
    if (readOnly || selectedIds.length === 0) return;
    const isPermanent = activeFolder === "trash";
    for (const id of selectedIds) {
      if (isPermanent) {
        await fetch(`/api/proxy/mail/messages/${id}`, {
          method: "DELETE",
        }).catch(() => {});
      } else {
        await fetch(`/api/proxy/mail/messages/${id}/move`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ folder: "trash" }),
        }).catch(() => {});
      }
    }
    toast.success(
      isPermanent
        ? `Permanently deleted ${selectedIds.length} messages`
        : `Moved ${selectedIds.length} messages to trash`
    );
    setSelectedIds([]);
    fetchMessages();
    fetchCounts();
    setSelectedMessage(null);
  };

  const handleAssignLabels = async (messageId: number, labelIds: number[]) => {
    if (readOnly) return;
    try {
      const res = await fetch(`/api/proxy/mail/messages/${messageId}/labels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label_ids: labelIds }),
      });
      const json = await res.json();
      if (!res.ok || !json.success) throw new Error(json.message || "Failed to update labels");
      const updatedLabels = json.data || [];
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, labels: updatedLabels } : m))
      );
      if (selectedMessage && selectedMessage.id === messageId) {
        setSelectedMessage({ ...selectedMessage, labels: updatedLabels });
      }
      toast.success("Labels updated");
      fetchLabels();
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Failed to update labels");
    }
  };

  const handleBulkAssignLabel = async (labelId: number) => {
    if (readOnly || selectedIds.length === 0) return;
    for (const id of selectedIds) {
      const target = messages.find((m) => m.id === id);
      const current = (target?.labels || []).map((l) => l.id);
      const next = current.includes(labelId) ? current.filter((i) => i !== labelId) : [...current, labelId];
      await fetch(`/api/proxy/mail/messages/${id}/labels`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ label_ids: next }),
      }).catch(() => {});
    }
    toast.success(`Updated labels on ${selectedIds.length} messages`);
    setSelectedIds([]);
    fetchMessages();
    fetchLabels();
  };

  return {
    handleToggleSelectAll,
    handleToggleSelectOne,
    handleBulkMarkRead,
    handleBulkTrash,
    handleAssignLabels,
    handleBulkAssignLabel,
  };
}
