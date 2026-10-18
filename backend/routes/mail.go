package routes

import (
	"paytrizz-backend/controllers/mail"
	"paytrizz-backend/middlewares"
	"paytrizz-backend/services"

	"github.com/gin-gonic/gin"
)

func RegisterMailRoutes(
	r *gin.RouterGroup,
	mailboxCtrl *mail.MailboxController,
	msgCtrl *mail.MessageController,
	labelCtrl *mail.LabelController,
	subCtrl *mail.SubscriptionController,
	attachmentCtrl *mail.AttachmentController,
	tokenService *services.TokenService,
) {
	mailGroup := r.Group("/mail")
	mailGroup.Use(middlewares.AuthRequired(tokenService))
	{
		// Attachments
		mailGroup.POST("/attachments", attachmentCtrl.Upload)
		mailGroup.GET("/attachments/:id/download", attachmentCtrl.Download)
		mailGroup.DELETE("/attachments/:id", attachmentCtrl.Destroy)
		// Mailboxes
		mailGroup.GET("/mailboxes", mailboxCtrl.Index)
		mailGroup.POST("/mailboxes", mailboxCtrl.Store)
		mailGroup.DELETE("/mailboxes/:id", mailboxCtrl.Destroy)

		// Labels (PRD 4.10: Manage Labels + assign to messages)
		mailGroup.GET("/labels", labelCtrl.Index)
		mailGroup.POST("/labels", labelCtrl.Store)
		mailGroup.PUT("/labels/:id", labelCtrl.Update)
		mailGroup.DELETE("/labels/:id", labelCtrl.Destroy)
		mailGroup.PUT("/messages/:id/labels", labelCtrl.Assign)

		// Subscriptions (PRD 4.10 & 5.6: Manage Subscriptions)
		mailGroup.GET("/subscriptions", subCtrl.Index)
		mailGroup.POST("/subscriptions/:id/unsubscribe", subCtrl.Unsubscribe)
		mailGroup.POST("/subscriptions/:id/block", subCtrl.Block)

		// Messages & Folders
		mailGroup.GET("/messages", msgCtrl.Index)
		mailGroup.GET("/counts", msgCtrl.Counts)
		mailGroup.GET("/messages/:id", msgCtrl.Show)
		mailGroup.GET("/messages/:id/thread", msgCtrl.Thread)
		mailGroup.POST("/messages", msgCtrl.Compose)
		mailGroup.PUT("/messages/:id", msgCtrl.UpdateDraft)
		mailGroup.DELETE("/messages/:id", msgCtrl.Destroy)
		mailGroup.POST("/messages/:id/undo", msgCtrl.UndoSend)
		mailGroup.PUT("/messages/:id/move", msgCtrl.Move)
		mailGroup.PUT("/messages/:id/star", msgCtrl.Star)
		mailGroup.PUT("/messages/:id/read", msgCtrl.Read)
		mailGroup.PUT("/messages/:id/snooze", msgCtrl.Snooze)

		// Realtime SSE
		mailGroup.GET("/stream", msgCtrl.Stream)
	}
}
