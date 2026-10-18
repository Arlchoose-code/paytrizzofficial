package structs

import (
	"time"
)

type ContactMessageCreateRequest struct {
	Channel   string  `json:"channel" binding:"omitempty,oneof=general talent"`
	TalentID  *uint64 `json:"talent_id"`
	Name      string  `json:"name" binding:"required,min=2,max=120"`
	Email     string  `json:"email" binding:"required,email,max=190"`
	Phone     *string `json:"phone" binding:"omitempty,max=30"`
	Subject   string  `json:"subject" binding:"required,min=2,max=190"`
	Message   string  `json:"message" binding:"required,min=10,max=5000"`
	SourceURL *string `json:"source_url" binding:"omitempty,max=255"`
}

type ContactMessageStatusUpdateRequest struct {
	Status string `json:"status" binding:"required,oneof=new read replied archived spam"`
}

type ContactMessageResponse struct {
	ID              uint64                 `json:"id"`
	TicketCode      string                 `json:"ticket_code"`
	Channel         string                 `json:"channel"`
	TalentID        *uint64                `json:"talent_id"`
	Talent          map[string]interface{} `json:"talent,omitempty"`
	Name            string                 `json:"name"`
	Email           string                 `json:"email"`
	Phone           *string                `json:"phone"`
	Subject         string                 `json:"subject"`
	Message         string                 `json:"message"`
	Status          string                 `json:"status"`
	EmailVerifiedAt *time.Time             `json:"email_verified_at"`
	RepliedAt       *time.Time             `json:"replied_at"`
	SourceURL       *string                `json:"source_url"`
	CreatedAt       time.Time              `json:"created_at"`
	UpdatedAt       time.Time              `json:"updated_at"`
}
