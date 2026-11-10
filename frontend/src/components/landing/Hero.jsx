import React from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";

const Hero = () => {
  const { t } = useTranslation();

  return (
    <>
      <style>{`
        /* Hero Internal CSS */
        .hero-section {
          position: relative;
          padding: 8rem 0 5rem;
          overflow: hidden;
          background: transparent;
        }

        .hero-container {
          max-width: 1200px;
          margin: 0 auto;
          padding: 0 2rem;
          position: relative;
          z-index: 10;
          text-align: center;
        }

        .hero-content {
          max-width: 64rem;
          margin: 0 auto;
        }

        .hero-title {
          font-size: 3.5rem;
          font-weight: 800;
          line-height: 1.1;
          letter-spacing: -0.025em;
          margin-bottom: 2rem;
        }

        .hero-title-line {
          display: block;
        }

        .hero-title-primary {
          color: rgba(255, 255, 255, 0.95);
        }

        .hero-title-gradient {
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          background-clip: text;
          margin-top: 0.5rem;
        }

        .hero-subtitle {
          margin-top: 1.5rem;
          font-size: 1.25rem;
          line-height: 1.6;
          color: rgba(255, 255, 255, 0.8);
          max-width: 32rem;
          margin-left: auto;
          margin-right: auto;
          margin-bottom: 3rem;
        }

        .hero-actions {
          display: flex;
          flex-direction: column;
          gap: 1rem;
          justify-content: center;
          align-items: center;
        }

        .hero-primary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2.5rem;
          border-radius: 0.75rem;
          background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
          color: white;
          text-decoration: none;
          font-weight: 600;
          font-size: 1.125rem;
          box-shadow: 0 10px 25px -5px rgba(245, 158, 11, 0.3);
          transition: all 0.3s ease;
          border: none;
          cursor: pointer;
        }

        .hero-primary-button:hover {
          transform: translateY(-4px);
          box-shadow: 0 20px 40px -10px rgba(245, 158, 11, 0.4);
        }

        .hero-secondary-button {
          display: inline-flex;
          align-items: center;
          justify-content: center;
          padding: 1rem 2.5rem;
          border-radius: 0.75rem;
          background: transparent;
          border: 2px solid rgba(255, 255, 255, 0.3);
          color: rgba(255, 255, 255, 0.95);
          text-decoration: none;
          font-weight: 600;
          font-size: 1.125rem;
          transition: all 0.3s ease;
          cursor: pointer;
        }

        .hero-secondary-button:hover {
          background: rgba(255, 255, 255, 0.1);
          border-color: rgba(255, 255, 255, 0.5);
          transform: translateY(-2px);
        }

        .hero-background {
          position: absolute;
          top: 0;
          left: 50%;
          width: 100%;
          transform: translateX(-50%);
          z-index: -10;
          opacity: 0.4;
          filter: blur(3rem);
          pointer-events: none;
        }

        .hero-background-shape {
          aspect-ratio: 1155/678;
          width: 72.1875rem;
          background: linear-gradient(135deg, rgba(245, 158, 11, 0.3) 0%, rgba(217, 119, 6, 0.3) 100%);
          opacity: 0.4;
          clip-path: polygon(74.1% 44.1%, 100% 61.6%, 97.5% 26.9%, 85.5% 0.1%, 80.7% 2%, 72.5% 32.5%, 60.2% 62.4%, 52.4% 68.1%, 47.5% 58.3%, 45.2% 34.5%, 27.5% 76.7%, 0.1% 64.9%, 17.9% 100%, 27.6% 76.8%, 76.1% 97.7%, 74.1% 44.1%);
        }

        /* Responsive Design */
        @media (min-width: 640px) {
          .hero-section {
            padding: 10rem 0 6rem;
          }

          .hero-title {
            font-size: 4.5rem;
          }

          .hero-subtitle {
            font-size: 1.5rem;
          }

          .hero-actions {
            flex-direction: row;
          }

          .hero-background-shape {
            opacity: 0.5;
          }
        }

        @media (max-width: 640px) {
          .hero-container {
            padding: 0 1rem;
          }

          .hero-title {
            font-size: 2.5rem;
          }

          .hero-subtitle {
            font-size: 1.125rem;
          }

          .hero-primary-button,
          .hero-secondary-button {
            width: 100%;
            max-width: 280px;
          }
        }

        /* RTL Support */
        [dir="rtl"] .hero-title-gradient {
          direction: ltr;
        }

        [dir="rtl"] .hero-subtitle {
          text-align: right;
        }

        [dir="rtl"] .hero-actions {
          flex-direction: column-reverse;
        }

        @media (min-width: 640px) and (dir="rtl") {
          .hero-actions {
            flex-direction: row-reverse;
          }
        }
      `}</style>

      <section className="hero-section">
        <div className="hero-container">
          <div className="hero-content">
            <h1 className="hero-title">
              <span className="hero-title-line hero-title-primary">
                {t("landing.hero_title_1") || "Manage Your Restaurant"}
              </span>
              <span className="hero-title-line hero-title-gradient">
                {t("landing.hero_title_2") || "Like a Pro"}
              </span>
            </h1>
            <p className="hero-subtitle">
              {t("landing.hero_subtitle") ||
                "The all-in-one ERP solution for modern restaurants. Streamline orders, inventory, staff, and analytics in one unified platform."}
            </p>
            <div className="hero-actions">
              <a href="#pricing" className="hero-primary-button">
                {t("landing.start_free_trial") || "Start Free Trial"}
              </a>
              <a href="#features" className="hero-secondary-button">
                {t("landing.learn_more") || "Learn More"}
              </a>
            </div>
          </div>
        </div>

        {/* Dynamic Background Elements */}
        <div className="hero-background">
          <div className="hero-background-shape"></div>
        </div>
      </section>
    </>
  );
};

export default Hero;
