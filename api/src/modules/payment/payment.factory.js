import AppError from "../../utils/errors/AppError.js";
import KashierProvider from "./providers/kashier.provider.js";

class PaymentFactory {
  static getProvider(name) {
    const providerStr = name.toLowerCase();
    switch (providerStr) {
      case "kashier":
        return KashierProvider;
      // Add 'stripe', 'paymob', etc later
      default:
        throw new AppError(`Payment provider ${providerStr} not supported`, 400);
    }
  }

  static getAvailableProviders() {
    return ["kashier"];
  }
}

export default PaymentFactory;
