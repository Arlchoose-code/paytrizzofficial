package models

import (
	"time"
)

type ApplicationFile struct {
	ID            uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ApplicationID uint64    `gorm:"not null;index" json:"application_id"`
	MediaID       uint64    `gorm:"not null;index" json:"media_id"`
	Media         *Media    `gorm:"foreignKey:MediaID" json:"media,omitempty"`
	Label         *string   `gorm:"type:varchar(60)" json:"label"` // e.g. cv, portfolio_pdf, attachment
	CreatedAt     time.Time `json:"created_at"`
}

func (ApplicationFile) TableName() string {
	return "application_files"
}
