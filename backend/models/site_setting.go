package models

import (
	"time"
)

type SettingType string

const (
	SettingTypeString SettingType = "string"
	SettingTypeText   SettingType = "text"
	SettingTypeBool   SettingType = "bool"
	SettingTypeInt    SettingType = "int"
	SettingTypeJSON   SettingType = "json"
	SettingTypeMedia  SettingType = "media"
)

type SiteSetting struct {
	ID        uint64      `gorm:"primaryKey;autoIncrement" json:"id"`
	Group     string      `gorm:"type:varchar(40);not null;index;uniqueIndex:idx_group_key,priority:1" json:"group"`
	Key       string      `gorm:"type:varchar(80);not null;uniqueIndex:idx_group_key,priority:2" json:"key"`
	Value     string      `gorm:"type:json;not null" json:"value"`
	Type      SettingType `gorm:"type:varchar(20);not null" json:"type"`
	IsPublic  bool        `gorm:"default:false" json:"is_public"`
	CreatedAt time.Time   `json:"created_at"`
	UpdatedAt time.Time   `json:"updated_at"`
}

func (SiteSetting) TableName() string {
	return "site_settings"
}
