package helpers

import (
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

// RespondSuccess sends standard successful JSON response
func RespondSuccess(c *gin.Context, httpStatus int, message string, data any) {
	c.JSON(httpStatus, structs.APIResponse{
		Success: true,
		Message: message,
		Data:    data,
	})
}

// RespondPaginated sends standard paginated JSON response
func RespondPaginated(c *gin.Context, message string, paginated structs.PaginatedData) {
	c.JSON(200, structs.APIResponse{
		Success: true,
		Message: message,
		Data:    paginated,
	})
}

// RespondError sends standard error JSON response and aborts context
func RespondError(c *gin.Context, httpStatus int, message string) {
	c.AbortWithStatusJSON(httpStatus, structs.APIResponse{
		Success: false,
		Message: message,
	})
}

// RespondValidationErrors sends standard validation error JSON response and aborts context
func RespondValidationErrors(c *gin.Context, message string, errors map[string][]string) {
	c.AbortWithStatusJSON(422, structs.APIErrorResponse{
		Success: false,
		Message: message,
		Errors:  errors,
	})
}

// RespondValidationError formats a single binding error into standard 422 response
func RespondValidationError(c *gin.Context, err error) {
	errs := make(map[string][]string)
	if err != nil {
		errs["general"] = []string{err.Error()}
	}
	RespondValidationErrors(c, "Validation failed", errs)
}

