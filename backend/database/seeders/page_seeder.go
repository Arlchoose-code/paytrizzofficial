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
		{
			Key:   "privacy",
			Title: "Privacy Policy",
			Sections: []models.PageSection{
				{
					Key:       "content",
					Type:      models.SectionRichText,
					Content:   `{"body": "<h2>1. Information We Collect</h2><p>When you interact with PayTrizz, we collect information you provide directly to us:</p><ul><li><strong>Contact & Proposal Details:</strong> Name, work email address, company name, phone number, and project scope submitted via our inquiry and proposal forms.</li><li><strong>Talent Profiles & Portfolios:</strong> Resumes, CV documents, portfolio links, skill tags, and billing details provided during talent registration or profile updates.</li><li><strong>Communication Logs:</strong> Messages exchanged with our team, support requests, and feedback submitted through our direct contact portals.</li><li><strong>Technical Usage Data:</strong> Anonymized log information including browser type, operating system, IP address, and page interaction timestamps.</li></ul><h2>2. How We Use Your Information</h2><p>We use the information we gather strictly to deliver high-quality engineering and matchmaking services:</p><ul><li>Vetting, evaluating, and matching talent specialists with suitable client projects.</li><li>Responding promptly to project squad inquiries and scoping architecture milestones.</li><li>Maintaining authentication security, preventing spam, and auditing session safety.</li><li>Complying with regulatory obligations and legal dispute protections.</li></ul><h2>3. Confidentiality & Non-Disclosure</h2><p>We recognize that project specifications, architectural designs, and proprietary codebases represent invaluable intellectual property. All proprietary information shared with PayTrizz is protected under mutual non-disclosure agreements (NDAs) and is never sold, traded, or shared with unauthorized third parties.</p><h2>4. Data Security & Retention</h2><p>We implement industry-standard encryption protocols (TLS/SSL in transit, hashed credentials at rest) and strict role-based access control across all database clusters. We retain personal and project information only for as long as necessary to fulfill contractual agreements or legal compliance.</p><h2>5. Your Rights & Contact Information</h2><p>You have the right to request access to the personal data we hold about you, request corrections, or ask for account data deletion. If you have questions regarding this Privacy Policy, please contact our data compliance officer at privacy@paytrizz.com.</p>"}`,
					SortOrder: 1,
					IsVisible: true,
				},
			},
		},
		{
			Key:   "terms",
			Title: "Terms of Service",
			Sections: []models.PageSection{
				{
					Key:       "content",
					Type:      models.SectionRichText,
					Content:   `{"body": "<h2>1. Acceptance of Terms</h2><p>By accessing, browsing, or utilizing the services provided by PayTrizz (\"Platform\", \"we\", \"our\"), whether as a client seeking engineering squad services or as a vetted specialist, you acknowledge and agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must refrain from using the Platform.</p><h2>2. Squad Services & Project Delivery</h2><p>PayTrizz curates and coordinates dedicated engineering and design squads for technical milestones. Statements of Work (SOWs) executed between clients and PayTrizz define specific deliverables, timelines, billing milestones, and acceptance criteria.</p><h2>3. Talent Conduct & Standards</h2><p>Vetted specialists accepted into the PayTrizz network agree to uphold professional engineering standards, adhere to client security guidelines, communicate transparently during sprints, and protect confidential information under NDA.</p><h2>4. Intellectual Property Rights</h2><p>Unless expressly stipulated otherwise in an executed Statement of Work, all custom code, architectural artifacts, design assets, and documentation produced for client milestones transfer to the client upon full payment of milestone invoices.</p><h2>5. Limitation of Liability</h2><p>To the maximum extent permitted by applicable law, PayTrizz and its affiliates shall not be liable for indirect, incidental, special, consequential, or punitive damages resulting from platform downtime or third-party service interruptions.</p><h2>6. Modifications to Terms</h2><p>We reserve the right to modify these Terms of Service at any time. Continued use of the platform following the publication of revised terms constitutes binding acceptance of the updated agreement.</p>"}`,
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
