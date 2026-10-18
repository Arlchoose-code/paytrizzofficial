package main

import (
	"fmt"
	"log"
	"net/http"
	"os"
	"paytrizz-backend/config"
	"paytrizz-backend/controllers/admin"
	"paytrizz-backend/controllers/mail"
	"paytrizz-backend/controllers/public"
	"paytrizz-backend/controllers/talent"
	"paytrizz-backend/database"
	"paytrizz-backend/middlewares"
	"paytrizz-backend/routes"
	"paytrizz-backend/services"
	"paytrizz-backend/workers"

	"github.com/gin-gonic/gin"
)

func main() {
	// 1. Load config
	cfg := config.LoadConfig()

	// Set Gin mode
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	} else {
		gin.SetMode(gin.DebugMode)
	}

	// 2. Connect to MySQL Database
	db := config.ConnectDatabase()

	// 3. Auto Migration
	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("Auto migration failed: %v", err)
	}

	// 4. Run Seeders
	if err := database.RunSeeders(db); err != nil {
		log.Fatalf("Database seeding failed: %v", err)
	}

	// 5. Initialize directories
	_ = os.MkdirAll("storage/media", 0755)
	_ = os.MkdirAll("storage/private/mail/attachments", 0700)

	// 6. Initialize Services
	tokenService := services.NewTokenService(db)
	turnstileService := services.NewTurnstileService()
	auditService := services.NewAuditService(db)
	authService := services.NewAuthService(db, tokenService, auditService)
	imageProcessor := services.NewImageProcessor()
	uploadService := services.NewUploadService(db, imageProcessor)
	revalidateService := services.NewRevalidateService(db)
	slugService := services.NewSlugService(db)
	revisionService := services.NewRevisionService(revalidateService, slugService)
	ticketService := services.NewTicketService(db)
	outboxService := services.NewEmailOutboxService(db)
	sesClientService := services.NewSESClientService()

	// 7. Start Background Workers
	revalWorker := workers.NewRevalidationWorker(db)
	revalWorker.Start()
	outboxWorker := workers.NewEmailOutboxWorker(db, outboxService, sesClientService)
	outboxWorker.Start()

	// 8. Initialize Public Controllers
	authCtrl := public.NewAuthController(authService, tokenService, turnstileService, outboxService)
	pubPageCtrl := public.NewPageController()
	pubServiceCtrl := public.NewServiceController()
	pubFAQCtrl := public.NewFAQController()
	pubMenuCtrl := public.NewMenuItemController()
	pubSocialLinkCtrl := public.NewSocialLinkController()
	pubSEOCtrl := public.NewSEOController()
	pubTalentCtrl := public.NewTalentController()
	pubProjectCtrl := public.NewProjectController(db)
	pubPostCtrl := public.NewPostController(db)
	pubTagCtrl := public.NewTagController(db)
	pubContactCtrl := public.NewContactController(db, ticketService, outboxService)
	pubAppCtrl := public.NewApplicationController(db, ticketService, outboxService, uploadService)
	pubSettingCtrl := public.NewSettingController()
	sitemapCtrl := public.NewSitemapController()
	robotsCtrl := public.NewRobotsController()

	// 9. Initialize Admin Controllers
	userCtrl := admin.NewUserController(authService, auditService)
	settingCtrl := admin.NewSiteSettingController(revalidateService, auditService)
	mediaCtrl := admin.NewMediaController(uploadService, auditService)
	auditCtrl := admin.NewAuditLogController()
	adminPageCtrl := admin.NewPageController(revalidateService, auditService)
	adminServiceCtrl := admin.NewServiceController(slugService, revalidateService, auditService)
	adminFAQCtrl := admin.NewFAQController(revalidateService, auditService)
	adminMenuCtrl := admin.NewMenuItemController(revalidateService, auditService)
	adminSocialLinkCtrl := admin.NewSocialLinkController(revalidateService, auditService)
	adminSEOCtrl := admin.NewSEOSettingController(revalidateService, auditService)
	adminTalentCtrl := admin.NewTalentController(slugService, revalidateService, auditService, outboxService)
	adminProjectCtrl := admin.NewProjectController(slugService, revalidateService, auditService, outboxService)
	adminPostCtrl := admin.NewPostController(slugService, revalidateService, auditService, outboxService)
	adminCategoryCtrl := admin.NewCategoryController(slugService, auditService)
	adminRevisionCtrl := admin.NewRevisionController(revisionService, auditService)
	adminMsgCtrl := admin.NewMessageController(db, auditService)
	adminAppCtrl := admin.NewApplicationController(db, outboxService, auditService)
	adminEmailTmplCtrl := admin.NewEmailTemplateController(db, outboxService, auditService)
	adminEmailOutboxCtrl := admin.NewEmailOutboxController(db, auditService)
	adminBadgeCtrl := admin.NewBadgeController(revalidateService, auditService)
	adminSpecialtyCtrl := admin.NewSpecialtyController(revalidateService, auditService)
	adminSkillCtrl := admin.NewSkillController(revalidateService, auditService)
	adminTagCtrl := admin.NewTagController(revalidateService, auditService)
	adminMailSettingCtrl := admin.NewMailSettingController(auditService)
	adminDashboardCtrl := admin.NewDashboardController()

	// 10. Initialize Webmail Services & Workers (Phase 6 & 7)
	mailLogService := services.NewMailLogService(db)
	mailboxService := services.NewMailboxService(db, mailLogService)
	sseHub := services.GlobalSSEHub
	mailService := services.NewMailService(db, sseHub, mailLogService)
	mailService.BackfillThreads()
	outboundService := services.NewMailOutboundService(db, mailService, sseHub, mailLogService)

	mailQueueWorker := workers.NewMailQueueWorker(db, sseHub, sesClientService)
	mailQueueWorker.Start()

	adminMailMonitorCtrl := admin.NewMailMonitorController(db, mailLogService)
	adminMailLogCtrl := admin.NewMailLogController(db)
	mailBoxCtrl := mail.NewMailboxController(mailboxService)
	mailMsgCtrl := mail.NewMessageController(mailService, mailboxService, outboundService, sseHub)
	mailLabelCtrl := mail.NewLabelController(db, mailboxService)
	mailSubscriptionCtrl := mail.NewSubscriptionController(db, mailboxService)
	mailAttachmentCtrl := mail.NewAttachmentController(db, mailboxService)
	sesHookCtrl := public.NewSESHookController(db, sesClientService, sseHub)

	// 11. Initialize Talent Controllers
	talentProfileCtrl := talent.NewProfileController(revalidateService, auditService, slugService)
	talentRevisionCtrl := talent.NewRevisionController(revisionService)
	talentMsgCtrl := talent.NewMessageController(db)
	talentPostCtrl := talent.NewPostController(slugService, revalidateService, auditService, revisionService, outboxService)
	talentProjectCtrl := talent.NewProjectController(slugService, revalidateService, auditService, revisionService, outboxService)

	// 12. Setup Gin Router
	r := gin.New()
	r.Use(gin.Logger())
	r.Use(gin.Recovery())
	r.Use(middlewares.RequestID())
	r.Use(middlewares.SecurityHeaders())
	r.Use(middlewares.CORS())

	// 13. Static file serving with security headers
	r.Static("/storage/media", "./storage/media")

	// 14. Root SEO endpoints
	r.GET("/sitemap.xml", sitemapCtrl.Index)
	r.GET("/robots.txt", robotsCtrl.Index)

	// 15. AWS SES Webhooks (direct call, exception to proxy per PRD 5.1)
	hooksGroup := r.Group("/hooks/ses")
	{
		hooksGroup.POST("/inbound", sesHookCtrl.Inbound)
		hooksGroup.POST("/events", sesHookCtrl.Events)
	}

	// 16. API Routes
	apiGroup := r.Group("/api")
	{
		apiGroup.GET("/health", func(c *gin.Context) {
			routes.RespondSuccess(c, http.StatusOK, "PayTrizz API is running smoothly", gin.H{
				"app":     cfg.AppName,
				"env":     cfg.AppEnv,
				"version": "1.0.0",
			})
		})

		routes.RegisterPublicRoutes(
			apiGroup,
			authCtrl,
			pubPageCtrl,
			pubServiceCtrl,
			pubFAQCtrl,
			pubMenuCtrl,
			pubSocialLinkCtrl,
			pubSEOCtrl,
			pubTalentCtrl,
			pubProjectCtrl,
			pubPostCtrl,
			pubTagCtrl,
			pubContactCtrl,
			pubAppCtrl,
			pubSettingCtrl,
			tokenService,
		)

		routes.RegisterAdminRoutes(
			apiGroup,
			userCtrl,
			settingCtrl,
			mediaCtrl,
			auditCtrl,
			adminPageCtrl,
			adminServiceCtrl,
			adminFAQCtrl,
			adminMenuCtrl,
			adminSocialLinkCtrl,
			adminSEOCtrl,
			adminTalentCtrl,
			adminProjectCtrl,
			adminPostCtrl,
			adminCategoryCtrl,
			adminRevisionCtrl,
			adminMsgCtrl,
			adminAppCtrl,
			adminEmailTmplCtrl,
			adminEmailOutboxCtrl,
			adminMailMonitorCtrl,
			adminMailLogCtrl,
			adminBadgeCtrl,
			adminSpecialtyCtrl,
			adminSkillCtrl,
			adminTagCtrl,
			adminMailSettingCtrl,
			adminDashboardCtrl,
			tokenService,
		)

		routes.RegisterTalentRoutes(
			apiGroup,
			talentProfileCtrl,
			talentRevisionCtrl,
			talentMsgCtrl,
			talentPostCtrl,
			talentProjectCtrl,
			mediaCtrl,
			tokenService,
		)

		routes.RegisterMailRoutes(
			apiGroup,
			mailBoxCtrl,
			mailMsgCtrl,
			mailLabelCtrl,
			mailSubscriptionCtrl,
			mailAttachmentCtrl,
			tokenService,
		)
	}

	// 15. Start Server
	addr := fmt.Sprintf(":%s", cfg.AppPort)
	log.Printf("PayTrizz backend running on %s%s", cfg.AppURL, addr)
	if err := r.Run(addr); err != nil {
		log.Fatalf("Failed to run Gin server: %v", err)
	}
}
