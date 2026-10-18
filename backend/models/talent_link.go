package models

import "time"

type TalentLink struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TalentID  uint64    `gorm:"not null;index" json:"talent_id"`
	Platform  string    `gorm:"type:varchar(50);not null" json:"platform"`
	Label     string    `gorm:"type:varchar(80);not null" json:"label"`
	URL       string    `gorm:"type:varchar(255);not null" json:"url"`
	SortOrder int       `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (TalentLink) TableName() string {
	return "talent_links"
}
