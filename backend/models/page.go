package models

import "time"

type Page struct {
	ID        uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	Key       string        `gorm:"type:varchar(40);uniqueIndex;not null" json:"key"`
	Title     string        `gorm:"type:varchar(120);not null" json:"title"`
	IsActive  bool          `gorm:"default:true;not null" json:"is_active"`
	Sections  []PageSection `gorm:"foreignKey:PageID;constraint:OnDelete:CASCADE" json:"sections,omitempty"`
	CreatedAt time.Time     `json:"created_at"`
	UpdatedAt time.Time     `json:"updated_at"`
}

func (Page) TableName() string {
	return "pages"
}
