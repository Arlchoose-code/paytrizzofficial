package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

func SeedReservedMailNames(db *gorm.DB) error {
	reserved := []struct {
		name   string
		reason string
	}{
		{"admin", "System administrative mailbox"},
		{"administrator", "System administrative mailbox"},
		{"postmaster", "RFC 5321 mandatory mailbox"},
		{"hostmaster", "RFC 2142 DNS operations"},
		{"abuse", "RFC 2142 security reporting"},
		{"webmaster", "RFC 2142 website operations"},
		{"security", "Security disclosure mailbox"},
		{"support", "Official company customer support"},
		{"sales", "Commercial inquiries"},
		{"billing", "Invoicing and payment operations"},
		{"noreply", "Automated system dispatch"},
		{"no-reply", "Automated system dispatch"},
		{"mail", "Server mail system"},
		{"mailer-daemon", "MTA delivery notifications"},
		{"info", "General company inquiries"},
		{"contact", "Public contact routing"},
		{"help", "Helpdesk operations"},
		{"root", "System administrator"},
		{"dev", "Internal engineering"},
		{"api", "System webhooks and API"},
		{"test", "Internal testing"},
		{"null", "System reserved"},
	}

	for _, item := range reserved {
		var existing models.ReservedMailName
		if err := db.Where("name = ?", item.name).First(&existing).Error; err != nil {
			r := models.ReservedMailName{
				Name:   item.name,
				Reason: &item.reason,
			}
			if err := db.Create(&r).Error; err != nil {
				log.Printf("Failed to seed reserved mail name %s: %v", item.name, err)
			}
		}
	}

	log.Println("Seeded reserved mail names successfully")
	return nil
}
