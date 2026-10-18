package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/models"
	"paytrizz-backend/helpers"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type AuditLogController struct{}

func NewAuditLogController() *AuditLogController {
	return &AuditLogController{}
}

// Index lists audit logs with pagination and filters
func (ctrl *AuditLogController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)

	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}

	db := config.DB.Model(&models.AuditLog{}).Preload("ActorUser")

	if module := c.Query("module"); module != "" {
		db = db.Where("module = ?", module)
	}

	if action := c.Query("action"); action != "" {
		db = db.Where("action = ?", action)
	}

	var total int64
	db.Count(&total)

	var items []models.AuditLog
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&items).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve audit logs")
		return
	}

	var respList []structs.AuditLogResponse
	for _, a := range items {
		actorName := "System"
		if a.ActorUser != nil {
			actorName = a.ActorUser.Name
		}

		respList = append(respList, structs.AuditLogResponse{
			ID:          a.ID,
			ActorUserID: a.ActorUserID,
			ActorName:   actorName,
			Module:      a.Module,
			Action:      a.Action,
			TargetType:  a.TargetType,
			TargetID:    a.TargetID,
			Summary:     a.Summary,
			IP:          a.IP,
			CreatedAt:   a.CreatedAt,
		})
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get audit logs success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        respList,
	})
}
