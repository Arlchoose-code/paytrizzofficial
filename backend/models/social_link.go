package models

import "time"

type SocialLink struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Platform  string    `gorm:"type:varchar(40);not null" json:"platform"`
	Label     string    `gorm:"type:varchar(80);not null" json:"label"`
	URL       string    `gorm:"type:varchar(255);not null" json:"url"`
	SortOrder int       `gorm:"default:0;not null" json:"sort_order"`
	IsActive  bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (SocialLink) TableName() string {
	return "social_links"
}
