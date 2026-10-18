package structs

type SocialLinkResponse struct {
	ID        uint64 `json:"id"`
	Platform  string `json:"platform"`
	Label     string `json:"label"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
	IsActive  bool   `json:"is_active"`
}

type CreateSocialLinkRequest struct {
	Platform  string `json:"platform" binding:"required"`
	Label     string `json:"label" binding:"required"`
	URL       string `json:"url" binding:"required,url"`
	SortOrder int    `json:"sort_order"`
	IsActive  *bool  `json:"is_active"`
}

type UpdateSocialLinkRequest struct {
	Platform  string `json:"platform" binding:"required"`
	Label     string `json:"label" binding:"required"`
	URL       string `json:"url" binding:"required,url"`
	SortOrder int    `json:"sort_order"`
	IsActive  *bool  `json:"is_active"`
}
