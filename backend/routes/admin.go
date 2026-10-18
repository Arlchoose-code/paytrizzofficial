package routes

import (
	"paytrizz-backend/controllers/admin"
	"paytrizz-backend/middlewares"
	"paytrizz-backend/models"
	"paytrizz-backend/services"

	"github.com/gin-gonic/gin"
)

func RegisterAdminRoutes(
	r *gin.RouterGroup,
	userCtrl *admin.UserController,
	settingCtrl *admin.SiteSettingController,
	mediaCtrl *admin.MediaController,
	auditCtrl *admin.AuditLogController,
	pageCtrl *admin.PageController,
	serviceCtrl *admin.ServiceController,
	faqCtrl *admin.FAQController,
	menuCtrl *admin.MenuItemController,
	socialLinkCtrl *admin.SocialLinkController,
	seoCtrl *admin.SEOSettingController,
	talentCtrl *admin.TalentController,
	projectCtrl *admin.ProjectController,
	postCtrl *admin.PostController,
	categoryCtrl *admin.CategoryController,
	revisionCtrl *admin.RevisionController,
	msgCtrl *admin.MessageController,
	appCtrl *admin.ApplicationController,
	emailTmplCtrl *admin.EmailTemplateController,
	outboxCtrl *admin.EmailOutboxController,
	mailMonitorCtrl *admin.MailMonitorController,
	mailLogCtrl *admin.MailLogController,
	badgeCtrl *admin.BadgeController,
	specialtyCtrl *admin.SpecialtyController,
	skillCtrl *admin.SkillController,
	tagCtrl *admin.TagController,
	mailSettingCtrl *admin.MailSettingController,
	dashboardCtrl *admin.DashboardController,
	tokenService *services.TokenService,
) {
	adminGroup := r.Group("/admin")
	adminGroup.Use(middlewares.AuthRequired(tokenService))
	adminGroup.Use(middlewares.RequireRole(models.RoleAdmin))
	adminGroup.Use(middlewares.CSRFProtection())
	{
		// Consolidated dashboard metrics (PRD 4.12)
		adminGroup.GET("/dashboard", dashboardCtrl.Index)

		// Users CRUD
		users := adminGroup.Group("/users")
		{
			users.GET("", userCtrl.Index)
			users.POST("", userCtrl.Store)
			users.GET("/:id", userCtrl.Show)
			users.PUT("/:id", userCtrl.Update)
			users.DELETE("/:id", userCtrl.Destroy)
		}

		// Site Settings
		settings := adminGroup.Group("/settings")
		{
			settings.GET("", settingCtrl.Index)
			settings.PUT("/bulk", settingCtrl.BulkUpdate)
			settings.PUT("/:key", settingCtrl.Update)
		}

		// Media Library
		media := adminGroup.Group("/media")
		{
			media.GET("", mediaCtrl.Index)
			media.POST("", mediaCtrl.Store)
			media.GET("/:id", mediaCtrl.Show)
			media.PUT("/:id", mediaCtrl.Update)
			media.DELETE("/:id", mediaCtrl.Destroy)
		}

		// CMS Pages
		pages := adminGroup.Group("/pages")
		{
			pages.GET("", pageCtrl.Index)
			pages.GET("/:id", pageCtrl.Show)
			pages.PUT("/:id", pageCtrl.Update)
			pages.PUT("/sections/:section_id", pageCtrl.UpdateSection)
			pages.POST("/:id/reorder-sections", pageCtrl.ReorderSections)
		}

		// Services CRUD
		servicesGroup := adminGroup.Group("/services")
		{
			servicesGroup.GET("", serviceCtrl.Index)
			servicesGroup.POST("", serviceCtrl.Store)
			servicesGroup.GET("/:id", serviceCtrl.Show)
			servicesGroup.PUT("/:id", serviceCtrl.Update)
			servicesGroup.DELETE("/:id", serviceCtrl.Destroy)
		}

		// FAQs CRUD
		faqs := adminGroup.Group("/faqs")
		{
			faqs.GET("", faqCtrl.Index)
			faqs.POST("", faqCtrl.Store)
			faqs.GET("/:id", faqCtrl.Show)
			faqs.PUT("/:id", faqCtrl.Update)
			faqs.DELETE("/:id", faqCtrl.Destroy)
		}

		// Menus CRUD
		menus := adminGroup.Group("/menus")
		{
			menus.GET("", menuCtrl.Index)
			menus.POST("", menuCtrl.Store)
			menus.GET("/:id", menuCtrl.Show)
			menus.PUT("/:id", menuCtrl.Update)
			menus.DELETE("/:id", menuCtrl.Destroy)
		}

		// Social Links CRUD
		socials := adminGroup.Group("/socials")
		{
			socials.GET("", socialLinkCtrl.Index)
			socials.POST("", socialLinkCtrl.Store)
			socials.GET("/:id", socialLinkCtrl.Show)
			socials.PUT("/:id", socialLinkCtrl.Update)
			socials.DELETE("/:id", socialLinkCtrl.Destroy)
		}

		// SEO Settings
		seo := adminGroup.Group("/seo")
		{
			seo.GET("", seoCtrl.Index)
			seo.GET("/:page_key", seoCtrl.Show)
			seo.PUT("/:page_key", seoCtrl.Update)
		}

		// Talents CRUD
		talents := adminGroup.Group("/talents")
		{
			talents.GET("", talentCtrl.Index)
			talents.POST("", talentCtrl.Store)
			talents.GET("/:id", talentCtrl.Show)
			talents.PUT("/:id", talentCtrl.Update)
			talents.DELETE("/:id", talentCtrl.Destroy)
			talents.POST("/:id/reset-password", talentCtrl.ResetPassword)
		}

		// Taxonomy: Badges
		badges := adminGroup.Group("/badges")
		{
			badges.GET("", badgeCtrl.Index)
			badges.POST("", badgeCtrl.Store)
			badges.GET("/:id", badgeCtrl.Show)
			badges.PUT("/:id", badgeCtrl.Update)
			badges.DELETE("/:id", badgeCtrl.Destroy)
		}

		// Taxonomy: Specialties
		specialties := adminGroup.Group("/specialties")
		{
			specialties.GET("", specialtyCtrl.Index)
			specialties.POST("", specialtyCtrl.Store)
			specialties.GET("/:id", specialtyCtrl.Show)
			specialties.PUT("/:id", specialtyCtrl.Update)
			specialties.DELETE("/:id", specialtyCtrl.Destroy)
		}

		// Taxonomy: Skills
		skills := adminGroup.Group("/skills")
		{
			skills.GET("", skillCtrl.Index)
			skills.POST("", skillCtrl.Store)
			skills.GET("/:id", skillCtrl.Show)
			skills.PUT("/:id", skillCtrl.Update)
			skills.DELETE("/:id", skillCtrl.Destroy)
		}

		// Taxonomy: Tags
		tags := adminGroup.Group("/tags")
		{
			tags.GET("", tagCtrl.Index)
			tags.POST("", tagCtrl.Store)
			tags.GET("/:id", tagCtrl.Show)
			tags.PUT("/:id", tagCtrl.Update)
			tags.DELETE("/:id", tagCtrl.Destroy)
		}

		// Projects CRUD
		projects := adminGroup.Group("/projects")
		{
			projects.GET("", projectCtrl.Index)
			projects.POST("", projectCtrl.Store)
			projects.GET("/:id", projectCtrl.Show)
			projects.PUT("/:id", projectCtrl.Update)
			projects.DELETE("/:id", projectCtrl.Destroy)
		}

		// Posts CRUD
		posts := adminGroup.Group("/posts")
		{
			posts.GET("", postCtrl.Index)
			posts.POST("", postCtrl.Store)
			posts.GET("/:id", postCtrl.Show)
			posts.PUT("/:id", postCtrl.Update)
			posts.DELETE("/:id", postCtrl.Destroy)
		}

		// Categories
		adminGroup.GET("/project-categories", categoryCtrl.IndexProjectCategories)
		adminGroup.POST("/project-categories", categoryCtrl.StoreProjectCategory)
		adminGroup.PUT("/project-categories/:id", categoryCtrl.UpdateProjectCategory)
		adminGroup.DELETE("/project-categories/:id", categoryCtrl.DestroyProjectCategory)

		adminGroup.GET("/post-categories", categoryCtrl.IndexPostCategories)
		adminGroup.POST("/post-categories", categoryCtrl.StorePostCategory)
		adminGroup.PUT("/post-categories/:id", categoryCtrl.UpdatePostCategory)
		adminGroup.DELETE("/post-categories/:id", categoryCtrl.DestroyPostCategory)

		// Content Revisions
		revisions := adminGroup.Group("/revisions")
		{
			revisions.GET("", revisionCtrl.Index)
			revisions.GET("/:id", revisionCtrl.Show)
			revisions.POST("/:id/review", revisionCtrl.Review)
		}

		// Contact Messages (Phase 5)
		messages := adminGroup.Group("/messages")
		{
			messages.GET("", msgCtrl.Index)
			messages.GET("/:id", msgCtrl.Show)
			messages.PUT("/:id", msgCtrl.Update)
			messages.DELETE("/:id", msgCtrl.Destroy)
		}

		// Applications (Phase 5)
		applications := adminGroup.Group("/applications")
		{
			applications.GET("", appCtrl.Index)
			applications.GET("/:id", appCtrl.Show)
			applications.PUT("/:id", appCtrl.Update)
			applications.DELETE("/:id", appCtrl.Destroy)
		}

		// Email Templates (Phase 5)
		emailTemplates := adminGroup.Group("/email-templates")
		{
			emailTemplates.GET("", emailTmplCtrl.Index)
			emailTemplates.GET("/:id", emailTmplCtrl.Show)
			emailTemplates.PUT("/:id", emailTmplCtrl.Update)
			emailTemplates.POST("/:id/test", emailTmplCtrl.TestSend)
		}

		// Email Outbox (Phase 5)
		emailOutbox := adminGroup.Group("/email-outbox")
		{
			emailOutbox.GET("", outboxCtrl.Index)
			emailOutbox.GET("/:id", outboxCtrl.Show)
			emailOutbox.POST("/:id/retry", outboxCtrl.Retry)
		}

		// Mail Monitor & Audit Logs (Phase 6 & 8)
		mailMonitor := adminGroup.Group("/mail-monitor")
		{
			mailMonitor.GET("", mailMonitorCtrl.Index)
			mailMonitor.GET("/:id", mailMonitorCtrl.ShowMailbox)
		}

		mailLogs := adminGroup.Group("/mail-logs")
		{
			mailLogs.GET("", mailLogCtrl.Index)
			mailLogs.GET("/export", mailLogCtrl.ExportCSV)
		}

		// Mail Settings: reserved names CRUD (PRD 4.11)
		reservedNames := adminGroup.Group("/reserved-mail-names")
		{
			reservedNames.GET("", mailSettingCtrl.Index)
			reservedNames.POST("", mailSettingCtrl.Store)
			reservedNames.DELETE("/:id", mailSettingCtrl.Destroy)
		}

		// Audit Logs
		adminGroup.GET("/audit-logs", auditCtrl.Index)
	}
}
