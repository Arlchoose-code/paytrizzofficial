package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type FAQSeeder struct{}

func NewFAQSeeder() *FAQSeeder {
	return &FAQSeeder{}
}

func (s *FAQSeeder) Run(db *gorm.DB) error {
	faqs := []models.FAQ{
		{
			Question:    "How does PayTrizz vet specialists?",
			Answer:      "Every talent passes a rigorous multi-stage evaluation: verified portfolio review, live technical and design assessment, and direct client communication trial.",
			SortOrder:   1,
			IsPublished: true,
		},
		{
			Question:    "How quickly can we kickoff a project?",
			Answer:      "Typically within 24 to 48 hours of initial consultation. We match you with available specialists who align with your tech stack and scope.",
			SortOrder:   2,
			IsPublished: true,
		},
		{
			Question:    "Can I hire individual specialists or an entire team?",
			Answer:      "Both. You can engage an individual developer/designer for augmentation or assemble a full cross-functional team with project leadership.",
			SortOrder:   3,
			IsPublished: true,
		},
		{
			Question:    "What contracts and IP protections are in place?",
			Answer:      "All intellectual property and code belongs 100% to you. We execute strict standard NDAs and IP assignment agreements prior to kickoff.",
			SortOrder:   4,
			IsPublished: true,
		},
		{
			Question:    "How do payments and milestone deliveries work?",
			Answer:      "Work is organized into milestones or monthly sprints. Detailed timesheets or milestone deliverables are reviewed and approved before invoice settlement.",
			SortOrder:   5,
			IsPublished: true,
		},
	}

	for _, item := range faqs {
		var existing models.FAQ
		err := db.Where("question = ?", item.Question).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&item).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] FAQs seeded successfully")
	return nil
}
