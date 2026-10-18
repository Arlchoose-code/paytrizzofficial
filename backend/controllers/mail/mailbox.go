package mail

import (
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MailboxController struct {
	mailboxService *services.MailboxService
}

func NewMailboxController(mailboxService *services.MailboxService) *MailboxController {
	return &MailboxController{mailboxService: mailboxService}
}

// Index returns accessible mailboxes for current actor (admin = all company; talent = own)
func (ctrl *MailboxController) Index(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	if userIDVal == nil || roleVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	userID := userIDVal.(uint64)
	role := roleVal.(string)

	boxes, err := ctrl.mailboxService.GetUserMailboxes(userID, role)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch mailboxes")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get mailboxes success", boxes)
}

// Store creates a new mailbox: company mailboxes for admins (PRD 4.10),
// personal mailboxes for talents.
func (ctrl *MailboxController) Store(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	if userIDVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}
	userID := userIDVal.(uint64)
	role, _ := roleVal.(string)

	var req structs.MailboxCreateRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var box *models.Mailbox
	var err error
	if role == "admin" {
		box, err = ctrl.mailboxService.CreateCompanyMailbox(userID, req.LocalPart, req.DisplayName, req.Color)
	} else {
		box, err = ctrl.mailboxService.CreateTalentMailbox(userID, req.LocalPart, req.DisplayName, req.Color)
	}
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusCreated, "Mailbox created successfully", box)
}

// Destroy soft-deletes a mailbox
func (ctrl *MailboxController) Destroy(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	if userIDVal == nil || roleVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}

	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid mailbox ID")
		return
	}

	userID := userIDVal.(uint64)
	role := roleVal.(string)

	if err := ctrl.mailboxService.DeleteMailbox(id, userID, role); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Mailbox deleted successfully", nil)
}
