package models

import (
	"time"
)

type RevalidationStatus string

const (
	RevalidationPending    RevalidationStatus = "pending"
	RevalidationProcessing RevalidationStatus = "processing"
	RevalidationDone       RevalidationStatus = "done"
	RevalidationFailed     RevalidationStatus = "failed"
)

type RevalidationJob struct {
	ID            uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	Tag           string             `gorm:"type:varchar(120);not null;index" json:"tag"`
	Path          *string            `gorm:"type:varchar(255)" json:"path"`
	Status        RevalidationStatus `gorm:"type:varchar(20);default:'pending';not null;index" json:"status"`
	Attempts      uint8              `gorm:"default:0;not null" json:"attempts"`
	NextAttemptAt time.Time          `gorm:"not null" json:"next_attempt_at"`
	LastError     *string            `gorm:"type:text" json:"last_error"`
	ProcessedAt   *time.Time         `json:"processed_at"`
	CreatedAt     time.Time          `json:"created_at"`
	UpdatedAt     time.Time          `json:"updated_at"`
}

func (RevalidationJob) TableName() string {
	return "revalidation_jobs"
}
