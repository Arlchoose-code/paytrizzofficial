package models

import "time"

type TalentCertificate struct {
	ID             uint64     `gorm:"primaryKey;autoIncrement" json:"id"`
	TalentID       uint64     `gorm:"not null;index" json:"talent_id"`
	Name           string     `gorm:"type:varchar(200);not null" json:"name"`
	IssuingOrg     string     `gorm:"type:varchar(150);not null" json:"issuing_org"`
	IssueDate      *time.Time `json:"issue_date"`
	ExpirationDate *time.Time `json:"expiration_date"`
	DoesNotExpire  bool       `gorm:"default:false;not null" json:"does_not_expire"`
	CredentialID   string     `gorm:"type:varchar(120)" json:"credential_id"`
	CredentialURL  string     `gorm:"type:varchar(255)" json:"credential_url"`
	Skills         string     `gorm:"type:text" json:"skills"`
	MediaURL       string     `gorm:"type:varchar(255)" json:"media_url"`
	Media          string     `gorm:"type:text" json:"media"`
	SortOrder      int        `gorm:"default:0;not null" json:"sort_order"`
	CreatedAt      time.Time  `json:"created_at"`
	UpdatedAt      time.Time  `json:"updated_at"`
}

func (TalentCertificate) TableName() string {
	return "talent_certificates"
}
