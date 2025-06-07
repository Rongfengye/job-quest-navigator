import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";
import AuthModal from "@/components/auth/AuthModal";
import { useAuthContext } from "@/context/AuthContext";

const Hero = () => {
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
    <section className="relative overflow-hidden py-16 md:py-20 px-6 bg-interview-hero-bg">
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left relative z-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-interview-text-primary mb-6">
              Ace Your Next Interview with AI-Guided Practice
            </h1>

            <p className="text-interview-text-secondary text-lg mb-8">
              Personalized interview preparation tailored to your resume and job
              goals.
            </p>
            <p className="text-interview-text-secondary text-lg mb-8">
              Practice with realistic simulations, receive real-time guidance,
              and analyze your performance.
            </p>

            <Button
              onClick={handleGetStarted}
              className="bg-interview-primary hover:bg-interview-dark text-white px-6 py-6 rounded-md transition-all duration-300 text-lg"
            >
              Get Started
            </Button>
          </div>

          {/* Right Column - Feature Cards */}
          <div className="relative z-20">
            {/* Main illustration containing all feature cards */}
            <div className="w-full h-full relative">
              {/* Behavioral Interview Card */}
              <div
                className="absolute bg-white rounded-xl shadow-lg"
                style={{
                  left: "18px",
                  top: "-201px",
                  width: "303px",
                  padding: "16px 26px 16px 16px",
                }}
              >
                <h3 className="font-semibold mb-2">Behavioral Interview</h3>
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=2000"
                  className="w-full object-cover object-center min-h-5 min-w-5 overflow-hidden"
                  style={{
                    aspectRatio: "1.48",
                    margin: "-3px 79px 0 0",
                    maxWidth: "248px",
                  }}
                  alt="Behavioral Interview illustration"
                />
              </div>

              {/* Audio Feedback Card */}
              <div
                className="absolute bg-white p-4 rounded-xl shadow-lg"
                style={{
                  right: "0px",
                  top: "-142px",
                  width: "259px",
                  left: "295px",
                }}
              >
                <h3 className="font-semibold mb-2">Audio Feedback</h3>
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=2000"
                  className="w-full object-cover object-center min-h-5 min-w-5 overflow-hidden"
                  style={{ aspectRatio: "3.33", margin: "25px 0 34px" }}
                  alt="Audio Feedback visualization"
                />
              </div>

              {/* Performance Analysis Card */}
              <div className="absolute bottom-0 right-0 bg-white p-4 rounded-xl shadow-lg">
                <h3 className="font-semibold mb-2">Performance Analysis</h3>
                <div
                  className="flex items-center"
                  style={{ gap: "6px", marginLeft: "-3px" }}
                >
                  <div
                    className="flex items-end gap-1 h-12"
                    style={{ margin: "0 -1px 0 18px" }}
                  >
                    <div className="w-4 h-6 bg-interview-primary rounded-t"></div>
                    <div className="w-4 h-10 bg-interview-primary/70 rounded-t"></div>
                    <div className="w-4 h-12 bg-interview-light rounded-t"></div>
                  </div>
                  <img
                    loading="lazy"
                    srcSet="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=2000 2000w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0"
                    className="w-full object-cover object-center min-h-5 min-w-5 overflow-hidden"
                    style={{
                      aspectRatio: "0.99",
                      maxWidth: "75px",
                      margin: "0 11px 0 20px",
                    }}
                    alt="Performance Analysis chart"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal
        isOpen={showAuthModal}
        onClose={() => setShowAuthModal(false)}
      />
    </section>
  );
};

export default Hero;
