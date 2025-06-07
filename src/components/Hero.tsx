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
    <section className="relative overflow-hidden py-16 md:py-20 px-6 bg-gradient-to-tr from-blue-50 to-blue-300">
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

              {/* Guided Responses Card - moved to be left and behind Performance Analysis */}
              <div
                className="absolute bg-white p-4 rounded-xl shadow-lg"
                style={{
                  left: "-7px",
                  top: "55px",
                  width: "289px",
                  zIndex: 10,
                }}
              >
                <h3 className="font-semibold mb-2">Guided Responses</h3>
                <img
                  loading="lazy"
                  src="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F4b27bcc81dd148baa177b293c7a50999"
                  className="w-full object-cover object-center min-h-5 min-w-5 overflow-hidden"
                  style={{
                    aspectRatio: "3.33",
                    paddingRight: "50px",
                    margin: "7px 0",
                  }}
                  alt="Guided Responses visualization"
                />
              </div>

              {/* Performance Analysis Card */}
              <div
                className="absolute bottom-0 right-0 bg-white rounded-xl shadow-lg"
                style={{
                  left: "238px",
                  top: "81px",
                  height: "158px",
                  width: "260px",
                  padding: "16px 16px 0",
                  zIndex: 20,
                }}
              >
                <h3 className="font-semibold mb-2">Performance Analysis</h3>
                <div
                  className="flex items-center"
                  style={{
                    gap: "10px",
                    paddingLeft: "17px",
                    margin: "0 -5px 1px -3px",
                  }}
                >
                  <div
                    className="flex items-end gap-1 h-12"
                    style={{ paddingTop: "26px", margin: "-1px -1px 0 18px" }}
                  >
                    <div className="w-4 h-6 bg-interview-primary rounded-t"></div>
                    <div className="w-4 h-10 bg-interview-primary/70 rounded-t"></div>
                    <div className="w-4 h-12 bg-interview-light rounded-t"></div>
                  </div>
                  <img
                    loading="lazy"
                    src="https://cdn.builder.io/api/v1/image/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2Fc682c9fd60a64856ac6a0562519a84b0?width=2000"
                    className="w-full object-cover object-center min-w-5 overflow-hidden"
                    style={{
                      aspectRatio: "0.99",
                      maxWidth: "75px",
                      minHeight: "30px",
                      margin: "0 9px 0 20px",
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
