package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

func SeedPostCategories(db *gorm.DB) error {
	categories := []models.PostCategory{
		{Name: "Engineering", Slug: "engineering", SortOrder: 1},
		{Name: "Product Design", Slug: "product-design", SortOrder: 2},
		{Name: "Agency Insights", Slug: "agency-insights", SortOrder: 3},
		{Name: "Talent Culture", Slug: "talent-culture", SortOrder: 4},
	}

	for _, cat := range categories {
		var existing models.PostCategory
		if err := db.Where("slug = ?", cat.Slug).First(&existing).Error; err != nil {
			if err := db.Create(&cat).Error; err != nil {
				log.Printf("Failed to seed post category %s: %v", cat.Name, err)
				return err
			}
		}
	}

	log.Println("Post categories seeded successfully.")
	return nil
}
