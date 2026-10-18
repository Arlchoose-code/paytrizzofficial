"use client";

import { MailComposeModal } from "./MailComposeModal";
import { AddMailboxModal } from "./AddMailboxModal";
import { ManageMailboxesModal } from "./ManageMailboxesModal";
import { ManageLabelsModal } from "./ManageLabelsModal";
import { ManageSubscriptionsModal } from "./ManageSubscriptionsModal";
import { SnoozeModal } from "./SnoozeModal";
import type { MailboxItem, MailLabel } from "./MailSidebar";
import type { MessageItem } from "@/types/mail";

interface MailModalsProps {
  scope: "company" | "talent";
  mailboxes: MailboxItem[];
  selectedMailboxId: number | null;
  labels: MailLabel[];
  selectedMessage: MessageItem | null;
  setSelectedMessage: (msg: MessageItem | null) => void;
  showCompose: boolean;
  setShowCompose: (show: boolean) => void;
  editingDraft: MessageItem | null;
  setEditingDraft: (draft: MessageItem | null) => void;
  composeInitialTo: string;
  setComposeInitialTo: (to: string) => void;
  composeInitialCc: string;
  setComposeInitialCc: (cc: string) => void;
  composeInitialBcc: string;
  setComposeInitialBcc: (bcc: string) => void;
  composeInitialSubject: string;
  setComposeInitialSubject: (subj: string) => void;
  composeInitialBodyHtml: string;
  setComposeInitialBodyHtml: (html: string) => void;
  composeInitialInReplyTo?: string;
  setComposeInitialInReplyTo?: (ref: string) => void;
  composeInitialAttachments: any[];
  setComposeInitialAttachments: (atts: any[]) => void;
  showAddMailbox: boolean;
  setShowAddMailbox: (show: boolean) => void;
  showManageMailboxes: boolean;
  setShowManageMailboxes: (show: boolean) => void;
  showManageLabels: boolean;
  setShowManageLabels: (show: boolean) => void;
  showManageSubscriptions: boolean;
  setShowManageSubscriptions: (show: boolean) => void;
  snoozeTargetId: number | null;
  setSnoozeTargetId: (id: number | null) => void;
  fetchMailboxes: () => void;
  fetchCounts: () => void;
  fetchMessages: () => void;
  fetchLabels: () => void;
}

export function MailModals({
  scope,
  mailboxes,
  selectedMailboxId,
  labels,
  selectedMessage,
  setSelectedMessage,
  showCompose,
  setShowCompose,
  editingDraft,
  setEditingDraft,
  composeInitialTo,
  setComposeInitialTo,
  composeInitialCc,
  setComposeInitialCc,
  composeInitialBcc,
  setComposeInitialBcc,
  composeInitialSubject,
  setComposeInitialSubject,
  composeInitialBodyHtml,
  setComposeInitialBodyHtml,
  composeInitialInReplyTo = "",
  setComposeInitialInReplyTo,
  composeInitialAttachments,
  setComposeInitialAttachments,
  showAddMailbox,
  setShowAddMailbox,
  showManageMailboxes,
  setShowManageMailboxes,
  showManageLabels,
  setShowManageLabels,
  showManageSubscriptions,
  setShowManageSubscriptions,
  snoozeTargetId,
  setSnoozeTargetId,
  fetchMailboxes,
  fetchCounts,
  fetchMessages,
  fetchLabels,
}: MailModalsProps) {
  return (
    <>
      {showCompose && (
        <MailComposeModal
          mailboxes={mailboxes}
          defaultMailboxId={editingDraft?.mailbox_id || selectedMailboxId || undefined}
          initialDraftId={editingDraft?.id}
          initialTo={composeInitialTo}
          initialCc={composeInitialCc}
          initialBcc={composeInitialBcc}
          initialSubject={composeInitialSubject}
          initialBodyHtml={composeInitialBodyHtml}
          initialInReplyTo={composeInitialInReplyTo}
          initialAttachments={composeInitialAttachments}
          onClose={() => {
            setShowCompose(false);
            setEditingDraft(null);
            setComposeInitialTo("");
            setComposeInitialCc("");
            setComposeInitialBcc("");
            setComposeInitialSubject("");
            setComposeInitialBodyHtml("");
            setComposeInitialInReplyTo?.("");
            setComposeInitialAttachments([]);
          }}
          onSent={() => {
            fetchMessages();
            fetchCounts();
          }}
        />
      )}

      {showAddMailbox && (
        <AddMailboxModal
          scope={scope}
          onClose={() => setShowAddMailbox(false)}
          onCreated={() => {
            fetchMailboxes();
            fetchCounts();
          }}
        />
      )}

      {showManageMailboxes && (
        <ManageMailboxesModal
          scope={scope}
          mailboxes={mailboxes}
          onClose={() => setShowManageMailboxes(false)}
          onChanged={() => {
            fetchMailboxes();
            fetchCounts();
            fetchMessages();
          }}
        />
      )}

      {showManageLabels && (
        <ManageLabelsModal
          labels={labels}
          onClose={() => setShowManageLabels(false)}
          onChanged={() => {
            fetchLabels();
            fetchMessages();
          }}
        />
      )}

      {showManageSubscriptions && (
        <ManageSubscriptionsModal
          onClose={() => setShowManageSubscriptions(false)}
        />
      )}

      {snoozeTargetId && (
        <SnoozeModal
          messageId={snoozeTargetId}
          onClose={() => setSnoozeTargetId(null)}
          onSnoozed={() => {
            fetchMessages();
            fetchCounts();
            if (selectedMessage?.id === snoozeTargetId) setSelectedMessage(null);
          }}
        />
      )}
    </>
  );
}
