package models

type TalentSpecialty struct {
	TalentID    uint64     `gorm:"primaryKey" json:"talent_id"`
	SpecialtyID uint64     `gorm:"primaryKey" json:"specialty_id"`
	Specialty   *Specialty `gorm:"foreignKey:SpecialtyID;constraint:OnDelete:CASCADE" json:"specialty,omitempty"`
}

func (TalentSpecialty) TableName() string {
	return "talent_specialties"
}
