package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

func SeedMailboxes(db *gorm.DB) error {
	// 1. Company Mailboxes
	companyBoxes := []struct {
		localPart   string
		address     string
		displayName string
		color       string
		isDefault   bool
	}{
		{"admin", "admin@paytrizz.com", "PayTrizz Operations", "#FCCF00", true},
		{"hello", "hello@paytrizz.com", "PayTrizz Partnerships", "#3B82F6", false},
		{"support", "support@paytrizz.com", "PayTrizz Support", "#10B981", false},
		{"noreply", "noreply@paytrizz.com", "PayTrizz Dispatch", "#6B7280", false},
	}

	for _, cb := range companyBoxes {
		var box models.Mailbox
		if err := db.Where("address = ?", cb.address).First(&box).Error; err != nil {
			newBox := models.Mailbox{
				OwnerType:   models.MailboxOwnerCompany,
				UserID:      nil,
				LocalPart:   cb.localPart,
				Address:     cb.address,
				DisplayName: cb.displayName,
				Color:       cb.color,
				IsDefault:   cb.isDefault,
				Status:      models.MailboxStatusActive,
			}
			if err := db.Create(&newBox).Error; err != nil {
				log.Printf("Failed to seed company mailbox %s: %v", cb.address, err)
			}
		}
	}

	// 2. Talent Mailboxes
	talentUsers := []struct {
		userEmail   string
		localPart   string
		address     string
		displayName string
		color       string
	}{
		{"founder@paytrizz.com", "syahrul", "syahrul@paytrizz.com", "Syahrul", "#FCCF00"},
		{"sarah@paytrizz.com", "sarah", "sarah@paytrizz.com", "Sarah Jenkins", "#8B5CF6"},
		{"david@paytrizz.com", "david", "david@paytrizz.com", "David Chen", "#06B6D4"},
	}

	for _, tu := range talentUsers {
		var u models.User
		if err := db.Where("email = ?", tu.userEmail).First(&u).Error; err == nil {
			var box models.Mailbox
			if err := db.Where("address = ?", tu.address).First(&box).Error; err != nil {
				newBox := models.Mailbox{
					OwnerType:   models.MailboxOwnerTalent,
					UserID:      &u.ID,
					LocalPart:   tu.localPart,
					Address:     tu.address,
					DisplayName: tu.displayName,
					Color:       tu.color,
					IsDefault:   true,
					Status:      models.MailboxStatusActive,
				}
				if err := db.Create(&newBox).Error; err != nil {
					log.Printf("Failed to seed talent mailbox %s: %v", tu.address, err)
				}
			}
		}
	}

	log.Println("Seeded mailboxes successfully")
	return nil
}
