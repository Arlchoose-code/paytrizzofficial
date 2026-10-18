package public

import (
	"encoding/xml"
	"fmt"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/models"

	"github.com/gin-gonic/gin"
)

type URL struct {
	Loc        string `xml:"loc"`
	LastMod    string `xml:"lastmod,omitempty"`
	ChangeFreq string `xml:"changefreq,omitempty"`
	Priority   string `xml:"priority,omitempty"`
}

type URLSet struct {
	XMLName xml.Name `xml:"http://www.sitemaps.org/schemas/sitemap/0.9 urlset"`
	URLs    []URL    `xml:"url"`
}

type SitemapController struct{}

func NewSitemapController() *SitemapController {
	return &SitemapController{}
}

// Index generates dynamic XML sitemap
func (ctrl *SitemapController) Index(c *gin.Context) {
	baseURL := "https://paytrizz.com"
	var siteSetting models.SiteSetting
	if err := config.DB.Where("`key` = ?", "site_url").First(&siteSetting).Error; err == nil && siteSetting.Value != "" {
		baseURL = siteSetting.Value
	}

	urls := []URL{
		{Loc: baseURL + "/", ChangeFreq: "daily", Priority: "1.0"},
		{Loc: baseURL + "/about", ChangeFreq: "weekly", Priority: "0.8"},
		{Loc: baseURL + "/services", ChangeFreq: "weekly", Priority: "0.9"},
		{Loc: baseURL + "/talents", ChangeFreq: "daily", Priority: "0.9"},
		{Loc: baseURL + "/projects", ChangeFreq: "weekly", Priority: "0.8"},
		{Loc: baseURL + "/blog", ChangeFreq: "daily", Priority: "0.8"},
		{Loc: baseURL + "/contact", ChangeFreq: "monthly", Priority: "0.7"},
		{Loc: baseURL + "/join", ChangeFreq: "monthly", Priority: "0.7"},
	}

	// Add dynamic services
	var services []models.Service
	config.DB.Where("is_active = true").Find(&services)
	for _, s := range services {
		urls = append(urls, URL{
			Loc:        fmt.Sprintf("%s/services/%s", baseURL, s.Slug),
			LastMod:    s.UpdatedAt.Format("2006-01-02"),
			ChangeFreq: "weekly",
			Priority:   "0.8",
		})
	}

	urlSet := URLSet{URLs: urls}
	xmlData, err := xml.MarshalIndent(urlSet, "", "  ")
	if err != nil {
		c.String(http.StatusInternalServerError, "Failed to generate sitemap")
		return
	}

	response := []byte(xml.Header + string(xmlData))
	c.Data(http.StatusOK, "application/xml; charset=utf-8", response)
}
