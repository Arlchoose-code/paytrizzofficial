package models

import "time"

type Service struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Title        string    `gorm:"type:varchar(150);not null" json:"title"`
	Slug         string    `gorm:"type:varchar(180);uniqueIndex;not null" json:"slug"`
	Description  string    `gorm:"type:text;not null" json:"description"`
	Icon         string    `gorm:"type:varchar(50);not null" json:"icon"`
	ImageMediaID *uint64   `json:"image_media_id"`
	ImageMedia   *Media    `gorm:"foreignKey:ImageMediaID;constraint:OnDelete:SET NULL" json:"image_media,omitempty"`
	SortOrder    int       `gorm:"default:0;not null" json:"sort_order"`
	IsActive     bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (Service) TableName() string {
	return "services"
}
