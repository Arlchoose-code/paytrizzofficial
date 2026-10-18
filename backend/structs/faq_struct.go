package structs

type FAQResponse struct {
	ID          uint64 `json:"id"`
	Question    string `json:"question"`
	Answer      string `json:"answer"`
	SortOrder   int    `json:"sort_order"`
	IsPublished bool   `json:"is_published"`
}

type CreateFAQRequest struct {
	Question    string `json:"question" binding:"required,min=5,max=255"`
	Answer      string `json:"answer" binding:"required"`
	SortOrder   int    `json:"sort_order"`
	IsPublished *bool  `json:"is_published"`
}

type UpdateFAQRequest struct {
	Question    string `json:"question" binding:"required,min=5,max=255"`
	Answer      string `json:"answer" binding:"required"`
	SortOrder   int    `json:"sort_order"`
	IsPublished *bool  `json:"is_published"`
}
