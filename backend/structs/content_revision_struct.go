package structs

import "time"

type SubmitContentRevisionRequest struct {
	EntityType string                 `json:"entity_type" binding:"required,oneof=post project"`
	EntityID   uint64                 `json:"entity_id" binding:"required"`
	Payload    map[string]interface{} `json:"payload" binding:"required"`
}

type ReviewContentRevisionRequest struct {
	Status     string  `json:"status" binding:"required,oneof=approved rejected"`
	ReviewNote *string `json:"review_note"`
}

type ContentRevisionResponse struct {
	ID          uint64                 `json:"id"`
	EntityType  string                 `json:"entity_type"`
	EntityID    uint64                 `json:"entity_id"`
	SubmittedBy uint64                 `json:"submitted_by"`
	Payload     map[string]interface{} `json:"payload"`
	Status      string                 `json:"status"`
	ReviewedBy  *uint64                `json:"reviewed_by"`
	ReviewNote  *string                `json:"review_note"`
	ReviewedAt  *time.Time             `json:"reviewed_at"`
	CreatedAt   time.Time              `json:"created_at"`
	UpdatedAt   time.Time              `json:"updated_at"`

	Submitter *UserResponse `json:"submitter,omitempty"`
	Reviewer  *UserResponse `json:"reviewer,omitempty"`
}
