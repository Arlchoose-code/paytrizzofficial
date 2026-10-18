package structs

import (
	"time"
)

type CreateUserRequest struct {
	Name                 string `json:"name" binding:"required,min=2,max=120"`
	Email                string `json:"email" binding:"required,email,max=190"`
	Password             string `json:"password" binding:"omitempty,min=10"`
	Role                 string `json:"role" binding:"required,oneof=admin talent"`
	ForceChangePassword  bool   `json:"force_change_password"`
	SendWelcomeEmail     bool   `json:"send_welcome_email"`
}

type UpdateUserRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=120"`
	Email    string `json:"email" binding:"required,email,max=190"`
	IsActive *bool  `json:"is_active"`
}

type UserResponse struct {
	ID                   uint64     `json:"id"`
	Role                 string     `json:"role"`
	Name                 string     `json:"name"`
	Email                string     `json:"email"`
	IsActive             bool       `json:"is_active"`
	MustChangePassword   bool       `json:"must_change_password"`
	PasswordChangedAt    *time.Time `json:"password_changed_at"`
	LastLoginAt          *time.Time `json:"last_login_at"`
	MailPolicyAcceptedAt *time.Time `json:"mail_policy_accepted_at"`
	CreatedAt            time.Time  `json:"created_at"`
}
