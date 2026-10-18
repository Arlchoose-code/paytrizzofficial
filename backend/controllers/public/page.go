package public

import (
	"encoding/json"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type PageController struct{}

func NewPageController() *PageController {
	return &PageController{}
}

// Show returns an active page by key with all its visible sections
func (ctrl *PageController) Show(c *gin.Context) {
	key := c.Param("key")
	if key == "" {
		key = "home"
	}

	var page models.Page
	if err := config.DB.Where("`key` = ? AND is_active = true", key).First(&page).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Page not found")
		return
	}

	var sections []models.PageSection
	if err := config.DB.Where("page_id = ? AND is_visible = true", page.ID).
		Order("sort_order ASC, id ASC").Find(&sections).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to load page sections")
		return
	}

	var sectionsResp []structs.PageSectionResponse
	for _, s := range sections {
		var contentData any
		_ = json.Unmarshal([]byte(s.Content), &contentData)

		sectionsResp = append(sectionsResp, structs.PageSectionResponse{
			ID:        s.ID,
			PageID:    s.PageID,
			Key:       s.Key,
			Type:      string(s.Type),
			Content:   contentData,
			SortOrder: s.SortOrder,
			IsVisible: s.IsVisible,
		})
	}

	resp := structs.PageResponse{
		ID:        page.ID,
		Key:       page.Key,
		Title:     page.Title,
		IsActive:  page.IsActive,
		Sections:  sectionsResp,
		CreatedAt: page.CreatedAt,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get page success", resp)
}
