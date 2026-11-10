import React from "react";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Package,
  BarChart3,
  Users,
  Clock,
  ShieldCheck,
} from "lucide-react";

const Features = () => {
  const { t } = useTranslation();

  const features = [
    {
      title: t("landing.feature_pos_title") || "Smart POS System",
      desc:
        t("landing.feature_pos_desc") ||
        "Fast, intuitive point of sale that works offline and syncs automatically.",
      icon: <ShoppingCart className="w-8 h-8 text-amber-500" />,
    },
    {
      title: t("landing.feature_inventory_title") || "Inventory Control",
      desc:
        t("landing.feature_inventory_desc") ||
        "Real-time stock tracking with automated low-stock alerts and reordering.",
      icon: <Package className="w-8 h-8 text-blue-500" />,
    },
    {
      title: t("landing.feature_analytics_title") || "Advanced Analytics",
      desc:
        t("landing.feature_analytics_desc") ||
        "Deep diver into sales trends, staff performance, and profitability reports.",
      icon: <BarChart3 className="w-8 h-8 text-purple-500" />,
    },
    {
      title: t("landing.feature_staff_title") || "Team Management",
      desc:
        t("landing.feature_staff_desc") ||
        "Effortless scheduling, payroll calculation, and role-based access control.",
      icon: <Users className="w-8 h-8 text-green-500" />,
    },
    {
      title: t("landing.feature_cloud_title") || "Always On",
      desc:
        t("landing.feature_cloud_desc") ||
        "Cloud-based reliability ensures your business runs smoothly 24/7.",
      icon: <Clock className="w-8 h-8 text-red-500" />,
    },
    {
      title: t("landing.feature_security_title") || "Enterprise Security",
      desc:
        t("landing.feature_security_desc") ||
        "Bank-grade encryption and regular backups to keep your data safe.",
      icon: <ShieldCheck className="w-8 h-8 text-indigo-500" />,
    },
  ];

  return (
    <section id="features" className="py-24 bg-[var(--bg-base)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-20">
          <h2 className="text-base font-semibold text-[var(--primary)] tracking-wide uppercase mb-2">
            Features
          </h2>
          <h2 className="text-4xl font-extrabold text-[var(--text-primary)] mb-6">
            {t("landing.why_choose_us") ||
              "Everything You Need to Run a Restaurant"}
          </h2>
          <p className="text-xl text-[var(--text-secondary)] max-w-3xl mx-auto leading-relaxed">
            {t("landing.features_subtitle") ||
              "Our ERP suite replaces disconnected tools with a single, powerful operating system for your hospitality business."}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => (
            <div
              key={index}
              className="group p-8 bg-[var(--bg-card)] rounded-2xl border border-[var(--border-color)] hover:border-[var(--primary)] hover:shadow-xl hover:shadow-amber-500/10 transition-all duration-300"
            >
              <div className="mb-6 p-4 rounded-xl bg-[var(--bg-base)] w-fit group-hover:scale-110 transition-transform duration-300 border border-[var(--border-color)]">
                {feature.icon}
              </div>
              <h3 className="text-xl font-bold mb-3 text-[var(--text-primary)] group-hover:text-[var(--primary)] transition-colors">
                {feature.title}
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed">
                {feature.desc}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Features;
