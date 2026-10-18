package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type MailDirection string

const (
	MailDirectionInbound  MailDirection = "inbound"
	MailDirectionOutbound MailDirection = "outbound"
	MailDirectionInternal MailDirection = "internal"
)

type MailFolder string

const (
	MailFolderInbox  MailFolder = "inbox"
	MailFolderSent   MailFolder = "sent"
	MailFolderDrafts MailFolder = "drafts"
	MailFolderSpam   MailFolder = "spam"
	MailFolderTrash  MailFolder = "trash"
)

type MailState string

const (
	MailStateDraft     MailState = "draft"
	MailStateScheduled MailState = "scheduled"
	MailStateQueued    MailState = "queued"
	MailStateSending   MailState = "sending"
	MailStateSent      MailState = "sent"
	MailStateReceived  MailState = "received"
	MailStateFailed    MailState = "failed"
)

type MailDeliveryStatus string

const (
	MailDeliveryNone       MailDeliveryStatus = "none"
	MailDeliverySending    MailDeliveryStatus = "sending"
	MailDeliveryDelivered  MailDeliveryStatus = "delivered"
	MailDeliveryBounced    MailDeliveryStatus = "bounced"
	MailDeliveryComplained MailDeliveryStatus = "complained"
	MailDeliveryFailed     MailDeliveryStatus = "failed"
)

// MailAddressJSON represents recipient information in JSON arrays
type MailAddressJSON struct {
	Name    string `json:"name"`
	Address string `json:"address"`
}

type MailAddressList []MailAddressJSON

func (a MailAddressList) Value() (driver.Value, error) {
	if len(a) == 0 {
		return "[]", nil
	}
	return json.Marshal(a)
}

func (a *MailAddressList) Scan(value interface{}) error {
	if value == nil {
		*a = []MailAddressJSON{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		str, okStr := value.(string)
		if !okStr {
			return errors.New("cannot scan MailAddressList")
		}
		bytes = []byte(str)
	}
	return json.Unmarshal(bytes, a)
}

type MailMessage struct {
	ID              uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	MailboxID       uint64             `gorm:"not null;index:idx_mail_box_folder_sort;index:idx_mail_box_star_sort;index:idx_mail_box_read_folder;index:idx_mail_box_snooze" json:"mailbox_id"`
	Mailbox         *Mailbox           `gorm:"foreignKey:MailboxID;constraint:OnDelete:CASCADE" json:"mailbox,omitempty"`
	ThreadID        *uint64            `gorm:"index" json:"thread_id"`
	Thread          *MailThread        `gorm:"foreignKey:ThreadID;constraint:OnDelete:SET NULL" json:"thread,omitempty"`
	Direction       MailDirection      `gorm:"type:enum('inbound','outbound','internal');not null" json:"direction"`
	Folder          MailFolder         `gorm:"type:enum('inbox','sent','drafts','spam','trash');not null;index:idx_mail_box_folder_sort;index:idx_mail_box_read_folder" json:"folder"`
	State           MailState          `gorm:"type:enum('draft','scheduled','queued','sending','sent','received','failed');not null;default:'received';index" json:"state"`
	RFCMessageID    *string            `gorm:"type:varchar(255);index" json:"rfc_message_id"`
	InReplyTo       *string            `gorm:"type:varchar(255)" json:"in_reply_to"`
	ReferencesHDR   *string            `gorm:"type:text" json:"references_hdr"`
	SESMessageID    *string            `gorm:"type:varchar(100);index" json:"ses_message_id"`
	FromAddress     string             `gorm:"type:varchar(255);not null;index" json:"from_address"`
	FromName        string             `gorm:"type:varchar(255);not null;default:''" json:"from_name"`
	ToJSON          MailAddressList    `gorm:"type:json;not null" json:"to_json"`
	CcJSON          MailAddressList    `gorm:"type:json" json:"cc_json"`
	BccJSON         MailAddressList    `gorm:"type:json" json:"bcc_json"`
	ReplyToJSON     MailAddressList    `gorm:"type:json" json:"reply_to_json"`
	Subject         string             `gorm:"type:varchar(998);not null" json:"subject"`
	Snippet         string             `gorm:"type:varchar(255);not null;default:''" json:"snippet"`
	BodyText        string             `gorm:"type:longtext;not null" json:"body_text"`
	BodyHTML        *string            `gorm:"type:longtext" json:"body_html"`
	HasAttachments  bool               `gorm:"not null;default:false" json:"has_attachments"`
	IsRead          bool               `gorm:"not null;default:false;index:idx_mail_box_read_folder" json:"is_read"`
	IsStarred       bool               `gorm:"not null;default:false;index:idx_mail_box_star_sort" json:"is_starred"`
	SnoozedUntil    *time.Time         `gorm:"index:idx_mail_box_snooze" json:"snoozed_until"`
	ScheduledAt     *time.Time         `gorm:"index" json:"scheduled_at"`
	SendAfter       *time.Time         `gorm:"index" json:"send_after"`
	SentAt          *time.Time         `json:"sent_at"`
	ReceivedAt      *time.Time         `json:"received_at"`
	SortAt          time.Time          `gorm:"not null;index:idx_mail_box_folder_sort;index:idx_mail_box_star_sort" json:"sort_at"`
	DeliveryStatus  MailDeliveryStatus `gorm:"type:enum('none','sending','delivered','bounced','complained','failed');default:'none'" json:"delivery_status"`
	DeliveryDetail  *string            `gorm:"type:varchar(255)" json:"delivery_detail"`
	SpamVerdict     *string            `gorm:"type:varchar(12)" json:"spam_verdict"`
	VirusVerdict    *string            `gorm:"type:varchar(12)" json:"virus_verdict"`
	SPFVerdict      *string            `gorm:"type:varchar(12)" json:"spf_verdict"`
	DKIMVerdict     *string            `gorm:"type:varchar(12)" json:"dkim_verdict"`
	DMARCVerdict    *string            `gorm:"type:varchar(12)" json:"dmarc_verdict"`
	SizeBytes       int                `gorm:"not null;default:0" json:"size_bytes"`
	OriginalFolder  *string            `gorm:"type:varchar(10)" json:"original_folder"`
	TrashedAt       *time.Time         `json:"trashed_at"`
	CreatedAt       time.Time          `json:"created_at"`
	UpdatedAt       time.Time          `json:"updated_at"`

	// Relasi
	Attachments    []MailAttachment `gorm:"foreignKey:MessageID" json:"attachments,omitempty"`
	Labels         []MailLabel      `gorm:"many2many:mail_message_labels;joinForeignKey:MessageID;joinReferences:LabelID" json:"labels,omitempty"`
	ThreadMessages []MailMessage    `gorm:"-" json:"thread_messages,omitempty"`
}

func (MailMessage) TableName() string {
	return "mail_messages"
}
