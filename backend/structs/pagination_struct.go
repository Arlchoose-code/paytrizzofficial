package structs

// PaginationQuery represents standard query params for paginated requests
type PaginationQuery struct {
	Page    int    `form:"page,default=1"`
	PerPage int    `form:"per_page,default=10"`
	Search  string `form:"search"`
	SortBy  string `form:"sort_by"`
	Order   string `form:"order,default=desc"`
}

// PaginatedData represents standard paginated response payload as required by BOILERPLATE
type PaginatedData struct {
	CurrentPage int   `json:"current_page"`
	PerPage     int   `json:"per_page"`
	Total       int64 `json:"total"`
	LastPage    int   `json:"last_page"`
	Data        any   `json:"data"`
}
