package admin

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"strings"
	"time"

	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type UserController struct {
	authService  *services.AuthService
	auditService *services.AuditService
}

func NewUserController(authService *services.AuthService, auditService *services.AuditService) *UserController {
	return &UserController{
		authService:  authService,
		auditService: auditService,
	}
}

// Index lists users with pagination and role filter
func (ctrl *UserController) Index(c *gin.Context) {
	var query structs.PaginationQuery
	_ = c.ShouldBindQuery(&query)

	if query.Page < 1 {
		query.Page = 1
	}
	if query.PerPage < 1 || query.PerPage > 100 {
		query.PerPage = 10
	}

	db := config.DB.Model(&models.User{})

	if role := c.Query("role"); role != "" {
		db = db.Where("role = ?", role)
	}

	if query.Search != "" {
		searchTerm := "%" + strings.ToLower(query.Search) + "%"
		db = db.Where("LOWER(name) LIKE ? OR LOWER(email) LIKE ?", searchTerm, searchTerm)
	}

	var total int64
	db.Count(&total)

	var users []models.User
	offset := (query.Page - 1) * query.PerPage
	if err := db.Order("id DESC").Offset(offset).Limit(query.PerPage).Find(&users).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve users")
		return
	}

	var respList []structs.UserResponse
	for _, u := range users {
		respList = append(respList, structs.UserResponse{
			ID:                   u.ID,
			Role:                 string(u.Role),
			Name:                 u.Name,
			Email:                u.Email,
			IsActive:             u.IsActive,
			MustChangePassword:   u.MustChangePassword,
			PasswordChangedAt:    u.PasswordChangedAt,
			LastLoginAt:          u.LastLoginAt,
			MailPolicyAcceptedAt: u.MailPolicyAcceptedAt,
			CreatedAt:            u.CreatedAt,
		})
	}

	lastPage := int((total + int64(query.PerPage) - 1) / int64(query.PerPage))
	if lastPage < 1 {
		lastPage = 1
	}

	helpers.RespondPaginated(c, "Get users success", structs.PaginatedData{
		CurrentPage: query.Page,
		PerPage:     query.PerPage,
		Total:       total,
		LastPage:    lastPage,
		Data:        respList,
	})
}

// Store creates a new admin or talent user
func (ctrl *UserController) Store(c *gin.Context) {
	var req structs.CreateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	adminIDVal, _ := c.Get("UserID")
	var adminID *uint64
	if adminIDVal != nil {
		id := adminIDVal.(uint64)
		adminID = &id
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))

	// Check email uniqueness
	var count int64
	config.DB.Unscoped().Model(&models.User{}).Where("email = ?", cleanEmail).Count(&count)
	if count > 0 {
		helpers.RespondError(c, http.StatusConflict, "Email already in use")
		return
	}

	initPassword := req.Password
	if initPassword == "" {
		// Generate random 12-char hex password
		b := make([]byte, 6)
		_, _ = rand.Read(b)
		initPassword = "Ptz!" + hex.EncodeToString(b)
	}

	hash, err := ctrl.authService.HashPassword(initPassword)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	user := models.User{
		Role:               models.UserRole(req.Role),
		Name:               req.Name,
		Email:              cleanEmail,
		PasswordHash:       hash,
		IsActive:           true,
		MustChangePassword: req.ForceChangePassword,
		CreatedByID:        adminID,
	}

	if err := config.DB.Create(&user).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create user")
		return
	}

	ctrl.auditService.Log(adminID, "user", "create", "user", &user.ID, "Created new user "+user.Email, nil, c.ClientIP(), c.GetHeader("User-Agent"))

	helpers.RespondSuccess(c, http.StatusCreated, "User created successfully", gin.H{
		"user": structs.UserResponse{
			ID:                 user.ID,
			Role:               string(user.Role),
			Name:               user.Name,
			Email:              user.Email,
			IsActive:           user.IsActive,
			MustChangePassword: user.MustChangePassword,
			CreatedAt:          user.CreatedAt,
		},
		"initial_password": initPassword,
	})
}

// Show retrieves single user by ID
func (ctrl *UserController) Show(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get user details success", structs.UserResponse{
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

// Update updates an existing user
func (ctrl *UserController) Update(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	var req structs.UpdateUserRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid request payload")
		return
	}

	adminIDVal, _ := c.Get("UserID")
	var adminID *uint64
	if adminIDVal != nil {
		aid := adminIDVal.(uint64)
		adminID = &aid
	}

	cleanEmail := strings.ToLower(strings.TrimSpace(req.Email))
	if cleanEmail != user.Email {
		var count int64
		config.DB.Unscoped().Model(&models.User{}).Where("email = ? AND id != ?", cleanEmail, user.ID).Count(&count)
		if count > 0 {
			helpers.RespondError(c, http.StatusConflict, "Email already in use")
			return
		}
		user.Email = cleanEmail
	}

	user.Name = req.Name
	if req.IsActive != nil {
		user.IsActive = *req.IsActive
	}

	if err := config.DB.Save(&user).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update user")
		return
	}

	ctrl.auditService.Log(adminID, "user", "update", "user", &user.ID, "Updated user "+user.Email, nil, c.ClientIP(), c.GetHeader("User-Agent"))

	helpers.RespondSuccess(c, http.StatusOK, "User updated successfully", structs.UserResponse{
		ID:                 user.ID,
		Role:               string(user.Role),
		Name:               user.Name,
		Email:              user.Email,
		IsActive:           user.IsActive,
		MustChangePassword: user.MustChangePassword,
		CreatedAt:          user.CreatedAt,
	})
}

// Destroy toggles active status or soft deletes user
func (ctrl *UserController) Destroy(c *gin.Context) {
	id := c.Param("id")
	var user models.User
	if err := config.DB.First(&user, id).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "User not found")
		return
	}

	adminIDVal, _ := c.Get("UserID")
	var adminID *uint64
	if adminIDVal != nil {
		aid := adminIDVal.(uint64)
		adminID = &aid
		if user.ID == aid {
			helpers.RespondError(c, http.StatusBadRequest, "You cannot delete your own account")
			return
		}
	}

	// Rename email to avoid unique index collision on subsequent creation
	deletedEmail := fmt.Sprintf("%s.deleted.%d", user.Email, time.Now().Unix())
	config.DB.Model(&user).Update("email", deletedEmail)

	// Soft delete
	if err := config.DB.Delete(&user).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete user")
		return
	}

	ctrl.auditService.Log(adminID, "user", "delete", "user", &user.ID, "Deleted user "+user.Email, nil, c.ClientIP(), c.GetHeader("User-Agent"))

	helpers.RespondSuccess(c, http.StatusOK, "User deleted successfully", nil)
}
