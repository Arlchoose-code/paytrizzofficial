package public

import (
	"fmt"
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ApplicationController struct {
	db            *gorm.DB
	ticketService *services.TicketService
	outboxService *services.EmailOutboxService
	uploadService *services.UploadService
}

func NewApplicationController(
	db *gorm.DB,
	ticketService *services.TicketService,
	outboxService *services.EmailOutboxService,
	uploadService *services.UploadService,
) *ApplicationController {
	return &ApplicationController{
		db:            db,
		ticketService: ticketService,
		outboxService: outboxService,
		uploadService: uploadService,
	}
}

// Store handles incoming applications (Join as Freelancer or Request a Project)
func (ctrl *ApplicationController) Store(c *gin.Context) {
	var req structs.ApplicationCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	ticketCode, err := ctrl.ticketService.GenerateTicketCode()
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Could not generate ticket tracking code")
		return
	}

	app := models.Application{
		TicketCode:   ticketCode,
		Type:         req.Type,
		FullName:     req.FullName,
		Email:        req.Email,
		Phone:        req.Phone,
		CompanyName:  req.CompanyName,
		Title:        req.Title,
		Message:      req.Message,
		PortfolioURL: req.PortfolioURL,
		SpecialtyID:  req.SpecialtyID,
		BudgetRange:  req.BudgetRange,
		Timeline:     req.Timeline,
		Status:       "new",
		IP:           c.ClientIP(),
		UserAgent:    c.Request.UserAgent(),
	}

	if err := ctrl.db.Create(&app).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to submit application")
		return
	}

	// Link uploaded media files if provided
	if len(req.MediaIDs) > 0 {
		for _, mediaID := range req.MediaIDs {
			label := "attachment"
			if req.Type == "freelance" {
				label = "cv"
			}
			appFile := models.ApplicationFile{
				ApplicationID: app.ID,
				MediaID:       mediaID,
				Label:         &label,
			}
			_ = ctrl.db.Create(&appFile)
		}
	}

	// 1. Visitor confirmation email
	appTypeLabel := "Freelance Specialist"
	if req.Type == "project" {
		appTypeLabel = "Project Scope"
	}
	_, _ = ctrl.outboxService.SendTemplated(
		"application_visitor_confirmation",
		app.Email,
		&app.FullName,
		map[string]string{
			"full_name":        app.FullName,
			"application_type": appTypeLabel,
			"ticket_code":      app.TicketCode,
		},
		nil,
		func(s string) *string { return &s }("application"),
		&app.ID,
	)

	// 2. Admin notification email
	adminEmail := "admin@paytrizz.com"
	_, _ = ctrl.outboxService.SendTemplated(
		"application_admin_notification",
		adminEmail,
		func(s string) *string { return &s }("PayTrizz Applications"),
		map[string]string{
			"application_type": appTypeLabel,
			"ticket_code":      app.TicketCode,
			"full_name":        app.FullName,
			"email":            app.Email,
			"message":          app.Message,
			"admin_url":        fmt.Sprintf("http://localhost:3000/admin/applications"),
		},
		nil,
		func(s string) *string { return &s }("application"),
		&app.ID,
	)

	helpers.RespondSuccess(c, http.StatusCreated, "Application submitted successfully", gin.H{
		"ticket_code": app.TicketCode,
		"type":        app.Type,
		"email":       app.Email,
	})
}

// Upload handles private file upload for applicants (CV or project brief document)
func (ctrl *ApplicationController) Upload(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "No file provided")
		return
	}

	media, err := ctrl.uploadService.SaveUploadedFile(fileHeader, models.MediaModuleApplication, nil, nil)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusCreated, "File uploaded successfully", gin.H{
		"id":            media.ID,
		"original_name": media.OriginalName,
		"size_bytes":    media.SizeBytes,
		"mime":          media.Mime,
	})
}

