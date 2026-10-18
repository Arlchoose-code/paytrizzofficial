package admin

import (
	"encoding/json"
	"paytrizz-backend/models"
	"testing"
)

func TestFormatJSONSettingValue(t *testing.T) {
	tests := []struct {
		name     string
		key      string
		input    string
		sType    models.SettingType
		expected string
	}{
		{"empty string", "custom_key", "", models.SettingTypeString, `""`},
		{"whitespace string", "custom_key", "   ", models.SettingTypeString, `"   "`},
		{"quoted string", "custom_key", `"hello"`, models.SettingTypeJSON, `"hello"`},
		{"unquoted plain string", "custom_key", "hello", models.SettingTypeString, `"hello"`},
		{"boolean true", "feature_x", "true", models.SettingTypeBool, "true"},
		{"boolean false", "feature_x", "false", models.SettingTypeBool, "false"},
		{"number", "max_count", "120", models.SettingTypeInt, "120"},
		{"zero", "max_count", "0", models.SettingTypeInt, "0"},
		{"leading zero phone", "contact_phone", "0812345678", models.SettingTypeString, `"0812345678"`},
		{"plus sign phone", "contact_phone", "+62812345678", models.SettingTypeString, `"+62812345678"`},
		{"formatted phone", "contact_phone", "+62 812-3456-7890", models.SettingTypeString, `"+62 812-3456-7890"`},
		{"valid json object", "custom_config", `{"key":"val"}`, models.SettingTypeJSON, `{"key":"val"}`},
		{"valid json array", "custom_list", `["a","b"]`, models.SettingTypeJSON, `["a","b"]`},
		{"url string", "logo_url", "/uploads/2026/10/logo.webp", models.SettingTypeString, `"/uploads/2026/10/logo.webp"`},
		{"policy drop", "mail_policy", "drop", models.SettingTypeString, `"drop"`},
		{"domain", "mail_domain", "paytrizz.com", models.SettingTypeString, `"paytrizz.com"`},
		{"title separator 9", "title_separator", "9", models.SettingTypeString, `"9"`},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			got := formatJSONSettingValue(tt.key, tt.input, tt.sType)
			if got != tt.expected {
				t.Errorf("formatJSONSettingValue(%q, %q, %q) = %q, want %q", tt.key, tt.input, tt.sType, got, tt.expected)
			}
			if !json.Valid([]byte(got)) {
				t.Errorf("formatJSONSettingValue(%q, %q, %q) produced invalid JSON: %q", tt.key, tt.input, tt.sType, got)
			}
		})
	}
}
