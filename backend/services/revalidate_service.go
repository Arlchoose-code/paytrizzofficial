package services

import (
	"log"
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

type RevalidateService struct {
	db *gorm.DB
}

func NewRevalidateService(db *gorm.DB) *RevalidateService {
	return &RevalidateService{db: db}
}

// QueueRevalidateTag queues an ISR tag for background revalidation
func (s *RevalidateService) QueueRevalidateTag(tag string, path *string) {
	job := models.RevalidationJob{
		Tag:           tag,
		Path:          path,
		Status:        models.RevalidationPending,
		Attempts:      0,
		NextAttemptAt: time.Now(),
	}

	go func() {
		if err := s.db.Create(&job).Error; err != nil {
			log.Printf("Failed to enqueue revalidation job for tag %s: %v", tag, err)
		}
	}()
}

// QueueTag enqueues a revalidation tag without a specific path
func (s *RevalidateService) QueueTag(tag string) {
	s.QueueRevalidateTag(tag, nil)
}
