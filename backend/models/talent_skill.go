package models

type TalentSkill struct {
	TalentID    uint64 `gorm:"primaryKey" json:"talent_id"`
	SkillID     uint64 `gorm:"primaryKey" json:"skill_id"`
	Skill       *Skill `gorm:"foreignKey:SkillID;constraint:OnDelete:CASCADE" json:"skill,omitempty"`
	Proficiency string `gorm:"type:varchar(30);default:'intermediate';not null" json:"proficiency"`
	Years       int    `gorm:"default:1;not null" json:"years"`
}

func (TalentSkill) TableName() string {
	return "talent_skills"
}
