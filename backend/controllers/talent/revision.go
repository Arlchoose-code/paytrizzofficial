package talent

import (
	"encoding/json"
	"net/http"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type RevisionController struct {
	revisionService *services.RevisionService
}

func NewRevisionController(revisionService *services.RevisionService) *RevisionController {
	return &RevisionController{revisionService: revisionService}
}

// Index lists revisions submitted by current talent user
func (ctrl *RevisionController) Index(c *gin.Context) {
	actorID, _ := c.Get("UserID")
	userID, ok := actorID.(uint64)
	if !ok {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var revisions []models.ContentRevision
	config.DB.Where("submitted_by = ?", userID).Order("id DESC").Find(&revisions)

	resp := make([]structs.ContentRevisionResponse, len(revisions))
	for i, r := range revisions {
		var payloadMap map[string]interface{}
		_ = json.Unmarshal(r.Payload, &payloadMap)

		resp[i] = structs.ContentRevisionResponse{
			ID:          r.ID,
			EntityType:  r.EntityType,
			EntityID:    r.EntityID,
			SubmittedBy: r.SubmitterID,
			Payload:     payloadMap,
			Status:      r.Status,
			ReviewedBy:  r.ReviewerID,
			ReviewNote:  r.ReviewNote,
			ReviewedAt:  r.ReviewedAt,
			CreatedAt:   r.CreatedAt,
			UpdatedAt:   r.UpdatedAt,
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get my revisions success", resp)
}

// Submit allows talent to submit revisions for their published articles or projects
func (ctrl *RevisionController) Submit(c *gin.Context) {
	actorID, _ := c.Get("UserID")
	userID, ok := actorID.(uint64)
	if !ok {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req structs.SubmitContentRevisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	rev, err := ctrl.revisionService.SubmitRevision(req.EntityType, req.EntityID, userID, req.Payload)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	helpers.RespondSuccess(c, http.StatusCreated, "Revision submitted for admin review", rev)
}
