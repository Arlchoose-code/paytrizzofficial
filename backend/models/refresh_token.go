package models

import (
	"time"
)

type RefreshToken struct {
	ID           uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID       uint64     `gorm:"not null;index" json:"user_id"`
	User         User       `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"-"`
	TokenHash    string     `gorm:"type:char(64);uniqueIndex;not null" json:"-"`
	FamilyID     string     `gorm:"type:char(36);index;not null" json:"family_id"`
	ExpiresAt    time.Time  `gorm:"not null" json:"expires_at"`
	RevokedAt    *time.Time `json:"revoked_at"`
	ReplacedByID *uint64    `json:"replaced_by_id"`
	IP           string     `gorm:"type:varchar(45)" json:"ip"`
	UserAgent    string     `gorm:"type:varchar(255)" json:"user_agent"`
	CreatedAt    time.Time  `json:"created_at"`
	UpdatedAt    time.Time  `json:"updated_at"`
}

func (RefreshToken) TableName() string {
	return "refresh_tokens"
}
