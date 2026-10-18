package services

import (
	"encoding/json"
	"errors"
	"fmt"
	"time"

	"paytrizz-backend/config"
	"paytrizz-backend/models"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type RevisionService struct {
	revalidateService *RevalidateService
	slugService       *SlugService
}

func NewRevisionService(revalidateService *RevalidateService, slugService *SlugService) *RevisionService {
	return &RevisionService{
		revalidateService: revalidateService,
		slugService:       slugService,
	}
}

// SubmitRevision creates a pending content revision ensuring max 1 pending per entity
func (s *RevisionService) SubmitRevision(
	entityType string,
	entityID uint64,
	submittedBy uint64,
	payload map[string]interface{},
) (*models.ContentRevision, error) {
	payloadBytes, err := json.Marshal(payload)
	if err != nil {
		return nil, fmt.Errorf("failed to encode revision payload: %w", err)
	}

	var rev models.ContentRevision

	err = config.DB.Transaction(func(tx *gorm.DB) error {
		var existingPending models.ContentRevision
		if err := tx.Where("entity_type = ? AND entity_id = ? AND status = ?", entityType, entityID, "pending").
			First(&existingPending).Error; err == nil {
			return errors.New("a revision is already pending review for this content")
		}

		rev = models.ContentRevision{
			EntityType:  entityType,
			EntityID:    entityID,
			SubmitterID: submittedBy,
			Payload:     datatypes.JSON(payloadBytes),
			Status:      "pending",
		}

		return tx.Create(&rev).Error
	})

	if err != nil {
		return nil, err
	}

	return &rev, nil
}

// ReviewRevision approves or rejects a revision and applies payload if approved
func (s *RevisionService) ReviewRevision(
	revisionID uint64,
	reviewerID uint64,
	approve bool,
	reviewNote *string,
) (*models.ContentRevision, error) {
	var rev models.ContentRevision
	now := time.Now()

	err := config.DB.Transaction(func(tx *gorm.DB) error {
		if err := tx.Where("id = ?", revisionID).First(&rev).Error; err != nil {
			return errors.New("revision not found")
		}

		if rev.Status != "pending" {
			return fmt.Errorf("cannot review revision with status %s", rev.Status)
		}

		rev.ReviewerID = &reviewerID
		rev.ReviewNote = reviewNote
		rev.ReviewedAt = &now

		if !approve {
			rev.Status = "rejected"
			return tx.Save(&rev).Error
		}

		// Approved - apply payload
		rev.Status = "approved"
		if err := tx.Save(&rev).Error; err != nil {
			return err
		}

		// Supersede older revisions if any
		tx.Model(&models.ContentRevision{}).
			Where("entity_type = ? AND entity_id = ? AND status = ? AND id != ?", rev.EntityType, rev.EntityID, "pending", rev.ID).
			Update("status", "superseded")

		var payload map[string]interface{}
		if err := json.Unmarshal(rev.Payload, &payload); err != nil {
			return err
		}

		if rev.EntityType == "project" {
			var project models.Project
			if err := tx.First(&project, rev.EntityID).Error; err != nil {
				return err
			}

			if title, ok := payload["title"].(string); ok && title != "" {
				project.Title = title
			}
			if excerpt, ok := payload["excerpt"].(string); ok && excerpt != "" {
				project.Excerpt = excerpt
			}
			if content, ok := payload["content"].(string); ok && content != "" {
				project.Content = content
			}
			if chal, ok := payload["challenge"].(string); ok {
				project.Challenge = &chal
			}
			if sol, ok := payload["solution"].(string); ok {
				project.Solution = &sol
			}
			if res, ok := payload["result"].(string); ok {
				project.Result = &res
			}
			if status, ok := payload["status"].(string); ok && status != "" {
				project.Status = status
			}

			project.ReviewerID = &reviewerID
			project.ReviewedAt = &now
			project.ReviewNote = reviewNote

			if err := tx.Save(&project).Error; err != nil {
				return err
			}
		} else if rev.EntityType == "post" {
			var post models.Post
			if err := tx.First(&post, rev.EntityID).Error; err != nil {
				return err
			}

			if title, ok := payload["title"].(string); ok && title != "" {
				post.Title = title
			}
			if excerpt, ok := payload["excerpt"].(string); ok && excerpt != "" {
				post.Excerpt = excerpt
			}
			if content, ok := payload["content"].(string); ok && content != "" {
				post.Content = content
			}
			if status, ok := payload["status"].(string); ok && status != "" {
				post.Status = status
			}

			post.ReviewerID = &reviewerID
			post.ReviewedAt = &now
			post.ReviewNote = reviewNote

			if err := tx.Save(&post).Error; err != nil {
				return err
			}
		}

		return nil
	})

	if err != nil {
		return nil, err
	}

	// Trigger granular ISR revalidation on approve
	if approve {
		if rev.EntityType == "project" {
			s.revalidateService.QueueTag("projects")
		} else if rev.EntityType == "post" {
			s.revalidateService.QueueTag("blog")
		}
	}

	return &rev, nil
}
