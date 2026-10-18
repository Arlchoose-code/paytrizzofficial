package models

type ProjectTag struct {
	ProjectID uint64 `gorm:"primaryKey" json:"project_id"`
	TagID     uint64 `gorm:"primaryKey" json:"tag_id"`

	Project *Project `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE;" json:"project,omitempty"`
	Tag     *Tag     `gorm:"foreignKey:TagID;constraint:OnDelete:CASCADE;" json:"tag,omitempty"`
}

func (ProjectTag) TableName() string {
	return "project_tags"
}
