package public

import (
	"fmt"
	"net/http"
	"strings"

	"paytrizz-backend/config"
	"paytrizz-backend/models"

	"github.com/gin-gonic/gin"
)

type RobotsController struct{}

func NewRobotsController() *RobotsController {
	return &RobotsController{}
}

// settingsMap loads admin-managed robots toggles (PRD 4.2)
func settingsMap(keys []string) map[string]string {
	out := make(map[string]string, len(keys))
	var settings []models.SiteSetting
	config.DB.Where("`key` IN ?", keys).Find(&settings)
	for _, s := range settings {
		val := strings.Trim(s.Value, `"`)
		out[s.Key] = val
	}
	return out
}

func isOn(m map[string]string, key string, fallback bool) bool {
	val, ok := m[key]
	if !ok || val == "" {
		return fallback
	}
	return val == "true" || val == "1"
}

// Index generates robots.txt content from admin toggles, not raw text input
func (ctrl *RobotsController) Index(c *gin.Context) {
	baseURL := "https://paytrizz.com"
	var siteURLSetting models.SiteSetting
	if err := config.DB.Where("`key` = ?", "site_url").First(&siteURLSetting).Error; err == nil {
		baseURL = strings.Trim(siteURLSetting.Value, `"`)
	}

	toggles := settingsMap([]string{
		"robots_index_talents",
		"robots_index_projects",
		"robots_index_blog",
		"robots_allow_ai_crawler",
	})

	var b strings.Builder
	b.WriteString("User-agent: *\n")
	b.WriteString("Allow: /\n")

	// Always private — never indexable (PRD 4.2)
	b.WriteString("Disallow: /admin\n")
	b.WriteString("Disallow: /api/admin\n")
	b.WriteString("Disallow: /talent\n")
	b.WriteString("Disallow: /login\n")

	if !isOn(toggles, "robots_index_talents", true) {
		b.WriteString("Disallow: /talents\n")
	}
	if !isOn(toggles, "robots_index_projects", true) {
		b.WriteString("Disallow: /projects\n")
	}
	if !isOn(toggles, "robots_index_blog", true) {
		b.WriteString("Disallow: /blog\n")
	}

	// AI crawler policy — opt-out blocks the common AI training crawlers
	if !isOn(toggles, "robots_allow_ai_crawler", true) {
		aiBots := []string{
			"GPTBot", "ChatGPT-User", "CCBot", "ClaudeBot", "Claude-Web",
			"Google-Extended", "anthropic-ai", "Bytespider", "PetalBot",
			"Amazonbot", "Applebot-Extended", "Meta-ExternalAgent",
		}
		for _, bot := range aiBots {
			fmt.Fprintf(&b, "\nUser-agent: %s\nDisallow: /\n", bot)
		}
	}

	fmt.Fprintf(&b, "\nSitemap: %s/sitemap.xml\n", baseURL)

	c.Data(http.StatusOK, "text/plain; charset=utf-8", []byte(b.String()))
}
