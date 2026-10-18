package talent

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

// Dashboard returns the authenticated talent's summary metrics for the dashboard page
func Dashboard(c *gin.Context) {
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

	// Contact messages scoped to this talent
	var totalMessages, newMessages int64
	config.DB.Model(&models.ContactMessage{}).
		Where("talent_id = ?", t.ID).Count(&totalMessages)
	config.DB.Model(&models.ContactMessage{}).
		Where("talent_id = ? AND status = ?", t.ID, "new").Count(&newMessages)

	// Content status counts
	var postCounts []structs.StatusCountResponse
	config.DB.Model(&models.Post{}).
		Select("status, COUNT(*) as count").
		Where("author_talent_id = ?", t.ID).
		Group("status").Scan(&postCounts)

	var projectCounts []structs.StatusCountResponse
	config.DB.Model(&models.Project{}).
		Select("status, COUNT(*) as count").
		Where("created_by = ?", userID).
		Group("status").Scan(&projectCounts)

	// Pending revisions
	var pendingRevisions int64
	config.DB.Model(&models.ContentRevision{}).
		Where("submitted_by = ? AND status = ?", userID, "pending").Count(&pendingRevisions)

	// Profile completeness checklist (PRD 4.12)
	profileItems := []structs.ProfileChecklistItem{
		{Key: "photo", Label: "Profile photo uploaded", Done: t.AvatarMediaID != nil, Href: "/talent/profile?tab=basic"},
		{Key: "headline", Label: "Professional headline added", Done: t.Headline != "", Href: "/talent/profile?tab=basic"},
		{Key: "bio", Label: "Biography written", Done: t.Bio != "", Href: "/talent/profile?tab=bio"},
		{Key: "location", Label: "Location specified", Done: t.Location != "", Href: "/talent/profile?tab=basic"},
		{Key: "specialties", Label: "Specialties selected", Done: false, Href: "/talent/profile?tab=bio"},
		{Key: "skills", Label: "Skills added", Done: false, Href: "/talent/profile?tab=skills"},
		{Key: "experience", Label: "Work experience added", Done: false, Href: "/talent/experiences"},
		{Key: "education", Label: "Education added", Done: false, Href: "/talent/experiences"},
		{Key: "links", Label: "Portfolio links added", Done: false, Href: "/talent/profile?tab=links"},
		{Key: "cv", Label: "CV resume uploaded", Done: t.CVMediaID != nil, Href: "/talent/profile?tab=basic"},
	}

	var specialtyCount, skillCount, experienceCount, educationCount, linkCount int64
	config.DB.Model(&models.TalentSpecialty{}).Where("talent_id = ?", t.ID).Count(&specialtyCount)
	config.DB.Model(&models.TalentSkill{}).Where("talent_id = ?", t.ID).Count(&skillCount)
	config.DB.Model(&models.TalentExperience{}).Where("talent_id = ?", t.ID).Count(&experienceCount)
	config.DB.Model(&models.TalentEducation{}).Where("talent_id = ?", t.ID).Count(&educationCount)
	config.DB.Model(&models.TalentLink{}).Where("talent_id = ?", t.ID).Count(&linkCount)

	for i := range profileItems {
		switch profileItems[i].Key {
		case "specialties":
			profileItems[i].Done = specialtyCount > 0
		case "skills":
			profileItems[i].Done = skillCount > 0
		case "experience":
			profileItems[i].Done = experienceCount > 0
		case "education":
			profileItems[i].Done = educationCount > 0
		case "links":
			profileItems[i].Done = linkCount > 0
		}
	}

	completed := 0
	for _, item := range profileItems {
		if item.Done {
			completed++
		}
	}
	percentage := 0
	if len(profileItems) > 0 {
		percentage = (completed * 100) / len(profileItems)
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get talent dashboard success", structs.TalentDashboardResponse{
		Profile: structs.TalentDashboardProfile{
			ID:                  t.ID,
			Name:                t.Name,
			Slug:                t.Slug,
			Headline:            t.Headline,
			Availability:        string(t.Availability),
			IsPublished:         t.IsPublished,
			IsFeatured:          t.IsFeatured,
			CompletionPercent:   percentage,
			CompletionCompleted: completed,
			CompletionTotal:     len(profileItems),
			Checklist:           profileItems,
		},
		Messages: structs.TalentDashboardMessages{
			Total: int(totalMessages),
			New:   int(newMessages),
		},
		Posts:    postCounts,
		Projects: projectCounts,
		PendingRevisions: int(pendingRevisions),
	})
}
