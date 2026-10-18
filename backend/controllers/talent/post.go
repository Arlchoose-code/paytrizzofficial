package talent

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
	revisionService   *services.RevisionService
	outboxService     *services.EmailOutboxService
}

func NewPostController(
	slugService *services.SlugService,
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
	revisionService *services.RevisionService,
	outboxService *services.EmailOutboxService,
) *PostController {
	return &PostController{
		slugService:       slugService,
		revalidateService: revalidateService,
		auditService:      auditService,
		revisionService:   revisionService,
		outboxService:     outboxService,
	}
}

// Index lists posts authored by the authenticated talent
func (ctrl *PostController) Index(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	var posts []models.Post
	if err := config.DB.Model(&models.Post{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("Tags").
		Where("author_talent_id = ?", t.ID).
		Order("id DESC").
		Find(&posts).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch posts")
		return
	}

	resp := make([]structs.PostResponse, len(posts))
	for i, p := range posts {
		resp[i] = helpers.FormatPostResponse(&p)
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get talent posts success", resp)
}

// Store creates a new blog post authored by the authenticated talent.
// Talent submissions enter the `pending` queue for admin approval (PRD 4.4/4.5);
// only drafts stay private until submitted.
func (ctrl *PostController) Store(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	var req structs.CreatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	slug := ctrl.slugService.GenerateUniqueSlug("posts", req.Title, nil)

	// Talent content requires admin approval before going live (PRD 4.4)
	status := "pending"
	if req.Status == "draft" {
		status = "draft"
	}

	var publishedAt *time.Time
	if status == "published" {
		now := time.Now()
		publishedAt = &now
	}

	authorTalentID := t.ID
	post := models.Post{
		Title:          req.Title,
		Slug:           slug,
		Excerpt:        req.Excerpt,
		Content:        req.Content,
		CoverMediaID:   req.CoverMediaID,
		CategoryID:     req.CategoryID,
		AuthorTalentID: &authorTalentID,
		AuthorID:       userID,
		Status:         status,
		PublishedAt:    publishedAt,
	}

	tx := config.DB.Begin()
	if err := tx.Create(&post).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create post")
		return
	}

	// Associate tags
	if len(req.TagIDs) > 0 {
		var tags []models.Tag
		tx.Where("id IN ?", req.TagIDs).Find(&tags)
		if err := tx.Model(&post).Association("Tags").Replace(&tags); err != nil {
			tx.Rollback()
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to associate tags")
			return
		}
	}

	tx.Commit()

	ctrl.revalidateService.QueueRevalidateTag("posts", nil)
	ctrl.auditService.LogContext(c, "posts", "create", "post", &post.ID, fmt.Sprintf("Talent created post: %s", post.Title), post)

	// Notify admin about the new submission (PRD 4.8)
	if status == "pending" {
		adminEmail := config.AppConfig.SeedAdminEmail
		if adminEmail == "" {
			adminEmail = config.AppConfig.SystemReplyTo
		}
		frontendURL := config.AppConfig.FrontendURL
		if frontendURL == "" {
			frontendURL = config.AppConfig.AppURL
		}
		approvalsURL := fmt.Sprintf("%s/admin/approvals", frontendURL)

		_, _ = ctrl.outboxService.SendTemplated(
			"content_submitted_admin_notification",
			adminEmail,
			func(s string) *string { return &s }("PayTrizz Operations"),
			map[string]string{
				"entity_type":   "blog article",
				"content_type":  "blog article",
				"title":         post.Title,
				"talent_name":   t.Name,
				"author":        t.Name,
				"approvals_url": approvalsURL,
				"review_url":    approvalsURL,
			},
			nil,
			func(s string) *string { return &s }("post"),
			&post.ID,
		)
	}

	config.DB.Preload("CoverMedia").Preload("Category").Preload("AuthorTalent").Preload("Tags").First(&post, post.ID)
	helpers.RespondSuccess(c, http.StatusCreated, "Post submitted successfully and waiting for admin approval", helpers.FormatPostResponse(&post))
}

// Show retrieves a single post authored by authenticated talent
func (ctrl *PostController) Show(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	idParam := c.Param("id")
	postID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := config.DB.Preload("CoverMedia").
		Preload("Category").
		Preload("AuthorTalent").
		Preload("Tags").
		Where("id = ? AND author_talent_id = ?", postID, t.ID).
		First(&post).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found or unauthorized")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get post success", helpers.FormatPostResponse(&post))
}

// Update modifies an existing post authored by authenticated talent
func (ctrl *PostController) Update(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	idParam := c.Param("id")
	postID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := config.DB.Where("id = ? AND author_talent_id = ?", postID, t.ID).First(&post).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found or unauthorized")
		return
	}

	var req structs.UpdatePostRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	// Published content edits go through the revision flow so the live version
	// stays untouched until an admin approves (PRD 4.4)
	if post.Status == "published" {
		payload := map[string]interface{}{
			"title":          req.Title,
			"excerpt":        req.Excerpt,
			"content":        req.Content,
			"cover_media_id": req.CoverMediaID,
			"category_id":    req.CategoryID,
			"tag_ids":        req.TagIDs,
		}
		rev, err := ctrl.revisionService.SubmitRevision("post", post.ID, userID, payload)
		if err != nil {
			helpers.RespondError(c, http.StatusBadRequest, err.Error())
			return
		}
		ctrl.auditService.LogContext(c, "posts", "submit_revision", "post", &post.ID, fmt.Sprintf("Talent submitted revision for post: %s", post.Title), nil)
		helpers.RespondSuccess(c, http.StatusAccepted, "Changes submitted for admin approval. The live article stays unchanged until approved.", rev)
		return
	}

	if post.Title != req.Title {
		post.Slug = ctrl.slugService.GenerateUniqueSlug("posts", req.Title, &post.ID)
	}

	post.Title = req.Title
	post.Excerpt = req.Excerpt
	post.Content = req.Content
	post.CoverMediaID = req.CoverMediaID
	post.CategoryID = req.CategoryID

	if req.Status != "" {
		post.Status = req.Status
		if post.Status == "published" && post.PublishedAt == nil {
			now := time.Now()
			post.PublishedAt = &now
		}
	}

	tx := config.DB.Begin()
	if err := tx.Save(&post).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update post")
		return
	}

	if req.TagIDs != nil {
		var tags []models.Tag
		if len(req.TagIDs) > 0 {
			tx.Where("id IN ?", req.TagIDs).Find(&tags)
		}
		if err := tx.Model(&post).Association("Tags").Replace(&tags); err != nil {
			tx.Rollback()
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to update tags")
			return
		}
	}

	tx.Commit()

	ctrl.revalidateService.QueueRevalidateTag("posts", nil)
	path := fmt.Sprintf("/blog/%s", post.Slug)
	ctrl.revalidateService.QueueRevalidateTag("post-"+post.Slug, &path)
	ctrl.auditService.LogContext(c, "posts", "update", "post", &post.ID, fmt.Sprintf("Talent updated post: %s", post.Title), post)

	config.DB.Preload("CoverMedia").Preload("Category").Preload("AuthorTalent").Preload("Tags").First(&post, post.ID)
	helpers.RespondSuccess(c, http.StatusOK, "Post updated successfully", helpers.FormatPostResponse(&post))
}

// Destroy deletes a post authored by authenticated talent
func (ctrl *PostController) Destroy(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	idParam := c.Param("id")
	postID, err := strconv.ParseUint(idParam, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid post ID")
		return
	}

	var post models.Post
	if err := config.DB.Where("id = ? AND author_talent_id = ?", postID, t.ID).First(&post).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found or unauthorized")
		return
	}

	tx := config.DB.Begin()
	tx.Model(&post).Association("Tags").Clear()
	if err := tx.Delete(&post).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete post")
		return
	}
	tx.Commit()

	ctrl.revalidateService.QueueRevalidateTag("posts", nil)
	ctrl.auditService.LogContext(c, "posts", "delete", "post", &post.ID, fmt.Sprintf("Talent deleted post: %s", post.Title), nil)

	helpers.RespondSuccess(c, http.StatusOK, "Post deleted successfully", nil)
}
