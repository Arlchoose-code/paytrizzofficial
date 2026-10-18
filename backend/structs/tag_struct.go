package structs

import "time"

type CreateTagRequest struct {
	Name string `json:"name" binding:"required,min=2,max=80"`
}

type UpdateTagRequest struct {
	Name string `json:"name" binding:"omitempty,min=2,max=80"`
}

type TagResponse struct {
	ID        uint64    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
