package models

type ProjectImage struct {
	ID        uint64 `gorm:"primaryKey;autoIncrement" json:"id"`
	ProjectID uint64 `gorm:"index;not null" json:"project_id"`
	MediaID   uint64 `gorm:"index;not null" json:"media_id"`
	Caption   string `gorm:"type:varchar(255)" json:"caption"`
	SortOrder int    `gorm:"default:0" json:"sort_order"`

	Project *Project `gorm:"foreignKey:ProjectID;constraint:OnDelete:CASCADE;" json:"project,omitempty"`
	Media   *Media   `gorm:"foreignKey:MediaID;constraint:OnDelete:CASCADE;" json:"media,omitempty"`
}

func (ProjectImage) TableName() string {
	return "project_images"
}
