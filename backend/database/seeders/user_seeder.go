package seeders

import (
	"log"
	"paytrizz-backend/config"
	"paytrizz-backend/models"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type UserSeeder struct{}

func NewUserSeeder() *UserSeeder {
	return &UserSeeder{}
}

func (s *UserSeeder) Run(db *gorm.DB) error {
	cfg := config.AppConfig

	// 1. Admin User
	var existingAdmin models.User
	if err := db.Where("email = ?", cfg.SeedAdminEmail).First(&existingAdmin).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			adminHash, _ := bcrypt.GenerateFromPassword([]byte(cfg.SeedAdminPassword), 12)
			admin := models.User{
				Role:               models.RoleAdmin,
				Name:               "PayTrizz Admin",
				Email:              cfg.SeedAdminEmail,
				PasswordHash:       string(adminHash),
				IsActive:           true,
				MustChangePassword: false,
			}
			if err := db.Create(&admin).Error; err != nil {
				return err
			}
			log.Printf("[Seeder] Created default admin user: %s", cfg.SeedAdminEmail)
		}
	}

	// 2. Founder Talent User (separate account with RoleTalent as required by PRD 2)
	var existingFounder models.User
	if err := db.Where("email = ?", cfg.SeedFounderEmail).First(&existingFounder).Error; err != nil {
		if err == gorm.ErrRecordNotFound {
			founderHash, _ := bcrypt.GenerateFromPassword([]byte(cfg.SeedFounderPassword), 12)
			founder := models.User{
				Role:               models.RoleTalent,
				Name:               "Syahrul (Founder)",
				Email:              cfg.SeedFounderEmail,
				PasswordHash:       string(founderHash),
				IsActive:           true,
				MustChangePassword: false,
			}
			if err := db.Create(&founder).Error; err != nil {
				return err
			}
			log.Printf("[Seeder] Created default founder talent user: %s", cfg.SeedFounderEmail)
		}
	}

	return nil
}
