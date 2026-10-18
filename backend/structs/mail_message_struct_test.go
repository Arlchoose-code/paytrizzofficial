package structs

import (
	"encoding/json"
	"testing"
)

func TestMailComposeRequest_DraftEmptyFields(t *testing.T) {
	// An empty draft should unmarshal cleanly without requiring To, Subject, or BodyText
	draftJSON := `{"mailbox_id": 1, "is_draft": true, "to": []}`
	var req MailComposeRequest
	if err := json.Unmarshal([]byte(draftJSON), &req); err != nil {
		t.Fatalf("failed to unmarshal empty draft payload: %v", err)
	}
	if req.MailboxID != 1 {
		t.Errorf("expected mailbox_id 1, got %d", req.MailboxID)
	}
	if !req.IsDraft {
		t.Errorf("expected is_draft true")
	}
	if len(req.To) != 0 {
		t.Errorf("expected empty To list")
	}
	if req.Subject != "" {
		t.Errorf("expected empty subject, got %s", req.Subject)
	}
}
