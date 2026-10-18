package models

import "time"

type ReservedMailName struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(64);not null;uniqueIndex" json:"name"`
	Reason    *string   `gorm:"type:varchar(120)" json:"reason"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (ReservedMailName) TableName() string {
	return "reserved_mail_names"
}
