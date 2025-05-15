
import React from 'react';
import { Target, Sparkles, Code, Linkedin, FileText } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { Card, CardContent } from '@/components/ui/card';

const Features = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto" id="features">
      {/* Discover Interview Questions Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="flex flex-col justify-center">
          <div className="mb-4 text-interview-primary">
            <div className="w-16 h-16 rounded-full border-2 border-interview-primary flex items-center justify-center">
              <Target className="w-8 h-8" />
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-interview-text-primary">Discover Interview Questions</h3>
          <p className="text-interview-text-secondary">
            Generate unlimited practice interview questions based off of any job description and your resume so that the questions are custom-fit to the job and your personal experience.
          </p>
        </div>
        
        <div className="bg-white rounded-xl p-6 shadow-md">
          <div className="bg-gray-50 p-4 rounded-lg">
            <div className="p-2">
              <h4 className="font-semibold mb-2">Philip question-Inter questions</h4>
              <div className="space-y-4">
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs">✓</div>
                  <p className="text-sm text-gray-600">When you stepped into a leadership role, how did you approach your new responsibilities?</p>
                </div>
                <div className="flex gap-2">
                  <div className="w-5 h-5 rounded-full bg-gray-200 flex-shrink-0 flex items-center justify-center text-xs">✓</div>
                  <p className="text-sm text-gray-600">What was your approach to help resources your team/colleagues when tools are outdated?</p>
                </div>
                <div className="mt-4 flex justify-end">
                  <div className="bg-interview-primary text-white text-xs py-1 px-3 rounded-md">
                    Adopted
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Get Real-time Feedback Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mb-20">
        <div className="order-2 md:order-1">
          <div className="bg-interview-primary/10 rounded-xl p-6">
            <img 
              src="/lovable-uploads/e238b653-4e3a-4c6a-8057-23a65b0d1dc0.png" 
              alt="Behavioral interview example" 
              className="w-full h-auto rounded-lg shadow-sm"
            />
          </div>
        </div>
        
        <div className="flex flex-col justify-center order-1 md:order-2">
          <div className="mb-4 text-interview-primary">
            <div className="w-10 h-10">
              <svg viewBox="0 0 24 24" fill="none" className="w-full h-full text-interview-primary">
                <path d="M12 3L14.5 8.5L21 9.5L16.5 14L17.5 20.5L12 17.5L6.5 20.5L7.5 14L3 9.5L9.5 8.5L12 3Z" fill="currentColor"/>
              </svg>
            </div>
          </div>
          <h3 className="text-2xl font-semibold mb-3 text-interview-text-primary">Get Real-Time Feedback</h3>
          <p className="text-interview-text-secondary">
            Receive immediate, personalized feedback on your interview responses to help you improve your delivery, context, and overall interview performance before the real thing.
          </p>
        </div>
      </div>
      
      {/* Separator */}
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
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="mb-6">
                  <div className="text-interview-primary text-5xl">
                    &lt;/&gt;
                  </div>
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
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="mb-6">
                  <div className="text-interview-primary text-5xl">
                    <Linkedin className="w-12 h-12" />
                  </div>
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
            <Card className="bg-white shadow-md hover:shadow-lg transition-all duration-300 hover:bg-gray-50 hover:-translate-y-1 cursor-pointer h-full">
              <CardContent className="p-8 flex flex-col items-center">
                <div className="mb-6">
                  <div className="text-interview-primary text-5xl">
                    <FileText className="w-12 h-12" />
                  </div>
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
