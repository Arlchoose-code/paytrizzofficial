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

type SocialLinkController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewSocialLinkController(revalidateService *services.RevalidateService, auditService *services.AuditService) *SocialLinkController {
	return &SocialLinkController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists all social links ordered by sort_order
func (ctrl *SocialLinkController) Index(c *gin.Context) {
	var links []models.SocialLink
	if err := config.DB.Order("sort_order ASC, id ASC").Find(&links).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch social links")
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

// Store creates a new social link
func (ctrl *SocialLinkController) Store(c *gin.Context) {
	var req structs.CreateSocialLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}

	link := models.SocialLink{
		Platform:  req.Platform,
		Label:     req.Label,
		URL:       req.URL,
		SortOrder: req.SortOrder,
		IsActive:  isActive,
	}

	if err := config.DB.Create(&link).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create social link")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("socials", nil)
	ctrl.auditService.LogContext(c, "socials", "create", "social_link", &link.ID, "Created social link "+link.Platform, link)

	helpers.RespondSuccess(c, http.StatusCreated, "Social link created successfully", link)
}

// Show returns a social link by ID
func (ctrl *SocialLinkController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid social link ID")
		return
	}

	var link models.SocialLink
	if err := config.DB.Where("id = ?", id).First(&link).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Social link not found")
		return
	}

	resp := structs.SocialLinkResponse{
		ID:        link.ID,
		Platform:  link.Platform,
		Label:     link.Label,
		URL:       link.URL,
		SortOrder: link.SortOrder,
		IsActive:  link.IsActive,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get social link success", resp)
}

// Update updates an existing social link
func (ctrl *SocialLinkController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid social link ID")
		return
	}

	var req structs.UpdateSocialLinkRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var link models.SocialLink
	if err := config.DB.Where("id = ?", id).First(&link).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Social link not found")
		return
	}

	link.Platform = req.Platform
	link.Label = req.Label
	link.URL = req.URL
	link.SortOrder = req.SortOrder
	if req.IsActive != nil {
		link.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&link).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update social link")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("socials", nil)
	ctrl.auditService.LogContext(c, "socials", "update", "social_link", &link.ID, "Updated social link "+link.Platform, link)

	helpers.RespondSuccess(c, http.StatusOK, "Social link updated successfully", link)
}

// Destroy deletes a social link
func (ctrl *SocialLinkController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid social link ID")
		return
	}

	var link models.SocialLink
	if err := config.DB.Where("id = ?", id).First(&link).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Social link not found")
		return
	}

	if err := config.DB.Delete(&link).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete social link")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("socials", nil)
	ctrl.auditService.LogContext(c, "socials", "delete", "social_link", &link.ID, "Deleted social link "+link.Platform, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Social link deleted successfully", nil)
}
