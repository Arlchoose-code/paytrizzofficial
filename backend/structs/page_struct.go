package structs

import "time"

type PageResponse struct {
	ID        uint64                `json:"id"`
	Key       string                `json:"key"`
	Title     string                `json:"title"`
	IsActive  bool                  `json:"is_active"`
	Sections  []PageSectionResponse `json:"sections,omitempty"`
	CreatedAt time.Time             `json:"created_at"`
}

type UpdatePageRequest struct {
	Title    string `json:"title" binding:"required,min=2,max=120"`
	IsActive *bool  `json:"is_active"`
}
