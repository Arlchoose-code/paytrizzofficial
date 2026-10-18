package middlewares

import (
	"net/http"
	"paytrizz-backend/models"
	"paytrizz-backend/helpers"

	"github.com/gin-gonic/gin"
)

// RequireRole enforces role-based access control (RBAC)
func RequireRole(allowedRoles ...models.UserRole) gin.HandlerFunc {
	return func(c *gin.Context) {
		roleVal, exists := c.Get("UserRole")
		if !exists {
			helpers.RespondError(c, http.StatusForbidden, "Access forbidden")
			c.Abort()
			return
		}

		userRole, ok := roleVal.(models.UserRole)
		if !ok {
			helpers.RespondError(c, http.StatusForbidden, "Access forbidden")
			c.Abort()
			return
		}

		matched := false
		for _, allowed := range allowedRoles {
			if userRole == allowed {
				matched = true
				break
			}
		}

		if !matched {
			helpers.RespondError(c, http.StatusForbidden, "You do not have permission to access this resource")
			c.Abort()
			return
		}

		c.Next()
	}
}
