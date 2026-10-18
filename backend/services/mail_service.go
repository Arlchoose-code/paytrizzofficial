package services

import (
	"errors"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
	"strings"
	"time"

	"github.com/microcosm-cc/bluemonday"
	"gorm.io/gorm"
)

type MailService struct {
	db         *gorm.DB
	sanitizer  *bluemonday.Policy
	sseHub     *SSEHub
	logService *MailLogService
}

func NewMailService(db *gorm.DB, sseHub *SSEHub, logService *MailLogService) *MailService {
	return &MailService{
		db:         db,
		sanitizer:  bluemonday.UGCPolicy(),
		sseHub:     sseHub,
		logService: logService,
	}
}

// SanitizeHTML strips dangerous scripts, iframes, and attributes
func (s *MailService) SanitizeHTML(input string) string {
	return s.sanitizer.Sanitize(input)
}

// GetMessages retrieves messages matching folder, search operators, and pagination
func (s *MailService) GetMessages(
	accessibleBoxIDs []uint64,
	filterBoxID *uint64,
	folder string,
	search string,
	labelID *uint64,
	page int,
	perPage int,
) (structs.PaginatedData, error) {
	if len(accessibleBoxIDs) == 0 {
		return structs.PaginatedData{
			CurrentPage: page,
			PerPage:     perPage,
			Total:       0,
			LastPage:    1,
			Data:        []models.MailMessage{},
		}, nil
	}

	query := s.db.Model(&models.MailMessage{}).Preload("Mailbox").Preload("Labels").Preload("Attachments")

	// 1. Mailbox Scope
	if filterBoxID != nil && *filterBoxID > 0 {
		isAllowed := false
		for _, id := range accessibleBoxIDs {
			if id == *filterBoxID {
				isAllowed = true
				break
			}
		}
		if !isAllowed {
			return structs.PaginatedData{}, errors.New("mailbox access unauthorized")
		}
		query = query.Where("mailbox_id = ?", *filterBoxID)
	} else {
		query = query.Where("mailbox_id IN ?", accessibleBoxIDs)
	}

	// 2. Folder filter
	switch folder {
	case "inbox":
		query = query.Where("folder = ? AND snoozed_until IS NULL AND state != ?", models.MailFolderInbox, models.MailStateScheduled)
	case "starred":
		query = query.Where("is_starred = ? AND folder != ?", true, models.MailFolderTrash)
	case "snoozed":
		query = query.Where("snoozed_until IS NOT NULL AND folder = ?", models.MailFolderInbox)
	case "scheduled":
		query = query.Where("state = ?", models.MailStateScheduled)
	case "all", "all_mail":
		query = query.Where("folder NOT IN (?, ?)", models.MailFolderSpam, models.MailFolderTrash)
	case "sent":
		query = query.Where("folder = ?", models.MailFolderSent)
	case "drafts":
		query = query.Where("folder = ?", models.MailFolderDrafts)
	case "spam":
		query = query.Where("folder = ?", models.MailFolderSpam)
	case "trash":
		query = query.Where("folder = ?", models.MailFolderTrash)
	default:
		query = query.Where("folder = ?", models.MailFolderInbox)
	}

	// 3. Label filter (PRD 4.10: filter per label)
	if labelID != nil && *labelID > 0 {
		query = query.Where("id IN (SELECT message_id FROM mail_message_labels WHERE label_id = ?)", *labelID)
	}

	// 4. Search parser
	if search != "" {
		s.applySearchFilters(query, search)
	}

	var total int64
	query.Count(&total)

	offset := (page - 1) * perPage
	var messages []models.MailMessage
	if err := query.Order("sort_at DESC").Offset(offset).Limit(perPage).Find(&messages).Error; err != nil {
		return structs.PaginatedData{}, err
	}

	lastPage := int((total + int64(perPage) - 1) / int64(perPage))
	if lastPage < 1 {
		lastPage = 1
	}

	return structs.PaginatedData{
		CurrentPage: page,
		PerPage:     perPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        messages,
	}, nil
}

// applySearchFilters handles standard operators: from:, to:, subject:, has:attachment, label:, is:unread, is:starred
func (s *MailService) applySearchFilters(query *gorm.DB, search string) {
	terms := strings.Fields(search)
	var freeTerms []string

	for _, t := range terms {
		lower := strings.ToLower(t)
		if strings.HasPrefix(lower, "from:") {
			val := strings.TrimPrefix(t, "from:")
			query.Where("from_address LIKE ? OR from_name LIKE ?", "%"+val+"%", "%"+val+"%")
		} else if strings.HasPrefix(lower, "to:") {
			val := strings.TrimPrefix(t, "to:")
			query.Where("JSON_SEARCH(to_json, 'one', ?) IS NOT NULL", "%"+val+"%")
		} else if strings.HasPrefix(lower, "subject:") {
			val := strings.TrimPrefix(t, "subject:")
			query.Where("subject LIKE ?", "%"+val+"%")
		} else if lower == "has:attachment" {
			query.Where("has_attachments = ?", true)
		} else if strings.HasPrefix(lower, "label:") {
			val := strings.TrimPrefix(t, "label:")
			query.Where("id IN (SELECT ml.message_id FROM mail_message_labels ml JOIN mail_labels l ON l.id = ml.label_id WHERE l.name LIKE ?)", "%"+val+"%")
		} else if lower == "is:unread" {
			query.Where("is_read = ?", false)
		} else if lower == "is:starred" {
			query.Where("is_starred = ?", true)
		} else {
			freeTerms = append(freeTerms, t)
		}
	}

	if len(freeTerms) > 0 {
		freeSearch := "%" + strings.Join(freeTerms, " ") + "%"
		query.Where("subject LIKE ? OR snippet LIKE ? OR from_name LIKE ? OR from_address LIKE ?",
			freeSearch, freeSearch, freeSearch, freeSearch)
	}
}

// GetFolderCounts returns unread and total counts per folder
func (s *MailService) GetFolderCounts(accessibleBoxIDs []uint64, filterBoxID *uint64) (structs.MailFolderCountsResponse, error) {
	var resp structs.MailFolderCountsResponse
	if len(accessibleBoxIDs) == 0 {
		return resp, nil
	}

	boxScope := s.db.Model(&models.MailMessage{})
	if filterBoxID != nil && *filterBoxID > 0 {
		boxScope = boxScope.Where("mailbox_id = ?", *filterBoxID)
	} else {
		boxScope = boxScope.Where("mailbox_id IN ?", accessibleBoxIDs)
	}

	var inboxCount int64
	boxScope.Where("folder = ? AND snoozed_until IS NULL AND state != ? AND is_read = ?",
		models.MailFolderInbox, models.MailStateScheduled, false).Count(&inboxCount)
	resp.Inbox = int(inboxCount)

	var starredCount int64
	boxScope.Where("is_starred = ? AND folder != ?", true, models.MailFolderTrash).Count(&starredCount)
	resp.Starred = int(starredCount)

	var snoozedCount int64
	boxScope.Where("snoozed_until IS NOT NULL AND folder = ?", models.MailFolderInbox).Count(&snoozedCount)
	resp.Snoozed = int(snoozedCount)

	var sentCount int64
	boxScope.Where("folder = ?", models.MailFolderSent).Count(&sentCount)
	resp.Sent = int(sentCount)

	var draftsCount int64
	boxScope.Where("folder = ?", models.MailFolderDrafts).Count(&draftsCount)
	resp.Drafts = int(draftsCount)

	var schedCount int64
	boxScope.Where("state = ?", models.MailStateScheduled).Count(&schedCount)
	resp.Scheduled = int(schedCount)

	var spamCount int64
	boxScope.Where("folder = ? AND is_read = ?", models.MailFolderSpam, false).Count(&spamCount)
	resp.Spam = int(spamCount)

	var trashCount int64
	boxScope.Where("folder = ?", models.MailFolderTrash).Count(&trashCount)
	resp.Trash = int(trashCount)

	return resp, nil
}

// GetMessageDetail returns full message content, sanitizes HTML, and marks as read
func (s *MailService) GetMessageDetail(accessibleBoxIDs []uint64, messageID uint64, markRead bool) (*models.MailMessage, error) {
	var msg models.MailMessage
	if err := s.db.Preload("Mailbox").Preload("Attachments").Preload("Labels").
		Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).First(&msg).Error; err != nil {
		return nil, errors.New("message not found or unauthorized")
	}

	if markRead && !msg.IsRead {
		msg.IsRead = true
		s.db.Model(&msg).Update("is_read", true)
		s.sseHub.BroadcastAll("message_updated", map[string]interface{}{
			"id":      msg.ID,
			"is_read": true,
		})
	}

	// Ensure HTML is sanitized
	if msg.BodyHTML != nil {
		sanitized := s.SanitizeHTML(*msg.BodyHTML)
		msg.BodyHTML = &sanitized
	}

	msg.ThreadMessages = s.GetThreadMessages(accessibleBoxIDs, &msg)

	return &msg, nil
}

// MoveFolder moves a message to target folder
func (s *MailService) MoveFolder(accessibleBoxIDs []uint64, messageID uint64, targetFolder models.MailFolder) error {
	var msg models.MailMessage
	if err := s.db.Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).First(&msg).Error; err != nil {
		return errors.New("message not found or unauthorized")
	}

	if targetFolder == models.MailFolderTrash {
		orig := string(msg.Folder)
		now := time.Now()
		msg.OriginalFolder = &orig
		msg.TrashedAt = &now
	} else if msg.Folder == models.MailFolderTrash && msg.OriginalFolder != nil {
		// Restoring from trash
		msg.TrashedAt = nil
		msg.OriginalFolder = nil
	}

	msg.Folder = targetFolder
	if err := s.db.Save(&msg).Error; err != nil {
		return err
	}

	s.sseHub.BroadcastAll("message_updated", map[string]interface{}{
		"id":     msg.ID,
		"folder": msg.Folder,
	})
	return nil
}

// SetStar toggles or sets starred flag
func (s *MailService) SetStar(accessibleBoxIDs []uint64, messageID uint64, isStarred bool) error {
	res := s.db.Model(&models.MailMessage{}).
		Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).
		Update("is_starred", isStarred)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("message not found or unauthorized")
	}
	s.sseHub.BroadcastAll("message_updated", map[string]interface{}{
		"id":         messageID,
		"is_starred": isStarred,
	})
	return nil
}

// SetRead toggles or sets read flag
func (s *MailService) SetRead(accessibleBoxIDs []uint64, messageID uint64, isRead bool) error {
	res := s.db.Model(&models.MailMessage{}).
		Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).
		Update("is_read", isRead)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("message not found or unauthorized")
	}
	s.sseHub.BroadcastAll("message_updated", map[string]interface{}{
		"id":      messageID,
		"is_read": isRead,
	})
	return nil
}

// Snooze delays a message until a future time
func (s *MailService) Snooze(accessibleBoxIDs []uint64, messageID uint64, until time.Time) error {
	res := s.db.Model(&models.MailMessage{}).
		Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).
		Update("snoozed_until", until)
	if res.Error != nil {
		return res.Error
	}
	if res.RowsAffected == 0 {
		return errors.New("message not found or unauthorized")
	}
	s.sseHub.BroadcastAll("message_updated", map[string]interface{}{
		"id":            messageID,
		"snoozed_until": until,
	})
	return nil
}

// UpdateDraft updates an existing draft message
func (s *MailService) UpdateDraft(accessibleBoxIDs []uint64, messageID uint64, req structs.MailComposeRequest) (*models.MailMessage, error) {
	var msg models.MailMessage
	if err := s.db.Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).First(&msg).Error; err != nil {
		return nil, errors.New("draft not found or unauthorized")
	}

	if msg.Folder != models.MailFolderDrafts && msg.State != models.MailStateDraft {
		return nil, errors.New("only drafts can be updated")
	}

	now := time.Now()
	cleanText := strings.TrimSpace(req.BodyText)
	snippet := cleanText
	if len(snippet) > 200 {
		snippet = snippet[:200] + "..."
	}

	var cleanHTML *string
	if req.BodyHTML != nil {
		sanitized := s.SanitizeHTML(*req.BodyHTML)
		cleanHTML = &sanitized
	}

	if req.MailboxID > 0 {
		allowed := false
		for _, bid := range accessibleBoxIDs {
			if bid == req.MailboxID {
				allowed = true
				break
			}
		}
		if allowed {
			msg.MailboxID = req.MailboxID
		}
	}

	// Synchronize sender address & display name from the associated mailbox
	var fromBox models.Mailbox
	if err := s.db.Where("id = ?", msg.MailboxID).First(&fromBox).Error; err == nil {
		msg.FromAddress = fromBox.Address
		senderName := strings.TrimSpace(fromBox.DisplayName)
		if senderName == "" || senderName == fromBox.LocalPart {
			if fromBox.UserID != nil {
				var u models.User
				if err := s.db.Select("name").Where("id = ?", *fromBox.UserID).First(&u).Error; err == nil && strings.TrimSpace(u.Name) != "" {
					senderName = strings.TrimSpace(u.Name)
				}
			}
		}
		if senderName == "" {
			senderName = fromBox.LocalPart
		}
		msg.FromName = senderName
	}

	msg.ToJSON = req.To
	msg.CcJSON = req.Cc
	msg.BccJSON = req.Bcc
	msg.ReplyToJSON = req.ReplyTo
	msg.Subject = req.Subject
	msg.InReplyTo = req.InReplyTo
	msg.ReferencesHDR = req.ReferencesHDR
	msg.Snippet = snippet
	msg.BodyText = cleanText
	msg.BodyHTML = cleanHTML
	msg.HasAttachments = len(req.AttachmentIDs) > 0
	msg.SortAt = now
	msg.UpdatedAt = now

	if msg.ThreadID == nil {
		if th := s.ResolveThreadForMessage(msg.MailboxID, req.Subject, req.InReplyTo, req.ReferencesHDR); th != nil {
			msg.ThreadID = &th.ID
		}
	}

	if !req.IsDraft {
		if len(req.To) == 0 {
			return nil, errors.New("at least one recipient is required to send")
		}
		if req.ScheduledAt != nil && req.ScheduledAt.After(now.Add(1*time.Minute)) {
			msg.Folder = models.MailFolderSent
			msg.State = models.MailStateScheduled
			msg.ScheduledAt = req.ScheduledAt
			msg.SortAt = *req.ScheduledAt
		} else {
			sendAfter := now.Add(8 * time.Second)
			msg.Folder = models.MailFolderSent
			msg.State = models.MailStateQueued
			msg.SendAfter = &sendAfter
			msg.DeliveryStatus = models.MailDeliverySending
		}
	}

	if err := s.db.Save(&msg).Error; err != nil {
		return nil, err
	}

	// Synchronize attachment associations
	if len(req.AttachmentIDs) > 0 {
		s.db.Model(&models.MailAttachment{}).Where("message_id = ? AND id NOT IN ?", msg.ID, req.AttachmentIDs).Update("message_id", nil)
		s.db.Model(&models.MailAttachment{}).Where("id IN ?", req.AttachmentIDs).Update("message_id", msg.ID)
	} else {
		s.db.Model(&models.MailAttachment{}).Where("message_id = ?", msg.ID).Update("message_id", nil)
	}

	if !req.IsDraft {
		var allRecipients []models.MailAddressJSON
		allRecipients = append(allRecipients, req.To...)
		allRecipients = append(allRecipients, req.Cc...)
		allRecipients = append(allRecipients, req.Bcc...)

		deliveredBoxes := make(map[string]bool)
		for _, recipient := range allRecipients {
			addrLower := strings.ToLower(strings.TrimSpace(recipient.Address))
			if addrLower == "" || deliveredBoxes[addrLower] {
				continue
			}
			deliveredBoxes[addrLower] = true

			if strings.HasSuffix(addrLower, "@paytrizz.com") {
				var targetBox models.Mailbox
				if err := s.db.Where("address = ? AND status = ?", addrLower, models.MailboxStatusActive).First(&targetBox).Error; err == nil {
					var inThreadID *uint64
					if inThread := s.ResolveThreadForMessage(targetBox.ID, req.Subject, req.InReplyTo, req.ReferencesHDR); inThread != nil {
						inThreadID = &inThread.ID
					}
					inboundCopy := models.MailMessage{
						MailboxID:      targetBox.ID,
						ThreadID:       inThreadID,
						Direction:      models.MailDirectionInternal,
						Folder:         models.MailFolderInbox,
						State:          models.MailStateReceived,
						FromAddress:    msg.FromAddress,
						FromName:       msg.FromName,
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
						if targetBox.UserID != nil {
							s.sseHub.BroadcastUser(*targetBox.UserID, "new_message", map[string]interface{}{
								"mailbox_id": targetBox.ID,
								"message_id": inboundCopy.ID,
								"subject":    inboundCopy.Subject,
								"from":       inboundCopy.FromName,
							})
						} else {
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
	}

	s.sseHub.BroadcastAll("message_updated", map[string]interface{}{
		"id":      msg.ID,
		"subject": msg.Subject,
	})

	return &msg, nil
}

// Destroy permanently deletes a message from trash and removes attachments and label relations
func (s *MailService) Destroy(accessibleBoxIDs []uint64, messageID uint64) error {
	var msg models.MailMessage
	if err := s.db.Where("id = ? AND mailbox_id IN ?", messageID, accessibleBoxIDs).First(&msg).Error; err != nil {
		return errors.New("message not found or unauthorized")
	}

	tx := s.db.Begin()
	if err := tx.Exec("DELETE FROM mail_message_labels WHERE message_id = ?", messageID).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Where("message_id = ?", messageID).Delete(&models.MailAttachment{}).Error; err != nil {
		tx.Rollback()
		return err
	}
	if err := tx.Delete(&msg).Error; err != nil {
		tx.Rollback()
		return err
	}
	tx.Commit()

	s.sseHub.BroadcastAll("message_deleted", map[string]interface{}{
		"id": messageID,
	})
	return nil
}
