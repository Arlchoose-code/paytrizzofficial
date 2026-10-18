package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type ApplicationSeeder struct{}

func NewApplicationSeeder() *ApplicationSeeder {
	return &ApplicationSeeder{}
}

func (s *ApplicationSeeder) Run(db *gorm.DB) error {
	company1 := "Vortex Cloud Solutions"
	title1 := "Enterprise Telemetry Platform"
	budget1 := "$25,000 - $50,000"
	timeline1 := "3 Months"

	company2 := "Apex Financial Systems"
	title2 := "Core Payment Gateway Integration"
	budget2 := "$50,000+"
	timeline2 := "6 Months"

	apps := []models.Application{
		{
			TicketCode:  "PTZ-2026-000201",
			Type:        "project",
			FullName:    "Sophia Chen",
			Email:       "sophia@vortexcloud.tech",
			CompanyName: &company1,
			Title:       &title1,
			Message:     "We require a 3-person pod (1 Lead Architect + 2 Full-Stack Engineers) to build an enterprise multi-tenant telemetry and audit platform.",
			BudgetRange: &budget1,
			Timeline:    &timeline1,
			Status:      "reviewing",
			IP:          "127.0.0.1",
			UserAgent:   "Mozilla/5.0 (Windows NT 10.0; Win64; x64)",
		},
		{
			TicketCode:  "PTZ-2026-000202",
			Type:        "project",
			FullName:    "Alexander Wright",
			Email:       "a.wright@apexfin.com",
			CompanyName: &company2,
			Title:       &title2,
			Message:     "Need a dedicated security-focused squad to architect and deliver high-throughput transaction processing microservices.",
			BudgetRange: &budget2,
			Timeline:    &timeline2,
			Status:      "new",
			IP:          "127.0.0.1",
			UserAgent:   "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7)",
		},
	}

	for _, app := range apps {
		var existing models.Application
		err := db.Where("ticket_code = ?", app.TicketCode).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&app).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Applications seeded successfully")
	return nil
}
