package admin

import (
	"bytes"
	"encoding/csv"
	"fmt"
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type MailLogController struct {
	db *gorm.DB
}

func NewMailLogController(db *gorm.DB) *MailLogController {
	return &MailLogController{db: db}
}

// Index lists mail audit logs with filters
func (ctrl *MailLogController) Index(c *gin.Context) {
	page, _ := strconv.Atoi(c.DefaultQuery("page", "1"))
	perPage, _ := strconv.Atoi(c.DefaultQuery("per_page", "30"))
	event := c.Query("event")
	mailbox := c.Query("mailbox")
	search := c.Query("search")

	query := ctrl.db.Model(&models.MailLog{}).Preload("ActorUser")

	if event != "" {
		query = query.Where("event = ?", event)
	}
	if mailbox != "" {
		query = query.Where("mailbox_address LIKE ?", "%"+mailbox+"%")
	}
	if search != "" {
		like := "%" + search + "%"
		query = query.Where("mailbox_address LIKE ? OR ip LIKE ? OR meta LIKE ?", like, like, like)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * perPage
	var logs []models.MailLog
	query.Order("created_at DESC").Offset(offset).Limit(perPage).Find(&logs)

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get mail logs success", structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        logs,
	})
}

// ExportCSV exports mail logs in CSV format
func (ctrl *MailLogController) ExportCSV(c *gin.Context) {
	var logs []models.MailLog
	ctrl.db.Order("created_at DESC").Limit(1000).Find(&logs)

	buf := new(bytes.Buffer)
	writer := csv.NewWriter(buf)

	_ = writer.Write([]string{"ID", "Event", "ActorUserID", "MailboxAddress", "IP", "UserAgent", "CreatedAt"})

	for _, l := range logs {
		actorStr := "-"
		if l.ActorUserID != nil {
			actorStr = strconv.FormatUint(*l.ActorUserID, 10)
		}
		boxStr := "-"
		if l.MailboxAddress != nil {
			boxStr = *l.MailboxAddress
		}
		ipStr := "-"
		if l.IP != nil {
			ipStr = *l.IP
		}
		uaStr := "-"
		if l.UserAgent != nil {
			uaStr = *l.UserAgent
		}

		_ = writer.Write([]string{
			strconv.FormatUint(l.ID, 10),
			string(l.Event),
			actorStr,
			boxStr,
			ipStr,
			uaStr,
			l.CreatedAt.Format(time.RFC3339),
		})
	}

	writer.Flush()

	c.Header("Content-Description", "File Transfer")
	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=mail_logs_%s.csv", time.Now().Format("20060102150405")))
	c.Data(http.StatusOK, "text/csv", buf.Bytes())
}
