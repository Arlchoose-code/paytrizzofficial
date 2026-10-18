package talent

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
	revisionService   *services.RevisionService
	outboxService     *services.EmailOutboxService
}

func NewProjectController(
	slugService *services.SlugService,
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
	revisionService *services.RevisionService,
	outboxService *services.EmailOutboxService,
) *ProjectController {
	return &ProjectController{
		slugService:       slugService,
		revalidateService: revalidateService,
		auditService:      auditService,
		revisionService:   revisionService,
		outboxService:     outboxService,
	}
}

// Index lists projects associated with or created by authenticated talent
func (ctrl *ProjectController) Index(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	var projects []models.Project
	if err := config.DB.Model(&models.Project{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("TalentLinks.Talent").
		Preload("Tags").
		Joins("LEFT JOIN project_talents ON project_talents.project_id = projects.id").
		Where("projects.created_by = ? OR project_talents.talent_id = ?", userID, t.ID).
		Group("projects.id").
		Order("projects.id DESC").
		Find(&projects).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch projects")
		return
	}

	resp := make([]structs.ProjectResponse, len(projects))
	for i, p := range projects {
		resp[i] = helpers.FormatProjectResponse(&p)
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get talent projects success", resp)
}

// Store creates a new project linked to authenticated talent
func (ctrl *ProjectController) Store(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

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

	// Approval is only required for blog posts; talent projects can publish directly
	status := "published"
	if req.Status == "draft" {
		status = "draft"
	} else if req.Status != "" {
		status = req.Status
	}

	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
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
		IsFeatured:   false,
		Status:       status,
		AuthorID:     userID,
		PublishedAt:  publishedAt,
	}

	tx := config.DB.Begin()
	if err := tx.Create(&project).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create project")
		return
	}

	// Always associate authenticated talent
	tx.Create(&models.ProjectTalent{
		ProjectID: project.ID,
		TalentID:  t.ID,
		RoleLabel: "Lead Specialist",
	})

	// Add any additional talent links from req
	for _, tl := range req.Talents {
		if tl.TalentID != t.ID {
			tx.Create(&models.ProjectTalent{
				ProjectID: project.ID,
				TalentID:  tl.TalentID,
				RoleLabel: tl.RoleLabel,
			})
		}
	}

	// Associate tags
	if len(req.TagIDs) > 0 {
		var tags []models.Tag
		tx.Where("id IN ?", req.TagIDs).Find(&tags)
		if err := tx.Model(&project).Association("Tags").Replace(&tags); err != nil {
			tx.Rollback()
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to associate tags")
			return
		}
	}

	tx.Commit()

	ctrl.revalidateService.QueueRevalidateTag("projects", nil)
	ctrl.auditService.LogContext(c, "projects", "create", "project", &project.ID, fmt.Sprintf("Talent created project: %s", project.Title), project)

	// Notify admin about the new submission (PRD 4.8)
	if status == "pending" {
		adminEmail := "admin@paytrizz.com"
		_, _ = ctrl.outboxService.SendTemplated(
			"content_submitted_admin_notification",
			adminEmail,
			func(s string) *string { return &s }("PayTrizz Operations"),
			map[string]string{
				"content_type": "project",
				"title":        project.Title,
				"author":       t.Name,
				"review_url":   "http://localhost:3000/admin/approvals",
			},
			nil,
			func(s string) *string { return &s }("project"),
			&project.ID,
		)
	}

	config.DB.Preload("CoverMedia").Preload("Category").Preload("TalentLinks.Talent").Preload("Tags").First(&project, project.ID)
	helpers.RespondSuccess(c, http.StatusCreated, "Project created successfully", helpers.FormatProjectResponse(&project))
}

// Show retrieves a project
func (ctrl *ProjectController) Show(c *gin.Context) {
	idParam := c.Param("id")
	projectID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := config.DB.Preload("CoverMedia").
		Preload("Category").
		Preload("TalentLinks.Talent").
		Preload("Tags").
		First(&project, projectID).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get project success", helpers.FormatProjectResponse(&project))
}

// Update modifies an existing project
func (ctrl *ProjectController) Update(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	idParam := c.Param("id")
	projectID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := config.DB.Joins("LEFT JOIN project_talents ON project_talents.project_id = projects.id").
		Where("projects.id = ? AND (projects.created_by = ? OR project_talents.talent_id = ?)", projectID, userID, t.ID).
		First(&project).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found or unauthorized")
		return
	}

	var req structs.UpdateProjectRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if project.Title != req.Title {
		project.Slug = ctrl.slugService.GenerateUniqueSlug("projects", req.Title, &project.ID)
	}

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

	project.Title = req.Title
	project.Excerpt = req.Excerpt
	project.Content = req.Content
	project.CoverMediaID = req.CoverMediaID
	project.CategoryID = req.CategoryID
	project.ClientName = req.ClientName
	project.ProjectURL = req.ProjectURL
	project.StartedAt = startedAt
	project.CompletedAt = completedAt
	project.IsCaseStudy = req.IsCaseStudy
	project.Challenge = req.Challenge
	project.Solution = req.Solution
	project.Result = req.Result

	if req.Status != "" {
		project.Status = req.Status
		if project.Status == "published" && project.PublishedAt == nil {
			now := time.Now()
			project.PublishedAt = &now
		}
	}

	tx := config.DB.Begin()
	if err := tx.Save(&project).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update project")
		return
	}

	if req.TagIDs != nil {
		var tags []models.Tag
		if len(req.TagIDs) > 0 {
			tx.Where("id IN ?", req.TagIDs).Find(&tags)
		}
		if err := tx.Model(&project).Association("Tags").Replace(&tags); err != nil {
			tx.Rollback()
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to update tags")
			return
		}
	}

	tx.Commit()

	ctrl.revalidateService.QueueRevalidateTag("projects", nil)
	path := fmt.Sprintf("/projects/%s", project.Slug)
	ctrl.revalidateService.QueueRevalidateTag("project-"+project.Slug, &path)
	ctrl.auditService.LogContext(c, "projects", "update", "project", &project.ID, fmt.Sprintf("Talent updated project: %s", project.Title), project)

	config.DB.Preload("CoverMedia").Preload("Category").Preload("TalentLinks.Talent").Preload("Tags").First(&project, project.ID)
	helpers.RespondSuccess(c, http.StatusOK, "Project updated successfully", helpers.FormatProjectResponse(&project))
}

// Destroy deletes a project
func (ctrl *ProjectController) Destroy(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	idParam := c.Param("id")
	projectID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid project ID")
		return
	}

	var project models.Project
	if err := config.DB.Joins("LEFT JOIN project_talents ON project_talents.project_id = projects.id").
		Where("projects.id = ? AND (projects.created_by = ? OR project_talents.talent_id = ?)", projectID, userID, t.ID).
		First(&project).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found or unauthorized")
		return
	}

	tx := config.DB.Begin()
	tx.Where("project_id = ?", project.ID).Delete(&models.ProjectTalent{})
	tx.Model(&project).Association("Tags").Clear()
	if err := tx.Delete(&project).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete project")
		return
	}
	tx.Commit()

	ctrl.revalidateService.QueueRevalidateTag("projects", nil)
	ctrl.auditService.LogContext(c, "projects", "delete", "project", &project.ID, fmt.Sprintf("Talent deleted project: %s", project.Title), nil)

	helpers.RespondSuccess(c, http.StatusOK, "Project deleted successfully", nil)
}
