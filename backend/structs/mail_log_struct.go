package structs

import (
	"paytrizz-backend/models"
	"time"
)

type MailLogResponse struct {
	ID             uint64              `json:"id"`
	Event          models.MailLogEvent `json:"event"`
	ActorUserID    *uint64             `json:"actor_user_id"`
	ActorName      *string             `json:"actor_name,omitempty"`
	MailboxID      *uint64             `json:"mailbox_id"`
	MailboxAddress *string             `json:"mailbox_address"`
	TalentUserID   *uint64             `json:"talent_user_id"`
	MessageID      *uint64             `json:"message_id"`
	IP             *string             `json:"ip"`
	UserAgent      *string             `json:"user_agent"`
	Meta           *string             `json:"meta"`
	CreatedAt      time.Time           `json:"created_at"`
}
