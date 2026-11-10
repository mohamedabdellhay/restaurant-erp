import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { X, UserPlus, Save, Phone, Mail, MapPin, User } from "lucide-react";
import customerService from "../services/customerService";

const CustomerModal = ({
  isOpen,
  onClose,
  onCustomerCreated,
  initialData = {},
}) => {
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState({ type: "", text: "" });

  const [formData, setFormData] = useState({
    name: initialData.name || "",
    phone: initialData.phone || "",
    email: initialData.email || "",
    address: initialData.address || "",
  });

  // Auto-hide message after 3 seconds
  React.useEffect(() => {
    if (message.text) {
      const timer = setTimeout(() => {
        setMessage({ type: "", text: "" });
      }, 3000);

      return () => clearTimeout(timer);
    }
  }, [message]);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (!formData.name.trim()) {
      setMessage({ type: "error", text: "Customer name is required" });
      return;
    }

    if (!formData.phone.trim()) {
      setMessage({ type: "error", text: "Phone number is required" });
      return;
    }

    // Phone validation (basic)
    const phoneRegex = /^[\d\s\-\+\(\)]+$/;
    if (!phoneRegex.test(formData.phone)) {
      setMessage({ type: "error", text: "Please enter a valid phone number" });
      return;
    }

    // Email validation (if provided)
    if (formData.email && formData.email.trim()) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(formData.email)) {
        setMessage({
          type: "error",
          text: "Please enter a valid email address",
        });
        return;
      }
    }

    setLoading(true);
    try {
      const response = await customerService.create(formData);
      const newCustomer = response.data || response;

      setMessage({ type: "success", text: "Customer created successfully!" });

      // Reset form
      setFormData({
        name: "",
        phone: "",
        email: "",
        address: "",
      });

      // Call callback with new customer data
      if (onCustomerCreated) {
        onCustomerCreated(newCustomer);
      }

      // Close modal after a short delay
      setTimeout(() => {
        onClose();
      }, 1500);
    } catch (error) {
      setMessage({
        type: "error",
        text: error.response?.data?.message || "Failed to create customer",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    setFormData({
      name: "",
      phone: "",
      email: "",
      address: "",
    });
    setMessage({ type: "", text: "" });
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="customer-modal-overlay" data-direction={i18n.dir()}>
      <div className="customer-modal">
        <div className="customer-modal-header">
          <h2>
            <UserPlus size={20} />
            {t("nav.customers_add_new_customer") || "Add New Customer"}
          </h2>
          <button onClick={handleClose} className="btn-close">
            <X size={20} />
          </button>
        </div>

        {message.text && (
          <div className={`message ${message.type}`}>{message.text}</div>
        )}

        <form onSubmit={handleSubmit} className="customer-form">
          <div className="form-grid">
            <div className="form-group">
              <label htmlFor="name">
                <User size={16} />
                {t("nav.customers_name") || "Customer Name"} *
              </label>
              <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                placeholder={
                  t("nav.customers_name_placeholder") || "Enter customer name"
                }
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="phone">
                <Phone size={16} />
                {t("nav.customers_phone") || "Phone Number"} *
              </label>
              <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                placeholder={
                  t("nav.customers_phone_placeholder") || "Enter phone number"
                }
                required
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="email">
                <Mail size={16} />
                {t("nav.customers_email") || "Email Address"}
              </label>
              <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                placeholder={
                  t("nav.customers_email_placeholder") ||
                  "Enter email address (optional)"
                }
                className="form-input"
              />
            </div>

            <div className="form-group">
              <label htmlFor="address">
                <MapPin size={16} />
                {t("nav.customers_address") || "Address"}
              </label>
              <input
                type="text"
                id="address"
                name="address"
                value={formData.address}
                onChange={handleChange}
                placeholder={
                  t("nav.customers_address_placeholder") ||
                  "Enter address (optional)"
                }
                className="form-input"
              />
            </div>
          </div>

          <div className="form-actions">
            <button
              type="button"
              onClick={handleClose}
              className="btn-secondary"
              disabled={loading}
            >
              {t("common.cancel") || "Cancel"}
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? (
                <>
                  <div className="spinner" />
                  {t("common.creating") || "Creating..."}
                </>
              ) : (
                <>
                  <Save size={16} />
                  {t("common.create") || "Create Customer"}
                </>
              )}
            </button>
          </div>
        </form>
      </div>

      <style>{`
        .customer-modal-overlay {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: rgba(0, 0, 0, 0.5);
          display: flex;
          align-items: center;
          justify-content: center;
          z-index: 1000;
          padding: 1rem;
        }

        .customer-modal {
          background: var(--bg-card);
          border-radius: var(--radius-lg);
          width: 100%;
          max-width: 500px;
          max-height: 90vh;
          overflow-y: auto;
          box-shadow: var(--shadow-lg);
        }

        .customer-modal-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 1.5rem;
          border-bottom: 1px solid var(--border-color);
        }

        .customer-modal-header h2 {
          display: flex;
          align-items: center;
          gap: 0.75rem;
          margin: 0;
          color: var(--text-primary);
          font-size: 1.25rem;
          font-weight: 600;
        }

        .btn-close {
          display: flex;
          align-items: center;
          justify-content: center;
          width: 36px;
          height: 36px;
          border: none;
          background: var(--bg-base);
          color: var(--text-secondary);
          border-radius: var(--radius-sm);
          cursor: pointer;
          transition: all 0.2s;
        }

        .btn-close:hover {
          background: var(--error);
          color: white;
          transform: scale(1.05);
        }

        .customer-form {
          padding: 1.5rem;
        }

        .form-grid {
          display: grid;
          grid-template-columns: 1fr;
          gap: 1rem;
          margin-bottom: 1.5rem;
        }

        .form-group {
          display: flex;
          flex-direction: column;
        }

        .form-group label {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          margin-bottom: 0.5rem;
          font-weight: 500;
          color: var(--text-primary);
          font-size: 0.875rem;
        }

        .form-input {
          padding: 0.75rem;
          border: 1px solid var(--border-color);
          border-radius: var(--radius-md);
          background: var(--bg-base);
          color: var(--text-primary);
          font-size: 0.875rem;
          transition: all 0.2s;
        }

        .form-input:focus {
          outline: none;
          border-color: var(--primary);
          box-shadow: 0 0 0 3px rgba(245, 158, 11, 0.1);
        }

        .form-input::placeholder {
          color: var(--text-muted);
        }

        .form-actions {
          display: flex;
          gap: 1rem;
          justify-content: flex-end;
          margin-top: 1.5rem;
        }

        .btn-primary,
        .btn-secondary {
          padding: 0.75rem 1.5rem;
          border: none;
          border-radius: var(--radius-md);
          font-weight: 500;
          cursor: pointer;
          transition: all 0.2s;
          display: flex;
          align-items: center;
          gap: 0.5rem;
          font-size: 0.875rem;
        }

        .btn-primary {
          background: var(--primary);
          color: white;
        }

        .btn-primary:hover:not(:disabled) {
          background: var(--primary-focus);
          transform: translateY(-1px);
        }

        .btn-primary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .btn-secondary {
          background: var(--bg-base);
          color: var(--text-secondary);
          border: 1px solid var(--border-color);
        }

        .btn-secondary:hover:not(:disabled) {
          background: var(--bg-card);
          color: var(--text-primary);
        }

        .btn-secondary:disabled {
          opacity: 0.6;
          cursor: not-allowed;
        }

        .message {
          padding: 0.75rem 1rem;
          border-radius: var(--radius-md);
          margin: 1rem 1.5rem;
          font-weight: 500;
          font-size: 0.875rem;
        }

        .message.success {
          background: var(--success);
          color: white;
        }

        .message.error {
          background: var(--error);
          color: white;
        }

        .message.warning {
          background: var(--warning);
          color: white;
        }

        .message.info {
          background: var(--primary);
          color: white;
        }

        .spinner {
          width: 16px;
          height: 16px;
          border: 2px solid transparent;
          border-top: 2px solid currentColor;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }

        [data-direction="rtl"] .form-actions {
          flex-direction: row-reverse;
        }

        [data-direction="rtl"] .customer-modal-header h2 {
          flex-direction: row-reverse;
        }

        [data-direction="rtl"] .form-group label {
          flex-direction: row-reverse;
        }

        @media (max-width: 640px) {
          .customer-modal-overlay {
            padding: 0.5rem;
          }

          .customer-modal {
            max-width: 100%;
          }

          .form-actions {
            flex-direction: column;
          }

          .btn-primary,
          .btn-secondary {
            width: 100%;
            justify-content: center;
          }

          [data-direction="rtl"] .form-actions {
            flex-direction: column;
          }
        }
      `}</style>
    </div>
  );
};

export default CustomerModal;
