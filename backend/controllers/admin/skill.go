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

	"github.com/gin-gonic/gin"
)

type SkillController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewSkillController(revalidateService *services.RevalidateService, auditService *services.AuditService) *SkillController {
	return &SkillController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists skills ordered by name
func (ctrl *SkillController) Index(c *gin.Context) {
	var skills []models.Skill
	db := config.DB.Model(&models.Skill{})
	if category := c.Query("category"); category != "" {
		db = db.Where("category = ?", category)
	}
	if err := db.Order("name ASC").Find(&skills).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch skills")
		return
	}

	resp := make([]structs.SkillResponse, 0, len(skills))
	for _, s := range skills {
		resp = append(resp, structs.SkillResponse{
			ID:       s.ID,
			Name:     s.Name,
			Slug:     s.Slug,
			Category: s.Category,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get skills success", resp)
}

// Store creates a new skill
func (ctrl *SkillController) Store(c *gin.Context) {
	var req structs.CreateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	name := strings.TrimSpace(req.Name)

	var count int64
	config.DB.Model(&models.Skill{}).Where("LOWER(name) = ?", strings.ToLower(name)).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Skill already exists")
		return
	}

	skill := models.Skill{
		Name:     name,
		Slug:     slugifySkill(name),
		Category: req.Category,
	}

	if err := config.DB.Create(&skill).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create skill")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "skills", "create", "skill", &skill.ID, "Created skill "+skill.Name, skill)

	helpers.RespondSuccess(c, http.StatusCreated, "Skill created successfully", structs.SkillResponse{
		ID:       skill.ID,
		Name:     skill.Name,
		Slug:     skill.Slug,
		Category: skill.Category,
	})
}

// Show returns a skill by ID
func (ctrl *SkillController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid skill ID")
		return
	}

	var skill models.Skill
	if err := config.DB.Where("id = ?", id).First(&skill).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Skill not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get skill success", structs.SkillResponse{
		ID:       skill.ID,
		Name:     skill.Name,
		Slug:     skill.Slug,
		Category: skill.Category,
	})
}

// Update updates an existing skill
func (ctrl *SkillController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid skill ID")
		return
	}

	var req structs.UpdateSkillRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var skill models.Skill
	if err := config.DB.Where("id = ?", id).First(&skill).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Skill not found")
		return
	}

	name := strings.TrimSpace(req.Name)

	var count int64
	config.DB.Model(&models.Skill{}).Where("LOWER(name) = ? AND id != ?", strings.ToLower(name), skill.ID).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Skill already exists")
		return
	}

	skill.Name = name
	skill.Slug = slugifySkill(name)
	skill.Category = req.Category

	if err := config.DB.Save(&skill).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update skill")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "skills", "update", "skill", &skill.ID, "Updated skill "+skill.Name, skill)

	helpers.RespondSuccess(c, http.StatusOK, "Skill updated successfully", structs.SkillResponse{
		ID:       skill.ID,
		Name:     skill.Name,
		Slug:     skill.Slug,
		Category: skill.Category,
	})
}

// Destroy deletes a skill
func (ctrl *SkillController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid skill ID")
		return
	}

	var skill models.Skill
	if err := config.DB.Where("id = ?", id).First(&skill).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Skill not found")
		return
	}

	if err := config.DB.Select("TalentSkills").Delete(&skill).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete skill")
		return
	}

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "skills", "delete", "skill", &skill.ID, "Deleted skill "+skill.Name, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Skill deleted successfully", nil)
}

// slugifySkill converts a skill name to a URL-safe slug
func slugifySkill(name string) string {
	s := strings.ToLower(strings.TrimSpace(name))
	var b strings.Builder
	lastDash := false
	for _, r := range s {
		if (r >= 'a' && r <= 'z') || (r >= '0' && r <= '9') {
			b.WriteRune(r)
			lastDash = false
		} else if !lastDash {
			b.WriteRune('-')
			lastDash = true
		}
	}
	return strings.Trim(b.String(), "-")
}
