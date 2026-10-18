package models

import "time"

type Badge struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Key       string    `gorm:"type:varchar(50);uniqueIndex;not null" json:"key"`
	Label     string    `gorm:"type:varchar(80);not null" json:"label"`
	Color     string    `gorm:"type:varchar(30);default:'#FCCF00';not null" json:"color"`
	Icon      string    `gorm:"type:varchar(50);not null" json:"icon"`
	SortOrder int       `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Badge) TableName() string {
	return "badges"
}
