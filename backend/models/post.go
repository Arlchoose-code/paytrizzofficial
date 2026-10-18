package models

import (
	"time"

	"gorm.io/gorm"
)

type Post struct {
	ID             uint64         `gorm:"primaryKey;autoIncrement" json:"id"`
	Slug           string         `gorm:"type:varchar(190);uniqueIndex;not null" json:"slug"`
	Title          string         `gorm:"type:varchar(190);not null;index" json:"title"`
	Excerpt        string         `gorm:"type:varchar(300)" json:"excerpt"`
	Content        string         `gorm:"type:longtext" json:"content"`
	CoverMediaID   *uint64        `gorm:"index" json:"cover_media_id"`
	CategoryID     *uint64        `gorm:"index" json:"category_id"`
	AuthorTalentID *uint64        `gorm:"index" json:"author_talent_id"`
	ReadingMinutes int            `gorm:"default:3" json:"reading_minutes"`
	Status         string         `gorm:"type:varchar(30);default:'draft';index:idx_post_status_published,priority:1" json:"status"`
	AuthorID       uint64         `gorm:"column:created_by;not null;index" json:"created_by"`
	ReviewerID     *uint64        `gorm:"column:reviewed_by;index" json:"reviewed_by"`
	ReviewedAt     *time.Time     `json:"reviewed_at"`
	ReviewNote     *string        `gorm:"type:varchar(500)" json:"review_note"`
	PublishedAt    *time.Time     `gorm:"index:idx_post_status_published,priority:2" json:"published_at"`
	CreatedAt      time.Time      `json:"created_at"`
	UpdatedAt      time.Time      `json:"updated_at"`
	DeletedAt      gorm.DeletedAt `gorm:"index" json:"-"`

	CoverMedia   *Media        `gorm:"foreignKey:CoverMediaID;constraint:OnDelete:SET NULL;" json:"cover_media,omitempty"`
	Category     *PostCategory `gorm:"foreignKey:CategoryID;constraint:OnDelete:SET NULL;" json:"category,omitempty"`
	AuthorTalent *Talent       `gorm:"foreignKey:AuthorTalentID;constraint:OnDelete:SET NULL;" json:"author_talent,omitempty"`
	AuthorUser   *User         `gorm:"foreignKey:AuthorID" json:"author_user,omitempty"`
	Reviewer     *User         `gorm:"foreignKey:ReviewerID" json:"reviewer,omitempty"`
	Tags         []Tag         `gorm:"many2many:post_tags;" json:"tags,omitempty"`
}

func (Post) TableName() string {
	return "posts"
}
