package seeders

import (
	"log"
	"paytrizz-backend/models"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type TalentSeeder struct{}

func NewTalentSeeder() *TalentSeeder {
	return &TalentSeeder{}
}

func (s *TalentSeeder) Run(db *gorm.DB) error {
	// 1. Seed Founder Talent linked to founder@paytrizz.com
	var founderUser models.User
	if err := db.Where("email = ?", "founder@paytrizz.com").First(&founderUser).Error; err == nil {
		var existingFounder models.Talent
		if err := db.Where("user_id = ?", founderUser.ID).First(&existingFounder).Error; err != nil {
			hourlyRate := 120.0
			founderTalent := models.Talent{
				UserID:          founderUser.ID,
				Slug:            "syahrul",
				Name:            "Syahrul",
				Headline:        "Founder & Full-Stack Systems Architect",
				Bio:             "Founding engineer at PayTrizz. Obsessed with high-concurrency Golang backends, modern Next.js client architectures, and frictionless developer experiences.",
				Location:        "Jakarta, Indonesia",
				YearsExperience: 8,
				HourlyRateUSD:   &hourlyRate,
				Availability:    models.AvailabilityAvailable,
				IsPublished:     true,
				IsFeatured:      true,
				SortOrder:       1,
			}

			if err := db.Create(&founderTalent).Error; err == nil {
				// Attach Badges
				var ceoBadge, leadBadge models.Badge
				db.Where("`key` = ?", "ceo-founder").First(&ceoBadge)
				db.Where("`key` = ?", "lead-architect").First(&leadBadge)

				if ceoBadge.ID > 0 {
					db.Create(&models.TalentBadge{TalentID: founderTalent.ID, BadgeID: ceoBadge.ID, SortOrder: 1})
				}
				if leadBadge.ID > 0 {
					db.Create(&models.TalentBadge{TalentID: founderTalent.ID, BadgeID: leadBadge.ID, SortOrder: 2})
				}

				// Attach Specialty
				var webSpecialty models.Specialty
				db.Where("`key` = ?", "web-development").First(&webSpecialty)
				if webSpecialty.ID > 0 {
					db.Create(&models.TalentSpecialty{TalentID: founderTalent.ID, SpecialtyID: webSpecialty.ID})
				}

				// Attach Skills
				var goSkill, nextSkill, tsSkill, pgSkill models.Skill
				db.Where("name = ?", "Golang").First(&goSkill)
				db.Where("name = ?", "Next.js").First(&nextSkill)
				db.Where("name = ?", "TypeScript").First(&tsSkill)
				db.Where("name = ?", "PostgreSQL").First(&pgSkill)

				if goSkill.ID > 0 {
					db.Create(&models.TalentSkill{TalentID: founderTalent.ID, SkillID: goSkill.ID, Proficiency: "expert", Years: 6})
				}
				if nextSkill.ID > 0 {
					db.Create(&models.TalentSkill{TalentID: founderTalent.ID, SkillID: nextSkill.ID, Proficiency: "expert", Years: 5})
				}
				if tsSkill.ID > 0 {
					db.Create(&models.TalentSkill{TalentID: founderTalent.ID, SkillID: tsSkill.ID, Proficiency: "expert", Years: 6})
				}
				if pgSkill.ID > 0 {
					db.Create(&models.TalentSkill{TalentID: founderTalent.ID, SkillID: pgSkill.ID, Proficiency: "expert", Years: 7})
				}

				// Attach Experience
				startDate := time.Date(2024, 1, 1, 0, 0, 0, 0, time.UTC)
				db.Create(&models.TalentExperience{
					TalentID:    founderTalent.ID,
					RoleTitle:   "Founder & Chief Architect",
					Company:     "PayTrizz",
					Location:    "Jakarta, ID",
					StartDate:   startDate,
					IsCurrent:   true,
					Description: "Architected end-to-end talent matching engine, SES webmail infrastructure, and high-velocity development pipelines.",
					SortOrder:   1,
				})

				// Attach Education
				db.Create(&models.TalentEducation{
					TalentID:     founderTalent.ID,
					Institution:  "Universitas Indonesia",
					Degree:       "Bachelor of Science",
					FieldOfStudy: "Computer Science",
					StartYear:    2014,
					SortOrder:    1,
				})

				// Attach Links
				db.Create(&models.TalentLink{
					TalentID:  founderTalent.ID,
					Platform:  "github",
					Label:     "GitHub",
					URL:       "https://github.com/paytrizz",
					SortOrder: 1,
				})
				db.Create(&models.TalentLink{
					TalentID:  founderTalent.ID,
					Platform:  "linkedin",
					Label:     "LinkedIn",
					URL:       "https://linkedin.com",
					SortOrder: 2,
				})
			}
		}
	}

	// 2. Seed Sample Featured Talent: Sarah Jenkins (UI/UX)
	var sarahUser models.User
	if err := db.Where("email = ?", "sarah@paytrizz.com").First(&sarahUser).Error; err != nil {
		hash, _ := bcrypt.GenerateFromPassword([]byte("TalentPayTrizz2026!"), bcrypt.DefaultCost)
		sarahUser = models.User{
			Role:         models.RoleTalent,
			Name:         "Sarah Jenkins",
			Email:        "sarah@paytrizz.com",
			PasswordHash: string(hash),
			IsActive:     true,
		}
		if err := db.Create(&sarahUser).Error; err == nil {
			rate := 95.0
			sarahTalent := models.Talent{
				UserID:          sarahUser.ID,
				Slug:            "sarah-jenkins",
				Name:            "Sarah Jenkins",
				Headline:        "Staff Product Designer & Design Systems Specialist",
				Bio:             "10+ years crafting scalable enterprise design tokens, intuitive SaaS workflows, and multi-platform mobile interfaces.",
				Location:        "Remote / Singapore",
				YearsExperience: 10,
				HourlyRateUSD:   &rate,
				Availability:    models.AvailabilityAvailable,
				IsPublished:     true,
				IsFeatured:      true,
				SortOrder:       2,
			}
			if err := db.Create(&sarahTalent).Error; err == nil {
				var topBadge models.Badge
				db.Where("`key` = ?", "top-rated").First(&topBadge)
				if topBadge.ID > 0 {
					db.Create(&models.TalentBadge{TalentID: sarahTalent.ID, BadgeID: topBadge.ID, SortOrder: 1})
				}

				var uiSpecialty models.Specialty
				db.Where("`key` = ?", "ui-ux-design").First(&uiSpecialty)
				if uiSpecialty.ID > 0 {
					db.Create(&models.TalentSpecialty{TalentID: sarahTalent.ID, SpecialtyID: uiSpecialty.ID})
				}

				var figmaSkill models.Skill
				db.Where("name = ?", "Figma").First(&figmaSkill)
				if figmaSkill.ID > 0 {
					db.Create(&models.TalentSkill{TalentID: sarahTalent.ID, SkillID: figmaSkill.ID, Proficiency: "expert", Years: 8})
				}
			}
		}
	}

	// 3. Seed Sample Featured Talent: David Chen (Fullstack / Mobile)
	var davidUser models.User
	if err := db.Where("email = ?", "david@paytrizz.com").First(&davidUser).Error; err != nil {
		hash, _ := bcrypt.GenerateFromPassword([]byte("TalentPayTrizz2026!"), bcrypt.DefaultCost)
		davidUser = models.User{
			Role:         models.RoleTalent,
			Name:         "David Chen",
			Email:        "david@paytrizz.com",
			PasswordHash: string(hash),
			IsActive:     true,
		}
		if err := db.Create(&davidUser).Error; err == nil {
			rate := 85.0
			davidTalent := models.Talent{
				UserID:          davidUser.ID,
				Slug:            "david-chen",
				Name:            "David Chen",
				Headline:        "Senior Mobile & Cross-Platform Engineer",
				Bio:             "Building high-performance iOS and Android applications using Flutter, React Native, and native Swift/Kotlin bindings.",
				Location:        "Remote",
				YearsExperience: 6,
				HourlyRateUSD:   &rate,
				Availability:    models.AvailabilityAvailable,
				IsPublished:     true,
				IsFeatured:      true,
				SortOrder:       3,
			}
			if err := db.Create(&davidTalent).Error; err == nil {
				var coreBadge models.Badge
				db.Where("`key` = ?", "core-squad").First(&coreBadge)
				if coreBadge.ID > 0 {
					db.Create(&models.TalentBadge{TalentID: davidTalent.ID, BadgeID: coreBadge.ID, SortOrder: 1})
				}

				var mobSpecialty models.Specialty
				db.Where("`key` = ?", "mobile-apps").First(&mobSpecialty)
				if mobSpecialty.ID > 0 {
					db.Create(&models.TalentSpecialty{TalentID: davidTalent.ID, SpecialtyID: mobSpecialty.ID})
				}

				var flutterSkill models.Skill
				db.Where("name = ?", "Flutter").First(&flutterSkill)
				if flutterSkill.ID > 0 {
					db.Create(&models.TalentSkill{TalentID: davidTalent.ID, SkillID: flutterSkill.ID, Proficiency: "expert", Years: 5})
				}
			}
		}
	}

	log.Println("[Seeder] Talents seeded successfully")
	return nil
}
