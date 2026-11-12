import React, { useState, useEffect, useRef } from "react";
import "./Settings.css";
import { useRestaurant } from "@hooks/useRestaurant";
import { useTheme } from "@hooks/useTheme";
import { useTranslation } from "react-i18next";
import restaurantService from "@services/restaurantService";
import paymentService from "@services/paymentService";
import {
  Save,
  Upload,
  Palette,
  Clock,
  Phone,
  Mail,
  Globe,
  DollarSign,
  Building,
  Hash,
  Share2,
  X,
  Check,
  Moon,
  Sun,
  RotateCcw,
  CreditCard,
  Lock,
  Shield,
  Settings as SettingsIcon,
  Eye,
  EyeOff,
} from "lucide-react";
import { presetThemes } from "@utils/demoTheme";
import PageHeader from "@components/PageHeader";
import Alert from "@components/Alert";

const Settings = () => {
  const { getRestaurantData, getRestaurantId } = useRestaurant();
  const { theme, toggleTheme, updateRestaurantSettings } = useTheme();
  const { t } = useTranslation();

  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });
  const [uploadingLogo, setUploadingLogo] = useState(false);
  const [logoPreview, setLogoPreview] = useState("");
  const [supportedGateways, setSupportedGateways] = useState([]);
  const [activeProvider, setActiveProvider] = useState("kashier");
  const [gatewaysLoading, setGatewaysLoading] = useState(false);
  const [paymentSettings, setPaymentSettings] = useState({
    merchantId: "",
    apiKey: "",
    iframeSecret: "",
    testMode: true,
  });
  const [loadingPayment, setLoadingPayment] = useState(false);
  const [uploadingGatewayLogo, setUploadingGatewayLogo] = useState(false);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showSecret, setShowSecret] = useState(false);
  const themeSaveTimer = useRef(null);

  // Initialize form with restaurant data
  const restaurantData = getRestaurantData();
  const [formData, setFormData] = useState(restaurantData);

  // Check if current theme matches any preset
  const getCurrentPresetTheme = () => {
    if (!formData.settings?.theme) return null;

    const currentTheme = formData.settings.theme;
    return presetThemes.findIndex(
      (preset) =>
        preset.theme.primaryColor === currentTheme.primaryColor &&
        preset.theme.secondaryColor === currentTheme.secondaryColor &&
        preset.theme.accentColor === currentTheme.accentColor,
    );
  };

  const currentPresetIndex = getCurrentPresetTheme();

  useEffect(() => {
    if (restaurantData?.settings?.theme?.logo) {
      setLogoPreview(restaurantData.settings.theme.logo);
    }
  }, [restaurantData?.settings?.theme?.logo]);

  useEffect(() => {
    fetchSupportedGateways();
    fetchPaymentSettings("kashier");
  }, []);

  const fetchSupportedGateways = async () => {
    try {
      setGatewaysLoading(true);
      const response = await paymentService.getSupportedGateways();
      if (response.success) {
        setSupportedGateways(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch supported gateways:", error);
    } finally {
      setGatewaysLoading(false);
    }
  };

  const fetchPaymentSettings = async (provider) => {
    try {
      setLoadingPayment(true);
      const response = await paymentService.getGatewaySettings(provider);
      // Map API snake_case to frontend camelCase
      const data = response.data || response;
      setPaymentSettings({
        merchantId: data.merchant_id || data.merchantId || "",
        apiKey: data.api_key || data.apiKey || "",
        iframeSecret: data.iframe_secret || data.iframeSecret || "",
        testMode: data.test_mode !== undefined ? data.test_mode : (data.testMode !== undefined ? data.testMode : true),
      });
    } catch (error) {
      console.error(`Failed to fetch ${provider} settings:`, error);
    } finally {
      setLoadingPayment(false);
    }
  };

  const handleProviderChange = (provider) => {
    setActiveProvider(provider);
    fetchPaymentSettings(provider);
  };

  const handleGatewaySettingsUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await paymentService.updateGatewaySettings(
        activeProvider,
        paymentSettings,
      );
      if (response.success) {
        setMessage({
          type: "success",
          text: t("settings.payment_updated"),
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("settings.update_failed"),
      });
    } finally {
      setSaving(false);
    }
  };

  const handleGatewayLogoUpload = async (e, provider) => {
    const file = e.target.files[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: t("settings.invalid_file_type"),
      });
      return;
    }

    // Validate file size (max 2MB as per guide)
    if (file.size > 2 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: t("settings.file_size_limit"),
      });
      return;
    }

    setUploadingGatewayLogo(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await paymentService.uploadGatewayLogo(provider, file);

      if (response.success || response.data?.logo) {
        // Refresh supported gateways to show new logo
        fetchSupportedGateways();

        setMessage({
          type: "success",
          text: t("settings.payment_updated"),
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      }
    } catch (error) {
      console.error("Gateway logo upload error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("settings.upload_failed"),
      });
    } finally {
      setUploadingGatewayLogo(false);
    }
  };

  const handleInputChange = (section, field, value) => {
    if (section) {
      setFormData((prev) => ({
        ...prev,
        [section]: {
          ...prev[section],
          [field]: value,
        },
      }));
    } else {
      setFormData((prev) => ({
        ...prev,
        [field]: value,
      }));
    }
  };

  const applyTheme = (newSettings, saveNow = false) => {
    setFormData((prev) => ({
      ...prev,
      settings: newSettings,
    }));
    updateRestaurantSettings(newSettings);

    const restaurantId = getRestaurantId();
    const nextTheme = newSettings?.theme;
    if (!restaurantId || !nextTheme) return;

    const payload = {
      primaryColor: nextTheme.primaryColor,
      secondaryColor: nextTheme.secondaryColor,
      accentColor: nextTheme.accentColor,
      mode: nextTheme.mode || theme,
    };
    if (nextTheme.logo) payload.logo = nextTheme.logo;

    const send = () => {
      restaurantService.updateTheme(restaurantId, payload).catch((error) => {
        setMessage({
          type: "error",
          text: error.response?.data?.message || t("settings.update_failed"),
        });
      });
    };

    clearTimeout(themeSaveTimer.current);
    if (saveNow) {
      send();
      return;
    }
    themeSaveTimer.current = setTimeout(send, 400);
  };

  const handleThemeColorChange = (colorType, value) => {
    applyTheme({
      ...formData.settings,
      theme: {
        ...formData.settings.theme,
        [colorType]: value,
      },
    });
  };

  const handlePresetThemeSelect = (presetTheme) => {
    applyTheme(
      {
        ...formData.settings,
        theme: {
          ...formData.settings.theme,
          ...presetTheme.theme,
        },
      },
      true,
    );
  };

  const handleResetToDefault = () => {
    applyTheme(
      {
        ...formData.settings,
        theme: {
          ...formData.settings.theme,
          primaryColor: "#f59e0b",
          secondaryColor: "#6366f1",
          accentColor: "#10b981",
          mode: "light",
        },
      },
      true,
    );
    if (theme !== "light") toggleTheme();
  };

  const handleAppearanceMode = (mode) => {
    if (theme !== mode) toggleTheme();
    applyTheme(
      {
        ...formData.settings,
        theme: {
          ...formData.settings.theme,
          mode,
        },
      },
      true,
    );
  };

  const handleLogoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const restaurantId = getRestaurantId();

    // Validate file type
    if (!file.type.startsWith("image/")) {
      setMessage({
        type: "error",
        text: t("settings.invalid_file_type"),
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      setMessage({
        type: "error",
        text: t("settings.file_size_limit"),
      });
      return;
    }

    setUploadingLogo(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await restaurantService.uploadLogo(restaurantId, file);

      if (response.success || response.logo) {
        let newLogoUrl = response.logo || response.data?.logo;

        console.log("Backend returned logo URL:", newLogoUrl);

        // Clean up any malformed URLs with duplicate base URLs
        if (
          newLogoUrl &&
          newLogoUrl.includes("http://localhost:3000http://localhost:3000")
        ) {
          // Extract just the path part after all the duplicates
          const match = newLogoUrl.match(/\/uploads\/.*$/);
          if (match) {
            newLogoUrl = match[0];
            console.log("Cleaned malformed URL to:", newLogoUrl);
          }
        }

        // If URL is relative, construct full URL
        if (newLogoUrl && !newLogoUrl.startsWith("http")) {
          // If it starts with /, it's already a proper path from root
          if (newLogoUrl.startsWith("/")) {
            newLogoUrl = `http://localhost:3000${newLogoUrl}`;
          } else {
            // If it doesn't start with /, add both / and base URL
            newLogoUrl = `http://localhost:3000/${newLogoUrl}`;
          }
        }

        console.log("Final logo URL:", newLogoUrl);

        setLogoPreview(newLogoUrl);

        // Update form data with new logo
        setFormData((prev) => ({
          ...prev,
          settings: {
            ...prev.settings,
            theme: {
              ...prev.settings.theme,
              logo: newLogoUrl,
            },
          },
        }));

        // Update local storage with new theme settings
        localStorage.setItem(
          "restaurantSettings",
          JSON.stringify({
            ...formData.settings,
            theme: {
              ...formData.settings.theme,
              logo: newLogoUrl,
            },
          }),
        );

        // Trigger theme update
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "restaurantSettings",
            newValue: JSON.stringify({
              ...formData.settings,
              theme: {
                ...formData.settings.theme,
                logo: newLogoUrl,
              },
            }),
          }),
        );

        setMessage({
          type: "success",
          text: t("settings.logo_uploaded_success"),
        });
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
      } else {
        setMessage({
          type: "error",
          text: response.message || t("settings.upload_failed"),
        });
      }
    } catch (error) {
      console.error("Logo upload error:", error);
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("settings.upload_failed"),
      });
    } finally {
      setUploadingLogo(false);
      // Reset file input
      e.target.value = "";
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const restaurantId = getRestaurantId();

    if (!restaurantId) {
      setMessage({
        type: "error",
        text: t("settings.restaurant_id_not_found"),
      });
      return;
    }

    setSaving(true);
    setMessage({ type: "", text: "" });

    try {
      const response = await restaurantService.updateRestaurant(
        restaurantId,
        formData,
      );

      if (response.success) {
        setMessage({ type: "success", text: t("settings.settings_updated") });

        // Update local storage with new theme settings
        localStorage.setItem(
          "restaurantSettings",
          JSON.stringify(formData.settings),
        );

        // Trigger theme update
        window.dispatchEvent(
          new StorageEvent("storage", {
            key: "restaurantSettings",
            newValue: JSON.stringify(formData.settings),
          }),
        );

        // Clear message after 3 seconds
        setTimeout(() => setMessage({ type: "", text: "" }), 3000);
        window.location.reload();
      }
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || t("settings.update_failed"),
      });
    } finally {
      setSaving(false);
    }
  };

  const currencies = ["USD", "EUR", "GBP", "EGP", "SAR", "AED", "JOD", "LBP"];
  const days = [
    "monday",
    "tuesday",
    "wednesday",
    "thursday",
    "friday",
    "saturday",
    "sunday",
  ];

  return (
    <div>
      <PageHeader
        icon={SettingsIcon}
        title={t("settings.title")}
        subtitle={t("settings.subtitle")}
      />

      <Alert type={message.type} message={message.text} />

      <form onSubmit={handleSubmit} className="settings-form">
        {/* Basic Information */}
        <div className="settings-section">
          <h2>
            <Building size={20} /> {t("settings.basic_info")}
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t("settings.restaurant_name")}</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) =>
                  handleInputChange(null, "name", e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>{t("settings.address")}</label>
              <input
                type="text"
                value={formData.address}
                onChange={(e) =>
                  handleInputChange(null, "address", e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Phone size={16} /> {t("settings.phone")}
              </label>
              <input
                type="tel"
                value={formData.phone}
                onChange={(e) =>
                  handleInputChange(null, "phone", e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Mail size={16} /> {t("settings.email")}
              </label>
              <input
                type="email"
                value={formData.email}
                onChange={(e) =>
                  handleInputChange(null, "email", e.target.value)
                }
                required
              />
            </div>
            <div className="form-group">
              <label>
                <Globe size={16} /> {t("settings.website")}
              </label>
              <input
                type="url"
                value={formData.website}
                onChange={(e) =>
                  handleInputChange(null, "website", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>
                <DollarSign size={16} /> {t("settings.currency")}
              </label>
              <select
                value={formData.currency}
                onChange={(e) =>
                  handleInputChange(null, "currency", e.target.value)
                }
              >
                {currencies.map((currency) => (
                  <option key={currency} value={currency}>
                    {currency}
                  </option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {/* Business Details */}
        <div className="settings-section">
          <h2>
            <Hash size={20} /> {t("settings.business_details")}
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t("settings.vat_number")}</label>
              <input
                type="text"
                value={formData.vatNumber}
                onChange={(e) =>
                  handleInputChange(null, "vatNumber", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>{t("settings.cr_number")}</label>
              <input
                type="text"
                value={formData.crNumber}
                onChange={(e) =>
                  handleInputChange(null, "crNumber", e.target.value)
                }
              />
            </div>
          </div>
        </div>

        {/* Financial Settings */}
        <div className="settings-section">
          <h2>
            <DollarSign size={20} /> {t("settings.financial_settings")}
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t("settings.tax_percent")}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.settings.taxPercent}
                onChange={(e) =>
                  handleInputChange(
                    "settings",
                    "taxPercent",
                    parseFloat(e.target.value),
                  )
                }
              />
            </div>
            <div className="form-group">
              <label>{t("settings.service_charge_percent")}</label>
              <input
                type="number"
                min="0"
                max="100"
                step="0.1"
                value={formData.settings.serviceChargePercent}
                onChange={(e) =>
                  handleInputChange(
                    "settings",
                    "serviceChargePercent",
                    parseFloat(e.target.value),
                  )
                }
              />
            </div>
          </div>
        </div>

        {/* Theme Settings */}
        <div className="settings-section">
          <h2>
            <Palette size={20} /> {t("settings.theme_settings")}
          </h2>
          <div className="theme-settings">
            <div className="theme-upload-section">
              <div className="form-group">
                <label>{t("settings.logo")}</label>
                <div className="logo-upload-wrapper">
                  {/* Hidden file input - always present in DOM */}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    disabled={uploadingLogo}
                    id="logo-upload"
                    style={{ display: "none" }}
                  />

                  <div className="logo-preview-container">
                    {logoPreview ? (
                      <div className="logo-preview-with-controls">
                        <img
                          src={logoPreview}
                          alt="Restaurant Logo"
                          className="logo-preview-image"
                          onError={() => {
                            console.error("Logo preview failed:", logoPreview);
                            setLogoPreview("");
                          }}
                        />
                        <button
                          type="button"
                          className="remove-logo-btn"
                          onClick={() => {
                            setLogoPreview("");
                            setFormData((prev) => ({
                              ...prev,
                              settings: {
                                ...prev.settings,
                                theme: {
                                  ...prev.settings.theme,
                                  logo: "",
                                },
                              },
                            }));
                          }}
                          title={t("settings.remove_logo")}
                        >
                          <X size={16} />
                        </button>
                        <button
                          type="button"
                          className="change-logo-btn"
                          onClick={() =>
                            document.getElementById("logo-upload").click()
                          }
                        >
                          <Upload size={16} />
                          {t("settings.change_logo")}
                        </button>
                      </div>
                    ) : (
                      <div className="logo-upload-area">
                        <label
                          htmlFor="logo-upload"
                          className="upload-area-label"
                        >
                          <Upload size={48} className="upload-icon" />
                          <div className="upload-text">
                            <h4>{t("settings.upload_logo")}</h4>
                            <p>{t("settings.drag_drop")}</p>
                            <small>{t("settings.supported_formats")}</small>
                          </div>
                          <button
                            type="button"
                            className="upload-btn-secondary"
                          >
                            {t("settings.choose_file")}
                          </button>
                        </label>
                      </div>
                    )}

                    {uploadingLogo && (
                      <div className="upload-progress">
                        <div className="spinner-small"></div>
                        <span>{t("settings.uploading")}</span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </div>

            <div className="theme-options">
              <div className="preset-themes">
                <h3>{t("settings.preset_themes")}</h3>
                <div className="presets-grid">
                  {presetThemes.map((preset, index) => (
                    <button
                      key={index}
                      type="button"
                      className={`preset-btn ${currentPresetIndex === index ? "active" : ""}`}
                      onClick={() => handlePresetThemeSelect(preset)}
                      title={preset.name}
                    >
                      <div
                        className="preset-preview"
                        style={{
                          backgroundColor: preset.theme.primaryColor,
                          boxShadow: `inset -18px 0 0 ${preset.theme.secondaryColor}`,
                        }}
                      >
                        <div
                          className="preset-accent-dot"
                          style={{ backgroundColor: preset.theme.accentColor }}
                        ></div>
                        {currentPresetIndex === index && (
                          <div className="preset-selected-indicator">
                            <Check size={16} />
                          </div>
                        )}
                      </div>
                      <span>{preset.name}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div className="color-inputs">
                <div className="form-group">
                  <label>{t("settings.primary_color")}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={formData.settings.theme.primaryColor}
                      onChange={(e) =>
                        handleThemeColorChange("primaryColor", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={formData.settings.theme.primaryColor}
                      onChange={(e) =>
                        handleThemeColorChange("primaryColor", e.target.value)
                      }
                      placeholder="#3498db"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("settings.secondary_color")}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={formData.settings.theme.secondaryColor}
                      onChange={(e) =>
                        handleThemeColorChange("secondaryColor", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={formData.settings.theme.secondaryColor}
                      onChange={(e) =>
                        handleThemeColorChange("secondaryColor", e.target.value)
                      }
                      placeholder="#2ecc71"
                    />
                  </div>
                </div>
                <div className="form-group">
                  <label>{t("settings.accent_color")}</label>
                  <div className="color-input-wrapper">
                    <input
                      type="color"
                      value={formData.settings.theme.accentColor}
                      onChange={(e) =>
                        handleThemeColorChange("accentColor", e.target.value)
                      }
                    />
                    <input
                      type="text"
                      value={formData.settings.theme.accentColor}
                      onChange={(e) =>
                        handleThemeColorChange("accentColor", e.target.value)
                      }
                      placeholder="#e74c3c"
                    />
                  </div>
                </div>
              </div>

              <div className="advanced-theme-settings">
                <div className="form-group">
                  <label>{t("settings.appearance_mode")}</label>
                  <div className="mode-toggle-group">
                    <button
                      type="button"
                      className={`mode-btn ${theme === "light" ? "active" : ""}`}
                      onClick={() => handleAppearanceMode("light")}
                    >
                      <Sun size={18} />
                      {t("settings.light_mode")}
                    </button>
                    <button
                      type="button"
                      className={`mode-btn ${theme === "dark" ? "active" : ""}`}
                      onClick={() => handleAppearanceMode("dark")}
                    >
                      <Moon size={18} />
                      {t("settings.dark_mode")}
                    </button>
                  </div>
                </div>

                <button
                  type="button"
                  className="reset-theme-btn"
                  onClick={handleResetToDefault}
                >
                  <RotateCcw size={16} />
                  {t("settings.reset_theme")}
                </button>
              </div>
            </div>

            <div className="theme-preview">
              <h3>{t("settings.theme_preview")}</h3>
              <div className="preview-colors">
                <div
                  className="preview-card primary"
                  style={{
                    backgroundColor: formData.settings.theme.primaryColor,
                  }}
                >
                  {t("settings.primary_color_desc")}
                </div>
                <div
                  className="preview-card secondary"
                  style={{
                    backgroundColor: formData.settings.theme.secondaryColor,
                  }}
                >
                  {t("settings.secondary_color_desc")}
                </div>
                <div
                  className="preview-card accent"
                  style={{
                    backgroundColor: formData.settings.theme.accentColor,
                  }}
                >
                  {t("settings.accent_color_desc")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Opening Hours */}
        <div className="settings-section">
          <h2>
            <Clock size={20} /> {t("settings.opening_hours")}
          </h2>
          <div className="form-grid">
            {days.map((day) => (
              <div key={day} className="form-group">
                <label className="capitalize">{t(`settings.${day}`)}</label>
                <input
                  type="text"
                  placeholder="e.g., 9:00 AM - 10:00 PM"
                  value={formData.openingHours[day]}
                  onChange={(e) =>
                    handleInputChange("openingHours", day, e.target.value)
                  }
                />
              </div>
            ))}
          </div>
        </div>

        {/* Social Media */}
        <div className="settings-section">
          <h2>
            <Share2 size={20} /> {t("settings.social_media")}
          </h2>
          <div className="form-grid">
            <div className="form-group">
              <label>{t("settings.facebook")}</label>
              <input
                type="url"
                placeholder="https://facebook.com/yourrestaurant"
                value={formData.socialMedia.facebook}
                onChange={(e) =>
                  handleInputChange("socialMedia", "facebook", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>{t("settings.instagram")}</label>
              <input
                type="url"
                placeholder="https://instagram.com/yourrestaurant"
                value={formData.socialMedia.instagram}
                onChange={(e) =>
                  handleInputChange("socialMedia", "instagram", e.target.value)
                }
              />
            </div>
            <div className="form-group">
              <label>{t("settings.twitter")}</label>
              <input
                type="url"
                placeholder="https://twitter.com/yourrestaurant"
                value={formData.socialMedia.twitter}
                onChange={(e) =>
                  handleInputChange("socialMedia", "twitter", e.target.value)
                }
              />
            </div>
          </div>
        </div>

      </form>

      {/* Payment Gateways Section */}
      <div className="settings-section mt-8">
        <h2 className="flex items-center gap-2">
          <CreditCard size={22} className="text-[var(--primary)]" />
          {t("settings.payment_gateways")}
        </h2>
        <p className="section-desc mb-6 text-[var(--text-secondary)] text-sm">
          {t("settings.supported_gateways")}
        </p>

        {gatewaysLoading ? (
          <div className="flex justify-center p-12">
            <div className="spinner-small"></div>
          </div>
        ) : (
          <div className="gateways-grid mb-8">
            {supportedGateways.map((gateway) => (
              <div 
                key={gateway.id} 
                className={`gateway-card ${activeProvider === gateway.id ? 'active' : ''}`}
                onClick={() => handleProviderChange(gateway.id)}
              >
                <div className="gateway-logo-container">
                  {gateway.logo ? (
                    <img src={gateway.logo} alt={gateway.name} className="gateway-logo" />
                  ) : (
                    <div className="gateway-logo-placeholder">
                      <CreditCard size={24} />
                    </div>
                  )}
                  <label className="gateway-logo-upload-overlay" onClick={(e) => e.stopPropagation()}>
                    <input 
                      type="file" 
                      accept="image/*" 
                      onChange={(e) => handleGatewayLogoUpload(e, gateway.id)}
                      className="hidden" 
                    />
                    <Upload size={14} />
                  </label>
                </div>
                <div className="gateway-info">
                  <span className="gateway-name">{gateway.name}</span>
                  {activeProvider === gateway.id && <div className="active-indicator" />}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeProvider && !gatewaysLoading && (
            <div className="relative">
              {loadingPayment && (
                <div className="absolute inset-0 bg-[var(--bg-card)]/60 backdrop-blur-[1px] z-10 flex items-center justify-center rounded-xl">
                  <div className="spinner-small"></div>
                </div>
              )}
              
              <div className="flex items-center justify-between mb-8 pb-4 border-b border-[var(--border-color)]">
                <div>
                  <h3 className="text-xl font-bold flex items-center gap-3 text-[var(--text-primary)]">
                    {t("settings.configure_gateway", { provider: activeProvider.charAt(0).toUpperCase() + activeProvider.slice(1) })}
                  </h3>
                  <p className="text-sm text-[var(--text-secondary)] mt-1">Manage your {activeProvider} credentials and environment.</p>
                </div>
                {supportedGateways.find(g => g.id === activeProvider)?.logo && (
                  <div className="form-gateway-logo-container p-2 bg-white rounded-lg border border-[var(--border-color)] shadow-sm">
                    <img 
                      src={supportedGateways.find(g => g.id === activeProvider).logo} 
                      alt={activeProvider} 
                      className="h-10 w-auto object-contain" 
                    />
                  </div>
                )}
              </div>
            
            <div className="form-grid">
              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Building size={16} /> {t("settings.merchant_id")}
                </label>
                <input
                  type="text"
                  value={paymentSettings.merchantId}
                  onChange={(e) => setPaymentSettings({ ...paymentSettings, merchantId: e.target.value })}
                  placeholder="Merchant ID"
                  className="input-field"
                  required
                />
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Lock size={16} /> {t("settings.api_key")}
                </label>
                <div className="relative">
                  <input
                    type={showApiKey ? "text" : "password"}
                    value={paymentSettings.apiKey}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, apiKey: e.target.value })}
                    placeholder="API Key"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
                <p className="text-xs text-[var(--text-muted)] mt-1">{t("settings.mask_hint")}</p>
              </div>

              <div className="form-group">
                <label className="flex items-center gap-2">
                  <Shield size={16} /> {t("settings.iframe_secret")}
                </label>
                <div className="relative">
                  <input
                    type={showSecret ? "text" : "password"}
                    value={paymentSettings.iframeSecret}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, iframeSecret: e.target.value })}
                    placeholder="IFrame Secret"
                    className="input-field pr-10"
                    required
                  />
                  <button
                    type="button"
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)]"
                    onClick={() => setShowSecret(!showSecret)}
                  >
                    {showSecret ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="form-group flex items-center gap-3 pt-6">
                <label className="flex items-center gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={paymentSettings.testMode}
                    onChange={(e) => setPaymentSettings({ ...paymentSettings, testMode: e.target.checked })}
                    className="w-5 h-5 rounded border-[var(--border-color)] text-[var(--primary)]"
                  />
                  <div>
                    <span className="font-medium text-[var(--text-primary)] block">
                      {t("settings.test_mode")}
                    </span>
                    <span className="text-xs text-[var(--text-secondary)]">
                      {t("settings.test_mode_desc")}
                    </span>
                  </div>
                </label>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-[var(--border-color)] flex justify-end">
              <button
                onClick={handleGatewaySettingsUpdate}
                disabled={saving}
                className="btn-primary flex items-center gap-2 px-8 py-3"
              >
                {saving ? <div className="spinner-xs"></div> : <Save size={18} />}
                {t("settings.save_payment_settings")}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Settings;
