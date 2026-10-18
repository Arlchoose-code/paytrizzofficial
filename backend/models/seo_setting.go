package models

import "time"

type SEOSetting struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	PageKey     string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"page_key"`
	Title       string    `gorm:"type:varchar(190);not null" json:"title"`
	Description string    `gorm:"type:text;not null" json:"description"`
	OGMediaID   *uint64   `json:"og_media_id"`
	OGMedia     *Media    `gorm:"foreignKey:OGMediaID;constraint:OnDelete:SET NULL" json:"og_media,omitempty"`
	RobotsIndex bool      `gorm:"default:true;not null" json:"robots_index"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (SEOSetting) TableName() string {
	return "seo_settings"
}
