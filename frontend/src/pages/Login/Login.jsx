import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Eye, EyeOff, Lock, Mail, Utensils } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useAuth } from "@hooks/useAuth";
import Alert from "@components/Alert";
import "./Login.css";

const Login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const { login, error, loading } = useAuth();
  const navigate = useNavigate();
  const { t, i18n } = useTranslation();

  const handleSubmit = async (event) => {
    event.preventDefault();
    const success = await login(email, password);
    if (success) {
      const stored = JSON.parse(localStorage.getItem("user") || "{}");
      navigate(stored.isPlatformOwner ? "/platform/overview" : "/dashboard");
    }
  };

  const toggleLanguage = () => {
    i18n.changeLanguage(i18n.language === "en" ? "ar" : "en");
  };

  return (
    <main className="login-page">
      <section className="login-brand">
        <div className="login-mark" aria-hidden="true">
          <Utensils size={28} />
        </div>
        <h1>{t("auth.login_title")}</h1>
        <p>{t("auth.login_subtitle")}</p>
      </section>

      <section className="login-panel">
        <button type="button" className="login-lang" onClick={toggleLanguage}>
          {i18n.language === "en" ? "AR" : "EN"}
        </button>

        <h2>{t("auth.sign_in")}</h2>
        <Alert type="error" message={error} />

        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">{t("auth.email_label")}</label>
            <div className="input-wrapper">
              <Mail className="input-icon" size={18} aria-hidden="true" />
              <input
                id="email"
                type="email"
                className="input-field"
                placeholder="admin@restaurant.com"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                autoComplete="email"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">{t("auth.password_label")}</label>
            <div className="input-wrapper">
              <Lock className="input-icon" size={18} aria-hidden="true" />
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                className="input-field"
                placeholder="••••••••"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                autoComplete="current-password"
                required
              />
              <button
                type="button"
                className="password-toggle"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? t("auth.hide_password") : t("auth.show_password")}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <button type="submit" className="login-submit" disabled={loading}>
            {loading ? t("auth.logging_in") : t("auth.sign_in")}
          </button>
        </form>

        <p className="login-footer">
          {t("auth.forgot_password")}{" "}
          <a href="#">{t("auth.contact_support")}</a>
        </p>
      </section>
    </main>
  );
};

export default Login;
