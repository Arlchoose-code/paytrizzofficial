package structs

import "time"

type AuditLogResponse struct {
	ID          uint64    `json:"id"`
	ActorUserID *uint64   `json:"actor_user_id"`
	ActorName   string    `json:"actor_name,omitempty"`
	Module      string    `json:"module"`
	Action      string    `json:"action"`
	TargetType  string    `json:"target_type"`
	TargetID    *uint64   `json:"target_id"`
	Summary     string    `json:"summary"`
	IP          string    `json:"ip"`
	CreatedAt   time.Time `json:"created_at"`
}
