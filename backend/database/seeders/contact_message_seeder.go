package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type ContactMessageSeeder struct{}

func NewContactMessageSeeder() *ContactMessageSeeder {
	return &ContactMessageSeeder{}
}

func (s *ContactMessageSeeder) Run(db *gorm.DB) error {
	phone := "+1 (555) 342-9981"
	source := "https://paytrizz.com/contact"

	messages := []models.ContactMessage{
		{
			TicketCode: "PTZ-2026-000101",
			Channel:    "general",
			Name:       "Alexander Vance",
			Email:      "alexander.vance@finscale-labs.io",
			Phone:      &phone,
			Subject:    "Core banking microservices engineering pod inquiry",
			Message:    "We are planning an overhaul of our real-time settlement rails and need an embedded senior Go & architecture team for a 6-month engagement.",
			Status:     "new",
			IP:         "127.0.0.1",
			UserAgent:  "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
			SourceURL:  &source,
		},
		{
			TicketCode: "PTZ-2026-000102",
			Channel:    "general",
			Name:       "Elena Rostova",
			Email:      "elena@aurahealth.co",
			Phone:      nil,
			Subject:    "Design system token pipeline and multi-platform UX audit",
			Message:    "Looking to consult with Sarah Jenkins and the design team on refactoring our Flutter and Web design system components.",
			Status:     "read",
			IP:         "127.0.0.1",
			UserAgent:  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
			SourceURL:  &source,
		},
	}

	for _, msg := range messages {
		var existing models.ContactMessage
		err := db.Where("ticket_code = ?", msg.TicketCode).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&msg).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Contact Messages seeded successfully")
	return nil
}
