package mail

import (
	"net/http"
	"strconv"

	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

// LabelOwnerKey scopes labels per audience: admins share the company label set,
// each talent owns a private one (PRD 4.10 "Manage Labels").
func labelOwnerKey(userID uint64, role string) string {
	if role == "admin" {
		return "company"
	}
	return "talent:" + strconv.FormatUint(userID, 10)
}

type LabelController struct {
	db             *gorm.DB
	mailboxService *services.MailboxService
}

func NewLabelController(db *gorm.DB, mailboxService *services.MailboxService) *LabelController {
	return &LabelController{db: db, mailboxService: mailboxService}
}

func (ctrl *LabelController) scope(c *gin.Context) ([]uint64, uint64, string, error) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	userID, _ := userIDVal.(uint64)
	role, _ := roleVal.(string)
	if userID == 0 || role == "" {
		return nil, 0, "", gorm.ErrRecordNotFound
	}

	boxes, err := ctrl.mailboxService.GetUserMailboxes(userID, role)
	if err != nil {
		return nil, 0, "", err
	}
	ids := make([]uint64, 0, len(boxes))
	for _, b := range boxes {
		ids = append(ids, b.ID)
	}
	return ids, userID, role, nil
}

// Index lists every label for the current owner together with its message count
func (ctrl *LabelController) Index(c *gin.Context) {
	boxIDs, userID, role, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	var labels []models.MailLabel
	if err := ctrl.db.Where("owner_key = ?", labelOwnerKey(userID, role)).Order("name ASC").Find(&labels).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to load labels")
		return
	}

	resp := make([]structs.MailLabelResponse, 0, len(labels))
	for _, l := range labels {
		count := int64(0)
		if len(boxIDs) > 0 {
			ctrl.db.Table("mail_message_labels AS ml").
				Joins("JOIN mail_messages AS m ON m.id = ml.message_id").
				Where("ml.label_id = ? AND m.mailbox_id IN ?", l.ID, boxIDs).
				Count(&count)
		}
		resp = append(resp, structs.MailLabelResponse{
			ID:           l.ID,
			OwnerKey:     l.OwnerKey,
			Name:         l.Name,
			Color:        l.Color,
			MessageCount: int(count),
			CreatedAt:    l.CreatedAt,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get labels success", resp)
}

// Store creates a label for the current owner
func (ctrl *LabelController) Store(c *gin.Context) {
	_, userID, role, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	var req structs.MailLabelCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	key := labelOwnerKey(userID, role)
	var existing models.MailLabel
	if err := ctrl.db.Where("owner_key = ? AND name = ?", key, req.Name).First(&existing).Error; err == nil {
		helpers.RespondError(c, http.StatusBadRequest, "A label with that name already exists")
		return
	}

	color := req.Color
	if color == "" {
		color = "#FCCF00"
	}

	label := models.MailLabel{OwnerKey: key, Name: req.Name, Color: color}
	if err := ctrl.db.Create(&label).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create label")
		return
	}

	helpers.RespondSuccess(c, http.StatusCreated, "Label created successfully", structs.MailLabelResponse{
		ID: label.ID, OwnerKey: label.OwnerKey, Name: label.Name, Color: label.Color, CreatedAt: label.CreatedAt,
	})
}

// Update renames or recolors a label
func (ctrl *LabelController) Update(c *gin.Context) {
	_, userID, role, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid label ID")
		return
	}

	var req structs.MailLabelUpdateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	key := labelOwnerKey(userID, role)
	var label models.MailLabel
	if err := ctrl.db.Where("id = ? AND owner_key = ?", id, key).First(&label).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Label not found")
		return
	}

	label.Name = req.Name
	if req.Color != "" {
		label.Color = req.Color
	}
	if err := ctrl.db.Save(&label).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update label")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Label updated successfully", structs.MailLabelResponse{
		ID: label.ID, OwnerKey: label.OwnerKey, Name: label.Name, Color: label.Color, CreatedAt: label.CreatedAt,
	})
}

// Destroy removes a label and every assignment to it
func (ctrl *LabelController) Destroy(c *gin.Context) {
	_, userID, role, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid label ID")
		return
	}

	key := labelOwnerKey(userID, role)
	var label models.MailLabel
	if err := ctrl.db.Where("id = ? AND owner_key = ?", id, key).First(&label).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Label not found")
		return
	}

	tx := ctrl.db.Begin()
	if err := tx.Where("label_id = ?", label.ID).Delete(&models.MailMessageLabel{}).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to remove label assignments")
		return
	}
	if err := tx.Delete(&label).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete label")
		return
	}
	tx.Commit()

	helpers.RespondSuccess(c, http.StatusOK, "Label deleted successfully", nil)
}

// Assign replaces the label set of one accessible message
func (ctrl *LabelController) Assign(c *gin.Context) {
	boxIDs, userID, role, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	messageID, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.MailMessageLabelsRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var message models.MailMessage
	if err := ctrl.db.Where("id = ? AND mailbox_id IN ?", messageID, boxIDs).First(&message).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Message not found")
		return
	}

	key := labelOwnerKey(userID, role)
	var labels []models.MailLabel
	if len(req.LabelIDs) > 0 {
		if err := ctrl.db.Where("id IN ? AND owner_key = ?", req.LabelIDs, key).Find(&labels).Error; err != nil {
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to resolve labels")
			return
		}
		if len(labels) != len(req.LabelIDs) {
			helpers.RespondError(c, http.StatusBadRequest, "One or more labels are not available to you")
			return
		}
	}

	tx := ctrl.db.Begin()
	if err := tx.Where("message_id = ?", message.ID).Delete(&models.MailMessageLabel{}).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update labels")
		return
	}
	for _, l := range labels {
		if err := tx.Create(&models.MailMessageLabel{MessageID: message.ID, LabelID: l.ID}).Error; err != nil {
			tx.Rollback()
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to update labels")
			return
		}
	}
	tx.Commit()

	resp := make([]structs.MailLabelResponse, 0, len(labels))
	for _, l := range labels {
		resp = append(resp, structs.MailLabelResponse{ID: l.ID, OwnerKey: l.OwnerKey, Name: l.Name, Color: l.Color, CreatedAt: l.CreatedAt})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Message labels updated", resp)
}
