package models

import "time"

type ProjectCategory struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(120);not null" json:"name"`
	Slug      string    `gorm:"type:varchar(150);uniqueIndex;not null" json:"slug"`
	SortOrder int       `gorm:"default:0" json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Projects []Project `gorm:"foreignKey:CategoryID" json:"projects,omitempty"`
}

func (ProjectCategory) TableName() string {
	return "project_categories"
}
