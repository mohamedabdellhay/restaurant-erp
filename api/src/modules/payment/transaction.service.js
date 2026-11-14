import prisma from "../../db/client.js";
import { requireUuid } from "../../db/ids.js";
import OrderService from "../order/order.service.js";

class TransactionService {
  async resolveTransactionStatus(transaction, normalizedData) {
    const { status, providerTransactionId } = normalizedData;
    if (transaction.status !== "pending") return transaction;

    const updated = await prisma.transaction.update({
      where: { id: transaction.id },
      data: { status: status.toLowerCase() },
    });

    if (status.toUpperCase() === "SUCCESS") {
      await this.activateReference(updated, providerTransactionId);
    }
    return updated;
  }

  async activateReference(transaction, providerTransactionId) {
    const { referenceType, referenceId, amount, currency, provider } = transaction;

    if (referenceType === "Subscription") {
      const subscriptionId = requireUuid(referenceId);
      if (!subscriptionId) return;
      const subscription = await prisma.subscription.findUnique({ where: { id: subscriptionId } });
      if (subscription && subscription.status !== "active") {
        await prisma.subscription.update({
          where: { id: subscriptionId },
          data: {
            status: "active",
            paymentDetails: {
              transactionId: providerTransactionId,
              amount,
              currency,
              paymentMethod: provider,
              paidAt: new Date(),
            },
          },
        });
      }
    } else if (referenceType === "Order") {
      const orderId = requireUuid(referenceId);
      if (!orderId) return;
      const order = await prisma.order.findUnique({ where: { id: orderId } });
      if (!order || order.paymentStatus === "paid" || order.status === "cancelled") return;
      await OrderService.updateOrder(
        orderId,
        order.restaurantId,
        {
          paymentStatus: "paid",
          paymentMethod: "online",
          payment: {
            method: "online",
            paidAt: new Date().toISOString(),
            amount,
            currency,
          },
        },
        null,
      );
    }
  }
}

export default new TransactionService();
