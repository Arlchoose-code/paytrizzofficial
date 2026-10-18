package models

import "time"

type MailLogEvent string

const (
	MailLogEventMailboxCreated           MailLogEvent = "mailbox_created"
	MailLogEventMailboxDeleted           MailLogEvent = "mailbox_deleted"
	MailLogEventMailboxRestored          MailLogEvent = "mailbox_restored"
	MailLogEventMailboxReleased          MailLogEvent = "mailbox_released"
	MailLogEventSent                     MailLogEvent = "sent"
	MailLogEventReceived                 MailLogEvent = "received"
	MailLogEventBounced                  MailLogEvent = "bounced"
	MailLogEventComplained               MailLogEvent = "complained"
	MailLogEventRejectedUnknownRecipient MailLogEvent = "rejected_unknown_recipient"
	MailLogEventQuarantinedVirus         MailLogEvent = "quarantined_virus"
	MailLogEventAdminViewed              MailLogEvent = "admin_viewed"
	MailLogEventSubscriptionUnsubscribed MailLogEvent = "subscription_unsubscribed"
)

type MailLog struct {
	ID             uint64       `gorm:"primaryKey;autoIncrement" json:"id"`
	Event          MailLogEvent `gorm:"type:enum('mailbox_created','mailbox_deleted','mailbox_restored','mailbox_released','sent','received','bounced','complained','rejected_unknown_recipient','quarantined_virus','admin_viewed','subscription_unsubscribed');not null;index:idx_mail_log_event_created" json:"event"`
	ActorUserID    *uint64      `gorm:"index" json:"actor_user_id"`
	ActorUser      *User        `gorm:"foreignKey:ActorUserID;constraint:OnDelete:SET NULL" json:"actor_user,omitempty"`
	MailboxID      *uint64      `gorm:"index" json:"mailbox_id"`
	MailboxAddress *string      `gorm:"type:varchar(190)" json:"mailbox_address"`
	TalentUserID   *uint64      `gorm:"index:idx_mail_log_talent_created" json:"talent_user_id"`
	MessageID      *uint64      `gorm:"index" json:"message_id"`
	IP             *string      `gorm:"type:varchar(45)" json:"ip"`
	UserAgent      *string      `gorm:"type:varchar(255)" json:"user_agent"`
	Meta           *string      `gorm:"type:json" json:"meta"`
	CreatedAt      time.Time    `gorm:"not null;index:idx_mail_log_event_created;index:idx_mail_log_talent_created" json:"created_at"`
}

func (MailLog) TableName() string {
	return "mail_logs"
}
