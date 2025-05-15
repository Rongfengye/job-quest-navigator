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
    <section className="relative overflow-hidden py-16 md:py-24 px-6">
      <div className="absolute inset-0 bg-gradient-to-b from-interview-light/50 to-transparent -z-10" />
      
      <div className="max-w-7xl mx-auto">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          {/* Left Column - Content */}
          <div className="text-left order-2 md:order-1">
            <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-interview-text-primary mb-6 opacity-0 animate-fade-up">
              Ace Your Interviews with AI-Powered Practice
            </h1>
            
            <p className="text-interview-text-secondary text-lg mb-8 opacity-0 animate-fade-up animation-delay-300">
              Get tailored interview preparation based on job descriptions and your resume. 
              Practice with real interview questions, receive detailed feedback, and improve your chances of landing your dream job.
            </p>
            
            <div className="opacity-0 animate-fade-up animation-delay-600">
              <Button 
                onClick={handleGetStarted}
                className="bg-interview-primary hover:bg-interview-dark text-white px-6 py-6 rounded-md transition-all duration-300 text-lg flex items-center justify-center gap-2 group"
              >
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </div>
          </div>
          
          {/* Right Column - Feature Cards */}
          <div className="order-1 md:order-2 grid grid-cols-1 sm:grid-cols-2 gap-4 opacity-0 animate-fade-up animation-delay-300">
            {/* Feature Card 1 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all hover:shadow-lg">
              <div className="mb-3 text-interview-primary font-semibold text-lg">Behavioral Interview</div>
              <p className="text-interview-text-secondary text-sm">Practice answering common behavioral interview questions with AI feedback.</p>
            </div>
            
            {/* Feature Card 2 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all hover:shadow-lg">
              <div className="mb-3 text-interview-primary font-semibold text-lg">Audio Feedback</div>
              <p className="text-interview-text-secondary text-sm">Get detailed analysis of your verbal responses and delivery style.</p>
            </div>
            
            {/* Feature Card 3 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all hover:shadow-lg">
              <div className="mb-3 text-interview-primary font-semibold text-lg">Guided Response</div>
              <p className="text-interview-text-secondary text-sm">Step-by-step guidance to craft perfect answers to tough questions.</p>
            </div>
            
            {/* Feature Card 4 */}
            <div className="bg-white rounded-xl p-6 shadow-md border border-gray-100 transition-all hover:shadow-lg">
              <div className="mb-3 text-interview-primary font-semibold text-lg">Performance Analysis</div>
              <p className="text-interview-text-secondary text-sm">Track your progress and identify areas for improvement.</p>
            </div>
          </div>
        </div>
      </div>

      <AuthModal isOpen={showAuthModal} onClose={() => setShowAuthModal(false)} />
    </section>
  );
};

export default Hero;
