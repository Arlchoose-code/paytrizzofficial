package middlewares

import (
	"fmt"
	"net/http"
	"paytrizz-backend/helpers"
	"sync"
	"time"

	"github.com/gin-gonic/gin"
)

type clientLimit struct {
	count    int
	expireAt time.Time
}

type RateLimiter struct {
	mu      sync.Mutex
	clients map[string]*clientLimit
	limit   int
	window  time.Duration
}

func NewRateLimiter(limit int, window time.Duration) *RateLimiter {
	rl := &RateLimiter{
		clients: make(map[string]*clientLimit),
		limit:   limit,
		window:  window,
	}

	// Background cleanup of expired records every 5 minutes
	go func() {
		ticker := time.NewTicker(5 * time.Minute)
		for range ticker.C {
			rl.mu.Lock()
			now := time.Now()
			for k, v := range rl.clients {
				if now.After(v.expireAt) {
					delete(rl.clients, k)
				}
			}
			rl.mu.Unlock()
		}
	}()

	return rl
}

func (rl *RateLimiter) Middleware(keyPrefix string) gin.HandlerFunc {
	return func(c *gin.Context) {
		ip := c.ClientIP()
		if ip == "127.0.0.1" || ip == "::1" {
			c.Next()
			return
		}
		key := fmt.Sprintf("%s:%s", keyPrefix, ip)

		rl.mu.Lock()
		now := time.Now()
		item, exists := rl.clients[key]

		if !exists || now.After(item.expireAt) {
			rl.clients[key] = &clientLimit{
				count:    1,
				expireAt: now.Add(rl.window),
			}
			rl.mu.Unlock()
			c.Next()
			return
		}

		if item.count >= rl.limit {
			remainingSecs := int(time.Until(item.expireAt).Seconds())
			if remainingSecs < 1 {
				remainingSecs = 1
			}
			rl.mu.Unlock()

			c.Writer.Header().Set("Retry-After", fmt.Sprintf("%d", remainingSecs))
			helpers.RespondError(c, http.StatusTooManyRequests, fmt.Sprintf("Too many requests. Please try again in %d seconds.", remainingSecs))
			c.Abort()
			return
		}

		item.count++
		rl.mu.Unlock()
		c.Next()
	}
}
