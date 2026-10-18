package services

import (
	"errors"
	"fmt"
	"paytrizz-backend/models"
	"regexp"
	"strings"
	"time"

	"gorm.io/gorm"
)

var localPartRegex = regexp.MustCompile(`^[a-z0-9][a-z0-9._-]{0,62}[a-z0-9]$`)

type MailboxService struct {
	db         *gorm.DB
	logService *MailLogService
}

func NewMailboxService(db *gorm.DB, logService *MailLogService) *MailboxService {
	return &MailboxService{
		db:         db,
		logService: logService,
	}
}

// ValidateLocalPart checks syntax, length, and reserved names
func (s *MailboxService) ValidateLocalPart(localPart string) (string, error) {
	norm := strings.ToLower(strings.TrimSpace(localPart))
	if len(norm) < 3 || len(norm) > 32 {
		return "", errors.New("mailbox username must be between 3 and 32 characters")
	}

	if !localPartRegex.MatchString(norm) {
		return "", errors.New("username may only contain lowercase letters, numbers, hyphens, underscores, or dots, and must start/end with an alphanumeric character")
	}

	var reserved models.ReservedMailName
	if err := s.db.Where("name = ?", norm).First(&reserved).Error; err == nil {
		reason := "system reserved name"
		if reserved.Reason != nil {
			reason = *reserved.Reason
		}
		return "", fmt.Errorf("the username '%s' is unavailable (%s)", norm, reason)
	}

	return norm, nil
}

// CreateTalentMailbox creates a new mailbox for an authenticated talent
func (s *MailboxService) CreateTalentMailbox(userID uint64, localPart, displayName string, color string) (*models.Mailbox, error) {
	normLocal, err := s.ValidateLocalPart(localPart)
	if err != nil {
		return nil, err
	}

	address := fmt.Sprintf("%s@paytrizz.com", normLocal)

	// Check global uniqueness across all statuses
	var existing models.Mailbox
	if err := s.db.Where("address = ?", address).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("the address '%s' is already in use or reserved", address)
	}

	// Check if this is the user's first mailbox
	var userBoxCount int64
	s.db.Model(&models.Mailbox{}).Where("owner_type = ? AND user_id = ?", models.MailboxOwnerTalent, userID).Count(&userBoxCount)
	isDefault := userBoxCount == 0

	if color == "" {
		color = "#FCCF00"
	}

	mailbox := models.Mailbox{
		OwnerType:   models.MailboxOwnerTalent,
		UserID:      &userID,
		LocalPart:   normLocal,
		Address:     address,
		DisplayName: displayName,
		Color:       color,
		IsDefault:   isDefault,
		Status:      models.MailboxStatusActive,
		CreatedByID: &userID,
	}

	if err := s.db.Create(&mailbox).Error; err != nil {
		return nil, err
	}

	_ = s.logService.LogEvent(models.MailLogEventMailboxCreated, &userID, &mailbox.ID, &mailbox.Address, &userID, nil, nil, nil, nil)

	return &mailbox, nil
}

// CreateCompanyMailbox creates a shared company mailbox (admin@, hello@, ...).
// Only administrators reach this path (PRD 4.10: admin manages company mailboxes).
func (s *MailboxService) CreateCompanyMailbox(actorUserID uint64, localPart, displayName string, color string) (*models.Mailbox, error) {
	normLocal, err := s.ValidateLocalPart(localPart)
	if err != nil {
		return nil, err
	}

	address := fmt.Sprintf("%s@paytrizz.com", normLocal)

	// Check global uniqueness across all statuses
	var existing models.Mailbox
	if err := s.db.Where("address = ?", address).First(&existing).Error; err == nil {
		return nil, fmt.Errorf("the address '%s' is already in use or reserved", address)
	}

	var companyBoxCount int64
	s.db.Model(&models.Mailbox{}).Where("owner_type = ?", models.MailboxOwnerCompany).Count(&companyBoxCount)
	isDefault := companyBoxCount == 0

	if color == "" {
		color = "#FCCF00"
	}

	mailbox := models.Mailbox{
		OwnerType:   models.MailboxOwnerCompany,
		LocalPart:   normLocal,
		Address:     address,
		DisplayName: displayName,
		Color:       color,
		IsDefault:   isDefault,
		Status:      models.MailboxStatusActive,
		CreatedByID: &actorUserID,
	}

	if err := s.db.Create(&mailbox).Error; err != nil {
		return nil, err
	}

	_ = s.logService.LogEvent(models.MailLogEventMailboxCreated, &actorUserID, &mailbox.ID, &mailbox.Address, nil, nil, nil, nil, nil)

	return &mailbox, nil
}

// GetUserMailboxes returns all active mailboxes accessible to user (by role)
func (s *MailboxService) GetUserMailboxes(userID uint64, role string) ([]models.Mailbox, error) {
	var mailboxes []models.Mailbox
	query := s.db.Model(&models.Mailbox{}).Where("status != ?", models.MailboxStatusDeleted)

	if role == "admin" {
		// Admin accesses all company mailboxes
		query = query.Where("owner_type = ?", models.MailboxOwnerCompany)
	} else {
		// Talent accesses only their own mailboxes
		query = query.Where("owner_type = ? AND user_id = ?", models.MailboxOwnerTalent, userID)
	}

	if err := query.Order("is_default DESC, id ASC").Find(&mailboxes).Error; err != nil {
		return nil, err
	}
	return mailboxes, nil
}

// DeleteMailbox soft-deletes a mailbox with 30-day retention purge
func (s *MailboxService) DeleteMailbox(mailboxID uint64, actorUserID uint64, role string) error {
	var mailbox models.Mailbox
	query := s.db.Where("id = ?", mailboxID)
	if role != "admin" {
		query = query.Where("owner_type = ? AND user_id = ?", models.MailboxOwnerTalent, actorUserID)
	}

	if err := query.First(&mailbox).Error; err != nil {
		return errors.New("mailbox not found or unauthorized")
	}

	now := time.Now()
	purge := now.Add(30 * 24 * time.Hour) // 30-day retention
	mailbox.Status = models.MailboxStatusDeleted
	mailbox.DeletedAt = &now
	mailbox.DeletedByID = &actorUserID
	mailbox.PurgeAfter = &purge

	if err := s.db.Save(&mailbox).Error; err != nil {
		return err
	}

	_ = s.logService.LogEvent(models.MailLogEventMailboxDeleted, &actorUserID, &mailbox.ID, &mailbox.Address, mailbox.UserID, nil, nil, nil, nil)
	return nil
}
