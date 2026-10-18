package services

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"paytrizz-backend/models"
	"strings"

	"gorm.io/gorm"
)

type UploadService struct {
	db             *gorm.DB
	imageProcessor *ImageProcessor
}

func NewUploadService(db *gorm.DB, imageProcessor *ImageProcessor) *UploadService {
	return &UploadService{
		db:             db,
		imageProcessor: imageProcessor,
	}
}

var validModules = map[models.MediaModule]bool{
	models.MediaModuleSite:        true,
	models.MediaModulePage:        true,
	models.MediaModuleTalent:      true,
	"avatar":                      true,
	"cv":                          true,
	models.MediaModuleService:     true,
	models.MediaModuleProject:     true,
	"projects":                    true,
	models.MediaModuleBlog:        true,
	"posts":                       true,
	"post":                        true,
	models.MediaModuleBadge:       true,
	models.MediaModuleApplication: true,
}

// GenerateRandomFilename generates a URL-safe random string via CSPRNG (24 bytes)
func (s *UploadService) GenerateRandomFilename() (string, error) {
	bytes := make([]byte, 24)
	if _, err := rand.Read(bytes); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(bytes), nil
}

// SaveUploadedFile processes an uploaded multipart file
func (s *UploadService) SaveUploadedFile(fileHeader *multipart.FileHeader, module models.MediaModule, altText *string, uploaderID *uint64) (*models.Media, error) {
	if module == "posts" || module == "post" {
		module = models.MediaModuleBlog
	} else if module == "projects" {
		module = models.MediaModuleProject
	} else if module == "avatar" || module == "cv" {
		module = models.MediaModuleTalent
	}

	if !validModules[module] {
		return nil, errors.New("invalid media module")
	}

	file, err := fileHeader.Open()
	if err != nil {
		return nil, err
	}
	defer file.Close()

	// Read first 512 bytes for MIME detection
	buffer := make([]byte, 512)
	n, err := file.Read(buffer)
	if err != nil && err != io.EOF {
		return nil, err
	}

	detectedMime := http.DetectContentType(buffer[:n])

	// Read full content
	if _, err := file.Seek(0, io.SeekStart); err != nil {
		return nil, err
	}
	content, err := io.ReadAll(file)
	if err != nil {
		return nil, err
	}

	baseDir := filepath.Join("storage", "media", string(module))

	isImage := strings.HasPrefix(detectedMime, "image/")
	isPDF := detectedMime == "application/pdf"

	if !isImage && !isPDF {
		return nil, fmt.Errorf("unsupported file type: %s", detectedMime)
	}

	randomName, err := s.GenerateRandomFilename()
	if err != nil {
		return nil, err
	}

	var mediaRecord models.Media
	mediaRecord.Module = module
	mediaRecord.Mime = detectedMime
	mediaRecord.SizeBytes = int64(len(content))
	mediaRecord.OriginalName = filepath.Base(fileHeader.Filename)
	mediaRecord.AltText = altText
	mediaRecord.UploadedByID = uploaderID

	if module == models.MediaModuleApplication {
		mediaRecord.Visibility = models.MediaVisibilityPrivate
	} else {
		mediaRecord.Visibility = models.MediaVisibilityPublic
	}

	if isImage {
		mediaRecord.Kind = models.MediaKindImage
		origDir := filepath.Join(baseDir, "originals")
		medDir := filepath.Join(baseDir, "medium")
		thumbDir := filepath.Join(baseDir, "thumbnails")

		if err := os.MkdirAll(origDir, 0755); err != nil {
			return nil, err
		}
		if err := os.MkdirAll(medDir, 0755); err != nil {
			return nil, err
		}
		if err := os.MkdirAll(thumbDir, 0755); err != nil {
			return nil, err
		}

		origPath := filepath.Join(origDir, randomName+".webp")
		medPath := filepath.Join(medDir, randomName+".webp")
		thumbPath := filepath.Join(thumbDir, randomName+".webp")

		width, height, err := s.imageProcessor.ProcessAndSaveImage(content, origPath, medPath, thumbPath)
		if err != nil {
			return nil, err
		}

		mediaRecord.Width = &width
		mediaRecord.Height = &height
		// Standardized relative path for web serving
		origRel := "/" + filepath.ToSlash(origPath)
		medRel := "/" + filepath.ToSlash(medPath)
		thumbRel := "/" + filepath.ToSlash(thumbPath)

		mediaRecord.PathOriginal = origRel
		mediaRecord.PathMedium = &medRel
		mediaRecord.PathThumb = &thumbRel
	} else {
		mediaRecord.Kind = models.MediaKindDocument
		attachDir := filepath.Join(baseDir, "attachments")
		if err := os.MkdirAll(attachDir, 0755); err != nil {
			return nil, err
		}

		docPath := filepath.Join(attachDir, randomName+".pdf")
		if err := os.WriteFile(docPath, content, 0644); err != nil {
			return nil, err
		}

		docRel := "/" + filepath.ToSlash(docPath)
		mediaRecord.PathOriginal = docRel
		mediaRecord.PathFile = &docRel
	}

	if err := s.db.Create(&mediaRecord).Error; err != nil {
		return nil, err
	}

	return &mediaRecord, nil
}

// DeleteMedia deletes media record and all physical files from disk
func (s *UploadService) DeleteMedia(id uint64) error {
	var media models.Media
	if err := s.db.First(&media, id).Error; err != nil {
		return err
	}

	// Remove physical files
	if media.PathOriginal != "" {
		_ = os.Remove("." + media.PathOriginal)
	}
	if media.PathMedium != nil && *media.PathMedium != "" {
		_ = os.Remove("." + *media.PathMedium)
	}
	if media.PathThumb != nil && *media.PathThumb != "" {
		_ = os.Remove("." + *media.PathThumb)
	}
	if media.PathFile != nil && *media.PathFile != "" {
		_ = os.Remove("." + *media.PathFile)
	}

	return s.db.Delete(&media).Error
}
