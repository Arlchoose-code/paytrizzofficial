package models

import (
	"time"
)

type EmailOutbox struct {
	ID            uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	TemplateKey   *string    `gorm:"type:varchar(60)" json:"template_key"`
	ToEmail       string     `gorm:"type:varchar(190);not null" json:"to_email"`
	ToName        *string    `gorm:"type:varchar(120)" json:"to_name"`
	Subject       string     `gorm:"type:varchar(190);not null" json:"subject"`
	BodyHTML      string     `gorm:"type:longtext;not null" json:"body_html"`
	BodyText      string     `gorm:"type:longtext;not null" json:"body_text"`
	ReplyTo       *string    `gorm:"type:varchar(190)" json:"reply_to"`
	RelatedType   *string    `gorm:"type:varchar(40)" json:"related_type"`
	RelatedID     *uint64    `json:"related_id"`
	Status        string     `gorm:"type:enum('pending','sending','sent','failed','cancelled');default:'pending';not null;index" json:"status"`
	Attempts      uint8      `gorm:"default:0;not null" json:"attempts"`
	NextAttemptAt time.Time  `gorm:"index;not null" json:"next_attempt_at"`
	SESMessageID  *string    `gorm:"type:varchar(100)" json:"ses_message_id"`
	LastError     *string    `gorm:"type:text" json:"last_error"`
	SentAt        *time.Time `json:"sent_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}

func (EmailOutbox) TableName() string {
	return "email_outbox"
}
