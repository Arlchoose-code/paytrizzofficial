package admin

import (
	"encoding/json"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PageController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewPageController(revalidateService *services.RevalidateService, auditService *services.AuditService) *PageController {
	return &PageController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists all CMS pages
func (ctrl *PageController) Index(c *gin.Context) {
	var pages []models.Page
	if err := config.DB.Order("id ASC").Find(&pages).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch pages")
		return
	}

	var resp []structs.PageResponse
	for _, p := range pages {
		resp = append(resp, structs.PageResponse{
			ID:        p.ID,
			Key:       p.Key,
			Title:     p.Title,
			IsActive:  p.IsActive,
			CreatedAt: p.CreatedAt,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get pages success", resp)
}

// Show returns a page by ID with all sections
func (ctrl *PageController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid page ID")
		return
	}

	var page models.Page
	if err := config.DB.Preload("Sections", func(db *gorm.DB) *gorm.DB {
		return db.Order("sort_order ASC, id ASC")
	}).Where("id = ?", id).First(&page).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Page not found")
		return
	}

	var sectionsResp []structs.PageSectionResponse
	for _, s := range page.Sections {
		var contentData any
		_ = json.Unmarshal([]byte(s.Content), &contentData)

		sectionsResp = append(sectionsResp, structs.PageSectionResponse{
			ID:        s.ID,
			PageID:    s.PageID,
			Key:       s.Key,
			Type:      string(s.Type),
			Content:   contentData,
			SortOrder: s.SortOrder,
			IsVisible: s.IsVisible,
		})
	}

	resp := structs.PageResponse{
		ID:        page.ID,
		Key:       page.Key,
		Title:     page.Title,
		IsActive:  page.IsActive,
		Sections:  sectionsResp,
		CreatedAt: page.CreatedAt,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get page success", resp)
}

// Update updates page basic info
func (ctrl *PageController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid page ID")
		return
	}

	var req structs.UpdatePageRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var page models.Page
	if err := config.DB.Where("id = ?", id).First(&page).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Page not found")
		return
	}

	page.Title = req.Title
	if req.IsActive != nil {
		page.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&page).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update page")
		return
	}

	path := "/"
	if page.Key != "home" {
		path = "/" + page.Key
	}
	ctrl.revalidateService.QueueRevalidateTag("page-"+page.Key, &path)
	ctrl.auditService.LogContext(c, "pages", "update", "page", &page.ID, "Updated page "+page.Title, page)

	helpers.RespondSuccess(c, http.StatusOK, "Page updated successfully", page)
}

// UpdateSection updates a section's content and visibility
func (ctrl *PageController) UpdateSection(c *gin.Context) {
	sectionID, err := strconv.ParseUint(c.Param("section_id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid section ID")
		return
	}

	var req structs.UpdatePageSectionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var section models.PageSection
	if err := config.DB.Where("id = ?", sectionID).First(&section).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Section not found")
		return
	}

	// Verify valid JSON
	var jsonCheck any
	if err := json.Unmarshal([]byte(req.Content), &jsonCheck); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Content must be valid JSON")
		return
	}

	section.Content = req.Content
	if req.SortOrder != nil {
		section.SortOrder = *req.SortOrder
	}
	if req.IsVisible != nil {
		section.IsVisible = *req.IsVisible
	}

	if err := config.DB.Save(&section).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update section")
		return
	}

	var page models.Page
	config.DB.Where("id = ?", section.PageID).First(&page)
	path := "/"
	if page.Key != "home" {
		path = "/" + page.Key
	}
	ctrl.revalidateService.QueueRevalidateTag("page-"+page.Key, &path)
	ctrl.auditService.LogContext(c, "pages", "update_section", "page_section", &section.ID, "Updated section "+section.Key, section)

	helpers.RespondSuccess(c, http.StatusOK, "Section updated successfully", section)
}

// ReorderSections updates sort orders for page sections
func (ctrl *PageController) ReorderSections(c *gin.Context) {
	pageID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid page ID")
		return
	}

	var req structs.ReorderPageSectionsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	sectionIDs := req.SectionIDs
	if len(sectionIDs) == 0 && len(req.OrderedIDs) > 0 {
		sectionIDs = req.OrderedIDs
	}
	if len(sectionIDs) == 0 {
		helpers.RespondError(c, http.StatusBadRequest, "No sections provided")
		return
	}

	tx := config.DB.Begin()
	for idx, sID := range sectionIDs {
		if err := tx.Model(&models.PageSection{}).
			Where("id = ? AND page_id = ?", sID, pageID).
			Update("sort_order", idx).Error; err != nil {
			tx.Rollback()
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to reorder sections")
			return
		}
	}
	tx.Commit()

	var page models.Page
	config.DB.Where("id = ?", pageID).First(&page)
	path := "/"
	if page.Key != "home" {
		path = "/" + page.Key
	}
	ctrl.revalidateService.QueueRevalidateTag("page-"+page.Key, &path)

	helpers.RespondSuccess(c, http.StatusOK, "Sections reordered successfully", nil)
}
