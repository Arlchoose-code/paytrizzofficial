package workers

import (
	"bytes"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
	"time"

	"gorm.io/gorm"
)

type RevalidationWorker struct {
	db     *gorm.DB
	client *http.Client
}

func NewRevalidationWorker(db *gorm.DB) *RevalidationWorker {
	return &RevalidationWorker{
		db:     db,
		client: &http.Client{Timeout: 5 * time.Second},
	}
}

func (w *RevalidationWorker) Start() {
	ticker := time.NewTicker(3 * time.Second)
	go func() {
		for range ticker.C {
			w.processPendingJobs()
		}
	}()
}

func (w *RevalidationWorker) processPendingJobs() {
	var jobs []models.RevalidationJob
	now := time.Now()

	err := w.db.Where("status = ? AND next_attempt_at <= ?", models.RevalidationPending, now).
		Limit(10).
		Find(&jobs).Error
	if err != nil || len(jobs) == 0 {
		return
	}

	for _, job := range jobs {
		w.processSingleJob(job)
	}
}

func (w *RevalidationWorker) processSingleJob(job models.RevalidationJob) {
	// Mark processing
	w.db.Model(&job).Update("status", models.RevalidationProcessing)

	payload := structs.NextRevalidatePayload{
		Secret: config.AppConfig.NextjsRevalidateSecret,
		Tag:    job.Tag,
		Path:   job.Path,
	}

	jsonBytes, err := json.Marshal(payload)
	if err != nil {
		w.markFailed(job, err.Error())
		return
	}

	targetURL := fmt.Sprintf("%s/api/revalidate", config.AppConfig.FrontendURL)
	resp, err := w.client.Post(targetURL, "application/json", bytes.NewBuffer(jsonBytes))
	if err != nil {
		w.markFailed(job, err.Error())
		return
	}
	defer resp.Body.Close()

	if resp.StatusCode >= 200 && resp.StatusCode < 300 {
		now := time.Now()
		w.db.Model(&job).Updates(map[string]interface{}{
			"status":       models.RevalidationDone,
			"processed_at": &now,
			"last_error":   nil,
		})
	} else {
		w.markFailed(job, fmt.Sprintf("Next.js returned status: %d", resp.StatusCode))
	}
}

func (w *RevalidationWorker) markFailed(job models.RevalidationJob, errMsg string) {
	newAttempts := job.Attempts + 1
	var newStatus models.RevalidationStatus = models.RevalidationPending
	// Max 5 attempts
	if newAttempts >= 5 {
		newStatus = models.RevalidationFailed
	}

	// Exponential backoff
	backoffSeconds := time.Duration(1<<newAttempts) * time.Second
	nextAttempt := time.Now().Add(backoffSeconds)

	w.db.Model(&job).Updates(map[string]interface{}{
		"status":          newStatus,
		"attempts":        newAttempts,
		"last_error":      errMsg,
		"next_attempt_at": nextAttempt,
	})
	log.Printf("[RevalidateWorker] Tag %s failed (attempt %d): %s", job.Tag, newAttempts, errMsg)
}
