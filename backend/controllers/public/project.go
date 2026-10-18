package public

import (
	"net/http"
	"strconv"

	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ProjectController struct {
	db *gorm.DB
}

func NewProjectController(db *gorm.DB) *ProjectController {
	return &ProjectController{db: db}
}

// Index lists published projects with optional filters (category, tag, case_study, search)
func (ctrl *ProjectController) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "12"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 50 {
		perPage = 12
	}

	query := ctrl.db.Model(&models.Project{}).
		Where("status = ?", "published")

	// Search filter
	if search := c.Query("search"); search != "" {
		likeTerm := "%" + search + "%"
		query = query.Where("title LIKE ? OR excerpt LIKE ? OR client_name LIKE ?", likeTerm, likeTerm, likeTerm)
	}

	// Category filter
	if catSlug := c.Query("category"); catSlug != "" && catSlug != "all" {
		var cat models.ProjectCategory
		if err := ctrl.db.Where("slug = ?", catSlug).First(&cat).Error; err == nil {
			query = query.Where("category_id = ?", cat.ID)
		}
	}

	// Case study filter
	if cs := c.Query("case_study"); cs == "true" {
		query = query.Where("is_case_study = ?", true)
	}

	// Featured filter
	if feat := c.Query("featured"); feat == "true" {
		query = query.Where("is_featured = ?", true)
	}

	// Talent filter
	if talentSlug := c.Query("talent"); talentSlug != "" {
		var tal models.Talent
		if err := ctrl.db.Where("slug = ?", talentSlug).First(&tal).Error; err == nil {
			query = query.Where("id IN (SELECT project_id FROM project_talents WHERE talent_id = ?) OR created_by = ?", tal.ID, tal.UserID)
		}
	}

	var total int64
	query.Count(&total)

	var projects []models.Project
	offset := (page - 1) * perPage
	err := query.
		Preload("CoverMedia").
		Preload("Category").
		Preload("TalentLinks.Talent.Badges").
		Preload("TalentLinks.Talent.Specialties").
		Preload("TalentLinks.Talent.AvatarMedia").
		Preload("Images.Media").
		Preload("Tags").
		Order("is_featured DESC, published_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&projects).Error

	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve projects")
		return
	}

	projectResponses := make([]structs.ProjectResponse, len(projects))
	for i, p := range projects {
		projectResponses[i] = helpers.FormatProjectResponse(&p)
	}

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get projects success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        projectResponses,
	})
}

// Show returns a single published project by slug
func (ctrl *ProjectController) Show(c *gin.Context) {
	slug := c.Param("slug")

	var project models.Project
	err := ctrl.db.
		Preload("CoverMedia").
		Preload("Category").
		Preload("TalentLinks.Talent.Badges").
		Preload("TalentLinks.Talent.Specialties").
		Preload("TalentLinks.Talent.Skills.Skill").
		Preload("TalentLinks.Talent.AvatarMedia").
		Preload("Images.Media").
		Preload("Tags").
		Where("slug = ? AND status = ?", slug, "published").
		First(&project).Error

	if err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Project not found")
		return
	}

	projResp := helpers.FormatProjectResponse(&project)
	if len(projResp.Talents) == 0 && project.AuthorID > 0 {
		var creatorTalent models.Talent
		if err := ctrl.db.
			Preload("Badges").
			Preload("Specialties").
			Preload("AvatarMedia").
			Where("user_id = ? AND is_published = true", project.AuthorID).
			First(&creatorTalent).Error; err == nil {
			tr := helpers.FormatTalentResponse(&creatorTalent)
			projResp.Talents = append(projResp.Talents, structs.ProjectTalentResponse{
				TalentID:  creatorTalent.ID,
				RoleLabel: "Lead Specialist",
				SortOrder: 1,
				Talent:    &tr,
			})
		}
	}

	// Fetch up to 3 related projects
	var related []models.Project
	relQuery := ctrl.db.Model(&models.Project{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("Tags").
		Preload("TalentLinks.Talent.Badges").
		Preload("TalentLinks.Talent.AvatarMedia").
		Where("status = ? AND id != ?", "published", project.ID)

	if project.CategoryID != nil && *project.CategoryID > 0 {
		var sameCatCount int64
		ctrl.db.Model(&models.Project{}).Where("status = ? AND id != ? AND category_id = ?", "published", project.ID, *project.CategoryID).Count(&sameCatCount)
		if sameCatCount > 0 {
			relQuery = relQuery.Where("category_id = ?", *project.CategoryID)
		}
	}

	if err := relQuery.Order("is_featured DESC, published_at DESC").Limit(3).Find(&related).Error; err == nil {
		for _, rp := range related {
			rpResp := helpers.FormatProjectResponse(&rp)
			if len(rpResp.Talents) == 0 && rp.AuthorID > 0 {
				var creatorTalent models.Talent
				if err := ctrl.db.
					Preload("Badges").
					Preload("Specialties").
					Preload("AvatarMedia").
					Where("user_id = ? AND is_published = true", rp.AuthorID).
					First(&creatorTalent).Error; err == nil {
					tr := helpers.FormatTalentResponse(&creatorTalent)
					rpResp.Talents = append(rpResp.Talents, structs.ProjectTalentResponse{
						TalentID:  creatorTalent.ID,
						RoleLabel: "Lead Specialist",
						SortOrder: 1,
						Talent:    &tr,
					})
				}
			}
			projResp.RelatedProjects = append(projResp.RelatedProjects, rpResp)
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get project detail success", projResp)
}

// Categories lists project categories
func (ctrl *ProjectController) Categories(c *gin.Context) {
	var categories []models.ProjectCategory
	ctrl.db.Order("sort_order ASC").Find(&categories)

	resp := make([]structs.ProjectCategoryResponse, len(categories))
	for i, cat := range categories {
		resp[i] = structs.ProjectCategoryResponse{
			ID:        cat.ID,
			Name:      cat.Name,
			Slug:      cat.Slug,
			SortOrder: cat.SortOrder,
			CreatedAt: cat.CreatedAt,
			UpdatedAt: cat.UpdatedAt,
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get project categories success", resp)
}
