package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

func SeedTags(db *gorm.DB) error {
	tags := []models.Tag{
		{Name: "Golang", Slug: "golang"},
		{Name: "Next.js", Slug: "nextjs"},
		{Name: "React", Slug: "react"},
		{Name: "TypeScript", Slug: "typescript"},
		{Name: "Design System", Slug: "design-system"},
		{Name: "Figma", Slug: "figma"},
		{Name: "Flutter", Slug: "flutter"},
		{Name: "Mobile", Slug: "mobile"},
		{Name: "AWS SES", Slug: "aws-ses"},
		{Name: "PostgreSQL", Slug: "postgresql"},
		{Name: "High Concurrency", Slug: "high-concurrency"},
	}

	for _, t := range tags {
		var existing models.Tag
		if err := db.Where("slug = ?", t.Slug).First(&existing).Error; err != nil {
			if err := db.Create(&t).Error; err != nil {
				log.Printf("Failed to seed tag %s: %v", t.Name, err)
				return err
			}
		}
	}

	log.Println("Tags seeded successfully.")
	return nil
}
