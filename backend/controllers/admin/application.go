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

type ApplicationController struct {
	db            *gorm.DB
	outboxService *services.EmailOutboxService
	auditService  *services.AuditService
}

func NewApplicationController(
	db *gorm.DB,
	outboxService *services.EmailOutboxService,
	auditService *services.AuditService,
) *ApplicationController {
	return &ApplicationController{
		db:            db,
		outboxService: outboxService,
		auditService:  auditService,
	}
}

// Index lists all submitted applications
func (ctrl *ApplicationController) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	appType := c.Query("type")
	status := c.Query("status")
	search := c.Query("search")

	query := ctrl.db.Model(&models.Application{}).Preload("Specialty").Preload("Files.Media")

	if appType != "" {
		query = query.Where("`type` = ?", appType)
	}
	if status != "" {
		query = query.Where("status = ?", status)
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("full_name LIKE ? OR email LIKE ? OR ticket_code LIKE ? OR company_name LIKE ?", like, like, like, like)
	}

	var total int64
	query.Count(&total)

	var apps []models.Application
	offset := (page - 1) * perPage
	query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&apps)

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get applications success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        apps,
	})
}

// Show returns detail of a single application including uploaded private files
func (ctrl *ApplicationController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var app models.Application
	if err := ctrl.db.Preload("Specialty").Preload("Files.Media").Preload("Handler").First(&app, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Application not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get application detail success", app)
}

// Update modifies application status and admin notes, with optional applicant notification
func (ctrl *ApplicationController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var req structs.ApplicationStatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var app models.Application
	if err := ctrl.db.First(&app, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Application not found")
		return
	}

	now := time.Now()
	app.Status = req.Status
	app.AdminNotes = req.AdminNotes
	app.ReviewedAt = &now

	if err := ctrl.db.Save(&app).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update application")
		return
	}

	// Send status update notification email to applicant
	notesStr := "Your application is currently being processed by our talent board."
	if req.AdminNotes != nil && *req.AdminNotes != "" {
		notesStr = *req.AdminNotes
	}

	_, _ = ctrl.outboxService.SendTemplated(
		"application_status_update",
		app.Email,
		&app.FullName,
		map[string]string{
			"full_name":   app.FullName,
			"ticket_code": app.TicketCode,
			"new_status":  app.Status,
			"notes":       notesStr,
		},
		nil,
		func(s string) *string { return &s }("application"),
		&app.ID,
	)

	ctrl.auditService.LogContext(c, "applications", "update_status", "application", &app.ID, "Updated application status to "+app.Status, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Application updated successfully", app)
}

// Destroy deletes an application
func (ctrl *ApplicationController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid application ID")
		return
	}

	var app models.Application
	if err := ctrl.db.First(&app, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Application not found")
		return
	}

	if err := ctrl.db.Delete(&app).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete application")
		return
	}

	ctrl.auditService.LogContext(c, "applications", "delete", "application", &app.ID, "Deleted application "+app.TicketCode, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Application deleted successfully", nil)
}
