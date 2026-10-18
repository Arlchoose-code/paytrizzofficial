package public

import (
	"net/http"

	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TagController struct {
	db *gorm.DB
}

func NewTagController(db *gorm.DB) *TagController {
	return &TagController{db: db}
}

// Index lists all tags
func (ctrl *TagController) Index(c *gin.Context) {
	var tags []models.Tag
	ctrl.db.Order("name ASC").Find(&tags)

	resp := make([]structs.TagResponse, len(tags))
	for i, t := range tags {
		resp[i] = structs.TagResponse{
			ID:        t.ID,
			Name:      t.Name,
			Slug:      t.Slug,
			CreatedAt: t.CreatedAt,
			UpdatedAt: t.UpdatedAt,
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get tags success", resp)
}
