package models

import "time"

type FAQ struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	Question    string    `gorm:"type:varchar(255);not null" json:"question"`
	Answer      string    `gorm:"type:text;not null" json:"answer"`
	SortOrder   int       `gorm:"default:0;not null" json:"sort_order"`
	IsPublished bool      `gorm:"default:true;not null" json:"is_published"`
	CreatedAt   time.Time `json:"created_at"`
	UpdatedAt   time.Time `json:"updated_at"`
}

func (FAQ) TableName() string {
	return "faqs"
}
