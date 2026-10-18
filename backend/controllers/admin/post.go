package admin

import (
	"fmt"
	"net/http"
	"strconv"
	"time"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type PostController struct {
	slugService       *services.SlugService
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
	outboxService     *services.EmailOutboxService
}

func NewPostController(
	slugService *services.SlugService,
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
	outboxService *services.EmailOutboxService,
) *PostController {
	return &PostController{
		slugService:       slugService,
		revalidateService: revalidateService,
		auditService:      auditService,
		outboxService:     outboxService,
	}
}

// Index lists blog posts with search, status filter, and pagination
func (ctrl *PostController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 20
	}

	db := config.DB.Model(&models.Post{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("AuthorTalent").
		Preload("Tags")

	if query.Search != "" {
		likeTerm := "%" + query.Search + "%"
		db = db.Where("title LIKE ? OR excerpt LIKE ?", likeTerm, likeTerm)
	}

	if status := c.Query("status"); status != "" && status != "all" {
		db = db.Where("status = ?", status)
	}

	var total int64
	db.Count(&total)

	var posts []models.Post
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&posts).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	resp := make([]structs.PostResponse, len(posts))
	for i, p := range posts {
		resp[i] = helpers.FormatPostResponse(&p)
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get posts success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        resp,
	})
}

// Store creates a new blog post
func (ctrl *PostController) Store(c *gin.Context) {
	var req structs.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	slug := ctrl.slugService.GenerateUniqueSlug("posts", req.Title, nil)

	status := "draft"
	if req.Status != "" {
		status = req.Status
	}

	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	actorID, _ := c.Get("UserID")
	authorID := uint64(0)
	if aid, ok := actorID.(uint64); ok {
		authorID = aid
	}

	readingMinutes := req.ReadingMinutes
	if readingMinutes < 1 {
		readingMinutes = 3
	}

	post := models.Post{
		Slug:           slug,
		Title:          req.Title,
		Excerpt:        req.Excerpt,
		Content:        req.Content,
		CoverMediaID:   req.CoverMediaID,
		CategoryID:     req.CategoryID,
		AuthorTalentID: req.AuthorTalentID,
		ReadingMinutes: readingMinutes,
		Status:         status,
		AuthorID:       authorID,
		PublishedAt:    publishedAt,
	}

	if err := config.DB.Create(&post).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create post")
		return
	}

	// Link tags
	for _, tid := range req.TagIDs {
		config.DB.Create(&models.PostTag{
			PostID: post.ID,
			TagID:  tid,
		})
	}

	// Audit log
	ctrl.auditService.LogContext(c, "blog", "create", "post", &post.ID, fmt.Sprintf("Created post '%s'", post.Title), nil)

	// ISR revalidation
	ctrl.revalidateService.QueueTag("blog")

	helpers.RespondSuccess(c, http.StatusCreated, "Post created successfully", helpers.FormatPostResponse(&post))
}

// Show returns a single blog post by ID
func (ctrl *PostController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := config.DB.
		Preload("CoverMedia").
		Preload("Category").
		Preload("AuthorTalent.Badges").
		Preload("Tags").
		First(&post, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get post success", helpers.FormatPostResponse(&post))
}

// Update updates an existing post
func (ctrl *PostController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found")
		return
	}

	var req structs.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	if req.Title != "" && req.Title != post.Title {
		currID := uint64(post.ID)
		post.Slug = ctrl.slugService.GenerateUniqueSlug("posts", req.Title, &currID)
		post.Title = req.Title
	}

	if req.Excerpt != "" {
		post.Excerpt = req.Excerpt
	}
	if req.Content != "" {
		post.Content = req.Content
	}
	post.CoverMediaID = req.CoverMediaID
	post.CategoryID = req.CategoryID
	post.AuthorTalentID = req.AuthorTalentID
	if req.ReadingMinutes > 0 {
		post.ReadingMinutes = req.ReadingMinutes
	}

	previousStatus := post.Status
	if req.Status != "" {
		if req.Status == "published" && post.Status != "published" {
			now := time.Now()
			post.PublishedAt = &now
		}
		post.Status = req.Status
	}

	if err := config.DB.Save(&post).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update post")
		return
	}

	// Notify talent when their submission is approved or rejected (PRD 4.8)
	if previousStatus == "pending" && (post.Status == "published" || post.Status == "rejected") {
		ctrl.sendReviewEmail(post, previousStatus)
	}

	// Sync tags if provided
	if req.TagIDs != nil {
		config.DB.Where("post_id = ?", post.ID).Delete(&models.PostTag{})
		for _, tid := range req.TagIDs {
			config.DB.Create(&models.PostTag{
				PostID: post.ID,
				TagID:  tid,
			})
		}
	}

	ctrl.auditService.LogContext(c, "blog", "update", "post", &post.ID, fmt.Sprintf("Updated post '%s'", post.Title), nil)
	ctrl.revalidateService.QueueTag("blog")
	ctrl.revalidateService.QueueTag(fmt.Sprintf("post-%s", post.Slug))

	helpers.RespondSuccess(c, http.StatusOK, "Post updated successfully", helpers.FormatPostResponse(&post))
}

// sendReviewEmail notifies the authoring talent about an approval/rejection decision
func (ctrl *PostController) sendReviewEmail(post models.Post, previousStatus string) {
	if ctrl.outboxService == nil {
		return
	}
	var author models.User
	if err := config.DB.First(&author, post.AuthorID).Error; err != nil {
		return
	}
	if author.Role != models.RoleTalent {
		return
	}
	reviewNote := ""
	if post.ReviewNote != nil {
		reviewNote = *post.ReviewNote
	}
	templateKey := "content_approved"
	if post.Status == "rejected" {
		templateKey = "content_rejected"
	}
	_, _ = ctrl.outboxService.SendTemplated(
		templateKey,
		author.Email,
		&author.Name,
		map[string]string{
			"name":          author.Name,
			"content_type":  "blog post",
			"title":         post.Title,
			"review_note":   reviewNote,
			"dashboard_url": "http://localhost:3000/talent/revisions",
		},
		nil,
		func(s string) *string { return &s }("post"),
		&post.ID,
	)
}

// Destroy deletes a post
func (ctrl *PostController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := config.DB.First(&post, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found")
		return
	}

	if err := config.DB.Delete(&post).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete post")
		return
	}

	ctrl.auditService.LogContext(c, "blog", "delete", "post", &post.ID, fmt.Sprintf("Deleted post '%s'", post.Title), nil)
	ctrl.revalidateService.QueueTag("blog")

	helpers.RespondSuccess(c, http.StatusOK, "Post deleted successfully", nil)
}
