package services

import (
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

type MailLogService struct {
	db *gorm.DB
}

func NewMailLogService(db *gorm.DB) *MailLogService {
	return &MailLogService{db: db}
}

func (s *MailLogService) LogEvent(
	event models.MailLogEvent,
	actorUserID *uint64,
	mailboxID *uint64,
	mailboxAddress *string,
	talentUserID *uint64,
	messageID *uint64,
	ip *string,
	userAgent *string,
	meta *string,
) error {
	entry := models.MailLog{
		Event:          event,
		ActorUserID:    actorUserID,
		MailboxID:      mailboxID,
		MailboxAddress: mailboxAddress,
		TalentUserID:   talentUserID,
		MessageID:      messageID,
		IP:             ip,
		UserAgent:      userAgent,
		Meta:           meta,
		CreatedAt:      time.Now(),
	}
	return s.db.Create(&entry).Error
}
