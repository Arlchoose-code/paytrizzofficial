package structs

// APIResponse represents standard successful API response format as required by BOILERPLATE
type APIResponse struct {
	Success bool   `json:"success"`
	Message string `json:"message"`
	Data    any    `json:"data,omitempty"`
}

// APIErrorResponse represents standard error API response format as required by BOILERPLATE
type APIErrorResponse struct {
	Success bool                `json:"success"`
	Message string              `json:"message"`
	Errors  map[string][]string `json:"errors,omitempty"`
}
