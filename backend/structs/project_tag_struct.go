package structs

type ProjectTagInput struct {
	TagID uint64 `json:"tag_id" binding:"required"`
}

type ProjectTagResponse struct {
	ProjectID uint64       `json:"project_id"`
	TagID     uint64       `json:"tag_id"`
	Tag       *TagResponse `json:"tag,omitempty"`
}
