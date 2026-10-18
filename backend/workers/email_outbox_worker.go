package workers

import (
	"fmt"
	"log"
	"os"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"time"

	"gorm.io/gorm"
)

type EmailOutboxWorker struct {
	db            *gorm.DB
	outboxService *services.EmailOutboxService
	sesClient     *services.SESClientService
	stopChan      chan struct{}
}

func NewEmailOutboxWorker(db *gorm.DB, outboxService *services.EmailOutboxService, sesClient *services.SESClientService) *EmailOutboxWorker {
	return &EmailOutboxWorker{
		db:            db,
		outboxService: outboxService,
		sesClient:     sesClient,
		stopChan:      make(chan struct{}),
	}
}

func (w *EmailOutboxWorker) Start() {
	ticker := time.NewTicker(5 * time.Second)
	go func() {
		for {
			select {
			case <-ticker.C:
				w.processOutboxBatch()
			case <-w.stopChan:
				ticker.Stop()
				return
			}
		}
	}()
	log.Println("[Worker] Email outbox worker started (polling every 5s)")
}

func (w *EmailOutboxWorker) Stop() {
	close(w.stopChan)
}

func (w *EmailOutboxWorker) processOutboxBatch() {
	var items []models.EmailOutbox

	// Fetch up to 10 pending or retrying emails due for delivery
	err := w.db.Where("status IN ? AND next_attempt_at <= ? AND attempts < 5", []string{"pending", "failed"}, time.Now()).
		Order("created_at ASC").
		Limit(10).
		Find(&items).Error

	if err != nil || len(items) == 0 {
		return
	}

	for _, item := range items {
		// Mark as sending
		item.Status = "sending"
		w.db.Save(&item)

		now := time.Now()
		var sesMsgID string

		if w.sesClient != nil {
			fromEmail := os.Getenv("SYSTEM_FROM_ADDRESS")
			if fromEmail == "" {
				fromEmail = "noreply@paytrizz.com"
			}
			msgID, err := w.sesClient.SendEmail(fromEmail, []string{item.ToEmail}, nil, nil, item.Subject, item.BodyText, &item.BodyHTML)
			if err != nil {
				errMsg := err.Error()
				log.Printf("[EmailOutboxWorker] Failed to dispatch via SES: %v", err)
				item.Status = "failed"
				item.Attempts++
				item.LastError = &errMsg
				w.db.Save(&item)
				continue
			}
			sesMsgID = *msgID
		} else {
			sesMsgID = fmt.Sprintf("SES-SIM-%d-%d", now.Unix(), item.ID)
		}

		item.Status = "sent"
		item.SentAt = &now
		item.SESMessageID = &sesMsgID
		item.Attempts++
		item.LastError = nil

		if err := w.db.Save(&item).Error; err != nil {
			log.Printf("[EmailOutboxWorker] Error updating email outbox ID %d: %v", item.ID, err)
			continue
		}

		// Mask initial password snapshot if this was a welcome credential email
		if err := w.outboxService.MaskInitialPassword(item.ID); err != nil {
			log.Printf("[EmailOutboxWorker] Error masking password for email ID %d: %v", item.ID, err)
		}

		log.Printf("[EmailOutboxWorker] Successfully dispatched email [ID: %d] to %s (Subject: %s)", item.ID, item.ToEmail, item.Subject)
	}
}
