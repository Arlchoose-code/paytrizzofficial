package services

import (
	"fmt"
	"regexp"
	"strings"

	"gorm.io/gorm"
)

type SlugService struct {
	db *gorm.DB
}

func NewSlugService(db *gorm.DB) *SlugService {
	return &SlugService{db: db}
}

var nonAlphaNum = regexp.MustCompile(`[^a-z0-9]+`)

// Slugify converts arbitrary string to clean lowercase URL-safe slug
func (s *SlugService) Slugify(title string) string {
	slug := strings.ToLower(strings.TrimSpace(title))
	slug = nonAlphaNum.ReplaceAllString(slug, "-")
	slug = strings.Trim(slug, "-")
	if slug == "" {
		slug = "content"
	}
	return slug
}

// GenerateUniqueSlug ensures slug is unique in target table by appending integer counter
func (s *SlugService) GenerateUniqueSlug(tableName, baseTitle string, currentID *uint64) string {
	baseSlug := s.Slugify(baseTitle)
	slug := baseSlug
	counter := 1

	for {
		var count int64
		query := s.db.Table(tableName).Where("slug = ?", slug)
		if currentID != nil {
			query = query.Where("id != ?", *currentID)
		}
		query.Count(&count)

		if count == 0 {
			break
		}

		counter++
		slug = fmt.Sprintf("%s-%d", baseSlug, counter)
	}

	return slug
}
