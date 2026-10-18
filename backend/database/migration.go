package database

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

// AutoMigrate runs all database migrations through GORM
func AutoMigrate(db *gorm.DB) error {
	log.Println("Starting database migrations...")

	err := db.AutoMigrate(
		// Group A - Auth
		&models.User{},
		&models.RefreshToken{},
		&models.PasswordResetToken{},

		// Group B - Site & CMS Foundation
		&models.SiteSetting{},
		&models.Media{},
		&models.RevalidationJob{},
		&models.AuditLog{},

		// Group C - CMS Pages, Sections, Services, FAQs, Menus, SEO
		&models.Page{},
		&models.PageSection{},
		&models.Service{},
		&models.FAQ{},
		&models.MenuItem{},
		&models.SocialLink{},
		&models.SEOSetting{},

		// Group D - Talents & Profiles
		&models.Badge{},
		&models.Specialty{},
		&models.Skill{},
		&models.Talent{},
		&models.TalentBadge{},
		&models.TalentSpecialty{},
		&models.TalentSkill{},
		&models.TalentExperience{},
		&models.TalentEducation{},
		&models.TalentLink{},

		// Group E - Projects, Blog & Revisions
		&models.ProjectCategory{},
		&models.PostCategory{},
		&models.Tag{},
		&models.Project{},
		&models.ProjectTalent{},
		&models.ProjectImage{},
		&models.ProjectTag{},
		&models.Post{},
		&models.PostTag{},
		&models.ContentRevision{},

		// Group F - Public Forms & System Emails (Phase 5)
		&models.ContactMessage{},
		&models.Application{},
		&models.ApplicationFile{},
		&models.EmailTemplate{},
		&models.EmailOutbox{},

		// Group G - Webmail (Phase 6 & 7)
		&models.Mailbox{},
		&models.ReservedMailName{},
		&models.MailThread{},
		&models.MailMessage{},
		&models.MailAttachment{},
		&models.MailLabel{},
		&models.MailMessageLabel{},
		&models.MailSubscription{},
		&models.MailInboundEvent{},
		&models.MailLog{},
	)

	if err != nil {
		log.Printf("Migration error: %v", err)
		return err
	}

	log.Println("Database migration completed successfully.")
	return nil
}
