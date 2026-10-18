package admin

import (
	"crypto/rand"
	"encoding/hex"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

type TalentController struct {
	slugService       *services.SlugService
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
	outboxService     *services.EmailOutboxService
}

func NewTalentController(
	slugService *services.SlugService,
	revalidateService *services.RevalidateService,
	auditService *services.AuditService,
	outboxService *services.EmailOutboxService,
) *TalentController {
	return &TalentController{
		slugService:       slugService,
		revalidateService: revalidateService,
		auditService:      auditService,
		outboxService:     outboxService,
	}
}

// Index lists talents with pagination and search
func (ctrl *TalentController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)
	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 10
	}

	db := config.DB.Model(&models.Talent{}).
		Preload("User").
		Preload("Badges").
		Preload("Specialties").
		Preload("AvatarMedia")

	if query.Search != "" {
		searchTerm := "%" + query.Search + "%"
		db = db.Where("name LIKE ? OR headline LIKE ?", searchTerm, searchTerm)
	}

	var total int64
	db.Count(&total)

	var talents []models.Talent
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&talents).Error; err != nil {
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
			CVIsPublic:      t.CVIsPublic,
			ContactEnabled:  t.ContactEnabled,
			IsPublished:     t.IsPublished,
			IsFeatured:      t.IsFeatured,
			SortOrder:       t.SortOrder,
			Badges:          badgeResps,
			Specialties:     specialtyResps,
			CreatedAt:       t.CreatedAt,
		})
		userActive := true
		userEmail := ""
		var lastLogin *time.Time
		if t.User != nil {
			userActive = t.User.IsActive
			userEmail = t.User.Email
			lastLogin = t.User.LastLoginAt
		}
		resp[len(resp)-1].UserIsActive = &userActive
		resp[len(resp)-1].UserEmail = userEmail
		resp[len(resp)-1].UserLastLoginAt = lastLogin
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

// Store creates a new talent account and profile
func (ctrl *TalentController) Store(c *gin.Context) {
	var req structs.CreateTalentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// Check email uniqueness
	var count int64
	config.DB.Unscoped().Model(&models.User{}).Where("email = ?", cleanEmail).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Email already in use")
		return
	}

	// Generate password: admin-typed or strong random (PRD 4.1)
	tempPassword := strings.TrimSpace(req.Password)
	if tempPassword == "" {
		b := make([]byte, 6)
		_, _ = rand.Read(b)
		tempPassword = hex.EncodeToString(b) + "!A1"
	}

	forceChange := true
	if req.ForceChange != nil {
		forceChange = *req.ForceChange
	}
	sendWelcome := true
	if req.SendWelcomeEmail != nil {
		sendWelcome = *req.SendWelcomeEmail
	}

	passwordHash, err := bcrypt.GenerateFromPassword([]byte(tempPassword), bcrypt.DefaultCost)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	tx := config.DB.Begin()

	// 1. Create User
	user := models.User{
		Role:               models.RoleTalent,
		Name:               req.Name,
		Email:              cleanEmail,
		PasswordHash:       string(passwordHash),
		IsActive:           true,
		MustChangePassword: forceChange,
	}
	if err := tx.Create(&user).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create user account")
		return
	}

	// 2. Generate slug
	slug := ctrl.slugService.GenerateUniqueSlug("talents", req.Name, nil)

	// 3. Create Talent
	isPublished := true
	if req.IsPublished != nil {
		isPublished = *req.IsPublished
	}

	talent := models.Talent{
		UserID:          user.ID,
		Slug:            slug,
		Name:            req.Name,
		Headline:        req.Headline,
		Bio:             req.Bio,
		Location:        req.Location,
		YearsExperience: req.YearsExperience,
		HourlyRateUSD:   req.HourlyRateUSD,
		Availability:    models.AvailabilityStatus(req.Availability),
		IsFeatured:      req.IsFeatured,
		IsPublished:     isPublished,
	}
	if err := tx.Create(&talent).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create talent profile")
		return
	}

	// 4. Attach badges
	for idx, bID := range req.BadgeIDs {
		tx.Create(&models.TalentBadge{
			TalentID:  talent.ID,
			BadgeID:   bID,
			SortOrder: idx + 1,
		})
	}

	// 5. Attach specialties
	for _, sID := range req.SpecialtyIDs {
		tx.Create(&models.TalentSpecialty{
			TalentID:    talent.ID,
			SpecialtyID: sID,
		})
	}

	tx.Commit()

	// Welcome email with initial credentials (PRD 4.1) — password only lives in this email
	if sendWelcome {
		frontendURL := config.AppConfig.FrontendURL
		if frontendURL == "" {
			frontendURL = config.AppConfig.AppURL
		}
		loginURL := frontendURL + "/login"
		changeURL := frontendURL + "/change-password"
		_, _ = ctrl.outboxService.SendTemplated(
			"talent_account_created",
			user.Email,
			&user.Name,
			map[string]string{
				"name":                user.Name,
				"email":               user.Email,
				"login_email":         user.Email,
				"initial_password":    tempPassword,
				"password":            tempPassword,
				"login_url":           loginURL,
				"change_password_url": changeURL,
			},
			nil,
			nil,
			&talent.ID,
		)
	}

	pathTalent := "/talents/" + talent.Slug
	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.revalidateService.QueueRevalidateTag("talent-"+talent.Slug, &pathTalent)
	ctrl.auditService.LogContext(c, "talents", "create", "talent", &talent.ID, "Created talent "+talent.Name, talent)

	helpers.RespondSuccess(c, http.StatusCreated, "Talent created successfully", gin.H{
		"talent":        talent,
		"temp_password": tempPassword,
	})
}

// Show returns a talent by ID
func (ctrl *TalentController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid talent ID")
		return
	}

	var talent models.Talent
	if err := config.DB.Preload("User").
		Preload("Badges").
		Preload("Specialties").
		Preload("Skills.Skill").
		Preload("Experiences").
		Preload("Educations").
		Preload("Links").
		Preload("AvatarMedia").
		Preload("CVMedia").
		Where("id = ?", id).First(&talent).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent not found")
		return
	}

	var badgeResps []structs.BadgeResponse
	for _, b := range talent.Badges {
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
	for _, s := range talent.Specialties {
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
	for _, sk := range talent.Skills {
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
	for _, exp := range talent.Experiences {
		var endDateStr *string
		if exp.EndDate != nil {
			str := exp.EndDate.Format("2006-01-02")
			endDateStr = &str
		}
		experienceItems = append(experienceItems, structs.TalentExperienceItem{
			ID:          exp.ID,
			RoleTitle:   exp.RoleTitle,
			Company:     exp.Company,
			Location:    exp.Location,
			StartDate:   exp.StartDate.Format("2006-01-02"),
			EndDate:     endDateStr,
			IsCurrent:   exp.IsCurrent,
			Description: exp.Description,
			SortOrder:   exp.SortOrder,
		})
	}

	var educationItems []structs.TalentEducationItem
	for _, edu := range talent.Educations {
		educationItems = append(educationItems, structs.TalentEducationItem{
			ID:           edu.ID,
			Institution:  edu.Institution,
			Degree:       edu.Degree,
			FieldOfStudy: edu.FieldOfStudy,
			StartYear:    edu.StartYear,
			EndYear:      edu.EndYear,
			SortOrder:    edu.SortOrder,
		})
	}

	var linkItems []structs.TalentLinkItem
	for _, l := range talent.Links {
		linkItems = append(linkItems, structs.TalentLinkItem{
			ID:        l.ID,
			Platform:  l.Platform,
			Label:     l.Label,
			URL:       l.URL,
			SortOrder: l.SortOrder,
		})
	}

	resp := structs.TalentResponse{
		ID:              talent.ID,
		UserID:          talent.UserID,
		Slug:            talent.Slug,
		Name:            talent.Name,
		Headline:        talent.Headline,
		Bio:             talent.Bio,
		AvatarMediaID:   talent.AvatarMediaID,
		AvatarMedia:     helpers.FormatMediaResponse(talent.AvatarMedia),
		CVMediaID:       talent.CVMediaID,
		CVMedia:         helpers.FormatMediaResponse(talent.CVMedia),
		Location:        talent.Location,
		YearsExperience: talent.YearsExperience,
		HourlyRateUSD:   talent.HourlyRateUSD,
		Availability:    string(talent.Availability),
		IsFeatured:      talent.IsFeatured,
		SortOrder:       talent.SortOrder,
		Badges:          badgeResps,
		Specialties:     specialtyResps,
		Skills:          skillItems,
		Experiences:     experienceItems,
		Educations:      educationItems,
		Links:           linkItems,
		CreatedAt:       talent.CreatedAt,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get talent success", resp)
}

// Update updates talent profile by ID
func (ctrl *TalentController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid talent ID")
		return
	}

	var req structs.AdminUpdateTalentRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var talent models.Talent
	if err := config.DB.Where("id = ?", id).First(&talent).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent not found")
		return
	}

	tx := config.DB.Begin()

	// Partial-update safe: only overwrite what the request actually provides,
	talent.Name = req.Name
	talent.Headline = req.Headline
	talent.Bio = req.Bio
	talent.Location = req.Location
	if req.YearsExperience >= 0 {
		talent.YearsExperience = req.YearsExperience
	}
	if req.HourlyRateUSD != nil {
		talent.HourlyRateUSD = req.HourlyRateUSD
	}
	if req.AvatarMediaID != nil {
		talent.AvatarMediaID = req.AvatarMediaID
	}
	if req.CVMediaID != nil {
		talent.CVMediaID = req.CVMediaID
	}
	talent.Availability = models.AvailabilityStatus(req.Availability)
	if req.IsPublished != nil {
		talent.IsPublished = *req.IsPublished
	}
	if req.IsFeatured != nil {
		talent.IsFeatured = *req.IsFeatured
	}
	if req.SortOrder != nil {
		talent.SortOrder = *req.SortOrder
	}

	if err := tx.Save(&talent).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update talent")
		return
	}
	_ = tx.Model(&models.User{}).Where("id = ?", talent.UserID).Update("name", req.Name).Error

	// Sync badges (only when provided)
	if req.BadgeIDs != nil {
		tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentBadge{})
		for idx, bID := range req.BadgeIDs {
			tx.Create(&models.TalentBadge{TalentID: talent.ID, BadgeID: bID, SortOrder: idx + 1})
		}
	}

	// Sync specialties (only when provided)
	if req.SpecialtyIDs != nil {
		tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentSpecialty{})
		for _, sID := range req.SpecialtyIDs {
			tx.Create(&models.TalentSpecialty{TalentID: talent.ID, SpecialtyID: sID})
		}
	}

	// Sync skills (only when provided)
	if req.Skills != nil {
		tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentSkill{})
		for _, sk := range req.Skills {
			tx.Create(&models.TalentSkill{
				TalentID:    talent.ID,
				SkillID:     sk.SkillID,
				Proficiency: sk.Proficiency,
				Years:       sk.Years,
			})
		}
	}

	// Sync experiences (only when provided)
	if req.Experiences != nil {
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
				TalentID:    talent.ID,
				RoleTitle:   exp.RoleTitle,
				Company:     exp.Company,
				Location:    exp.Location,
				StartDate:   sDate,
				EndDate:     eDate,
				IsCurrent:   exp.IsCurrent,
				Description: exp.Description,
				SortOrder:   idx + 1,
			})
		}
	}

	// Sync educations (only when provided)
	if req.Educations != nil {
		tx.Where("talent_id = ?", talent.ID).Delete(&models.TalentEducation{})
		for idx, edu := range req.Educations {
			tx.Create(&models.TalentEducation{
				TalentID:     talent.ID,
				Institution:  edu.Institution,
				Degree:       edu.Degree,
				FieldOfStudy: edu.FieldOfStudy,
				StartYear:    edu.StartYear,
				EndYear:      edu.EndYear,
				SortOrder:    idx + 1,
			})
		}
	}

	// Sync links (only when provided)
	if req.Links != nil {
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
	}

	tx.Commit()

	pathTalent := "/talents/" + talent.Slug
	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.revalidateService.QueueRevalidateTag("talent-"+talent.Slug, &pathTalent)
	ctrl.auditService.LogContext(c, "talents", "update", "talent", &talent.ID, "Updated talent "+talent.Name, talent)

	helpers.RespondSuccess(c, http.StatusOK, "Talent updated successfully", talent)
}
