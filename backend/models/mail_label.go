package models

import "time"

type MailLabel struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	OwnerKey  string    `gorm:"type:varchar(40);not null;uniqueIndex:idx_owner_label_name" json:"owner_key"`
	Name      string    `gorm:"type:varchar(60);not null;uniqueIndex:idx_owner_label_name" json:"name"`
	Color     string    `gorm:"type:varchar(7);not null;default:'#FCCF00'" json:"color"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (MailLabel) TableName() string {
	return "mail_labels"
}
