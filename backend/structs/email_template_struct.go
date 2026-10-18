package structs

import (
	"time"

	"gorm.io/datatypes"
)

type EmailTemplateUpdateRequest struct {
	Subject  string `json:"subject" binding:"required,min=2,max=190"`
	BodyHTML string `json:"body_html" binding:"required"`
	BodyText string `json:"body_text" binding:"required"`
	IsActive *bool  `json:"is_active"`
}

type EmailTemplateTestSendRequest struct {
	ToEmail string                 `json:"to_email" binding:"required,email"`
	Data    map[string]interface{} `json:"data"`
}

type EmailTemplateResponse struct {
	ID        uint64         `json:"id"`
	Key       string         `json:"key"`
	Name      string         `json:"name"`
	Subject   string         `json:"subject"`
	BodyHTML  string         `json:"body_html"`
	BodyText  string         `json:"body_text"`
	Variables datatypes.JSON `json:"variables"`
	IsActive  bool           `json:"is_active"`
	CreatedAt time.Time      `json:"created_at"`
	UpdatedAt time.Time      `json:"updated_at"`
}
