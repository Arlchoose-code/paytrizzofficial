package admin

import (
	"encoding/json"
	"fmt"
	"net/http"
	"strconv"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type RevisionController struct {
	revisionService *services.RevisionService
	auditService    *services.AuditService
}

func NewRevisionController(
	revisionService *services.RevisionService,
	auditService *services.AuditService,
) *RevisionController {
	return &RevisionController{
		revisionService: revisionService,
		auditService:    auditService,
	}
}

// Index lists content revisions with status filter
func (ctrl *RevisionController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}

	db := config.DB.Model(&models.ContentRevision{}).
		Preload("Submitter").
		Preload("Reviewer")

	if status := c.Query("status"); status != "" && status != "all" {
		db = db.Where("status = ?", status)
	}

	if entityType := c.Query("entity_type"); entityType != "" {
		db = db.Where("entity_type = ?", entityType)
	}

	var total int64
	db.Count(&total)

	var revisions []models.ContentRevision
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&revisions).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch revisions")
		return
	}

	resp := make([]structs.ContentRevisionResponse, len(revisions))
	for i, r := range revisions {
		var payloadMap map[string]interface{}
		_ = json.Unmarshal(r.Payload, &payloadMap)

		var subResp *structs.UserResponse
		if r.Submitter != nil {
			subResp = &structs.UserResponse{
				ID:        r.Submitter.ID,
				Name:      r.Submitter.Name,
				Email:     r.Submitter.Email,
				Role:      string(r.Submitter.Role),
				CreatedAt: r.Submitter.CreatedAt,
			}
		}

		var revResp *structs.UserResponse
		if r.Reviewer != nil {
			revResp = &structs.UserResponse{
				ID:        r.Reviewer.ID,
				Name:      r.Reviewer.Name,
				Email:     r.Reviewer.Email,
				Role:      string(r.Reviewer.Role),
				CreatedAt: r.Reviewer.CreatedAt,
			}
		}

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
			Submitter:   subResp,
			Reviewer:    revResp,
		}
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get revisions success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        resp,
	})
}

// Show returns revision details and the corresponding live content for side-by-side diff
func (ctrl *RevisionController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid revision ID")
		return
	}

	var r models.ContentRevision
	if err := config.DB.Preload("Submitter").Preload("Reviewer").First(&r, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Revision not found")
		return
	}

	var payloadMap map[string]interface{}
	_ = json.Unmarshal(r.Payload, &payloadMap)

	var liveContent interface{}
	if r.EntityType == "project" {
		var p models.Project
		if err := config.DB.Preload("Category").Preload("CoverMedia").First(&p, r.EntityID).Error; err == nil {
			liveContent = helpers.FormatProjectResponse(&p)
		}
	} else if r.EntityType == "post" {
		var post models.Post
		if err := config.DB.Preload("Category").Preload("CoverMedia").Preload("AuthorTalent").First(&post, r.EntityID).Error; err == nil {
			liveContent = helpers.FormatPostResponse(&post)
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get revision detail success", gin.H{
		"revision":     r,
		"payload":      payloadMap,
		"live_content": liveContent,
	})
}

// Review approves or rejects a revision
func (ctrl *RevisionController) Review(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid revision ID")
		return
	}

	var req structs.ReviewContentRevisionRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	actorID, _ := c.Get("UserID")
	reviewerID := uint64(0)
	if aid, ok := actorID.(uint64); ok {
		reviewerID = aid
	}

	approve := req.Status == "approved"
	rev, err := ctrl.revisionService.ReviewRevision(id, reviewerID, approve, req.ReviewNote)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	ctrl.auditService.LogContext(
		c,
		"revisions",
		req.Status,
		rev.EntityType,
		&rev.EntityID,
		fmt.Sprintf("Revision %d for %s %d was %s", rev.ID, rev.EntityType, rev.EntityID, req.Status),
		nil,
	)

	helpers.RespondSuccess(c, http.StatusOK, fmt.Sprintf("Revision %s successfully", req.Status), rev)
}
