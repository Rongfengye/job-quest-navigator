
import React from 'react';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import { Separator } from '@/components/ui/separator';

const Index = () => {
  return (
    <div className="min-h-screen bg-white flex flex-col">
      <header className="py-6 px-6 flex items-center justify-between max-w-7xl mx-auto w-full">
        <h1 className="text-xl font-bold text-interview-text-primary">Perfect Interview</h1>
        <nav className="hidden md:flex items-center space-x-8">
          <a href="#features" className="text-interview-text-secondary hover:text-interview-primary transition-colors">Features</a>
          <a href="#" className="text-interview-text-secondary hover:text-interview-primary transition-colors">Pricing</a>
          <a href="#" className="text-interview-text-secondary hover:text-interview-primary transition-colors">FAQ</a>
        </nav>
      </header>
      
      <main className="flex-1">
        <Hero />
        <Separator className="max-w-5xl mx-auto" />
        <Features />
      </main>
      
      <footer className="py-8 px-6 bg-gray-50">
        <div className="max-w-7xl mx-auto text-center text-interview-text-light text-sm">
          <p>© {new Date().getFullYear()} Perfect Interview. All rights reserved.</p>
        </div>
      </footer>
    </div>
  );
};

export default Index;
