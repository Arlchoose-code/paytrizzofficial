package structs

import "time"

type CreatePostRequest struct {
	Title          string   `json:"title" binding:"required,min=3,max=190"`
	Excerpt        string   `json:"excerpt" binding:"required,max=300"`
	Content        string   `json:"content" binding:"required"`
	CoverMediaID   *uint64  `json:"cover_media_id"`
	CategoryID     *uint64  `json:"category_id"`
	AuthorTalentID *uint64  `json:"author_talent_id"`
	ReadingMinutes int      `json:"reading_minutes"`
	Status         string   `json:"status"` // draft, pending, published
	TagIDs         []uint64 `json:"tag_ids"`
}

type UpdatePostRequest struct {
	Title          string   `json:"title" binding:"omitempty,min=3,max=190"`
	Excerpt        string   `json:"excerpt" binding:"omitempty,max=300"`
	Content        string   `json:"content"`
	CoverMediaID   *uint64  `json:"cover_media_id"`
	CategoryID     *uint64  `json:"category_id"`
	AuthorTalentID *uint64  `json:"author_talent_id"`
	ReadingMinutes int      `json:"reading_minutes"`
	Status         string   `json:"status"`
	TagIDs         []uint64 `json:"tag_ids"`
}

type PostResponse struct {
	ID             uint64                `json:"id"`
	Slug           string                `json:"slug"`
	Title          string                `json:"title"`
	Excerpt        string                `json:"excerpt"`
	Content        string                `json:"content"`
	CoverMediaID   *uint64               `json:"cover_media_id"`
	CategoryID     *uint64               `json:"category_id"`
	AuthorTalentID *uint64               `json:"author_talent_id"`
	ReadingMinutes int                   `json:"reading_minutes"`
	Status         string                `json:"status"`
	CreatedBy      uint64                `json:"created_by"`
	ReviewedBy     *uint64               `json:"reviewed_by"`
	ReviewedAt     *time.Time            `json:"reviewed_at"`
	ReviewNote     *string               `json:"review_note"`
	PublishedAt    *time.Time            `json:"published_at"`
	CreatedAt      time.Time             `json:"created_at"`
	UpdatedAt      time.Time             `json:"updated_at"`

	CoverMedia   *MediaResponse        `json:"cover_media,omitempty"`
	Category     *PostCategoryResponse `json:"category,omitempty"`
	AuthorTalent *TalentResponse       `json:"author_talent,omitempty"`
	AuthorUser   *UserResponse         `json:"author_user,omitempty"`
	Reviewer     *UserResponse         `json:"reviewer,omitempty"`
	Tags         []TagResponse         `json:"tags,omitempty"`
	RelatedPosts []PostResponse        `json:"related_posts,omitempty"`
}
