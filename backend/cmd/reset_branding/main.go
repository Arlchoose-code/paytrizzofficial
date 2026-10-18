package main

import (
	"fmt"
	"log"
	"paytrizz-backend/config"
	"paytrizz-backend/models"
)

func main() {
	config.LoadConfig()
	db := config.ConnectDatabase()

	var all []models.SiteSetting
	db.Find(&all)
	fmt.Println("--- EXISTING SETTINGS ---")
	for _, s := range all {
		if s.Key == "logo_url" || s.Key == "site_logo_light" || s.Key == "site_name" || s.Key == "favicon_url" {
			fmt.Printf("ID: %d, Key: %s, Value: %s, IsPublic: %v\n", s.ID, s.Key, s.Value, s.IsPublic)
		}
	}

	validLogo := `"/storage/media/site/medium/brand_logo_main.webp"`

	db.Exec("UPDATE site_settings SET value = ? WHERE `key` IN ('logo_url', 'site_logo_light', 'logo_dark_url', 'site_logo_dark', 'favicon_url', 'site_favicon')", validLogo)
	db.Exec("UPDATE site_settings SET value = '\"PayTrizz\"' WHERE `key` = 'site_name'")

	log.Println("SUCCESSFULLY FORCED DB UPDATE!")
}
