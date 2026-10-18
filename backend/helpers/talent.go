package helpers

import (
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
)

// FormatTalentResponse converts models.Talent to structs.TalentResponse
func FormatTalentResponse(t *models.Talent) structs.TalentResponse {
	if t == nil {
		return structs.TalentResponse{}
	}

	var badgeResps []structs.BadgeResponse
	for _, b := range t.Badges {
		badgeResps = append(badgeResps, structs.BadgeResponse{
			ID:        b.ID,
			Key:       b.Key,
			Label:     b.Label,
			Color:     b.Color,
			Icon:      b.Icon,
			SortOrder: b.SortOrder,
		})
	}

	var specialtyResps []structs.SpecialtyResponse
	for _, s := range t.Specialties {
		specialtyResps = append(specialtyResps, structs.SpecialtyResponse{
			ID:          s.ID,
			Key:         s.Key,
			Name:        s.Name,
			Icon:        s.Icon,
			Description: s.Description,
			SortOrder:   s.SortOrder,
			IsActive:    s.IsActive,
		})
	}

	var skillItems []structs.TalentSkillItem
	for _, sk := range t.Skills {
		skillName := ""
		if sk.Skill != nil {
			skillName = sk.Skill.Name
		}
		skillItems = append(skillItems, structs.TalentSkillItem{
			SkillID:     sk.SkillID,
			SkillName:   skillName,
			Proficiency: sk.Proficiency,
			Years:       sk.Years,
		})
	}

	return structs.TalentResponse{
		ID:              t.ID,
		UserID:          t.UserID,
		Slug:            t.Slug,
		Name:            t.Name,
		Headline:        t.Headline,
		Bio:             t.Bio,
		AvatarMediaID:   t.AvatarMediaID,
		AvatarMedia:     FormatMediaResponse(t.AvatarMedia),
		CVMediaID:       t.CVMediaID,
		CVMedia:         FormatMediaResponse(t.CVMedia),
		Location:        t.Location,
		YearsExperience: t.YearsExperience,
		HourlyRateUSD:   t.HourlyRateUSD,
		Availability:    string(t.Availability),
		CVIsPublic:      t.CVIsPublic,
		ContactEnabled:  t.ContactEnabled,
		IsPublished:     t.IsPublished,
		IsFeatured:      t.IsFeatured,
		SortOrder:       t.SortOrder,
		Badges:          badgeResps,
		Specialties:     specialtyResps,
		Skills:          skillItems,
		CreatedAt:       t.CreatedAt,
	}
}
