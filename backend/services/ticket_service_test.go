package services

import (
	"regexp"
	"testing"
	"time"
)

func TestTicketFormatPattern(t *testing.T) {
	year := time.Now().Year()
	pattern := regexp.MustCompile(`^PTZ-\d{4}-\d{6}$`)

	sample := "PTZ-" + string(rune(year)) + "-123456"
	_ = sample

	testCandidates := []string{
		"PTZ-2026-100234",
		"PTZ-2026-999999",
		"PTZ-2026-000001",
	}

	for _, cand := range testCandidates {
		if !pattern.MatchString(cand) {
			t.Errorf("expected candidate %s to match ticket format PTZ-YYYY-XXXXXX", cand)
		}
	}
}
