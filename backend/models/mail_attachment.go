package models

import "time"

type MailAttachment struct {
	ID             uint64       `gorm:"primaryKey;autoIncrement" json:"id"`
	MessageID      *uint64      `gorm:"index" json:"message_id,omitempty"`
	Message        *MailMessage `gorm:"foreignKey:MessageID;constraint:OnDelete:CASCADE" json:"-"`
	UploaderUserID *uint64      `gorm:"index" json:"uploader_user_id,omitempty"`
	OriginalName   string       `gorm:"type:varchar(255);not null" json:"original_name"`
	StoredName     string       `gorm:"type:varchar(64);not null;uniqueIndex" json:"stored_name"`
	Mime           string       `gorm:"type:varchar(100);not null" json:"mime"`
	SizeBytes      int64        `gorm:"not null" json:"size_bytes"`
	SHA256         string       `gorm:"type:char(64);not null" json:"sha256"`
	ContentID      *string      `gorm:"type:varchar(190)" json:"content_id"`
	IsInline       bool         `gorm:"not null;default:false" json:"is_inline"`
	IsBlocked      bool         `gorm:"not null;default:false" json:"is_blocked"`
	CreatedAt      time.Time    `json:"created_at"`
	UpdatedAt      time.Time    `json:"updated_at"`
}

func (MailAttachment) TableName() string {
	return "mail_attachments"
}
