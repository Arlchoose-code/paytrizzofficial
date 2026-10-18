package models

type ProjectTalent struct {
	ProjectID uint64 `gorm:"primaryKey" json:"project_id"`
	TalentID  uint64 `gorm:"primaryKey" json:"talent_id"`
	RoleLabel string `gorm:"type:varchar(80)" json:"role_label"`
	SortOrder int    `gorm:"default:0" json:"sort_order"`

	Project *Project `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE;" json:"project,omitempty"`
	Talent  *Talent  `gorm:"foreignKey:TalentID;constraint:OnDelete:CASCADE;" json:"talent,omitempty"`
}

func (ProjectTalent) TableName() string {
	return "project_talents"
}
