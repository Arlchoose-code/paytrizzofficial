package public

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type TalentController struct{}

func NewTalentController() *TalentController {
	return &TalentController{}
}

// Index lists active/public talents with search and specialty filtering
func (ctrl *TalentController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 12
	}

	specialtyKey := c.Query("specialty")
	availability := c.Query("availability")

	db := config.DB.Model(&models.Talent{}).
		Preload("Badges", func(db *gorm.DB) *gorm.DB {
			return db.Order("badges.sort_order ASC, badges.id ASC")
		}).
		Preload("Specialties", func(db *gorm.DB) *gorm.DB {
			return db.Order("specialties.sort_order ASC, specialties.id ASC")
		}).
		Preload("Skills.Skill").
		Preload("AvatarMedia").
		Joins("JOIN users ON users.id = talents.user_id AND users.is_active = true").
		Where("talents.is_published = true")

	if specialtyKey != "" && specialtyKey != "all" {
		db = db.Joins("JOIN talent_specialties ON talent_specialties.talent_id = talents.id").
			Joins("JOIN specialties ON specialties.id = talent_specialties.specialty_id").
			Where("specialties.key = ?", specialtyKey)
	}

	if availability != "" {
		db = db.Where("talents.availability = ?", availability)
	}

	if query.Search != "" {
		searchTerm := "%" + query.Search + "%"
		db = db.Where("talents.name LIKE ? OR talents.headline LIKE ? OR talents.bio LIKE ?", searchTerm, searchTerm, searchTerm)
	}

	var total int64
	db.Count(&total)

	var talents []models.Talent
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("talents.is_featured DESC, talents.sort_order ASC, talents.id ASC").
		Offset(offset).Limit(query.PerPage).Find(&talents).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve talents")
		return
	}

	var resp []structs.TalentResponse
	for _, t := range talents {
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

		resp = append(resp, structs.TalentResponse{
			ID:              t.ID,
			UserID:          t.UserID,
			Slug:            t.Slug,
			Name:            t.Name,
			Headline:        t.Headline,
			Bio:             t.Bio,
			AvatarMediaID:   t.AvatarMediaID,
			AvatarMedia:     helpers.FormatMediaResponse(t.AvatarMedia),
			Location:        t.Location,
			YearsExperience: t.YearsExperience,
			HourlyRateUSD:   t.HourlyRateUSD,
			Availability:    string(t.Availability),
			IsFeatured:      t.IsFeatured,
			SortOrder:       t.SortOrder,
			Badges:          badgeResps,
			Specialties:     specialtyResps,
			Skills:          skillItems,
			CreatedAt:       t.CreatedAt,
		})
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get talents success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        resp,
	})
}

// Show returns complete talent profile by slug (published talents only)
func (ctrl *TalentController) Show(c *gin.Context) {
	slug := c.Param("slug")

	var t models.Talent
	if err := config.DB.
		Preload("Badges", func(db *gorm.DB) *gorm.DB {
			return db.Order("badges.sort_order ASC, badges.id ASC")
		}).
		Preload("Specialties", func(db *gorm.DB) *gorm.DB {
			return db.Order("specialties.sort_order ASC, specialties.id ASC")
		}).
		Preload("Skills.Skill").
		Preload("Experiences").
		Preload("Educations").
		Preload("Certificates").
		Preload("Links").
		Preload("AvatarMedia").
		Preload("CVMedia").
		Preload("User").
		Where("slug = ?", slug).First(&t).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent profile not found")
		return
	}

	// Unpublished profiles or deactivated accounts stay hidden from public (PRD 4.1)
	if !t.IsPublished || (t.User != nil && !t.User.IsActive) {
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
		IsFeatured:      t.IsFeatured,
		SortOrder:       t.SortOrder,
		Badges:          badgeResps,
		Specialties:     specialtyResps,
		Skills:          skillItems,
		Experiences:     experienceItems,
		Educations:      educationItems,
		Certificates:    certItems,
		Links:           linkItems,
		Projects:        []structs.ProjectResponse{},
		Posts:           []structs.PostResponse{},
		CreatedAt:       t.CreatedAt,
	}

	// CV stays private unless the talent made it public (PRD 4.3)
	if !t.CVIsPublic {
		resp.CVMediaID = nil
		resp.CVMedia = nil
	}

	// Query published projects where talent is squad member or author
	var projects []models.Project
	projQuery := config.DB.Model(&models.Project{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("Tags").
		Preload("TalentLinks.Talent.Badges").
		Preload("TalentLinks.Talent.Specialties").
		Preload("TalentLinks.Talent.AvatarMedia").
		Where("status = ?", "published")

	if t.UserID > 0 {
		projQuery = projQuery.Where("id IN (SELECT project_id FROM project_talents WHERE talent_id = ?) OR created_by = ?", t.ID, t.UserID)
	} else {
		projQuery = projQuery.Where("id IN (SELECT project_id FROM project_talents WHERE talent_id = ?)", t.ID)
	}
	if err := projQuery.Order("is_featured DESC, published_at DESC").Limit(12).Find(&projects).Error; err == nil {
		for _, p := range projects {
			formatted := helpers.FormatProjectResponse(&p)
			// If talent created project but was not linked in project_talents, include talent
			if t.UserID > 0 && p.AuthorID == t.UserID {
				hasSelf := false
				for _, link := range formatted.Talents {
					if link.TalentID == t.ID {
						hasSelf = true
						break
					}
				}
				if !hasSelf {
					tr := helpers.FormatTalentResponse(&t)
					formatted.Talents = append([]structs.ProjectTalentResponse{{
						TalentID:  t.ID,
						RoleLabel: "Lead Specialist",
						SortOrder: 1,
						Talent:    &tr,
					}}, formatted.Talents...)
				}
			}
			resp.Projects = append(resp.Projects, formatted)
		}
	}

	// Query published blog posts written by this talent
	var posts []models.Post
	postQuery := config.DB.Model(&models.Post{}).
		Preload("CoverMedia").
		Preload("Category").
		Preload("Tags").
		Preload("AuthorTalent.Badges").
		Preload("AuthorTalent.Specialties").
		Preload("AuthorTalent.AvatarMedia").
		Where("status = ?", "published")

	if t.UserID > 0 {
		postQuery = postQuery.Where("author_talent_id = ? OR (created_by = ? AND (author_talent_id IS NULL OR author_talent_id = 0))", t.ID, t.UserID)
	} else {
		postQuery = postQuery.Where("author_talent_id = ?", t.ID)
	}
	if err := postQuery.Order("published_at DESC").Limit(12).Find(&posts).Error; err == nil {
		for _, p := range posts {
			formatted := helpers.FormatPostResponse(&p)
			if formatted.AuthorTalent == nil && (p.AuthorTalentID != nil && *p.AuthorTalentID == t.ID || (t.UserID > 0 && p.AuthorID == t.UserID)) {
				tr := helpers.FormatTalentResponse(&t)
				formatted.AuthorTalent = &tr
			}
			resp.Posts = append(resp.Posts, formatted)
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get talent profile success", resp)
}

// Specialties lists all active specialties for filter chips
func (ctrl *TalentController) Specialties(c *gin.Context) {
	var specialties []models.Specialty
	if err := config.DB.Where("is_active = true").Order("sort_order ASC, id ASC").Find(&specialties).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve specialties")
		return
	}

	var resp []structs.SpecialtyResponse
	for _, s := range specialties {
		resp = append(resp, structs.SpecialtyResponse{
			ID:          s.ID,
			Key:         s.Key,
			Name:        s.Name,
			Icon:        s.Icon,
			Description: s.Description,
			SortOrder:   s.SortOrder,
			IsActive:    s.IsActive,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get specialties success", resp)
}

// Badges lists all available badges
func (ctrl *TalentController) Badges(c *gin.Context) {
	var badges []models.Badge
	if err := config.DB.Order("sort_order ASC, id ASC").Find(&badges).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve badges")
		return
	}

	var resp []structs.BadgeResponse
	for _, b := range badges {
		resp = append(resp, structs.BadgeResponse{
			ID:        b.ID,
			Key:       b.Key,
			Label:     b.Label,
			Color:     b.Color,
			Icon:      b.Icon,
			SortOrder: b.SortOrder,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get badges success", resp)
}
