package admin

import (
	"fmt"
	"net/http"
	"strconv"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type CategoryController struct {
	slugService  *services.SlugService
	auditService *services.AuditService
}

func NewCategoryController(
	slugService *services.SlugService,
	auditService *services.AuditService,
) *CategoryController {
	return &CategoryController{
		slugService:  slugService,
		auditService: auditService,
	}
}

// Project Categories
func (ctrl *CategoryController) IndexProjectCategories(c *gin.Context) {
	var list []models.ProjectCategory
	config.DB.Order("sort_order ASC, id ASC").Find(&list)

	resp := make([]structs.ProjectCategoryResponse, len(list))
	for i, cat := range list {
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

func (ctrl *CategoryController) StoreProjectCategory(c *gin.Context) {
	var req structs.CreateProjectCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	slug := ctrl.slugService.GenerateUniqueSlug("project_categories", req.Name, nil)
	cat := models.ProjectCategory{
		Name:      req.Name,
		Slug:      slug,
		SortOrder: req.SortOrder,
	}
	if err := config.DB.Create(&cat).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create project category")
		return
	}

	ctrl.auditService.LogContext(c, "projects", "create_category", "project_category", &cat.ID, fmt.Sprintf("Created project category '%s'", cat.Name), nil)
	helpers.RespondSuccess(c, http.StatusCreated, "Project category created", cat)
}

func (ctrl *CategoryController) UpdateProjectCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var cat models.ProjectCategory
	if err := config.DB.First(&cat, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Category not found")
		return
	}

	var req structs.UpdateProjectCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if req.Name != "" && req.Name != cat.Name {
		cat.Name = req.Name
		cat.Slug = ctrl.slugService.GenerateUniqueSlug("project_categories", req.Name, &cat.ID)
	}
	cat.SortOrder = req.SortOrder

	if err := config.DB.Save(&cat).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update project category")
		return
	}

	ctrl.auditService.LogContext(c, "projects", "update_category", "project_category", &cat.ID, fmt.Sprintf("Updated project category '%s'", cat.Name), nil)
	helpers.RespondSuccess(c, http.StatusOK, "Project category updated", cat)
}

func (ctrl *CategoryController) DestroyProjectCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var cat models.ProjectCategory
	if err := config.DB.First(&cat, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Category not found")
		return
	}

	config.DB.Delete(&cat)
	helpers.RespondSuccess(c, http.StatusOK, "Category deleted", nil)
}

// Post Categories
func (ctrl *CategoryController) IndexPostCategories(c *gin.Context) {
	var list []models.PostCategory
	config.DB.Order("sort_order ASC, id ASC").Find(&list)

	resp := make([]structs.PostCategoryResponse, len(list))
	for i, cat := range list {
		resp[i] = structs.PostCategoryResponse{
			ID:        cat.ID,
			Name:      cat.Name,
			Slug:      cat.Slug,
			SortOrder: cat.SortOrder,
			CreatedAt: cat.CreatedAt,
			UpdatedAt: cat.UpdatedAt,
		}
	}
	helpers.RespondSuccess(c, http.StatusOK, "Get post categories success", resp)
}

func (ctrl *CategoryController) StorePostCategory(c *gin.Context) {
	var req structs.CreatePostCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	slug := ctrl.slugService.GenerateUniqueSlug("post_categories", req.Name, nil)
	cat := models.PostCategory{
		Name:      req.Name,
		Slug:      slug,
		SortOrder: req.SortOrder,
	}
	if err := config.DB.Create(&cat).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create post category")
		return
	}

	ctrl.auditService.LogContext(c, "blog", "create_category", "post_category", &cat.ID, fmt.Sprintf("Created post category '%s'", cat.Name), nil)
	helpers.RespondSuccess(c, http.StatusCreated, "Post category created", cat)
}

func (ctrl *CategoryController) UpdatePostCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var cat models.PostCategory
	if err := config.DB.First(&cat, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Category not found")
		return
	}

	var req structs.UpdatePostCategoryRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if req.Name != "" && req.Name != cat.Name {
		cat.Name = req.Name
		cat.Slug = ctrl.slugService.GenerateUniqueSlug("post_categories", req.Name, &cat.ID)
	}
	cat.SortOrder = req.SortOrder

	if err := config.DB.Save(&cat).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update post category")
		return
	}

	ctrl.auditService.LogContext(c, "blog", "update_category", "post_category", &cat.ID, fmt.Sprintf("Updated post category '%s'", cat.Name), nil)
	helpers.RespondSuccess(c, http.StatusOK, "Post category updated", cat)
}

func (ctrl *CategoryController) DestroyPostCategory(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid ID")
		return
	}

	var cat models.PostCategory
	if err := config.DB.First(&cat, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Category not found")
		return
	}

	config.DB.Delete(&cat)
	helpers.RespondSuccess(c, http.StatusOK, "Category deleted", nil)
}
