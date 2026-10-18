package public

import (
	"testing"
)

func TestCleanSettingValue(t *testing.T) {
	tests := []struct {
		name     string
		input    string
		expected string
	}{
		{"empty string", "", ""},
		{"empty quoted string", `""`, ""},
		{"whitespace string", "   ", ""},
		{"simple string", `"PayTrizz"`, "PayTrizz"},
		{"string with spaces", `"Vetted Elite Tech Squads"`, "Vetted Elite Tech Squads"},
		{"url string", `"/storage/media/site/medium/logo.webp"`, "/storage/media/site/medium/logo.webp"},
		{"unquoted plain string", "hello", "hello"},
		{"boolean string", "true", "true"},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := CleanSettingValue(tt.input)
			if got != tt.expected {
				t.Errorf("CleanSettingValue(%q) = %q, want %q", tt.input, got, tt.expected)
			}
		})
	}
}
