package services

import (
	"encoding/json"
	"log"
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

type AuditService struct {
	db *gorm.DB
}

func NewAuditService(db *gorm.DB) *AuditService {
	return &AuditService{db: db}
}

func (s *AuditService) Log(actorUserID *uint64, module, action, targetType string, targetID *uint64, summary string, meta any, ip, userAgent string) {
	var metaJSON *string
	if meta != nil {
		if b, err := json.Marshal(meta); err == nil {
			str := string(b)
			metaJSON = &str
		}
	}

	entry := models.AuditLog{
		ActorUserID: actorUserID,
		Module:      module,
		Action:      action,
		TargetType:  targetType,
		TargetID:    targetID,
		Summary:     summary,
		Meta:        metaJSON,
		IP:          ip,
		UserAgent:   userAgent,
		CreatedAt:   time.Now(),
	}

	go func() {
		if err := s.db.Create(&entry).Error; err != nil {
			log.Printf("Failed to record audit log: %v", err)
		}
	}()
}

// LogContext automatically extracts actor, IP, and user-agent from gin.Context
func (s *AuditService) LogContext(c any, module, action, targetType string, targetID *uint64, summary string, meta any) {
	var actorID *uint64
	var ip string
	var userAgent string

	if gc, ok := c.(interface {
		Get(string) (any, bool)
		ClientIP() string
	}); ok {
		if val, exists := gc.Get("UserID"); exists {
			if id, ok := val.(uint64); ok {
				actorID = &id
			}
		}
		ip = gc.ClientIP()
	}

	s.Log(actorID, module, action, targetType, targetID, summary, meta, ip, userAgent)
}
