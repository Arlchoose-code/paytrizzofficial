package mail

import (
	"net/http"
	"strconv"
	"time"

	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SubscriptionController struct {
	db             *gorm.DB
	mailboxService *services.MailboxService
}

func NewSubscriptionController(db *gorm.DB, mailboxService *services.MailboxService) *SubscriptionController {
	return &SubscriptionController{
		db:             db,
		mailboxService: mailboxService,
	}
}

func (ctrl *SubscriptionController) scope(c *gin.Context) ([]uint64, uint64, string, error) {
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

// Index lists subscriptions matching the accessible mailboxes
func (ctrl *SubscriptionController) Index(c *gin.Context) {
	boxIDs, _, _, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	if len(boxIDs) == 0 {
		helpers.RespondSuccess(c, http.StatusOK, "Get subscriptions success", []structs.MailSubscriptionResponse{})
		return
	}

	query := ctrl.db.Where("mailbox_id IN ?", boxIDs)

	if boxIDStr := c.Query("mailbox_id"); boxIDStr != "" {
		if id, err := strconv.ParseUint(boxIDStr, 10, 64); err == nil && id > 0 {
			query = query.Where("mailbox_id = ?", id)
		}
	}

	if status := c.Query("status"); status != "" {
		query = query.Where("status = ?", status)
	}

	if search := c.Query("search"); search != "" {
		query = query.Where("sender_address LIKE ? OR sender_name LIKE ?", "%"+search+"%", "%"+search+"%")
	}

	var subs []models.MailSubscription
	if err := query.Order("last_received_at DESC").Find(&subs).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to load subscriptions")
		return
	}

	resp := make([]structs.MailSubscriptionResponse, 0, len(subs))
	for _, s := range subs {
		resp = append(resp, structs.MailSubscriptionResponse{
			ID:                s.ID,
			MailboxID:         s.MailboxID,
			SenderAddress:     s.SenderAddress,
			SenderName:        s.SenderName,
			ListID:            s.ListID,
			UnsubscribeHTTP:   s.UnsubscribeHTTP,
			UnsubscribeMailto: s.UnsubscribeMailto,
			OneClick:          s.OneClick,
			MessageCount:      s.MessageCount,
			LastReceivedAt:    s.LastReceivedAt,
			Status:            s.Status,
			UnsubscribedAt:    s.UnsubscribedAt,
			CreatedAt:         s.CreatedAt,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get subscriptions success", resp)
}

// Unsubscribe marks a subscription as unsubscribed (PRD 5.6)
func (ctrl *SubscriptionController) Unsubscribe(c *gin.Context) {
	boxIDs, userID, role, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid subscription ID")
		return
	}

	var sub models.MailSubscription
	if err := ctrl.db.Preload("Mailbox").Where("id = ? AND mailbox_id IN ?", id, boxIDs).First(&sub).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Subscription not found")
		return
	}

	now := time.Now()
	sub.Status = models.SubscriptionStatusUnsubscribed
	sub.UnsubscribedAt = &now

	if err := ctrl.db.Save(&sub).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update subscription status")
		return
	}

	// Audit to mail_logs
	var boxAddr *string
	var talentUserID *uint64
	if sub.Mailbox != nil {
		boxAddr = &sub.Mailbox.Address
		if sub.Mailbox.OwnerType == models.MailboxOwnerTalent {
			talentUserID = sub.Mailbox.UserID
		}
	}

	ip := c.ClientIP()
	ua := c.Request.UserAgent()
	meta := `{"sender_address":"` + sub.SenderAddress + `"}`
	ctrl.db.Create(&models.MailLog{
		Event:          models.MailLogEventSubscriptionUnsubscribed,
		ActorUserID:    &userID,
		MailboxID:      &sub.MailboxID,
		MailboxAddress: boxAddr,
		TalentUserID:   talentUserID,
		IP:             &ip,
		UserAgent:      &ua,
		Meta:           &meta,
		CreatedAt:      now,
	})

	_ = role
	helpers.RespondSuccess(c, http.StatusOK, "Unsubscribed successfully", structs.MailSubscriptionResponse{
		ID:                sub.ID,
		MailboxID:         sub.MailboxID,
		SenderAddress:     sub.SenderAddress,
		SenderName:        sub.SenderName,
		ListID:            sub.ListID,
		UnsubscribeHTTP:   sub.UnsubscribeHTTP,
		UnsubscribeMailto: sub.UnsubscribeMailto,
		OneClick:          sub.OneClick,
		MessageCount:      sub.MessageCount,
		LastReceivedAt:    sub.LastReceivedAt,
		Status:            sub.Status,
		UnsubscribedAt:    sub.UnsubscribedAt,
		CreatedAt:         sub.CreatedAt,
	})
}

// Block marks a subscription as blocked (PRD 5.6)
func (ctrl *SubscriptionController) Block(c *gin.Context) {
	boxIDs, _, _, err := ctrl.scope(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid subscription ID")
		return
	}

	var sub models.MailSubscription
	if err := ctrl.db.Where("id = ? AND mailbox_id IN ?", id, boxIDs).First(&sub).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Subscription not found")
		return
	}

	sub.Status = models.SubscriptionStatusBlocked
	if err := ctrl.db.Save(&sub).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to block sender")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Sender blocked successfully", gin.H{"id": sub.ID, "status": sub.Status})
}
