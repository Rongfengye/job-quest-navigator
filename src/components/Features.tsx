
import React from 'react';
import { Target, Sparkles, Code, Linkedin, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Features = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto" id="features">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* First row - Text content on the left, image on the right */}
        <div className="flex flex-col justify-center">
          <div className="mb-4 text-interview-primary">
            <Target className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">Discover Interview Questions</h3>
          <p className="text-interview-text-secondary text-sm">
            Generate unlimited practice interview questions based off of any job description and your resume so that the questions are custom to the job and your personal experience.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 feature-card-shadow opacity-0 animate-fade-up animation-delay-300">
          <div className="bg-gray-100 p-4 rounded-lg">
            <img 
              src="/lovable-uploads/9f5317f8-1c85-489f-9174-0f4305f9abd8.png" 
              alt="Interview questions example" 
              className="w-full h-auto rounded shadow-sm"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          </div>
        </div>
        
        {/* Horizontal separator between rows */}
        <div className="col-span-1 md:col-span-2 my-8">
          <Separator className="bg-gray-200" />
        </div>
        
        {/* Second row - Image on the left, text content on the right */}
        <div className="bg-white rounded-xl p-6 feature-card-shadow opacity-0 animate-fade-up animation-delay-600">
          <div className="bg-gray-100 p-4 rounded-lg">
            <img 
              src="/lovable-uploads/e238b653-4e3a-4c6a-8057-23a65b0d1dc0.png" 
              alt="AI generated answers example" 
              className="w-full h-auto rounded shadow-sm"
              style={{ maxHeight: "200px", objectFit: "cover" }}
            />
          </div>
        </div>
        
        <div className="flex flex-col justify-center">
          <div className="mb-4 text-interview-primary">
            <Sparkles className="w-10 h-10" />
          </div>
          <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">Get Real-time Feedback</h3>
          <p className="text-interview-text-secondary text-sm">
            Receive immediate, personalized feedback on your interview responses to help you improve your delivery, content, and overall interview performance before the real thing.
          </p>
        </div>
      </div>
      
      {/* Horizontal separator between sections */}
      <div className="my-16">
        <Separator className="bg-gray-200" />
      </div>
      
      {/* New section - "If you're facing any of these, we can help you" */}
      <div className="text-center mb-12">
        <h2 className="text-2xl md:text-3xl font-bold text-interview-text-primary mb-8">
          If you're facing any of these, we can help you:
        </h2>
        
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6">
          {/* Coding Prep Card - Now a clickable button */}
          <a 
            href="https://coderpad.io/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block"
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up animation-delay-300 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="bg-interview-light rounded-full p-4 mb-4">
                  <Code className="w-8 h-8 text-interview-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-interview-text-primary">Coding Prep</h3>
                <p className="text-interview-text-secondary text-sm text-center">
                  Practice technical interviews with customized coding challenges and real-time feedback.
                </p>
              </CardContent>
            </Card>
          </a>
          
          {/* LinkedIn Card - Now a clickable button */}
          <a 
            href="https://www.linkedup.tryhireme.com/" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block"
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up animation-delay-500 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="bg-interview-light rounded-full p-4 mb-4">
                  <Linkedin className="w-8 h-8 text-interview-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-interview-text-primary">LinkedIn</h3>
                <p className="text-interview-text-secondary text-sm text-center">
                  Optimize your LinkedIn profile to attract recruiters and stand out from the competition.
                </p>
              </CardContent>
            </Card>
          </a>
          
          {/* Resume Card - Now a clickable button */}
          <a 
            href="https://www.nts.live/shows/daria-kolosova/episodes/daria-kolosova-4th-june-2024" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="block"
          >
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 opacity-0 animate-fade-up animation-delay-700 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-6 flex flex-col items-center">
                <div className="bg-interview-light rounded-full p-4 mb-4">
                  <FileText className="w-8 h-8 text-interview-primary" />
                </div>
                <h3 className="text-lg font-semibold mb-2 text-interview-text-primary">Resume</h3>
                <p className="text-interview-text-secondary text-sm text-center">
                  Get professional feedback on your resume to highlight your strengths and experiences.
                </p>
              </CardContent>
            </Card>
          </a>
        </div>
      </div>
      
      {/* Horizontal separator before Web Scraper */}
      <div className="my-16">
        <Separator className="bg-gray-200" />
      </div>
    </section>
  );
};

export default Features;
