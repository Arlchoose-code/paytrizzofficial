package admin

import (
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type EmailOutboxController struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewEmailOutboxController(db *gorm.DB, auditService *services.AuditService) *EmailOutboxController {
	return &EmailOutboxController{db: db, auditService: auditService}
}

// Index lists all records in email_outbox with filters
func (ctrl *EmailOutboxController) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")
	search := c.Query("search")

	query := ctrl.db.Model(&models.EmailOutbox{})

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("to_email LIKE ? OR subject LIKE ? OR template_key LIKE ?", like, like, like)
	}

	var total int64
	query.Count(&total)

	var entries []models.EmailOutbox
	offset := (page - 1) * perPage
	query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&entries)

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get email outbox success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        entries,
	})
}

// Show returns detail of a single email outbox record
func (ctrl *EmailOutboxController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid outbox ID")
		return
	}

	var entry models.EmailOutbox
	if err := ctrl.db.First(&entry, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Outbox record not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get outbox record detail success", entry)
}

// Retry triggers an immediate retry for a failed or stuck email outbox record
func (ctrl *EmailOutboxController) Retry(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid outbox ID")
		return
	}

	var entry models.EmailOutbox
	if err := ctrl.db.First(&entry, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Outbox record not found")
		return
	}

	entry.Status = "pending"
	entry.Attempts = 0
	entry.NextAttemptAt = time.Now()
	entry.LastError = nil

	if err := ctrl.db.Save(&entry).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to queue retry")
		return
	}

	ctrl.auditService.LogContext(c, "email_outbox", "retry", "email_outbox", &entry.ID, "Retried email delivery to "+entry.ToEmail, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Email queued for immediate retry", entry)
}
