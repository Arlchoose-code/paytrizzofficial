package structs

type PostTagInput struct {
	TagID uint64 `json:"tag_id" binding:"required"`
}

type PostTagResponse struct {
	PostID uint64       `json:"post_id"`
	TagID  uint64       `json:"tag_id"`
	Tag    *TagResponse `json:"tag,omitempty"`
}
