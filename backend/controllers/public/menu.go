package public

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/structs"

	"github.com/gin-gonic/gin"
)

type MenuItemController struct{}

func NewMenuItemController() *MenuItemController {
	return &MenuItemController{}
}

// Index lists active menu items for header or footer
func (ctrl *MenuItemController) Index(c *gin.Context) {
	location := c.DefaultQuery("location", "header")

	var items []models.MenuItem
	if err := config.DB.Where("location = ? AND parent_id IS NULL AND is_active = true", location).
		Preload("Children", "is_active = true").
		Order("sort_order ASC, id ASC").
		Find(&items).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to retrieve menu items")
		return
	}

	var resp []structs.MenuItemResponse
	for _, it := range items {
		var childrenResp []structs.MenuItemResponse
		for _, child := range it.Children {
			childrenResp = append(childrenResp, structs.MenuItemResponse{
				ID:         child.ID,
				Location:   string(child.Location),
				Label:      child.Label,
				URL:        child.URL,
				ParentID:   child.ParentID,
				SortOrder:  child.SortOrder,
				IsActive:   child.IsActive,
				OpenNewTab: child.OpenNewTab,
			})
		}

		resp = append(resp, structs.MenuItemResponse{
			ID:         it.ID,
			Location:   string(it.Location),
			Label:      it.Label,
			URL:        it.URL,
			ParentID:   it.ParentID,
			Children:   childrenResp,
			SortOrder:  it.SortOrder,
			IsActive:   it.IsActive,
			OpenNewTab: it.OpenNewTab,
		})
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get menu items success", resp)
}
