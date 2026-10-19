package structs

import "time"

type TalentSkillItem struct {
	SkillID     uint64 `json:"skill_id"`
	SkillName   string `json:"skill_name,omitempty"`
	Proficiency string `json:"proficiency"`
	Years       int    `json:"years"`
}

type TalentExperienceItem struct {
	ID             uint64  `json:"id,omitempty"`
	RoleTitle      string  `json:"role_title"`
	Company        string  `json:"company"`
	EmploymentType string  `json:"employment_type,omitempty"`
	Location       string  `json:"location"`
	StartDate      string  `json:"start_date"` // YYYY-MM-DD
	EndDate        *string `json:"end_date"`   // YYYY-MM-DD or null
	IsCurrent      bool    `json:"is_current"`
	Description    string  `json:"description"`
	Skills         string  `json:"skills,omitempty"`
	Media          string  `json:"media,omitempty"`
	SortOrder      int     `json:"sort_order"`
}

type TalentEducationItem struct {
	ID           uint64 `json:"id,omitempty"`
	Institution  string `json:"institution"`
	Degree       string `json:"degree"`
	FieldOfStudy string `json:"field_of_study"`
	StartYear    int    `json:"start_year"`
	EndYear      *int   `json:"end_year"`
	Grade        string `json:"grade,omitempty"`
	Activities   string `json:"activities,omitempty"`
	Description  string `json:"description,omitempty"`
	Skills       string `json:"skills,omitempty"`
	Media        string `json:"media,omitempty"`
	SortOrder    int    `json:"sort_order"`
}

type TalentCertificateItem struct {
	ID             uint64  `json:"id,omitempty"`
	Name           string  `json:"name"`
	IssuingOrg     string  `json:"issuing_org"`
	IssueDate      *string `json:"issue_date,omitempty"`
	ExpirationDate *string `json:"expiration_date,omitempty"`
	DoesNotExpire  bool    `json:"does_not_expire"`
	CredentialID   string  `json:"credential_id,omitempty"`
	CredentialURL  string  `json:"credential_url,omitempty"`
	Skills         string  `json:"skills,omitempty"`
	MediaURL       string  `json:"media_url,omitempty"`
	Media          string  `json:"media,omitempty"`
	SortOrder      int     `json:"sort_order"`
}

type TalentLinkItem struct {
	ID        uint64 `json:"id,omitempty"`
	Platform  string `json:"platform"`
	Label     string `json:"label"`
	URL       string `json:"url"`
	SortOrder int    `json:"sort_order"`
}

type TalentResponse struct {
	ID              uint64                 `json:"id"`
	UserID          uint64                 `json:"user_id"`
	Slug            string                 `json:"slug"`
	Name            string                 `json:"name"`
	Headline        string                 `json:"headline"`
	Bio             string                 `json:"bio"`
	AvatarMediaID   *uint64                `json:"avatar_media_id"`
	AvatarMedia     *MediaResponse         `json:"avatar_media,omitempty"`
	CVMediaID       *uint64                `json:"cv_media_id,omitempty"`
	CVMedia         *MediaResponse         `json:"cv_media,omitempty"`
	Location        string                 `json:"location"`
	YearsExperience int                    `json:"years_experience"`
	HourlyRateUSD   *float64               `json:"hourly_rate_usd,omitempty"`
	Availability    string                 `json:"availability"`
	CVIsPublic      bool                   `json:"cv_is_public"`
	ContactEnabled  bool                   `json:"contact_enabled"`
	IsPublished     bool                   `json:"is_published"`
	IsFeatured      bool                   `json:"is_featured"`
	SortOrder       int                    `json:"sort_order"`
	UserEmail       string                 `json:"user_email,omitempty"`
	UserIsActive    *bool                  `json:"user_is_active,omitempty"`
	UserLastLoginAt *time.Time             `json:"user_last_login_at,omitempty"`
	Badges          []BadgeResponse        `json:"badges,omitempty"`
	Specialties     []SpecialtyResponse    `json:"specialties,omitempty"`
	Skills          []TalentSkillItem      `json:"skills,omitempty"`
	Experiences     []TalentExperienceItem `json:"experiences,omitempty"`
	Educations      []TalentEducationItem  `json:"educations,omitempty"`
	Certificates    []TalentCertificateItem `json:"certificates,omitempty"`
	Links           []TalentLinkItem       `json:"links,omitempty"`
	Projects        []ProjectResponse      `json:"projects"`
	Posts           []PostResponse         `json:"posts"`
	CreatedAt       time.Time              `json:"created_at"`
}

type CreateTalentRequest struct {
	Name               string   `json:"name" binding:"required,min=2,max=120"`
	Email              string   `json:"email" binding:"required,email"`
	Password           string   `json:"password"`
	ForceChange        *bool    `json:"force_change_password"`
	SendWelcomeEmail   *bool    `json:"send_welcome_email"`
	Headline           string   `json:"headline" binding:"required,min=2,max=190"`
	Bio                string   `json:"bio"`
	Location           string   `json:"location"`
	YearsExperience    int      `json:"years_experience"`
	HourlyRateUSD      *float64 `json:"hourly_rate_usd"`
	Availability       string   `json:"availability" binding:"required,oneof=available limited unavailable"`
	IsPublished        *bool    `json:"is_published"`
	IsFeatured         bool     `json:"is_featured"`
	BadgeIDs           []uint64 `json:"badge_ids"`
	SpecialtyIDs       []uint64 `json:"specialty_ids"`
}

type UpdateTalentProfileRequest struct {
	Headline        string                 `json:"headline" binding:"required,min=2,max=190"`
	Bio             string                 `json:"bio"`
	Location        string                 `json:"location"`
	YearsExperience int                    `json:"years_experience"`
	HourlyRateUSD   *float64               `json:"hourly_rate_usd"`
	AvatarMediaID   *uint64                `json:"avatar_media_id"`
	CVMediaID       *uint64                `json:"cv_media_id"`
	CVIsPublic      *bool                  `json:"cv_is_public"`
	ContactEnabled  *bool                  `json:"contact_enabled"`
	Availability    string                 `json:"availability" binding:"required,oneof=available limited unavailable"`
	SpecialtyIDs    []uint64               `json:"specialty_ids"`
	Skills          []TalentSkillItem      `json:"skills"`
	Experiences     []TalentExperienceItem `json:"experiences"`
	Educations      []TalentEducationItem  `json:"educations"`
	Certificates    []TalentCertificateItem `json:"certificates"`
	Links           []TalentLinkItem       `json:"links"`
}

type AdminUpdateTalentRequest struct {
	Name            string                 `json:"name" binding:"required,min=2,max=120"`
	Headline        string                 `json:"headline" binding:"required,min=2,max=190"`
	Bio             string                 `json:"bio"`
	Location        string                 `json:"location"`
	YearsExperience int                    `json:"years_experience"`
	HourlyRateUSD   *float64               `json:"hourly_rate_usd"`
	AvatarMediaID   *uint64                `json:"avatar_media_id"`
	CVMediaID       *uint64                `json:"cv_media_id"`
	Availability    string                 `json:"availability" binding:"required,oneof=available limited unavailable"`
	IsPublished     *bool                  `json:"is_published"`
	IsFeatured      *bool                  `json:"is_featured"`
	SortOrder       *int                   `json:"sort_order"`
	BadgeIDs        []uint64               `json:"badge_ids"`
	SpecialtyIDs    []uint64               `json:"specialty_ids"`
	Skills          []TalentSkillItem      `json:"skills"`
	Experiences     []TalentExperienceItem `json:"experiences"`
	Educations      []TalentEducationItem  `json:"educations"`
	Certificates    []TalentCertificateItem `json:"certificates"`
	Links           []TalentLinkItem       `json:"links"`
}

type ProfileChecklistItem struct {
	Key   string `json:"key"`
	Label string `json:"label"`
	Done  bool   `json:"done"`
	Href  string `json:"href"`
}

type TalentDashboardProfile struct {
	ID                  uint64                 `json:"id"`
	Name                string                 `json:"name"`
	Slug                string                 `json:"slug"`
	Headline            string                 `json:"headline"`
	Availability        string                 `json:"availability"`
	IsPublished         bool                   `json:"is_published"`
	IsFeatured          bool                   `json:"is_featured"`
	CompletionPercent   int                    `json:"completion_percent"`
	CompletionCompleted int                    `json:"completion_completed"`
	CompletionTotal     int                    `json:"completion_total"`
	Checklist           []ProfileChecklistItem `json:"checklist"`
}

type TalentDashboardMessages struct {
	Total int `json:"total"`
	New   int `json:"new"`
}

type StatusCountResponse struct {
	Status string `json:"status"`
	Count  int64  `json:"count"`
}

type TalentDashboardResponse struct {
	Profile          TalentDashboardProfile  `json:"profile"`
	Messages         TalentDashboardMessages `json:"messages"`
	Posts            []StatusCountResponse   `json:"posts"`
	Projects         []StatusCountResponse   `json:"projects"`
	PendingRevisions int                     `json:"pending_revisions"`
}

type AdminResetTalentPasswordRequest struct {
	SendEmail *bool `json:"send_email"`
}
