package models

import "time"

type TalentExperience struct {
	ID          uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	TalentID    uint64     `gorm:"not null;index" json:"talent_id"`
	RoleTitle      string     `gorm:"type:varchar(120);not null" json:"role_title"`
	Company        string     `gorm:"type:varchar(120);not null" json:"company"`
	EmploymentType string     `gorm:"type:varchar(60);default:''" json:"employment_type"`
	Location       string     `gorm:"type:varchar(100)" json:"location"`
	StartDate      time.Time  `gorm:"not null" json:"start_date"`
	EndDate        *time.Time `json:"end_date"`
	IsCurrent      bool       `gorm:"default:false;not null" json:"is_current"`
	Description    string     `gorm:"type:text" json:"description"`
	SortOrder      int        `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt   time.Time  `json:"created_at"`
	UpdatedAt   time.Time  `json:"updated_at"`
}

func (TalentExperience) TableName() string {
	return "talent_experiences"
}
