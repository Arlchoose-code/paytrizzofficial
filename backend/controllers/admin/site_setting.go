package admin

import (
	"encoding/json"
	"errors"
	"net/http"
	"strings"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SiteSettingController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewSiteSettingController(revalidateService *services.RevalidateService, auditService *services.AuditService) *SiteSettingController {
	return &SiteSettingController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

func formatJSONSettingValue(key string, v string, sType models.SettingType) string {
	if sType == models.SettingTypeString || sType == models.SettingTypeText ||
		key == "title_separator" || key == "title_format" || key == "meta_keywords" ||
		strings.HasPrefix(key, "social_") || strings.HasPrefix(key, "contact_") ||
		key == "site_name" || key == "site_tagline" || key == "site_description" || key == "footer_text" {
		encoded, err := json.Marshal(v)
		if err != nil {
			return `""`
		}
		return string(encoded)
	}

	trimmed := strings.TrimSpace(v)
	if trimmed == "" {
		return `""`
	}
	if json.Valid([]byte(trimmed)) {
		return trimmed
	}
	encoded, err := json.Marshal(v)
	if err != nil {
		return `""`
	}
	return string(encoded)
}

func syncSocialLink(k, v string) {
	if strings.HasPrefix(k, "social_") {
		platform := strings.TrimPrefix(k, "social_")
		var soc models.SocialLink
		if err := config.DB.Where("platform = ?", platform).First(&soc).Error; err == nil {
			soc.URL = v
			soc.IsActive = strings.TrimSpace(v) != ""
			_ = config.DB.Save(&soc).Error
		} else if strings.TrimSpace(v) != "" {
			label := strings.ToUpper(platform[:1]) + platform[1:]
			if platform == "twitter" {
				label = "X (Twitter)"
			} else if platform == "linkedin" {
				label = "LinkedIn"
			} else if platform == "github" {
				label = "GitHub"
			}
			newSoc := models.SocialLink{
				Platform: platform,
				Label:    label,
				URL:      v,
				IsActive: true,
			}
			_ = config.DB.Create(&newSoc).Error
		}
	}
}

// Index lists settings optionally filtered by group
func (ctrl *SiteSettingController) Index(c *gin.Context) {
	group := c.Query("group")
	db := config.DB.Model(&models.SiteSetting{})
	if group != "" {
		db = db.Where("`group` = ?", group)
	}

	var settings []models.SiteSetting
	if err := db.Order("id ASC").Find(&settings).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve site settings")
		return
	}

	var resp []structs.SiteSettingResponse
	for _, s := range settings {
		resp = append(resp, structs.SiteSettingResponse{
			ID:       s.ID,
			Group:    s.Group,
			Key:      s.Key,
			Value:    s.Value,
			Type:     string(s.Type),
			IsPublic: s.IsPublic,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get site settings success", resp)
}

// Update updates a single site setting
func (ctrl *SiteSettingController) Update(c *gin.Context) {
	key := c.Param("key")
	var setting models.SiteSetting
	if err := config.DB.Where("`key` = ?", key).First(&setting).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Setting not found")
		return
	}

	var req structs.UpdateSettingRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	setting.Value = formatJSONSettingValue(setting.Key, req.Value, setting.Type)
	if err := config.DB.Save(&setting).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update setting")
		return
	}

	if strings.HasPrefix(setting.Key, "social_") {
		syncSocialLink(setting.Key, req.Value)
		ctrl.revalidateService.QueueRevalidateTag("socials", nil)
	}

	adminIDVal, _ := c.Get("UserID")
	var adminID *uint64
	if adminIDVal != nil {
		id := adminIDVal.(uint64)
		adminID = &id
	}

	ctrl.auditService.Log(adminID, "settings", "update", "site_setting", &setting.ID, "Updated setting "+setting.Key, nil, c.ClientIP(), c.GetHeader("User-Agent"))
	ctrl.revalidateService.QueueRevalidateTag("settings", nil)

	helpers.RespondSuccess(c, http.StatusOK, "Setting updated successfully", structs.SiteSettingResponse{
		ID:       setting.ID,
		Group:    setting.Group,
		Key:      setting.Key,
		Value:    setting.Value,
		Type:     string(setting.Type),
		IsPublic: setting.IsPublic,
	})
}

// BulkUpdate updates multiple settings in batch
func (ctrl *SiteSettingController) BulkUpdate(c *gin.Context) {
	var req structs.BulkUpdateSettingsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	adminIDVal, _ := c.Get("UserID")
	var adminID *uint64
	if adminIDVal != nil {
		id := adminIDVal.(uint64)
		adminID = &id
	}

	for k, v := range req.Settings {
		group := "general"
		if strings.HasPrefix(k, "mail_") || strings.HasPrefix(k, "aws_") {
			group = "mail"
		} else if strings.HasPrefix(k, "seo_") || strings.HasPrefix(k, "title_") || k == "meta_keywords" {
			group = "seo"
		} else if strings.HasPrefix(k, "social_") {
			group = "social"
		} else if strings.HasPrefix(k, "robots_") {
			group = "robots"
		} else if strings.HasPrefix(k, "contact_") {
			group = "contact"
		} else if strings.HasPrefix(k, "feature_") || strings.HasPrefix(k, "turnstile_") || k == "maintenance_mode" {
			group = "features"
		} else if strings.HasPrefix(k, "admin_") || strings.HasPrefix(k, "notify_") {
			group = "notifications"
		}

		var existing models.SiteSetting
		err := config.DB.Where("`key` = ?", k).First(&existing).Error
		jsonVal := formatJSONSettingValue(k, v, existing.Type)

		if err == nil {
			if err := config.DB.Model(&existing).Update("value", jsonVal).Error; err != nil {
				helpers.RespondError(c, http.StatusInternalServerError, "Failed to update setting: "+k)
				return
			}
		} else if errors.Is(err, gorm.ErrRecordNotFound) {
			newSetting := models.SiteSetting{
				Group:    group,
				Key:      k,
				Value:    jsonVal,
				Type:     models.SettingTypeString,
				IsPublic: true,
			}
			if err := config.DB.Create(&newSetting).Error; err != nil {
				helpers.RespondError(c, http.StatusInternalServerError, "Failed to create setting: "+k)
				return
			}
		} else {
			helpers.RespondError(c, http.StatusInternalServerError, "Database error querying setting: "+k)
			return
		}

		// Synchronize social platform URLs to social_links table
		syncSocialLink(k, v)

		// Synchronize site_description to home SEO setting so they are never disjointed
		if k == "site_description" && strings.TrimSpace(v) != "" {
			config.DB.Model(&models.SEOSetting{}).Where("page_key = ?", "home").Update("description", strings.Trim(v, "\""))
		}
	}

	ctrl.revalidateService.QueueRevalidateTag("socials", nil)

	ctrl.auditService.Log(adminID, "settings", "bulk_update", "site_setting", nil, "Bulk updated site settings", nil, c.ClientIP(), c.GetHeader("User-Agent"))
	ctrl.revalidateService.QueueRevalidateTag("settings", nil)

	helpers.RespondSuccess(c, http.StatusOK, "Site settings updated successfully", nil)
}
