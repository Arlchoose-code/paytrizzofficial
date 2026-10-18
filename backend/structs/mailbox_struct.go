package structs

import (
	"paytrizz-backend/models"
	"time"
)

type MailboxCreateRequest struct {
	// PRD 5.7: local part is 3-32 characters, validated again in the service.
	LocalPart     string  `json:"local_part" binding:"required,min=3,max=32"`
	DisplayName   string  `json:"display_name" binding:"required,min=2,max=120"`
	SignatureHTML *string `json:"signature_html"`
	Color         string  `json:"color" binding:"omitempty,len=7"`
}

type MailboxUpdateRequest struct {
	DisplayName   string  `json:"display_name" binding:"required,min=2,max=120"`
	SignatureHTML *string `json:"signature_html"`
	Color         string  `json:"color" binding:"omitempty,len=7"`
	IsDefault     *bool   `json:"is_default"`
}

type MailboxResponse struct {
	ID            uint64                  `json:"id"`
	OwnerType     models.MailboxOwnerType `json:"owner_type"`
	UserID        *uint64                 `json:"user_id"`
	LocalPart     string                  `json:"local_part"`
	Address       string                  `json:"address"`
	DisplayName   string                  `json:"display_name"`
	SignatureHTML *string                 `json:"signature_html"`
	Color         string                  `json:"color"`
	IsDefault     bool                    `json:"is_default"`
	Status        models.MailboxStatus    `json:"status"`
	UnreadCount   int                     `json:"unread_count"`
	CreatedAt     time.Time               `json:"created_at"`
	UpdatedAt     time.Time               `json:"updated_at"`
}
