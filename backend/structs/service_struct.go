package structs

type ServiceResponse struct {
	ID           uint64         `json:"id"`
	Title        string         `json:"title"`
	Slug         string         `json:"slug"`
	Description  string         `json:"description"`
	Icon         string         `json:"icon"`
	ImageMediaID *uint64        `json:"image_media_id"`
	ImageMedia   *MediaResponse `json:"image_media,omitempty"`
	SortOrder    int            `json:"sort_order"`
	IsActive     bool           `json:"is_active"`
}

type CreateServiceRequest struct {
	Title        string  `json:"title" binding:"required,min=2,max=150"`
	Description  string  `json:"description" binding:"required"`
	Icon         string  `json:"icon" binding:"required"`
	ImageMediaID *uint64 `json:"image_media_id"`
	SortOrder    int     `json:"sort_order"`
	IsActive     *bool   `json:"is_active"`
}

type UpdateServiceRequest struct {
	Title        string  `json:"title" binding:"required,min=2,max=150"`
	Description  string  `json:"description" binding:"required"`
	Icon         string  `json:"icon" binding:"required"`
	ImageMediaID *uint64 `json:"image_media_id"`
	SortOrder    int     `json:"sort_order"`
	IsActive     *bool   `json:"is_active"`
}
