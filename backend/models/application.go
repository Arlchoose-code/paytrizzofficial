package models

import (
	"time"
)

type Application struct {
	ID           uint64            `gorm:"primaryKey;autoIncrement" json:"id"`
	TicketCode   string            `gorm:"type:varchar(20);uniqueIndex;not null" json:"ticket_code"`
	Type         string            `gorm:"type:enum('freelance','project');not null;index:idx_app_type_stat_date,priority:1" json:"type"`
	FullName     string            `gorm:"type:varchar(120);not null" json:"full_name"`
	Email        string            `gorm:"type:varchar(190);not null" json:"email"`
	Phone        *string           `gorm:"type:varchar(30)" json:"phone"`
	CompanyName  *string           `gorm:"type:varchar(120)" json:"company_name"`
	Title        *string           `gorm:"type:varchar(190)" json:"title"`
	Message      string            `gorm:"type:text;not null" json:"message"`
	PortfolioURL *string           `gorm:"type:varchar(255)" json:"portfolio_url"`
	SpecialtyID  *uint64           `gorm:"index" json:"specialty_id"`
	Specialty    *Specialty        `gorm:"foreignKey:SpecialtyID;constraint:OnDelete:SET NULL" json:"specialty,omitempty"`
	BudgetRange  *string           `gorm:"type:varchar(60)" json:"budget_range"`
	Timeline     *string           `gorm:"type:varchar(60)" json:"timeline"`
	Status       string            `gorm:"type:enum('new','reviewing','shortlisted','accepted','rejected','archived');default:'new';not null;index:idx_app_type_stat_date,priority:2" json:"status"`
	AdminNotes   *string           `gorm:"type:text" json:"admin_notes"`
	HandledBy    *uint64           `gorm:"index" json:"handled_by"`
	Handler      *User             `gorm:"foreignKey:HandledBy;constraint:OnDelete:SET NULL" json:"handler,omitempty"`
	ReviewedAt   *time.Time        `json:"reviewed_at"`
	IP           string            `gorm:"type:varchar(45);not null" json:"ip"`
	UserAgent    string            `gorm:"type:varchar(255);not null" json:"user_agent"`
	CreatedAt    time.Time         `gorm:"index:idx_app_type_stat_date,priority:3" json:"created_at"`
	UpdatedAt    time.Time         `json:"updated_at"`
	Files        []ApplicationFile `gorm:"foreignKey:ApplicationID;constraint:OnDelete:CASCADE" json:"files,omitempty"`
}

func (Application) TableName() string {
	return "applications"
}
