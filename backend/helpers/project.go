package helpers

import (
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
)

func FormatProjectResponse(p *models.Project) structs.ProjectResponse {
	resp := structs.ProjectResponse{
		ID:           p.ID,
		Slug:         p.Slug,
		Title:        p.Title,
		Excerpt:      p.Excerpt,
		Content:      p.Content,
		CoverMediaID: p.CoverMediaID,
		CategoryID:   p.CategoryID,
		ClientName:   p.ClientName,
		ProjectURL:   p.ProjectURL,
		StartedAt:    p.StartedAt,
		CompletedAt:  p.CompletedAt,
		IsCaseStudy:  p.IsCaseStudy,
		Challenge:    p.Challenge,
		Solution:     p.Solution,
		Result:       p.Result,
		IsFeatured:   p.IsFeatured,
		Status:       p.Status,
		CreatedBy:    p.AuthorID,
		ReviewedBy:   p.ReviewerID,
		ReviewedAt:   p.ReviewedAt,
		ReviewNote:   p.ReviewNote,
		PublishedAt:  p.PublishedAt,
		CreatedAt:    p.CreatedAt,
		UpdatedAt:    p.UpdatedAt,
		CoverMedia:   FormatMediaResponse(p.CoverMedia),
	}

	if p.Category != nil {
		resp.Category = &structs.ProjectCategoryResponse{
			ID:        p.Category.ID,
			Name:      p.Category.Name,
			Slug:      p.Category.Slug,
			SortOrder: p.Category.SortOrder,
			CreatedAt: p.Category.CreatedAt,
			UpdatedAt: p.Category.UpdatedAt,
		}
	}

	if p.Author != nil {
		resp.Author = &structs.UserResponse{
			ID:        p.Author.ID,
			Name:      p.Author.Name,
			Email:     p.Author.Email,
			Role:      string(p.Author.Role),
			IsActive:  p.Author.IsActive,
			CreatedAt: p.Author.CreatedAt,
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

	for _, pt := range p.TalentLinks {
		var talentResp *structs.TalentResponse
		if pt.Talent != nil {
			tr := FormatTalentResponse(pt.Talent)
			talentResp = &tr
		}
		resp.Talents = append(resp.Talents, structs.ProjectTalentResponse{
			TalentID:  pt.TalentID,
			RoleLabel: pt.RoleLabel,
			SortOrder: pt.SortOrder,
			Talent:    talentResp,
		})
	}

	for _, img := range p.Images {
		resp.Images = append(resp.Images, structs.ProjectImageResponse{
			ID:        img.ID,
			ProjectID: img.ProjectID,
			MediaID:   img.MediaID,
			Caption:   img.Caption,
			SortOrder: img.SortOrder,
			Media:     FormatMediaResponse(img.Media),
		})
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
