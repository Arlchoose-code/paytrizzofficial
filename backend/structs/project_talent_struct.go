package structs

type ProjectTalentInput struct {
	TalentID  uint64 `json:"talent_id" binding:"required"`
	RoleLabel string `json:"role_label"`
	SortOrder int    `json:"sort_order"`
}

type ProjectTalentResponse struct {
	TalentID  uint64          `json:"talent_id"`
	RoleLabel string          `json:"role_label"`
	SortOrder int             `json:"sort_order"`
	Talent    *TalentResponse `json:"talent,omitempty"`
}
