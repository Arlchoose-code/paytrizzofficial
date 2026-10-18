package services

import (
	"bytes"
	"fmt"
	"image"
	"os"

	"github.com/KarpelesLab/gowebp"
	"github.com/disintegration/imaging"
)

type ImageProcessor struct{}

func NewImageProcessor() *ImageProcessor {
	return &ImageProcessor{}
}

// ProcessAndSaveImage decodes source image data, calculates dimensions, and writes originals, medium, and thumbnails as WebP
func (p *ImageProcessor) ProcessAndSaveImage(data []byte, origPath, medPath, thumbPath string) (width, height int, err error) {
	img, err := imaging.Decode(bytes.NewReader(data))
	if err != nil {
		return 0, 0, fmt.Errorf("failed to decode image: %w", err)
	}

	bounds := img.Bounds()
	width = bounds.Dx()
	height = bounds.Dy()

	// 1. Originals: Convert to WebP high quality
	origFile, err := os.Create(origPath)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to create original webp file: %w", err)
	}
	defer origFile.Close()

	if err := gowebp.Encode(origFile, img, &gowebp.Options{Lossy: true, Quality: 85}); err != nil {
		return 0, 0, fmt.Errorf("failed to encode original webp: %w", err)
	}

	// 2. Medium (max width 800px)
	var medImg image.Image
	if width > 800 {
		medImg = imaging.Resize(img, 800, 0, imaging.Lanczos)
	} else {
		medImg = img
	}

	medFile, err := os.Create(medPath)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to create medium webp file: %w", err)
	}
	defer medFile.Close()

	if err := gowebp.Encode(medFile, medImg, &gowebp.Options{Lossy: true, Quality: 80}); err != nil {
		return 0, 0, fmt.Errorf("failed to encode medium webp: %w", err)
	}

	// 3. Thumbnail (max width 300px)
	var thumbImg image.Image
	if width > 300 {
		thumbImg = imaging.Resize(img, 300, 0, imaging.Lanczos)
	} else {
		thumbImg = img
	}

	thumbFile, err := os.Create(thumbPath)
	if err != nil {
		return 0, 0, fmt.Errorf("failed to create thumbnail webp file: %w", err)
	}
	defer thumbFile.Close()

	if err := gowebp.Encode(thumbFile, thumbImg, &gowebp.Options{Lossy: true, Quality: 75}); err != nil {
		return 0, 0, fmt.Errorf("failed to encode thumbnail webp: %w", err)
	}

	return width, height, nil
}
