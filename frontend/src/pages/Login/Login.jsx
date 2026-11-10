import React, { useState } from "react";
import "./Login.css";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@hooks/useAuth";
import { Utensils, Lock, Mail, AlertCircle } from "lucide-react";
import { useTranslation } from "react-i18next";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();

  const handleSubmit = async (e) => {
    e.preventDefault();
    const success = await login(email, password);
    if (success) {
      navigate("/dashboard");
    }
  };

  return (
    <div className="login-container bg-gradient">
      <div className="login-card glass">
        <div className="brand-section">
          <div className="logo-icon">
            <Utensils size={32} color="var(--primary)" />
          </div>
          <h1>{t("auth.login_title")}</h1>
          <p>{t("auth.login_subtitle")}</p>
        </div>

        {error && (
          <div className="error-alert">
            <AlertCircle size={20} />
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">{t("auth.email_label")}</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={20} />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="admin@restaurant.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">{t("auth.password_label")}</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={20} />
              <input
                id="password"
                type="password"
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>

          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? t("auth.logging_in") : t("auth.sign_in")}
          </button>
        </form>

        <div className="login-footer">
          <p>
            {t("auth.forgot_password")}{" "}
            <a href="#">{t("auth.contact_support")}</a>
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
