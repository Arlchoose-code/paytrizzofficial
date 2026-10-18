package structs

import "time"

type CreateProjectRequest struct {
	Title        string               `json:"title" binding:"required,min=3,max=190"`
	Excerpt      string               `json:"excerpt" binding:"required,max=300"`
	Content      string               `json:"content" binding:"required"`
	CoverMediaID *uint64              `json:"cover_media_id"`
	CategoryID   *uint64              `json:"category_id"`
	ClientName   *string              `json:"client_name"`
	ProjectURL   *string              `json:"project_url"`
	StartedAt    *string              `json:"started_at"`   // format YYYY-MM-DD
	CompletedAt  *string              `json:"completed_at"` // format YYYY-MM-DD
	IsCaseStudy  bool                 `json:"is_case_study"`
	Challenge    *string              `json:"challenge"`
	Solution     *string              `json:"solution"`
	Result       *string              `json:"result"`
	IsFeatured   bool                 `json:"is_featured"`
	Status       string               `json:"status"` // draft, pending, published
	Talents      []ProjectTalentInput `json:"talents"`
	Images       []ProjectImageInput  `json:"images"`
	TagIDs       []uint64             `json:"tag_ids"`
}

type UpdateProjectRequest struct {
	Title        string               `json:"title" binding:"omitempty,min=3,max=190"`
	Excerpt      string               `json:"excerpt" binding:"omitempty,max=300"`
	Content      string               `json:"content"`
	CoverMediaID *uint64              `json:"cover_media_id"`
	CategoryID   *uint64              `json:"category_id"`
	ClientName   *string              `json:"client_name"`
	ProjectURL   *string              `json:"project_url"`
	StartedAt    *string              `json:"started_at"`
	CompletedAt  *string              `json:"completed_at"`
	IsCaseStudy  bool                 `json:"is_case_study"`
	Challenge    *string              `json:"challenge"`
	Solution     *string              `json:"solution"`
	Result       *string              `json:"result"`
	IsFeatured   bool                 `json:"is_featured"`
	Status       string               `json:"status"`
	Talents      []ProjectTalentInput `json:"talents"`
	Images       []ProjectImageInput  `json:"images"`
	TagIDs       []uint64             `json:"tag_ids"`
}

type ProjectResponse struct {
	ID           uint64                  `json:"id"`
	Slug         string                  `json:"slug"`
	Title        string                  `json:"title"`
	Excerpt      string                  `json:"excerpt"`
	Content      string                  `json:"content"`
	CoverMediaID *uint64                 `json:"cover_media_id"`
	CategoryID   *uint64                 `json:"category_id"`
	ClientName   *string                 `json:"client_name"`
	ProjectURL   *string                 `json:"project_url"`
	StartedAt    *time.Time              `json:"started_at"`
	CompletedAt  *time.Time              `json:"completed_at"`
	IsCaseStudy  bool                    `json:"is_case_study"`
	Challenge    *string                 `json:"challenge"`
	Solution     *string                 `json:"solution"`
	Result       *string                 `json:"result"`
	IsFeatured   bool                    `json:"is_featured"`
	Status       string                  `json:"status"`
	CreatedBy    uint64                  `json:"created_by"`
	ReviewedBy   *uint64                 `json:"reviewed_by"`
	ReviewedAt   *time.Time              `json:"reviewed_at"`
	ReviewNote   *string                 `json:"review_note"`
	PublishedAt  *time.Time              `json:"published_at"`
	CreatedAt    time.Time               `json:"created_at"`
	UpdatedAt    time.Time               `json:"updated_at"`

	CoverMedia *MediaResponse           `json:"cover_media,omitempty"`
	Category   *ProjectCategoryResponse `json:"category,omitempty"`
	Author     *UserResponse            `json:"author,omitempty"`
	Reviewer   *UserResponse            `json:"reviewer,omitempty"`
	Talents         []ProjectTalentResponse  `json:"talents,omitempty"`
	Images          []ProjectImageResponse   `json:"images,omitempty"`
	Tags            []TagResponse            `json:"tags,omitempty"`
	RelatedProjects []ProjectResponse        `json:"related_projects,omitempty"`
}
