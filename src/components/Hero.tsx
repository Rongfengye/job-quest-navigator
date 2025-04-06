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
      // If user is already logged in, navigate directly to Create page
      navigate('/dashboard');
    } else {
      // Otherwise show auth modal for login/signup
      setShowAuthModal(true);
    }
  };

  return (
    <section className="relative overflow-hidden py-12 md:py-20 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-interview-light/30 to-transparent -z-10" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12 items-center">
          {/* Left Column - Video Placeholder */}
          <div className="rounded-2xl overflow-hidden shadow-xl border border-gray-200 bg-white aspect-video flex items-center justify-center order-2 md:order-1 opacity-0 animate-fade-up">
            <div className="flex flex-col items-center justify-center p-8 text-center">
              <div className="w-16 h-16 rounded-full bg-interview-light flex items-center justify-center mb-4">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-interview-primary">
                  <polygon points="5 3 19 12 5 21 5 3"></polygon>
                </svg>
              </div>
              <p className="text-interview-text-secondary">Demo video coming soon</p>
            </div>
          </div>
          
          {/* Right Column - Content */}
          <div className="text-left order-1 md:order-2">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-interview-primary mb-6 leading-tight opacity-0 animate-fade-up">
              Storyline
            </h1>
            
            <p className="text-interview-text-secondary mb-8 text-lg opacity-0 animate-fade-up animation-delay-300">
              From interview prep to real-time interview help, Storyline is a complete solution to help you land any job and get the bag.
            </p>
            
            <div className="opacity-0 animate-fade-up animation-delay-900">
              <Button 
                onClick={handleGetStarted}
                className="bg-interview-primary hover:bg-interview-dark text-white px-6 py-6 rounded-md transition-all duration-300 text-lg flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};

export default Hero;
