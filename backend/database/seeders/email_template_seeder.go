package seeders

import (
	"encoding/json"
	"log"
	"paytrizz-backend/models"

	"gorm.io/datatypes"
	"gorm.io/gorm"
)

type EmailTemplateSeeder struct{}

func NewEmailTemplateSeeder() *EmailTemplateSeeder {
	return &EmailTemplateSeeder{}
}

func (s *EmailTemplateSeeder) Run(db *gorm.DB) error {
	templates := []struct {
		Key       string
		Name      string
		Subject   string
		BodyHTML  string
		BodyText  string
		Variables []string
	}{
		{
			Key:     "talent_account_created",
			Name:    "Talent Account Welcome & Credentials",
			Subject: "Welcome to PayTrizz — Your Specialist Account is Ready",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Talent Agency</div>
<h2 style="color:#1D2023;margin-top:24px;">Welcome to the Squad, {{name}}!</h2>
<p style="color:#4B5563;line-height:1.6;">You have been onboarded as a specialist at PayTrizz. Your temporary credentials have been generated:</p>
<div style="background:#FFFDD9;border:1px solid #FCCF00;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:4px 0;color:#1D2023;"><strong>Login Email:</strong> {{email}}</p>
<p style="margin:4px 0;color:#1D2023;"><strong>Initial Password:</strong> {{initial_password}}</p>
</div>
<p style="color:#4B5563;">You will be prompted to change your password upon your first sign in.</p>
<div style="text-align:center;margin:28px 0;">
<a href="{{login_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:12px 28px;border-radius:9999px;text-decoration:none;display:inline-block;">Sign In to Talent Portal &rarr;</a>
</div>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
<p style="color:#9CA3AF;font-size:12px;text-align:center;">PayTrizz Talent Agency &bull; All Rights Reserved</p>
</div>`,
			BodyText: `Welcome to PayTrizz, {{name}}!\n\nYour specialist account has been created.\nLogin Email: {{email}}\nInitial Password: {{initial_password}}\n\nPlease sign in and update your password: {{login_url}}`,
			Variables: []string{"name", "email", "initial_password", "login_url"},
		},
		{
			Key:     "password_reset",
			Name:    "Password Reset Request",
			Subject: "Reset Your PayTrizz Password",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Security</div>
<h2 style="color:#1D2023;margin-top:24px;">Password Reset Request</h2>
<p style="color:#4B5563;line-height:1.6;">Hello {{name}}, we received a request to reset your password. Click the button below to proceed:</p>
<div style="text-align:center;margin:28px 0;">
<a href="{{reset_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:12px 28px;border-radius:9999px;text-decoration:none;display:inline-block;">Reset Password &rarr;</a>
</div>
<p style="color:#6B7280;font-size:13px;">This link will expire in 60 minutes. If you did not request this, please ignore this email.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
<p style="color:#9CA3AF;font-size:12px;text-align:center;">PayTrizz Talent Agency &bull; Security Team</p>
</div>`,
			BodyText: `Hello {{name}},\n\nClick the link to reset your password: {{reset_url}}\nThis link expires in 60 minutes.`,
			Variables: []string{"name", "reset_url"},
		},
		{
			Key:     "password_changed",
			Name:    "Password Successfully Changed",
			Subject: "Your PayTrizz Password Has Been Changed",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Security</div>
<h2 style="color:#1D2023;margin-top:24px;">Password Changed Successfully</h2>
<p style="color:#4B5563;line-height:1.6;">Hello {{name}}, your account password was successfully updated on {{timestamp}} from IP {{ip}}.</p>
<p style="color:#4B5563;">If you did not perform this change, please contact security immediately.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
<p style="color:#9CA3AF;font-size:12px;text-align:center;">PayTrizz Talent Agency</p>
</div>`,
			BodyText: `Hello {{name}},\n\nYour password was updated on {{timestamp}}. If this wasn't you, contact us immediately.`,
			Variables: []string{"name", "timestamp", "ip"},
		},
		{
			Key:     "contact_visitor_confirmation",
			Name:    "Contact Visitor Confirmation",
			Subject: "We Received Your Message — Ticket {{ticket_code}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Inquiry</div>
<h2 style="color:#1D2023;margin-top:24px;">Thank you for contacting us, {{name}}!</h2>
<p style="color:#4B5563;line-height:1.6;">Your message has been assigned tracking code: <strong style="color:#1D2023;">{{ticket_code}}</strong>.</p>
<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:0 0 8px 0;color:#6B7280;font-size:12px;text-transform:uppercase;font-weight:700;">Your Message Summary</p>
<p style="margin:4px 0;color:#1D2023;"><strong>Subject:</strong> {{subject}}</p>
<p style="margin:4px 0;color:#4B5563;">{{message}}</p>
</div>
<p style="color:#4B5563;">{{reply_eta}}</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
<p style="color:#9CA3AF;font-size:12px;text-align:center;">PayTrizz Talent Agency &bull; hello@paytrizz.com</p>
</div>`,
			BodyText: `Thank you {{name}}! We received your message.\nTicket: {{ticket_code}}\nSubject: {{subject}}\n{{reply_eta}}`,
			Variables: []string{"name", "ticket_code", "subject", "message", "reply_eta"},
		},
		{
			Key:     "contact_admin_notification",
			Name:    "Contact Admin Notification",
			Subject: "[New Inquiry] {{ticket_code}}: {{subject}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">New Contact Inquiry</div>
<h2 style="color:#1D2023;margin-top:24px;">Inquiry from {{name}}</h2>
<p style="color:#4B5563;"><strong>Ticket:</strong> {{ticket_code}}<br /><strong>Email:</strong> {{email}}<br /><strong>Phone:</strong> {{phone}}</p>
<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:0 0 8px 0;color:#6B7280;font-size:12px;font-weight:700;">SUBJECT: {{subject}}</p>
<p style="color:#1D2023;line-height:1.6;">{{message}}</p>
</div>
<a href="{{admin_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:10px 24px;border-radius:9999px;text-decoration:none;display:inline-block;">Open in Admin Messages &rarr;</a>
</div>`,
			BodyText: `New Inquiry [{{ticket_code}}]\nFrom: {{name}} ({{email}})\nSubject: {{subject}}\nMessage:\n{{message}}\nAdmin URL: {{admin_url}}`,
			Variables: []string{"ticket_code", "name", "email", "phone", "subject", "message", "admin_url"},
		},
		{
			Key:     "contact_talent_notification",
			Name:    "Direct Talent Contact Notification",
			Subject: "[Direct Inquiry] {{ticket_code}} from {{visitor_name}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Client Inquiry</div>
<h2 style="color:#1D2023;margin-top:24px;">Hello {{talent_name}},</h2>
<p style="color:#4B5563;">You have a direct engagement inquiry from <strong>{{visitor_name}}</strong> ({{visitor_email}}).</p>
<div style="background:#FFFDD9;border:1px solid #FCCF00;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:0 0 8px 0;color:#1D2023;font-weight:700;">Subject: {{subject}}</p>
<p style="color:#1D2023;line-height:1.6;">{{message}}</p>
</div>
<a href="{{talent_dashboard_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:10px 24px;border-radius:9999px;text-decoration:none;display:inline-block;">View in Talent Portal &rarr;</a>
</div>`,
			BodyText: `Hello {{talent_name}},\n\nDirect inquiry from {{visitor_name}} ({{visitor_email}})\nTicket: {{ticket_code}}\nSubject: {{subject}}\nMessage: {{message}}\nPortal: {{talent_dashboard_url}}`,
			Variables: []string{"talent_name", "visitor_name", "visitor_email", "ticket_code", "subject", "message", "talent_dashboard_url"},
		},
		{
			Key:     "application_visitor_confirmation",
			Name:    "Application Submission Confirmation",
			Subject: "Application Received — Ticket {{ticket_code}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Squad Network</div>
<h2 style="color:#1D2023;margin-top:24px;">Application Received, {{full_name}}!</h2>
<p style="color:#4B5563;line-height:1.6;">Thank you for your {{application_type}} submission. Your application tracking code is <strong style="color:#1D2023;">{{ticket_code}}</strong>.</p>
<p style="color:#4B5563;">Our leadership team reviews every submission within 2 to 3 business days.</p>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
<p style="color:#9CA3AF;font-size:12px;text-align:center;">PayTrizz Talent Agency</p>
</div>`,
			BodyText: `Hello {{full_name}},\n\nYour {{application_type}} application has been received with ticket code {{ticket_code}}.\nOur leadership team will review it shortly.`,
			Variables: []string{"full_name", "application_type", "ticket_code"},
		},
		{
			Key:     "application_admin_notification",
			Name:    "New Application Admin Notification",
			Subject: "[New {{application_type}}] {{ticket_code}} from {{full_name}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">New {{application_type}} Application</div>
<h2 style="color:#1D2023;margin-top:24px;">{{full_name}} ({{email}})</h2>
<p style="color:#4B5563;">Ticket: <strong>{{ticket_code}}</strong></p>
<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:20px 0;">
<p style="color:#1D2023;">{{message}}</p>
</div>
<a href="{{admin_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:10px 24px;border-radius:9999px;text-decoration:none;display:inline-block;">Review in Admin Applications &rarr;</a>
</div>`,
			BodyText: `New {{application_type}} Application [{{ticket_code}}]\nName: {{full_name}} ({{email}})\nMessage: {{message}}\nAdmin: {{admin_url}}`,
			Variables: []string{"application_type", "ticket_code", "full_name", "email", "message", "admin_url"},
		},
		{
			Key:     "application_status_update",
			Name:    "Application Status Update",
			Subject: "Update Regarding Your Application — Ticket {{ticket_code}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">PayTrizz Application Status</div>
<h2 style="color:#1D2023;margin-top:24px;">Status Update for {{full_name}}</h2>
<p style="color:#4B5563;">Your application ({{ticket_code}}) status has been updated to: <strong style="color:#1D2023;text-transform:uppercase;">{{new_status}}</strong>.</p>
<div style="background:#F9FAFB;border:1px solid #E5E7EB;border-radius:8px;padding:16px;margin:20px 0;">
<p style="color:#4B5563;">{{notes}}</p>
</div>
<hr style="border:none;border-top:1px solid #E5E7EB;margin:24px 0;" />
<p style="color:#9CA3AF;font-size:12px;text-align:center;">PayTrizz Talent Agency</p>
</div>`,
			BodyText: `Hello {{full_name}},\n\nYour application {{ticket_code}} status is now {{new_status}}.\nNotes: {{notes}}`,
			Variables: []string{"full_name", "ticket_code", "new_status", "notes"},
		},
		{
			Key:     "content_submitted_admin_notification",
			Name:    "Content Submitted for Approval",
			Subject: "[Content Review] {{entity_type}} submitted by {{talent_name}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">Content Review Required</div>
<h2 style="color:#1D2023;margin-top:24px;">{{entity_type}} Submitted</h2>
<p style="color:#4B5563;">{{talent_name}} submitted &ldquo;{{title}}&rdquo; for publication.</p>
<a href="{{approvals_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:10px 24px;border-radius:9999px;text-decoration:none;display:inline-block;margin-top:16px;">Open Approvals Queue &rarr;</a>
</div>`,
			BodyText: `Content Review Required:\n{{talent_name}} submitted {{entity_type}} "{{title}}".\nQueue: {{approvals_url}}`,
			Variables: []string{"entity_type", "talent_name", "title", "approvals_url"},
		},
		{
			Key:     "content_approved",
			Name:    "Content Approved Notification",
			Subject: "Your {{entity_type}} has been approved and published!",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">Content Published!</div>
<h2 style="color:#1D2023;margin-top:24px;">Great news, {{talent_name}}!</h2>
<p style="color:#4B5563;">Your {{entity_type}} &ldquo;{{title}}&rdquo; was approved by our editorial team and is now live.</p>
<a href="{{public_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:10px 24px;border-radius:9999px;text-decoration:none;display:inline-block;margin-top:16px;">View Live on Website &rarr;</a>
</div>`,
			BodyText: `Hello {{talent_name}},\n\nYour {{entity_type}} "{{title}}" has been approved and is now live: {{public_url}}`,
			Variables: []string{"talent_name", "entity_type", "title", "public_url"},
		},
		{
			Key:     "content_rejected",
			Name:    "Content Revision Requested / Rejected",
			Subject: "Revision Requested for Your {{entity_type}}",
			BodyHTML: `<div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:24px;border:1px solid #E5E7EB;border-radius:16px;background:#ffffff;">
<div style="background:#FCCF00;padding:16px;border-radius:12px;font-weight:900;font-size:20px;color:#1D2023;text-align:center;">Revision Requested</div>
<h2 style="color:#1D2023;margin-top:24px;">Hello {{talent_name}},</h2>
<p style="color:#4B5563;">Your {{entity_type}} &ldquo;{{title}}&rdquo; requires revisions before it can be published.</p>
<div style="background:#FFF3B0;border:1px solid #FCCF00;border-radius:8px;padding:16px;margin:20px 0;">
<p style="margin:0 0 8px 0;color:#1D2023;font-weight:700;">Reviewer Notes:</p>
<p style="color:#1D2023;">{{review_note}}</p>
</div>
<a href="{{edit_url}}" style="background:#FCCF00;color:#1D2023;font-weight:800;padding:10px 24px;border-radius:9999px;text-decoration:none;display:inline-block;">Edit and Resubmit &rarr;</a>
</div>`,
			BodyText: `Hello {{talent_name}},\n\nYour {{entity_type}} "{{title}}" requires revisions.\nNotes: {{review_note}}\nEdit: {{edit_url}}`,
			Variables: []string{"talent_name", "entity_type", "title", "review_note", "edit_url"},
		},
	}

	for _, item := range templates {
		var existing models.EmailTemplate
		varsJSON, _ := json.Marshal(item.Variables)
		err := db.Where("`key` = ?", item.Key).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			newTmpl := models.EmailTemplate{
				Key:       item.Key,
				Name:      item.Name,
				Subject:   item.Subject,
				BodyHTML:  item.BodyHTML,
				BodyText:  item.BodyText,
				Variables: datatypes.JSON(varsJSON),
				IsActive:  true,
			}
			if err := db.Create(&newTmpl).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] 12 Email Templates seeded successfully")
	return nil
}
