package models

import (
	"time"
)

type ContactMessage struct {
	ID              uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	TicketCode      string     `gorm:"type:varchar(20);uniqueIndex;not null" json:"ticket_code"`
	Channel         string     `gorm:"type:enum('general','talent');default:'general';not null;index:idx_contact_chan_stat_date,priority:1" json:"channel"`
	TalentID        *uint64    `gorm:"index:idx_contact_talent_stat,priority:1" json:"talent_id"`
	Talent          *Talent    `gorm:"foreignKey:TalentID;constraint:OnDelete:SET NULL" json:"talent,omitempty"`
	Name            string     `gorm:"type:varchar(120);not null" json:"name"`
	Email           string     `gorm:"type:varchar(190);not null" json:"email"`
	Phone           *string    `gorm:"type:varchar(30)" json:"phone"`
	Subject         string     `gorm:"type:varchar(190);not null" json:"subject"`
	Message         string     `gorm:"type:text;not null" json:"message"`
	Status          string     `gorm:"type:enum('new','read','replied','archived','spam');default:'new';not null;index:idx_contact_chan_stat_date,priority:2;index:idx_contact_talent_stat,priority:2" json:"status"`
	EmailVerifiedAt *time.Time `json:"email_verified_at"`
	RepliedAt       *time.Time `json:"replied_at"`
	IP              string     `gorm:"type:varchar(45);not null" json:"ip"`
	UserAgent       string     `gorm:"type:varchar(255);not null" json:"user_agent"`
	SourceURL       *string    `gorm:"type:varchar(255)" json:"source_url"`
	CreatedAt       time.Time  `gorm:"index:idx_contact_chan_stat_date,priority:3" json:"created_at"`
	UpdatedAt       time.Time  `json:"updated_at"`
}

func (ContactMessage) TableName() string {
	return "contact_messages"
}
