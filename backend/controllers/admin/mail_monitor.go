package admin

import (
	"fmt"
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MailMonitorController struct {
	db         *gorm.DB
	logService *services.MailLogService
}

func NewMailMonitorController(db *gorm.DB, logService *services.MailLogService) *MailMonitorController {
	return &MailMonitorController{db: db, logService: logService}
}

// Index lists all talents with their provisioned mailboxes
func (ctrl *MailMonitorController) Index(c *gin.Context) {
	var mailboxes []models.Mailbox
	if err := ctrl.db.Preload("User").
		Where("owner_type = ?", models.MailboxOwnerTalent).
		Order("id DESC").Find(&mailboxes).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve monitored mailboxes")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get mail monitor accounts success", mailboxes)
}

// ShowMailbox provides READ-ONLY view of a talent's mailbox and logs admin_viewed
func (ctrl *MailMonitorController) ShowMailbox(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid mailbox ID")
		return
	}

	var mailbox models.Mailbox
	if err := ctrl.db.Preload("User").First(&mailbox, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Mailbox not found")
		return
	}

	userIDVal, _ := c.Get("UserID")
	var actorID *uint64
	if userIDVal != nil {
		uid := userIDVal.(uint64)
		actorID = &uid
	}

	// Mandatory Audit Log: admin_viewed
	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	meta := fmt.Sprintf(`{"action":"opened_mailbox","address":"%s"}`, mailbox.Address)
	_ = ctrl.logService.LogEvent(models.MailLogEventAdminViewed, actorID, &mailbox.ID, &mailbox.Address, mailbox.UserID, nil, &ip, &ua, &meta)

	// Fetch messages for this mailbox
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	folder := c.DefaultQuery("folder", "inbox")

	query := ctrl.db.Model(&models.MailMessage{}).Where("mailbox_id = ?", mailbox.ID)
	if folder != "all" {
		query = query.Where("folder = ?", folder)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * perPage
	var messages []models.MailMessage
	query.Order("sort_at DESC").Offset(offset).Limit(perPage).Find(&messages)

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get read-only messages success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data: gin.H{
			"mailbox":  mailbox,
			"messages": messages,
		},
	})
}
