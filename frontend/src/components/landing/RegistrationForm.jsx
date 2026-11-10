import React, { useState } from "react";
import { subscriptionService } from "../../services/subscriptionService";
import { useTranslation } from "react-i18next";
import { X, Loader2, CheckCircle2, ShieldCheck } from "lucide-react";
import paymentService from "../../services/paymentService";
import { formatMoney } from "../../utils/money";

const RegistrationForm = ({ selectedPlan, onClose }) => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    restaurantName: "",
    restaurantPhone: "",
    restaurantAddress: "",
    adminName: "",
    email: "",
    password: "",
    password_confirmation: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [gateways, setGateways] = useState([]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  React.useEffect(() => {
    const fetchGateways = async () => {
      try {
        const response = await paymentService.getSupportedGateways();
        setGateways(response.data || []);
      } catch (err) {
        console.error("Failed to fetch gateways:", err);
      }
    };
    fetchGateways();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedPlan) return;

    setLoading(true);
    setError("");

    try {
      const payload = {
        ...formData,
        planId: selectedPlan.id,
      };

      const response = await subscriptionService.register(payload);

      if (response && response.data && response.data.checkoutUrl) {
        window.location.href = response.data.checkoutUrl;
      } else {
        setError("Registration successful but no checkout URL returned.");
      }
    } catch (err) {
      setError(err.message || "Registration failed. Please try again.");
      // For development/mocking purposes if API fails
      if (import.meta.env.DEV && err.message?.includes("Failed to fetch")) {
        console.warn("Dev mode: Simulation redirect since API failed");
        // window.location.href = '/payment/success'; // Uncomment to test success flow without backend
      }
    } finally {
      setLoading(false);
    }
  };

  if (!selectedPlan) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-[var(--bg-card)] rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto border border-[var(--border-color)] flex flex-col">
        {/* Header */}
        <div className="p-6 border-b border-[var(--border-color)] flex justify-between items-center sticky top-0 bg-[var(--bg-card)]/95 backdrop-blur z-10">
          <div>
            <h2 className="text-2xl font-bold text-[var(--text-primary)]">
              {t("landing.register_title") || "Setup Your Restaurant"}
            </h2>
            <p className="text-sm text-[var(--text-secondary)] mt-1">
              {t("landing.register_subtitle") ||
                "Create your account to start your subscription."}
            </p>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-[var(--bg-base)] text-[var(--text-secondary)] transition-colors"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-8">
          {/* Plan Summary */}
          <div className="mb-8 bg-[var(--bg-base)] p-5 rounded-xl border border-[var(--border-color)] flex justify-between items-center">
            <div className="flex items-center gap-3">
              <CheckCircle2 className="text-green-500" size={24} />
              <div>
                <span className="text-sm font-medium text-[var(--text-secondary)] block uppercase tracking-wider">
                  {t("landing.selected_plan") || "Selected Plan"}
                </span>
                <p className="font-bold text-[var(--text-primary)] text-lg">
                  {selectedPlan.name}
                </p>
              </div>
            </div>
            <div className="text-right">
              <p className="font-extrabold text-2xl text-[var(--primary)]">
                {formatMoney(selectedPlan.price, "EGP")}
              </p>
              <span className="text-sm text-[var(--text-secondary)]">/mo</span>
            </div>
          </div>

          {error && (
            <div className="mb-6 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-600 dark:text-red-400 px-4 py-3 rounded-lg text-sm font-medium">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Restaurant Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                {t("landing.restaurant_details") || "Restaurant Details"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.restaurant_name") || "Restaurant Name"}
                  </label>
                  <input
                    type="text"
                    name="restaurantName"
                    required
                    className="input-field"
                    placeholder="e.g. Tasty Bites"
                    value={formData.restaurantName}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.phone") || "Phone Number"}
                  </label>
                  <input
                    type="tel"
                    name="restaurantPhone"
                    required
                    className="input-field"
                    placeholder="+1 (555) 000-0000"
                    value={formData.restaurantPhone}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.address") || "Address"}
                  </label>
                  <input
                    type="text"
                    name="restaurantAddress"
                    required
                    className="input-field"
                    placeholder="123 Main St, City"
                    value={formData.restaurantAddress}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            {/* Admin Section */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-[var(--text-primary)] border-b border-[var(--border-color)] pb-2">
                {t("landing.admin_details") || "Account & Security"}
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.full_name") || "Admin Full Name"}
                  </label>
                  <input
                    type="text"
                    name="adminName"
                    required
                    className="input-field"
                    placeholder="John Doe"
                    value={formData.adminName}
                    onChange={handleChange}
                  />
                </div>
                <div className="md:col-span-2 space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.email") || "Email Address"}
                  </label>
                  <input
                    type="email"
                    name="email"
                    required
                    className="input-field"
                    placeholder="admin@restaurant.com"
                    value={formData.email}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.password") || "Password"}
                  </label>
                  <input
                    type="password"
                    name="password"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-sm font-medium text-[var(--text-secondary)]">
                    {t("landing.confirm_password") || "Confirm Password"}
                  </label>
                  <input
                    type="password"
                    name="password_confirmation"
                    required
                    className="input-field"
                    placeholder="••••••••"
                    value={formData.password_confirmation}
                    onChange={handleChange}
                  />
                </div>
              </div>
            </div>

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="btn-primary w-full py-4 text-lg font-bold shadow-lg shadow-amber-500/20 flex items-center justify-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="animate-spin" size={24} />
                    {t("common.processing") || "Processing..."}
                  </>
                ) : (
                  t("landing.proceed_payment") || "Proceed to Secure Payment"
                )}
              </button>
              <div className="flex items-center justify-between mb-4 p-4 rounded-xl bg-[var(--bg-base)] border border-[var(--border-color)]">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-600">
                    <ShieldCheck size={20} />
                  </div>
                  <p className="text-xs text-[var(--text-secondary)] leading-tight">
                    {t("landing.secure_notice")}
                  </p>
                </div>
                {gateways.length > 0 && gateways[0].logo && (
                  <img 
                    src={gateways[0].logo} 
                    alt={gateways[0].name} 
                    className="h-6 w-auto object-contain grayscale opacity-60 hover:grayscale-0 hover:opacity-100 transition-all cursor-help" 
                    title={gateways[0].name}
                  />
                )}
              </div>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default RegistrationForm;
