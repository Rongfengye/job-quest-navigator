import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/auth/AuthModal";
import { useAuthContext } from "@/context/AuthContext";

const CallToAction = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // If user is already logged in, navigate directly to Behavioral page
      navigate("/behavioral");
    } else {
      // Otherwise show auth modal for login/signup
      setShowAuthModal(true);
    }
  };

  return (
    <section className="py-20 px-6 bg-gray-100">
      <div className="max-w-7xl mx-auto text-center">
        <h2 className="text-3xl md:text-4xl font-bold text-interview-text-primary mb-4">
          Get Your Dream Job with Storyline
        </h2>
        <p className="text-interview-text-secondary text-lg mb-8 max-w-2xl mx-auto">
          Start practicing for your interviews now.
        </p>
        <Button
          onClick={handleGetStarted}
          className="bg-interview-primary hover:bg-interview-dark text-white px-8 py-6 rounded-md transition-all duration-300 text-lg font-semibold"
        >
          Get Started
        </Button>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </section>
  );
};

export default CallToAction;
