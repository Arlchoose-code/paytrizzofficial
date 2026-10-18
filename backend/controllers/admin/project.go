package admin

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type ProjectController struct {
	slugService       *services.SlugService
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
	outboxService     *services.EmailOutboxService
}

func NewProjectController(
	slugService *services.SlugService,
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
	outboxService *services.EmailOutboxService,
) *ProjectController {
	return &ProjectController{
		slugService:       slugService,
		revalidateService: revalidateService,
		auditService:      auditService,
		outboxService:     outboxService,
	}
}

// Index lists projects with search, status filter, and pagination
func (ctrl *ProjectController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}

	db := config.DB.Model(&models.Project{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("TalentLinks.Talent").
		Preload("Tags")

	if query.Search != "" {
		likeTerm := "%" + query.Search + "%"
		db = db.Where("title LIKE ? OR excerpt LIKE ? OR client_name LIKE ?", likeTerm, likeTerm, likeTerm)
	}

	if status := c.Query("status"); status != "" && status != "all" {
		db = db.Where("status = ?", status)
	}

	var total int64
	db.Count(&total)

	var projects []models.Project
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&projects).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch projects")
		return
	}

	resp := make([]structs.ProjectResponse, len(projects))
	for i, p := range projects {
		resp[i] = helpers.FormatProjectResponse(&p)
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get projects success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        resp,
	})
}

// Store creates a new project with auto-generated slug
func (ctrl *ProjectController) Store(c *gin.Context) {
	var req structs.CreateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	slug := ctrl.slugService.GenerateUniqueSlug("projects", req.Title, nil)

	var startedAt, completedAt *time.Time
	if req.StartedAt != nil && *req.StartedAt != "" {
		if t, err := time.Parse("2006-01-02", *req.StartedAt); err == nil {
			startedAt = &t
		}
	}
	if req.CompletedAt != nil && *req.CompletedAt != "" {
		if t, err := time.Parse("2006-01-02", *req.CompletedAt); err == nil {
			completedAt = &t
		}
	}

	status := "draft"
	if req.Status != "" {
		status = req.Status
	}

	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	actorID, _ := c.Get("UserID")
	authorID := uint64(0)
	if aid, ok := actorID.(uint64); ok {
		authorID = aid
	}

	project := models.Project{
		Slug:         slug,
		Title:        req.Title,
		Excerpt:      req.Excerpt,
		Content:      req.Content,
		CoverMediaID: req.CoverMediaID,
		CategoryID:   req.CategoryID,
		ClientName:   req.ClientName,
		ProjectURL:   req.ProjectURL,
		StartedAt:    startedAt,
		CompletedAt:  completedAt,
		IsCaseStudy:  req.IsCaseStudy,
		Challenge:    req.Challenge,
		Solution:     req.Solution,
		Result:       req.Result,
		IsFeatured:   req.IsFeatured,
		Status:       status,
		AuthorID:     authorID,
		PublishedAt:  publishedAt,
	}

	if err := config.DB.Create(&project).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create project")
		return
	}

	// Link talents
	for _, pt := range req.Talents {
		config.DB.Create(&models.ProjectTalent{
			ProjectID: project.ID,
			TalentID:  pt.TalentID,
			RoleLabel: pt.RoleLabel,
			SortOrder: pt.SortOrder,
		})
	}

	// Link images
	for _, img := range req.Images {
		config.DB.Create(&models.ProjectImage{
			ProjectID: project.ID,
			MediaID:   img.MediaID,
			Caption:   img.Caption,
			SortOrder: img.SortOrder,
		})
	}

	// Link tags
	for _, tid := range req.TagIDs {
		config.DB.Create(&models.ProjectTag{
			ProjectID: project.ID,
			TagID:     tid,
		})
	}

	// Audit log
	ctrl.auditService.LogContext(c, "projects", "create", "project", &project.ID, fmt.Sprintf("Created project '%s'", project.Title), nil)

	// ISR revalidation
	ctrl.revalidateService.QueueTag("projects")

	helpers.RespondSuccess(c, http.StatusCreated, "Project created successfully", helpers.FormatProjectResponse(&project))
}

// Show returns a single project by ID
func (ctrl *ProjectController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := config.DB.
		Preload("CoverMedia").
		Preload("Category").
		Preload("TalentLinks.Talent.Badges").
		Preload("Images.Media").
		Preload("Tags").
		First(&project, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get project success", helpers.FormatProjectResponse(&project))
}

// Update updates an existing project
func (ctrl *ProjectController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found")
		return
	}

	var req structs.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if req.Title != "" && req.Title != project.Title {
		currID := uint64(project.ID)
		project.Slug = ctrl.slugService.GenerateUniqueSlug("projects", req.Title, &currID)
		project.Title = req.Title
	}

	if req.Excerpt != "" {
		project.Excerpt = req.Excerpt
	}
	if req.Content != "" {
		project.Content = req.Content
	}
	project.CoverMediaID = req.CoverMediaID
	project.CategoryID = req.CategoryID
	project.ClientName = req.ClientName
	project.ProjectURL = req.ProjectURL
	project.IsCaseStudy = req.IsCaseStudy
	project.Challenge = req.Challenge
	project.Solution = req.Solution
	project.Result = req.Result
	project.IsFeatured = req.IsFeatured

	if req.StartedAt != nil && *req.StartedAt != "" {
		if t, err := time.Parse("2006-01-02", *req.StartedAt); err == nil {
			project.StartedAt = &t
		}
	}
	if req.CompletedAt != nil && *req.CompletedAt != "" {
		if t, err := time.Parse("2006-01-02", *req.CompletedAt); err == nil {
			project.CompletedAt = &t
		}
	}

	previousStatus := project.Status
	if req.Status != "" {
		if req.Status == "published" && project.Status != "published" {
			now := time.Now()
			project.PublishedAt = &now
		}
		project.Status = req.Status
	}

	if err := config.DB.Save(&project).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update project")
		return
	}

	// Notify talent when their submission is approved or rejected (PRD 4.8)
	if previousStatus == "pending" && (project.Status == "published" || project.Status == "rejected") {
		ctrl.sendReviewEmail(project, previousStatus)
	}

	// Sync talents if provided
	if req.Talents != nil {
		config.DB.Where("project_id = ?", project.ID).Delete(&models.ProjectTalent{})
		for _, pt := range req.Talents {
			config.DB.Create(&models.ProjectTalent{
				ProjectID: project.ID,
				TalentID:  pt.TalentID,
				RoleLabel: pt.RoleLabel,
				SortOrder: pt.SortOrder,
			})
		}
	}

	// Sync images if provided
	if req.Images != nil {
		config.DB.Where("project_id = ?", project.ID).Delete(&models.ProjectImage{})
		for _, img := range req.Images {
			config.DB.Create(&models.ProjectImage{
				ProjectID: project.ID,
				MediaID:   img.MediaID,
				Caption:   img.Caption,
				SortOrder: img.SortOrder,
			})
		}
	}

	// Sync tags if provided
	if req.TagIDs != nil {
		config.DB.Where("project_id = ?", project.ID).Delete(&models.ProjectTag{})
		for _, tid := range req.TagIDs {
			config.DB.Create(&models.ProjectTag{
				ProjectID: project.ID,
				TagID:     tid,
			})
		}
	}

	ctrl.auditService.LogContext(c, "projects", "update", "project", &project.ID, fmt.Sprintf("Updated project '%s'", project.Title), nil)
	ctrl.revalidateService.QueueTag("projects")
	ctrl.revalidateService.QueueTag(fmt.Sprintf("project-%s", project.Slug))

	helpers.RespondSuccess(c, http.StatusOK, "Project updated successfully", helpers.FormatProjectResponse(&project))
}

// sendReviewEmail notifies the authoring talent about an approval/rejection decision
func (ctrl *ProjectController) sendReviewEmail(project models.Project, previousStatus string) {
	if ctrl.outboxService == nil {
		return
	}
	var author models.User
	if err := config.DB.First(&author, project.AuthorID).Error; err != nil {
		return
	}
	if author.Role != models.RoleTalent {
		return
	}
	reviewNote := ""
	if project.ReviewNote != nil {
		reviewNote = *project.ReviewNote
	}
	templateKey := "content_approved"
	if project.Status == "rejected" {
		templateKey = "content_rejected"
	}
	frontendURL := config.AppConfig.FrontendURL
	if frontendURL == "" {
		frontendURL = config.AppConfig.AppURL
	}
	publicURL := fmt.Sprintf("%s/projects/%s", frontendURL, project.Slug)
	editURL := fmt.Sprintf("%s/talent/projects", frontendURL)

	_, _ = ctrl.outboxService.SendTemplated(
		templateKey,
		author.Email,
		&author.Name,
		map[string]string{
			"talent_name":   author.Name,
			"name":          author.Name,
			"entity_type":   "portfolio project",
			"content_type":  "portfolio project",
			"title":         project.Title,
			"public_url":    publicURL,
			"review_note":   reviewNote,
			"edit_url":      editURL,
			"dashboard_url": editURL,
		},
		nil,
		func(s string) *string { return &s }("project"),
		&project.ID,
	)
}

// Destroy deletes a project
func (ctrl *ProjectController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := config.DB.First(&project, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found")
		return
	}

	if err := config.DB.Delete(&project).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete project")
		return
	}

	ctrl.auditService.LogContext(c, "projects", "delete", "project", &project.ID, fmt.Sprintf("Deleted project '%s'", project.Title), nil)
	ctrl.revalidateService.QueueTag("projects")

	helpers.RespondSuccess(c, http.StatusOK, "Project deleted successfully", nil)
}
