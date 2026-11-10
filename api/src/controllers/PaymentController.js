import asyncHandler from "../utils/asyncHandler.js";
import ResponseHandler from "../utils/responseHandler.js";
import PaymentFactory from "../services/payment/PaymentFactory.js";
import TransactionService from "../services/payment/TransactionService.js";
import prisma from "../db/client.js";
import { requireUuid } from "../db/ids.js";

class PaymentController {
  handleCallback = asyncHandler(async (req, res) => {
    const { provider } = req.params;
    const paymentService = PaymentFactory.getProvider(provider);
    const payload = req.body && Object.keys(req.body).length > 0 ? req.body : req.query;
    const transactionId = payload.merchantOrderId || payload.order || payload.orderId || payload.transactionId;

    const transaction = await prisma.transaction.findUnique({ where: { transactionId } });
    if (!transaction) {
      if (req.method === "GET") {
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/failed?reason=not_found`,
        );
      }
      return ResponseHandler.error(res, "Transaction not found locally", 404);
    }

    let config = {};
    if (transaction.restaurantId) {
      const restaurant = await prisma.restaurant.findUnique({
        where: { id: requireUuid(transaction.restaurantId) },
      });
      if (restaurant?.settings?.paymentGateways?.[provider]) {
        config = restaurant.settings.paymentGateways[provider];
      }
    }

    let isValid = false;
    if (req.method === "POST" && paymentService.verifyWebhook) {
      isValid = paymentService.verifyWebhook(req.body, req.headers, config);
    } else {
      isValid = paymentService.validateCallback(req.query || payload, config);
    }

    if (!isValid) {
      if (req.method === "GET") {
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/failed?reason=verification_failed`,
        );
      }
      return ResponseHandler.error(res, "Invalid Payment Signature or Status", 400);
    }

    const normalizedData = paymentService.normalizeCallback(payload, config);
    await TransactionService.resolveTransactionStatus(transaction, normalizedData);

    if (req.method === "GET") {
      if (normalizedData.status.toUpperCase() === "SUCCESS") {
        return res.redirect(
          `${process.env.FRONTEND_URL || "http://localhost:5173"}/dashboard?payment=success`,
        );
      }
      return res.redirect(`${process.env.FRONTEND_URL || "http://localhost:5173"}/payment/failed`);
    }

    return ResponseHandler.success(res, { status: "processed" }, "Webhook received");
  });
}

export default new PaymentController();
