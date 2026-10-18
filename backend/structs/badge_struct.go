package structs

type BadgeResponse struct {
	ID        uint64 `json:"id"`
	Key       string `json:"key"`
	Label     string `json:"label"`
	Color     string `json:"color"`
	Icon      string `json:"icon"`
	SortOrder int    `json:"sort_order"`
}

type CreateBadgeRequest struct {
	Key       string `json:"key" binding:"required,min=2,max=50"`
	Label     string `json:"label" binding:"required,min=2,max=80"`
	Color     string `json:"color" binding:"required"`
	Icon      string `json:"icon" binding:"required"`
	SortOrder int    `json:"sort_order"`
}

type UpdateBadgeRequest struct {
	Key       string `json:"key" binding:"required,min=2,max=50"`
	Label     string `json:"label" binding:"required,min=2,max=80"`
	Color     string `json:"color" binding:"required"`
	Icon      string `json:"icon" binding:"required"`
	SortOrder int    `json:"sort_order"`
}
