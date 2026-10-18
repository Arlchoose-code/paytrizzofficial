package services

import (
	"errors"
	"fmt"
	"log"
	"paytrizz-backend/config"
	"paytrizz-backend/models"
	"regexp"
	"strconv"
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

	subject, bodyHTML, bodyText := InterpolateTemplate(tmpl.Subject, tmpl.BodyHTML, tmpl.BodyText, vars)

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

// InterpolateTemplate populates variables, synchronizes aliases, injects global defaults, and purges lingering placeholders
func InterpolateTemplate(rawSubject, rawBodyHTML, rawBodyText string, vars map[string]string) (string, string, string) {
	frontendURL := ""
	if config.AppConfig != nil {
		frontendURL = config.AppConfig.FrontendURL
		if frontendURL == "" {
			frontendURL = config.AppConfig.AppURL
		}
	}
	frontendURL = strings.TrimRight(frontendURL, "/")

	// Build robust merged dictionary with global fallbacks and aliases
	mergedVars := map[string]string{
		"frontend_url":        frontendURL,
		"login_url":           frontendURL + "/login",
		"change_password_url": frontendURL + "/change-password",
		"reset_url":           frontendURL + "/reset-password",
		"admin_url":           frontendURL + "/admin",
		"year":                strconv.Itoa(time.Now().Year()),
	}
	if config.AppConfig != nil && config.AppConfig.AppName != "" {
		mergedVars["app_name"] = config.AppConfig.AppName
		mergedVars["site_name"] = config.AppConfig.AppName
	}

	// Overlay explicit variables
	for k, v := range vars {
		mergedVars[k] = v
	}

	// Synchronize common alias pairs so templates never fail on naming variance
	if p, ok := mergedVars["initial_password"]; ok && mergedVars["password"] == "" {
		mergedVars["password"] = p
	} else if p, ok := mergedVars["password"]; ok && mergedVars["initial_password"] == "" {
		mergedVars["initial_password"] = p
	}
	if e, ok := mergedVars["email"]; ok && mergedVars["login_email"] == "" {
		mergedVars["login_email"] = e
	} else if e, ok := mergedVars["login_email"]; ok && mergedVars["email"] == "" {
		mergedVars["email"] = e
	}
	if n, ok := mergedVars["name"]; ok && mergedVars["full_name"] == "" {
		mergedVars["full_name"] = n
	} else if n, ok := mergedVars["full_name"]; ok && mergedVars["name"] == "" {
		mergedVars["name"] = n
	}
	if t, ok := mergedVars["talent_name"]; ok && mergedVars["name"] == "" {
		mergedVars["name"] = t
	}
	if a, ok := mergedVars["approvals_url"]; ok && mergedVars["review_url"] == "" {
		mergedVars["review_url"] = a
	} else if r, ok := mergedVars["review_url"]; ok && mergedVars["approvals_url"] == "" {
		mergedVars["approvals_url"] = r
	}

	subject := rawSubject
	bodyHTML := rawBodyHTML
	bodyText := rawBodyText

	for k, v := range mergedVars {
		placeholder := fmt.Sprintf("{{%s}}", k)
		subject = strings.ReplaceAll(subject, placeholder, v)
		bodyHTML = strings.ReplaceAll(bodyHTML, placeholder, v)
		bodyText = strings.ReplaceAll(bodyText, placeholder, v)
	}

	// Failsafe: safely remove any leftover unresolved {{...}} tags so raw syntax never leaks to recipients
	rePlaceholder := regexp.MustCompile(`\{\{[a-zA-Z0-9_]+\}\}`)
	if rePlaceholder.MatchString(subject) || rePlaceholder.MatchString(bodyHTML) || rePlaceholder.MatchString(bodyText) {
		log.Printf("[EmailOutboxService] Warning: Template contained leftover unmapped placeholders; stripping them safely")
		subject = rePlaceholder.ReplaceAllString(subject, "")
		bodyHTML = rePlaceholder.ReplaceAllString(bodyHTML, "")
		bodyText = rePlaceholder.ReplaceAllString(bodyText, "")
	}

	return subject, bodyHTML, bodyText
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
