import RestaurantService from "./restaurant.service.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ResponseHandler from "../../utils/responseHandler.js";

function withLogoUrls(restaurant) {
  if (!restaurant) return restaurant;
  const restaurantObj = { ...restaurant };
  const withBase = (url) => {
    if (!url) return url;
    if (url.startsWith("http://") || url.startsWith("https://")) return url;
    return `${process.env.BASE_URL}${url}`;
  };
  if (restaurantObj.logo) restaurantObj.logo = withBase(restaurantObj.logo);
  if (restaurantObj.settings?.theme?.logo) {
    restaurantObj.settings = {
      ...restaurantObj.settings,
      theme: {
        ...restaurantObj.settings.theme,
        logo: withBase(restaurantObj.settings.theme.logo),
      },
    };
  }
  return restaurantObj;
}

class RestaurantController {
  index = asyncHandler(async (req, res) => {
    const allRestaurants = await RestaurantService.getAll();
    ResponseHandler.success(
      res,
      allRestaurants.map((restaurant) => withLogoUrls(restaurant)),
      "Restaurants retrieved successfully",
      200,
    );
  });

  getCurrent = asyncHandler(async (req, res) => {
    const restaurant = await RestaurantService.getCurrent();
    if (!restaurant) {
      return ResponseHandler.success(res, {}, "No restaurant settings found", 200);
    }

    ResponseHandler.success(
      res,
      withLogoUrls(restaurant),
      "Restaurant settings retrieved successfully",
      200,
    );
  });

  create = asyncHandler(async (req, res) => {
    const restaurant = await RestaurantService.create(req.body);
    ResponseHandler.created(res, restaurant, "Restaurant settings created successfully");
  });

  update = asyncHandler(async (req, res) => {
    const restaurant = await RestaurantService.update(req.params.id, req.body);
    if (!restaurant) return ResponseHandler.error(res, "Restaurant not found", 404);
    ResponseHandler.success(res, withLogoUrls(restaurant), "Restaurant updated successfully");
  });

  updateTheme = asyncHandler(async (req, res) => {
    const id = req.params.id;
    if (req.user?.restaurant && req.user.restaurant !== id) {
      return ResponseHandler.error(res, "You can only update your restaurant theme", 403);
    }

    const restaurant = await RestaurantService.updateTheme(id, req.body);
    if (!restaurant) return ResponseHandler.error(res, "Restaurant not found", 404);
    ResponseHandler.success(res, withLogoUrls(restaurant).settings.theme, "Theme saved successfully");
  });

  uploadLogo = asyncHandler(async (req, res) => {
    if (!req.file) return ResponseHandler.error(res, "No file uploaded", 400);

    const restaurantId = req.body.restaurantId || req.user?.restaurant;
    if (!restaurantId) return ResponseHandler.error(res, "Restaurant ID is required", 400);

    const fileUrl = `/uploads/logos/${req.file.filename}`;
    const restaurant = await RestaurantService.update(restaurantId, { logo: fileUrl });
    if (!restaurant) return ResponseHandler.error(res, "Restaurant not found", 404);

    ResponseHandler.success(
      res,
      {
        logo: `${process.env.BASE_URL}${fileUrl}`,
        restaurant: withLogoUrls(restaurant),
      },
      "Logo uploaded successfully",
    );
  });
}

export default new RestaurantController();
