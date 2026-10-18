package models

import (
	"time"
)

type PasswordResetToken struct {
	ID        uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID    uint64     `gorm:"not null;index" json:"user_id"`
	User      User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	TokenHash string     `gorm:"type:char(64);uniqueIndex;not null" json:"token_hash"`
	ExpiresAt time.Time  `gorm:"not null" json:"expires_at"`
	UsedAt    *time.Time `json:"used_at"`
	IP        string     `gorm:"type:varchar(45)" json:"ip"`
	CreatedAt time.Time  `json:"created_at"`
	UpdatedAt time.Time  `json:"updated_at"`
}

func (PasswordResetToken) TableName() string {
	return "password_reset_tokens"
}
