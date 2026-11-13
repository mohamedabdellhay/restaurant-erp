import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import "./PaymentResult.css";

const PaymentResult = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const status = React.useMemo(() => {
    const path = window.location.pathname;
    if (path.includes("success") || searchParams.get("payment") === "success") {
      return "success";
    } else if (
      path.includes("failed") ||
      searchParams.get("payment") === "failed"
    ) {
      return "failed";
    }
    return "failed";
  }, [searchParams]);

  useEffect(() => {
    if (status === "success") {
      const timer = setTimeout(() => {
        navigate("/dashboard");
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [status, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--bg-base)] px-4">
      <div className="card max-w-lg w-full text-center p-10">
        {status === "success" && (
          <div>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-green-100 mb-6">
              <svg
                className="h-10 w-10 text-green-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M5 13l4 4L19 7"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              {t("payment.success_title") || "Payment Successful!"}
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("payment.success_desc") ||
                "Your subscription is now active. Redirecting you to the dashboard..."}
            </p>
            <Link to="/dashboard" className="btn-primary inline-block">
              {t("common.dashboard") || "Go to Dashboard"}
            </Link>
          </div>
        )}

        {status === "failed" && (
          <div>
            <div className="mx-auto flex items-center justify-center h-20 w-20 rounded-full bg-red-100 mb-6">
              <svg
                className="h-10 w-10 text-red-600"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-[var(--text-primary)] mb-4">
              {t("payment.failed_title") || "Payment Failed"}
            </h2>
            <p className="text-[var(--text-secondary)] mb-8">
              {t("payment.failed_desc") ||
                "Something went wrong with the transaction. Please try again."}
            </p>
            <div className="flex justify-center gap-4">
              <Link
                to="/login"
                className="btn-secondary px-6 py-2 rounded-lg border border-[var(--border-color)]"
              >
                {t("common.home") || "Back to Home"}
              </Link>
              <Link to="/login" className="btn-primary no-underline">
                {t("payment.retry") || "Try Again"}
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PaymentResult;
