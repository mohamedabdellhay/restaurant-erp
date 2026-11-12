import prisma from "../db/client.js";
import { toDoc } from "../db/present.js";
import { refId, requireUuid } from "../db/ids.js";
import { comparePassword, hashPassword } from "../db/password.js";
import RestaurantService from "../services/RestaurantService.js";
import tokenHelper from "../utils/tokenHelper.js";
import asyncHandler from "../utils/asyncHandler.js";
import ResponseHandler from "../utils/responseHandler.js";
import AppError from "../utils/errors/AppError.js";
import { appendBaseUrl } from "../utils/urlHelper.js";

const profileInclude = { restaurant: true, role: true, department: true };

class AuthController {
  _formatRestaurant(restaurant) {
    if (!restaurant) return null;
    const restaurantObj = toDoc(restaurant);

    if (restaurantObj.logo) {
      restaurantObj.logo = appendBaseUrl(restaurantObj.logo);
    }
    if (restaurantObj.settings?.theme?.logo) {
      restaurantObj.settings.theme.logo = appendBaseUrl(restaurantObj.settings.theme.logo);
    }
    return restaurantObj;
  }

  async _resolveRoleId(role, restaurantId) {
    const roleId = requireUuid(role);
    if (roleId) return roleId;
    if (!role || !restaurantId) return null;
    const match = await prisma.role.findFirst({
      where: {
        restaurantId,
        name: { equals: String(role), mode: "insensitive" },
      },
    });
    return match?.id || null;
  }

  register = asyncHandler(async (req, res) => {
    const { name, email, password, role, restaurant: restaurantId } = req.body;

    const existingStaff = await prisma.staff.findUnique({ where: { email } });
    if (existingStaff) throw new AppError("Email already registered", 409);

    const resolvedRestaurantId = requireUuid(restaurantId);
    const roleId = await this._resolveRoleId(role, resolvedRestaurantId);
    if (!roleId) throw new AppError("A valid role is required", 400);

    const created = await prisma.staff.create({
      data: {
        name,
        email,
        passwordHash: await hashPassword(password),
        roleId,
        restaurantId: resolvedRestaurantId,
      },
      include: profileInclude,
    });

    const { accessToken, refreshToken } = tokenHelper.generateTokenPair({
      id: created.id,
      role: created.roleId,
    });

    let formattedRestaurant = this._formatRestaurant(created.restaurant);
    if (!formattedRestaurant) {
      formattedRestaurant = this._formatRestaurant(await RestaurantService.getCurrent());
    }

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    ResponseHandler.created(
      res,
      {
        staff: toDoc(created),
        accessToken,
        refreshToken,
        restaurant: formattedRestaurant,
        restaurantSettings: formattedRestaurant?.settings || null,
      },
      "Staff registered successfully",
    );
  });

  login = asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    const staff = await prisma.staff.findUnique({
      where: { email },
      include: profileInclude,
    });
    if (!staff) throw new AppError("Invalid credentials", 401);
    if (!staff.isActive) throw new AppError("Account is deactivated", 403);

    const isPasswordValid = await comparePassword(password, staff.passwordHash);
    if (!isPasswordValid) throw new AppError("Invalid credentials", 401);

    const { accessToken, refreshToken } = tokenHelper.generateTokenPair({
      id: staff.id,
      role: staff.roleId,
    });

    res.cookie("token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });

    let formattedRestaurant = null;
    if (!staff.isPlatformOwner) {
      formattedRestaurant = this._formatRestaurant(staff.restaurant);
      if (!formattedRestaurant) {
        formattedRestaurant = this._formatRestaurant(await RestaurantService.getCurrent());
      }
    }

    ResponseHandler.success(
      res,
      {
        staff: toDoc(staff),
        accessToken,
        refreshToken,
        restaurant: formattedRestaurant,
        restaurantSettings: formattedRestaurant?.settings || null,
      },
      "Logged in successfully",
    );
  });

  logout = asyncHandler(async (req, res) => {
    res.cookie("token", "", { httpOnly: true, expires: new Date(0) });
    ResponseHandler.success(res, null, "Logged out successfully");
  });

  getProfile = asyncHandler(async (req, res) => {
    const staff = await prisma.staff.findUnique({
      where: { id: requireUuid(refId(req.user)) },
      include: profileInclude,
    });
    if (!staff) throw new AppError("Staff not found", 404);

    let formattedRestaurant = null;
    if (!staff.isPlatformOwner) {
      formattedRestaurant = this._formatRestaurant(staff.restaurant);
      if (!formattedRestaurant) {
        formattedRestaurant = this._formatRestaurant(await RestaurantService.getCurrent());
      }
    }

    const staffObj = toDoc(staff);
    staffObj.restaurant = formattedRestaurant;
    staffObj.restaurantSettings = formattedRestaurant?.settings || null;
    ResponseHandler.success(res, staffObj, "Profile retrieved successfully");
  });

  updateProfile = asyncHandler(async (req, res) => {
    const { name, email } = req.body;
    const staff = await prisma.staff.update({
      where: { id: requireUuid(refId(req.user)) },
      data: { name, email },
    });
    ResponseHandler.success(res, toDoc(staff), "Profile updated successfully");
  });

  changePassword = asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    const staff = await prisma.staff.findUnique({
      where: { id: requireUuid(refId(req.user)) },
    });
    const isPasswordValid = await comparePassword(currentPassword, staff.passwordHash);
    if (!isPasswordValid) throw new AppError("Current password is incorrect", 401);

    await prisma.staff.update({
      where: { id: staff.id },
      data: { passwordHash: await hashPassword(newPassword) },
    });
    ResponseHandler.success(res, null, "Password changed successfully");
  });

  refreshToken = asyncHandler(async (req, res) => {
    const { refreshToken } = req.body;
    if (!refreshToken) throw new AppError("Refresh token is required", 400);

    const decoded = tokenHelper.verifyRefreshToken(refreshToken);
    const newAccessToken = tokenHelper.generateAccessToken({
      id: decoded.id,
      role: decoded.role,
    });
    ResponseHandler.success(res, { accessToken: newAccessToken }, "Token refreshed successfully");
  });
}

export default new AuthController();
