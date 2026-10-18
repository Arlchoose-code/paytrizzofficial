package services

import (
	"crypto/rand"
	"encoding/base64"
	"errors"
	"paytrizz-backend/models"
	"strings"
	"time"

	"golang.org/x/crypto/bcrypt"
	"gorm.io/gorm"
)

type AuthService struct {
	db           *gorm.DB
	tokenService *TokenService
	auditService *AuditService
}

func NewAuthService(db *gorm.DB, tokenService *TokenService, auditService *AuditService) *AuthService {
	return &AuthService{
		db:           db,
		tokenService: tokenService,
		auditService: auditService,
	}
}

// HashPassword hashes a raw password string with bcrypt cost 12
func (s *AuthService) HashPassword(password string) (string, error) {
	bytes, err := bcrypt.GenerateFromPassword([]byte(password), 12)
	return string(bytes), err
}

// CheckPassword compares hashed password with plain password
func (s *AuthService) CheckPassword(hashedPassword, plainPassword string) bool {
	err := bcrypt.CompareHashAndPassword([]byte(hashedPassword), []byte(plainPassword))
	return err == nil
}

// Login authenticates a user by email & password, returning user, accessToken, refreshToken, csrfToken
func (s *AuthService) Login(email, password, ip, userAgent string) (*models.User, string, string, string, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))

	var user models.User
	if err := s.db.Where("email = ?", cleanEmail).First(&user).Error; err != nil {
		return nil, "", "", "", errors.New("invalid email or password")
	}

	if !user.IsActive {
		return nil, "", "", "", errors.New("your account has been deactivated. Please contact administrator")
	}

	if !s.CheckPassword(user.PasswordHash, password) {
		return nil, "", "", "", errors.New("invalid email or password")
	}

	// Update last login
	now := time.Now()
	s.db.Model(&user).Updates(map[string]interface{}{
		"last_login_at": &now,
		"last_login_ip": &ip,
	})

	accessToken, err := s.tokenService.GenerateAccessToken(&user)
	if err != nil {
		return nil, "", "", "", err
	}

	refreshToken, err := s.tokenService.CreateRefreshToken(&user, ip, userAgent)
	if err != nil {
		return nil, "", "", "", err
	}

	csrfToken, err := s.tokenService.GenerateCSRFToken()
	if err != nil {
		return nil, "", "", "", err
	}

	s.auditService.Log(&user.ID, "auth", "login", "user", &user.ID, "User logged in successfully", nil, ip, userAgent)

	return &user, accessToken, refreshToken, csrfToken, nil
}

// ChangePassword changes the user password and revokes existing sessions
func (s *AuthService) ChangePassword(userID uint64, oldPassword, newPassword string) error {
	var user models.User
	if err := s.db.First(&user, userID).Error; err != nil {
		return errors.New("user not found")
	}

	if !s.CheckPassword(user.PasswordHash, oldPassword) {
		return errors.New("current password is incorrect")
	}

	newHash, err := s.HashPassword(newPassword)
	if err != nil {
		return err
	}

	now := time.Now()
	err = s.db.Model(&user).Updates(map[string]interface{}{
		"password_hash":         newHash,
		"password_changed_at":   &now,
		"must_change_password":  false,
	}).Error
	if err != nil {
		return err
	}

	// Revoke all other refresh tokens for security
	_ = s.tokenService.RevokeAllUserTokens(userID)

	return nil
}

// CreatePasswordResetToken generates a one-time token for forgot password
func (s *AuthService) CreatePasswordResetToken(email, ip string) (string, *models.User, error) {
	cleanEmail := strings.ToLower(strings.TrimSpace(email))

	var user models.User
	if err := s.db.Where("email = ? AND is_active = true", cleanEmail).First(&user).Error; err != nil {
		return "", nil, errors.New("if that email is registered, a password reset link has been sent")
	}

	b := make([]byte, 32)
	if _, err := rand.Read(b); err != nil {
		return "", nil, err
	}
	rawToken := base64.RawURLEncoding.EncodeToString(b)
	tokenHash := s.tokenService.HashToken(rawToken)

	resetToken := models.PasswordResetToken{
		UserID:    user.ID,
		TokenHash: tokenHash,
		ExpiresAt: time.Now().Add(60 * time.Minute),
		IP:        ip,
	}

	if err := s.db.Create(&resetToken).Error; err != nil {
		return "", nil, err
	}

	return rawToken, &user, nil
}

// ResetPassword resets password using one-time token
func (s *AuthService) ResetPassword(rawToken, newPassword string) (*models.User, error) {
	tokenHash := s.tokenService.HashToken(rawToken)

	var tokenRecord models.PasswordResetToken
	err := s.db.Where("token_hash = ? AND used_at IS NULL", tokenHash).First(&tokenRecord).Error
	if err != nil {
		return nil, errors.New("invalid or expired password reset link")
	}

	if time.Now().After(tokenRecord.ExpiresAt) {
		return nil, errors.New("password reset link has expired")
	}

	var user models.User
	if err := s.db.First(&user, tokenRecord.UserID).Error; err != nil {
		return nil, errors.New("user not found")
	}

	newHash, err := s.HashPassword(newPassword)
	if err != nil {
		return nil, err
	}

	now := time.Now()
	err = s.db.Transaction(func(tx *gorm.DB) error {
		if err := tx.Model(&tokenRecord).Update("used_at", now).Error; err != nil {
			return err
		}
		return tx.Model(&user).Updates(map[string]interface{}{
			"password_hash":        newHash,
			"password_changed_at":  &now,
			"must_change_password": false,
		}).Error
	})
	if err != nil {
		return nil, err
	}

	// Invalidate all tokens
	_ = s.tokenService.RevokeAllUserTokens(user.ID)

	return &user, nil
}

// AcceptMailPolicy marks policy accepted
func (s *AuthService) AcceptMailPolicy(userID uint64) error {
	now := time.Now()
	return s.db.Model(&models.User{}).Where("id = ?", userID).Update("mail_policy_accepted_at", &now).Error
}
