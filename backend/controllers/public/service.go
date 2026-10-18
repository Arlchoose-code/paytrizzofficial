package public

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type ServiceController struct{}

func NewServiceController() *ServiceController {
	return &ServiceController{}
}

// Index lists all active services
func (ctrl *ServiceController) Index(c *gin.Context) {
	var servicesList []models.Service
	if err := config.DB.Preload("ImageMedia").
		Where("is_active = true").
		Order("sort_order ASC, id ASC").
		Find(&servicesList).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve services")
		return
	}

	var resp []structs.ServiceResponse
	for _, s := range servicesList {
		resp = append(resp, structs.ServiceResponse{
			ID:           s.ID,
			Title:        s.Title,
			Slug:         s.Slug,
			Description:  s.Description,
			Icon:         s.Icon,
			ImageMediaID: s.ImageMediaID,
			ImageMedia:   helpers.FormatMediaResponse(s.ImageMedia),
			SortOrder:    s.SortOrder,
			IsActive:     s.IsActive,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get services success", resp)
}

// Show retrieves a service by its slug
func (ctrl *ServiceController) Show(c *gin.Context) {
	slug := c.Param("slug")

	var service models.Service
	if err := config.DB.Preload("ImageMedia").
		Where("slug = ? AND is_active = true", slug).
		First(&service).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Service not found")
		return
	}

	resp := structs.ServiceResponse{
		ID:           service.ID,
		Title:        service.Title,
		Slug:         service.Slug,
		Description:  service.Description,
		Icon:         service.Icon,
		ImageMediaID: service.ImageMediaID,
		ImageMedia:   helpers.FormatMediaResponse(service.ImageMedia),
		SortOrder:    service.SortOrder,
		IsActive:     service.IsActive,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get service success", resp)
}
