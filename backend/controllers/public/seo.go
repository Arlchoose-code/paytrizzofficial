package public

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type SEOController struct{}

func NewSEOController() *SEOController {
	return &SEOController{}
}

// Show returns SEO meta for a specific page key
func (ctrl *SEOController) Show(c *gin.Context) {
	pageKey := c.Param("page_key")
	if pageKey == "" {
		pageKey = "home"
	}

	var setting models.SEOSetting
	if err := config.DB.Preload("OGMedia").Where("page_key = ?", pageKey).First(&setting).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "SEO setting not found")
		return
	}

	resp := structs.SEOSettingResponse{
		ID:          setting.ID,
		PageKey:     setting.PageKey,
		Title:       setting.Title,
		Description: setting.Description,
		OGMediaID:   setting.OGMediaID,
		OGMedia:     helpers.FormatMediaResponse(setting.OGMedia),
		RobotsIndex: setting.RobotsIndex,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get SEO setting success", resp)
}
