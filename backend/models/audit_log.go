package models

import (
	"time"
)

type AuditLog struct {
	ID          uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	ActorUserID *uint64   `json:"actor_user_id"`
	ActorUser   *User     `gorm:"foreignKey:ActorUserID;constraint:OnDelete:SET NULL" json:"actor_user,omitempty"`
	Module      string    `gorm:"type:varchar(40);not null;index:idx_module_created,priority:1" json:"module"`
	Action      string    `gorm:"type:varchar(40);not null" json:"action"`
	TargetType  string    `gorm:"type:varchar(40);not null" json:"target_type"`
	TargetID    *uint64   `json:"target_id"`
	Summary     string    `gorm:"type:varchar(255);not null" json:"summary"`
	Meta        *string   `gorm:"type:json" json:"meta"`
	IP          string    `gorm:"type:varchar(45)" json:"ip"`
	UserAgent   string    `gorm:"type:varchar(255)" json:"user_agent"`
	CreatedAt   time.Time `gorm:"not null;index:idx_module_created,priority:2" json:"created_at"`
}

func (AuditLog) TableName() string {
	return "audit_logs"
}
