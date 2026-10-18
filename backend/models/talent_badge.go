package models

type TalentBadge struct {
	TalentID  uint64 `gorm:"primaryKey" json:"talent_id"`
	BadgeID   uint64 `gorm:"primaryKey" json:"badge_id"`
	SortOrder int    `gorm:"default:0;not null" json:"sort_order"`
	Badge     *Badge `gorm:"foreignKey:BadgeID;constraint:OnDelete:CASCADE" json:"badge,omitempty"`
}

func (TalentBadge) TableName() string {
	return "talent_badges"
}
