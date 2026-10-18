package models

import (
	"database/sql/driver"
	"encoding/json"
	"errors"
	"time"
)

type InboundEventStatus string

const (
	InboundStatusReceived   InboundEventStatus = "received"
	InboundStatusProcessing InboundEventStatus = "processing"
	InboundStatusProcessed  InboundEventStatus = "processed"
	InboundStatusFailed     InboundEventStatus = "failed"
	InboundStatusIgnored    InboundEventStatus = "ignored"
)

type StringList []string

func (s StringList) Value() (driver.Value, error) {
	if len(s) == 0 {
		return "[]", nil
	}
	return json.Marshal(s)
}

func (s *StringList) Scan(value interface{}) error {
	if value == nil {
		*s = []string{}
		return nil
	}
	bytes, ok := value.([]byte)
	if !ok {
		str, okStr := value.(string)
		if !okStr {
			return errors.New("cannot scan StringList")
		}
		bytes = []byte(str)
	}
	return json.Unmarshal(bytes, s)
}

type MailInboundEvent struct {
	ID           uint64             `gorm:"primaryKey;autoIncrement" json:"id"`
	SESMessageID string             `gorm:"type:varchar(100);not null;uniqueIndex" json:"ses_message_id"`
	S3Bucket     string             `gorm:"type:varchar(120);not null" json:"s3_bucket"`
	S3Key        string             `gorm:"type:varchar(255);not null" json:"s3_key"`
	Recipients   StringList         `gorm:"type:json;not null" json:"recipients"`
	Verdicts     string             `gorm:"type:json" json:"verdicts"`
	Status       InboundEventStatus `gorm:"type:enum('received','processing','processed','failed','ignored');not null;default:'received';index" json:"status"`
	Attempts     uint8              `gorm:"not null;default:0" json:"attempts"`
	LastError    *string            `gorm:"type:text" json:"last_error"`
	ReceivedAt   time.Time          `gorm:"not null" json:"received_at"`
	ProcessedAt  *time.Time         `json:"processed_at"`
	CreatedAt    time.Time          `json:"created_at"`
	UpdatedAt    time.Time          `json:"updated_at"`
}

func (MailInboundEvent) TableName() string {
	return "mail_inbound_events"
}
