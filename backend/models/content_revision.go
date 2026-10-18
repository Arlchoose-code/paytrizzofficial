package models

import (
	"time"

	"gorm.io/datatypes"
)

type ContentRevision struct {
	ID          uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	EntityType  string         `gorm:"type:varchar(20);not null;index:idx_content_revision,priority:1" json:"entity_type"`
	EntityID    uint64         `gorm:"not null;index:idx_content_revision,priority:2" json:"entity_id"`
	SubmitterID uint64         `gorm:"column:submitted_by;not null;index" json:"submitted_by"`
	Payload     datatypes.JSON `gorm:"type:json;not null" json:"payload"`
	Status      string         `gorm:"type:varchar(20);default:'pending';index:idx_content_revision,priority:3" json:"status"`
	ReviewerID  *uint64        `gorm:"column:reviewed_by;index" json:"reviewed_by"`
	ReviewNote  *string        `gorm:"type:varchar(500)" json:"review_note"`
	ReviewedAt  *time.Time     `json:"reviewed_at"`
	CreatedAt   time.Time      `json:"created_at"`
	UpdatedAt   time.Time      `json:"updated_at"`

	Submitter *User `gorm:"foreignKey:SubmitterID" json:"submitter,omitempty"`
	Reviewer  *User `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
}

func (ContentRevision) TableName() string {
	return "content_revisions"
}
