package structs

import "time"

type MailLabelCreateRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=60"`
	Color string `json:"color" binding:"omitempty,len=7"`
}

type MailLabelUpdateRequest struct {
	Name  string `json:"name" binding:"required,min=1,max=60"`
	Color string `json:"color" binding:"omitempty,len=7"`
}

type MailLabelResponse struct {
	ID           uint64    `json:"id"`
	OwnerKey     string    `json:"owner_key"`
	Name         string    `json:"name"`
	Color        string    `json:"color"`
	MessageCount int       `json:"message_count"`
	CreatedAt    time.Time `json:"created_at"`
}

// MailMessageLabelsRequest replaces the full label set of one message.
type MailMessageLabelsRequest struct {
	LabelIDs []uint64 `json:"label_ids"`
}
