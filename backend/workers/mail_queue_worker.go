package workers

import (
	"fmt"
	"log"
	"mime"
	"os"
	"path/filepath"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"strings"
	"time"

	"gorm.io/gorm"
)

type MailQueueWorker struct {
	db        *gorm.DB
	sseHub    *services.SSEHub
	sesClient *services.SESClientService
	stopCh    chan struct{}
}

func NewMailQueueWorker(db *gorm.DB, sseHub *services.SSEHub, sesClient *services.SESClientService) *MailQueueWorker {
	return &MailQueueWorker{
		db:        db,
		sseHub:    sseHub,
		sesClient: sesClient,
		stopCh:    make(chan struct{}),
	}
}

func (w *MailQueueWorker) Start() {
	ticker := time.NewTicker(3 * time.Second)
	log.Println("[MailQueueWorker] Started background mail queue processor (interval 3s)")

	go func() {
		for {
			select {
			case <-ticker.C:
				w.processQueuedUndo()
				w.processScheduled()
				w.processSnoozed()
			case <-w.stopCh:
				ticker.Stop()
				log.Println("[MailQueueWorker] Stopped")
				return
			}
		}
	}()
}

func (w *MailQueueWorker) Stop() {
	close(w.stopCh)
}

// processQueuedUndo promotes messages after 8s undo window expires
func (w *MailQueueWorker) processQueuedUndo() {
	now := time.Now()
	var queued []models.MailMessage
	if err := w.db.Where("state = ? AND send_after <= ?", models.MailStateQueued, now).Limit(50).Find(&queued).Error; err != nil {
		return
	}

	for _, msg := range queued {
		m := msg
		w.dispatchExternalAndLocal(&m, false)
	}
}

// processScheduled promotes scheduled sends that have reached scheduled_at
func (w *MailQueueWorker) processScheduled() {
	now := time.Now()
	var scheduled []models.MailMessage
	if err := w.db.Where("state = ? AND scheduled_at <= ?", models.MailStateScheduled, now).Limit(50).Find(&scheduled).Error; err != nil {
		return
	}

	for _, msg := range scheduled {
		m := msg
		w.dispatchExternalAndLocal(&m, true)
	}
}

func (w *MailQueueWorker) dispatchExternalAndLocal(msg *models.MailMessage, deliverLocal bool) {
	now := time.Now()

	// If scheduled, internal delivery was deferred until scheduled time
	if deliverLocal {
		var allRecipients []models.MailAddressJSON
		allRecipients = append(allRecipients, msg.ToJSON...)
		allRecipients = append(allRecipients, msg.CcJSON...)
		allRecipients = append(allRecipients, msg.BccJSON...)

		deliveredAddresses := make(map[string]bool)
		for _, recipient := range allRecipients {
			addrLower := strings.ToLower(strings.TrimSpace(recipient.Address))
			if addrLower == "" || deliveredAddresses[addrLower] {
				continue
			}
			deliveredAddresses[addrLower] = true

			if strings.HasSuffix(addrLower, "@paytrizz.com") {
				var targetBox models.Mailbox
				if err := w.db.Where("address = ? AND status = ?", addrLower, models.MailboxStatusActive).First(&targetBox).Error; err == nil {
					inboundCopy := models.MailMessage{
						MailboxID:      targetBox.ID,
						Direction:      models.MailDirectionInternal,
						Folder:         models.MailFolderInbox,
						State:          models.MailStateReceived,
						FromAddress:    msg.FromAddress,
						FromName:       msg.FromName,
						ToJSON:         msg.ToJSON,
						CcJSON:         msg.CcJSON,
						BccJSON:        nil, // BCC hidden
						Subject:        msg.Subject,
						Snippet:        msg.Snippet,
						BodyText:       msg.BodyText,
						BodyHTML:       msg.BodyHTML,
						HasAttachments: msg.HasAttachments,
						IsRead:         false,
						SortAt:         now,
						DeliveryStatus: models.MailDeliveryDelivered,
						ReceivedAt:     &now,
						CreatedAt:      now,
					}
					if err := w.db.Create(&inboundCopy).Error; err == nil {
						if msg.HasAttachments {
							var origAtts []models.MailAttachment
							w.db.Where("message_id = ?", msg.ID).Find(&origAtts)
							for _, att := range origAtts {
								copyAtt := models.MailAttachment{
									MessageID:    &inboundCopy.ID,
									OriginalName: att.OriginalName,
									StoredName:   att.StoredName,
									Mime:         att.Mime,
									SizeBytes:    att.SizeBytes,
									SHA256:       att.SHA256,
									CreatedAt:    now,
									UpdatedAt:    now,
								}
								_ = w.db.Create(&copyAtt)
							}
						}
						if w.sseHub != nil {
							if targetBox.UserID != nil {
								w.sseHub.BroadcastUser(*targetBox.UserID, "new_message", map[string]interface{}{
									"mailbox_id": targetBox.ID,
									"message_id": inboundCopy.ID,
									"subject":    inboundCopy.Subject,
									"from":       inboundCopy.FromName,
								})
							} else {
								w.sseHub.BroadcastAll("new_message", map[string]interface{}{
									"mailbox_id": targetBox.ID,
									"message_id": inboundCopy.ID,
									"subject":    inboundCopy.Subject,
									"from":       inboundCopy.FromName,
								})
							}
						}
					}
				}
			}
		}
	}

	// Deliver external recipients via SES
	var externalTo []string
	for _, to := range msg.ToJSON {
		addr := strings.ToLower(strings.TrimSpace(to.Address))
		if !strings.HasSuffix(addr, "@paytrizz.com") && addr != "" {
			externalTo = append(externalTo, addr)
		}
	}

	var externalCc []string
	for _, cc := range msg.CcJSON {
		addr := strings.ToLower(strings.TrimSpace(cc.Address))
		if !strings.HasSuffix(addr, "@paytrizz.com") && addr != "" {
			externalCc = append(externalCc, addr)
		}
	}

	var externalBcc []string
	for _, bcc := range msg.BccJSON {
		addr := strings.ToLower(strings.TrimSpace(bcc.Address))
		if !strings.HasSuffix(addr, "@paytrizz.com") && addr != "" {
			externalBcc = append(externalBcc, addr)
		}
	}

	hasExternal := len(externalTo) > 0 || len(externalCc) > 0 || len(externalBcc) > 0
	if hasExternal && w.sesClient != nil {
		fromFormatted := msg.FromAddress
		fromName := strings.TrimSpace(msg.FromName)
		if fromName == "" {
			var box models.Mailbox
			if err := w.db.Where("id = ?", msg.MailboxID).First(&box).Error; err == nil {
				fromName = strings.TrimSpace(box.DisplayName)
				if fromName == "" || fromName == box.LocalPart {
					if box.UserID != nil {
						var u models.User
						if err := w.db.Select("name").Where("id = ?", *box.UserID).First(&u).Error; err == nil && strings.TrimSpace(u.Name) != "" {
							fromName = strings.TrimSpace(u.Name)
						}
					}
				}
				if fromName == "" {
					fromName = box.LocalPart
				}
			}
		}

		if fromName != "" {
			cleanName := strings.ReplaceAll(fromName, "\"", "")
			cleanName = strings.ReplaceAll(cleanName, "<", "")
			cleanName = strings.ReplaceAll(cleanName, ">", "")
			cleanName = strings.TrimSpace(cleanName)
			if cleanName != "" {
				isASCII := true
				for _, r := range cleanName {
					if r > 127 {
						isASCII = false
						break
					}
				}
				if isASCII {
					fromFormatted = fmt.Sprintf("\"%s\" <%s>", cleanName, msg.FromAddress)
				} else {
					fromFormatted = fmt.Sprintf("%s <%s>", mime.QEncoding.Encode("utf-8", cleanName), msg.FromAddress)
				}
			}
		}

		var atts []services.SESAttachment
		if msg.HasAttachments {
			var dbAtts []models.MailAttachment
			w.db.Where("message_id = ?", msg.ID).Find(&dbAtts)
			for _, a := range dbAtts {
				filePath := filepath.Join("storage", "private", "mail", "attachments", a.StoredName)
				data, err := os.ReadFile(filePath)
				if err == nil {
					atts = append(atts, services.SESAttachment{
						Filename: a.OriginalName,
						Mime:     a.Mime,
						Data:     data,
					})
				}
			}
		}

		var sesMsgID *string
		var err error
		if len(atts) > 0 {
			sesMsgID, err = w.sesClient.SendEmailWithAttachments(fromFormatted, externalTo, externalCc, externalBcc, msg.Subject, msg.BodyText, msg.BodyHTML, atts)
		} else {
			sesMsgID, err = w.sesClient.SendEmail(fromFormatted, externalTo, externalCc, externalBcc, msg.Subject, msg.BodyText, msg.BodyHTML)
		}
		if err != nil {
			log.Printf("[MailQueueWorker] SES send error for msg ID %d: %v", msg.ID, err)
			msg.DeliveryStatus = models.MailDeliveryFailed
		} else {
			log.Printf("[MailQueueWorker] Dispatched msg ID %d via SES (MessageID: %s)", msg.ID, *sesMsgID)
			msg.DeliveryStatus = models.MailDeliveryDelivered
		}
	} else {
		msg.DeliveryStatus = models.MailDeliveryDelivered
	}

	msg.State = models.MailStateSent
	msg.SentAt = &now
	msg.SendAfter = nil
	_ = w.db.Save(msg)
}

// processSnoozed returns snoozed messages to Inbox when their time arrives
func (w *MailQueueWorker) processSnoozed() {
	now := time.Now()
	var snoozed []models.MailMessage
	if err := w.db.Where("snoozed_until IS NOT NULL AND snoozed_until <= ?", now).Limit(50).Find(&snoozed).Error; err != nil {
		return
	}

	for _, msg := range snoozed {
		msg.SnoozedUntil = nil
		msg.IsRead = false
		msg.SortAt = now
		if err := w.db.Save(&msg).Error; err == nil {
			w.sseHub.BroadcastAll("new_message", map[string]interface{}{
				"id":         msg.ID,
				"mailbox_id": msg.MailboxID,
				"subject":    msg.Subject,
				"is_snoozed": false,
			})
		}
	}
}
