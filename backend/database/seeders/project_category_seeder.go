package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

func SeedProjectCategories(db *gorm.DB) error {
	categories := []models.ProjectCategory{
		{Name: "Web & SaaS Platforms", Slug: "web-saas", SortOrder: 1},
		{Name: "Mobile Applications", Slug: "mobile-apps", SortOrder: 2},
		{Name: "Design Systems & UX", Slug: "design-systems", SortOrder: 3},
		{Name: "Cloud & Infrastructure", Slug: "cloud-infrastructure", SortOrder: 4},
		{Name: "Brand & Motion", Slug: "brand-motion", SortOrder: 5},
	}

	for _, cat := range categories {
		var existing models.ProjectCategory
		if err := db.Where("slug = ?", cat.Slug).First(&existing).Error; err != nil {
			if err := db.Create(&cat).Error; err != nil {
				log.Printf("Failed to seed project category %s: %v", cat.Name, err)
				return err
			}
		}
	}

	log.Println("Project categories seeded successfully.")
	return nil
}
