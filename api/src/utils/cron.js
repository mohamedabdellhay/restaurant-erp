import cron from "node-cron";
import prisma from "../db/client.js";
import PaymentFactory from "../modules/payment/payment.factory.js";
import TransactionService from "../modules/payment/transaction.service.js";

/**
 * Background job to sync pending transactions with payment providers.
 * Runs every 15 minutes.
 */
const initCron = () => {
  console.log("[Cron] Initializing payment sync job...");

  // Run every 15 minutes: '*/15 * * * *'
  // For testing, you can use '*/1 * * * *' (every minute)
  cron.schedule("*/15 * * * *", async () => {
    console.log("[Cron] Running payment sync...");

    try {
      // 1. Find pending transactions from the last 24 hours
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
      const pendingTransactions = await prisma.transaction.findMany({
        where: { status: "pending", createdAt: { gt: oneDayAgo } },
      });

      console.log(`[Cron] Found ${pendingTransactions.length} pending transactions to check.`);

      for (const transaction of pendingTransactions) {
        try {
          const provider = PaymentFactory.getProvider(transaction.provider);
          if (!provider || !provider.checkStatus) continue;

          // Get restaurant config if applicable
          let config = {};
          if (transaction.restaurantId) {
            const restaurant = await prisma.restaurant.findUnique({
              where: { id: transaction.restaurantId },
            });
            config = {
              restaurantId: transaction.restaurantId,
              ...(restaurant?.settings?.paymentGateways?.[transaction.provider] || {}),
            };
          }

          // Check status from provider API
          const normalizedData = await provider.checkStatus(transaction.transactionId, config);

          if (normalizedData && normalizedData.status !== "PENDING") {
            console.log(`[Cron] Updating transaction ${transaction.transactionId} to ${normalizedData.status}`);
            await TransactionService.resolveTransactionStatus(transaction, normalizedData);
          }
        } catch (trxError) {
          console.error(`[Cron] Error checking transaction ${transaction.transactionId}:`, trxError);
        }
      }
    } catch (error) {
      console.error("[Cron] Payment sync job failed:", error);
    }
  });
};

export default initCron;
