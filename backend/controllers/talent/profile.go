package talent

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type ProfileController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
	slugService       *services.SlugService
}

func NewProfileController(
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
	slugService *services.SlugService,
) *ProfileController {
	return &ProfileController{
		revalidateService: revalidateService,
		auditService:      auditService,
		slugService:       slugService,
	}
}

// Show returns authenticated talent's own profile
func (ctrl *ProfileController) Show(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)

	var t models.Talent
	if err := config.DB.Preload("Badges").
		Preload("Specialties").
		Preload("Skills.Skill").
		Preload("Experiences").
		Preload("Educations").
		Preload("Certificates").
		Preload("Links").
		Preload("AvatarMedia").
		Preload("CVMedia").
		Preload("User").
		Where("user_id = ?", userID).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
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
		name := ""
		if sk.Skill != nil {
			name = sk.Skill.Name
		}
		skillItems = append(skillItems, structs.TalentSkillItem{
			SkillID:     sk.SkillID,
			SkillName:   name,
			Proficiency: sk.Proficiency,
			Years:       sk.Years,
		})
	}

	var experienceItems []structs.TalentExperienceItem
	for _, exp := range t.Experiences {
		var endDateStr *string
		if exp.EndDate != nil {
			str := exp.EndDate.Format("2006-01-02")
			endDateStr = &str
		}
		experienceItems = append(experienceItems, structs.TalentExperienceItem{
			ID:             exp.ID,
			RoleTitle:      exp.RoleTitle,
			Company:        exp.Company,
			EmploymentType: exp.EmploymentType,
			Location:       exp.Location,
			StartDate:      exp.StartDate.Format("2006-01-02"),
			EndDate:        endDateStr,
			IsCurrent:      exp.IsCurrent,
			Description:    exp.Description,
			Skills:         exp.Skills,
			Media:          exp.Media,
			SortOrder:      exp.SortOrder,
		})
	}

	var educationItems []structs.TalentEducationItem
	for _, edu := range t.Educations {
		educationItems = append(educationItems, structs.TalentEducationItem{
			ID:           edu.ID,
			Institution:  edu.Institution,
			Degree:       edu.Degree,
			FieldOfStudy: edu.FieldOfStudy,
			StartYear:    edu.StartYear,
			EndYear:      edu.EndYear,
			Grade:        edu.Grade,
			Activities:   edu.Activities,
			Description:  edu.Description,
			Skills:       edu.Skills,
			Media:        edu.Media,
			SortOrder:    edu.SortOrder,
		})
	}

	var certItems []structs.TalentCertificateItem
	for _, cItem := range t.Certificates {
		var iDate *string
		if cItem.IssueDate != nil {
			s := cItem.IssueDate.Format("2006-01-02")
			iDate = &s
		}
		var expDate *string
		if cItem.ExpirationDate != nil {
			s := cItem.ExpirationDate.Format("2006-01-02")
			expDate = &s
		}
		certItems = append(certItems, structs.TalentCertificateItem{
			ID:             cItem.ID,
			Name:           cItem.Name,
			IssuingOrg:     cItem.IssuingOrg,
			IssueDate:      iDate,
			ExpirationDate: expDate,
			DoesNotExpire:  cItem.DoesNotExpire,
			CredentialID:   cItem.CredentialID,
			CredentialURL:  cItem.CredentialURL,
			Skills:         cItem.Skills,
			MediaURL:       cItem.MediaURL,
			Media:          cItem.Media,
			SortOrder:      cItem.SortOrder,
		})
	}

	var linkItems []structs.TalentLinkItem
	for _, l := range t.Links {
		linkItems = append(linkItems, structs.TalentLinkItem{
			ID:        l.ID,
			Platform:  l.Platform,
			Label:     l.Label,
			URL:       l.URL,
			SortOrder: l.SortOrder,
		})
	}

	resp := structs.TalentResponse{
		ID:              t.ID,
		UserID:          t.UserID,
		Slug:            t.Slug,
		Name:            t.Name,
		Headline:        t.Headline,
		Bio:             t.Bio,
		AvatarMediaID:   t.AvatarMediaID,
		AvatarMedia:     helpers.FormatMediaResponse(t.AvatarMedia),
		CVMediaID:       t.CVMediaID,
		CVMedia:         helpers.FormatMediaResponse(t.CVMedia),
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
		Experiences:     experienceItems,
		Educations:      educationItems,
		Certificates:    certItems,
		Links:           linkItems,
		CreatedAt:       t.CreatedAt,
	}

	if t.User != nil {
		resp.UserEmail = t.User.Email
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get profile success", resp)
}

// Update updates authenticated talent's own profile
func (ctrl *ProfileController) Update(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)

	var req structs.UpdateTalentProfileRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var talent models.Talent
	if err := config.DB.Where("user_id = ?", userID).First(&talent).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	tx := config.DB.Begin()

	talent.Headline = req.Headline
	talent.Bio = req.Bio
	talent.Location = req.Location
	talent.YearsExperience = req.YearsExperience
	talent.HourlyRateUSD = req.HourlyRateUSD
	talent.AvatarMediaID = req.AvatarMediaID
	talent.CVMediaID = req.CVMediaID
	talent.Availability = models.AvailabilityStatus(req.Availability)
	if req.CVIsPublic != nil {
		talent.CVIsPublic = *req.CVIsPublic
	}
	if req.ContactEnabled != nil {
		talent.ContactEnabled = *req.ContactEnabled
	}

	if err := tx.Save(&talent).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update profile")
		return
	}

	// Sync specialties
	tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentSpecialty{})
	for _, sID := range req.SpecialtyIDs {
		tx.Create(&models.TalentSpecialty{TalentID: talent.ID, SpecialtyID: sID})
	}

	// Sync skills — resolve from catalog by ID, or FindOrCreate by name so talent
	// can type new skills without breaking the FK (PRD 4.3)
	tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentSkill{})
	for _, sk := range req.Skills {
		skillID := sk.SkillID
		if skillID == 0 && strings.TrimSpace(sk.SkillName) != "" {
			name := strings.TrimSpace(sk.SkillName)
			var skill models.Skill
			if err := tx.Where("LOWER(name) = ?", strings.ToLower(name)).First(&skill).Error; err != nil {
				slug := ctrl.slugService.GenerateUniqueSlug("skills", name, nil)
				skill = models.Skill{Name: name, Slug: slug, Category: "General"}
				if err := tx.Create(&skill).Error; err != nil {
					continue
				}
			}
			skillID = skill.ID
		}
		if skillID == 0 {
			continue
		}
		tx.Create(&models.TalentSkill{
			TalentID:    talent.ID,
			SkillID:     skillID,
			Proficiency: sk.Proficiency,
			Years:       sk.Years,
		})
	}

	// Sync experiences
	tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentExperience{})
	for idx, exp := range req.Experiences {
		var sDate time.Time
		if t, err := time.Parse("2006-01-02", exp.StartDate); err == nil {
			sDate = t
		}
		var eDate *time.Time
		if exp.EndDate != nil && *exp.EndDate != "" {
			if t, err := time.Parse("2006-01-02", *exp.EndDate); err == nil {
				eDate = &t
			}
		}
		tx.Create(&models.TalentExperience{
			TalentID:       talent.ID,
			RoleTitle:      exp.RoleTitle,
			Company:        exp.Company,
			EmploymentType: exp.EmploymentType,
			Location:       exp.Location,
			StartDate:      sDate,
			EndDate:        eDate,
			IsCurrent:      exp.IsCurrent,
			Description:    exp.Description,
			Skills:         exp.Skills,
			Media:          exp.Media,
			SortOrder:      idx + 1,
		})
	}

	// Sync educations
	tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentEducation{})
	for idx, edu := range req.Educations {
		tx.Create(&models.TalentEducation{
			TalentID:     talent.ID,
			Institution:  edu.Institution,
			Degree:       edu.Degree,
			FieldOfStudy: edu.FieldOfStudy,
			StartYear:    edu.StartYear,
			EndYear:      edu.EndYear,
			Grade:        edu.Grade,
			Activities:   edu.Activities,
			Description:  edu.Description,
			Skills:       edu.Skills,
			Media:        edu.Media,
			SortOrder:    idx + 1,
		})
	}

	// Sync certificates
	tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentCertificate{})
	for idx, cert := range req.Certificates {
		var iDate *time.Time
		if cert.IssueDate != nil && *cert.IssueDate != "" {
			layout := "2006-01-02"
			if len(*cert.IssueDate) == 7 {
				layout = "2006-01"
			}
			if t, err := time.Parse(layout, *cert.IssueDate); err == nil {
				iDate = &t
			}
		}
		var expDate *time.Time
		if !cert.DoesNotExpire && cert.ExpirationDate != nil && *cert.ExpirationDate != "" {
			layout := "2006-01-02"
			if len(*cert.ExpirationDate) == 7 {
				layout = "2006-01"
			}
			if t, err := time.Parse(layout, *cert.ExpirationDate); err == nil {
				expDate = &t
			}
		}
		tx.Create(&models.TalentCertificate{
			TalentID:       talent.ID,
			Name:           cert.Name,
			IssuingOrg:     cert.IssuingOrg,
			IssueDate:      iDate,
			ExpirationDate: expDate,
			DoesNotExpire:  cert.DoesNotExpire,
			CredentialID:   cert.CredentialID,
			CredentialURL:  cert.CredentialURL,
			Skills:         cert.Skills,
			MediaURL:       cert.MediaURL,
			Media:          cert.Media,
			SortOrder:      idx + 1,
		})
	}

	// Sync links
	tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentLink{})
	for idx, l := range req.Links {
		tx.Create(&models.TalentLink{
			TalentID:  talent.ID,
			Platform:  l.Platform,
			Label:     l.Label,
			URL:       l.URL,
			SortOrder: idx + 1,
		})
	}

	tx.Commit()

	pathTalent := "/talents/" + talent.Slug
	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.revalidateService.QueueRevalidateTag("talent-"+talent.Slug, &pathTalent)
	ctrl.auditService.LogContext(c, "talents", "update_profile", "talent", &talent.ID, "Talent updated profile", talent)

	helpers.RespondSuccess(c, http.StatusOK, "Profile updated successfully", talent)
}
