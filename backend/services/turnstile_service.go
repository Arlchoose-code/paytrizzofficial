package services

import (
	"encoding/json"
	"net/http"
	"net/url"
	"paytrizz-backend/config"
	"time"
)

type TurnstileService struct{}

func NewTurnstileService() *TurnstileService {
	return &TurnstileService{}
}

type turnstileVerifyResponse struct {
	Success     bool     `json:"success"`
	ErrorCodes  []string `json:"error-codes"`
	ChallengeTS string   `json:"challenge_ts"`
	Hostname    string   `json:"hostname"`
}

// VerifyToken verifies the Cloudflare Turnstile token
func (s *TurnstileService) VerifyToken(token, remoteIP string) (bool, error) {
	secretKey := config.AppConfig.TurnstileSecretKey
	if secretKey == "" {
		// Turnstile not configured, bypass
		return true, nil
	}

	if token == "" {
		return false, nil
	}

	client := &http.Client{Timeout: 5 * time.Second}
	formData := url.Values{
		"secret":   {secretKey},
		"response": {token},
	}
	if remoteIP != "" {
		formData.Set("remoteip", remoteIP)
	}

	resp, err := client.PostForm("https://challenges.cloudflare.com/turnstile/v0/siteverify", formData)
	if err != nil {
		return false, err
	}
	defer resp.Body.Close()

	var verifyRes turnstileVerifyResponse
	if err := json.NewDecoder(resp.Body).Decode(&verifyRes); err != nil {
		return false, err
	}

	return verifyRes.Success, nil
}
