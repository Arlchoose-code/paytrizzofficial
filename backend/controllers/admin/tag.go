package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type TagController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewTagController(revalidateService *services.RevalidateService, auditService *services.AuditService) *TagController {
	return &TagController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists tags ordered by name
func (ctrl *TagController) Index(c *gin.Context) {
	var tags []models.Tag
	if err := config.DB.Order("name ASC").Find(&tags).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch tags")
		return
	}

	resp := make([]structs.TagResponse, 0, len(tags))
	for _, t := range tags {
		resp = append(resp, structs.TagResponse{
			ID:        t.ID,
			Name:      t.Name,
			Slug:      t.Slug,
			CreatedAt: t.CreatedAt,
			UpdatedAt: t.UpdatedAt,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get tags success", resp)
}

// Store creates a new tag
func (ctrl *TagController) Store(c *gin.Context) {
	var req structs.CreateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	name := strings.TrimSpace(req.Name)

	var count int64
	config.DB.Model(&models.Tag{}).Where("LOWER(name) = ?", strings.ToLower(name)).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Tag already exists")
		return
	}

	tag := models.Tag{
		Name: name,
		Slug: slugifySkill(name),
	}

	if err := config.DB.Create(&tag).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create tag")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("posts", nil)
	ctrl.revalidateService.QueueRevalidateTag("projects", nil)
	ctrl.auditService.LogContext(c, "tags", "create", "tag", &tag.ID, "Created tag "+tag.Name, tag)

	helpers.RespondSuccess(c, http.StatusCreated, "Tag created successfully", structs.TagResponse{
		ID:        tag.ID,
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: tag.CreatedAt,
		UpdatedAt: tag.UpdatedAt,
	})
}

// Show returns a tag by ID
func (ctrl *TagController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid tag ID")
		return
	}

	var tag models.Tag
	if err := config.DB.Where("id = ?", id).First(&tag).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Tag not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get tag success", structs.TagResponse{
		ID:        tag.ID,
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: tag.CreatedAt,
		UpdatedAt: tag.UpdatedAt,
	})
}

// Update updates an existing tag
func (ctrl *TagController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid tag ID")
		return
	}

	var req structs.UpdateTagRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var tag models.Tag
	if err := config.DB.Where("id = ?", id).First(&tag).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Tag not found")
		return
	}

	if req.Name != "" {
		name := strings.TrimSpace(req.Name)
		var count int64
		config.DB.Model(&models.Tag{}).Where("LOWER(name) = ? AND id != ?", strings.ToLower(name), tag.ID).Count(&count)
		if count > 0 {
			helpers.RespondError(c, http.StatusConflict, "Tag already exists")
			return
		}
		tag.Name = name
		tag.Slug = slugifySkill(name)
	}

	if err := config.DB.Save(&tag).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update tag")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("posts", nil)
	ctrl.revalidateService.QueueRevalidateTag("projects", nil)
	ctrl.auditService.LogContext(c, "tags", "update", "tag", &tag.ID, "Updated tag "+tag.Name, tag)

	helpers.RespondSuccess(c, http.StatusOK, "Tag updated successfully", structs.TagResponse{
		ID:        tag.ID,
		Name:      tag.Name,
		Slug:      tag.Slug,
		CreatedAt: tag.CreatedAt,
		UpdatedAt: tag.UpdatedAt,
	})
}

// Destroy deletes a tag
func (ctrl *TagController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid tag ID")
		return
	}

	var tag models.Tag
	if err := config.DB.Where("id = ?", id).First(&tag).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Tag not found")
		return
	}

	if err := config.DB.Select("PostTags", "ProjectTags").Delete(&tag).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete tag")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("posts", nil)
	ctrl.revalidateService.QueueRevalidateTag("projects", nil)
	ctrl.auditService.LogContext(c, "tags", "delete", "tag", &tag.ID, "Deleted tag "+tag.Name, nil)

	_ = time.Now()
	helpers.RespondSuccess(c, http.StatusOK, "Tag deleted successfully", nil)
}
