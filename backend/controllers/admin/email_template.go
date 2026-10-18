package admin

import (
	"fmt"
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

type EmailTemplateController struct {
	db            *gorm.DB
	outboxService *services.EmailOutboxService
	auditService  *services.AuditService
}

func NewEmailTemplateController(
	db *gorm.DB,
	outboxService *services.EmailOutboxService,
	auditService *services.AuditService,
) *EmailTemplateController {
	return &EmailTemplateController{
		db:            db,
		outboxService: outboxService,
		auditService:  auditService,
	}
}

// Index lists all system email templates
func (ctrl *EmailTemplateController) Index(c *gin.Context) {
	var templates []models.EmailTemplate
	if err := ctrl.db.Order("name ASC").Find(&templates).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch email templates")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get email templates success", templates)
}

// Show returns detail of a specific email template
func (ctrl *EmailTemplateController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid template ID")
		return
	}

	var tmpl models.EmailTemplate
	if err := ctrl.db.First(&tmpl, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Email template not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get email template detail success", tmpl)
}

// Update edits the subject, HTML, plain text, and active status of a template
func (ctrl *EmailTemplateController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid template ID")
		return
	}

	var req structs.EmailTemplateUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var tmpl models.EmailTemplate
	if err := ctrl.db.First(&tmpl, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Email template not found")
		return
	}

	tmpl.Subject = req.Subject
	tmpl.BodyHTML = req.BodyHTML
	tmpl.BodyText = req.BodyText
	if req.IsActive != nil {
		tmpl.IsActive = *req.IsActive
	}

	if err := ctrl.db.Save(&tmpl).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update email template")
		return
	}

	ctrl.auditService.LogContext(c, "email_templates", "update", "email_template", &tmpl.ID, "Updated email template "+tmpl.Key, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Email template updated successfully", tmpl)
}

// TestSend dispatches a test email rendering this template with mock data to the specified email
func (ctrl *EmailTemplateController) TestSend(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid template ID")
		return
	}

	var req structs.EmailTemplateTestSendRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var tmpl models.EmailTemplate
	if err := ctrl.db.First(&tmpl, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Email template not found")
		return
	}

	frontendURL := config.AppConfig.FrontendURL
	if frontendURL == "" {
		frontendURL = config.AppConfig.AppURL
	}

	mockVars := map[string]string{
		"name":                 "Test User",
		"full_name":            "Test User",
		"email":                req.ToEmail,
		"initial_password":     "DemoPass2026!",
		"login_url":            frontendURL + "/login",
		"reset_url":            frontendURL + "/reset-password?token=mock123",
		"ticket_code":          "PTZ-2026-TEST01",
		"subject":              "Test Inquiry Subject",
		"message":              "This is a sample test message rendered from the admin template editor.",
		"reply_eta":            "Our team responds within 24 to 48 hours.",
		"phone":                "+1 555-0192",
		"admin_url":            frontendURL + "/admin",
		"talent_name":          "Syahrul",
		"visitor_name":         "Client Test",
		"visitor_email":        "client@example.com",
		"talent_dashboard_url": frontendURL + "/talent",
		"application_type":     "Freelance Specialist",
		"new_status":           "shortlisted",
		"notes":                "Sample admin reviewer test note.",
		"entity_type":          "Project",
		"title":                "Sample Showcase Case Study",
		"approvals_url":        frontendURL + "/admin/approvals",
		"public_url":           frontendURL + "/projects/sample",
		"review_note":          "Please clarify section 3 results.",
		"edit_url":             frontendURL + "/talent/projects/1/edit",
	}

	for k, v := range req.Data {
		mockVars[k] = fmt.Sprintf("%v", v)
	}

	entry, err := ctrl.outboxService.SendTemplated(
		tmpl.Key,
		req.ToEmail,
		func(s string) *string { return &s }("Admin Tester"),
		mockVars,
		nil,
		func(s string) *string { return &s }("template_test"),
		&tmpl.ID,
	)

	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to queue test email: "+err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Test email queued for delivery", entry)
}
