package structs

import (
	"paytrizz-backend/models"
	"time"
)

type MailComposeRequest struct {
	MailboxID     uint64                 `json:"mailbox_id" binding:"required"`
	To            models.MailAddressList `json:"to"`
	Cc            models.MailAddressList `json:"cc"`
	Bcc           models.MailAddressList `json:"bcc"`
	ReplyTo       models.MailAddressList `json:"reply_to"`
	Subject       string                 `json:"subject" binding:"max=998"`
	BodyText      string                 `json:"body_text"`
	BodyHTML      *string                `json:"body_html"`
	InReplyTo     *string                `json:"in_reply_to"`
	ReferencesHDR *string                `json:"references_hdr"`
	ScheduledAt   *time.Time             `json:"scheduled_at"`
	IsDraft       bool                   `json:"is_draft"`
	AttachmentIDs []uint64               `json:"attachment_ids"`
}

type MailFolderMoveRequest struct {
	Folder string `json:"folder" binding:"required,oneof=inbox sent drafts spam trash"`
}

type MailSnoozeRequest struct {
	SnoozedUntil time.Time `json:"snoozed_until" binding:"required"`
}

type MailStarRequest struct {
	IsStarred bool `json:"is_starred"`
}

type MailReadRequest struct {
	IsRead bool `json:"is_read"`
}

type MailMessageResponse struct {
	ID             uint64                    `json:"id"`
	MailboxID      uint64                    `json:"mailbox_id"`
	MailboxAddress string                    `json:"mailbox_address,omitempty"`
	MailboxName    string                    `json:"mailbox_name,omitempty"`
	ThreadID       *uint64                   `json:"thread_id"`
	Direction      models.MailDirection      `json:"direction"`
	Folder         models.MailFolder         `json:"folder"`
	State          models.MailState          `json:"state"`
	RFCMessageID   *string                   `json:"rfc_message_id"`
	InReplyTo      *string                   `json:"in_reply_to"`
	FromAddress    string                    `json:"from_address"`
	FromName       string                    `json:"from_name"`
	To             models.MailAddressList    `json:"to"`
	Cc             models.MailAddressList    `json:"cc"`
	Bcc            models.MailAddressList    `json:"bcc"`
	Subject        string                    `json:"subject"`
	Snippet        string                    `json:"snippet"`
	BodyText       string                    `json:"body_text"`
	BodyHTML       *string                   `json:"body_html"`
	HasAttachments bool                      `json:"has_attachments"`
	IsRead         bool                      `json:"is_read"`
	IsStarred      bool                      `json:"is_starred"`
	SnoozedUntil   *time.Time                `json:"snoozed_until"`
	ScheduledAt    *time.Time                `json:"scheduled_at"`
	SendAfter      *time.Time                `json:"send_after"`
	SentAt         *time.Time                `json:"sent_at"`
	ReceivedAt     *time.Time                `json:"received_at"`
	SortAt         time.Time                 `json:"sort_at"`
	DeliveryStatus models.MailDeliveryStatus `json:"delivery_status"`
	DeliveryDetail *string                   `json:"delivery_detail"`
	SizeBytes      int                       `json:"size_bytes"`
	Attachments    []MailAttachmentResponse  `json:"attachments,omitempty"`
	Labels         []MailLabelResponse       `json:"labels,omitempty"`
	ThreadMessages []MailMessageResponse     `json:"thread_messages,omitempty"`
	CreatedAt      time.Time                 `json:"created_at"`
	UpdatedAt      time.Time                 `json:"updated_at"`
}

type MailAttachmentResponse struct {
	ID           uint64  `json:"id"`
	MessageID    *uint64 `json:"message_id,omitempty"`
	OriginalName string  `json:"original_name"`
	Filename     string  `json:"filename,omitempty"`
	StoredName   string  `json:"stored_name"`
	Mime         string  `json:"mime"`
	SizeBytes    int64   `json:"size_bytes"`
	DownloadURL  string  `json:"download_url,omitempty"`
	IsInline     bool    `json:"is_inline"`
	IsBlocked    bool    `json:"is_blocked"`
}

type MailFolderCountsResponse struct {
	Inbox     int `json:"inbox"`
	Starred   int `json:"starred"`
	Snoozed   int `json:"snoozed"`
	Sent      int `json:"sent"`
	Drafts    int `json:"drafts"`
	Scheduled int `json:"scheduled"`
	AllMail   int `json:"all_mail"`
	Spam      int `json:"spam"`
	Trash     int `json:"trash"`
}
