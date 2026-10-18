package structs

type SpecialtyResponse struct {
	ID          uint64 `json:"id"`
	Key         string `json:"key"`
	Name        string `json:"name"`
	Icon        string `json:"icon"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
	IsActive    bool   `json:"is_active"`
}

type CreateSpecialtyRequest struct {
	Key         string `json:"key" binding:"required,min=2,max=50"`
	Name        string `json:"name" binding:"required,min=2,max=80"`
	Icon        string `json:"icon" binding:"required"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
	IsActive    *bool  `json:"is_active"`
}

type UpdateSpecialtyRequest struct {
	Key         string `json:"key" binding:"required,min=2,max=50"`
	Name        string `json:"name" binding:"required,min=2,max=80"`
	Icon        string `json:"icon" binding:"required"`
	Description string `json:"description"`
	SortOrder   int    `json:"sort_order"`
	IsActive    *bool  `json:"is_active"`
}
