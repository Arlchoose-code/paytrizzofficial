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

type BadgeController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewBadgeController(revalidateService *services.RevalidateService, auditService *services.AuditService) *BadgeController {
	return &BadgeController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists badges ordered by sort_order
func (ctrl *BadgeController) Index(c *gin.Context) {
	var badges []models.Badge
	if err := config.DB.Order("sort_order ASC, id ASC").Find(&badges).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch badges")
		return
	}

	resp := make([]structs.BadgeResponse, 0, len(badges))
	for _, b := range badges {
		resp = append(resp, structs.BadgeResponse{
			ID:        b.ID,
			Key:       b.Key,
			Label:     b.Label,
			Color:     b.Color,
			Icon:      b.Icon,
			SortOrder: b.SortOrder,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get badges success", resp)
}

// Store creates a new badge
func (ctrl *BadgeController) Store(c *gin.Context) {
	var req structs.CreateBadgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	key := strings.ToLower(strings.TrimSpace(req.Key))
	key = strings.ReplaceAll(key, " ", "-")

	var count int64
	config.DB.Model(&models.Badge{}).Where("`key` = ?", key).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Badge key already exists")
		return
	}

	badge := models.Badge{
		Key:       key,
		Label:     req.Label,
		Color:     req.Color,
		Icon:      req.Icon,
		SortOrder: req.SortOrder,
	}

	if err := config.DB.Create(&badge).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create badge")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "badges", "create", "badge", &badge.ID, "Created badge "+badge.Label, badge)

	helpers.RespondSuccess(c, http.StatusCreated, "Badge created successfully", structs.BadgeResponse{
		ID:        badge.ID,
		Key:       badge.Key,
		Label:     badge.Label,
		Color:     badge.Color,
		Icon:      badge.Icon,
		SortOrder: badge.SortOrder,
	})
}

// Show returns a badge by ID
func (ctrl *BadgeController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid badge ID")
		return
	}

	var badge models.Badge
	if err := config.DB.Where("id = ?", id).First(&badge).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Badge not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get badge success", structs.BadgeResponse{
		ID:        badge.ID,
		Key:       badge.Key,
		Label:     badge.Label,
		Color:     badge.Color,
		Icon:      badge.Icon,
		SortOrder: badge.SortOrder,
	})
}

// Update updates an existing badge
func (ctrl *BadgeController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid badge ID")
		return
	}

	var req structs.UpdateBadgeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var badge models.Badge
	if err := config.DB.Where("id = ?", id).First(&badge).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Badge not found")
		return
	}

	key := strings.ToLower(strings.TrimSpace(req.Key))
	key = strings.ReplaceAll(key, " ", "-")

	var count int64
	config.DB.Model(&models.Badge{}).Where("`key` = ? AND id != ?", key, badge.ID).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Badge key already exists")
		return
	}

	badge.Key = key
	badge.Label = req.Label
	badge.Color = req.Color
	badge.Icon = req.Icon
	badge.SortOrder = req.SortOrder

	if err := config.DB.Save(&badge).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update badge")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "badges", "update", "badge", &badge.ID, "Updated badge "+badge.Label, badge)

	helpers.RespondSuccess(c, http.StatusOK, "Badge updated successfully", structs.BadgeResponse{
		ID:        badge.ID,
		Key:       badge.Key,
		Label:     badge.Label,
		Color:     badge.Color,
		Icon:      badge.Icon,
		SortOrder: badge.SortOrder,
	})
}

// Destroy deletes a badge
func (ctrl *BadgeController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid badge ID")
		return
	}

	var badge models.Badge
	if err := config.DB.Where("id = ?", id).First(&badge).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Badge not found")
		return
	}

	if err := config.DB.Select("TalentBadges").Delete(&badge).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete badge")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "badges", "delete", "badge", &badge.ID, "Deleted badge "+badge.Label, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Badge deleted successfully", nil)
}
