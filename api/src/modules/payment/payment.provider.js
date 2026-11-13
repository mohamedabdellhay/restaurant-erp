/**
 * Base abstract class for Payment Providers
 */
export default class PaymentProvider {
  /**
   * Generates a checkout URL for redirecting the client to the gateway.
   * @param {string} transactionId - Internal ID from the Transaction model
   * @param {number} amount - Transaction amount
   * @param {string} currency - Transaction currency (e.g. EGP)
   * @param {object} customer - Customer details { name, email, phone }
   * @param {string} callbackUrl - Where to redirect after checkout
   * @returns {Promise<string>} The URL to start the checkout
   */
  async getCheckoutUrl(transactionId, amount, currency, customer, callbackUrl) {
    throw new Error("Method 'getCheckoutUrl()' must be implemented.");
  }

  /**
   * Validates the callback parameters to ensure authenticity.
   * @param {object} query - Callback query parameters or body payload
   * @returns {boolean} True if the callback is valid
   */
  validateCallback(query) {
    throw new Error("Method 'validateCallback()' must be implemented.");
  }

  /**
   * Normalizes the callback payload to our system's format.
   * @param {object} query - Raw callback query/body
   * @returns {object} { transactionId, status: "SUCCESS" | "FAILED", amount, currency, providerTransactionId }
   */
  normalizeCallback(query) {
    throw new Error("Method 'normalizeCallback()' must be implemented.");
  }
}
