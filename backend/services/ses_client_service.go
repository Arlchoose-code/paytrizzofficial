package services

import (
	"bytes"
	"context"
	"encoding/base64"
	"fmt"
	"io"
	"log"
	"mime"
	"mime/multipart"
	"mime/quotedprintable"
	"net/textproto"
	"os"
	"path/filepath"
	"strings"

	"github.com/aws/aws-sdk-go-v2/aws"
	"github.com/aws/aws-sdk-go-v2/config"
	"github.com/aws/aws-sdk-go-v2/credentials"
	"github.com/aws/aws-sdk-go-v2/service/s3"
	"github.com/aws/aws-sdk-go-v2/service/sesv2"
	"github.com/aws/aws-sdk-go-v2/service/sesv2/types"
)

type SESClientService struct {
	client   *sesv2.Client
	s3Client *s3.Client
}

func NewSESClientService() *SESClientService {
	region := os.Getenv("AWS_REGION")
	if region == "" {
		region = "ap-southeast-1"
	}
	accessKey := os.Getenv("AWS_ACCESS_KEY_ID")
	secretKey := os.Getenv("AWS_SECRET_ACCESS_KEY")

	if accessKey == "" || secretKey == "" {
		log.Println("[SESClientService] Warning: AWS credentials not configured. SES calls will fail.")
		return &SESClientService{client: nil, s3Client: nil}
	}

	cfg, err := config.LoadDefaultConfig(context.Background(),
		config.WithRegion(region),
		config.WithCredentialsProvider(credentials.NewStaticCredentialsProvider(accessKey, secretKey, "")),
	)
	if err != nil {
		log.Printf("[SESClientService] Error loading AWS config: %v", err)
		return &SESClientService{client: nil, s3Client: nil}
	}

	return &SESClientService{
		client:   sesv2.NewFromConfig(cfg),
		s3Client: s3.NewFromConfig(cfg),
	}
}

func (s *SESClientService) SendEmail(from string, to []string, cc []string, bcc []string, subject string, bodyText string, bodyHTML *string) (*string, error) {
	if s.client == nil {
		return nil, fmt.Errorf("AWS SES client is not initialized (missing credentials)")
	}

	body := &types.Body{
		Text: &types.Content{
			Data: aws.String(bodyText),
		},
	}
	if bodyHTML != nil && *bodyHTML != "" {
		body.Html = &types.Content{
			Data: aws.String(*bodyHTML),
		}
	}

	dest := &types.Destination{}
	if len(to) > 0 {
		dest.ToAddresses = to
	}
	if len(cc) > 0 {
		dest.CcAddresses = cc
	}
	if len(bcc) > 0 {
		dest.BccAddresses = bcc
	}

	input := &sesv2.SendEmailInput{
		FromEmailAddress: aws.String(from),
		Destination:      dest,
		Content: &types.EmailContent{
			Simple: &types.Message{
				Subject: &types.Content{
					Data: aws.String(subject),
				},
				Body: body,
			},
		},
	}

	output, err := s.client.SendEmail(context.Background(), input)
	if err != nil {
		return nil, err
	}

	return output.MessageId, nil
}

type SESAttachment struct {
	Filename string
	Mime     string
	Data     []byte
}

func (s *SESClientService) SendRawEmail(from string, to []string, cc []string, bcc []string, rawData []byte) (*string, error) {
	if s.client == nil {
		return nil, fmt.Errorf("AWS SES client is not initialized (missing credentials)")
	}

	dest := &types.Destination{}
	if len(to) > 0 {
		dest.ToAddresses = to
	}
	if len(cc) > 0 {
		dest.CcAddresses = cc
	}
	if len(bcc) > 0 {
		dest.BccAddresses = bcc
	}

	input := &sesv2.SendEmailInput{
		FromEmailAddress: aws.String(from),
		Destination:      dest,
		Content: &types.EmailContent{
			Raw: &types.RawMessage{
				Data: rawData,
			},
		},
	}

	output, err := s.client.SendEmail(context.Background(), input)
	if err != nil {
		return nil, err
	}

	return output.MessageId, nil
}

func BuildRawMIME(from string, to []string, cc []string, subject string, bodyText string, bodyHTML *string, attachments []SESAttachment) ([]byte, error) {
	buf := new(bytes.Buffer)
	mixedWriter := multipart.NewWriter(buf)

	fmt.Fprintf(buf, "From: %s\r\n", from)
	if len(to) > 0 {
		fmt.Fprintf(buf, "To: %s\r\n", strings.Join(to, ", "))
	}
	if len(cc) > 0 {
		fmt.Fprintf(buf, "Cc: %s\r\n", strings.Join(cc, ", "))
	}

	subjectHdr := subject
	isSubjectASCII := true
	for _, r := range subject {
		if r > 127 {
			isSubjectASCII = false
			break
		}
	}
	if !isSubjectASCII {
		subjectHdr = mime.BEncoding.Encode("utf-8", subject)
	}
	fmt.Fprintf(buf, "Subject: %s\r\n", subjectHdr)
	fmt.Fprintf(buf, "MIME-Version: 1.0\r\n")
	fmt.Fprintf(buf, "Content-Type: multipart/mixed; boundary=\"%s\"\r\n\r\n", mixedWriter.Boundary())

	if bodyHTML != nil && *bodyHTML != "" {
		altBuf := new(bytes.Buffer)
		altWriter := multipart.NewWriter(altBuf)

		bodyPartHeader := make(textproto.MIMEHeader)
		bodyPartHeader.Set("Content-Type", fmt.Sprintf("multipart/alternative; boundary=\"%s\"", altWriter.Boundary()))
		partWriter, err := mixedWriter.CreatePart(bodyPartHeader)
		if err != nil {
			return nil, err
		}

		// Text part
		textHeader := make(textproto.MIMEHeader)
		textHeader.Set("Content-Type", "text/plain; charset=UTF-8")
		textHeader.Set("Content-Transfer-Encoding", "quoted-printable")
		tp, err := altWriter.CreatePart(textHeader)
		if err == nil {
			qp := quotedprintable.NewWriter(tp)
			_, _ = qp.Write([]byte(bodyText))
			_ = qp.Close()
		}

		// HTML part
		htmlHeader := make(textproto.MIMEHeader)
		htmlHeader.Set("Content-Type", "text/html; charset=UTF-8")
		htmlHeader.Set("Content-Transfer-Encoding", "quoted-printable")
		hp, err := altWriter.CreatePart(htmlHeader)
		if err == nil {
			qp := quotedprintable.NewWriter(hp)
			_, _ = qp.Write([]byte(*bodyHTML))
			_ = qp.Close()
		}

		_ = altWriter.Close()
		_, _ = partWriter.Write(altBuf.Bytes())
	} else {
		textHeader := make(textproto.MIMEHeader)
		textHeader.Set("Content-Type", "text/plain; charset=UTF-8")
		textHeader.Set("Content-Transfer-Encoding", "quoted-printable")
		tp, err := mixedWriter.CreatePart(textHeader)
		if err == nil {
			qp := quotedprintable.NewWriter(tp)
			_, _ = qp.Write([]byte(bodyText))
			_ = qp.Close()
		}
	}

	for _, att := range attachments {
		attHeader := make(textproto.MIMEHeader)
		mimeType := att.Mime
		if mimeType == "" {
			mimeType = "application/octet-stream"
		}
		cleanName := filepath.Base(att.Filename)
		attHeader.Set("Content-Type", fmt.Sprintf("%s; name=\"%s\"", mimeType, cleanName))
		attHeader.Set("Content-Disposition", fmt.Sprintf("attachment; filename=\"%s\"", cleanName))
		attHeader.Set("Content-Transfer-Encoding", "base64")

		ap, err := mixedWriter.CreatePart(attHeader)
		if err != nil {
			continue
		}

		encoded := base64.StdEncoding.EncodeToString(att.Data)
		for len(encoded) > 76 {
			_, _ = ap.Write([]byte(encoded[:76] + "\r\n"))
			encoded = encoded[76:]
		}
		if len(encoded) > 0 {
			_, _ = ap.Write([]byte(encoded + "\r\n"))
		}
	}

	_ = mixedWriter.Close()
	return buf.Bytes(), nil
}

func (s *SESClientService) SendEmailWithAttachments(from string, to []string, cc []string, bcc []string, subject string, bodyText string, bodyHTML *string, attachments []SESAttachment) (*string, error) {
	if len(attachments) == 0 {
		return s.SendEmail(from, to, cc, bcc, subject, bodyText, bodyHTML)
	}

	rawMIME, err := BuildRawMIME(from, to, cc, subject, bodyText, bodyHTML, attachments)
	if err != nil {
		return nil, err
	}

	return s.SendRawEmail(from, to, cc, bcc, rawMIME)
}

func (s *SESClientService) DownloadS3Object(bucket, key string) ([]byte, error) {
	if s.s3Client == nil {
		return nil, fmt.Errorf("S3 client is not initialized")
	}

	out, err := s.s3Client.GetObject(context.Background(), &s3.GetObjectInput{
		Bucket: aws.String(bucket),
		Key:    aws.String(key),
	})
	if err != nil {
		return nil, err
	}
	defer out.Body.Close()

	return io.ReadAll(out.Body)
}
