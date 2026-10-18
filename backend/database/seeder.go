package database

import (
	"log"
	"os"
	"paytrizz-backend/database/seeders"
	"paytrizz-backend/models"
	"paytrizz-backend/services"

	"gorm.io/gorm"
)

// ShouldRunSeeders determines whether seeders should be executed
func ShouldRunSeeders(db *gorm.DB) bool {
	// 1. Explicit force flag via env or cli args
	if os.Getenv("RUN_SEEDERS") == "true" {
		return true
	}
	for _, arg := range os.Args[1:] {
		if arg == "--seed" || arg == "-seed" {
			return true
		}
	}

	// 2. Check system_seeded marker
	var seededSetting models.SiteSetting
	if err := db.Where("`key` = ?", "system_seeded").First(&seededSetting).Error; err == nil {
		return false
	}

	// 3. Check if database already has users (already in use / initialized)
	var userCount int64
	if err := db.Model(&models.User{}).Count(&userCount).Error; err == nil && userCount > 0 {
		// Existing database with data: write marker and do not re-seed
		db.Create(&models.SiteSetting{
			Group:    "system",
			Key:      "system_seeded",
			Value:    `"true"`,
			Type:     "string",
			IsPublic: false,
		})
		return false
	}

	// 4. Fresh, completely empty database
	return true
}

// RunSeeders orchestrates all individual model seeders idempotently
func RunSeeders(db *gorm.DB) error {
	EnsureEssentialPages(db)

	if !ShouldRunSeeders(db) {
		log.Println("[Database] Database already initialized. Skipping seeders (set RUN_SEEDERS=true or pass --seed to force re-seed).")
		return nil
	}

	log.Println("Starting database seeders...")

	// 1. User seeder
	userSeeder := seeders.NewUserSeeder()
	if err := userSeeder.Run(db); err != nil {
		log.Printf("User seeder failed: %v", err)
		return err
	}

	// 2. Site settings seeder
	siteSettingSeeder := seeders.NewSiteSettingSeeder()
	if err := siteSettingSeeder.Run(db); err != nil {
		log.Printf("Site settings seeder failed: %v", err)
		return err
	}

	// 3. Media seeder
	imageProcessor := services.NewImageProcessor()
	mediaSeeder := seeders.NewMediaSeeder(imageProcessor)
	if err := mediaSeeder.Run(db); err != nil {
		log.Printf("Media seeder failed: %v", err)
		return err
	}

	// 4. Page & sections seeder
	pageSeeder := seeders.NewPageSeeder()
	if err := pageSeeder.Run(db); err != nil {
		log.Printf("Page seeder failed: %v", err)
		return err
	}

	// 5. Service seeder
	serviceSeeder := seeders.NewServiceSeeder()
	if err := serviceSeeder.Run(db); err != nil {
		log.Printf("Service seeder failed: %v", err)
		return err
	}

	// 6. FAQ seeder
	faqSeeder := seeders.NewFAQSeeder()
	if err := faqSeeder.Run(db); err != nil {
		log.Printf("FAQ seeder failed: %v", err)
		return err
	}

	// 7. Menu item seeder
	menuItemSeeder := seeders.NewMenuItemSeeder()
	if err := menuItemSeeder.Run(db); err != nil {
		log.Printf("Menu item seeder failed: %v", err)
		return err
	}

	// 8. Social link seeder
	socialLinkSeeder := seeders.NewSocialLinkSeeder()
	if err := socialLinkSeeder.Run(db); err != nil {
		log.Printf("Social link seeder failed: %v", err)
		return err
	}

	// 9. SEO setting seeder
	seoSettingSeeder := seeders.NewSEOSettingSeeder()
	if err := seoSettingSeeder.Run(db); err != nil {
		log.Printf("SEO setting seeder failed: %v", err)
		return err
	}

	// 10. Badges seeder
	badgeSeeder := seeders.NewBadgeSeeder()
	if err := badgeSeeder.Run(db); err != nil {
		log.Printf("Badge seeder failed: %v", err)
		return err
	}

	// 11. Specialties seeder
	specialtySeeder := seeders.NewSpecialtySeeder()
	if err := specialtySeeder.Run(db); err != nil {
		log.Printf("Specialty seeder failed: %v", err)
		return err
	}

	// 12. Skills seeder
	skillSeeder := seeders.NewSkillSeeder()
	if err := skillSeeder.Run(db); err != nil {
		log.Printf("Skill seeder failed: %v", err)
		return err
	}

	// 13. Talents seeder
	talentSeeder := seeders.NewTalentSeeder()
	if err := talentSeeder.Run(db); err != nil {
		log.Printf("Talent seeder failed: %v", err)
		return err
	}

	// 14. Project categories seeder
	if err := seeders.SeedProjectCategories(db); err != nil {
		log.Printf("Project category seeder failed: %v", err)
		return err
	}

	// 15. Post categories seeder
	if err := seeders.SeedPostCategories(db); err != nil {
		log.Printf("Post category seeder failed: %v", err)
		return err
	}

	// 16. Tags seeder
	if err := seeders.SeedTags(db); err != nil {
		log.Printf("Tags seeder failed: %v", err)
		return err
	}

	// 17. Projects seeder
	if err := seeders.SeedProjects(db); err != nil {
		log.Printf("Projects seeder failed: %v", err)
		return err
	}

	// 18. Posts seeder
	if err := seeders.SeedPosts(db); err != nil {
		log.Printf("Posts seeder failed: %v", err)
		return err
	}

	// 19. Email Templates seeder (Phase 5)
	emailTemplateSeeder := seeders.NewEmailTemplateSeeder()
	if err := emailTemplateSeeder.Run(db); err != nil {
		log.Printf("Email template seeder failed: %v", err)
		return err
	}

	// 20. Contact Messages seeder (Phase 5)
	contactMessageSeeder := seeders.NewContactMessageSeeder()
	if err := contactMessageSeeder.Run(db); err != nil {
		log.Printf("Contact message seeder failed: %v", err)
		return err
	}

	// 21. Applications seeder (Phase 5)
	applicationSeeder := seeders.NewApplicationSeeder()
	if err := applicationSeeder.Run(db); err != nil {
		log.Printf("Application seeder failed: %v", err)
		return err
	}

	// 22. Reserved Mail Names seeder (Phase 6)
	if err := seeders.SeedReservedMailNames(db); err != nil {
		log.Printf("Reserved mail names seeder failed: %v", err)
		return err
	}

	// 23. Mailboxes seeder (Phase 6)
	if err := seeders.SeedMailboxes(db); err != nil {
		log.Printf("Mailboxes seeder failed: %v", err)
		return err
	}

	// 24. Mail Messages seeder (Phase 6)
	if err := seeders.SeedMailMessages(db); err != nil {
		log.Printf("Mail messages seeder failed: %v", err)
		return err
	}

	// Mark database as seeded so dummy data is never re-inserted on restarts
	var seededSetting models.SiteSetting
	if err := db.Where("`key` = ?", "system_seeded").First(&seededSetting).Error; err != nil {
		db.Create(&models.SiteSetting{
			Group:    "system",
			Key:      "system_seeded",
			Value:    `"true"`,
			Type:     "string",
			IsPublic: false,
		})
	}

	log.Println("All seeders executed successfully.")
	return nil
}

// EnsureEssentialPages guarantees that core legal pages (privacy, terms) exist in CMS
func EnsureEssentialPages(db *gorm.DB) {
	essentialPages := []struct {
		Key     string
		Title   string
		Content string
	}{
		{
			Key:   "privacy",
			Title: "Privacy Policy",
			Content: `{"body": "<h2>1. Information We Collect</h2><p>When you interact with PayTrizz, we collect information you provide directly to us:</p><ul><li><strong>Contact & Proposal Details:</strong> Name, work email address, company name, phone number, and project scope submitted via our inquiry and proposal forms.</li><li><strong>Talent Profiles & Portfolios:</strong> Resumes, CV documents, portfolio links, skill tags, and billing details provided during talent registration or profile updates.</li><li><strong>Communication Logs:</strong> Messages exchanged with our team, support requests, and feedback submitted through our direct contact portals.</li><li><strong>Technical Usage Data:</strong> Anonymized log information including browser type, operating system, IP address, and page interaction timestamps.</li></ul><h2>2. How We Use Your Information</h2><p>We use the information we gather strictly to deliver high-quality engineering and matchmaking services:</p><ul><li>Vetting, evaluating, and matching talent specialists with suitable client projects.</li><li>Responding promptly to project squad inquiries and scoping architecture milestones.</li><li>Maintaining authentication security, preventing spam, and auditing session safety.</li><li>Complying with regulatory obligations and legal dispute protections.</li></ul><h2>3. Confidentiality & Non-Disclosure</h2><p>We recognize that project specifications, architectural designs, and proprietary codebases represent invaluable intellectual property. All proprietary information shared with PayTrizz is protected under mutual non-disclosure agreements (NDAs) and is never sold, traded, or shared with unauthorized third parties.</p><h2>4. Data Security & Retention</h2><p>We implement industry-standard encryption protocols (TLS/SSL in transit, hashed credentials at rest) and strict role-based access control across all database clusters. We retain personal and project information only for as long as necessary to fulfill contractual agreements or legal compliance.</p><h2>5. Your Rights & Contact Information</h2><p>You have the right to request access to the personal data we hold about you, request corrections, or ask for account data deletion. If you have questions regarding this Privacy Policy, please contact our data compliance officer at privacy@paytrizz.com.</p>"}`,
		},
		{
			Key:   "terms",
			Title: "Terms of Service",
			Content: `{"body": "<h2>1. Acceptance of Terms</h2><p>By accessing, browsing, or utilizing the services provided by PayTrizz (\"Platform\", \"we\", \"our\"), whether as a client seeking engineering squad services or as a vetted specialist, you acknowledge and agree to be bound by these Terms of Service. If you disagree with any part of these terms, you must refrain from using the Platform.</p><h2>2. Squad Services & Project Delivery</h2><p>PayTrizz curates and coordinates dedicated engineering and design squads for technical milestones. Statements of Work (SOWs) executed between clients and PayTrizz define specific deliverables, timelines, billing milestones, and acceptance criteria.</p><h2>3. Talent Conduct & Standards</h2><p>Vetted specialists accepted into the PayTrizz network agree to uphold professional engineering standards, adhere to client security guidelines, communicate transparently during sprints, and protect confidential information under NDA.</p><h2>4. Intellectual Property Rights</h2><p>Unless expressly stipulated otherwise in an executed Statement of Work, all custom code, architectural artifacts, design assets, and documentation produced for client milestones transfer to the client upon full payment of milestone invoices.</p><h2>5. Limitation of Liability</h2><p>To the maximum extent permitted by applicable law, PayTrizz and its affiliates shall not be liable for indirect, incidental, special, consequential, or punitive damages resulting from platform downtime or third-party service interruptions.</p><h2>6. Modifications to Terms</h2><p>We reserve the right to modify these Terms of Service at any time. Continued use of the platform following the publication of revised terms constitutes binding acceptance of the updated agreement.</p>"}`,
		},
	}

	for _, ep := range essentialPages {
		var existing models.Page
		if err := db.Where("`key` = ?", ep.Key).First(&existing).Error; err != nil {
			pageRecord := models.Page{
				Key:      ep.Key,
				Title:    ep.Title,
				IsActive: true,
			}
			if err := db.Create(&pageRecord).Error; err == nil {
				section := models.PageSection{
					PageID:    pageRecord.ID,
					Key:       "content",
					Type:      models.SectionRichText,
					Content:   ep.Content,
					SortOrder: 1,
					IsVisible: true,
				}
				_ = db.Create(&section)
			}
		}
	}
}
