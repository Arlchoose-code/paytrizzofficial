package public

import (
	"crypto/sha256"
	"encoding/hex"
	"net/http"
	"os"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
)

type AuthController struct {
	authService      *services.AuthService
	tokenService     *services.TokenService
	turnstileService *services.TurnstileService
	outboxService    *services.EmailOutboxService
}

func NewAuthController(
	authService *services.AuthService,
	tokenService *services.TokenService,
	turnstileService *services.TurnstileService,
	outboxService *services.EmailOutboxService,
) *AuthController {
	return &AuthController{
		authService:      authService,
		tokenService:     tokenService,
		turnstileService: turnstileService,
		outboxService:    outboxService,
	}
}

// Login handles user authentication for both admin and talent
func (ctrl *AuthController) Login(c *gin.Context) {
	var req structs.LoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	// Verify Turnstile
	validCaptcha, err := ctrl.turnstileService.VerifyToken(req.TurnstileToken, c.ClientIP())
	if err != nil || !validCaptcha {
		helpers.RespondError(c, http.StatusBadRequest, "Security verification failed. Please try again")
		return
	}

	user, accessToken, refreshToken, csrfToken, err := ctrl.authService.Login(
		req.Email,
		req.Password,
		c.ClientIP(),
		c.GetHeader("User-Agent"),
	)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	ctrl.setAuthCookies(c, accessToken, refreshToken, csrfToken)

	userResp := structs.UserResponse{
		ID:                   user.ID,
		Role:                 string(user.Role),
		Name:                 user.Name,
		Email:                user.Email,
		IsActive:             user.IsActive,
		MustChangePassword:   user.MustChangePassword,
		PasswordChangedAt:    user.PasswordChangedAt,
		LastLoginAt:          user.LastLoginAt,
		MailPolicyAcceptedAt: user.MailPolicyAcceptedAt,
		CreatedAt:            user.CreatedAt,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Login successful", structs.AuthResponseData{
		User:        userResp,
		AccessToken: accessToken,
		CSRFToken:   csrfToken,
	})
}

// Refresh handles token rotation
func (ctrl *AuthController) Refresh(c *gin.Context) {
	var refreshToken string

	// 1. Try reading from cookie
	if val, err := c.Cookie("refresh_token"); err == nil && val != "" {
		refreshToken = val
	}

	// 2. Try body fallback
	if refreshToken == "" {
		var body structs.RefreshTokenRequest
		if err := c.ShouldBindJSON(&body); err == nil {
			refreshToken = body.RefreshToken
		}
	}

	if refreshToken == "" {
		helpers.RespondError(c, http.StatusUnauthorized, "Refresh token required")
		return
	}

	user, newRefreshToken, err := ctrl.tokenService.RotateRefreshToken(
		refreshToken,
		c.ClientIP(),
		c.GetHeader("User-Agent"),
	)
	if err != nil {
		// Clear cookies on invalid refresh
		ctrl.clearAuthCookies(c)
		helpers.RespondError(c, http.StatusUnauthorized, err.Error())
		return
	}

	newAccessToken, err := ctrl.tokenService.GenerateAccessToken(user)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}

	newCSRFToken, _ := ctrl.tokenService.GenerateCSRFToken()

	ctrl.setAuthCookies(c, newAccessToken, newRefreshToken, newCSRFToken)

	userResp := structs.UserResponse{
		ID:                   user.ID,
		Role:                 string(user.Role),
		Name:                 user.Name,
		Email:                user.Email,
		IsActive:             user.IsActive,
		MustChangePassword:   user.MustChangePassword,
		PasswordChangedAt:    user.PasswordChangedAt,
		LastLoginAt:          user.LastLoginAt,
		MailPolicyAcceptedAt: user.MailPolicyAcceptedAt,
		CreatedAt:            user.CreatedAt,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Token refreshed successfully", structs.AuthResponseData{
		User:        userResp,
		AccessToken: newAccessToken,
		CSRFToken:   newCSRFToken,
	})
}

// Logout clears auth cookies and revokes refresh token
func (ctrl *AuthController) Logout(c *gin.Context) {
	if val, err := c.Cookie("refresh_token"); err == nil && val != "" {
		_ = ctrl.tokenService.RevokeRefreshToken(val)
	}

	ctrl.clearAuthCookies(c)
	helpers.RespondSuccess(c, http.StatusOK, "Logged out successfully", nil)
}

// Me returns current authenticated user details
func (ctrl *AuthController) Me(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := userIDVal.(uint64)
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "User details retrieved", structs.UserResponse{
		ID:                   user.ID,
		Role:                 string(user.Role),
		Name:                 user.Name,
		Email:                user.Email,
		IsActive:             user.IsActive,
		MustChangePassword:   user.MustChangePassword,
		PasswordChangedAt:    user.PasswordChangedAt,
		LastLoginAt:          user.LastLoginAt,
		MailPolicyAcceptedAt: user.MailPolicyAcceptedAt,
		CreatedAt:            user.CreatedAt,
	})
}

// ChangePassword allows authenticated user to update their own password
func (ctrl *AuthController) ChangePassword(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	var req structs.ChangePasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	userID := userIDVal.(uint64)
	if err := ctrl.authService.ChangePassword(userID, req.CurrentPassword, req.NewPassword); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if ctrl.outboxService != nil {
		var user models.User
		if err := config.DB.First(&user, userID).Error; err == nil {
			_, _ = ctrl.outboxService.SendTemplated(
				"password_changed",
				user.Email,
				&user.Name,
				map[string]string{
					"name":      user.Name,
					"timestamp": time.Now().Format("2006-01-02 15:04:05 MST"),
					"ip":        c.ClientIP(),
				},
				nil,
				func(s string) *string { return &s }("user"),
				&user.ID,
			)
		}
	}

	helpers.RespondSuccess(c, http.StatusOK, "Password changed successfully. Please sign in again with your new password", nil)
}

// ForgotPassword generates reset token
func (ctrl *AuthController) ForgotPassword(c *gin.Context) {
	var req structs.ForgotPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid email address")
		return
	}

	rawToken, user, err := ctrl.authService.CreatePasswordResetToken(req.Email, c.ClientIP())
	if err == nil && user != nil && ctrl.outboxService != nil {
		frontendURL := config.AppConfig.FrontendURL
		if frontendURL == "" {
			frontendURL = config.AppConfig.AppURL
		}
		resetURL := strings.TrimRight(frontendURL, "/") + "/reset-password?token=" + rawToken
		_, _ = ctrl.outboxService.SendTemplated(
			"password_reset",
			user.Email,
			&user.Name,
			map[string]string{
				"name":      user.Name,
				"reset_url": resetURL,
			},
			nil,
			func(s string) *string { return &s }("user"),
			&user.ID,
		)
	}

	helpers.RespondSuccess(c, http.StatusOK, "If your email is registered, instructions to reset your password have been sent", nil)
}

// ResetPassword resets password using one-time token
func (ctrl *AuthController) ResetPassword(c *gin.Context) {
	var req structs.ResetPasswordRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid reset token or password")
		return
	}

	user, err := ctrl.authService.ResetPassword(req.Token, req.NewPassword)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, err.Error())
		return
	}

	if ctrl.outboxService != nil && user != nil {
		_, _ = ctrl.outboxService.SendTemplated(
			"password_changed",
			user.Email,
			&user.Name,
			map[string]string{
				"name":      user.Name,
				"timestamp": time.Now().Format("2006-01-02 15:04:05 MST"),
				"ip":        c.ClientIP(),
			},
			nil,
			func(s string) *string { return &s }("user"),
			&user.ID,
		)
	}

	helpers.RespondSuccess(c, http.StatusOK, "Password reset successful. You may now sign in with your new password", nil)
}

// AcceptMailPolicy records mail policy acceptance
func (ctrl *AuthController) AcceptMailPolicy(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := userIDVal.(uint64)
	if err := ctrl.authService.AcceptMailPolicy(userID); err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to record mail policy acceptance")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Mail compliance policy accepted", nil)
}

func (ctrl *AuthController) getCookieDomain(c *gin.Context) string {
	host := c.Request.Host
	if strings.Contains(host, "localhost") {
		return ".localhost"
	}
	mailDomain := os.Getenv("MAIL_DOMAIN")
	if mailDomain != "" {
		return "." + mailDomain
	}
	return ""
}

func (ctrl *AuthController) setAuthCookies(c *gin.Context, accessToken, refreshToken, csrfToken string) {
	secure := config.AppConfig.AppEnv == "production"
	domain := ctrl.getCookieDomain(c)

	// access_token: HttpOnly, 15 minutes (900 seconds)
	c.SetCookie("access_token", accessToken, 900, "/", domain, secure, true)

	// refresh_token: HttpOnly, 7 days (604800 seconds)
	c.SetCookie("refresh_token", refreshToken, 604800, "/", domain, secure, true)

	// csrf_token: Non-HttpOnly (read by browser/JS for mutating header), 7 days
	c.SetCookie("csrf_token", csrfToken, 604800, "/", domain, secure, false)
}

func (ctrl *AuthController) clearAuthCookies(c *gin.Context) {
	secure := config.AppConfig.AppEnv == "production"
	domain := ctrl.getCookieDomain(c)
	c.SetCookie("access_token", "", -1, "/", domain, secure, true)
	c.SetCookie("refresh_token", "", -1, "/", domain, secure, true)
	c.SetCookie("csrf_token", "", -1, "/", domain, secure, false)
}

// GetSessions returns active unrevoked sessions for the authenticated user
func (ctrl *AuthController) GetSessions(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := userIDVal.(uint64)
	var tokens []models.RefreshToken
	if err := config.DB.Where("user_id = ? AND (revoked_at IS NULL OR revoked_at > NOW()) AND expires_at > NOW()", userID).
		Order("created_at DESC").
		Limit(10).
		Find(&tokens).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to load sessions")
		return
	}

	currentRT, _ := c.Cookie("refresh_token")
	var currentHash string
	if currentRT != "" {
		h := sha256.Sum256([]byte(currentRT))
		currentHash = hex.EncodeToString(h[:])
	}

	var resps []structs.SessionResponse
	for _, t := range tokens {
		isCurr := false
		if currentHash != "" && t.TokenHash == currentHash {
			isCurr = true
		}
		resps = append(resps, structs.SessionResponse{
			ID:        t.ID,
			IP:        t.IP,
			UserAgent: t.UserAgent,
			CreatedAt: t.CreatedAt.Format("2006-01-02 15:04:05"),
			IsCurrent: isCurr,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Active sessions retrieved", resps)
}

// RevokeOtherSessions revokes all refresh tokens for the authenticated user except current one
func (ctrl *AuthController) RevokeOtherSessions(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}

	userID := userIDVal.(uint64)
	currentRT, _ := c.Cookie("refresh_token")
	var currentHash string
	if currentRT != "" {
		h := sha256.Sum256([]byte(currentRT))
		currentHash = hex.EncodeToString(h[:])
	}

	query := config.DB.Model(&models.RefreshToken{}).Where("user_id = ? AND revoked_at IS NULL", userID)
	if currentHash != "" {
		query = query.Where("token_hash != ?", currentHash)
	}

	if err := query.Update("revoked_at", time.Now()).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to revoke other sessions")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "All other sessions have been terminated", nil)
}

// CreateSSOTicket creates a short-lived signed JWT ticket to hand off session across subdomains
func (ctrl *AuthController) CreateSSOTicket(c *gin.Context) {
	userIDVal, exists := c.Get("UserID")
	if !exists {
		helpers.RespondError(c, http.StatusUnauthorized, "Unauthorized")
		return
	}
	userID := userIDVal.(uint64)
	var user models.User
	if err := config.DB.First(&user, userID).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "User not found")
		return
	}
	ticket, err := ctrl.tokenService.GenerateSSOTicket(&user)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to generate ticket")
		return
	}
	helpers.RespondSuccess(c, http.StatusOK, "SSO ticket generated", gin.H{"ticket": ticket})
}

// ExchangeSSOTicket validates an SSO ticket and sets fresh auth cookies for the subdomain
func (ctrl *AuthController) ExchangeSSOTicket(c *gin.Context) {
	var req struct {
		Ticket string `json:"ticket" binding:"required"`
	}
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}
	claims, err := ctrl.tokenService.ValidateSSOTicket(req.Ticket)
	if err != nil {
		helpers.RespondError(c, http.StatusUnauthorized, "Invalid or expired ticket")
		return
	}
	var user models.User
	if err := config.DB.First(&user, claims.UserID).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "User not found")
		return
	}
	accessToken, err := ctrl.tokenService.GenerateAccessToken(&user)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to generate access token")
		return
	}
	rawRefreshToken, err := ctrl.tokenService.CreateRefreshToken(&user, c.ClientIP(), c.Request.UserAgent())
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create session")
		return
	}
	csrfToken, _ := ctrl.tokenService.GenerateCSRFToken()
	ctrl.setAuthCookies(c, accessToken, rawRefreshToken, csrfToken)
	helpers.RespondSuccess(c, http.StatusOK, "Ticket exchanged successfully", gin.H{
		"user": user,
		"role": user.Role,
	})
}
