package services

import (
	"crypto/rand"
	"crypto/sha256"
	"encoding/base64"
	"encoding/hex"
	"errors"
	"fmt"
	"paytrizz-backend/config"
	"paytrizz-backend/models"
	"time"

	"github.com/golang-jwt/jwt/v5"
	"github.com/google/uuid"
	"gorm.io/gorm"
)

type TokenClaims struct {
	UserID uint64          `json:"user_id"`
	Email  string          `json:"email"`
	Role   models.UserRole `json:"role"`
	jwt.RegisteredClaims
}

type TokenService struct {
	db *gorm.DB
}

func NewTokenService(db *gorm.DB) *TokenService {
	return &TokenService{db: db}
}

// GenerateAccessToken generates a short-lived signed JWT (15 minutes)
func (s *TokenService) GenerateAccessToken(user *models.User) (string, error) {
	claims := TokenClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(15 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    config.AppConfig.AppName,
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

// ValidateAccessToken parses and validates an access token string
func (s *TokenService) ValidateAccessToken(tokenStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(tokenStr, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil {
		return nil, err
	}

	if claims, ok := token.Claims.(*TokenClaims); ok && token.Valid {
		return claims, nil
	}

	return nil, errors.New("invalid token claims")
}

// GenerateSSOTicket generates a short-lived signed JWT (2 minutes) for cross-subdomain handoff
func (s *TokenService) GenerateSSOTicket(user *models.User) (string, error) {
	claims := TokenClaims{
		UserID: user.ID,
		Email:  user.Email,
		Role:   user.Role,
		RegisteredClaims: jwt.RegisteredClaims{
			ExpiresAt: jwt.NewNumericDate(time.Now().Add(2 * time.Minute)),
			IssuedAt:  jwt.NewNumericDate(time.Now()),
			NotBefore: jwt.NewNumericDate(time.Now()),
			Issuer:    "PayTrizz-SSO",
			Subject:   fmt.Sprintf("%d", user.ID),
		},
	}

	token := jwt.NewWithClaims(jwt.SigningMethodHS256, claims)
	return token.SignedString([]byte(config.AppConfig.JWTSecret))
}

// ValidateSSOTicket validates a single-use cross-subdomain SSO ticket
func (s *TokenService) ValidateSSOTicket(ticketStr string) (*TokenClaims, error) {
	token, err := jwt.ParseWithClaims(ticketStr, &TokenClaims{}, func(token *jwt.Token) (interface{}, error) {
		if _, ok := token.Method.(*jwt.SigningMethodHMAC); !ok {
			return nil, fmt.Errorf("unexpected signing method: %v", token.Header["alg"])
		}
		return []byte(config.AppConfig.JWTSecret), nil
	})

	if err != nil || !token.Valid {
		return nil, fmt.Errorf("invalid or expired ticket")
	}

	claims, ok := token.Claims.(*TokenClaims)
	if !ok || claims.Issuer != "PayTrizz-SSO" {
		return nil, fmt.Errorf("invalid ticket issuer")
	}

	return claims, nil
}

// GenerateCSRFToken generates a cryptographically secure 32-byte CSRF token
func (s *TokenService) GenerateCSRFToken() (string, error) {
	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", err
	}
	return base64.RawURLEncoding.EncodeToString(b), nil
}

// HashToken produces SHA-256 hex string of a raw token
func (s *TokenService) HashToken(rawToken string) string {
	hash := sha256.Sum256([]byte(rawToken))
	return hex.EncodeToString(hash[:])
}

// CreateRefreshToken creates a new refresh token family for login
func (s *TokenService) CreateRefreshToken(user *models.User, ip, userAgent string) (string, error) {
	familyID := uuid.New().String()
	rawBytes := make([]byte, 32)
	if _, err := rand.Read(rawBytes); err != nil {
		return "", err
	}
	rawToken := base64.RawURLEncoding.EncodeToString(rawBytes)
	tokenHash := s.HashToken(rawToken)

	refreshToken := models.RefreshToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		FamilyID:  familyID,
		ExpiresAt: time.Now().Add(7 * 24 * time.Hour), // 7 days
		IP:        ip,
		UserAgent: userAgent,
	}

	if err := s.db.Create(&refreshToken).Error; err != nil {
		return "", err
	}

	return rawToken, nil
}

// RotateRefreshToken implements refresh token rotation and token reuse detection
func (s *TokenService) RotateRefreshToken(rawOldToken, ip, userAgent string) (*models.User, string, error) {
	oldHash := s.HashToken(rawOldToken)

	var tokenRecord models.RefreshToken
	err := s.db.Where("token_hash = ?", oldHash).First(&tokenRecord).Error
	if err != nil {
		return nil, "", errors.New("invalid refresh token")
	}

	// Token Reuse Detection: if already revoked, revoke all tokens in this family (session hijacking attempt)
	if tokenRecord.RevokedAt != nil {
		s.db.Model(&models.RefreshToken{}).
			Where("family_id = ?", tokenRecord.FamilyID).
			Update("revoked_at", time.Now())
		return nil, "", errors.New("refresh token reuse detected: entire session revoked")
	}

	// Check expiration
	if time.Now().After(tokenRecord.ExpiresAt) {
		return nil, "", errors.New("refresh token expired")
	}

	// Fetch user
	var user models.User
	if err := s.db.First(&user, tokenRecord.UserID).Error; err != nil {
		return nil, "", errors.New("user not found")
	}

	if !user.IsActive {
		return nil, "", errors.New("user account is inactive")
	}

	// Issue new token in same family
	rawNewBytes := make([]byte, 32)
	if _, err := rand.Read(rawNewBytes); err != nil {
		return nil, "", err
	}
	rawNewToken := base64.RawURLEncoding.EncodeToString(rawNewBytes)
	newHash := s.HashToken(rawNewToken)

	now := time.Now()
	newTokenRecord := models.RefreshToken{
		UserID:    user.ID,
		TokenHash: newHash,
		FamilyID:  tokenRecord.FamilyID,
		ExpiresAt: now.Add(7 * 24 * time.Hour),
		IP:        ip,
		UserAgent: userAgent,
	}

	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Create(&newTokenRecord).Error; err != nil {
			return err
		}
		// Revoke old token and point replaced_by
		return tx.Model(&tokenRecord).Updates(map[string]interface{}{
			"revoked_at":     now,
			"replaced_by_id": newTokenRecord.ID,
		}).Error
	})
	if err != nil {
		return nil, "", err
	}

	return &user, rawNewToken, nil
}

// RevokeRefreshToken revokes a specific refresh token
func (s *TokenService) RevokeRefreshToken(rawToken string) error {
	tokenHash := s.HashToken(rawToken)
	now := time.Now()
	return s.db.Model(&models.RefreshToken{}).
		Where("token_hash = ?", tokenHash).
		Update("revoked_at", now).Error
}

// RevokeAllUserTokens revokes all refresh tokens for a user (e.g. on password change)
func (s *TokenService) RevokeAllUserTokens(userID uint64) error {
	now := time.Now()
	return s.db.Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", userID).
		Update("revoked_at", now).Error
}
