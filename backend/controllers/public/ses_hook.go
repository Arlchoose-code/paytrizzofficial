package public

import (
	"bytes"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"io"
	"log"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	netmail "net/mail"
	"net/http"
	"os"
	"path/filepath"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"regexp"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

type SESHookController struct {
	db        *gorm.DB
	sesClient *services.SESClientService
	sseHub    *services.SSEHub
}

func NewSESHookController(db *gorm.DB, sesClient *services.SESClientService, sseHub *services.SSEHub) *SESHookController {
	return &SESHookController{
		db:        db,
		sesClient: sesClient,
		sseHub:    sseHub,
	}
}

type SNSMessage struct {
	Type             string `json:"Type"`
	MessageId        string `json:"MessageId"`
	TopicArn         string `json:"TopicArn"`
	Subject          string `json:"Subject"`
	Message          string `json:"Message"`
	SubscribeURL     string `json:"SubscribeURL"`
	SigningCertURL   string `json:"SigningCertURL"`
	Signature        string `json:"Signature"`
	SignatureVersion string `json:"SignatureVersion"`
}

type SESMailHeader struct {
	From      []string `json:"from"`
	To        []string `json:"to"`
	Subject   string   `json:"subject"`
	Date      string   `json:"date"`
	MessageId string   `json:"messageId"`
}

type SESInboundPayload struct {
	Mail struct {
		Timestamp     string        `json:"timestamp"`
		Source        string        `json:"source"`
		MessageId     string        `json:"messageId"`
		Destination   []string      `json:"destination"`
		CommonHeaders SESMailHeader `json:"commonHeaders"`
	} `json:"mail"`
	Receipt struct {
		Action struct {
			Type       string `json:"type"`
			BucketName string `json:"bucketName"`
			ObjectKey  string `json:"objectKey"`
		} `json:"action"`
		SpamVerdict  struct{ Status string `json:"status"` } `json:"spamVerdict"`
		VirusVerdict struct{ Status string `json:"status"` } `json:"virusVerdict"`
	} `json:"receipt"`
	Content string `json:"content"`
}

// Inbound receives SNS catch-all inbound email notifications
func (ctrl *SESHookController) Inbound(c *gin.Context) {
	bodyBytes, err := io.ReadAll(c.Request.Body)
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Failed to read body"})
		return
	}

	var snsMsg SNSMessage
	if err := json.Unmarshal(bodyBytes, &snsMsg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid SNS payload"})
		return
	}

	// 1. Handle SubscriptionConfirmation
	if snsMsg.Type == "SubscriptionConfirmation" {
		if strings.Contains(snsMsg.SubscribeURL, "amazonaws.com") {
			resp, err := http.Get(snsMsg.SubscribeURL)
			if err == nil {
				resp.Body.Close()
				log.Printf("[SES Hook] Confirmed SNS topic subscription: %s", snsMsg.TopicArn)
				c.String(http.StatusOK, "Subscription confirmed")
				return
			}
		}
	}

	// 2. Parse SES Notification inside SNS Message
	var sesPayload SESInboundPayload
	_ = json.Unmarshal([]byte(snsMsg.Message), &sesPayload)

	now := time.Now()
	bucketName := sesPayload.Receipt.Action.BucketName
	objectKey := sesPayload.Receipt.Action.ObjectKey
	sesMsgID := sesPayload.Mail.MessageId
	if sesMsgID == "" {
		sesMsgID = snsMsg.MessageId
	}

	// 3. Store inbound event idempotently
	event := models.MailInboundEvent{
		SESMessageID: sesMsgID,
		S3Bucket:     bucketName,
		S3Key:        objectKey,
		Recipients:   models.StringList(sesPayload.Mail.Destination),
		Status:       models.InboundStatusReceived,
		ReceivedAt:   now,
	}

	var existing models.MailInboundEvent
	if err := ctrl.db.Where("ses_message_id = ?", sesMsgID).First(&existing).Error; err != nil {
		_ = ctrl.db.Create(&event)
	}

	// 4. Download and parse email body from S3 if available
	var bodyText string
	var bodyHTML *string
	fromAddr := sesPayload.Mail.Source
	fromName := sesPayload.Mail.Source
	subject := sesPayload.Mail.CommonHeaders.Subject

	if len(sesPayload.Mail.CommonHeaders.From) > 0 {
		rawFrom := sesPayload.Mail.CommonHeaders.From[0]
		if parsedAddr, err := netmail.ParseAddress(rawFrom); err == nil {
			fromAddr = parsedAddr.Address
			if parsedAddr.Name != "" {
				fromName = parsedAddr.Name
			} else {
				fromName = parsedAddr.Address
			}
		}
	}

	var parsedAttachments []parsedAttachmentItem
	var rawEML []byte
	if ctrl.sesClient != nil && bucketName != "" && objectKey != "" {
		if data, err := ctrl.sesClient.DownloadS3Object(bucketName, objectKey); err == nil {
			rawEML = data
		}
	}
	if len(rawEML) == 0 && sesPayload.Content != "" {
		rawEML = []byte(sesPayload.Content)
	}

	if len(rawEML) > 0 {
		parsedText, parsedHTML, atts := parseEML(rawEML)
		if parsedText != "" {
			bodyText = parsedText
		}
		if parsedHTML != "" {
			bodyHTML = &parsedHTML
		}
		parsedAttachments = atts
	}

	if bodyText == "" && bodyHTML == nil {
		bodyText = "(Empty email content or attachment-only message)"
	}

	snippet := bodyText
	if len(snippet) > 200 {
		snippet = snippet[:200] + "..."
	}

	// 5. Route to each recipient mailbox
	for _, rawDest := range sesPayload.Mail.Destination {
		destLower := strings.ToLower(strings.TrimSpace(rawDest))
		var targetBox models.Mailbox
		if err := ctrl.db.Where("address = ? AND status = ?", destLower, models.MailboxStatusActive).First(&targetBox).Error; err == nil {
			normSubj := helpers.NormalizeMailSubject(subject)
			if normSubj == "" {
				normSubj = strings.TrimSpace(subject)
			}
			if normSubj == "" {
				normSubj = "(no subject)"
			}
			var inThreadID *uint64
			var thread models.MailThread
			if err := ctrl.db.Where("mailbox_id = ? AND subject_norm = ?", targetBox.ID, normSubj).First(&thread).Error; err == nil {
				thread.LastMessageAt = now
				thread.MessageCount++
				ctrl.db.Save(&thread)
				inThreadID = &thread.ID
			} else {
				thread = models.MailThread{
					MailboxID:     targetBox.ID,
					SubjectNorm:   normSubj,
					LastMessageAt: now,
					MessageCount:  1,
					CreatedAt:     now,
					UpdatedAt:     now,
				}
				if err := ctrl.db.Create(&thread).Error; err == nil {
					inThreadID = &thread.ID
				}
			}

			inboundMsg := models.MailMessage{
				MailboxID:      targetBox.ID,
				ThreadID:       inThreadID,
				Direction:      models.MailDirectionInbound,
				Folder:         models.MailFolderInbox,
				State:          models.MailStateReceived,
				SESMessageID:   &sesMsgID,
				FromAddress:    fromAddr,
				FromName:       fromName,
				ToJSON:         models.MailAddressList{{Address: destLower}},
				Subject:        subject,
				Snippet:        snippet,
				BodyText:       bodyText,
				BodyHTML:       bodyHTML,
				HasAttachments: len(parsedAttachments) > 0,
				IsRead:         false,
				IsStarred:      false,
				SortAt:         now,
				DeliveryStatus: models.MailDeliveryDelivered,
				ReceivedAt:     &now,
				CreatedAt:      now,
			}

			if err := ctrl.db.Create(&inboundMsg).Error; err == nil {
				if len(parsedAttachments) > 0 {
					attDir := filepath.Join("storage", "private", "mail", "attachments")
					_ = os.MkdirAll(attDir, 0700)
					for _, pa := range parsedAttachments {
						cleanName := filepath.Base(pa.Filename)
						if cleanName == "" || cleanName == "." {
							cleanName = "attachment"
						}
						h := sha256.Sum256([]byte(cleanName + strconv.FormatInt(time.Now().UnixNano(), 10)))
						storedName := fmt.Sprintf("%d_%x%s", time.Now().UnixNano(), h[:8], filepath.Ext(cleanName))
						destPath := filepath.Join(attDir, storedName)
						if err := os.WriteFile(destPath, pa.Data, 0600); err == nil {
							hasher := sha256.New()
							hasher.Write(pa.Data)
							shaHex := hex.EncodeToString(hasher.Sum(nil))
							attModel := models.MailAttachment{
								MessageID:    &inboundMsg.ID,
								OriginalName: cleanName,
								StoredName:   storedName,
								Mime:         pa.Mime,
								SizeBytes:    int64(len(pa.Data)),
								SHA256:       shaHex,
								CreatedAt:    now,
								UpdatedAt:    now,
							}
							_ = ctrl.db.Create(&attModel)
						}
					}
				}
				log.Printf("[SES Hook] Successfully received inbound mail for %s (Subject: %s)", destLower, subject)
				// Broadcast SSE realtime event
				if ctrl.sseHub != nil {
					payload := map[string]interface{}{
						"mailbox_id": targetBox.ID,
						"message_id": inboundMsg.ID,
						"subject":    inboundMsg.Subject,
						"from":       inboundMsg.FromName,
					}
					if targetBox.UserID != nil {
						ctrl.sseHub.BroadcastUser(*targetBox.UserID, "new_message", payload)
					} else {
						ctrl.sseHub.BroadcastAll("new_message", payload)
					}
				}
			}
		} else {
			log.Printf("[SES Hook] Inbound mail recipient %s has no active mailbox. Dropped per policy.", destLower)
		}
	}

	// Update event status
	event.Status = models.InboundStatusProcessed
	_ = ctrl.db.Save(&event)

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

// Events receives SES outbound bounce, complaint, and delivery events
func (ctrl *SESHookController) Events(c *gin.Context) {
	var snsMsg SNSMessage
	if err := c.ShouldBindJSON(&snsMsg); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"error": "Invalid payload"})
		return
	}

	if snsMsg.Type == "SubscriptionConfirmation" {
		if strings.Contains(snsMsg.SubscribeURL, "amazonaws.com") {
			resp, err := http.Get(snsMsg.SubscribeURL)
			if err == nil {
				resp.Body.Close()
				c.String(http.StatusOK, "Subscription confirmed")
				return
			}
		}
	}

	c.JSON(http.StatusOK, gin.H{"status": "processed"})
}

type parsedAttachmentItem struct {
	Filename string
	Mime     string
	Data     []byte
}

func decodeTransferEncoding(r io.Reader, encoding string) ([]byte, error) {
	enc := strings.ToLower(strings.TrimSpace(encoding))
	switch enc {
	case "quoted-printable":
		return io.ReadAll(quotedprintable.NewReader(r))
	case "base64":
		return io.ReadAll(base64.NewDecoder(base64.StdEncoding, r))
	default:
		return io.ReadAll(r)
	}
}

func parseMIMEEntity(header netmail.Header, body io.Reader) (string, string, []parsedAttachmentItem) {
	contentType := header.Get("Content-Type")
	if contentType == "" {
		contentType = "text/plain"
	}
	mediaType, params, err := mime.ParseMediaType(contentType)
	if err != nil {
		mediaType = "text/plain"
	}

	disposition := header.Get("Content-Disposition")
	dispType, dispParams, _ := mime.ParseMediaType(disposition)

	filename := dispParams["filename"]
	if filename == "" {
		filename = params["name"]
	}
	if filename != "" {
		if dec := new(mime.WordDecoder); dec != nil {
			if decoded, err := dec.DecodeHeader(filename); err == nil {
				filename = decoded
			}
		}
	}

	// If marked as attachment or non-inline with filename
	if dispType == "attachment" || (filename != "" && dispType != "inline") {
		data, err := decodeTransferEncoding(body, header.Get("Content-Transfer-Encoding"))
		if err == nil && len(data) > 0 {
			if filename == "" {
				filename = "attachment"
			}
			return "", "", []parsedAttachmentItem{{
				Filename: filename,
				Mime:     mediaType,
				Data:     data,
			}}
		}
		return "", "", nil
	}

	// Recursive multipart unpack
	if strings.HasPrefix(mediaType, "multipart/") {
		boundary := params["boundary"]
		if boundary == "" {
			return "", "", nil
		}
		mr := multipart.NewReader(body, boundary)
		var textBuf, htmlBuf string
		var attachments []parsedAttachmentItem

		for {
			part, err := mr.NextPart()
			if err != nil {
				break
			}
			pHeader := netmail.Header(part.Header)
			t, h, atts := parseMIMEEntity(pHeader, part)
			if t != "" && textBuf == "" {
				textBuf = t
			}
			if h != "" && htmlBuf == "" {
				htmlBuf = h
			}
			attachments = append(attachments, atts...)
		}
		return textBuf, htmlBuf, attachments
	}

	// Leaf part
	data, err := decodeTransferEncoding(body, header.Get("Content-Transfer-Encoding"))
	if err != nil {
		return "", "", nil
	}

	if strings.HasPrefix(mediaType, "text/html") {
		return "", string(data), nil
	}
	if strings.HasPrefix(mediaType, "text/plain") {
		return string(data), "", nil
	}

	// Any non-text file or file with name
	if filename != "" || (!strings.HasPrefix(mediaType, "text/") && len(data) > 0) {
		if filename == "" {
			filename = "attachment"
		}
		return "", "", []parsedAttachmentItem{{
			Filename: filename,
			Mime:     mediaType,
			Data:     data,
		}}
	}

	return string(data), "", nil
}

func parseEML(raw []byte) (string, string, []parsedAttachmentItem) {
	msg, err := netmail.ReadMessage(bytes.NewReader(raw))
	if err != nil {
		return string(raw), "", nil
	}

	t, h, atts := parseMIMEEntity(msg.Header, msg.Body)
	if t == "" && h != "" {
		re := regexp.MustCompile(`<[^>]*>`)
		t = strings.TrimSpace(re.ReplaceAllString(h, " "))
	}
	return t, h, atts
}

// parseEMLBody extracts plain text and HTML from raw RFC 822 email bytes
func parseEMLBody(raw []byte) (string, string) {
	t, h, _ := parseEML(raw)
	return t, h
}
