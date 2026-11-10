import React, { useState } from "react";
import "./LandingPage.css";
import Navbar from "@components/landing/Navbar";
import Hero from "@components/landing/Hero";
import Features from "@components/landing/Features";
import Pricing from "@components/landing/Pricing";
import RegistrationForm from "@components/landing/RegistrationForm";

const LandingPage = () => {
  const [selectedPlan, setSelectedPlan] = useState(null);

  const handleSelectPlan = (plan) => {
    setSelectedPlan(plan);
  };

  const handleCloseModal = () => {
    setSelectedPlan(null);
  };

  return (
    <>
      <div className="landing-page-container">
        <div className="landing-page-content">
          <Navbar />
          <div style={{ padding: "0 2rem" }}>
            <Hero />
            <Features />
            <Pricing onSelectPlan={handleSelectPlan} />
          </div>
        </div>

        {/* Footer */}
        <footer className="landing-footer">
          <div className="landing-footer-content">
            <p>
              &copy; {new Date().getFullYear()} RestaurantERP. All rights
              reserved.
            </p>
          </div>
        </footer>

        {selectedPlan && (
          <RegistrationForm
            selectedPlan={selectedPlan}
            onClose={handleCloseModal}
          />
        )}
      </div>
    </>
  );
};

export default LandingPage;
