package services

import (
	"paytrizz-backend/helpers"
	"testing"
)

func TestThreadSubjectNormalization(t *testing.T) {
	tests := []struct {
		subject  string
		expected string
	}{
		{"kontol", "kontol"},
		{"Re: kontol", "kontol"},
		{"RE: kontol", "kontol"},
		{"Fwd: Re: kontol", "kontol"},
		{"Re: [External]: Important Thread", "Important Thread"},
		{"Aw: Projektplanung", "Projektplanung"},
		{"Sv: Mötesanteckningar", "Mötesanteckningar"},
		{"Vs: Faktura", "Faktura"},
		{"Re[3]: Thread with counter", "Thread with counter"},
		{"Balas: Meeting notes", "Meeting notes"},
		{"Teruskan: FW: Meeting notes", "Meeting notes"},
		{"", ""},
		{"   ", ""},
		{"(no subject)", "(no subject)"},
	}

	for _, tt := range tests {
		normalized := helpers.NormalizeMailSubject(tt.subject)
		if normalized != tt.expected {
			t.Errorf("NormalizeMailSubject(%q) = %q; expected %q", tt.subject, normalized, tt.expected)
		}
	}
}
