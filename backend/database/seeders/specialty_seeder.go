package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type SpecialtySeeder struct{}

func NewSpecialtySeeder() *SpecialtySeeder {
	return &SpecialtySeeder{}
}

func (s *SpecialtySeeder) Run(db *gorm.DB) error {
	specialties := []models.Specialty{
		{
			Key:         "web-development",
			Name:        "Web Development",
			Icon:        "code",
			Description: "Full-stack scalable web architecture & APIs",
			SortOrder:   1,
			IsActive:    true,
		},
		{
			Key:         "ui-ux-design",
			Name:        "UI/UX Design",
			Icon:        "palette",
			Description: "Design systems, user research, and wireframing",
			SortOrder:   2,
			IsActive:    true,
		},
		{
			Key:         "mobile-apps",
			Name:        "Mobile Apps",
			Icon:        "smartphone",
			Description: "Cross-platform and native iOS & Android apps",
			SortOrder:   3,
			IsActive:    true,
		},
		{
			Key:         "video-and-motion",
			Name:        "Video & Motion",
			Icon:        "video",
			Description: "Commercial motion design and cinematic editing",
			SortOrder:   4,
			IsActive:    true,
		},
		{
			Key:         "digital-marketing",
			Name:        "Digital Marketing",
			Icon:        "trending-up",
			Description: "Performance marketing and conversion optimization",
			SortOrder:   5,
			IsActive:    true,
		},
		{
			Key:         "content-and-copywriting",
			Name:        "Content & Copywriting",
			Icon:        "file-text",
			Description: "Narrative, technical writing, and brand copy",
			SortOrder:   6,
			IsActive:    true,
		},
	}

	for _, sp := range specialties {
		var existing models.Specialty
		if err := db.Where("`key` = ?", sp.Key).First(&existing).Error; err != nil {
			if err := db.Create(&sp).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Specialties seeded successfully")
	return nil
}
