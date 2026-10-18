package models

import "time"

type MailThread struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	MailboxID     uint64    `gorm:"not null;index:idx_thread_mailbox_last_msg;index:idx_thread_mailbox_subj" json:"mailbox_id"`
	Mailbox       *Mailbox  `gorm:"foreignKey:MailboxID;constraint:OnDelete:CASCADE" json:"mailbox,omitempty"`
	SubjectNorm   string    `gorm:"type:varchar(255);not null;index:idx_thread_mailbox_subj" json:"subject_norm"`
	LastMessageAt time.Time `gorm:"not null;index:idx_thread_mailbox_last_msg" json:"last_message_at"`
	MessageCount  int       `gorm:"not null;default:1" json:"message_count"`
	CreatedAt     time.Time `json:"created_at"`
	UpdatedAt     time.Time `json:"updated_at"`
}

func (MailThread) TableName() string {
	return "mail_threads"
}
