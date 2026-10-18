package helpers

import "testing"

func TestNormalizeMailSubject(t *testing.T) {
	tests := []struct {
		input    string
		expected string
	}{
		{"kontol", "kontol"},
		{"Re: kontol", "kontol"},
		{"RE: kontol", "kontol"},
		{"re:  kontol", "kontol"},
		{"Fwd: Re: kontol", "kontol"},
		{"FW: [External]: Important Meeting", "Important Meeting"},
		{"[Spam]: Urgent Account Alert", "Urgent Account Alert"},
		{"Aw: Projektplanung", "Projektplanung"},
		{"Sv: Mötesanteckningar", "Mötesanteckningar"},
		{"Vs: Faktura", "Faktura"},
		{"Re[2]: kontol", "kontol"},
		{"Re(3): kontol", "kontol"},
		{"Balas: Penawaran Kerja", "Penawaran Kerja"},
		{"Teruskan: Fwd: Dokumen", "Dokumen"},
		{"", ""},
		{"   ", ""},
		{"Re:", ""},
		{"Re: [External]:   ", ""},
	}

	for _, tc := range tests {
		actual := NormalizeMailSubject(tc.input)
		if actual != tc.expected {
			t.Errorf("NormalizeMailSubject(%q) = %q; want %q", tc.input, actual, tc.expected)
		}
	}
}
