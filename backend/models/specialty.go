package models

import "time"

type Specialty struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Key         string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"key"`
	Name        string    `gorm:"type:varchar(80);not null" json:"name"`
	Icon        string    `gorm:"type:varchar(50);not null" json:"icon"`
	Description string    `gorm:"type:varchar(255)" json:"description"`
	SortOrder   int       `gorm:"default:0;not null" json:"sort_order"`
	IsActive    bool      `gorm:"default:true;not null" json:"is_active"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (Specialty) TableName() string {
	return "specialties"
}
