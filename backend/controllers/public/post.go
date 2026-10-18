package public

import (
	"net/http"
	"strconv"

	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type PostController struct {
	db *gorm.DB
}

func NewPostController(db *gorm.DB) *PostController {
	return &PostController{db: db}
}

// Index lists published blog posts with optional filters
func (ctrl *PostController) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "10"))
	if page < 1 {
		page = 1
	}
	if perPage < 1 || perPage > 50 {
		perPage = 10
	}

	query := ctrl.db.Model(&models.Post{}).
		Where("status = ?", "published")

	// Search filter
	if search := c.Query("search"); search != "" {
		likeTerm := "%" + search + "%"
		query = query.Where("title LIKE ? OR excerpt LIKE ?", likeTerm, likeTerm)
	}

	// Category filter
	if catSlug := c.Query("category"); catSlug != "" && catSlug != "all" {
		var cat models.PostCategory
		if err := ctrl.db.Where("slug = ?", catSlug).First(&cat).Error; err == nil {
			query = query.Where("category_id = ?", cat.ID)
		}
	}

	// Author Talent filter
	if authorSlug := c.Query("author"); authorSlug != "" {
		var talent models.Talent
		if err := ctrl.db.Where("slug = ?", authorSlug).First(&talent).Error; err == nil {
			query = query.Where("author_talent_id = ?", talent.ID)
		}
	}

	var total int64
	query.Count(&total)

	var posts []models.Post
	offset := (page - 1) * perPage
	err := query.
		Preload("CoverMedia").
		Preload("Category").
		Preload("AuthorTalent.Badges").
		Preload("AuthorTalent.Specialties").
		Preload("AuthorTalent.AvatarMedia").
		Preload("AuthorUser").
		Preload("Tags").
		Order("published_at DESC").
		Offset(offset).
		Limit(perPage).
		Find(&posts).Error

	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve posts")
		return
	}

	postResponses := make([]structs.PostResponse, len(posts))
	for i, p := range posts {
		postResponses[i] = helpers.FormatPostResponse(&p)
	}

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get posts success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        postResponses,
	})
}

// Show returns a single published post by slug
func (ctrl *PostController) Show(c *gin.Context) {
	slug := c.Param("slug")

	var post models.Post
	err := ctrl.db.
		Preload("CoverMedia").
		Preload("Category").
		Preload("AuthorTalent.Badges").
		Preload("AuthorTalent.Specialties").
		Preload("AuthorTalent.AvatarMedia").
		Preload("AuthorUser").
		Preload("Tags").
		Where("slug = ? AND status = ?", slug, "published").
		First(&post).Error

	if err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Post not found")
		return
	}

	postResp := helpers.FormatPostResponse(&post)
	if postResp.AuthorTalent == nil && post.AuthorID > 0 {
		var talent models.Talent
		if err := ctrl.db.
			Preload("Badges").
			Preload("Specialties").
			Preload("AvatarMedia").
			Where("user_id = ? AND is_published = true", post.AuthorID).
			First(&talent).Error; err == nil {
			tr := helpers.FormatTalentResponse(&talent)
			postResp.AuthorTalent = &tr
		}
	}

	// Fetch up to 3 related published posts
	var related []models.Post
	relQuery := ctrl.db.Model(&models.Post{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("Tags").
		Preload("AuthorTalent.Badges").
		Preload("AuthorTalent.AvatarMedia").
		Where("status = ? AND id != ?", "published", post.ID)

	if post.CategoryID != nil && *post.CategoryID > 0 {
		var sameCatCount int64
		ctrl.db.Model(&models.Post{}).Where("status = ? AND id != ? AND category_id = ?", "published", post.ID, *post.CategoryID).Count(&sameCatCount)
		if sameCatCount > 0 {
			relQuery = relQuery.Where("category_id = ?", *post.CategoryID)
		}
	}

	if err := relQuery.Order("published_at DESC").Limit(3).Find(&related).Error; err == nil {
		for _, rp := range related {
			rpResp := helpers.FormatPostResponse(&rp)
			if rpResp.AuthorTalent == nil && rp.AuthorID > 0 {
				var talent models.Talent
				if err := ctrl.db.
					Preload("Badges").
					Preload("Specialties").
					Preload("AvatarMedia").
					Where("user_id = ? AND is_published = true", rp.AuthorID).
					First(&talent).Error; err == nil {
					tr := helpers.FormatTalentResponse(&talent)
					rpResp.AuthorTalent = &tr
				}
			}
			postResp.RelatedPosts = append(postResp.RelatedPosts, rpResp)
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get post detail success", postResp)
}

// Categories lists post categories
func (ctrl *PostController) Categories(c *gin.Context) {
	var categories []models.PostCategory
	ctrl.db.Order("sort_order ASC").Find(&categories)

	resp := make([]structs.PostCategoryResponse, len(categories))
	for i, cat := range categories {
		resp[i] = structs.PostCategoryResponse{
			ID:        cat.ID,
			Name:      cat.Name,
			Slug:      cat.Slug,
			SortOrder: cat.SortOrder,
			CreatedAt: cat.CreatedAt,
			UpdatedAt: cat.UpdatedAt,
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get post categories success", resp)
}
