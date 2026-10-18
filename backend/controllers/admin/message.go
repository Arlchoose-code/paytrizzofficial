package admin

import (
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MessageController struct {
	db           *gorm.DB
	auditService *services.AuditService
}

func NewMessageController(db *gorm.DB, auditService *services.AuditService) *MessageController {
	return &MessageController{db: db, auditService: auditService}
}

// Index lists all contact messages with search, channel, and status filters
func (ctrl *MessageController) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")
	channel := c.Query("channel")
	search := c.Query("search")

	query := ctrl.db.Model(&models.ContactMessage{}).Preload("Talent")

	if status != "" {
		query = query.Where("status = ?", status)
	}
	if channel != "" {
		query = query.Where("channel = ?", channel)
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("name LIKE ? OR email LIKE ? OR subject LIKE ? OR ticket_code LIKE ?", like, like, like, like)
	}

	var total int64
	query.Count(&total)

	var messages []models.ContactMessage
	offset := (page - 1) * perPage
	query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&messages)

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get messages success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        messages,
	})
}

// Show returns detail for a single contact message
func (ctrl *MessageController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var msg models.ContactMessage
	if err := ctrl.db.Preload("Talent").First(&msg, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Message not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get message detail success", msg)
}

// Update changes status of contact message (new, read, replied, archived, spam)
func (ctrl *MessageController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.ContactMessageStatusUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var msg models.ContactMessage
	if err := ctrl.db.First(&msg, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Message not found")
		return
	}

	msg.Status = req.Status
	if err := ctrl.db.Save(&msg).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update status")
		return
	}

	ctrl.auditService.LogContext(c, "messages", "update_status", "contact_message", &msg.ID, "Updated contact message status to "+msg.Status, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Message updated successfully", msg)
}

// Destroy deletes a contact message
func (ctrl *MessageController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var msg models.ContactMessage
	if err := ctrl.db.First(&msg, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Message not found")
		return
	}

	if err := ctrl.db.Delete(&msg).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete message")
		return
	}

	ctrl.auditService.LogContext(c, "messages", "delete", "contact_message", &msg.ID, "Deleted contact message "+msg.TicketCode, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Message deleted successfully", nil)
}
