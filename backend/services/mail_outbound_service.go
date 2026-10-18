package services

import (
	"errors"
	"fmt"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
	"strings"
	"time"

	"gorm.io/gorm"
)

type MailOutboundService struct {
	db          *gorm.DB
	mailService *MailService
	sseHub      *SSEHub
	logService  *MailLogService
}

func NewMailOutboundService(
	db *gorm.DB,
	mailService *MailService,
	sseHub *SSEHub,
	logService *MailLogService,
) *MailOutboundService {
	return &MailOutboundService{
		db:          db,
		mailService: mailService,
		sseHub:      sseHub,
		logService:  logService,
	}
}

// SendOrQueue handles outbound composition, draft saving, scheduling, and internal routing
func (s *MailOutboundService) SendOrQueue(
	actorUserID uint64,
	accessibleBoxIDs []uint64,
	req structs.MailComposeRequest,
) (*models.MailMessage, error) {
	// 1. Verify From mailbox authorization
	if req.MailboxID == 0 && len(accessibleBoxIDs) > 0 {
		req.MailboxID = accessibleBoxIDs[0]
	}
	var fromBox models.Mailbox
	if err := s.db.Where("id = ? AND id IN ?", req.MailboxID, accessibleBoxIDs).First(&fromBox).Error; err != nil {
		return nil, errors.New("unauthorized sender mailbox")
	}

	if !req.IsDraft && len(req.To) == 0 {
		return nil, errors.New("at least one recipient is required to send")
	}

	now := time.Now()
	cleanText := strings.TrimSpace(req.BodyText)
	snippet := cleanText
	if len(snippet) > 200 {
		snippet = snippet[:200] + "..."
	}

	var cleanHTML *string
	if req.BodyHTML != nil {
		sanitized := s.mailService.SanitizeHTML(*req.BodyHTML)
		cleanHTML = &sanitized
	}

	senderDisplayName := strings.TrimSpace(fromBox.DisplayName)
	if senderDisplayName == "" || senderDisplayName == fromBox.LocalPart {
		if fromBox.UserID != nil {
			var u models.User
			if err := s.db.Select("name").Where("id = ?", *fromBox.UserID).First(&u).Error; err == nil && strings.TrimSpace(u.Name) != "" {
				senderDisplayName = strings.TrimSpace(u.Name)
			}
		}
	}
	if senderDisplayName == "" {
		senderDisplayName = fromBox.LocalPart
	}

	// 2. Draft handling
	var threadID *uint64
	if thread := s.mailService.ResolveThreadForMessage(fromBox.ID, req.Subject, req.InReplyTo, req.ReferencesHDR); thread != nil {
		threadID = &thread.ID
	}

	if req.IsDraft {
		draft := models.MailMessage{
			MailboxID:      fromBox.ID,
			ThreadID:       threadID,
			Direction:      models.MailDirectionOutbound,
			Folder:         models.MailFolderDrafts,
			State:          models.MailStateDraft,
			FromAddress:    fromBox.Address,
			FromName:       senderDisplayName,
			ToJSON:         req.To,
			CcJSON:         req.Cc,
			BccJSON:        req.Bcc,
			ReplyToJSON:    req.ReplyTo,
			Subject:        req.Subject,
			InReplyTo:      req.InReplyTo,
			ReferencesHDR:  req.ReferencesHDR,
			Snippet:        snippet,
			BodyText:       cleanText,
			BodyHTML:       cleanHTML,
			HasAttachments: len(req.AttachmentIDs) > 0,
			IsRead:         true,
			SortAt:         now,
			CreatedAt:      now,
		}
		if err := s.db.Create(&draft).Error; err != nil {
			return nil, err
		}
		if len(req.AttachmentIDs) > 0 {
			s.db.Model(&models.MailAttachment{}).Where("id IN ?", req.AttachmentIDs).Update("message_id", draft.ID)
		}
		return &draft, nil
	}

	// 3. Scheduled send
	if req.ScheduledAt != nil && req.ScheduledAt.After(now.Add(1*time.Minute)) {
		schedMsg := models.MailMessage{
			MailboxID:      fromBox.ID,
			ThreadID:       threadID,
			Direction:      models.MailDirectionOutbound,
			Folder:         models.MailFolderSent,
			State:          models.MailStateScheduled,
			ScheduledAt:    req.ScheduledAt,
			FromAddress:    fromBox.Address,
			FromName:       senderDisplayName,
			ToJSON:         req.To,
			CcJSON:         req.Cc,
			BccJSON:        req.Bcc,
			ReplyToJSON:    req.ReplyTo,
			Subject:        req.Subject,
			InReplyTo:      req.InReplyTo,
			ReferencesHDR:  req.ReferencesHDR,
			Snippet:        snippet,
			BodyText:       cleanText,
			BodyHTML:       cleanHTML,
			HasAttachments: len(req.AttachmentIDs) > 0,
			IsRead:         true,
			SortAt:         *req.ScheduledAt,
			CreatedAt:      now,
		}
		if err := s.db.Create(&schedMsg).Error; err != nil {
			return nil, err
		}
		if len(req.AttachmentIDs) > 0 {
			s.db.Model(&models.MailAttachment{}).Where("id IN ?", req.AttachmentIDs).Update("message_id", schedMsg.ID)
		}
		return &schedMsg, nil
	}

	// 4. Outbound message: default 8-second undo window
	sendAfter := now.Add(8 * time.Second)
	outMsg := models.MailMessage{
		MailboxID:      fromBox.ID,
		ThreadID:       threadID,
		Direction:      models.MailDirectionOutbound,
		Folder:         models.MailFolderSent,
		State:          models.MailStateQueued,
		SendAfter:      &sendAfter,
		FromAddress:    fromBox.Address,
		FromName:       senderDisplayName,
		ToJSON:         req.To,
		CcJSON:         req.Cc,
		BccJSON:        req.Bcc,
		ReplyToJSON:    req.ReplyTo,
		Subject:        req.Subject,
		InReplyTo:      req.InReplyTo,
		ReferencesHDR:  req.ReferencesHDR,
		Snippet:        snippet,
		BodyText:       cleanText,
		BodyHTML:       cleanHTML,
		HasAttachments: len(req.AttachmentIDs) > 0,
		IsRead:         true,
		SortAt:         now,
		DeliveryStatus: models.MailDeliverySending,
		CreatedAt:      now,
	}

	if err := s.db.Create(&outMsg).Error; err != nil {
		return nil, err
	}
	if len(req.AttachmentIDs) > 0 {
		s.db.Model(&models.MailAttachment{}).Where("id IN ?", req.AttachmentIDs).Update("message_id", outMsg.ID)
	}

	// Deliver immediately to local recipients if any are @paytrizz.com
	var allLocalRecipients []models.MailAddressJSON
	allLocalRecipients = append(allLocalRecipients, req.To...)
	allLocalRecipients = append(allLocalRecipients, req.Cc...)
	allLocalRecipients = append(allLocalRecipients, req.Bcc...)

	deliveredBoxes := make(map[string]bool)
	for _, recipient := range allLocalRecipients {
		addrLower := strings.ToLower(strings.TrimSpace(recipient.Address))
		if addrLower == "" || deliveredBoxes[addrLower] {
			continue
		}
		deliveredBoxes[addrLower] = true

		if strings.HasSuffix(addrLower, "@paytrizz.com") {
			var targetBox models.Mailbox
			if err := s.db.Where("address = ? AND status = ?", addrLower, models.MailboxStatusActive).First(&targetBox).Error; err == nil {
				var inThreadID *uint64
				if inThread := s.mailService.ResolveThreadForMessage(targetBox.ID, req.Subject, req.InReplyTo, req.ReferencesHDR); inThread != nil {
					inThreadID = &inThread.ID
				}
				// Create internal inbound copy for recipient
				inboundCopy := models.MailMessage{
					MailboxID:      targetBox.ID,
					ThreadID:       inThreadID,
					Direction:      models.MailDirectionInternal,
					Folder:         models.MailFolderInbox,
					State:          models.MailStateReceived,
					FromAddress:    fromBox.Address,
					FromName:       senderDisplayName,
					ToJSON:         req.To,
					CcJSON:         req.Cc,
					BccJSON:        nil, // BCC hidden
					Subject:        req.Subject,
					InReplyTo:      req.InReplyTo,
					ReferencesHDR:  req.ReferencesHDR,
					Snippet:        snippet,
					BodyText:       cleanText,
					BodyHTML:       cleanHTML,
					HasAttachments: len(req.AttachmentIDs) > 0,
					IsRead:         false,
					SortAt:         now,
					DeliveryStatus: models.MailDeliveryDelivered,
					ReceivedAt:     &now,
					CreatedAt:      now,
				}
				if err := s.db.Create(&inboundCopy).Error; err == nil {
					if len(req.AttachmentIDs) > 0 {
						var origAtts []models.MailAttachment
						s.db.Where("id IN ?", req.AttachmentIDs).Find(&origAtts)
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
							_ = s.db.Create(&copyAtt)
						}
					}
					// Notify recipient via SSE
					if targetBox.UserID != nil {
						s.sseHub.BroadcastUser(*targetBox.UserID, "new_message", map[string]interface{}{
							"mailbox_id": targetBox.ID,
							"message_id": inboundCopy.ID,
							"subject":    inboundCopy.Subject,
							"from":       inboundCopy.FromName,
						})
					} else {
						// Company mailbox: broadcast to all admins
						s.sseHub.BroadcastAll("new_message", map[string]interface{}{
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

	_ = s.logService.LogEvent(models.MailLogEventSent, &actorUserID, &fromBox.ID, &fromBox.Address, fromBox.UserID, &outMsg.ID, nil, nil, nil)
	return &outMsg, nil
}

// UndoSend cancels a queued message before its 8-second window expires
func (s *MailOutboundService) UndoSend(accessibleBoxIDs []uint64, messageID uint64) error {
	var msg models.MailMessage
	if err := s.db.Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).First(&msg).Error; err != nil {
		return errors.New("message not found")
	}

	now := time.Now()
	if msg.State != models.MailStateQueued || msg.SendAfter == nil || now.After(*msg.SendAfter) {
		return fmt.Errorf("undo window has already expired")
	}

	// Move back to Drafts
	msg.State = models.MailStateDraft
	msg.Folder = models.MailFolderDrafts
	msg.SendAfter = nil
	msg.DeliveryStatus = models.MailDeliveryNone

	return s.db.Save(&msg).Error
}
