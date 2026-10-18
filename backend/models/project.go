package models

import (
	"time"

	"gorm.io/gorm"
)

type Project struct {
	ID           uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug         string         `gorm:"type:varchar(190);uniqueIndex;not null" json:"slug"`
	Title        string         `gorm:"type:varchar(190);not null;index" json:"title"`
	Excerpt      string         `gorm:"type:varchar(300)" json:"excerpt"`
	Content      string         `gorm:"type:longtext" json:"content"`
	CoverMediaID *uint64        `gorm:"index" json:"cover_media_id"`
	CategoryID   *uint64        `gorm:"index" json:"category_id"`
	ClientName   *string        `gorm:"type:varchar(120)" json:"client_name"`
	ProjectURL   *string        `gorm:"type:varchar(255)" json:"project_url"`
	StartedAt    *time.Time     `gorm:"type:date" json:"started_at"`
	CompletedAt  *time.Time     `gorm:"type:date" json:"completed_at"`
	IsCaseStudy  bool           `gorm:"default:false" json:"is_case_study"`
	Challenge    *string        `gorm:"type:text" json:"challenge"`
	Solution     *string        `gorm:"type:text" json:"solution"`
	Result       *string        `gorm:"type:text" json:"result"`
	IsFeatured   bool           `gorm:"default:false;index" json:"is_featured"`
	Status       string         `gorm:"type:varchar(30);default:'draft';index:idx_project_status_published,priority:1" json:"status"`
	AuthorID     uint64         `gorm:"column:created_by;not null;index" json:"created_by"`
	ReviewerID   *uint64        `gorm:"column:reviewed_by;index" json:"reviewed_by"`
	ReviewedAt   *time.Time     `json:"reviewed_at"`
	ReviewNote   *string        `gorm:"type:varchar(500)" json:"review_note"`
	PublishedAt  *time.Time     `gorm:"index:idx_project_status_published,priority:2" json:"published_at"`
	CreatedAt    time.Time      `json:"created_at"`
	UpdatedAt    time.Time      `json:"updated_at"`
	DeletedAt    gorm.DeletedAt `gorm:"index" json:"-"`

	CoverMedia  *Media           `gorm:"foreignKey:CoverMediaID;constraint:OnDelete:SET NULL;" json:"cover_media,omitempty"`
	Category    *ProjectCategory `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL;" json:"category,omitempty"`
	Author      *User            `gorm:"foreignKey:AuthorID" json:"author,omitempty"`
	Reviewer    *User            `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	TalentLinks []ProjectTalent  `gorm:"foreignKey:ProjectID" json:"talent_links,omitempty"`
	Images      []ProjectImage   `gorm:"foreignKey:ProjectID" json:"images,omitempty"`
	Tags        []Tag            `gorm:"many2many:project_tags;" json:"tags,omitempty"`
}

func (Project) TableName() string {
	return "projects"
}
