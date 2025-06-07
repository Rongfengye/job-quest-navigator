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
                  left: "-10px",
                  top: "-211px",
                  width: "318px",
                  padding: "16px 26px 16px 16px",
                }}
              >
                <h3 className="font-semibold mb-2">Behavioral Interview</h3>
                <img
                  loading="lazy"
                  srcSet="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615?width=2000 2000w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fde75c37dc3ca483194f4d93257fa3615"
                  className="w-full object-cover object-center min-h-5 min-w-5 overflow-hidden mr-20 max-w-62"
                  style={{
                    aspectRatio: "1.48",
                    marginRight: "79px",
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
                  top: "64px",
                  width: "217px",
                  left: "308px",
                }}
              >
                <h3 className="font-semibold mb-2">Audio Feedback</h3>
                <img
                  loading="lazy"
                  srcSet="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=100 100w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=200 200w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=400 400w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=800 800w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=1200 1200w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=1600 1600w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e?width=2000 2000w, https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F31d2353857b54751897a97285218dc3e"
                  className="w-full object-cover object-center min-h-5 min-w-5 overflow-hidden"
                  style={{ aspectRatio: "3.33", margin: "15px 0 18px" }}
                  alt="Audio Feedback visualization"
                />
              </div>

              {/* Guided Response Card */}
              <div
                className="absolute bg-white rounded-xl shadow-lg w-64"
                style={{
                  bottom: "0px",
                  left: "0px",
                  top: "20px",
                  padding: "16px 16px 64px",
                }}
              >
                Guided Responses
              </div>

              {/* Performance Analysis Card */}
              <div className="absolute bottom-0 right-0 bg-white p-4 rounded-xl shadow-lg">
                <h3 className="font-semibold mb-2">Performance Analysis</h3>
                <div className="flex items-center gap-4">
                  <div className="flex items-end gap-1 h-12">
                    <div className="w-4 h-6 bg-interview-primary rounded-t"></div>
                    <div className="w-4 h-10 bg-interview-primary/70 rounded-t"></div>
                    <div className="w-4 h-12 bg-interview-light rounded-t"></div>
                  </div>
                  <div className="w-12 h-12">
                    <svg
                      width="100%"
                      height="100%"
                      viewBox="0 0 100 100"
                      fill="none"
                      xmlns="http://www.w3.org/2000/svg"
                    >
                      <circle
                        cx="50"
                        cy="50"
                        r="45"
                        fill="transparent"
                        stroke="#E7F3FF"
                        strokeWidth="10"
                      />
                      <path
                        d="M50,5 A45,45 0 0,1 95,50"
                        stroke="#1877F2"
                        strokeWidth="10"
                        fill="transparent"
                      />
                      <path
                        d="M50,50 L80,30"
                        stroke="#1877F2"
                        strokeWidth="5"
                      />
                      <circle cx="50" cy="50" r="5" fill="#1877F2" />
                    </svg>
                  </div>
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
