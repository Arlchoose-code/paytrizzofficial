package public

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type SocialLinkController struct{}

func NewSocialLinkController() *SocialLinkController {
	return &SocialLinkController{}
}

// Index lists all active social links
func (ctrl *SocialLinkController) Index(c *gin.Context) {
	var links []models.SocialLink
	if err := config.DB.Where("is_active = true").Order("sort_order ASC, id ASC").Find(&links).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve social links")
		return
	}

	var resp []structs.SocialLinkResponse
	for _, l := range links {
		resp = append(resp, structs.SocialLinkResponse{
			ID:        l.ID,
			Platform:  l.Platform,
			Label:     l.Label,
			URL:       l.URL,
			SortOrder: l.SortOrder,
			IsActive:  l.IsActive,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get social links success", resp)
}
