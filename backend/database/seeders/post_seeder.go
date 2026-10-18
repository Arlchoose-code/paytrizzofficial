package seeders

import (
	"log"
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

func SeedPosts(db *gorm.DB) error {
	var admin models.User
	if err := db.Where("role = ?", "admin").First(&admin).Error; err != nil {
		return nil
	}

	var catEng models.PostCategory
	db.Where("slug = ?", "engineering").First(&catEng)

	var catDesign models.PostCategory
	db.Where("slug = ?", "product-design").First(&catDesign)

	var catAgency models.PostCategory
	db.Where("slug = ?", "agency-insights").First(&catAgency)

	var talentSyahrul models.Talent
	db.Where("slug = ?", "syahrul").First(&talentSyahrul)

	var talentSarah models.Talent
	db.Where("slug = ?", "sarah-jenkins").First(&talentSarah)

	now := time.Now()

	posts := []struct {
		post     models.Post
		tagSlugs []string
	}{
		{
			post: models.Post{
				Slug:           "scaling-go-microservices-25k-tps",
				Title:          "Scaling Go Microservices to 25k TPS: Lessons from FinScale",
				Excerpt:        "A deep architectural dive into actor patterns, zero-allocation buffers, and lock-free concurrency in modern Golang systems.",
				Content:        "<p>When constructing systems that process billions in transactions daily, standard HTTP request-response paradigms introduce unpredictable garbage collection pauses. Here is how our engineering squad tackled sub-40ms latency constraints.</p><h2>1. Eliminating Lock Contention</h2><p>By leveraging channel-based worker rings instead of shared mutexes, CPU cache coherency stays optimal across multi-core server instances.</p><h2>2. Zero Allocation Buffers</h2><p>Reusing byte slices via <code>sync.Pool</code> reduced memory churn and prevented major GC stop-the-world spikes during sudden market volume rallies.</p>",
				CategoryID:     &catEng.ID,
				AuthorTalentID: &talentSyahrul.ID,
				ReadingMinutes: 7,
				Status:         "published",
				AuthorID:       admin.ID,
				PublishedAt:    &now,
			},
			tagSlugs: []string{"golang", "high-concurrency", "postgresql"},
		},
		{
			post: models.Post{
				Slug:           "why-multi-brand-design-systems-fail",
				Title:          "Why Multi-Brand Design Systems Fail (And How to Prevent It)",
				Excerpt:        "Design tokens are only half the battle. Discover how cross-functional governance prevents component drift across 14 products.",
				Content:        "<p>Design systems frequently suffer from component bloat when engineers and designers bypass the central registry for custom one-off solutions.</p><h2>Contextual Tokens over Raw Hexes</h2><p>Never expose primitive hex values to consuming teams. Always define semantic roles: <code>action-primary-hover</code>, <code>surface-elevated</code>, and <code>feedback-critical</code>.</p>",
				CategoryID:     &catDesign.ID,
				AuthorTalentID: &talentSarah.ID,
				ReadingMinutes: 5,
				Status:         "published",
				AuthorID:       admin.ID,
				PublishedAt:    &now,
			},
			tagSlugs: []string{"design-system", "figma", "react"},
		},
		{
			post: models.Post{
				Slug:           "modern-agency-model-embedded-specialists",
				Title:          "The Modern Agency Model: Embedded Specialist Squads vs Body Shopping",
				Excerpt:        "Why high-growth tech firms are abandoning traditional staffing agencies in favor of autonomous, senior-led product squads.",
				Content:        "<p>Hiring developers through generic IT staffing agencies often results in slow onboarding and mismatched skillsets. At PayTrizz, we provide autonomous squads pre-calibrated to start shipping code on Day One.</p>",
				CategoryID:     &catAgency.ID,
				AuthorTalentID: nil, // Displays "PayTrizz Team"
				ReadingMinutes: 4,
				Status:         "published",
				AuthorID:       admin.ID,
				PublishedAt:    &now,
			},
			tagSlugs: []string{"nextjs", "typescript"},
		},
	}

	for _, item := range posts {
		var existing models.Post
		if err := db.Where("slug = ?", item.post.Slug).First(&existing).Error; err != nil {
			if err := db.Create(&item.post).Error; err != nil {
				log.Printf("Failed to seed post %s: %v", item.post.Title, err)
				continue
			}
			// Link tags
			for _, ts := range item.tagSlugs {
				var tag models.Tag
				if err := db.Where("slug = ?", ts).First(&tag).Error; err == nil {
					db.Create(&models.PostTag{PostID: item.post.ID, TagID: tag.ID})
				}
			}
		}
	}

	log.Println("Posts seeded successfully.")
	return nil
}
