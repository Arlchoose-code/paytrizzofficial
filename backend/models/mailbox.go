package models

import (
	"time"
)

type MailboxOwnerType string

const (
	MailboxOwnerCompany MailboxOwnerType = "company"
	MailboxOwnerTalent  MailboxOwnerType = "talent"
)

type MailboxStatus string

const (
	MailboxStatusActive   MailboxStatus = "active"
	MailboxStatusDisabled MailboxStatus = "disabled"
	MailboxStatusDeleted  MailboxStatus = "deleted"
)

type Mailbox struct {
	ID            uint64           `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerType     MailboxOwnerType `gorm:"type:enum('company','talent');not null;index" json:"owner_type"`
	UserID        *uint64          `gorm:"index" json:"user_id"`
	User          *User            `gorm:"foreignKey:UserID;constraint:OnDelete:SET NULL" json:"user,omitempty"`
	LocalPart     string           `gorm:"type:varchar(64);not null" json:"local_part"`
	Address       string           `gorm:"type:varchar(190);not null;uniqueIndex" json:"address"`
	DisplayName   string           `gorm:"type:varchar(120);not null" json:"display_name"`
	SignatureHTML *string          `gorm:"type:text" json:"signature_html"`
	Color         string           `gorm:"type:varchar(7);not null;default:'#FCCF00'" json:"color"`
	IsDefault     bool             `gorm:"not null;default:false" json:"is_default"`
	Status        MailboxStatus    `gorm:"type:enum('active','disabled','deleted');not null;default:'active';index" json:"status"`
	CreatedByID   *uint64          `json:"created_by_id"`
	DeletedAt     *time.Time       `gorm:"index" json:"deleted_at"`
	DeletedByID   *uint64          `json:"deleted_by_id"`
	PurgeAfter    *time.Time       `gorm:"index" json:"purge_after"`
	CreatedAt     time.Time        `json:"created_at"`
	UpdatedAt     time.Time        `json:"updated_at"`
}

func (Mailbox) TableName() string {
	return "mailboxes"
}
