package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type SpecialtyController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewSpecialtyController(revalidateService *services.RevalidateService, auditService *services.AuditService) *SpecialtyController {
	return &SpecialtyController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists specialties ordered by sort_order
func (ctrl *SpecialtyController) Index(c *gin.Context) {
	var specialties []models.Specialty
	if err := config.DB.Order("sort_order ASC, id ASC").Find(&specialties).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch specialties")
		return
	}

	resp := make([]structs.SpecialtyResponse, 0, len(specialties))
	for _, s := range specialties {
		resp = append(resp, structs.SpecialtyResponse{
			ID:          s.ID,
			Key:         s.Key,
			Name:        s.Name,
			Icon:        s.Icon,
			Description: s.Description,
			SortOrder:   s.SortOrder,
			IsActive:    s.IsActive,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get specialties success", resp)
}

// Store creates a new specialty
func (ctrl *SpecialtyController) Store(c *gin.Context) {
	var req structs.CreateSpecialtyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	key := strings.TrimSpace(req.Key)
	key = strings.ReplaceAll(key, " ", "-")

	var count int64
	config.DB.Model(&models.Specialty{}).Where("`key` = ?", key).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Specialty key already exists")
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	specialty := models.Specialty{
		Key:         key,
		Name:        req.Name,
		Icon:        req.Icon,
		Description: req.Description,
		SortOrder:   req.SortOrder,
		IsActive:    isActive,
	}

	if err := config.DB.Create(&specialty).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create specialty")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "specialties", "create", "specialty", &specialty.ID, "Created specialty "+specialty.Name, specialty)

	helpers.RespondSuccess(c, http.StatusCreated, "Specialty created successfully", structs.SpecialtyResponse{
		ID:          specialty.ID,
		Key:         specialty.Key,
		Name:        specialty.Name,
		Icon:        specialty.Icon,
		Description: specialty.Description,
		SortOrder:   specialty.SortOrder,
		IsActive:    specialty.IsActive,
	})
}

// Show returns a specialty by ID
func (ctrl *SpecialtyController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid specialty ID")
		return
	}

	var specialty models.Specialty
	if err := config.DB.Where("id = ?", id).First(&specialty).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Specialty not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get specialty success", structs.SpecialtyResponse{
		ID:          specialty.ID,
		Key:         specialty.Key,
		Name:        specialty.Name,
		Icon:        specialty.Icon,
		Description: specialty.Description,
		SortOrder:   specialty.SortOrder,
		IsActive:    specialty.IsActive,
	})
}

// Update updates an existing specialty
func (ctrl *SpecialtyController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid specialty ID")
		return
	}

	var req structs.UpdateSpecialtyRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var specialty models.Specialty
	if err := config.DB.Where("id = ?", id).First(&specialty).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Specialty not found")
		return
	}

	key := strings.TrimSpace(req.Key)
	key = strings.ReplaceAll(key, " ", "-")

	var count int64
	config.DB.Model(&models.Specialty{}).Where("`key` = ? AND id != ?", key, specialty.ID).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Specialty key already exists")
		return
	}

	specialty.Key = key
	specialty.Name = req.Name
	specialty.Icon = req.Icon
	specialty.Description = req.Description
	specialty.SortOrder = req.SortOrder
	if req.IsActive != nil {
		specialty.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&specialty).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update specialty")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "specialties", "update", "specialty", &specialty.ID, "Updated specialty "+specialty.Name, specialty)

	helpers.RespondSuccess(c, http.StatusOK, "Specialty updated successfully", structs.SpecialtyResponse{
		ID:          specialty.ID,
		Key:         specialty.Key,
		Name:        specialty.Name,
		Icon:        specialty.Icon,
		Description: specialty.Description,
		SortOrder:   specialty.SortOrder,
		IsActive:    specialty.IsActive,
	})
}

// Destroy deletes a specialty
func (ctrl *SpecialtyController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid specialty ID")
		return
	}

	var specialty models.Specialty
	if err := config.DB.Where("id = ?", id).First(&specialty).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Specialty not found")
		return
	}

	if err := config.DB.Select("TalentSpecialties").Delete(&specialty).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete specialty")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "specialties", "delete", "specialty", &specialty.ID, "Deleted specialty "+specialty.Name, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Specialty deleted successfully", nil)
}
