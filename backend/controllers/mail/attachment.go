package mail

import (
	"crypto/sha256"
	"encoding/hex"
	"fmt"
	"io"
	"mime/multipart"
	"net/http"
	"os"
	"path/filepath"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type AttachmentController struct {
	db             *gorm.DB
	mailboxService *services.MailboxService
	storageDir     string
}

func NewAttachmentController(db *gorm.DB, mailboxService *services.MailboxService) *AttachmentController {
	storageDir := filepath.Join("storage", "private", "mail", "attachments")
	_ = os.MkdirAll(storageDir, 0700)
	return &AttachmentController{
		db:             db,
		mailboxService: mailboxService,
		storageDir:     storageDir,
	}
}

const (
	maxAttachmentSizeBytes = 25 * 1024 * 1024 // 25 MB per file
)

var blockedExtensions = map[string]bool{
	".exe": true, ".bat": true, ".cmd": true, ".vbs": true,
	".msi": true, ".com": true, ".scr": true, ".pif": true,
}

// Upload handles uploading one or multiple mail attachments before or during compose
func (ctrl *AttachmentController) Upload(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	if userIDVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}
	userID := userIDVal.(uint64)

	// Collect uploaded files (either "files" multiple or "file" single)
	form, err := c.MultipartForm()
	var fileHeaders []*multipart.FileHeader
	if err == nil && form != nil {
		if headers, ok := form.File["files"]; ok {
			fileHeaders = append(fileHeaders, headers...)
		}
		if headers, ok := form.File["file"]; ok && len(fileHeaders) == 0 {
			fileHeaders = append(fileHeaders, headers...)
		}
	}

	if len(fileHeaders) == 0 {
		singleFile, err := c.FormFile("file")
		if err == nil && singleFile != nil {
			fileHeaders = append(fileHeaders, singleFile)
		}
	}

	if len(fileHeaders) == 0 {
		helpers.RespondError(c, http.StatusBadRequest, "No file provided for upload")
		return
	}

	// Pre-validate all files before writing anything to disk
	for _, fh := range fileHeaders {
		if fh.Size > maxAttachmentSizeBytes {
			helpers.RespondError(c, http.StatusBadRequest, fmt.Sprintf("File %s exceeds maximum 25 MB limit", fh.Filename))
			return
		}
		ext := strings.ToLower(filepath.Ext(fh.Filename))
		if blockedExtensions[ext] {
			helpers.RespondError(c, http.StatusBadRequest, fmt.Sprintf("File type %s is blocked for security", ext))
			return
		}
	}

	var results []structs.MailAttachmentResponse
	for _, fh := range fileHeaders {
		ext := strings.ToLower(filepath.Ext(fh.Filename))
		src, err := fh.Open()
		if err != nil {
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to read uploaded file")
			return
		}
		defer src.Close()

		// Generate stored name: timestamp_rand_safeExt
		h := sha256.Sum256([]byte(fh.Filename + strconv.FormatInt(time.Now().UnixNano(), 10)))
		storedName := fmt.Sprintf("%d_%x%s", time.Now().UnixNano(), h[:8], ext)
		destPath := filepath.Join(ctrl.storageDir, storedName)

		dst, err := os.OpenFile(destPath, os.O_CREATE|os.O_WRONLY, 0600)
		if err != nil {
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to save file to storage")
			return
		}

		hasher := sha256.New()
		multiWriter := io.MultiWriter(dst, hasher)
		size, err := io.Copy(multiWriter, src)
		dst.Close()

		if err != nil {
			_ = os.Remove(destPath)
			helpers.RespondError(c, http.StatusInternalServerError, "Failed writing file data")
			return
		}

		sha256Hex := hex.EncodeToString(hasher.Sum(nil))
		mimeType := fh.Header.Get("Content-Type")
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}

		attachment := models.MailAttachment{
			UploaderUserID: &userID,
			OriginalName:   filepath.Base(fh.Filename),
			StoredName:     storedName,
			Mime:           mimeType,
			SizeBytes:      size,
			SHA256:         sha256Hex,
			IsInline:       false,
			IsBlocked:      false,
			CreatedAt:      time.Now(),
			UpdatedAt:      time.Now(),
		}

		if err := ctrl.db.Create(&attachment).Error; err != nil {
			_ = os.Remove(destPath)
			helpers.RespondError(c, http.StatusInternalServerError, "Failed to record attachment in database")
			return
		}

		results = append(results, structs.MailAttachmentResponse{
			ID:           attachment.ID,
			MessageID:    attachment.MessageID,
			OriginalName: attachment.OriginalName,
			Filename:     attachment.OriginalName,
			StoredName:   attachment.StoredName,
			Mime:         attachment.Mime,
			SizeBytes:    attachment.SizeBytes,
			DownloadURL:  fmt.Sprintf("/api/proxy/mail/attachments/%d/download", attachment.ID),
			IsInline:     attachment.IsInline,
			IsBlocked:    attachment.IsBlocked,
		})
	}

	helpers.RespondSuccess(c, http.StatusCreated, "Attachment uploaded successfully", results)
}

// Download securely streams an attachment to authorized users
func (ctrl *AttachmentController) Download(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	if userIDVal == nil || roleVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}
	userID := userIDVal.(uint64)
	role := roleVal.(string)

	attIDStr := c.Param("id")
	attID, err := strconv.ParseUint(attIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid attachment ID")
		return
	}

	var att models.MailAttachment
	if err := ctrl.db.First(&att, attID).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Attachment not found")
		return
	}

	// Verify authorization: admin has audit access to all mail attachments
	if role == "admin" {
		// Admin authorized for audit inspection
	} else if att.MessageID != nil {
		boxes, err := ctrl.mailboxService.GetUserMailboxes(userID, role)
		if err != nil {
			helpers.RespondError(c, http.StatusForbidden, "Unauthorized access")
			return
		}
		var boxIDs []uint64
		for _, b := range boxes {
			boxIDs = append(boxIDs, b.ID)
		}

		var msg models.MailMessage
		if err := ctrl.db.Where("id = ? AND mailbox_id IN ?", *att.MessageID, boxIDs).First(&msg).Error; err != nil {
			helpers.RespondError(c, http.StatusForbidden, "Unauthorized to access this attachment")
			return
		}
	} else if att.UploaderUserID != nil && *att.UploaderUserID != userID {
		helpers.RespondError(c, http.StatusForbidden, "Unauthorized to access staged attachment")
		return
	}

	filePath := filepath.Join(ctrl.storageDir, att.StoredName)
	if _, err := os.Stat(filePath); os.IsNotExist(err) {
		helpers.RespondError(c, http.StatusNotFound, "Attachment file missing from disk")
		return
	}

	c.Header("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", att.OriginalName))
	if att.Mime != "" {
		c.Header("Content-Type", att.Mime)
	}
	c.File(filePath)
}

// Destroy deletes an attachment if it is unlinked or in draft
func (ctrl *AttachmentController) Destroy(c *gin.Context) {
	userIDVal, _ := c.Get("UserID")
	roleVal, _ := c.Get("Role")
	if userIDVal == nil || roleVal == nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
		return
	}
	userID := userIDVal.(uint64)
	role := roleVal.(string)

	attIDStr := c.Param("id")
	attID, err := strconv.ParseUint(attIDStr, 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid attachment ID")
		return
	}

	var att models.MailAttachment
	if err := ctrl.db.First(&att, attID).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Attachment not found")
		return
	}

	// Only uploader or admin can destroy unassigned/draft attachment
	if att.UploaderUserID != nil && *att.UploaderUserID != userID && role != "admin" {
		helpers.RespondError(c, http.StatusForbidden, "Unauthorized to delete attachment")
		return
	}

	filePath := filepath.Join(ctrl.storageDir, att.StoredName)
	_ = os.Remove(filePath)
	_ = ctrl.db.Delete(&att)

	helpers.RespondSuccess(c, http.StatusOK, "Attachment deleted", nil)
}
