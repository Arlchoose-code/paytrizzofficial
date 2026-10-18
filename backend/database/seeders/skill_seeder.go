package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type SkillSeeder struct{}

func NewSkillSeeder() *SkillSeeder {
	return &SkillSeeder{}
}

func (s *SkillSeeder) Run(db *gorm.DB) error {
	skills := []models.Skill{
		{Name: "Golang", Slug: "golang", Category: "Backend"},
		{Name: "Next.js", Slug: "nextjs", Category: "Frontend"},
		{Name: "React", Slug: "react", Category: "Frontend"},
		{Name: "TypeScript", Slug: "typescript", Category: "Languages"},
		{Name: "PostgreSQL", Slug: "postgresql", Category: "Database"},
		{Name: "MySQL", Slug: "mysql", Category: "Database"},
		{Name: "Docker", Slug: "docker", Category: "DevOps"},
		{Name: "AWS", Slug: "aws", Category: "Cloud"},
		{Name: "Figma", Slug: "figma", Category: "Design"},
		{Name: "Tailwind CSS", Slug: "tailwind-css", Category: "Frontend"},
		{Name: "Flutter", Slug: "flutter", Category: "Mobile"},
		{Name: "Swift", Slug: "swift", Category: "Mobile"},
		{Name: "After Effects", Slug: "after-effects", Category: "Motion"},
		{Name: "SEO", Slug: "seo", Category: "Marketing"},
	}

	for _, sk := range skills {
		var existing models.Skill
		if err := db.Where("name = ?", sk.Name).First(&existing).Error; err != nil {
			if err := db.Create(&sk).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Skills seeded successfully")
	return nil
}
