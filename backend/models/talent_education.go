package models

import "time"

type TalentEducation struct {
	ID           uint64    `gorm:"primaryKey;autoIncrement" json:"id"`
	TalentID     uint64    `gorm:"not null;index" json:"talent_id"`
	Institution  string    `gorm:"type:varchar(150);not null" json:"institution"`
	Degree       string    `gorm:"type:varchar(100);not null" json:"degree"`
	FieldOfStudy string    `gorm:"type:varchar(100);not null" json:"field_of_study"`
	StartYear    int       `gorm:"not null" json:"start_year"`
	EndYear      *int      `json:"end_year"`
	Grade        string    `gorm:"type:varchar(60)" json:"grade"`
	Activities   string    `gorm:"type:text" json:"activities"`
	Description  string    `gorm:"type:text" json:"description"`
	Skills       string    `gorm:"type:text" json:"skills"`
	Media        string    `gorm:"type:text" json:"media"`
	SortOrder    int       `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt    time.Time `json:"created_at"`
	UpdatedAt    time.Time `json:"updated_at"`
}

func (TalentEducation) TableName() string {
	return "talent_educations"
}
