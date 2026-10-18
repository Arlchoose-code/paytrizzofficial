package models

import "time"

type Tag struct {
	ID        uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Name      string    `gorm:"type:varchar(80);uniqueIndex;not null" json:"name"`
	Slug      string    `gorm:"type:varchar(100);uniqueIndex;not null" json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`

	Projects []Project `gorm:"many2many:project_tags;" json:"projects,omitempty"`
	Posts    []Post    `gorm:"many2many:post_tags;" json:"posts,omitempty"`
}

func (Tag) TableName() string {
	return "tags"
}
