import MenuItemService from "../services/MenuItemService.js";
import ResponseHandler from "../utils/responseHandler.js";
import asyncHandler from "../utils/asyncHandler.js";
import { appendBaseUrlToItems, removeBaseUrlFromItem } from "../utils/urlHelper.js";

class MenuItemController {
  index = asyncHandler(async (req, res) => {
    const filter = {};
    if (req.query.category) filter.category = req.query.category;

    const menuItems = await MenuItemService.getAllItems(filter, req.user.restaurant);
    const menuItemsWithUrl = appendBaseUrlToItems(menuItems);

    ResponseHandler.success(
      res,
      menuItemsWithUrl,
      "Menu items retrieved successfully",
    );
  });

  getMenuItemById = asyncHandler(async (req, res) => {
    const menuItem = await MenuItemService.getMenuItemById(req.params.id, req.user.restaurant);
    if (!menuItem) return ResponseHandler.error(res, "Item not found", 404);

    const menuItemWithUrl = appendBaseUrlToItems(menuItem);
    ResponseHandler.success(res, menuItemWithUrl, "Menu item retrieved successfully");
  });

  create = asyncHandler(async (req, res) => {
    const data = { ...removeBaseUrlFromItem(req.body), restaurant: req.user.restaurant };
    const menuItem = await MenuItemService.createMenuItem(data);
    const menuItemWithUrl = appendBaseUrlToItems(menuItem);
    ResponseHandler.created(res, menuItemWithUrl, "Menu item created successfully");
  });

  update = asyncHandler(async (req, res) => {
    const data = removeBaseUrlFromItem(req.body);
    const menuItem = await MenuItemService.updateMenuItem(
      req.params.id,
      req.user.restaurant,
      data,
    );
    if (!menuItem) return ResponseHandler.error(res, "Item find not found", 404);

    const menuItemWithUrl = appendBaseUrlToItems(menuItem);
    ResponseHandler.success(res, menuItemWithUrl, "Menu item updated successfully");
  });

  delete = asyncHandler(async (req, res) => {
    const menuItem = await MenuItemService.deleteMenuItem(req.params.id, req.user.restaurant);
    if (!menuItem) return ResponseHandler.error(res, "Item not found", 404);
    ResponseHandler.success(res, null, "Menu item deleted successfully");
  });

  getRecipe = asyncHandler(async (req, res) => {
    const recipe = await MenuItemService.getRecipe(req.params.id, req.user.restaurant);
    if (!recipe) return ResponseHandler.error(res, "Menu item not found", 404);
    ResponseHandler.success(res, recipe, "Recipe retrieved successfully");
  });

  updateRecipe = asyncHandler(async (req, res) => {
    const menuItem = await MenuItemService.updateRecipe(
      req.params.id,
      req.user.restaurant,
      req.body.recipe,
    );
    if (!menuItem) return ResponseHandler.error(res, "Menu item not found", 404);
    ResponseHandler.success(res, menuItem, "Recipe updated successfully");
  });
}

export default new MenuItemController();
