package structs

type SkillResponse struct {
	ID       uint64 `json:"id"`
	Name     string `json:"name"`
	Slug     string `json:"slug"`
	Category string `json:"category"`
}

type CreateSkillRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=80"`
	Category string `json:"category" binding:"required"`
}

type UpdateSkillRequest struct {
	Name     string `json:"name" binding:"required,min=2,max=80"`
	Category string `json:"category" binding:"required"`
}
