package public

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type FAQController struct{}

func NewFAQController() *FAQController {
	return &FAQController{}
}

// Index lists published FAQs
func (ctrl *FAQController) Index(c *gin.Context) {
	var faqs []models.FAQ
	if err := config.DB.Where("is_published = true").Order("sort_order ASC, id ASC").Find(&faqs).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve FAQs")
		return
	}

	var resp []structs.FAQResponse
	for _, f := range faqs {
		resp = append(resp, structs.FAQResponse{
			ID:          f.ID,
			Question:    f.Question,
			Answer:      f.Answer,
			SortOrder:   f.SortOrder,
			IsPublished: f.IsPublished,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get FAQs success", resp)
}
