package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type SEOSettingSeeder struct{}

func NewSEOSettingSeeder() *SEOSettingSeeder {
	return &SEOSettingSeeder{}
}

func (s *SEOSettingSeeder) Run(db *gorm.DB) error {
	defaults := []models.SEOSetting{
		{
			PageKey:     "home",
			Title:       "Talent Agency Platform",
			Description: "Connect with vetted specialists in development, design, and digital growth. Build what's next with PayTrizz.",
			RobotsIndex: true,
		},
		{
			PageKey:     "about",
			Title:       "About Us",
			Description: "Learn about the mission, standards, and founding philosophy behind PayTrizz talent agency.",
			RobotsIndex: true,
		},
		{
			PageKey:     "services",
			Title:       "Services",
			Description: "Explore our vetted capabilities across Full-stack Web Development, Mobile Engineering, UI/UX, and Marketing.",
			RobotsIndex: true,
		},
		{
			PageKey:     "talents",
			Title:       "Browse Specialists",
			Description: "Discover and hire pre-vetted engineers, designers, and growth leaders.",
			RobotsIndex: true,
		},
		{
			PageKey:     "projects",
			Title:       "Projects & Works",
			Description: "Explore impactful client deliverables, architectural case studies, and engineering outcomes.",
			RobotsIndex: true,
		},
		{
			PageKey:     "blog",
			Title:       "Agency Insights",
			Description: "In-depth engineering articles, design thinking, and agency methodologies written by PayTrizz talent.",
			RobotsIndex: true,
		},
		{
			PageKey:     "contact",
			Title:       "Contact Us",
			Description: "Reach out to the PayTrizz agency team for project scoping, matchmaking, and consultations.",
			RobotsIndex: true,
		},
		{
			PageKey:     "request-project",
			Title:       "Request a Project Squad",
			Description: "Submit technical specifications, budget, and timeline to assemble an elite vetted engineering squad within 48 hours.",
			RobotsIndex: true,
		},
	}

	for _, item := range defaults {
		var existing models.SEOSetting
		err := db.Where("page_key = ?", item.PageKey).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&item).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] SEO Settings seeded successfully")
	return nil
}
