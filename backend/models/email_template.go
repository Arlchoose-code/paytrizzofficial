package models

import (
	"time"

	"gorm.io/datatypes"
)

type EmailTemplate struct {
	ID        uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Key       string         `gorm:"type:varchar(60);uniqueIndex;not null" json:"key"`
	Name      string         `gorm:"type:varchar(120);not null" json:"name"`
	Subject   string         `gorm:"type:varchar(190);not null" json:"subject"`
	BodyHTML  string         `gorm:"type:longtext;not null" json:"body_html"`
	BodyText  string         `gorm:"type:longtext;not null" json:"body_text"`
	Variables datatypes.JSON `gorm:"type:json" json:"variables"`
	IsActive  bool           `gorm:"default:true;not null" json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}

func (EmailTemplate) TableName() string {
	return "email_templates"
}
