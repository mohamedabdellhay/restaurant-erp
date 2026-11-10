import React, { useEffect, useState } from "react";
import { subscriptionService } from "../../services/subscriptionService";
import { useTranslation } from "react-i18next";
import { Check } from "lucide-react";

const Pricing = ({ onSelectPlan }) => {
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { t } = useTranslation();

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        const data = await subscriptionService.getPlans();
        setPlans(Array.isArray(data) ? data : data.data || []);
      } catch (err) {
        setError("Failed to load plans");
      } finally {
        setLoading(false);
      }
    };

    fetchPlans();
  }, []);

  if (loading)
    return (
      <div className="py-24 text-center text-lg text-(--text-secondary) animate-pulse">
        Loading plans...
      </div>
    );
  if (error)
    return <div className="py-24 text-center text-red-500">{error}</div>;

  return (
    <section id="pricing" className="py-24 relative overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10">
        <div className="text-center mb-20">
          <h2 className="text-4xl font-extrabold text-(--text-primary) mb-6">
            {t("landing.pricing_title") || "Simple, Transparent Pricing"}
          </h2>
          <p className="text-xl text-(--text-secondary) max-w-2xl mx-auto">
            {t("landing.pricing_subtitle") ||
              "Start with a plan that fits your needs. Upgrade as you grow."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`flex flex-col p-8 rounded-3xl transition-all duration-300 ${
                plan.name === "Premium"
                  ? "bg-(--bg-card) border-2 border-(--primary) shadow-2xl scale-105 z-10"
                  : "bg-(--bg-card) border border-(--border-color) hover:border-(--text-muted) hover:shadow-lg"
              }`}
            >
              {plan.name === "Premium" && (
                <div className="mb-4">
                  <span className="inline-block bg-(--primary) text-white text-xs font-bold px-3 py-1 rounded-full tracking-wide">
                    {t("landing.most_popular")}
                  </span>
                </div>
              )}

              <h3 className="text-2xl font-bold mb-2 text-(--text-primary)">
                {plan.name}
              </h3>
              <div className="flex items-baseline mb-8">
                <span className="text-5xl font-extrabold text-(--text-primary) tracking-tight">
                  {plan.price}
                  {t("landing.currency")}
                </span>
                <span className="text-lg text-(--text-secondary) ml-2">
                  /{t("common.month")}
                </span>
              </div>

              <div className="flex-1">
                <ul className="space-y-4 mb-8">
                  {(() => {
                    let features = [];
                    if (Array.isArray(plan.features)) {
                      features = plan.features;
                    } else if (typeof plan.features === "string") {
                      try {
                        features = JSON.parse(plan.features);
                      } catch (e) {
                        features = plan.features
                          .split(",")
                          .map((f) => f.trim());
                      }
                    }

                    return features.map((feature, idx) => (
                      <li
                        key={idx}
                        className="flex items-start text-(--text-secondary)"
                      >
                        <Check className="w-5 h-5 text-green-500 mr-3 rtl:ml-3 rtl:mr-0 mt-0.5 flex-shrink-0" />
                        <span className="text-base">
                          {t(`features.${feature.trim()}`) || feature}
                        </span>
                      </li>
                    ));
                  })()}
                </ul>
              </div>

              <button
                onClick={() => onSelectPlan(plan)}
                className={`w-full py-4 rounded-xl font-bold text-lg transition-all transform hover:scale-[1.02] ${
                  plan.name === "Premium"
                    ? "btn-primary shadow-lg shadow-amber-500/20"
                    : "bg-(--input-bg) hover:bg-(--border-color) text-(--text-primary)"
                }`}
              >
                {t("landing.select_plan") || `Choose ${plan.name}`}
              </button>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Pricing;
