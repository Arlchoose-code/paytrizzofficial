package structs

type TriggerRevalidateRequest struct {
	Tag  string  `json:"tag" binding:"required"`
	Path *string `json:"path"`
}

type NextRevalidatePayload struct {
	Secret string  `json:"secret"`
	Tag    string  `json:"tag,omitempty"`
	Path   *string `json:"path,omitempty"`
}
