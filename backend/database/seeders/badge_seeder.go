package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type BadgeSeeder struct{}

func NewBadgeSeeder() *BadgeSeeder {
	return &BadgeSeeder{}
}

func (s *BadgeSeeder) Run(db *gorm.DB) error {
	badges := []models.Badge{
		{
			Key:       "ceo-founder",
			Label:     "CEO / Founder",
			Color:     "#FCCF00",
			Icon:      "crown",
			SortOrder: 1,
		},
		{
			Key:       "lead-architect",
			Label:     "Lead Architect",
			Color:     "#1D2023",
			Icon:      "cpu",
			SortOrder: 2,
		},
		{
			Key:       "top-rated",
			Label:     "Top Rated",
			Color:     "#FCCF00",
			Icon:      "star",
			SortOrder: 3,
		},
		{
			Key:       "core-squad",
			Label:     "Core Squad",
			Color:     "#FFF3B0",
			Icon:      "shield",
			SortOrder: 4,
		},
	}

	for _, b := range badges {
		var existing models.Badge
		if err := db.Where("`key` = ?", b.Key).First(&existing).Error; err != nil {
			if err := db.Create(&b).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Badges seeded successfully")
	return nil
}
