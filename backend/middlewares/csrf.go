package middlewares

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"

	"github.com/gin-gonic/gin"
)

// CSRFProtection verifies CSRF token for mutating requests when cookie-based auth is present
func CSRFProtection() gin.HandlerFunc {
	return func(c *gin.Context) {
		method := c.Request.Method
		if method == http.MethodGet || method == http.MethodHead || method == http.MethodOptions {
			c.Next()
			return
		}

		// If called with Bearer header, CSRF isn't strictly necessary, but for cookie requests it is mandatory
		cookieToken, err := c.Cookie("csrf_token")
		if err != nil || cookieToken == "" {
			// If no cookie is present, might be public or token auth; proceed
			c.Next()
			return
		}

		// In development or if header is passed
		headerToken := c.GetHeader("X-CSRF-Token")
		if headerToken == "" || headerToken != cookieToken {
			if config.AppConfig.AppEnv == "production" {
				helpers.RespondError(c, http.StatusForbidden, "Invalid or missing CSRF token")
				c.Abort()
				return
			}
		}

		c.Next()
	}
}
