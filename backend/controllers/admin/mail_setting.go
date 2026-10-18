package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"strconv"
	"strings"

	"github.com/gin-gonic/gin"
)

type MailSettingController struct {
	auditService *services.AuditService
}

func NewMailSettingController(auditService *services.AuditService) *MailSettingController {
	return &MailSettingController{auditService: auditService}
}

// Index lists all reserved mailbox names (PRD 4.11)
func (ctrl *MailSettingController) Index(c *gin.Context) {
	var names []models.ReservedMailName
	if err := config.DB.Order("name ASC").Find(&names).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch reserved names")
		return
	}
	helpers.RespondSuccess(c, http.StatusOK, "Get reserved names success", names)
}

// Store adds a reserved mailbox name
func (ctrl *MailSettingController) Store(c *gin.Context) {
	var req struct {
		Name   string `json:"name" binding:"required,min=3,max=64"`
		Reason string `json:"reason"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	name := strings.ToLower(strings.TrimSpace(req.Name))
	if !isValidMailboxLocalPart(name) {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid name. Use lowercase letters, numbers, dots, underscores or dashes (3–32 chars).")
		return
	}

	var count int64
	config.DB.Model(&models.ReservedMailName{}).Where("LOWER(name) = ?", name).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Name is already reserved")
		return
	}

	entry := models.ReservedMailName{Name: name}
	if strings.TrimSpace(req.Reason) != "" {
		reason := strings.TrimSpace(req.Reason)
		entry.Reason = &reason
	}

	if err := config.DB.Create(&entry).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to reserve name")
		return
	}

	ctrl.auditService.LogContext(c, "mail_settings", "create", "reserved_mail_name", &entry.ID, "Reserved mail name "+entry.Name, nil)
	helpers.RespondSuccess(c, http.StatusCreated, "Name reserved successfully", entry)
}

// Destroy removes a reserved name
func (ctrl *MailSettingController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid reserved name ID")
		return
	}

	var entry models.ReservedMailName
	if err := config.DB.First(&entry, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Reserved name not found")
		return
	}

	if err := config.DB.Delete(&entry).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete reserved name")
		return
	}

	ctrl.auditService.LogContext(c, "mail_settings", "delete", "reserved_mail_name", &entry.ID, "Released reserved mail name "+entry.Name, nil)
	helpers.RespondSuccess(c, http.StatusOK, "Reserved name removed successfully", nil)
}

// isValidMailboxLocalPart mirrors the mailbox validation rules (PRD 5.7)
func isValidMailboxLocalPart(name string) bool {
	if len(name) < 3 || len(name) > 32 {
		return false
	}
	if strings.HasPrefix(name, ".") || strings.HasSuffix(name, ".") || strings.Contains(name, "..") || strings.Contains(name, "+") {
		return false
	}
	for i, r := range name {
		isLetter := r >= 'a' && r <= 'z'
		isDigit := r >= '0' && r <= '9'
		isSpecial := r == '.' || r == '_' || r == '-'
		if !isLetter && !isDigit && !isSpecial {
			return false
		}
		if i == 0 && !isLetter && !isDigit {
			return false
		}
	}
	last := rune(name[len(name)-1])
	if !((last >= 'a' && last <= 'z') || (last >= '0' && last <= '9')) {
		return false
	}
	return true
}
