package models

type PostTag struct {
	PostID uint64 `gorm:"primaryKey" json:"post_id"`
	TagID  uint64 `gorm:"primaryKey" json:"tag_id"`

	Post *Post `gorm:"foreignKey:PostID;constraint:OnDelete:CASCADE;" json:"post,omitempty"`
	Tag  *Tag  `gorm:"foreignKey:TagID;constraint:OnDelete:CASCADE;" json:"tag,omitempty"`
}

func (PostTag) TableName() string {
	return "post_tags"
}
