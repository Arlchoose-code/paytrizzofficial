package structs

type LoginRequest struct {
	Email          string `json:"email" binding:"required,email"`
	Password       string `json:"password" binding:"required"`
	TurnstileToken string `json:"turnstile_token"`
}

type RefreshTokenRequest struct {
	RefreshToken string `json:"refresh_token"`
}

type ForgotPasswordRequest struct {
	Email          string `json:"email" binding:"required,email"`
	TurnstileToken string `json:"turnstile_token"`
}

type ResetPasswordRequest struct {
	Token       string `json:"token" binding:"required"`
	NewPassword string `json:"new_password" binding:"required,min=10"`
}

type ChangePasswordRequest struct {
	CurrentPassword string `json:"current_password" binding:"required"`
	NewPassword     string `json:"new_password" binding:"required,min=10"`
}

type AcceptMailPolicyRequest struct {
	Accepted bool `json:"accepted" binding:"required"`
}

type AuthResponseData struct {
	User        UserResponse `json:"user"`
	AccessToken string       `json:"access_token"`
	CSRFToken   string       `json:"csrf_token"`
}

type SessionResponse struct {
	ID        uint64 `json:"id"`
	IP        string `json:"ip"`
	UserAgent string `json:"user_agent"`
	CreatedAt string `json:"created_at"`
	IsCurrent bool   `json:"is_current"`
}
