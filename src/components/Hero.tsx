import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import AuthModal from '@/components/auth/AuthModal';
import { useAuthContext } from '@/context/AuthContext';

const Hero = () => {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated } = useAuthContext();

  const handleGetStarted = () => {
    if (isAuthenticated) {
      // If user is already logged in, navigate directly to Behavioral page
      navigate('/behavioral');
    } else {
      // Otherwise show auth modal for login/signup
      setShowAuthModal(true);
    }
  };

  return (
    <section className="relative overflow-hidden py-16 md:py-20 px-6">
      <div className="absolute inset-0 bg-interview-primary/10 -z-10">
        {/* Wave-like blue background */}
        <div className="absolute top-0 right-0 w-full h-full bg-interview-primary rounded-bl-[40%]"></div>
      </div>
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-interview-text-primary mb-6">
              Ace Your Interviews with AI-Powered Practice
            </h1>
            
            <p className="text-interview-text-secondary text-lg mb-8">
              Tailored Interview prep built around your resume and goals. Practice, get real-time coaching, and perform with confidence.
            </p>
            
            <Button 
              onClick={handleGetStarted}
              className="bg-interview-primary hover:bg-interview-dark text-white px-6 py-6 rounded-md transition-all duration-300 text-lg"
            >
              Get Started
            </Button>
          </div>
          
          {/* Right Column - Feature Cards */}
          <div className="relative">
            {/* Main illustration containing all feature cards */}
            <div className="w-full h-full relative">
              {/* Behavioral Interview Card */}
              <div className="absolute top-0 left-0 bg-white p-4 rounded-xl shadow-lg w-64">
                <h3 className="font-semibold mb-2">Behavioral Interview</h3>
                <div className="flex items-center gap-3">
                  <img 
                    src="/lovable-uploads/9020c4af-c3f9-4b48-a38d-769edef61736.png" 
                    alt="Behavioral Interview" 
                    className="w-full h-auto rounded-lg"
                  />
                </div>
              </div>
              
              {/* Audio Feedback Card */}
              <div className="absolute top-0 right-0 bg-white p-4 rounded-xl shadow-lg">
                <h3 className="font-semibold mb-2">Audio Feedback</h3>
                <div className="flex justify-center">
                  <svg width="160" height="40" viewBox="0 0 160 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M5,20 Q10,5 15,20 Q20,35 25,20 Q30,5 35,20 Q40,35 45,20 Q50,5 55,20 Q60,35 65,20 Q70,5 75,20 Q80,35 85,20 Q90,5 95,20 Q100,35 105,20 Q110,5 115,20 Q120,35 125,20 Q130,5 135,20 Q140,35 145,20 Q150,5 155,20" 
                          stroke="#1877F2" 
                          strokeWidth="3" 
                          fill="none" />
                  </svg>
                </div>
              </div>
              
              {/* Guided Response Card */}
              <div className="absolute bottom-0 left-0 bg-white p-4 rounded-xl shadow-lg w-64">
                <h3 className="font-semibold mb-2">Guided Response</h3>
                <div className="flex flex-col gap-2">
                  <div className="h-2 bg-interview-light rounded-full w-full"></div>
                  <div className="h-2 bg-interview-light rounded-full w-3/4"></div>
                  <div className="h-2 bg-interview-light rounded-full w-full"></div>
                  <div className="h-2 bg-interview-light rounded-full w-4/5"></div>
                </div>
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
                    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="50" r="45" fill="transparent" stroke="#E7F3FF" strokeWidth="10" />
                      <path d="M50,5 A45,45 0 0,1 95,50" stroke="#1877F2" strokeWidth="10" fill="transparent" />
                      <path d="M50,50 L80,30" stroke="#1877F2" strokeWidth="5" />
                      <circle cx="50" cy="50" r="5" fill="#1877F2" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};

export default Hero;
