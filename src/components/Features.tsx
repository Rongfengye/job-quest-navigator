
import React from 'react';
import FeatureCard from './FeatureCard';
import { Target, Sparkles, Clock, CheckCircle } from 'lucide-react';

const Features = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto" id="features">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <FeatureCard 
          icon={<Target className="w-10 h-10" />}
          title="Discover Interview Questions"
          description="Generate unlimited practice interview questions based off of any job description and your resume so that the questions are custom to the job and your personal experience."
          delay="animation-delay-300"
          image={
            <div className="bg-gray-100 p-4 rounded-lg">
              <img 
                src="/lovable-uploads/9f5317f8-1c85-489f-9174-0f4305f9abd8.png" 
                alt="Interview questions example" 
                className="w-full h-auto rounded shadow-sm"
                style={{ maxHeight: "200px", objectFit: "cover" }}
              />
            </div>
          }
        />
        
        <FeatureCard 
          icon={<Sparkles className="w-10 h-10" />}
          title="Generate Answers With AI"
          description="Generate answers to interview questions based off of your previous work history to help you craft compelling responses that highlight your skills and experience."
          delay="animation-delay-600"
          image={
            <div className="bg-gray-100 p-4 rounded-lg">
              <img 
                src="/lovable-uploads/e238b653-4e3a-4c6a-8057-23a65b0d1dc0.png" 
                alt="AI generated answers example" 
                className="w-full h-auto rounded shadow-sm"
                style={{ maxHeight: "200px", objectFit: "cover" }}
              />
            </div>
          }
        />
        
        <FeatureCard 
          icon={<Clock className="w-10 h-10" />}
          title="Realistic AI Mock Interviews"
          description="Realistic mock interview experience by making you chat back and forth with an AI interviewer to replicate a real life interview scenario."
          delay="animation-delay-900"
          image={
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                <p className="text-gray-500 text-sm">Interactive mock interview simulation</p>
              </div>
            </div>
          }
        />
        
        <FeatureCard 
          icon={<CheckCircle className="w-10 h-10" />}
          title="Get Detailed Feedback"
          description="Get a detailed breakdown on your strengths and weaknesses and areas to improve so you can refine your interview skills and present your best self."
          delay="animation-delay-1200"
          image={
            <div className="bg-gray-100 p-4 rounded-lg">
              <div className="w-full h-32 bg-gray-200 rounded flex items-center justify-center">
                <p className="text-gray-500 text-sm">Personalized feedback reports</p>
              </div>
            </div>
          }
        />
      </div>
    </section>
  );
};

export default Features;
