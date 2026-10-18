package helpers

import (
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
)

func FormatPostResponse(p *models.Post) structs.PostResponse {
	resp := structs.PostResponse{
		ID:             p.ID,
		Slug:           p.Slug,
		Title:          p.Title,
		Excerpt:        p.Excerpt,
		Content:        p.Content,
		CoverMediaID:   p.CoverMediaID,
		CategoryID:     p.CategoryID,
		AuthorTalentID: p.AuthorTalentID,
		ReadingMinutes: p.ReadingMinutes,
		Status:         p.Status,
		CreatedBy:      p.AuthorID,
		ReviewedBy:     p.ReviewerID,
		ReviewedAt:     p.ReviewedAt,
		ReviewNote:     p.ReviewNote,
		PublishedAt:    p.PublishedAt,
		CreatedAt:      p.CreatedAt,
		UpdatedAt:      p.UpdatedAt,
		CoverMedia:     FormatMediaResponse(p.CoverMedia),
	}

	if p.Category != nil {
		resp.Category = &structs.PostCategoryResponse{
			ID:        p.Category.ID,
			Name:      p.Category.Name,
			Slug:      p.Category.Slug,
			SortOrder: p.Category.SortOrder,
			CreatedAt: p.Category.CreatedAt,
			UpdatedAt: p.Category.UpdatedAt,
		}
	}

	if p.AuthorTalent != nil {
		tr := FormatTalentResponse(p.AuthorTalent)
		resp.AuthorTalent = &tr
	}

	if p.AuthorUser != nil {
		resp.AuthorUser = &structs.UserResponse{
			ID:        p.AuthorUser.ID,
			Name:      p.AuthorUser.Name,
			Email:     p.AuthorUser.Email,
			Role:      string(p.AuthorUser.Role),
			IsActive:  p.AuthorUser.IsActive,
			CreatedAt: p.AuthorUser.CreatedAt,
		}
	}

	if p.Reviewer != nil {
		resp.Reviewer = &structs.UserResponse{
			ID:        p.Reviewer.ID,
			Name:      p.Reviewer.Name,
			Email:     p.Reviewer.Email,
			Role:      string(p.Reviewer.Role),
			IsActive:  p.Reviewer.IsActive,
			CreatedAt: p.Reviewer.CreatedAt,
		}
	}

	for _, t := range p.Tags {
		resp.Tags = append(resp.Tags, structs.TagResponse{
			ID:        t.ID,
			Name:      t.Name,
			Slug:      t.Slug,
			CreatedAt: t.CreatedAt,
			UpdatedAt: t.UpdatedAt,
		})
	}

	return resp
}
