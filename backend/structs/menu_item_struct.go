package structs

type MenuItemResponse struct {
	ID         uint64             `json:"id"`
	Location   string             `json:"location"`
	Label      string             `json:"label"`
	URL        string             `json:"url"`
	ParentID   *uint64            `json:"parent_id"`
	Children   []MenuItemResponse `json:"children,omitempty"`
	SortOrder  int                `json:"sort_order"`
	IsActive   bool               `json:"is_active"`
	OpenNewTab bool               `json:"open_new_tab"`
}

type CreateMenuItemRequest struct {
	Location   string  `json:"location" binding:"required,oneof=header footer"`
	Label      string  `json:"label" binding:"required,min=1,max=80"`
	URL        string  `json:"url" binding:"required"`
	ParentID   *uint64 `json:"parent_id"`
	SortOrder  int     `json:"sort_order"`
	IsActive   *bool   `json:"is_active"`
	OpenNewTab *bool   `json:"open_new_tab"`
}

type UpdateMenuItemRequest struct {
	Location   string  `json:"location" binding:"required,oneof=header footer"`
	Label      string  `json:"label" binding:"required,min=1,max=80"`
	URL        string  `json:"url" binding:"required"`
	ParentID   *uint64 `json:"parent_id"`
	SortOrder  int     `json:"sort_order"`
	IsActive   *bool   `json:"is_active"`
	OpenNewTab *bool   `json:"open_new_tab"`
}
