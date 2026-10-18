package structs

type SEOSettingResponse struct {
	ID          uint64         `json:"id"`
	PageKey     string         `json:"page_key"`
	Title       string         `json:"title"`
	Description string         `json:"description"`
	OGMediaID   *uint64        `json:"og_media_id"`
	OGMedia     *MediaResponse `json:"og_media,omitempty"`
	RobotsIndex bool           `json:"robots_index"`
}

type UpdateSEOSettingRequest struct {
	Title       string  `json:"title" binding:"required,min=2,max=190"`
	Description string  `json:"description" binding:"required"`
	OGMediaID   *uint64 `json:"og_media_id"`
	RobotsIndex *bool   `json:"robots_index"`
}
