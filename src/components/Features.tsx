
import React from 'react';
import { Target, Sparkles, Code, Linkedin, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Features = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto" id="features">
      {/* Main Features Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* First row - Text content on the left, image on the right */}
        <div className="flex flex-col justify-center">
          <div className="mb-4 text-interview-primary">
            <Target className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-interview-text-primary">Discover Interview Questions</h3>
          <p className="text-interview-text-secondary">
            Generate unlimited practice interview questions based off of any job description and your resume so that the questions are custom to the job and your personal experience.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 feature-card-shadow opacity-0 animate-fade-up animation-delay-300">
          <div className="bg-gray-100 p-4 rounded-lg">
            <img 
              src="/lovable-uploads/9f5317f8-1c85-489f-9174-0f4305f9abd8.png" 
              alt="Interview questions example" 
              className="w-full h-auto rounded shadow-sm"
              style={{ maxHeight: "250px", objectFit: "cover" }}
            />
          </div>
        </div>
        
        {/* Horizontal separator between rows */}
        <div className="col-span-1 md:col-span-2 my-12">
          <Separator className="bg-gray-200" />
        </div>
        
        {/* Second row - Image on the left, text content on the right */}
        <div className="bg-white rounded-xl p-6 feature-card-shadow opacity-0 animate-fade-up animation-delay-600 order-2 md:order-1">
          <div className="bg-gray-100 p-4 rounded-lg">
            <img 
              src="/lovable-uploads/e238b653-4e3a-4c6a-8057-23a65b0d1dc0.png" 
              alt="AI generated answers example" 
              className="w-full h-auto rounded shadow-sm"
              style={{ maxHeight: "250px", objectFit: "cover" }}
            />
          </div>
        </div>
        
        <div className="flex flex-col justify-center order-1 md:order-2">
          <div className="mb-4 text-interview-primary">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-interview-text-primary">Get Real-time Feedback</h3>
          <p className="text-interview-text-secondary">
            Receive immediate, personalized feedback on your interview responses to help you improve your delivery, content, and overall interview performance before the real thing.
          </p>
        </div>
      </div>
      
      {/* Horizontal separator between sections */}
      <div className="my-20">
        <Separator className="bg-gray-200" />
      </div>
      
      {/* "If you're facing any of these" Section */}
      <div className="text-center mb-16">
        <h2 className="text-3xl md:text-4xl font-bold text-interview-text-primary mb-12">
          If you're facing any of these, we can help you:
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-8">
          {/* Coding Prep Card */}
          <a 
            href="https://coderpad.io/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block"
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up animation-delay-300 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-interview-light rounded-full p-4 mb-6">
                  <Code className="w-10 h-10 text-interview-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">Coding Prep</h3>
                <p className="text-interview-text-secondary text-center">
                  Practice technical interviews with customized coding challenges and real-time feedback.
                </p>
              </CardContent>
            </Card>
          </a>
          
          {/* LinkedIn Card */}
          <a 
            href="https://www.linkedup.tryhireme.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block"
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up animation-delay-500 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-interview-light rounded-full p-4 mb-6">
                  <Linkedin className="w-10 h-10 text-interview-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">LinkedIn</h3>
                <p className="text-interview-text-secondary text-center">
                  Optimize your LinkedIn profile to attract recruiters and stand out from the competition.
                </p>
              </CardContent>
            </Card>
          </a>
          
          {/* Resume Card */}
          <a 
            href="https://www.nts.live/shows/daria-kolosova/episodes/daria-kolosova-4th-june-2024" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block"
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up animation-delay-700 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="bg-interview-light rounded-full p-4 mb-6">
                  <FileText className="w-10 h-10 text-interview-primary" />
                </div>
                <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">Resume</h3>
                <p className="text-interview-text-secondary text-center">
                  Get professional feedback on your resume to highlight your strengths and experiences.
                </p>
              </CardContent>
            </Card>
          </a>
        </div>
      </div>
    </section>
  );
};

export default Features;
