package admin

import (
	"net/http"
	"paytrizz-backend/config"
	"paytrizz-backend/helpers"
	"paytrizz-backend/models"
	"paytrizz-backend/services"
	"paytrizz-backend/structs"
	"strconv"

	"github.com/gin-gonic/gin"
)

type MenuItemController struct {
	revalidateService *services.RevalidateService
	auditService      *services.AuditService
}

func NewMenuItemController(revalidateService *services.RevalidateService, auditService *services.AuditService) *MenuItemController {
	return &MenuItemController{
		revalidateService: revalidateService,
		auditService:      auditService,
	}
}

// Index lists menu items filtered optionally by location
func (ctrl *MenuItemController) Index(c *gin.Context) {
	location := c.Query("location")
	db := config.DB.Model(&models.MenuItem{}).Where("parent_id IS NULL").Preload("Children")
	if location != "" {
		db = db.Where("location = ?", location)
	}

	var items []models.MenuItem
	if err := db.Order("sort_order ASC, id ASC").Find(&items).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to fetch menu items")
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

// Store creates a new menu item
func (ctrl *MenuItemController) Store(c *gin.Context) {
	var req structs.CreateMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	isActive := true
	if req.IsActive != nil {
		isActive = *req.IsActive
	}
	openNewTab := false
	if req.OpenNewTab != nil {
		openNewTab = *req.OpenNewTab
	}

	item := models.MenuItem{
		Location:   models.MenuLocation(req.Location),
		Label:      req.Label,
		URL:        req.URL,
		ParentID:   req.ParentID,
		SortOrder:  req.SortOrder,
		IsActive:   isActive,
		OpenNewTab: openNewTab,
	}

	if err := config.DB.Create(&item).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to create menu item")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("menus", nil)
	ctrl.auditService.LogContext(c, "menus", "create", "menu_item", &item.ID, "Created menu item "+item.Label, item)

	helpers.RespondSuccess(c, http.StatusCreated, "Menu item created successfully", item)
}

// Show returns a menu item by ID
func (ctrl *MenuItemController) Show(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid menu item ID")
		return
	}

	var item models.MenuItem
	if err := config.DB.Preload("Children").Where("id = ?", id).First(&item).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Menu item not found")
		return
	}

	var childrenResp []structs.MenuItemResponse
	for _, child := range item.Children {
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

	resp := structs.MenuItemResponse{
		ID:         item.ID,
		Location:   string(item.Location),
		Label:      item.Label,
		URL:        item.URL,
		ParentID:   item.ParentID,
		Children:   childrenResp,
		SortOrder:  item.SortOrder,
		IsActive:   item.IsActive,
		OpenNewTab: item.OpenNewTab,
	}

	helpers.RespondSuccess(c, http.StatusOK, "Get menu item success", resp)
}

// Update updates an existing menu item
func (ctrl *MenuItemController) Update(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid menu item ID")
		return
	}

	var req structs.UpdateMenuItemRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		helpers.RespondValidationError(c, err)
		return
	}

	var item models.MenuItem
	if err := config.DB.Where("id = ?", id).First(&item).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Menu item not found")
		return
	}

	item.Location = models.MenuLocation(req.Location)
	item.Label = req.Label
	item.URL = req.URL
	item.ParentID = req.ParentID
	item.SortOrder = req.SortOrder
	if req.IsActive != nil {
		item.IsActive = *req.IsActive
	}
	if req.OpenNewTab != nil {
		item.OpenNewTab = *req.OpenNewTab
	}

	if err := config.DB.Save(&item).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to update menu item")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("menus", nil)
	ctrl.auditService.LogContext(c, "menus", "update", "menu_item", &item.ID, "Updated menu item "+item.Label, item)

	helpers.RespondSuccess(c, http.StatusOK, "Menu item updated successfully", item)
}

// Destroy deletes a menu item
func (ctrl *MenuItemController) Destroy(c *gin.Context) {
	id, err := strconv.ParseUint(c.Param("id"), 10, 64)
	if err != nil {
		helpers.RespondError(c, http.StatusBadRequest, "Invalid menu item ID")
		return
	}

	var item models.MenuItem
	if err := config.DB.Where("id = ?", id).First(&item).Error; err != nil {
		helpers.RespondError(c, http.StatusNotFound, "Menu item not found")
		return
	}

	if err := config.DB.Delete(&item).Error; err != nil {
		helpers.RespondError(c, http.StatusInternalServerError, "Failed to delete menu item")
		return
	}

	ctrl.revalidateService.QueueRevalidateTag("menus", nil)
	ctrl.auditService.LogContext(c, "menus", "delete", "menu_item", &item.ID, "Deleted menu item "+item.Label, nil)

	helpers.RespondSuccess(c, http.StatusOK, "Menu item deleted successfully", nil)
}
