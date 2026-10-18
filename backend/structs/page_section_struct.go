package structs

type PageSectionResponse struct {
	ID        uint64 `json:"id"`
	PageID    uint64 `json:"page_id"`
	Key       string `json:"key"`
	Type      string `json:"type"`
	Content   any    `json:"content"`
	SortOrder int    `json:"sort_order"`
	IsVisible bool   `json:"is_visible"`
}

type UpdatePageSectionRequest struct {
	Content   string `json:"content" binding:"required"`
	SortOrder *int   `json:"sort_order"`
	IsVisible *bool  `json:"is_visible"`
}

type ReorderPageSectionsRequest struct {
	SectionIDs []uint64 `json:"section_ids"`
	OrderedIDs []uint64 `json:"ordered_ids"`
}
