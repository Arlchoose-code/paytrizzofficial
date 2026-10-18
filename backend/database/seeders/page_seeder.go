package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type PageSeeder struct{}

func NewPageSeeder() *PageSeeder {
	return &PageSeeder{}
}

func (s *PageSeeder) Run(db *gorm.DB) error {
	pages := []struct {
		Key      string
		Title    string
		Sections []models.PageSection
	}{
		{
			Key:   "home",
			Title: "Home",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "TALENT AGENCY",
						"headline_line1": "Meet the talent.",
						"headline_line2": "Build what's next.",
						"highlight_word": "talent",
						"description": "PayTrizz connects you with vetted specialists in development, design, and digital growth. One agency, a whole team of experts.",
						"cta_primary_text": "Hire a Talent",
						"cta_primary_link": "/talents",
						"cta_secondary_text": "Request a Project",
						"cta_secondary_link": "/request-project",
						"stats_badge": "50+ vetted specialists"
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
				{
					Key:  "stats",
					Type: models.SectionStats,
					Content: `{
						"items": [
							{"number": "50+", "label": "Talents"},
							{"number": "120+", "label": "Projects Delivered"},
							{"number": "8", "label": "Core Specialties"},
							{"number": "4.9/5", "label": "Client Rating"}
						]
					}`,
					SortOrder: 2,
					IsVisible: true,
				},
				{
					Key:  "services_grid",
					Type: models.SectionServicesGrid,
					Content: `{
						"eyebrow": "WHAT WE DO",
						"title": "Comprehensive Capabilities",
						"subtitle": "From architecture to final deployment, work with hand-picked experts."
					}`,
					SortOrder: 3,
					IsVisible: true,
				},
				{
					Key:  "steps",
					Type: models.SectionSteps,
					Content: `{
						"eyebrow": "HOW IT WORKS",
						"title": "Seamless collaboration from match to launch.",
						"steps": [
							{"step": 1, "title": "You reach out", "description": "Share your roadmap, specs, or desired specialist."},
							{"step": 2, "title": "We match", "description": "Curated shortlist within 24–48 hours."},
							{"step": 3, "title": "Kickoff", "description": "Direct onboarding and sprint planning."},
							{"step": 4, "title": "We deliver", "description": "Transparent milestones and production-ready code."},
							{"step": 5, "title": "You review", "description": "Quality assurance and long-term support."}
						]
					}`,
					SortOrder: 4,
					IsVisible: true,
				},
				{
					Key:  "faq",
					Type: models.SectionFAQ,
					Content: `{
						"eyebrow": "COMMON QUESTIONS",
						"title": "Frequently Asked Questions",
						"subtitle": "Clear answers about hiring, timelines, and confidentiality."
					}`,
					SortOrder: 5,
					IsVisible: true,
				},
				{
					Key:  "cta",
					Type: models.SectionCTA,
					Content: `{
						"title": "Ready to build with PayTrizz?",
						"subtitle": "Let's assemble the ideal team for your next major milestone.",
						"button_text": "Get in Touch",
						"button_link": "/contact"
					}`,
					SortOrder: 6,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "about",
			Title: "About Us",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "ABOUT PAYTRIZZ",
						"headline_line1": "Empowering extraordinary talent.",
						"headline_line2": "Delivering exceptional products.",
						"description": "We started PayTrizz with a simple thesis: elite digital talent produces world-class work when backed by a modern, high-standard agency environment."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "services",
			Title: "Services",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "OUR SERVICES",
						"headline_line1": "Engineered for speed.",
						"headline_line2": "Designed for scale.",
						"description": "Cross-functional disciplines built to handle complete product life-cycles."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "contact",
			Title: "Contact Us",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "CONTACT US",
						"headline_line1": "Let's build something great.",
						"headline_line2": "Get in touch today.",
						"description": "Our team responds promptly within 1–2 business days."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "request-project",
			Title: "Request a Project Squad",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "START A PROJECT",
						"headline_line1": "Request a Dedicated",
						"headline_line2": "Project Squad.",
						"description": "Tell us about your project requirements, scope, budget, and timeline. We'll match you with a vetted team of elite specialists within 48 hours."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "projects",
			Title: "Projects & Works",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "PORTFOLIO & CASE STUDIES",
						"headline_line1": "Proven impact.",
						"headline_line2": "Real systems.",
						"description": "From high-concurrency microservices processing 25k TPS to cross-platform medical apps and multi-brand design tokens — explore the products built by our talent squads."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "blog",
			Title: "Blog & Insights",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "PERSPECTIVES & INSIGHTS",
						"headline_line1": "Insights from the",
						"headline_line2": "front lines.",
						"description": "Technical breakdowns, design token systems, and agency leadership principles written by the practitioners who build daily."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "talents",
			Title: "Talent Directory",
			Sections: []models.PageSection{
				{
					Key:  "hero",
					Type: models.SectionHero,
					Content: `{
						"eyebrow": "VETTED SQUAD",
						"headline_line1": "Find the right",
						"headline_line2": "specialist.",
						"description": "Every specialist is thoroughly evaluated on past execution, code standards, and clear sprint communication."
					}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
	}

	for _, p := range pages {
		var existingPage models.Page
		err := db.Where("`key` = ?", p.Key).First(&existingPage).Error
		if err == gorm.ErrRecordNotFound {
			pageRecord := models.Page{
				Key:      p.Key,
				Title:    p.Title,
				IsActive: true,
			}
			if err := db.Create(&pageRecord).Error; err != nil {
				return err
			}

			for _, sec := range p.Sections {
				sec.PageID = pageRecord.ID
				_ = db.Create(&sec)
			}
		}
	}

	log.Println("[Seeder] CMS Pages and sections seeded successfully")
	return nil
}
