package models

import (
	"time"

	"gorm.io/gorm"
)

type UserRole string

const (
	RoleAdmin  UserRole = "admin"
	RoleTalent UserRole = "talent"
)

type User struct {
	ID                   uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Role                 UserRole       `gorm:"type:varchar(20);not null;index:idx_role_active,priority:1" json:"role"`
	Name                 string         `gorm:"type:varchar(120);not null" json:"name"`
	Email                string         `gorm:"type:varchar(190);uniqueIndex;not null" json:"email"`
	PasswordHash         string         `gorm:"type:varchar(255);not null" json:"-"`
	IsActive             bool           `gorm:"default:true;index:idx_role_active,priority:2" json:"is_active"`
	MustChangePassword   bool           `gorm:"default:true" json:"must_change_password"`
	PasswordChangedAt    *time.Time     `json:"password_changed_at"`
	LastLoginAt          *time.Time     `json:"last_login_at"`
	LastLoginIP          *string        `gorm:"type:varchar(45)" json:"last_login_ip"`
	MailPolicyAcceptedAt *time.Time     `json:"mail_policy_accepted_at"`
	CreatedByID          *uint64        `json:"created_by"`
	CreatedBy            *User          `gorm:"foreignKey:CreatedByID;constraint:OnDelete:SET NULL" json:"-"`
	CreatedAt            time.Time      `json:"created_at"`
	UpdatedAt            time.Time      `json:"updated_at"`
	DeletedAt            gorm.DeletedAt `gorm:"index" json:"-"`
}

func (User) TableName() string {
	return "users"
}
