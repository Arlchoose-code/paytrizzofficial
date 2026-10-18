package services

import (
	"fmt"
	"math/rand"
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

type TicketService struct {
	db *gorm.DB
}

func NewTicketService(db *gorm.DB) *TicketService {
	return &TicketService{db: db}
}

// GenerateTicketCode produces a unique code in the format PTZ-YYYY-XXXXXX (e.g. PTZ-2026-000123)
func (s *TicketService) GenerateTicketCode() (string, error) {
	year := time.Now().Year()

	for i := 0; i < 10; i++ {
		num := rand.Intn(900000) + 100000
		candidate := fmt.Sprintf("PTZ-%d-%06d", year, num)

		var countContact int64
		s.db.Model(&models.ContactMessage{}).Where("ticket_code = ?", candidate).Count(&countContact)
		if countContact > 0 {
			continue
		}

		var countApp int64
		s.db.Model(&models.Application{}).Where("ticket_code = ?", candidate).Count(&countApp)
		if countApp > 0 {
			continue
		}

		return candidate, nil
	}

	return "", fmt.Errorf("failed to generate unique ticket code after multiple attempts")
}
