
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
      {/* Complex Blue Blob Background - Positioned on Right Half */}
      <div className="absolute inset-0 z-0">
        <div className="absolute top-0 right-0 w-3/5 h-full">
          <svg
            className="absolute inset-0 w-full h-full"
            viewBox="0 0 800 600"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            preserveAspectRatio="xMidYMid slice"
          >
            <defs>
              {/* Primary dark blue gradient */}
              <linearGradient id="complexBlobGradient1" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#1877F2" stopOpacity="0.95" />
                <stop offset="30%" stopColor="#0B5ED7" stopOpacity="1" />
                <stop offset="70%" stopColor="#1877F2" stopOpacity="0.9" />
                <stop offset="100%" stopColor="#0B5ED7" stopOpacity="0.85" />
              </linearGradient>
              
              {/* Secondary deeper blue gradient */}
              <linearGradient id="complexBlobGradient2" x1="100%" y1="0%" x2="0%" y2="100%">
                <stop offset="0%" stopColor="#0B5ED7" stopOpacity="0.8" />
                <stop offset="50%" stopColor="#1877F2" stopOpacity="0.95" />
                <stop offset="100%" stopColor="#0B5ED7" stopOpacity="0.9" />
              </linearGradient>
              
              {/* Accent gradient for layering */}
              <linearGradient id="complexBlobGradient3" x1="50%" y1="0%" x2="50%" y2="100%">
                <stop offset="0%" stopColor="#1877F2" stopOpacity="0.7" />
                <stop offset="100%" stopColor="#0B5ED7" stopOpacity="0.8" />
              </linearGradient>
            </defs>
            
            {/* Main complex jagged blob shape */}
            <path
              d="M200,50 
                 C280,30 350,45 420,80 
                 C460,95 480,70 520,85 
                 C570,105 590,140 640,120 
                 C690,100 720,130 750,160 
                 C780,190 800,220 780,260 
                 C760,300 740,280 700,320 
                 C660,360 680,390 650,420 
                 C620,450 580,470 540,460 
                 C500,450 480,480 440,470 
                 C400,460 380,440 340,450 
                 C300,460 280,480 240,470 
                 C200,460 180,430 160,390 
                 C140,350 120,310 140,270 
                 C160,230 180,200 160,160 
                 C140,120 160,90 200,50 Z"
              fill="url(#complexBlobGradient1)"
            />
            
            {/* Secondary jagged blob for depth */}
            <path
              d="M320,80 
                 C380,60 440,75 500,110 
                 C540,130 560,105 600,120 
                 C650,140 670,175 720,155 
                 C770,135 800,165 780,205 
                 C760,245 740,225 700,265 
                 C660,305 680,335 650,365 
                 C620,395 580,415 540,405 
                 C500,395 480,425 440,415 
                 C400,405 380,385 340,395 
                 C300,405 280,425 240,415 
                 C200,405 180,375 200,335 
                 C220,295 240,265 220,225 
                 C200,185 220,155 260,135 
                 C300,115 320,95 320,80 Z"
              fill="url(#complexBlobGradient2)"
            />
            
            {/* Third layer for more complexity */}
            <path
              d="M400,120 
                 C450,100 500,115 550,140 
                 C580,155 600,135 630,150 
                 C670,170 690,200 720,185 
                 C750,170 770,195 760,225 
                 C750,255 730,240 700,270 
                 C670,300 690,325 670,350 
                 C650,375 620,390 590,385 
                 C560,380 540,405 510,400 
                 C480,395 460,380 430,385 
                 C400,390 380,405 350,400 
                 C320,395 300,375 320,345 
                 C340,315 360,290 340,260 
                 C320,230 340,205 370,190 
                 C400,175 400,145 400,120 Z"
              fill="url(#complexBlobGradient3)"
            />
            
            {/* Additional jagged details */}
            <path
              d="M500,180 
                 C530,160 560,170 590,190 
                 C610,205 630,185 650,200 
                 C680,220 700,245 690,270 
                 C680,295 660,285 640,305 
                 C620,325 635,345 620,365 
                 C605,385 580,395 560,390 
                 C540,385 525,400 505,395 
                 C485,390 470,380 450,385 
                 C430,390 415,400 395,395 
                 C375,390 360,375 375,355 
                 C390,335 405,320 390,300 
                 C375,280 390,265 410,255 
                 C430,245 450,235 470,225 
                 C490,215 500,195 500,180 Z"
              fill="url(#complexBlobGradient1)"
              opacity="0.6"
            />
          </svg>
        </div>
      </div>
      
      <div className="max-w-7xl mx-auto relative z-10">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left relative z-20">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-interview-text-primary mb-6">
              Ace Your Next Interview with AI-Guided Practice
            </h1>
            
            <p className="text-interview-text-secondary text-lg mb-8">
              Personalized interview preparation tailored to your resume and job goals.
            </p>
            <p className="text-interview-text-secondary text-lg mb-8">
              Practice with realistic simulations, receive real-time guidance, and analyze your performance.
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
              <div className="absolute top-0 left-0 bg-white p-4 rounded-xl shadow-lg w-64">
                <h3 className="font-semibold mb-2">Behavioral Interview</h3>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 flex items-center justify-center">
                    <svg width="100%" height="100%" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="50" cy="35" r="25" fill="#1877F2"/>
                      <path d="M50,70 C33,70 20,85 20,100 L80,100 C80,85 67,70 50,70" fill="#1877F2"/>
                    </svg>
                  </div>
                  <div className="bg-interview-primary text-white p-2 rounded-md">
                    <svg width="30" height="24" viewBox="0 0 30 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="6" cy="12" r="4" fill="white"/>
                      <circle cx="15" cy="12" r="4" fill="white"/>
                      <circle cx="24" cy="12" r="4" fill="white"/>
                    </svg>
                  </div>
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
