package models

import "time"

type AvailabilityStatus string

const (
	AvailabilityAvailable   AvailabilityStatus = "available"
	AvailabilityLimited     AvailabilityStatus = "limited"
	AvailabilityUnavailable AvailabilityStatus = "unavailable"
)

type Talent struct {
	ID              uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	UserID          uint64             `gorm:"uniqueIndex;not null" json:"user_id"`
	User            *User              `gorm:"foreignKey:UserID;constraint:OnDelete:CASCADE" json:"user,omitempty"`
	Slug            string             `gorm:"type:varchar(180);uniqueIndex;not null" json:"slug"`
	Name            string             `gorm:"type:varchar(120);not null" json:"name"`
	Headline        string             `gorm:"type:varchar(190);not null" json:"headline"`
	Bio             string             `gorm:"type:text" json:"bio"`
	AvatarMediaID   *uint64            `json:"avatar_media_id"`
	AvatarMedia     *Media             `gorm:"foreignKey:AvatarMediaID;constraint:OnDelete:SET NULL" json:"avatar_media,omitempty"`
	CVMediaID       *uint64            `json:"cv_media_id"`
	CVMedia         *Media             `gorm:"foreignKey:CVMediaID;constraint:OnDelete:SET NULL" json:"cv_media,omitempty"`
	Location        string             `gorm:"type:varchar(100);default:'Remote'" json:"location"`
	YearsExperience int                `gorm:"default:0;not null" json:"years_experience"`
	HourlyRateUSD   *float64           `json:"hourly_rate_usd"`
	Availability    AvailabilityStatus `gorm:"type:varchar(20);default:'available';not null" json:"availability"`
	CVIsPublic      bool               `gorm:"default:false;not null" json:"cv_is_public"`
	ContactEnabled  bool               `gorm:"default:true;not null" json:"contact_enabled"`
	IsPublished     bool               `gorm:"default:false;not null;index" json:"is_published"`
	IsFeatured      bool               `gorm:"default:false;not null" json:"is_featured"`
	SortOrder       int                `gorm:"default:0;not null" json:"sort_order"`

	// Associations
	Badges      []Badge            `gorm:"many2many:talent_badges;joinForeignKey:TalentID;joinReferences:BadgeID" json:"badges,omitempty"`
	Specialties []Specialty        `gorm:"many2many:talent_specialties;joinForeignKey:TalentID;joinReferences:SpecialtyID" json:"specialties,omitempty"`
	Skills      []TalentSkill      `gorm:"foreignKey:TalentID;constraint:OnDelete:CASCADE" json:"skills,omitempty"`
	Experiences []TalentExperience `gorm:"foreignKey:TalentID;constraint:OnDelete:CASCADE" json:"experiences,omitempty"`
	Educations  []TalentEducation  `gorm:"foreignKey:TalentID;constraint:OnDelete:CASCADE" json:"educations,omitempty"`
	Certificates []TalentCertificate `gorm:"foreignKey:TalentID;constraint:OnDelete:CASCADE" json:"certificates,omitempty"`
	Links       []TalentLink       `gorm:"foreignKey:TalentID;constraint:OnDelete:CASCADE" json:"links,omitempty"`

	CreatedAt time.Time `json:"created_at"`
	UpdatedAt time.Time `json:"updated_at"`
}

func (Talent) TableName() string {
	return "talents"
}
