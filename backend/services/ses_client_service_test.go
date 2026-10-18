package services

import (
	"bytes"
	"mime"
	"net/mail"
	"strings"
	"testing"
)

func TestBuildRawMIME_LineWrappingAndRoundTrip(t *testing.T) {
	from := "\"Syahril Haryono\" <syahrul@paytrizz.com>"
	to := []string{"client@external.com"}
	cc := []string{"boss@external.com"}
	subject := "Project Proposal & Large Attachment"
	bodyText := "Hello,\nPlease see the attached document."
	bodyHTMLStr := "<p>Hello,<br/>Please see the attached document.</p>"

	// 5KB random binary data
	largeData := make([]byte, 5000)
	for i := range largeData {
		largeData[i] = byte(i % 256)
	}

	attachments := []SESAttachment{
		{
			Filename: "large_document.pdf",
			Mime:     "application/pdf",
			Data:     largeData,
		},
	}

	rawMIME, err := BuildRawMIME(from, to, cc, subject, bodyText, &bodyHTMLStr, attachments)
	if err != nil {
		t.Fatalf("BuildRawMIME failed: %v", err)
	}

	// 1. Verify RFC 5322 Section 2.1.1: Every line MUST be <= 998 characters (excluding CRLF)
	// and base64 lines SHOULD be <= 78 chars.
	lines := strings.Split(string(rawMIME), "\r\n")
	for i, line := range lines {
		if len(line) > 998 {
			t.Errorf("Line %d exceeds RFC 5322 limit of 998 chars (length: %d)", i, len(line))
		}
	}

	// 2. Verify basic email parsing
	parsedMsg, err := mail.ReadMessage(bytes.NewReader(rawMIME))
	if err != nil {
		t.Fatalf("Failed to parse generated MIME message: %v", err)
	}

	if parsedMsg.Header.Get("Subject") != subject {
		t.Errorf("Expected subject %q, got %q", subject, parsedMsg.Header.Get("Subject"))
	}
	if parsedMsg.Header.Get("From") != from {
		t.Errorf("Expected from %q, got %q", from, parsedMsg.Header.Get("From"))
	}
	if parsedMsg.Header.Get("Cc") != "boss@external.com" {
		t.Errorf("Expected cc %q, got %q", "boss@external.com", parsedMsg.Header.Get("Cc"))
	}
}

func TestBuildRawMIME_UTF8SubjectAndNonASCII(t *testing.T) {
	from := "\"Syahril\" <arl@paytrizz.com>"
	to := []string{"recipient@example.com"}
	cc := []string{"team@example.com"}
	subject := "🔥 Special Announcement & Review 🎉"
	bodyText := "Hello team,\nTesting emojis."

	rawMIME, err := BuildRawMIME(from, to, cc, subject, bodyText, nil, nil)
	if err != nil {
		t.Fatalf("BuildRawMIME failed: %v", err)
	}

	parsedMsg, err := mail.ReadMessage(bytes.NewReader(rawMIME))
	if err != nil {
		t.Fatalf("Failed to parse message: %v", err)
	}

	dec := new(mime.WordDecoder)
	decodedSubject, err := dec.DecodeHeader(parsedMsg.Header.Get("Subject"))
	if err != nil {
		t.Fatalf("Failed to decode subject header: %v", err)
	}
	if decodedSubject != subject {
		t.Errorf("Expected decoded subject %q, got %q", subject, decodedSubject)
	}
}
