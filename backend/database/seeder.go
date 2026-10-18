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
