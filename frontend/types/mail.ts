export interface MailAddress {
  name: string;
  address: string;
}

export interface MailAttachmentItem {
  id: number;
  filename?: string;
  original_name?: string;
  size_bytes: number;
  file_path?: string;
  download_url?: string;
  mime?: string;
  is_inline?: boolean;
}

export interface MailLabelItem {
  id: number;
  name: string;
  color: string;
}

export interface MailboxItem {
  id: number;
  address: string;
  display_name: string;
  color: string;
  unread_count: number;
  is_primary?: boolean;
}

export interface MessageItem {
  id: number;
  mailbox_id: number;
  from_address: string;
  from_name: string;
  to_json: MailAddress[];
  cc_json?: MailAddress[];
  bcc_json?: MailAddress[];
  reply_to_json?: MailAddress[];
  subject: string;
  snippet: string;
  body_text: string;
  body_html?: string;
  folder: string;
  state: string;
  direction: string;
  has_attachments: boolean;
  is_read: boolean;
  is_starred: boolean;
  snoozed_until?: string;
  scheduled_at?: string;
  sort_at: string;
  spf_verdict?: string;
  dkim_verdict?: string;
  delivery_status?: string;
  delivery_detail?: string;
  labels?: MailLabelItem[];
  attachments?: MailAttachmentItem[];
  thread_id?: number | null;
  rfc_message_id?: string;
  in_reply_to?: string;
  references_hdr?: string;
  thread_messages?: MessageItem[];
}
