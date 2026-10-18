package models

import "time"

type MenuLocation string

const (
	MenuLocationHeader MenuLocation = "header"
	MenuLocationFooter MenuLocation = "footer"
)

type MenuItem struct {
	ID          uint64        `gorm:"primaryKey;autoIncrement" json:"id"`
	Location    MenuLocation  `gorm:"type:varchar(20);not null" json:"location"`
	Label       string        `gorm:"type:varchar(80);not null" json:"label"`
	URL         string        `gorm:"type:varchar(255);not null" json:"url"`
	ParentID    *uint64       `json:"parent_id"`
	Parent      *MenuItem     `gorm:"foreignKey:ParentID;constraint:OnDelete:CASCADE" json:"parent,omitempty"`
	Children    []MenuItem    `gorm:"foreignKey:ParentID" json:"children,omitempty"`
	SortOrder   int           `gorm:"default:0;not null" json:"sort_order"`
	IsActive    bool          `gorm:"default:true;not null" json:"is_active"`
	OpenNewTab  bool          `gorm:"default:false;not null" json:"open_new_tab"`
	CreatedAt   time.Time     `json:"created_at"`
	UpdatedAt   time.Time     `json:"updated_at"`
}

func (MenuItem) TableName() string {
	return "menu_items"
}
