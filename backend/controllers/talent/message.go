package talent

import (
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MessageController struct {
	db *gorm.DB
}

func NewMessageController(db *gorm.DB) *MessageController {
	return &MessageController{db: db}
}

// getTalentID retrieves the Talent.ID associated with the authenticated user
func (ctrl *MessageController) getTalentID(c *gin.Context) (uint64, error) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		return 0, gorm.ErrRecordNotFound
	}
	userID := userIDVal.(uint64)

	var talent models.Talent
	if err := ctrl.db.Where("user_id = ?", userID).First(&talent).Error; err != nil {
		return 0, err
	}
	return talent.ID, nil
}

// Index lists messages sent specifically to this talent (strict tenant scope)
func (ctrl *MessageController) Index(c *gin.Context) {
	talentID, err := ctrl.getTalentID(c)
	if err != nil {
		helpers.RespondError(c, http.StatusForbidden, "Talent profile not found for current user")
		return
	}

	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "20"))
	status := c.Query("status")

	query := ctrl.db.Model(&models.ContactMessage{}).Where("talent_id = ?", talentID)
	if status != "" {
		query = query.Where("status = ?", status)
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

	helpers.RespondPaginated(c, "Get talent messages success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        messages,
	})
}

// Show returns detail of a message if it belongs to current talent
func (ctrl *MessageController) Show(c *gin.Context) {
	talentID, err := ctrl.getTalentID(c)
	if err != nil {
		helpers.RespondError(c, http.StatusForbidden, "Talent profile not found")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var msg models.ContactMessage
	if err := ctrl.db.Where("id = ? AND talent_id = ?", id, talentID).First(&msg).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Message not found or unauthorized")
		return
	}

	// Auto mark as read if it was new
	if msg.Status == "new" {
		msg.Status = "read"
		ctrl.db.Save(&msg)
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get message detail success", msg)
}

// Update allows talent to mark message as read, replied, or archived
func (ctrl *MessageController) Update(c *gin.Context) {
	talentID, err := ctrl.getTalentID(c)
	if err != nil {
		helpers.RespondError(c, http.StatusForbidden, "Talent profile not found")
		return
	}

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
	if err := ctrl.db.Where("id = ? AND talent_id = ?", id, talentID).First(&msg).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Message not found or unauthorized")
		return
	}

	msg.Status = req.Status
	if err := ctrl.db.Save(&msg).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update status")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Message updated successfully", msg)
}
