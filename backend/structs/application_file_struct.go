package structs

import (
	"time"
)

type ApplicationFileResponse struct {
	ID            uint64                 `json:"id"`
	ApplicationID uint64                 `json:"application_id"`
	MediaID       uint64                 `json:"media_id"`
	Media         map[string]interface{} `json:"media,omitempty"`
	Label         *string                `json:"label"`
	CreatedAt     time.Time              `json:"created_at"`
}
