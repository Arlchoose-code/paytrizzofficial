package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
)

type FAQController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewFAQController(revalidateService *services.RevalidateService, auditService *services.AuditService) *FAQController {
	return &FAQController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists FAQs ordered by sort_order
func (ctrl *FAQController) Index(c *gin.Context) {
	var faqs []models.FAQ
	if err := config.DB.Order("sort_order ASC, id ASC").Find(&faqs).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch FAQs")
		return
	}

	var resp []structs.FAQResponse
	for _, f := range faqs {
		resp = append(resp, structs.FAQResponse{
			ID:          f.ID,
			Question:    f.Question,
			Answer:      f.Answer,
			SortOrder:   f.SortOrder,
			IsPublished: f.IsPublished,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get FAQs success", resp)
}

// Store creates a new FAQ
func (ctrl *FAQController) Store(c *gin.Context) {
	var req structs.CreateFAQRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	isPublished := true
	if req.IsPublished != nil {
		isPublished = *req.IsPublished
	}

	faq := models.FAQ{
		Question:    req.Question,
		Answer:      req.Answer,
		SortOrder:   req.SortOrder,
		IsPublished: isPublished,
	}

	if err := config.DB.Create(&faq).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create FAQ")
		return
	}

	pathHome := "/"
	ctrl.revalidateService.QueueRevalidateTag("faq", &pathHome)
	ctrl.auditService.LogContext(c, "faqs", "create", "faq", &faq.ID, "Created FAQ "+faq.Question, faq)

	helpers.RespondSuccess(c, http.StatusCreated, "FAQ created successfully", faq)
}

// Show returns an FAQ by ID
func (ctrl *FAQController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid FAQ ID")
		return
	}

	var faq models.FAQ
	if err := config.DB.Where("id = ?", id).First(&faq).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "FAQ not found")
		return
	}

	resp := structs.FAQResponse{
		ID:          faq.ID,
		Question:    faq.Question,
		Answer:      faq.Answer,
		SortOrder:   faq.SortOrder,
		IsPublished: faq.IsPublished,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get FAQ success", resp)
}

// Update updates an existing FAQ
func (ctrl *FAQController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid FAQ ID")
		return
	}

	var req structs.UpdateFAQRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var faq models.FAQ
	if err := config.DB.Where("id = ?", id).First(&faq).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "FAQ not found")
		return
	}

	faq.Question = req.Question
	faq.Answer = req.Answer
	faq.SortOrder = req.SortOrder
	if req.IsPublished != nil {
		faq.IsPublished = *req.IsPublished
	}

	if err := config.DB.Save(&faq).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update FAQ")
		return
	}

	pathHome := "/"
	ctrl.revalidateService.QueueRevalidateTag("faq", &pathHome)
	ctrl.auditService.LogContext(c, "faqs", "update", "faq", &faq.ID, "Updated FAQ "+faq.Question, faq)

	helpers.RespondSuccess(c, http.StatusOK, "FAQ updated successfully", faq)
}

// Destroy deletes an FAQ
func (ctrl *FAQController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid FAQ ID")
		return
	}

	var faq models.FAQ
	if err := config.DB.Where("id = ?", id).First(&faq).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "FAQ not found")
		return
	}

	if err := config.DB.Delete(&faq).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete FAQ")
		return
	}

	pathHome := "/"
	ctrl.revalidateService.QueueRevalidateTag("faq", &pathHome)
	ctrl.auditService.LogContext(c, "faqs", "delete", "faq", &faq.ID, "Deleted FAQ "+faq.Question, nil)

	helpers.RespondSuccess(c, http.StatusOK, "FAQ deleted successfully", nil)
}
