package models

import "time"

type PageSectionType string

const (
	SectionHero             PageSectionType = "hero"
	SectionStats            PageSectionType = "stats"
	SectionTextImage        PageSectionType = "text_image"
	SectionServicesGrid     PageSectionType = "services_grid"
	SectionSteps            PageSectionType = "steps"
	SectionTalentsFeatured  PageSectionType = "talents_featured"
	SectionProjectsFeatured PageSectionType = "projects_featured"
	SectionCaseStudy        PageSectionType = "case_study"
	SectionBlogLatest       PageSectionType = "blog_latest"
	SectionFAQ              PageSectionType = "faq"
	SectionCTA              PageSectionType = "cta"
	SectionGallery          PageSectionType = "gallery"
	SectionRichText         PageSectionType = "richtext"
)

type PageSection struct {
	ID        uint64          `gorm:"primaryKey;autoIncrement" json:"id"`
	PageID    uint64          `gorm:"not null;uniqueIndex:idx_page_key,priority:1" json:"page_id"`
	Key       string          `gorm:"type:varchar(60);not null;uniqueIndex:idx_page_key,priority:2" json:"key"`
	Type      PageSectionType `gorm:"type:varchar(30);not null" json:"type"`
	Content   string          `gorm:"type:json;not null" json:"content"`
	SortOrder int             `gorm:"default:0;not null" json:"sort_order"`
	IsVisible bool            `gorm:"default:true;not null" json:"is_visible"`
	CreatedAt time.Time       `json:"created_at"`
	UpdatedAt time.Time       `json:"updated_at"`
}

func (PageSection) TableName() string {
	return "page_sections"
}
