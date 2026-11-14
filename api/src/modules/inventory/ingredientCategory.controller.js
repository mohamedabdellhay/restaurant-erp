import IngredientCategoryService from "./ingredientCategory.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ResponseHandler from "../../utils/responseHandler.js";

class IngredientCategoryController {
  index = asyncHandler(async (req, res) => {
    const categories = await IngredientCategoryService.list(req.user.restaurant);
    ResponseHandler.success(res, categories, "Ingredient categories retrieved successfully");
  });

  create = asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const duplicate = await IngredientCategoryService.findByName(req.user.restaurant, name);
    if (duplicate) {
      return ResponseHandler.error(res, "Category already exists", 409);
    }
    const category = await IngredientCategoryService.create(req.user.restaurant, name);
    ResponseHandler.created(res, category, "Ingredient category created successfully");
  });

  update = asyncHandler(async (req, res) => {
    const name = String(req.body.name || "").trim();
    const duplicate = await IngredientCategoryService.findByName(
      req.user.restaurant,
      name,
      req.params.id,
    );
    if (duplicate) {
      return ResponseHandler.error(res, "Category already exists", 409);
    }
    const category = await IngredientCategoryService.update(
      req.params.id,
      req.user.restaurant,
      name,
    );
    if (!category) return ResponseHandler.error(res, "Category not found", 404);
    ResponseHandler.success(res, category, "Ingredient category updated successfully");
  });

  delete = asyncHandler(async (req, res) => {
    const category = await IngredientCategoryService.remove(req.params.id, req.user.restaurant);
    if (!category) return ResponseHandler.error(res, "Category not found", 404);
    ResponseHandler.success(res, null, "Ingredient category deleted successfully");
  });
}

export default new IngredientCategoryController();
