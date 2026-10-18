package structs

type ProjectImageInput struct {
	MediaID   uint64 `json:"media_id" binding:"required"`
	Caption   string `json:"caption"`
	SortOrder int    `json:"sort_order"`
}

type ProjectImageResponse struct {
	ID        uint64         `json:"id"`
	ProjectID uint64         `json:"project_id"`
	MediaID   uint64         `json:"media_id"`
	Caption   string         `json:"caption"`
	SortOrder int            `json:"sort_order"`
	Media     *MediaResponse `json:"media,omitempty"`
}
