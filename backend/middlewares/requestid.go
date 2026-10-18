package middlewares

import (
	"github.com/gin-gonic/gin"
	"github.com/google/uuid"
)

const RequestIDHeader = "X-Request-ID"

// RequestID middleware injects a unique UUID into every request and response header
func RequestID() gin.HandlerFunc {
	return func(c *gin.Context) {
		reqID := c.GetHeader(RequestIDHeader)
		if reqID == "" {
			reqID = uuid.New().String()
		}
		c.Set("RequestID", reqID)
		c.Writer.Header().Set(RequestIDHeader, reqID)
		c.Next()
	}
}
