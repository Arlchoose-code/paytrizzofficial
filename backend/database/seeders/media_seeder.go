package seeders

import (
	"log"
	"os"
	"path/filepath"
	"paytrizz-backend/models"
	"paytrizz-backend/services"

	"gorm.io/gorm"
)

type MediaSeeder struct {
	imageProcessor *services.ImageProcessor
}

func NewMediaSeeder(imageProcessor *services.ImageProcessor) *MediaSeeder {
	return &MediaSeeder{imageProcessor: imageProcessor}
}

func (s *MediaSeeder) Run(db *gorm.DB) error {
	var count int64
	db.Model(&models.Media{}).Where("module = ? AND original_name LIKE ?", models.MediaModuleSite, "Logo%").Count(&count)
	if count > 0 {
		return nil
	}

	// Look for logo file in parent directory or current directory
	candidates := []string{
		"../Logo PayTrizz fix-02.png",
		"./Logo PayTrizz fix-02.png",
	}

	var logoBytes []byte
	var foundPath string
	for _, p := range candidates {
		data, err := os.ReadFile(p)
		if err == nil {
			logoBytes = data
			foundPath = p
			break
		}
	}

	if len(logoBytes) == 0 {
		log.Println("[Seeder] Logo PayTrizz fix-02.png not found, skipping media logo seed")
		return nil
	}

	baseDir := filepath.Join("storage", "media", "site")
	origDir := filepath.Join(baseDir, "originals")
	medDir := filepath.Join(baseDir, "medium")
	thumbDir := filepath.Join(baseDir, "thumbnails")

	_ = os.MkdirAll(origDir, 0755)
	_ = os.MkdirAll(medDir, 0755)
	_ = os.MkdirAll(thumbDir, 0755)

	origFile := filepath.Join(origDir, "brand_logo_main.webp")
	medFile := filepath.Join(medDir, "brand_logo_main.webp")
	thumbFile := filepath.Join(thumbDir, "brand_logo_main.webp")

	width, height, err := s.imageProcessor.ProcessAndSaveImage(logoBytes, origFile, medFile, thumbFile)
	if err != nil {
		log.Printf("[Seeder] Failed to process logo into WebP: %v", err)
		return nil
	}

	pathOrig := "/" + filepath.ToSlash(origFile)
	pathMed := "/" + filepath.ToSlash(medFile)
	pathThumb := "/" + filepath.ToSlash(thumbFile)
	alt := "PayTrizz Logo"

	mediaRecord := models.Media{
		Module:       models.MediaModuleSite,
		Kind:         models.MediaKindImage,
		Visibility:   models.MediaVisibilityPublic,
		Mime:         "image/webp",
		SizeBytes:    int64(len(logoBytes)),
		OriginalName: filepath.Base(foundPath),
		AltText:      &alt,
		Width:        &width,
		Height:       &height,
		PathOriginal: pathOrig,
		PathMedium:   &pathMed,
		PathThumb:    &pathThumb,
	}

	if err := db.Create(&mediaRecord).Error; err != nil {
		return err
	}

	log.Printf("[Seeder] Successfully imported brand logo to media (ID: %d)", mediaRecord.ID)
	return nil
}
