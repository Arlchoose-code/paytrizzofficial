package public

import (
	"encoding/json"
	"net/http"
	"strings"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"

	"github.com/gin-gonic/gin"
)

type SettingController struct{}

func NewSettingController() *SettingController {
	return &SettingController{}
}

// CleanSettingValue decodes or strips wrapping quotes from JSON strings
func CleanSettingValue(v string) string {
	trimmed := strings.TrimSpace(v)
	if trimmed == "" || trimmed == `""` {
		return ""
	}
	var strVal string
	if err := json.Unmarshal([]byte(trimmed), &strVal); err == nil {
		return strVal
	}
	return strings.Trim(trimmed, `"`)
}

// Index returns all public site settings as a key-value dictionary
func (ctrl *SettingController) Index(c *gin.Context) {
	var settings []models.SiteSetting
	if err := config.DB.Where("is_public = ?", true).Order("id ASC").Find(&settings).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve public settings")
		return
	}

	dict := make(map[string]string)
	for _, s := range settings {
		dict[s.Key] = CleanSettingValue(s.Value)
	}

	// Alias logo and favicon keys for convenience across frontend components
	if dict["logo_url"] == "" && dict["site_logo_light"] != "" {
		dict["logo_url"] = dict["site_logo_light"]
	}
	if dict["site_logo_light"] == "" && dict["logo_url"] != "" {
		dict["site_logo_light"] = dict["logo_url"]
	}

	if dict["logo_dark_url"] == "" && dict["site_logo_dark"] != "" {
		dict["logo_dark_url"] = dict["site_logo_dark"]
	}
	if dict["site_logo_dark"] == "" && dict["logo_dark_url"] != "" {
		dict["site_logo_dark"] = dict["logo_dark_url"]
	}

	if dict["favicon_url"] == "" && dict["site_favicon"] != "" {
		dict["favicon_url"] = dict["site_favicon"]
	}
	if dict["site_favicon"] == "" && dict["favicon_url"] != "" {
		dict["site_favicon"] = dict["favicon_url"]
	}

	// Default fallback values
	defaults := map[string]string{
		"site_name":              "PayTrizz",
		"site_tagline":           "Vetted Elite Tech Squads",
		"site_description":       "Talent Agency Platform connecting you with vetted specialists in development, design, and digital growth.",
		"footer_text":            "© 2026 PayTrizz. All rights reserved.",
		"contact_email":          "hello@paytrizz.com",
		"contact_phone":          "+62 812-3456-7890",
		"contact_address":        "Jakarta Selatan, DKI Jakarta, Indonesia",
		"contact_reply_eta_text": "1–2 business days",
	}

	for k, v := range defaults {
		if val, exists := dict[k]; !exists || val == "" {
			dict[k] = v
		}
	}

	if _, exists := dict["title_separator"]; !exists {
		dict["title_separator"] = "—"
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get public settings success", dict)
}
