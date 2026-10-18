package structs

import (
	"paytrizz-backend/models"
	"time"
)

type MailSubscriptionResponse struct {
	ID                uint64                    `json:"id"`
	MailboxID         uint64                    `json:"mailbox_id"`
	SenderAddress     string                    `json:"sender_address"`
	SenderName        *string                   `json:"sender_name"`
	ListID            *string                   `json:"list_id"`
	UnsubscribeHTTP   *string                   `json:"unsubscribe_http"`
	UnsubscribeMailto *string                   `json:"unsubscribe_mailto"`
	OneClick          bool                      `json:"one_click"`
	MessageCount      int                       `json:"message_count"`
	LastReceivedAt    time.Time                 `json:"last_received_at"`
	Status            models.SubscriptionStatus `json:"status"`
	UnsubscribedAt    *time.Time                `json:"unsubscribed_at"`
	CreatedAt         time.Time                 `json:"created_at"`
}
