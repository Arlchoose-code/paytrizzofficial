package structs

import "time"

type CreatePostCategoryRequest struct {
	Name      string `json:"name" binding:"required,min=2,max=120"`
	SortOrder int    `json:"sort_order"`
}

type UpdatePostCategoryRequest struct {
	Name      string `json:"name" binding:"omitempty,min=2,max=120"`
	SortOrder int    `json:"sort_order"`
}

type PostCategoryResponse struct {
	ID        uint64    `json:"id"`
	Name      string    `json:"name"`
	Slug      string    `json:"slug"`
	SortOrder int       `json:"sort_order"`
	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}
