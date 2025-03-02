
import React from 'react';
import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Hero = () => {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 bg-gradient-to-b from-interview-light/30 to-transparent -z-10" />
      
      <div className="relative px-6 py-24 md:py-32 max-w-7xl mx-auto">
        <div className="text-center">
          <div className="inline-block bg-interview-light text-interview-primary text-sm font-medium px-4 py-1.5 rounded-full mb-6 opacity-0 animate-fade-down">
            NO SUBSCRIPTION REQUIRED
          </div>
          
          <h1 className="text-4xl md:text-6xl font-bold text-interview-primary mb-6 leading-tight opacity-0 animate-fade-up">
            Storyline
          </h1>
          
          <p className="text-interview-text-secondary max-w-2xl mx-auto mb-8 text-lg opacity-0 animate-fade-up animation-delay-300">
            From interview prep to real-time interview help, Storyline is a complete solution to help you land any job and get the bag.
          </p>
          
          <p className="text-interview-text-light mb-8 opacity-0 animate-fade-up animation-delay-600">
            No annoying subscription required.
          </p>
          
          <div className="opacity-0 animate-fade-up animation-delay-900">
            <Link to="/create">
              <Button className="bg-interview-primary hover:bg-interview-dark text-white px-6 py-6 rounded-md transition-all duration-300 text-lg flex items-center justify-center gap-2 group">
                Get Started
                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
