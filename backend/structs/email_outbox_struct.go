package structs

import (
	"time"
)

type EmailOutboxResponse struct {
	ID            uint64     `json:"id"`
	TemplateKey   *string    `json:"template_key"`
	ToEmail       string     `json:"to_email"`
	ToName        *string    `json:"to_name"`
	Subject       string     `json:"subject"`
	BodyHTML      string     `json:"body_html"`
	BodyText      string     `json:"body_text"`
	ReplyTo       *string    `json:"reply_to"`
	RelatedType   *string    `json:"related_type"`
	RelatedID     *uint64    `json:"related_id"`
	Status        string     `json:"status"`
	Attempts      uint8      `json:"attempts"`
	NextAttemptAt time.Time  `json:"next_attempt_at"`
	SESMessageID  *string    `json:"ses_message_id"`
	LastError     *string    `json:"last_error"`
	SentAt        *time.Time `json:"sent_at"`
	CreatedAt     time.Time  `json:"created_at"`
	UpdatedAt     time.Time  `json:"updated_at"`
}
