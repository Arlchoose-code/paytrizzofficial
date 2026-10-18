package middlewares

import (
	"net/http"
	"paytrizz-backend/helpers"
	"paytrizz-backend/services"
	"strings"

	"github.com/gin-gonic/gin"
)

// AuthRequired middleware validates JWT access token from cookie or Authorization header
func AuthRequired(tokenService *services.TokenService) gin.HandlerFunc {
	return func(c *gin.Context) {
		var tokenStr string

		// 1. Check HttpOnly cookie first
		if cookieVal, err := c.Cookie("access_token"); err == nil && cookieVal != "" {
			tokenStr = cookieVal
		}

		// 2. Check Authorization header
		if tokenStr == "" {
			authHeader := c.GetHeader("Authorization")
			if strings.HasPrefix(authHeader, "Bearer ") {
				tokenStr = strings.TrimPrefix(authHeader, "Bearer ")
			}
		}

		if tokenStr == "" {
			helpers.RespondError(c, http.StatusUnauthorized, "Authentication required")
			c.Abort()
			return
		}

		claims, err := tokenService.ValidateAccessToken(tokenStr)
		if err != nil {
			helpers.RespondError(c, http.StatusUnauthorized, "Invalid or expired session. Please sign in again")
			c.Abort()
			return
		}

		c.Set("UserID", claims.UserID)
		c.Set("UserRole", claims.Role)
		c.Set("Role", string(claims.Role))
		c.Set("UserEmail", claims.Email)
		c.Next()
	}
}
