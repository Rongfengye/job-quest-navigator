
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
      <div className="absolute inset-0 z-10 opacity-100">
        {/* Organic blue blob background */}
        <svg
          className="absolute inset-0 w-full h-full"
          viewBox="0 0 1200 800"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="xMidYMid slice"
        >
          <defs>
            <linearGradient id="blobGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--interview-primary))" stopOpacity="0.8" />
              <stop offset="50%" stopColor="hsl(var(--interview-primary))" stopOpacity="0.6" />
              <stop offset="100%" stopColor="hsl(var(--interview-dark))" stopOpacity="0.7" />
            </linearGradient>
            <linearGradient id="blobGradient2" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(var(--interview-primary))" stopOpacity="0.4" />
              <stop offset="100%" stopColor="hsl(var(--interview-light))" stopOpacity="0.3" />
            </linearGradient>
          </defs>
          
          {/* Main organic blob shape */}
          <path
            d="M150,100 
               C200,80 300,60 450,100 
               C600,140 700,120 850,150 
               C950,170 1050,200 1150,250 
               C1200,280 1200,350 1180,420 
               C1160,500 1100,580 1000,650 
               C900,720 750,750 600,730 
               C450,710 350,680 250,630 
               C150,580 80,500 60,400 
               C40,300 80,200 150,100 Z"
            fill="url(#blobGradient)"
          />
          
          {/* Secondary smaller blob for layering */}
          <path
            d="M400,200 
               C500,180 650,190 800,220 
               C900,240 1000,280 1100,350 
               C1150,400 1120,480 1080,550 
               C1040,620 950,670 850,680 
               C750,690 650,660 550,620 
               C450,580 380,520 350,450 
               C320,380 360,300 400,200 Z"
            fill="url(#blobGradient2)"
          />
        </svg>
      </div>
      

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};

export default Hero;
