package public

import (
	"strings"
	"testing"
)

func TestParseEMLBody_GmailStyle(t *testing.T) {
	rawEML := []byte("From: sender@gmail.com\r\n" +
		"To: syahrul@paytrizz.com\r\n" +
		"Subject: Tes Terima\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: multipart/alternative; boundary=\"000000000000boundary123\"\r\n\r\n" +
		"--000000000000boundary123\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
		"Content-Transfer-Encoding: quoted-printable\r\n\r\n" +
		"Tes terima 1 dari Gmail=20\r\n\r\n" +
		"--000000000000boundary123\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"Content-Transfer-Encoding: quoted-printable\r\n\r\n" +
		"<div dir=\"ltr\">Tes terima 1 dari Gmail</div>\r\n\r\n" +
		"--000000000000boundary123--\r\n")

	bodyText, bodyHTML := parseEMLBody(rawEML)

	if !strings.Contains(bodyText, "Tes terima 1 dari Gmail") {
		t.Errorf("Expected bodyText to contain 'Tes terima 1 dari Gmail', got: %q", bodyText)
	}
	if !strings.Contains(bodyHTML, "<div dir=\"ltr\">Tes terima 1 dari Gmail</div>") {
		t.Errorf("Expected bodyHTML to contain HTML snippet, got: %q", bodyHTML)
	}
}

func TestParseEML_NestedWithAttachment(t *testing.T) {
	rawEML := []byte("From: client@example.com\r\n" +
		"To: talent@paytrizz.com\r\n" +
		"Subject: Project Proposal with File\r\n" +
		"MIME-Version: 1.0\r\n" +
		"Content-Type: multipart/mixed; boundary=\"mixed_bnd_456\"\r\n\r\n" +
		"--mixed_bnd_456\r\n" +
		"Content-Type: multipart/alternative; boundary=\"alt_bnd_789\"\r\n\r\n" +
		"--alt_bnd_789\r\n" +
		"Content-Type: text/plain; charset=\"UTF-8\"\r\n" +
		"Content-Transfer-Encoding: 7bit\r\n\r\n" +
		"Please check the attached contract.\r\n" +
		"--alt_bnd_789\r\n" +
		"Content-Type: text/html; charset=\"UTF-8\"\r\n" +
		"Content-Transfer-Encoding: 7bit\r\n\r\n" +
		"<p>Please check the attached contract.</p>\r\n" +
		"--alt_bnd_789--\r\n" +
		"--mixed_bnd_456\r\n" +
		"Content-Type: application/pdf\r\n" +
		"Content-Disposition: attachment; filename=\"proposal.pdf\"\r\n" +
		"Content-Transfer-Encoding: base64\r\n\r\n" +
		"JVBERi0xLjQKJcTl8uXrCjEgMCBvYmoK\r\n" +
		"--mixed_bnd_456--\r\n")

	bodyText, bodyHTML, atts := parseEML(rawEML)

	if !strings.Contains(bodyText, "Please check the attached contract.") {
		t.Errorf("Unexpected bodyText: %q", bodyText)
	}
	if !strings.Contains(bodyHTML, "<p>Please check the attached contract.</p>") {
		t.Errorf("Unexpected bodyHTML: %q", bodyHTML)
	}
	if len(atts) != 1 {
		t.Fatalf("Expected 1 attachment, got %d", len(atts))
	}
	if atts[0].Filename != "proposal.pdf" {
		t.Errorf("Expected attachment name 'proposal.pdf', got %q", atts[0].Filename)
	}
	if len(atts[0].Data) == 0 {
		t.Errorf("Expected attachment data to be decoded, got 0 bytes")
	}
}
