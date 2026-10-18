package structs

import (
	"time"
)

type ApplicationCreateRequest struct {
	Type         string   `json:"type" binding:"required,oneof=freelance project"`
	FullName     string   `json:"full_name" binding:"required,min=2,max=120"`
	Email        string   `json:"email" binding:"required,email,max=190"`
	Phone        *string  `json:"phone" binding:"omitempty,max=30"`
	CompanyName  *string  `json:"company_name" binding:"omitempty,max=120"`
	Title        *string  `json:"title" binding:"omitempty,max=190"`
	Message      string   `json:"message" binding:"required,min=10,max=5000"`
	PortfolioURL *string  `json:"portfolio_url" binding:"omitempty,url,max=255"`
	SpecialtyID  *uint64  `json:"specialty_id"`
	BudgetRange  *string  `json:"budget_range" binding:"omitempty,max=60"`
	Timeline     *string  `json:"timeline" binding:"omitempty,max=60"`
	MediaIDs     []uint64 `json:"media_ids" binding:"omitempty"`
}

type ApplicationStatusUpdateRequest struct {
	Status     string  `json:"status" binding:"required,oneof=new reviewing shortlisted accepted rejected archived"`
	AdminNotes *string `json:"admin_notes"`
}

type ApplicationResponse struct {
	ID           uint64                    `json:"id"`
	TicketCode   string                    `json:"ticket_code"`
	Type         string                    `json:"type"`
	FullName     string                    `json:"full_name"`
	Email        string                    `json:"email"`
	Phone        *string                   `json:"phone"`
	CompanyName  *string                   `json:"company_name"`
	Title        *string                   `json:"title"`
	Message      string                    `json:"message"`
	PortfolioURL *string                   `json:"portfolio_url"`
	SpecialtyID  *uint64                   `json:"specialty_id"`
	Specialty    map[string]interface{}    `json:"specialty,omitempty"`
	BudgetRange  *string                   `json:"budget_range"`
	Timeline     *string                   `json:"timeline"`
	Status       string                    `json:"status"`
	AdminNotes   *string                   `json:"admin_notes"`
	HandledBy    *uint64                   `json:"handled_by"`
	ReviewedAt   *time.Time                `json:"reviewed_at"`
	CreatedAt    time.Time                 `json:"created_at"`
	UpdatedAt    time.Time                 `json:"updated_at"`
	Files        []ApplicationFileResponse `json:"files,omitempty"`
}
