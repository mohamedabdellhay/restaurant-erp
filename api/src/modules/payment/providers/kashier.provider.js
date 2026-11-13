import PaymentProvider from "../payment.provider.js";
import "dotenv/config";
import queryString from "query-string";
import prisma from "../../../db/client.js";
import { requireUuid } from "../../../db/ids.js";

class KashierProvider extends PaymentProvider {
  constructor() {
    super();
    this.merchantId = "";
    this.apiKey = "";
    this.iframeSecret = "";
    this.baseUrl = ""; // or test URL based on env
  }
  async getCheckoutUrl(transactionId, amount, currency = "EGP", customer, callbackUrl, config = {}) {
    // If config is already provided with keys, use them. Otherwise fetch from DB.
    let settings = config;
    if (config.restaurantId && !config.apiKey) {
      settings = await this.getSettings(config.restaurantId);
    }

    const { testMode } = settings;
    const merchantId = (settings.merchantId || "").toString().trim();
    const iframeSecret = (settings.iframeSecret || "").toString().trim(); // Secret Key for v3
    const apiKey = (settings.apiKey || "").toString().trim(); // Payment API Key for v3
    const isTestMode = testMode !== undefined ? testMode : true;

    const apiBase = isTestMode
      ? "https://test-api.kashier.io/v3"
      : "https://api.kashier.io/v3";

    // Diagnostic Logging (Masked for Security)
    console.log(`[Kashier] Path: ${apiBase}/payment/sessions`);
    console.log(`[Kashier] Merchant ID: ${merchantId}`);
    console.log(`[Kashier] Authorization (Secret Key): ****${iframeSecret.slice(-4)}`);
    console.log(`[Kashier] api-key (API Key): ****${apiKey.slice(-4)}`);

    // Prepare v3 Session Payload
    const expiryDate = new Date();
    expiryDate.setHours(expiryDate.getHours() + 24); // Session valid for 24h

    const payload = {
      amount: amount.toFixed(2),
      currency,
      order: transactionId,
      merchantId,
      expireAt: expiryDate.toISOString(),
      maxFailureAttempts: 3,
      merchantRedirect: callbackUrl,
      display: "en",
      type: "one-time",
      customer: {
        email: customer.email || "customer@example.com",
        name: customer.name || "Customer",
        reference: customer.reference || customer.email || transactionId,
      },
      allowedMethods: "card,wallet",
    };

    try {

      const response = await fetch(`${apiBase}/payment/sessions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "api-key": apiKey,
          "Authorization": iframeSecret,
        },
        body: JSON.stringify(payload),
      });

      const data = await response.json();
      
      // Kashier v3 returns HTTP 200/201 and status 'CREATED' or 'SUCCESS'
      if (!response.ok || (data.status !== "SUCCESS" && data.status !== "CREATED")) {
        console.error("Kashier Session Error Details:", JSON.stringify(data, null, 2));
        throw new Error(data.message || data.error || `HTTP ${response.status}: Failed to create Kashier session`);
      }


      // Return the session URL for redirection
      return data.sessionUrl;
    } catch (error) {
      console.error("Kashier Provider Error:", error);
      throw error;
    }
  }

  validateCallback(query, config = {}) {
    // This is for Redirects (GET)
    if (query.paymentStatus !== "SUCCESS") {
      return false;
    }
    return true; 
  }

  /**
   * Universal status check for a session
   * GET /v3/payment/sessions/{transactionId}
   */
  async checkStatus(transactionId, config = {}) {
     const settings = await this.getSettings(config.restaurantId);
     const isTestMode = settings.testMode !== undefined ? settings.testMode : true;
     const apiBase = isTestMode ? "https://test-api.kashier.io/v3" : "https://api.kashier.io/v3";

     try {
       const response = await fetch(`${apiBase}/payment/sessions/${transactionId}`, {
         method: "GET",
         headers: {
           "api-key": settings.apiKey,
           "Authorization": settings.iframeSecret
         }
       });

       const data = await response.json();
       if (!response.ok) return null;
       
       return this.normalizeCallback(data);
     } catch (error) {
       console.error(`[Kashier] Status check failed for ${transactionId}:`, error);
       return null;
     }
  }

  /**
   * Verify Webhook Signature (POST)
   */
  verifyWebhook(body, headers, config = {}) {
    const { data } = body;
    if (!data || !data.signatureKeys) return false;

    try {
      // 1. Sort signature keys alphabetically
      const signatureKeys = [...data.signatureKeys].sort();
      
      // 2. Pick values from data object using sorted keys
      const objectSignaturePayload = {};
      signatureKeys.forEach(key => {
        objectSignaturePayload[key] = data[key];
      });

      // 3. Stringify to query string format
      const signaturePayload = queryString.stringify(objectSignaturePayload);
      
      // 4. Calculate HMAC-SHA256 using API Key (not Secret Key, per docs)
      const expectedSignature = crypto
        .createHmac("sha256", config.apiKey || this.apiKey)
        .update(signaturePayload)
        .digest("hex");

      const kashierSignature = headers["x-kashier-signature"];
      return kashierSignature === expectedSignature;
    } catch (error) {
      console.error("[Kashier] Webhook verification error:", error);
      return false;
    }
  }

  normalizeCallback(payload) {
    // Handle both Webhook (payload.data) and Redirect (payload query) structures
    const data = payload.data || payload;
    
    return {
      transactionId: data.merchantOrderId || data.order || data.orderId,
      status: (data.status === "SUCCESS" || data.status === "SUCCESSFUL") ? "SUCCESS" : "FAILED",
      amount: parseFloat(data.amount),
      currency: data.currency,
      providerTransactionId: data.transactionId || data.kashierOrderId || data._id,
      raw: payload
    };
  }


  async getSettings(restaurantId) {
    if (!restaurantId) {
      // Fallback to global env if no restaurantId provided
      return {
        merchantId: process.env.KASHIER_MERCHANT_ID,
        apiKey: process.env.KASHIER_API_KEY,
        iframeSecret: process.env.KASHIER_IFRAME_SECRET,
        testMode: process.env.KASHIER_TEST_MODE === "true"
      };
    }

    const restaurant = await prisma.restaurant.findUnique({
      where: { id: requireUuid(restaurantId) || "" },
    });
    const settings = restaurant?.settings?.paymentGateways?.kashier;

    if (!settings) {
      throw new Error(`Kashier settings not found for restaurant ${restaurantId}`);
    }

    return {
      merchantId: settings.merchantId,
      iframeSecret: settings.iframeSecret,
      apiKey: settings.apiKey,
      testMode: settings.testMode,
    };
  }


}

export default new KashierProvider();
