package services

import (
	"strings"
	"testing"
)

func TestInterpolateTemplate(t *testing.T) {
	tests := []struct {
		name         string
		subject      string
		bodyHTML     string
		bodyText     string
		vars         map[string]string
		wantSubject  string
		wantContains []string
		dontContain  []string
	}{
		{
			name:        "talent creation aliases and initial password",
			subject:     "Welcome {{name}}!",
			bodyHTML:    "<p>Email: {{email}}</p><p>Password: {{initial_password}}</p><a href=\"{{login_url}}\">Sign in</a>",
			bodyText:    "Email: {{login_email}}\nPass: {{password}}",
			vars: map[string]string{
				"name":        "Syahrul",
				"email":       "syahrul@paytrizz.com",
				"password":    "Secret123!",
			},
			wantSubject: "Welcome Syahrul!",
			wantContains: []string{
				"Email: syahrul@paytrizz.com",
				"Password: Secret123!",
				"Pass: Secret123!",
				"Sign in",
			},
			dontContain: []string{"{{", "}}"},
		},
		{
			name:     "content approval with dynamic urls",
			subject:  "Approved: {{title}}",
			bodyHTML: "Hi {{talent_name}}, your {{entity_type}} {{title}} is live: {{public_url}}",
			bodyText: "Review queue: {{approvals_url}}",
			vars: map[string]string{
				"talent_name":   "Alex",
				"entity_type":   "portfolio project",
				"title":         "Fintech App",
				"public_url":    "https://paytrizz.com/projects/fintech-app",
				"review_url":    "https://paytrizz.com/admin/approvals",
			},
			wantSubject: "Approved: Fintech App",
			wantContains: []string{
				"Hi Alex",
				"portfolio project Fintech App is live: https://paytrizz.com/projects/fintech-app",
				"Review queue: https://paytrizz.com/admin/approvals",
			},
			dontContain: []string{"{{", "}}"},
		},
		{
			name:     "unresolved placeholders are purged cleanly",
			subject:  "Ticket {{ticket_code}}: {{subject}}",
			bodyHTML: "<p>Name: {{full_name}}</p><p>Extra: {{unknown_variable}}</p>",
			bodyText: "Msg: {{message}} leftover {{missing_var}}",
			vars: map[string]string{
				"ticket_code": "PTZ-999",
				"subject":     "Help Needed",
				"full_name":   "Jane Doe",
				"message":     "Hello",
			},
			wantSubject: "Ticket PTZ-999: Help Needed",
			wantContains: []string{
				"Name: Jane Doe",
				"Extra: ",
				"Msg: Hello leftover ",
			},
			dontContain: []string{"{{unknown_variable}}", "{{missing_var}}", "{{", "}}"},
		},
	}

	for _, tt := range tests {
		t.Run(tt.name, func(t *testing.T) {
			gotSub, gotHTML, gotText := InterpolateTemplate(tt.subject, tt.bodyHTML, tt.bodyText, tt.vars)
			if gotSub != tt.wantSubject {
				t.Errorf("subject = %q, want %q", gotSub, tt.wantSubject)
			}
			for _, exp := range tt.wantContains {
				if !strings.Contains(gotHTML, exp) && !strings.Contains(gotText, exp) {
					t.Errorf("expected %q in HTML or Text, got HTML: %q, Text: %q", exp, gotHTML, gotText)
				}
			}
			for _, bad := range tt.dontContain {
				if strings.Contains(gotSub, bad) || strings.Contains(gotHTML, bad) || strings.Contains(gotText, bad) {
					t.Errorf("found unwanted %q in output: Sub=%q, HTML=%q, Text=%q", bad, gotSub, gotHTML, gotText)
				}
			}
		})
	}
}
