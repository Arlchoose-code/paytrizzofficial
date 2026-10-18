package admin

import (
	"encoding/json"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type SEOSettingController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewSEOSettingController(revalidateService *services.RevalidateService, auditService *services.AuditService) *SEOSettingController {
	return &SEOSettingController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists all SEO settings
func (ctrl *SEOSettingController) Index(c *gin.Context) {
	var settings []models.SEOSetting
	if err := config.DB.Preload("OGMedia").Order("id ASC").Find(&settings).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch SEO settings")
		return
	}

	var resp []structs.SEOSettingResponse
	for _, s := range settings {
		resp = append(resp, structs.SEOSettingResponse{
			ID:          s.ID,
			PageKey:     s.PageKey,
			Title:       s.Title,
			Description: s.Description,
			OGMediaID:   s.OGMediaID,
			OGMedia:     helpers.FormatMediaResponse(s.OGMedia),
			RobotsIndex: s.RobotsIndex,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get SEO settings success", resp)
}

// Show returns SEO setting for a specific page key
func (ctrl *SEOSettingController) Show(c *gin.Context) {
	pageKey := c.Param("page_key")

	var setting models.SEOSetting
	if err := config.DB.Preload("OGMedia").Where("page_key = ?", pageKey).First(&setting).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "SEO setting not found")
		return
	}

	resp := structs.SEOSettingResponse{
		ID:          setting.ID,
		PageKey:     setting.PageKey,
		Title:       setting.Title,
		Description: setting.Description,
		OGMediaID:   setting.OGMediaID,
		OGMedia:     helpers.FormatMediaResponse(setting.OGMedia),
		RobotsIndex: setting.RobotsIndex,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get SEO setting success", resp)
}

// Update updates SEO setting for a page key
func (ctrl *SEOSettingController) Update(c *gin.Context) {
	pageKey := c.Param("page_key")

	var req structs.UpdateSEOSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var setting models.SEOSetting
	if err := config.DB.Where("page_key = ?", pageKey).First(&setting).Error; err != nil {
		setting = models.SEOSetting{
			PageKey:     pageKey,
			Title:       req.Title,
			Description: req.Description,
			OGMediaID:   req.OGMediaID,
			RobotsIndex: true,
		}
		if req.RobotsIndex != nil {
			setting.RobotsIndex = *req.RobotsIndex
		}
		if err := config.DB.Create(&setting).Error; err != nil {
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to create SEO setting")
			return
		}
	} else {
		setting.Title = req.Title
		setting.Description = req.Description
		setting.OGMediaID = req.OGMediaID
		if req.RobotsIndex != nil {
			setting.RobotsIndex = *req.RobotsIndex
		}
		if err := config.DB.Save(&setting).Error; err != nil {
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to update SEO setting")
			return
		}
	}

	// If updating SEO for home, synchronize site_description in site_settings so they never drift apart
	if pageKey == "home" && setting.Description != "" {
		jsonDesc, err := json.Marshal(setting.Description)
		if err == nil {
			config.DB.Model(&models.SiteSetting{}).Where("`key` = ?", "site_description").Update("value", string(jsonDesc))
			ctrl.revalidateService.QueueRevalidateTag("settings", nil)
		}
	}

	path := "/"
	if pageKey != "home" {
		path = "/" + pageKey
	}
	ctrl.revalidateService.QueueRevalidateTag("seo", &path)
	ctrl.revalidateService.QueueRevalidateTag("page-"+pageKey, &path)
	ctrl.auditService.LogContext(c, "seo", "update", "seo_setting", &setting.ID, "Updated SEO setting for "+pageKey, setting)

	helpers.RespondSuccess(c, http.StatusOK, "SEO setting updated successfully", setting)
}
