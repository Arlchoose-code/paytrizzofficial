package mail

import (
	"fmt"
	"io"
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MessageController struct {
	mailService     *services.MailService
	mailboxService  *services.MailboxService
	outboundService *services.MailOutboundService
	sseHub          *services.SSEHub
}

func NewMessageController(
	mailService *services.MailService,
	mailboxService *services.MailboxService,
	outboundService *services.MailOutboundService,
	sseHub *services.SSEHub,
) *MessageController {
	return &MessageController{
		mailService:     mailService,
		mailboxService:  mailboxService,
		outboundService: outboundService,
		sseHub:          sseHub,
	}
}

func (ctrl *MessageController) getAccessibleBoxIDs(c *gin.Context) ([]uint64, uint64, string, error) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	if userIDVal == nil || roleVal == nil {
		return nil, 0, "", fmt.Errorf("authentication required")
	}

	userID := userIDVal.(uint64)
	role := roleVal.(string)

	boxes, err := ctrl.mailboxService.GetUserMailboxes(userID, role)
	if err != nil {
		return nil, 0, "", err
	}

	var ids []uint64
	for _, b := range boxes {
		ids = append(ids, b.ID)
	}
	return ids, userID, role, nil
}

// Index lists messages matching folder, search query, and mailbox scope
func (ctrl *MessageController) Index(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	folder := c.DefaultQuery("folder", "inbox")
	search := c.Query("search")
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "30"))

	var filterBoxID *uint64
	if boxIDStr := c.Query("mailbox_id"); boxIDStr != "" {
		if id, err := strconv.ParseUint(boxIDStr, 10, 64); err == nil && id > 0 {
			filterBoxID = &id
		}
	}

	var filterLabelID *uint64
	if labelIDStr := c.Query("label_id"); labelIDStr != "" {
		if id, err := strconv.ParseUint(labelIDStr, 10, 64); err == nil && id > 0 {
			filterLabelID = &id
		}
	}

	paginated, err := ctrl.mailService.GetMessages(boxIDs, filterBoxID, folder, search, filterLabelID, page, perPage)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondPaginated(c, "Get messages success", paginated)
}

// Counts returns unread and folder count tallies for sidebar
func (ctrl *MessageController) Counts(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var filterBoxID *uint64
	if boxIDStr := c.Query("mailbox_id"); boxIDStr != "" {
		if id, err := strconv.ParseUint(boxIDStr, 10, 64); err == nil && id > 0 {
			filterBoxID = &id
		}
	}

	counts, err := ctrl.mailService.GetFolderCounts(boxIDs, filterBoxID)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get folder counts success", counts)
}

// Show returns message detail, sanitizes HTML, and marks as read
func (ctrl *MessageController) Show(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	markRead := c.DefaultQuery("mark_read", "true") == "true"
	msg, err := ctrl.mailService.GetMessageDetail(boxIDs, id, markRead)
	if err != nil {
		helpers.RespondError(c, http.StatusNotFound, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get message detail success", msg)
}

// Thread returns all messages in the conversation thread for a given message
func (ctrl *MessageController) Thread(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	msg, err := ctrl.mailService.GetMessageDetail(boxIDs, id, false)
	if err != nil {
		helpers.RespondError(c, http.StatusNotFound, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get message thread success", msg.ThreadMessages)
}

// Compose dispatches or queues a new message, saves draft, or schedules send
func (ctrl *MessageController) Compose(c *gin.Context) {
	boxIDs, userID, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	var req structs.MailComposeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	msg, err := ctrl.outboundService.SendOrQueue(userID, boxIDs, req)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusCreated, "Message queued or saved successfully", msg)
}

// UndoSend cancels a queued message within its 8-second window
func (ctrl *MessageController) UndoSend(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	if err := ctrl.outboundService.UndoSend(boxIDs, id); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Send undone, reverted to drafts", nil)
}

// Move changes folder of a message
func (ctrl *MessageController) Move(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.MailFolderMoveRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if err := ctrl.mailService.MoveFolder(boxIDs, id, models.MailFolder(req.Folder)); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Message moved to "+req.Folder, nil)
}

// Star toggles starred status
func (ctrl *MessageController) Star(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.MailStarRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if err := ctrl.mailService.SetStar(boxIDs, id, req.IsStarred); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Star updated", nil)
}

// Read toggles read status
func (ctrl *MessageController) Read(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.MailReadRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if err := ctrl.mailService.SetRead(boxIDs, id, req.IsRead); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Read status updated", nil)
}

// Snooze delays message
func (ctrl *MessageController) Snooze(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.MailSnoozeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if err := ctrl.mailService.Snooze(boxIDs, id, req.SnoozedUntil); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Message snoozed", nil)
}

// Stream handles realtime Server-Sent Events (SSE)
func (ctrl *MessageController) Stream(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	if userIDVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}
	userID := userIDVal.(uint64)

	c.Writer.Header().Set("Content-Type", "text/event-stream")
	c.Writer.Header().Set("Cache-Control", "no-cache")
	c.Writer.Header().Set("Connection", "keep-alive")
	c.Writer.Header().Set("Transfer-Encoding", "chunked")

	ch := ctrl.sseHub.Register(userID)
	defer ctrl.sseHub.Unregister(userID, ch)

	// Send initial ping
	fmt.Fprintf(c.Writer, "event: ping\ndata: {\"status\":\"connected\"}\n\n")
	c.Writer.Flush()

	c.Stream(func(w io.Writer) bool {
		if msg, ok := <-ch; ok {
			fmt.Fprint(w, msg)
			return true
		}
		return false
	})
}

// UpdateDraft updates an existing draft message
func (ctrl *MessageController) UpdateDraft(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	var req structs.MailComposeRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	msg, err := ctrl.mailService.UpdateDraft(boxIDs, id, req)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Draft updated successfully", msg)
}

// Destroy permanently deletes a message from trash
func (ctrl *MessageController) Destroy(c *gin.Context) {
	boxIDs, _, _, err := ctrl.getAccessibleBoxIDs(c)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid message ID")
		return
	}

	if err := ctrl.mailService.Destroy(boxIDs, id); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Message permanently deleted", nil)
}
