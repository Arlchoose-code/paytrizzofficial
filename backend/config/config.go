package config

import (
	"log"
	"os"

	"github.com/joho/godotenv"
)

type Config struct {
	AppEnv                 string
	AppPort                string
	AppURL                 string
	FrontendURL            string
	AppName                string
	DBHost                 string
	DBPort                 string
	DBUser                 string
	DBPass                 string
	DBName                 string
	JWTSecret              string
	NextjsRevalidateSecret string
	TurnstileSiteKey       string
	TurnstileSecretKey     string
	AWSRegion              string
	AWSAccessKeyID         string
	AWSSecretAccessKey     string
	SESConfigurationSet    string
	SESInboundBucket       string
	SESInboundPrefix       string
	SESSNSTopicInbound     string
	SESSNSTopicEvents      string
	MailDomain             string
	SystemFromAddress      string
	SystemReplyTo          string
	PrivateStoragePath     string
	SeedAdminEmail         string
	SeedAdminPassword      string
	SeedFounderEmail       string
	SeedFounderPassword    string
}

var AppConfig *Config

func LoadConfig() *Config {
	if err := godotenv.Load(); err != nil {
		log.Println("Note: .env file not found or already loaded into environment")
	}

	AppConfig = &Config{
		AppEnv:                 getEnv("APP_ENV", "development"),
		AppPort:                getEnv("APP_PORT", "8080"),
		AppURL:                 getEnv("APP_URL", "http://localhost:8080"),
		FrontendURL:            getEnv("FRONTEND_URL", "http://localhost:3000"),
		AppName:                getEnv("APP_NAME", "PayTrizz"),
		DBHost:                 getEnv("DB_HOST", "127.0.0.1"),
		DBPort:                 getEnv("DB_PORT", "3306"),
		DBUser:                 getEnv("DB_USER", "root"),
		DBPass:                 getEnv("DB_PASS", ""),
		DBName:                 getEnv("DB_NAME", "paytrizz"),
		JWTSecret:              getEnv("JWT_SECRET", "default-jwt-secret-paytrizz-super-safe-key-32chars"),
		NextjsRevalidateSecret: getEnv("NEXTJS_REVALIDATE_SECRET", "default-revalidate-secret-paytrizz-key-32chars"),
		TurnstileSiteKey:       getEnv("CLOUDFLARE_TURNSTILE_SITE_KEY", ""),
		TurnstileSecretKey:     getEnv("CLOUDFLARE_TURNSTILE_SECRET_KEY", ""),
		AWSRegion:              getEnv("AWS_REGION", "us-east-1"),
		AWSAccessKeyID:         getEnv("AWS_ACCESS_KEY_ID", ""),
		AWSSecretAccessKey:     getEnv("AWS_SECRET_ACCESS_KEY", ""),
		SESConfigurationSet:    getEnv("SES_CONFIGURATION_SET", "paytrizz-ses-set"),
		SESInboundBucket:       getEnv("SES_INBOUND_BUCKET", "paytrizz-mail-inbound"),
		SESInboundPrefix:       getEnv("SES_INBOUND_PREFIX", "inbound/"),
		SESSNSTopicInbound:     getEnv("SES_SNS_TOPIC_ARN_INBOUND", ""),
		SESSNSTopicEvents:      getEnv("SES_SNS_TOPIC_ARN_EVENTS", ""),
		MailDomain:             getEnv("MAIL_DOMAIN", "paytrizz.com"),
		SystemFromAddress:      getEnv("SYSTEM_FROM_ADDRESS", "noreply@paytrizz.com"),
		SystemReplyTo:          getEnv("SYSTEM_REPLY_TO", "hello@paytrizz.com"),
		PrivateStoragePath:     getEnv("PRIVATE_STORAGE_PATH", "./storage/private"),
		SeedAdminEmail:         getEnv("SEED_ADMIN_EMAIL", "admin@paytrizz.com"),
		SeedAdminPassword:      getEnv("SEED_ADMIN_PASSWORD", "AdminPayTrizz2026!"),
		SeedFounderEmail:       getEnv("SEED_FOUNDER_EMAIL", "founder@paytrizz.com"),
		SeedFounderPassword:    getEnv("SEED_FOUNDER_PASSWORD", "FounderPayTrizz2026!"),
	}

	if AppConfig.AppEnv == "production" {
		if os.Getenv("JWT_SECRET") == "" || AppConfig.JWTSecret == "default-jwt-secret-paytrizz-super-safe-key-32chars" {
			log.Fatal("CRITICAL SECURITY ERROR: JWT_SECRET must be explicitly set via .env in production!")
		}
		if os.Getenv("NEXTJS_REVALIDATE_SECRET") == "" || AppConfig.NextjsRevalidateSecret == "default-revalidate-secret-paytrizz-key-32chars" {
			log.Fatal("CRITICAL SECURITY ERROR: NEXTJS_REVALIDATE_SECRET must be explicitly set via .env in production!")
		}
	}

	return AppConfig
}

func getEnv(key, fallback string) string {
	if val := os.Getenv(key); val != "" {
		return val
	}
	return fallback
}
