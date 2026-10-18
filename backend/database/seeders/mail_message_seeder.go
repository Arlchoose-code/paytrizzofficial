package seeders

import (
	"log"
	"paytrizz-backend/models"
	"time"

	"gorm.io/gorm"
)

func SeedMailMessages(db *gorm.DB) error {
	var adminBox models.Mailbox
	if err := db.Where("address = ?", "admin@paytrizz.com").First(&adminBox).Error; err == nil {
		var existingCount int64
		db.Model(&models.MailMessage{}).Where("mailbox_id = ?", adminBox.ID).Count(&existingCount)
		if existingCount == 0 {
			now := time.Now()

			// Thread 1: Partner inquiry
			thread1 := models.MailThread{
				MailboxID:     adminBox.ID,
				SubjectNorm:   "partnership: full-stack go pod allocation",
				LastMessageAt: now.Add(-2 * time.Hour),
				MessageCount:  1,
			}
			db.Create(&thread1)

			htmlBody1 := `<p>Hi PayTrizz Team,</p><p>We are scaling our fintech core engine and require a dedicated pod consisting of 2 Senior Go Engineers and 1 Lead Product Designer.</p><p>Could we schedule a discovery call this Thursday?</p><p>Best regards,<br><strong>Alex Taylor</strong><br>VP Engineering, Quantum Fintech</p>`

			msg1 := models.MailMessage{
				MailboxID:      adminBox.ID,
				ThreadID:       &thread1.ID,
				Direction:      models.MailDirectionInbound,
				Folder:         models.MailFolderInbox,
				State:          models.MailStateReceived,
				FromAddress:    "alex@quantumfintech.io",
				FromName:       "Alex Taylor",
				ToJSON:         models.MailAddressList{{Name: "PayTrizz Operations", Address: "admin@paytrizz.com"}},
				Subject:        "Partnership: Full-stack Go Pod Allocation",
				Snippet:        "We are scaling our fintech core engine and require a dedicated pod...",
				BodyText:       "Hi PayTrizz Team,\n\nWe are scaling our fintech core engine and require a dedicated pod consisting of 2 Senior Go Engineers and 1 Lead Product Designer.\n\nCould we schedule a discovery call this Thursday?\n\nBest regards,\nAlex Taylor",
				BodyHTML:       &htmlBody1,
				IsRead:         false,
				IsStarred:      true,
				SortAt:         now.Add(-2 * time.Hour),
				DeliveryStatus: models.MailDeliveryDelivered,
				SizeBytes:      1420,
			}
			db.Create(&msg1)

			// Thread 2: Sent email
			thread2 := models.MailThread{
				MailboxID:     adminBox.ID,
				SubjectNorm:   "welcome to paytrizz enterprise squads",
				LastMessageAt: now.Add(-5 * time.Hour),
				MessageCount:  1,
			}
			db.Create(&thread2)

			htmlBody2 := `<p>Dear Client,</p><p>Welcome to PayTrizz. Your dedicated squad has been provisioned and your onboarding repository is now active.</p><p>Let us know if you need anything.</p><p>PayTrizz Operations</p>`

			msg2 := models.MailMessage{
				MailboxID:      adminBox.ID,
				ThreadID:       &thread2.ID,
				Direction:      models.MailDirectionOutbound,
				Folder:         models.MailFolderSent,
				State:          models.MailStateSent,
				FromAddress:    "admin@paytrizz.com",
				FromName:       "PayTrizz Operations",
				ToJSON:         models.MailAddressList{{Name: "Nexus Enterprise", Address: "cto@nexuscorp.com"}},
				Subject:        "Welcome to PayTrizz Enterprise Squads",
				Snippet:        "Your dedicated squad has been provisioned and your onboarding repository is now active...",
				BodyText:       "Dear Client,\n\nWelcome to PayTrizz. Your dedicated squad has been provisioned and your onboarding repository is now active.\n\nPayTrizz Operations",
				BodyHTML:       &htmlBody2,
				IsRead:         true,
				IsStarred:      false,
				SortAt:         now.Add(-5 * time.Hour),
				DeliveryStatus: models.MailDeliveryDelivered,
				SizeBytes:      1150,
			}
			db.Create(&msg2)
		}
	}

	// Talent Mailbox: syahrul@paytrizz.com
	var syahrulBox models.Mailbox
	if err := db.Where("address = ?", "syahrul@paytrizz.com").First(&syahrulBox).Error; err == nil {
		var existingCount int64
		db.Model(&models.MailMessage{}).Where("mailbox_id = ?", syahrulBox.ID).Count(&existingCount)
		if existingCount == 0 {
			now := time.Now()

			thread := models.MailThread{
				MailboxID:     syahrulBox.ID,
				SubjectNorm:   "core banking architecture advisory scope",
				LastMessageAt: now.Add(-1 * time.Hour),
				MessageCount:  1,
			}
			db.Create(&thread)

			htmlBody := `<p>Hi Syahrul,</p><p>I saw your FinScale case study on PayTrizz. We are building a similar distributed ledger engine and would love to consult with you on high-concurrency ledger state machines.</p><p>Are you open for a 10-hour/week advisory engagement?</p><p>Elena Rostova<br>Chief Architect, Neobank Zurich</p>`

			msg := models.MailMessage{
				MailboxID:      syahrulBox.ID,
				ThreadID:       &thread.ID,
				Direction:      models.MailDirectionInbound,
				Folder:         models.MailFolderInbox,
				State:          models.MailStateReceived,
				FromAddress:    "elena@neobank.ch",
				FromName:       "Elena Rostova",
				ToJSON:         models.MailAddressList{{Name: "Syahrul", Address: "syahrul@paytrizz.com"}},
				Subject:        "Core Banking Architecture Advisory Scope",
				Snippet:        "I saw your FinScale case study on PayTrizz. We are building a similar distributed ledger engine...",
				BodyText:       "Hi Syahrul,\n\nI saw your FinScale case study on PayTrizz. We are building a similar distributed ledger engine and would love to consult with you on high-concurrency ledger state machines.\n\nElena Rostova",
				BodyHTML:       &htmlBody,
				IsRead:         false,
				IsStarred:      true,
				SortAt:         now.Add(-1 * time.Hour),
				DeliveryStatus: models.MailDeliveryDelivered,
				SizeBytes:      1680,
			}
			db.Create(&msg)
		}
	}

	log.Println("Seeded mail messages successfully")
	return nil
}
