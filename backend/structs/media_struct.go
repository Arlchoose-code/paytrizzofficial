package structs

import "time"

type MediaResponse struct {
	ID           uint64    `json:"id"`
	Module       string    `json:"module"`
	Kind         string    `json:"kind"`
	Visibility   string    `json:"visibility"`
	Mime         string    `json:"mime"`
	SizeBytes    int64     `json:"size_bytes"`
	OriginalName string    `json:"original_name"`
	AltText      *string   `json:"alt_text"`
	Width        *int      `json:"width"`
	Height       *int      `json:"height"`
	PathOriginal string    `json:"path_original"`
	PathMedium   *string   `json:"path_medium"`
	PathThumb    *string   `json:"path_thumb"`
	PathFile     *string   `json:"path_file"`
	CreatedAt    time.Time `json:"created_at"`
}

type UpdateMediaRequest struct {
	AltText *string `json:"alt_text"`
}
