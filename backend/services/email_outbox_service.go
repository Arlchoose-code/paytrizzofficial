package services

import (
	"errors"
	"fmt"
	"log"
	"paytrizz-backend/models"
	"strings"
	"time"

	"gorm.io/gorm"
)

type EmailOutboxService struct {
	db *gorm.DB
}

func NewEmailOutboxService(db *gorm.DB) *EmailOutboxService {
	return &EmailOutboxService{db: db}
}

// Enqueue inserts a new record into email_outbox ready for background processing
func (s *EmailOutboxService) Enqueue(
	templateKey *string,
	toEmail string,
	toName *string,
	subject string,
	bodyHTML string,
	bodyText string,
	replyTo *string,
	relatedType *string,
	relatedID *uint64,
) (*models.EmailOutbox, error) {
	entry := &models.EmailOutbox{
		TemplateKey:   templateKey,
		ToEmail:       strings.TrimSpace(strings.ToLower(toEmail)),
		ToName:        toName,
		Subject:       subject,
		BodyHTML:      bodyHTML,
		BodyText:      bodyText,
		ReplyTo:       replyTo,
		RelatedType:   relatedType,
		RelatedID:     relatedID,
		Status:        "pending",
		Attempts:      0,
		NextAttemptAt: time.Now(),
	}

	if err := s.db.Create(entry).Error; err != nil {
		return nil, err
	}

	return entry, nil
}

// SendTemplated resolves an email template, interpolates variables, and enqueues to outbox
func (s *EmailOutboxService) SendTemplated(
	templateKey string,
	toEmail string,
	toName *string,
	vars map[string]string,
	replyTo *string,
	relatedType *string,
	relatedID *uint64,
) (*models.EmailOutbox, error) {
	var tmpl models.EmailTemplate
	if err := s.db.Where("`key` = ? AND is_active = ?", templateKey, true).First(&tmpl).Error; err != nil {
		if errors.Is(err, gorm.ErrRecordNotFound) {
			log.Printf("[EmailOutboxService] Template '%s' not found or inactive, falling back to basic delivery", templateKey)
			return s.Enqueue(&templateKey, toEmail, toName, fmt.Sprintf("[PayTrizz] Notification (%s)", templateKey), "", "", replyTo, relatedType, relatedID)
		}
		return nil, err
	}

	subject := tmpl.Subject
	bodyHTML := tmpl.BodyHTML
	bodyText := tmpl.BodyText

	for k, v := range vars {
		placeholder := fmt.Sprintf("{{%s}}", k)
		subject = strings.ReplaceAll(subject, placeholder, v)
		bodyHTML = strings.ReplaceAll(bodyHTML, placeholder, v)
		bodyText = strings.ReplaceAll(bodyText, placeholder, v)
	}

	return s.Enqueue(
		&templateKey,
		toEmail,
		toName,
		subject,
		bodyHTML,
		bodyText,
		replyTo,
		relatedType,
		relatedID,
	)
}

// MaskInitialPassword masks temporary password after status sent to prevent cleartext credential leaks
func (s *EmailOutboxService) MaskInitialPassword(outboxID uint64) error {
	var outbox models.EmailOutbox
	if err := s.db.First(&outbox, outboxID).Error; err != nil {
		return err
	}

	if outbox.Status != "sent" {
		return nil
	}

	maskedHTML := outbox.BodyHTML
	maskedText := outbox.BodyText

	if strings.Contains(maskedHTML, "Initial Password:") {
		// Replace plain text passwords
		maskedHTML = strings.ReplaceAll(maskedHTML, "<strong>Initial Password:</strong>", "<strong>Initial Password:</strong> ********")
		maskedText = strings.ReplaceAll(maskedText, "Initial Password:", "Initial Password: ********")
		outbox.BodyHTML = maskedHTML
		outbox.BodyText = maskedText
		return s.db.Save(&outbox).Error
	}

	return nil
}
