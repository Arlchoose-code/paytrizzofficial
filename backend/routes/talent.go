package routes

import (
	"paytrizz-backend/controllers/admin"
	"paytrizz-backend/controllers/talent"
	"paytrizz-backend/middlewares"
	"paytrizz-backend/models"
	"paytrizz-backend/services"

	"github.com/gin-gonic/gin"
)

func RegisterTalentRoutes(
	r *gin.RouterGroup,
	profileCtrl *talent.ProfileController,
	revisionCtrl *talent.RevisionController,
	msgCtrl *talent.MessageController,
	postCtrl *talent.PostController,
	projectCtrl *talent.ProjectController,
	mediaCtrl *admin.MediaController,
	tokenService *services.TokenService,
) {
	talentGroup := r.Group("/talent")
	talentGroup.Use(middlewares.AuthRequired(tokenService))
	talentGroup.Use(middlewares.RequireRole(models.RoleTalent, models.RoleAdmin))
	talentGroup.Use(middlewares.CSRFProtection())
	{
		talentGroup.GET("/profile", profileCtrl.Show)
		talentGroup.PUT("/profile", profileCtrl.Update)

		// Dashboard summary + skill catalog
		talentGroup.GET("/dashboard", talent.Dashboard)
		talentGroup.GET("/skills", talent.SkillsCatalog)

		talentGroup.GET("/revisions", revisionCtrl.Index)
		talentGroup.POST("/revisions", revisionCtrl.Submit)

		// Media Library & Upload for Talent
		talentGroup.GET("/media", mediaCtrl.Index)
		talentGroup.POST("/media", mediaCtrl.Store)

		// Messages
		messages := talentGroup.Group("/messages")
		{
			messages.GET("", msgCtrl.Index)
			messages.GET("/:id", msgCtrl.Show)
			messages.PUT("/:id", msgCtrl.Update)
		}

		// Talent Blog Posts CRUD
		posts := talentGroup.Group("/posts")
		{
			posts.GET("", postCtrl.Index)
			posts.POST("", postCtrl.Store)
			posts.GET("/:id", postCtrl.Show)
			posts.PUT("/:id", postCtrl.Update)
			posts.DELETE("/:id", postCtrl.Destroy)
		}

		// Talent Projects CRUD
		projects := talentGroup.Group("/projects")
		{
			projects.GET("", projectCtrl.Index)
			projects.POST("", projectCtrl.Store)
			projects.GET("/:id", projectCtrl.Show)
			projects.PUT("/:id", projectCtrl.Update)
			projects.DELETE("/:id", projectCtrl.Destroy)
		}
	}
}
