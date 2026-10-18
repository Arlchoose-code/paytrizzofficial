package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/models"
	"paytrizz-backend/helpers"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type MediaController struct {
	uploadService *services.UploadService
	auditService  *services.AuditService
}

func NewMediaController(uploadService *services.UploadService, auditService *services.AuditService) *MediaController {
	return &MediaController{
		uploadService: uploadService,
		auditService:  auditService,
	}
}

// Index lists media items with pagination and module filter
func (ctrl *MediaController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)

	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}

	db := config.DB.Model(&models.Media{})

	if module := c.Query("module"); module != "" {
		db = db.Where("module = ?", module)
	}

	if kind := c.Query("kind"); kind != "" {
		db = db.Where("kind = ?", kind)
	}

	if query.Search != "" {
		searchTerm := "%" + query.Search + "%"
		db = db.Where("original_name LIKE ? OR alt_text LIKE ?", searchTerm, searchTerm)
	}

	var total int64
	db.Count(&total)

	var items []models.Media
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&items).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve media")
		return
	}

	var respList []structs.MediaResponse
	for _, m := range items {
		respList = append(respList, structs.MediaResponse{
			ID:           m.ID,
			Module:       string(m.Module),
			Kind:         string(m.Kind),
			Visibility:   string(m.Visibility),
			Mime:         m.Mime,
			SizeBytes:    m.SizeBytes,
			OriginalName: m.OriginalName,
			AltText:      m.AltText,
			Width:        m.Width,
			Height:       m.Height,
			PathOriginal: m.PathOriginal,
			PathMedium:   m.PathMedium,
			PathThumb:    m.PathThumb,
			PathFile:     m.PathFile,
			CreatedAt:    m.CreatedAt,
		})
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get media success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        respList,
	})
}

// Store handles new file uploads
func (ctrl *MediaController) Store(c *gin.Context) {
	fileHeader, err := c.FormFile("file")
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "No file provided")
		return
	}

	moduleStr := c.PostForm("module")
	if moduleStr == "" {
		moduleStr = "site"
	}
	module := models.MediaModule(moduleStr)

	altTextStr := c.PostForm("alt_text")
	var altText *string
	if altTextStr != "" {
		altText = &altTextStr
	}

	userIDVal, _ := c.Get("UserID")
	var userID *uint64
	if userIDVal != nil {
		id := userIDVal.(uint64)
		userID = &id
	}

	media, err := ctrl.uploadService.SaveUploadedFile(fileHeader, module, altText, userID)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	ctrl.auditService.Log(userID, "media", "upload", "media", &media.ID, "Uploaded media "+media.OriginalName, nil, c.ClientIP(), c.GetHeader("User-Agent"))

	helpers.RespondSuccess(c, http.StatusCreated, "Upload successful", structs.MediaResponse{
		ID:           media.ID,
		Module:       string(media.Module),
		Kind:         string(media.Kind),
		Visibility:   string(media.Visibility),
		Mime:         media.Mime,
		SizeBytes:    media.SizeBytes,
		OriginalName: media.OriginalName,
		AltText:      media.AltText,
		Width:        media.Width,
		Height:       media.Height,
		PathOriginal: media.PathOriginal,
		PathMedium:   media.PathMedium,
		PathThumb:    media.PathThumb,
		PathFile:     media.PathFile,
		CreatedAt:    media.CreatedAt,
	})
}

// Show retrieves single media record
func (ctrl *MediaController) Show(c *gin.Context) {
	id := c.Param("id")
	var media models.Media
	if err := config.DB.First(&media, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Media not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get media details success", structs.MediaResponse{
		ID:           media.ID,
		Module:       string(media.Module),
		Kind:         string(media.Kind),
		Visibility:   string(media.Visibility),
		Mime:         media.Mime,
		SizeBytes:    media.SizeBytes,
		OriginalName: media.OriginalName,
		AltText:      media.AltText,
		Width:        media.Width,
		Height:       media.Height,
		PathOriginal: media.PathOriginal,
		PathMedium:   media.PathMedium,
		PathThumb:    media.PathThumb,
		PathFile:     media.PathFile,
		CreatedAt:    media.CreatedAt,
	})
}

// Update updates media metadata such as alt text
func (ctrl *MediaController) Update(c *gin.Context) {
	id := c.Param("id")
	var media models.Media
	if err := config.DB.First(&media, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Media not found")
		return
	}

	var req structs.UpdateMediaRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	media.AltText = req.AltText
	if err := config.DB.Save(&media).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update media")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Media updated successfully", structs.MediaResponse{
		ID:           media.ID,
		Module:       string(media.Module),
		Kind:         string(media.Kind),
		Visibility:   string(media.Visibility),
		Mime:         media.Mime,
		SizeBytes:    media.SizeBytes,
		OriginalName: media.OriginalName,
		AltText:      media.AltText,
		Width:        media.Width,
		Height:       media.Height,
		PathOriginal: media.PathOriginal,
		PathMedium:   media.PathMedium,
		PathThumb:    media.PathThumb,
		PathFile:     media.PathFile,
		CreatedAt:    media.CreatedAt,
	})
}

// Destroy deletes media record and removes all physical files
func (ctrl *MediaController) Destroy(c *gin.Context) {
	id := c.Param("id")
	var media models.Media
	if err := config.DB.First(&media, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Media not found")
		return
	}

	userIDVal, _ := c.Get("UserID")
	var userID *uint64
	if userIDVal != nil {
		uid := userIDVal.(uint64)
		userID = &uid
	}

	if err := ctrl.uploadService.DeleteMedia(media.ID); err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete media")
		return
	}

	ctrl.auditService.Log(userID, "media", "delete", "media", &media.ID, "Deleted media "+media.OriginalName, nil, c.ClientIP(), c.GetHeader("User-Agent"))

	helpers.RespondSuccess(c, http.StatusOK, "Media deleted successfully", nil)
}
