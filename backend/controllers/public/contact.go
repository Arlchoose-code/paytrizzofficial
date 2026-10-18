package public

import (
	"fmt"
	"net/http"
	"strings"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type ContactController struct {
	db            *gorm.DB
	ticketService *services.TicketService
	outboxService *services.EmailOutboxService
}

func NewContactController(
	db *gorm.DB,
	ticketService *services.TicketService,
	outboxService *services.EmailOutboxService,
) *ContactController {
	return &ContactController{
		db:            db,
		ticketService: ticketService,
		outboxService: outboxService,
	}
}

// Store handles incoming public contact inquiries (general or direct talent)
func (ctrl *ContactController) Store(c *gin.Context) {
	var req structs.ContactMessageCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	channel := "general"
	if req.Channel == "talent" && req.TalentID != nil {
		channel = "talent"
	}

	ticketCode, err := ctrl.ticketService.GenerateTicketCode()
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Could not generate ticket tracking code")
		return
	}

	msg := models.ContactMessage{
		TicketCode: ticketCode,
		Channel:    channel,
		TalentID:   req.TalentID,
		Name:       req.Name,
		Email:      req.Email,
		Phone:      req.Phone,
		Subject:    req.Subject,
		Message:    req.Message,
		Status:     "new",
		IP:         c.ClientIP(),
		UserAgent:  c.Request.UserAgent(),
		SourceURL:  req.SourceURL,
	}

	if err := ctrl.db.Create(&msg).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to save inquiry message")
		return
	}

	// 1. Send confirmation to visitor
	_, _ = ctrl.outboxService.SendTemplated(
		"contact_visitor_confirmation",
		msg.Email,
		&msg.Name,
		map[string]string{
			"name":        msg.Name,
			"ticket_code": msg.TicketCode,
			"subject":     msg.Subject,
			"message":     msg.Message,
			"reply_eta":   "Our team typically reviews all inquiries within 24 to 48 hours.",
		},
		nil,
		func(s string) *string { return &s }("contact_message"),
		&msg.ID,
	)

	// 2. Admin notification (check notify_admin_on_talent_contact setting for talent channel)
	shouldNotifyAdmin := true
	if channel == "talent" {
		var setting models.SiteSetting
		if err := ctrl.db.Where("`key` = ?", "notify_admin_on_talent_contact").First(&setting).Error; err == nil {
			val := strings.Trim(setting.Value, `"`)
			if val == "false" || val == "0" {
				shouldNotifyAdmin = false
			}
		}
	}

	frontendURL := config.AppConfig.FrontendURL
	if frontendURL == "" {
		frontendURL = config.AppConfig.AppURL
	}

	if shouldNotifyAdmin {
		adminEmail := config.AppConfig.SeedAdminEmail
		if adminEmail == "" {
			adminEmail = config.AppConfig.SystemReplyTo
		}
		phoneStr := "-"
		if msg.Phone != nil {
			phoneStr = *msg.Phone
		}
		adminURL := fmt.Sprintf("%s/admin/messages", frontendURL)
		_, _ = ctrl.outboxService.SendTemplated(
			"contact_admin_notification",
			adminEmail,
			func(s string) *string { return &s }("PayTrizz Operations"),
			map[string]string{
				"ticket_code": msg.TicketCode,
				"name":        msg.Name,
				"email":       msg.Email,
				"phone":       phoneStr,
				"subject":     msg.Subject,
				"message":     msg.Message,
				"admin_url":   adminURL,
			},
			nil,
			func(s string) *string { return &s }("contact_message"),
			&msg.ID,
		)
	}

	// 3. If talent direct channel, notify talent personal email
	if channel == "talent" && req.TalentID != nil {
		var talent models.Talent
		if err := ctrl.db.Preload("User").First(&talent, *req.TalentID).Error; err == nil && talent.User != nil {
			talentDashboardURL := fmt.Sprintf("%s/talent/messages", frontendURL)
			_, _ = ctrl.outboxService.SendTemplated(
				"contact_talent_notification",
				talent.User.Email,
				&talent.Name,
				map[string]string{
					"talent_name":          talent.Name,
					"visitor_name":         msg.Name,
					"visitor_email":        msg.Email,
					"ticket_code":          msg.TicketCode,
					"subject":              msg.Subject,
					"message":              msg.Message,
					"talent_dashboard_url": talentDashboardURL,
				},
				nil,
				func(s string) *string { return &s }("contact_message"),
				&msg.ID,
			)
		}
	}

	helpers.RespondSuccess(c, http.StatusCreated, "Inquiry received successfully", gin.H{
		"ticket_code": msg.TicketCode,
		"email":       msg.Email,
		"channel":     msg.Channel,
	})
}
