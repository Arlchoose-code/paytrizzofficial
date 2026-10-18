package admin

import (
	"net/http"
	"time"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"

	"github.com/gin-gonic/gin"
)

type DashboardController struct{}

func NewDashboardController() *DashboardController {
	return &DashboardController{}
}

type AdminDashboardResponse struct {
	NewMessages      int64                `json:"new_messages"`
	TotalMessages    int64                `json:"total_messages"`
	NewApplications  int64                `json:"new_applications"`
	PendingApprovals int64                `json:"pending_approvals"`
	ActiveTalents    int64                `json:"active_talents"`
	TotalTalents     int64                `json:"total_talents"`
	EmailsLast24h    AdminDashboardEmails `json:"emails_last_24h"`
	RecentActivity   []AdminActivityItem  `json:"recent_activity"`
	PendingItems     []AdminPendingItem   `json:"pending_items"`
}

type AdminDashboardEmails struct {
	Sent     int64 `json:"sent"`
	Received int64 `json:"received"`
	Bounced  int64 `json:"bounced"`
}

type AdminActivityItem struct {
	ID        uint64    `json:"id"`
	ActorName string    `json:"actor_name"`
	Module    string    `json:"module"`
	Action    string    `json:"action"`
	Summary   string    `json:"summary"`
	CreatedAt time.Time `json:"created_at"`
}

type AdminPendingItem struct {
	Type       string    `json:"type"`
	ID         uint64    `json:"id"`
	Title      string    `json:"title"`
	AuthorName string    `json:"author_name"`
	CreatedAt  time.Time `json:"created_at"`
}

// Dashboard returns consolidated metrics for the admin overview page (PRD 4.12)
func (ctrl *DashboardController) Index(c *gin.Context) {
	since := time.Now().Add(-24 * time.Hour)

	var newMessages, totalMessages, newApplications, pendingPosts, pendingProjects, pendingRevisions int64
	config.DB.Model(&models.ContactMessage{}).Where("status = ?", "new").Count(&newMessages)
	config.DB.Model(&models.ContactMessage{}).Count(&totalMessages)
	config.DB.Model(&models.Application{}).Where("status = ?", "new").Count(&newApplications)
	config.DB.Model(&models.Post{}).Where("status = ?", "pending").Count(&pendingPosts)
	config.DB.Model(&models.Project{}).Where("status = ?", "pending").Count(&pendingProjects)
	config.DB.Model(&models.ContentRevision{}).Where("status = ?", "pending").Count(&pendingRevisions)

	var activeTalents, totalTalents int64
	config.DB.Model(&models.Talent{}).
		Joins("JOIN users ON users.id = talents.user_id AND users.is_active = true").
		Where("talents.is_published = true").Count(&activeTalents)
	config.DB.Model(&models.Talent{}).Count(&totalTalents)

	// Email pipeline 24h from mail logs
	var sent24, received24, bounced24 int64
	config.DB.Model(&models.MailLog{}).Where("event = ? AND created_at >= ?", "sent", since).Count(&sent24)
	config.DB.Model(&models.MailLog{}).Where("event = ? AND created_at >= ?", "received", since).Count(&received24)
	config.DB.Model(&models.MailLog{}).Where("event IN ? AND created_at >= ?", []string{"bounced", "complained", "quarantined_virus"}, since).Count(&bounced24)

	// Recent activity from audit logs
	var audits []models.AuditLog
	config.DB.Preload("ActorUser").Order("id DESC").Limit(8).Find(&audits)
	activity := make([]AdminActivityItem, 0, len(audits))
	for _, a := range audits {
		actorName := "System"
		if a.ActorUser != nil {
			actorName = a.ActorUser.Name
		}
		activity = append(activity, AdminActivityItem{
			ID:        a.ID,
			ActorName: actorName,
			Module:    a.Module,
			Action:    a.Action,
			Summary:   a.Summary,
			CreatedAt: a.CreatedAt,
		})
	}

	// Pending approval queue (top 5 across posts, projects, revisions)
	pending := make([]AdminPendingItem, 0, 5)

	var posts []models.Post
	config.DB.Preload("AuthorTalent").Where("status = ?", "pending").Order("id DESC").Limit(5).Find(&posts)
	for _, p := range posts {
		author := "PayTrizz Team"
		if p.AuthorTalent != nil {
			author = p.AuthorTalent.Name
		}
		pending = append(pending, AdminPendingItem{Type: "post", ID: p.ID, Title: p.Title, AuthorName: author, CreatedAt: p.CreatedAt})
	}

	var projects []models.Project
	config.DB.Where("status = ?", "pending").Order("id DESC").Limit(5).Find(&projects)
	for _, p := range projects {
		author := ""
		var u models.User
		if err := config.DB.First(&u, p.AuthorID).Error; err == nil {
			author = u.Name
		}
		pending = append(pending, AdminPendingItem{Type: "project", ID: p.ID, Title: p.Title, AuthorName: author, CreatedAt: p.CreatedAt})
	}

	var revisions []models.ContentRevision
	config.DB.Preload("Submitter").Where("status = ?", "pending").Order("id DESC").Limit(5).Find(&revisions)
	for _, r := range revisions {
		title := r.EntityType + " #" + itoa(r.EntityID)
		author := ""
		if r.Submitter != nil {
			author = r.Submitter.Name
		}
		pending = append(pending, AdminPendingItem{Type: "revision", ID: r.ID, Title: title, AuthorName: author, CreatedAt: r.CreatedAt})
	}

	// Sort pending by newest first, cap at 5
	for i := 0; i < len(pending); i++ {
		for j := i + 1; j < len(pending); j++ {
			if pending[j].CreatedAt.After(pending[i].CreatedAt) {
				pending[i], pending[j] = pending[j], pending[i]
			}
		}
	}
	if len(pending) > 5 {
		pending = pending[:5]
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get admin dashboard success", AdminDashboardResponse{
		NewMessages:      newMessages,
		TotalMessages:    totalMessages,
		NewApplications:  newApplications,
		PendingApprovals: pendingPosts + pendingProjects + pendingRevisions,
		ActiveTalents:    activeTalents,
		TotalTalents:     totalTalents,
		EmailsLast24h: AdminDashboardEmails{
			Sent:     sent24,
			Received: received24,
			Bounced:  bounced24,
		},
		RecentActivity: activity,
		PendingItems:   pending,
	})
}

func itoa(v uint64) string {
	if v == 0 {
		return "0"
	}
	var buf [20]byte
	i := len(buf)
	for v > 0 {
		i--
		buf[i] = byte('0' + v%10)
		v /= 10
	}
	return string(buf[i:])
}
