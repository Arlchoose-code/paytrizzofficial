package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type SiteSettingSeeder struct{}

func NewSiteSettingSeeder() *SiteSettingSeeder {
	return &SiteSettingSeeder{}
}

func (s *SiteSettingSeeder) Run(db *gorm.DB) error {
	defaults := []models.SiteSetting{
		{
			Group:    "general",
			Key:      "site_name",
			Value:    `"PayTrizz"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "general",
			Key:      "site_tagline",
			Value:    `"Vetted Elite Tech Squads"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "general",
			Key:      "site_description",
			Value:    `"Talent Agency Platform connecting you with vetted specialists in development, design, and digital growth."`,
			Type:     models.SettingTypeText,
			IsPublic: true,
		},
		{
			Group:    "general",
			Key:      "footer_text",
			Value:    `"© 2026 PayTrizz. All rights reserved."`,
			Type:     models.SettingTypeText,
			IsPublic: true,
		},
		{
			Group:    "general",
			Key:      "logo_url",
			Value:    `""`,
			Type:     models.SettingTypeMedia,
			IsPublic: true,
		},
		{
			Group:    "general",
			Key:      "logo_dark_url",
			Value:    `""`,
			Type:     models.SettingTypeMedia,
			IsPublic: true,
		},
		{
			Group:    "general",
			Key:      "favicon_url",
			Value:    `""`,
			Type:     models.SettingTypeMedia,
			IsPublic: true,
		},
		{
			Group:    "seo",
			Key:      "title_separator",
			Value:    `"—"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "seo",
			Key:      "title_format",
			Value:    `"{title} — {site_name}"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "seo",
			Key:      "meta_keywords",
			Value:    `"talent agency, vetted developers, tech squad, PayTrizz"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "robots",
			Key:      "robots_allow_ai_crawler",
			Value:    `true`,
			Type:     models.SettingTypeBool,
			IsPublic: true,
		},
		{
			Group:    "robots",
			Key:      "robots_index_talents",
			Value:    `true`,
			Type:     models.SettingTypeBool,
			IsPublic: true,
		},
		{
			Group:    "robots",
			Key:      "robots_index_projects",
			Value:    `true`,
			Type:     models.SettingTypeBool,
			IsPublic: true,
		},
		{
			Group:    "robots",
			Key:      "robots_index_blog",
			Value:    `true`,
			Type:     models.SettingTypeBool,
			IsPublic: true,
		},
		{
			Group:    "features",
			Key:      "feature_turnstile",
			Value:    `false`,
			Type:     models.SettingTypeBool,
			IsPublic: true,
		},
		{
			Group:    "features",
			Key:      "feature_email_verification",
			Value:    `false`,
			Type:     models.SettingTypeBool,
			IsPublic: true,
		},
		{
			Group:    "notifications",
			Key:      "admin_notification_emails",
			Value:    `["admin@paytrizz.com"]`,
			Type:     models.SettingTypeJSON,
			IsPublic: false,
		},
		{
			Group:    "notifications",
			Key:      "notify_admin_on_talent_contact",
			Value:    `true`,
			Type:     models.SettingTypeBool,
			IsPublic: false,
		},
		{
			Group:    "contact",
			Key:      "contact_reply_eta_text",
			Value:    `"1–2 business days"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "contact",
			Key:      "contact_email",
			Value:    `"hello@paytrizz.com"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "contact",
			Key:      "contact_phone",
			Value:    `"+62 812-3456-7890"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "contact",
			Key:      "contact_address",
			Value:    `"Jakarta Selatan, DKI Jakarta, Indonesia"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "mail",
			Key:      "mail_domain",
			Value:    `"paytrizz.com"`,
			Type:     models.SettingTypeString,
			IsPublic: true,
		},
		{
			Group:    "mail",
			Key:      "mail_from_address",
			Value:    `"noreply@paytrizz.com"`,
			Type:     models.SettingTypeString,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_reply_to_address",
			Value:    `"hello@paytrizz.com"`,
			Type:     models.SettingTypeString,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "aws_ses_region",
			Value:    `"ap-southeast-1"`,
			Type:     models.SettingTypeString,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "aws_s3_bucket",
			Value:    `"paytrizz-ses-inbound"`,
			Type:     models.SettingTypeString,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_unknown_policy",
			Value:    `"drop"`,
			Type:     models.SettingTypeString,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_max_mailboxes_per_talent",
			Value:    `0`,
			Type:     models.SettingTypeInt,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_send_limit_hour",
			Value:    `50`,
			Type:     models.SettingTypeInt,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_send_limit_day",
			Value:    `200`,
			Type:     models.SettingTypeInt,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_deleted_retention_days",
			Value:    `30`,
			Type:     models.SettingTypeInt,
			IsPublic: false,
		},
		{
			Group:    "mail",
			Key:      "mail_trash_retention_days",
			Value:    `30`,
			Type:     models.SettingTypeInt,
			IsPublic: false,
		},
	}

	for _, setting := range defaults {
		var existing models.SiteSetting
		err := db.Where("`group` = ? AND `key` = ?", setting.Group, setting.Key).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&setting).Error; err != nil {
				return err
			}
		}
	}

	log.Println("[Seeder] Site settings seeded successfully")
	return nil
}
