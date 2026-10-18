package models

import (
	"time"
)

type MediaModule string

const (
	MediaModuleSite        MediaModule = "site"
	MediaModulePage        MediaModule = "page"
	MediaModuleTalent      MediaModule = "talent"
	MediaModuleService     MediaModule = "service"
	MediaModuleProject     MediaModule = "project"
	MediaModuleBlog        MediaModule = "blog"
	MediaModuleBadge       MediaModule = "badge"
	MediaModuleApplication MediaModule = "application"
)

type MediaKind string

const (
	MediaKindImage    MediaKind = "image"
	MediaKindDocument MediaKind = "document"
)

type MediaVisibility string

const (
	MediaVisibilityPublic  MediaVisibility = "public"
	MediaVisibilityPrivate MediaVisibility = "private"
)

type Media struct {
	ID           uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	Module       MediaModule     `gorm:"type:varchar(30);not null;index" json:"module"`
	Kind         MediaKind       `gorm:"type:varchar(20);not null" json:"kind"`
	Visibility   MediaVisibility `gorm:"type:varchar(20);default:'public';not null" json:"visibility"`
	Mime         string          `gorm:"type:varchar(100);not null" json:"mime"`
	SizeBytes    int64           `gorm:"not null" json:"size_bytes"`
	OriginalName string          `gorm:"type:varchar(255);not null" json:"original_name"`
	AltText      *string         `gorm:"type:varchar(255)" json:"alt_text"`
	Width        *int            `json:"width"`
	Height       *int            `json:"height"`
	PathOriginal string          `gorm:"type:varchar(255);not null" json:"path_original"`
	PathMedium   *string         `gorm:"type:varchar(255)" json:"path_medium"`
	PathThumb    *string         `gorm:"type:varchar(255)" json:"path_thumb"`
	PathFile     *string         `gorm:"type:varchar(255)" json:"path_file"`
	UploadedByID *uint64         `json:"uploaded_by"`
	UploadedBy   *User           `gorm:"foreignKey:UploadedByID;constraint:OnDelete:SET NULL" json:"-"`
	CreatedAt    time.Time       `json:"created_at"`
	UpdatedAt    time.Time       `json:"updated_at"`
}

func (Media) TableName() string {
	return "media"
}
