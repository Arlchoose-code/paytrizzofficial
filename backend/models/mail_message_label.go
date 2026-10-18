package models

type MailMessageLabel struct {
	MessageID uint64       `gorm:"primaryKey;autoIncrement:false" json:"message_id"`
	Message   *MailMessage `gorm:"foreignKey:MessageID;constraint:OnDelete:CASCADE" json:"-"`
	LabelID   uint64       `gorm:"primaryKey;autoIncrement:false" json:"label_id"`
	Label     *MailLabel   `gorm:"foreignKey:LabelID;constraint:OnDelete:CASCADE" json:"-"`
}

func (MailMessageLabel) TableName() string {
	return "mail_message_labels"
}
