package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type SocialLinkSeeder struct{}

func NewSocialLinkSeeder() *SocialLinkSeeder {
	return &SocialLinkSeeder{}
}

func (s *SocialLinkSeeder) Run(db *gorm.DB) error {
	links := []models.SocialLink{
		{Platform: "linkedin", Label: "LinkedIn", URL: "https://linkedin.com/company/paytrizz", SortOrder: 1, IsActive: true},
		{Platform: "github", Label: "GitHub", URL: "https://github.com/paytrizz", SortOrder: 2, IsActive: true},
		{Platform: "twitter", Label: "X (Twitter)", URL: "https://x.com/paytrizz", SortOrder: 3, IsActive: true},
		{Platform: "instagram", Label: "Instagram", URL: "https://instagram.com/paytrizz", SortOrder: 4, IsActive: true},
	}

	for _, l := range links {
		var existing models.SocialLink
		err := db.Where("platform = ?", l.Platform).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&l).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Social Links seeded successfully")
	return nil
}
