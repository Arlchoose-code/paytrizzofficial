package routes

import (
	"paytrizz-backend/controllers/public"
	"paytrizz-backend/middlewares"
	"paytrizz-backend/services"
	"time"

	"github.com/gin-gonic/gin"
)

func RegisterPublicRoutes(
	r *gin.RouterGroup,
	authCtrl *public.AuthController,
	pageCtrl *public.PageController,
	serviceCtrl *public.ServiceController,
	faqCtrl *public.FAQController,
	menuCtrl *public.MenuItemController,
	socialLinkCtrl *public.SocialLinkController,
	seoCtrl *public.SEOController,
	talentCtrl *public.TalentController,
	projectCtrl *public.ProjectController,
	postCtrl *public.PostController,
	tagCtrl *public.TagController,
	contactCtrl *public.ContactController,
	appCtrl *public.ApplicationController,
	settingCtrl *public.SettingController,
	tokenService *services.TokenService,
) {
	loginLimiter := middlewares.NewRateLimiter(10, time.Minute)
	forgotLimiter := middlewares.NewRateLimiter(5, time.Minute)
	formLimiter := middlewares.NewRateLimiter(15, time.Minute)

	// Auth Group
	authGroup := r.Group("/auth")
	{
		authGroup.POST("/login", loginLimiter.Middleware("login"), authCtrl.Login)
		authGroup.POST("/refresh", authCtrl.Refresh)
		authGroup.POST("/logout", authCtrl.Logout)
		authGroup.POST("/forgot-password", forgotLimiter.Middleware("forgot"), authCtrl.ForgotPassword)
		authGroup.POST("/reset-password", authCtrl.ResetPassword)
		authGroup.POST("/sso/exchange", authCtrl.ExchangeSSOTicket)

		// Protected auth actions
		authProtected := authGroup.Group("")
		authProtected.Use(middlewares.AuthRequired(tokenService))
		{
			authProtected.GET("/me", authCtrl.Me)
			authProtected.POST("/change-password", authCtrl.ChangePassword)
			authProtected.POST("/accept-mail-policy", authCtrl.AcceptMailPolicy)
			authProtected.GET("/sessions", authCtrl.GetSessions)
			authProtected.POST("/sessions/revoke-others", authCtrl.RevokeOtherSessions)
			authProtected.POST("/sso/ticket", authCtrl.CreateSSOTicket)
		}
	}

	// CMS & Site Public Endpoints
	r.GET("/settings", settingCtrl.Index)
	r.GET("/pages/:key", pageCtrl.Show)
	r.GET("/services", serviceCtrl.Index)
	r.GET("/services/:slug", serviceCtrl.Show)
	r.GET("/faqs", faqCtrl.Index)
	r.GET("/menus", menuCtrl.Index)
	r.GET("/socials", socialLinkCtrl.Index)
	r.GET("/seo/:page_key", seoCtrl.Show)

	// Talents Public Endpoints
	r.GET("/talents", talentCtrl.Index)
	r.GET("/talents/:slug", talentCtrl.Show)
	r.GET("/specialties", talentCtrl.Specialties)
	r.GET("/badges", talentCtrl.Badges)

	// Projects Public Endpoints
	r.GET("/projects", projectCtrl.Index)
	r.GET("/projects/:slug", projectCtrl.Show)
	r.GET("/project-categories", projectCtrl.Categories)

	// Blog Posts Public Endpoints
	r.GET("/posts", postCtrl.Index)
	r.GET("/posts/:slug", postCtrl.Show)
	r.GET("/post-categories", postCtrl.Categories)

	// Tags
	r.GET("/tags", tagCtrl.Index)

	// Public Forms (Phase 5)
	r.POST("/contact", formLimiter.Middleware("contact"), contactCtrl.Store)
	r.POST("/applications", formLimiter.Middleware("applications"), appCtrl.Store)
	r.POST("/applications/upload", formLimiter.Middleware("application_upload"), appCtrl.Upload)
}
