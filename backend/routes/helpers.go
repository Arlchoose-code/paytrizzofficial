package routes

import (
	"paytrizz-backend/helpers"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

func RespondSuccess(c *gin.Context, httpStatus int, message string, data any) {
	helpers.RespondSuccess(c, httpStatus, message, data)
}

func RespondPaginated(c *gin.Context, message string, paginated structs.PaginatedData) {
	helpers.RespondPaginated(c, message, paginated)
}

func RespondError(c *gin.Context, httpStatus int, message string) {
	helpers.RespondError(c, httpStatus, message)
}

func RespondValidationErrors(c *gin.Context, message string, errors map[string][]string) {
	helpers.RespondValidationErrors(c, message, errors)
}
