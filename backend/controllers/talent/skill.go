package talent

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

// SkillsCatalog lists the admin-managed skill catalog for talent selection
func SkillsCatalog(c *gin.Context) {
	var skills []models.Skill
	if err := config.DB.Order("name ASC").Find(&skills).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch skill catalog")
		return
	}

	resp := make([]structs.SkillResponse, 0, len(skills))
	for _, s := range skills {
		resp = append(resp, structs.SkillResponse{
			ID:       s.ID,
			Name:     s.Name,
			Slug:     s.Slug,
			Category: s.Category,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get skill catalog success", resp)
}
