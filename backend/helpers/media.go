package helpers

import (
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
)

// FormatMediaResponse converts models.Media to structs.MediaResponse
func FormatMediaResponse(m *models.Media) *structs.MediaResponse {
	if m == nil {
		return nil
	}
	return &structs.MediaResponse{
		ID:           m.ID,
		Module:       string(m.Module),
		Kind:         string(m.Kind),
		Visibility:   string(m.Visibility),
		Mime:         m.Mime,
		SizeBytes:    m.SizeBytes,
		OriginalName: m.OriginalName,
		AltText:      m.AltText,
		Width:        m.Width,
		Height:       m.Height,
		PathOriginal: m.PathOriginal,
		PathMedium:   m.PathMedium,
		PathThumb:    m.PathThumb,
		PathFile:     m.PathFile,
		CreatedAt:    m.CreatedAt,
	}
}
