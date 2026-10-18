package services

import (
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"strings"
	"time"
)

// ResolveThreadForMessage retrieves or creates a conversation thread, resolving via in-reply-to or normalized subject
func (s *MailService) ResolveThreadForMessage(mailboxID uint64, subject string, inReplyTo *string, references *string) *models.MailThread {
	now := time.Now()

	// 1. Check if inReplyTo references an existing parent message in DB
	if inReplyTo != nil && strings.TrimSpace(*inReplyTo) != "" {
		ref := strings.TrimSpace(*inReplyTo)
		var parentMsg models.MailMessage
		if err := s.db.Where("rfc_message_id = ? OR id = ?", ref, ref).First(&parentMsg).Error; err == nil {
			if parentMsg.ThreadID != nil && *parentMsg.ThreadID > 0 {
				var th models.MailThread
				if err := s.db.Where("id = ?", *parentMsg.ThreadID).First(&th).Error; err == nil {
					th.LastMessageAt = now
					th.MessageCount++
					s.db.Save(&th)
					return &th
				}
			}
		}
	}

	norm := helpers.NormalizeMailSubject(subject)
	if norm == "" {
		norm = strings.TrimSpace(subject)
	}

	// 2. If subject is empty or "(no subject)", create a standalone thread so unrelated emails don't merge
	if norm == "" || norm == "(no subject)" {
		thread := models.MailThread{
			MailboxID:     mailboxID,
			SubjectNorm:   "(no subject)",
			LastMessageAt: now,
			MessageCount:  1,
			CreatedAt:     now,
			UpdatedAt:     now,
		}
		if err := s.db.Create(&thread).Error; err == nil {
			return &thread
		}
		return nil
	}

	// 3. Match existing thread by mailbox and normalized subject
	var thread models.MailThread
	err := s.db.Where("mailbox_id = ? AND subject_norm = ?", mailboxID, norm).First(&thread).Error
	if err == nil {
		thread.LastMessageAt = now
		thread.MessageCount++
		s.db.Save(&thread)
		return &thread
	}

	thread = models.MailThread{
		MailboxID:     mailboxID,
		SubjectNorm:   norm,
		LastMessageAt: now,
		MessageCount:  1,
		CreatedAt:     now,
		UpdatedAt:     now,
	}
	if err := s.db.Create(&thread).Error; err == nil {
		return &thread
	}
	return nil
}

// GetOrCreateThread retrieves or creates a conversation thread for the given mailbox and subject
func (s *MailService) GetOrCreateThread(mailboxID uint64, subject string) *models.MailThread {
	return s.ResolveThreadForMessage(mailboxID, subject, nil, nil)
}

// GetThreadMessages loads all conversation messages for a given message in chronological order
func (s *MailService) GetThreadMessages(accessibleBoxIDs []uint64, msg *models.MailMessage) []models.MailMessage {
	if msg == nil {
		return nil
	}

	norm := helpers.NormalizeMailSubject(msg.Subject)
	if norm == "" {
		norm = strings.TrimSpace(msg.Subject)
	}

	var candidates []models.MailMessage
	query := s.db.Model(&models.MailMessage{}).
		Preload("Mailbox").
		Preload("Attachments").
		Preload("Labels")

	// Match by thread_id or normalized subject within accessible mailboxes
	if msg.ThreadID != nil && *msg.ThreadID > 0 {
		if norm != "" && norm != "(no subject)" {
			query = query.Where("(thread_id = ? OR (mailbox_id = ? AND (subject = ? OR subject LIKE ? OR subject LIKE ?)))",
				*msg.ThreadID, msg.MailboxID, norm, "Re:%"+norm, "Fwd:%"+norm)
		} else {
			query = query.Where("thread_id = ?", *msg.ThreadID)
		}
	} else if norm != "" && norm != "(no subject)" {
		query = query.Where("mailbox_id = ? AND (subject = ? OR subject LIKE ? OR subject LIKE ?)",
			msg.MailboxID, norm, "Re:%"+norm, "Fwd:%"+norm)
	} else {
		query = query.Where("id = ?", msg.ID)
	}

	query = query.Where("mailbox_id IN ?", accessibleBoxIDs)
	if msg.Folder != models.MailFolderTrash {
		query = query.Where("folder != ?", models.MailFolderTrash)
	}

	if err := query.Order("sort_at ASC").Find(&candidates).Error; err != nil {
		return []models.MailMessage{*msg}
	}

	var threadMsgs []models.MailMessage
	seenIDs := make(map[uint64]bool)

	for i := range candidates {
		cNorm := helpers.NormalizeMailSubject(candidates[i].Subject)
		if cNorm == "" {
			cNorm = strings.TrimSpace(candidates[i].Subject)
		}

		isThreadMatch := (msg.ThreadID != nil && candidates[i].ThreadID != nil && *candidates[i].ThreadID == *msg.ThreadID) ||
			(norm != "" && norm != "(no subject)" && strings.EqualFold(cNorm, norm)) ||
			candidates[i].ID == msg.ID

		if isThreadMatch && !seenIDs[candidates[i].ID] {
			seenIDs[candidates[i].ID] = true
			if candidates[i].BodyHTML != nil {
				sanitized := s.SanitizeHTML(*candidates[i].BodyHTML)
				candidates[i].BodyHTML = &sanitized
			}
			threadMsgs = append(threadMsgs, candidates[i])
		}
	}

	if !seenIDs[msg.ID] {
		threadMsgs = append(threadMsgs, *msg)
	}

	return threadMsgs
}

// BackfillThreads associates existing unthreaded messages with conversation threads
func (s *MailService) BackfillThreads() {
	var unthreaded []models.MailMessage
	if err := s.db.Where("thread_id IS NULL").Find(&unthreaded).Error; err == nil {
		for _, m := range unthreaded {
			th := s.ResolveThreadForMessage(m.MailboxID, m.Subject, m.InReplyTo, m.ReferencesHDR)
			if th != nil {
				s.db.Model(&models.MailMessage{}).Where("id = ?", m.ID).Update("thread_id", th.ID)
			}
		}
	}
}
