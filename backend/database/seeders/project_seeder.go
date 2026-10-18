package seeders

import (
	"log"
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

func SeedProjects(db *gorm.DB) error {
	var admin models.User
	if err := db.Where("role = ?", "admin").First(&admin).Error; err != nil {
		return nil
	}

	var catWeb models.ProjectCategory
	db.Where("slug = ?", "web-saas").First(&catWeb)

	var catMobile models.ProjectCategory
	db.Where("slug = ?", "mobile-apps").First(&catMobile)

	var catDesign models.ProjectCategory
	db.Where("slug = ?", "design-systems").First(&catDesign)

	var talentSyahrul models.Talent
	db.Where("slug = ?", "syahrul").First(&talentSyahrul)

	var talentSarah models.Talent
	db.Where("slug = ?", "sarah-jenkins").First(&talentSarah)

	var talentDavid models.Talent
	db.Where("slug = ?", "david-chen").First(&talentDavid)

	now := time.Now()
	client1 := "FinScale Technologies Ltd"
	url1 := "https://finscale.example.com"
	chal1 := "Legacy monolithic banking infrastructure was dropping transactions at peak market volumes (>15,000 TPS) with intolerable 800ms latencies."
	sol1 := "Engineered an event-driven Go microservices architecture paired with high-performance Next.js 16 operational telemetry dashboards."
	res1 := "Achieved 99.999% platform availability, guaranteed sub-40ms settlements across 25,000 TPS, and slashed cloud infrastructure overhead by 55%."

	client2 := "Aura Health Inc"
	url2 := "https://aurahealth.example.com"
	chal2 := "Frequent Bluetooth Low Energy (BLE) disconnections and high battery drain across fragmented Android vendor chipsets."
	sol2 := "Built custom Flutter isolates with low-level C++ background threads handling uninterrupted biometrics telemetry streaming."
	res2 := "Zero telemetry packet loss, 4.9 App Store rating across 250,000+ active patients, and 3x longer smartphone battery runtime."

	projects := []struct {
		project models.Project
		talents []models.ProjectTalent
		tagSlugs []string
	}{
		{
			project: models.Project{
				Slug:        "finscale-enterprise-core-banking-engine",
				Title:       "FinScale Enterprise Core Banking Engine",
				Excerpt:     "High-concurrency financial settlement engine processing 25,000 transactions per second with sub-40ms end-to-end latency.",
				Content:     "<p>PayTrizz engineered an institutional-grade financial infrastructure for FinScale, replacing fragile legacy systems with an ultra-responsive distributed core.</p><h3>Key Milestones</h3><ul><li>Sub-40ms distributed transaction processing</li><li>Zero-downtime rolling deployments via immutable containers</li><li>Comprehensive audit trail compliance with ISO 27001 standards</li></ul>",
				CategoryID:  &catWeb.ID,
				ClientName:  &client1,
				ProjectURL:  &url1,
				IsCaseStudy: true,
				Challenge:   &chal1,
				Solution:    &sol1,
				Result:      &res1,
				IsFeatured:  true,
				Status:      "published",
				AuthorID:    admin.ID,
				PublishedAt: &now,
			},
			talents: []models.ProjectTalent{
				{TalentID: talentSyahrul.ID, RoleLabel: "Chief Systems Architect", SortOrder: 1},
				{TalentID: talentSarah.ID, RoleLabel: "Staff UX Designer", SortOrder: 2},
			},
			tagSlugs: []string{"golang", "nextjs", "high-concurrency", "postgresql"},
		},
		{
			project: models.Project{
				Slug:        "aura-health-biometrics-mobile-app",
				Title:       "Aura Health & Biometrics Mobile App",
				Excerpt:     "Cross-platform medical companion application delivering continuous real-time physiological telemetry streaming.",
				Content:     "<p>Designed and built from scratch for HIPAA-compliant clinical monitoring, Aura connects wearable biometrics directly with emergency medical response networks.</p>",
				CategoryID:  &catMobile.ID,
				ClientName:  &client2,
				ProjectURL:  &url2,
				IsCaseStudy: true,
				Challenge:   &chal2,
				Solution:    &sol2,
				Result:      &res2,
				IsFeatured:  true,
				Status:      "published",
				AuthorID:    admin.ID,
				PublishedAt: &now,
			},
			talents: []models.ProjectTalent{
				{TalentID: talentDavid.ID, RoleLabel: "Lead Mobile Architect", SortOrder: 1},
			},
			tagSlugs: []string{"flutter", "mobile", "typescript"},
		},
		{
			project: models.Project{
				Slug:        "vortex-b2b-saas-design-system",
				Title:       "Vortex B2B Multi-Brand Design System",
				Excerpt:     "Unified enterprise component library and token pipeline powering 14 core cloud products across multi-platform teams.",
				Content:     "<p>A single source of truth for 40+ engineering squads, creating coherent visual language, AA accessible contrasts, and instant dark mode adaptation.</p>",
				CategoryID:  &catDesign.ID,
				IsCaseStudy: false,
				IsFeatured:  true,
				Status:      "published",
				AuthorID:    admin.ID,
				PublishedAt: &now,
			},
			talents: []models.ProjectTalent{
				{TalentID: talentSarah.ID, RoleLabel: "Staff Design Systems Specialist", SortOrder: 1},
			},
			tagSlugs: []string{"design-system", "figma", "react"},
		},
	}

	for _, item := range projects {
		var existing models.Project
		if err := db.Where("slug = ?", item.project.Slug).First(&existing).Error; err != nil {
			if err := db.Create(&item.project).Error; err != nil {
				log.Printf("Failed to seed project %s: %v", item.project.Title, err)
				continue
			}
			// Link talents
			for _, pt := range item.talents {
				if pt.TalentID > 0 {
					pt.ProjectID = item.project.ID
					db.Create(&pt)
				}
			}
			// Link tags
			for _, ts := range item.tagSlugs {
				var tag models.Tag
				if err := db.Where("slug = ?", ts).First(&tag).Error; err == nil {
					db.Create(&models.ProjectTag{ProjectID: item.project.ID, TagID: tag.ID})
				}
			}
		}
	}

	log.Println("Projects seeded successfully.")
	return nil
}
