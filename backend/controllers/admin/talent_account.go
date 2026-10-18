package admin

import (
	"crypto/rand"
	"encoding/hex"
	"fmt"
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"
	"strconv"
	"time"

	"github.com/gin-gonic/gin"
	"golang.org/x/crypto/bcrypt"
)

// Destroy deletes a talent and cascading user
func (ctrl *TalentController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid talent ID")
		return
	}

	var talent models.Talent
	if err := config.DB.Where("id = ?", id).First(&talent).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent not found")
		return
	}

	adminIDVal, _ := c.Get("UserID")
	if adminIDVal != nil {
		aid := adminIDVal.(uint64)
		if talent.UserID == aid {
			helpers.RespondError(c, http.StatusBadRequest, "You cannot delete your own account")
			return
		}
	}

	var user models.User
	if err := config.DB.First(&user, talent.UserID).Error; err == nil {
		deletedEmail := fmt.Sprintf("%s.deleted.%d", user.Email, time.Now().Unix())
		config.DB.Model(&user).Update("email", deletedEmail)
	}

	tx := config.DB.Begin()
	tx.Where("id = ?", talent.UserID).Delete(&models.User{})
	tx.Delete(&talent)
	tx.Commit()

	pathDirectory := "/talents"
	ctrl.revalidateService.QueueRevalidateTag("talents", &pathDirectory)
	ctrl.auditService.LogContext(c, "talents", "delete", "talent", &talent.ID, "Deleted talent "+talent.Name, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Talent deleted successfully", nil)
}

// ResetPassword generates a new password for the talent, forces change on next login,
// revokes all refresh tokens, and emails the new credentials (PRD 4.1)
func (ctrl *TalentController) ResetPassword(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid talent ID")
		return
	}

	var req structs.AdminResetTalentPasswordRequest
	_ = c.ShouldBindJSON(&req)

	var talent models.Talent
	if err := config.DB.Preload("User").Where("id = ?", id).First(&talent).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent not found")
		return
	}
	if talent.User == nil {
		helpers.RespondError(c, http.StatusNotFound, "Talent user account not found")
		return
	}

	b := make([]byte, 6)
	_, _ = rand.Read(b)
	newPassword := hex.EncodeToString(b) + "!A1"

	hash, err := bcrypt.GenerateFromPassword([]byte(newPassword), bcrypt.DefaultCost)
	if err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to hash password")
		return
	}

	tx := config.DB.Begin()
	if err := tx.Model(&models.User{}).Where("id = ?", talent.User.ID).Updates(map[string]interface{}{
		"password_hash":        string(hash),
		"must_change_password": true,
		"password_changed_at":  nil,
	}).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to reset password")
		return
	}

	// Revoke all existing refresh tokens (PRD 4.1)
	if err := tx.Model(&models.RefreshToken{}).
		Where("user_id = ? AND revoked_at IS NULL", talent.User.ID).
		Update("revoked_at", time.Now()).Error; err != nil {
		tx.Rollback()
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to revoke sessions")
		return
	}
	tx.Commit()

	sendEmail := true
	if req.SendEmail != nil {
		sendEmail = *req.SendEmail
	}
	if sendEmail {
		loginURL := "http://localhost:3000/login"
		changeURL := "http://localhost:3000/change-password"
		_, _ = ctrl.outboxService.SendTemplated(
			"password_reset",
			talent.User.Email,
			&talent.User.Name,
			map[string]string{
				"name":                talent.User.Name,
				"login_url":           loginURL,
				"login_email":         talent.User.Email,
				"password":            newPassword,
				"change_password_url": changeURL,
			},
			nil,
			nil,
			&talent.ID,
		)
	}

	ctrl.auditService.LogContext(c, "talents", "reset_password", "talent", &talent.ID, "Reset password for talent "+talent.Name, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Password reset successfully", gin.H{
		"temp_password": newPassword,
	})
}
