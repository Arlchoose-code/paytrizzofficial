package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
)

type ServiceController struct {
	slugService       *services.SlugService
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewServiceController(
	slugService *services.SlugService,
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
) *ServiceController {
	return &ServiceController{
		slugService:       slugService,
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists services with optional search and pagination
func (ctrl *ServiceController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}

	db := config.DB.Model(&models.Service{}).Preload("ImageMedia")
	if query.Search != "" {
		db = db.Where("title LIKE ?", "%"+query.Search+"%")
	}

	var total int64
	db.Count(&total)

	var servicesList []models.Service
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("sort_order ASC, id ASC").Offset(offset).Limit(query.PerPage).Find(&servicesList).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch services")
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

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get services success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        resp,
	})
}

// Store creates a new service
func (ctrl *ServiceController) Store(c *gin.Context) {
	var req structs.CreateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	slug := ctrl.slugService.GenerateUniqueSlug("services", req.Title, nil)
	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	service := models.Service{
		Title:        req.Title,
		Slug:         slug,
		Description:  req.Description,
		Icon:         req.Icon,
		ImageMediaID: req.ImageMediaID,
		SortOrder:    req.SortOrder,
		IsActive:     isActive,
	}

	if err := config.DB.Create(&service).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create service")
		return
	}

	pathServices := "/services"
	ctrl.revalidateService.QueueRevalidateTag("services", &pathServices)
	ctrl.auditService.LogContext(c, "services", "create", "service", &service.ID, "Created service "+service.Title, service)

	helpers.RespondSuccess(c, http.StatusCreated, "Service created successfully", service)
}

// Show returns a service by ID
func (ctrl *ServiceController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid service ID")
		return
	}

	var service models.Service
	if err := config.DB.Preload("ImageMedia").Where("id = ?", id).First(&service).Error; err != nil {
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

// Update updates an existing service
func (ctrl *ServiceController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid service ID")
		return
	}

	var req structs.UpdateServiceRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var service models.Service
	if err := config.DB.Where("id = ?", id).First(&service).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Service not found")
		return
	}

	service.Title = req.Title
	service.Description = req.Description
	service.Icon = req.Icon
	service.ImageMediaID = req.ImageMediaID
	service.SortOrder = req.SortOrder
	if req.IsActive != nil {
		service.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&service).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update service")
		return
	}

	pathServices := "/services"
	ctrl.revalidateService.QueueRevalidateTag("services", &pathServices)
	ctrl.auditService.LogContext(c, "services", "update", "service", &service.ID, "Updated service "+service.Title, service)

	helpers.RespondSuccess(c, http.StatusOK, "Service updated successfully", service)
}

// Destroy deletes a service
func (ctrl *ServiceController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid service ID")
		return
	}

	var service models.Service
	if err := config.DB.Where("id = ?", id).First(&service).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Service not found")
		return
	}

	if err := config.DB.Delete(&service).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete service")
		return
	}

	pathServices := "/services"
	ctrl.revalidateService.QueueRevalidateTag("services", &pathServices)
	ctrl.auditService.LogContext(c, "services", "delete", "service", &service.ID, "Deleted service "+service.Title, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Service deleted successfully", nil)
}
