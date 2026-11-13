import prisma from "../../db/client.js";
import { refId, requireUuid } from "../../db/ids.js";
import asyncHandler from "../../utils/asyncHandler.js";
import ResponseHandler from "../../utils/responseHandler.js";
import AppError from "../../utils/errors/AppError.js";
import PaymentFactory from "./payment.factory.js";

class PaymentSettingController {
  getAvailableGateways = asyncHandler(async (req, res) => {
    const restaurantId = requireUuid(refId(req.user.restaurant));
    const providers = PaymentFactory.getAvailableProviders();
    const restaurant = restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
      : null;

    const gateways = providers.map((name) => {
      const dbInfo = restaurant?.settings?.paymentGateways?.[name];
      let logo = dbInfo?.logo;
      if (logo && !logo.startsWith("http")) {
        logo = `${process.env.BASE_URL}${logo}`;
      }
      return { name, logo: logo || null };
    });

    ResponseHandler.success(res, gateways, "Available payment gateways retrieved successfully");
  });

  uploadGatewayLogo = asyncHandler(async (req, res) => {
    if (!req.file) throw new AppError("No file uploaded", 400);

    const { provider } = req.params;
    const restaurantId = requireUuid(refId(req.user.restaurant));
    const restaurant = restaurantId
      ? await prisma.restaurant.findUnique({ where: { id: restaurantId } })
      : null;
    if (!restaurant) throw new AppError("Restaurant not found", 404);

    const fileUrl = `/uploads/gateways/${req.file.filename}`;
    const settings = structuredClone(restaurant.settings || {});
    settings.paymentGateways = settings.paymentGateways || {};
    settings.paymentGateways[provider] = settings.paymentGateways[provider] || {};
    settings.paymentGateways[provider].logo = fileUrl;

    await prisma.restaurant.update({ where: { id: restaurant.id }, data: { settings } });
    ResponseHandler.success(
      res,
      { logo: `${process.env.BASE_URL}${fileUrl}` },
      `${provider} logo uploaded successfully`,
    );
  });

  updateKashierSettings = asyncHandler(async (req, res) => {
    const { merchantId, apiKey, iframeSecret, testMode } = req.body;
    const restaurantId = requireUuid(refId(req.user.restaurant));
    if (!restaurantId) throw new AppError("User is not associated with any restaurant", 400);

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    if (!restaurant) throw new AppError("Restaurant not found", 404);

    const settings = structuredClone(restaurant.settings || {});
    settings.paymentGateways = settings.paymentGateways || {};
    settings.paymentGateways.kashier = {
      ...(settings.paymentGateways.kashier || {}),
      merchantId,
      apiKey,
      iframeSecret,
      testMode: testMode !== undefined ? testMode : true,
    };

    await prisma.restaurant.update({ where: { id: restaurant.id }, data: { settings } });
    ResponseHandler.success(res, null, "Kashier settings updated successfully");
  });

  getKashierSettings = asyncHandler(async (req, res) => {
    const restaurantId = requireUuid(refId(req.user.restaurant));
    if (!restaurantId) throw new AppError("User is not associated with any restaurant", 400);

    const restaurant = await prisma.restaurant.findUnique({ where: { id: restaurantId } });
    const kashier = restaurant?.settings?.paymentGateways?.kashier;
    if (!kashier) return ResponseHandler.success(res, {}, "No Kashier settings found");

    ResponseHandler.success(
      res,
      {
        merchantId: kashier.merchantId,
        apiKey: kashier.apiKey ? `****${kashier.apiKey.slice(-4)}` : null,
        iframeSecret: kashier.iframeSecret ? `****${kashier.iframeSecret.slice(-4)}` : null,
        testMode: kashier.testMode,
      },
      "Kashier settings retrieved successfully",
    );
  });
}

export default new PaymentSettingController();
