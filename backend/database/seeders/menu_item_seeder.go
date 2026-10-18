package seeders

import (
	"log"
	"paytrizz-backend/models"

	"gorm.io/gorm"
)

type MenuItemSeeder struct{}

func NewMenuItemSeeder() *MenuItemSeeder {
	return &MenuItemSeeder{}
}

func (s *MenuItemSeeder) Run(db *gorm.DB) error {
	headerItems := []models.MenuItem{
		{Location: models.MenuLocationHeader, Label: "Services", URL: "/services", SortOrder: 1, IsActive: true},
		{Location: models.MenuLocationHeader, Label: "Talents", URL: "/talents", SortOrder: 2, IsActive: true},
		{Location: models.MenuLocationHeader, Label: "Projects", URL: "/projects", SortOrder: 3, IsActive: true},
		{Location: models.MenuLocationHeader, Label: "Blog", URL: "/blog", SortOrder: 4, IsActive: true},
		{Location: models.MenuLocationHeader, Label: "About", URL: "/about", SortOrder: 5, IsActive: true},
	}

	for _, m := range headerItems {
		var existing models.MenuItem
		err := db.Where("location = ? AND label = ? AND parent_id IS NULL", m.Location, m.Label).First(&existing).Error
		if err == gorm.ErrRecordNotFound {
			if err := db.Create(&m).Error; err != nil {
				return err
			}
		}
	}

	// Footer Navigation Categories & Children
	type FooterCategory struct {
		Parent   models.MenuItem
		Children []models.MenuItem
	}

	footerCategories := []FooterCategory{
		{
			Parent: models.MenuItem{
				Location:  models.MenuLocationFooter,
				Label:     "Services",
				URL:       "/services",
				SortOrder: 1,
				IsActive:  true,
			},
			Children: []models.MenuItem{
				{Location: models.MenuLocationFooter, Label: "Web Development", URL: "/services#web-development", SortOrder: 1, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "UI/UX Design", URL: "/services#ui-ux-design", SortOrder: 2, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Mobile Apps", URL: "/services#mobile-apps", SortOrder: 3, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Video & Motion", URL: "/services#video-and-motion", SortOrder: 4, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Digital Marketing", URL: "/services#digital-marketing", SortOrder: 5, IsActive: true},
			},
		},
		{
			Parent: models.MenuItem{
				Location:  models.MenuLocationFooter,
				Label:     "Explore",
				URL:       "/talents",
				SortOrder: 2,
				IsActive:  true,
			},
			Children: []models.MenuItem{
				{Location: models.MenuLocationFooter, Label: "Talents Directory", URL: "/talents", SortOrder: 1, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Projects & Case Studies", URL: "/projects", SortOrder: 2, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Agency Blog", URL: "/blog", SortOrder: 3, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Request a Project Squad", URL: "/join", SortOrder: 4, IsActive: true},
			},
		},
		{
			Parent: models.MenuItem{
				Location:  models.MenuLocationFooter,
				Label:     "Company",
				URL:       "/about",
				SortOrder: 3,
				IsActive:  true,
			},
			Children: []models.MenuItem{
				{Location: models.MenuLocationFooter, Label: "About PayTrizz", URL: "/about", SortOrder: 1, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Contact Us", URL: "/contact", SortOrder: 2, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Talent Portal", URL: "/login", SortOrder: 3, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Privacy Policy", URL: "/privacy", SortOrder: 4, IsActive: true},
				{Location: models.MenuLocationFooter, Label: "Terms of Service", URL: "/terms", SortOrder: 5, IsActive: true},
			},
		},
	}

	for _, cat := range footerCategories {
		var parent models.MenuItem
		err := db.Where("location = ? AND label = ? AND parent_id IS NULL", cat.Parent.Location, cat.Parent.Label).First(&parent).Error
		if err == gorm.ErrRecordNotFound {
			parent = cat.Parent
			if err := db.Create(&parent).Error; err != nil {
				return err
			}
		} else {
			parent.SortOrder = cat.Parent.SortOrder
			parent.URL = cat.Parent.URL
			parent.IsActive = true
			db.Save(&parent)
		}
		for _, ch := range cat.Children {
			var child models.MenuItem
			err := db.Where("location = ? AND label = ? AND parent_id = ?", ch.Location, ch.Label, parent.ID).First(&child).Error
			if err == gorm.ErrRecordNotFound {
				ch.ParentID = &parent.ID
				if err := db.Create(&ch).Error; err != nil {
					return err
				}
			} else {
				child.URL = ch.URL
				child.SortOrder = ch.SortOrder
				child.IsActive = true
				db.Save(&child)
			}
		}
	}

	log.Println("[Seeder] Menu Items seeded successfully")
	return nil
}
