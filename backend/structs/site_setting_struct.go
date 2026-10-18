package structs

type UpdateSettingRequest struct {
	Value string `json:"value"`
}

type BulkUpdateSettingsRequest struct {
	Settings map[string]string `json:"settings"`
}

type SiteSettingResponse struct {
	ID       uint64 `json:"id"`
	Group    string `json:"group"`
	Key      string `json:"key"`
	Value    string `json:"value"`
	Type     string `json:"type"`
	IsPublic bool   `json:"is_public"`
}
