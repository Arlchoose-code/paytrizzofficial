package models

import "time"

type SubscriptionStatus string

const (
	SubscriptionStatusActive       SubscriptionStatus = "active"
	SubscriptionStatusUnsubscribed SubscriptionStatus = "unsubscribed"
	SubscriptionStatusBlocked      SubscriptionStatus = "blocked"
)

type MailSubscription struct {
	ID                uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	MailboxID         uint64             `gorm:"not null;uniqueIndex:idx_sub_box_sender" json:"mailbox_id"`
	Mailbox           *Mailbox           `gorm:"foreignKey:MailboxID;constraint:OnDelete:CASCADE" json:"-"`
	SenderAddress     string             `gorm:"type:varchar(255);not null;uniqueIndex:idx_sub_box_sender" json:"sender_address"`
	SenderName        *string            `gorm:"type:varchar(255)" json:"sender_name"`
	ListID            *string            `gorm:"type:varchar(190)" json:"list_id"`
	UnsubscribeHTTP   *string            `gorm:"type:varchar(500)" json:"unsubscribe_http"`
	UnsubscribeMailto *string            `gorm:"type:varchar(255)" json:"unsubscribe_mailto"`
	OneClick          bool               `gorm:"not null;default:false" json:"one_click"`
	MessageCount      int                `gorm:"not null;default:1" json:"message_count"`
	LastMessageID     *uint64            `gorm:"index" json:"last_message_id"`
	LastReceivedAt    time.Time          `json:"last_received_at"`
	Status            SubscriptionStatus `gorm:"type:enum('active','unsubscribed','blocked');not null;default:'active';index" json:"status"`
	UnsubscribedAt    *time.Time         `json:"unsubscribed_at"`
	CreatedAt         time.Time          `json:"created_at"`
	UpdatedAt         time.Time          `json:"updated_at"`
}

func (MailSubscription) TableName() string {
	return "mail_subscriptions"
}
