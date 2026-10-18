package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type ServiceSeeder struct{}

func NewServiceSeeder() *ServiceSeeder {
	return &ServiceSeeder{}
}

func (s *ServiceSeeder) Run(db *gorm.DB) error {
	services := []models.Service{
		{
			Title:       "Web Development",
			Slug:        "web-development",
			Description: "Full-stack scalable web applications using Golang, Next.js, React, and cloud architectures.",
			Icon:        "code",
			SortOrder:   1,
			IsActive:    true,
		},
		{
			Title:       "UI/UX Design",
			Slug:        "ui-ux-design",
			Description: "Human-centered digital product interfaces, comprehensive design systems, and rapid prototyping.",
			Icon:        "palette",
			SortOrder:   2,
			IsActive:    true,
		},
		{
			Title:       "Mobile Apps",
			Slug:        "mobile-apps",
			Description: "Native iOS and Android applications with cross-platform excellence and responsive backends.",
			Icon:        "smartphone",
			SortOrder:   3,
			IsActive:    true,
		},
		{
			Title:       "Video & Motion",
			Slug:        "video-and-motion",
			Description: "High-impact brand storytelling, 2D/3D motion graphics, and commercial video post-production.",
			Icon:        "video",
			SortOrder:   4,
			IsActive:    true,
		},
		{
			Title:       "Digital Marketing",
			Slug:        "digital-marketing",
			Description: "Performance marketing, conversion rate optimization, and organic SEO growth strategies.",
			Icon:        "trending-up",
			SortOrder:   5,
			IsActive:    true,
		},
		{
			Title:       "Content & Copywriting",
			Slug:        "content-and-copywriting",
			Description: "Compelling brand messaging, technical documentation, and conversion-focused copy.",
			Icon:        "file-text",
			SortOrder:   6,
			IsActive:    true,
		},
	}

	for _, srv := range services {
		var existing models.Service
		err := db.Where("slug = ?", srv.Slug).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&srv).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Services seeded successfully")
	return nil
}
