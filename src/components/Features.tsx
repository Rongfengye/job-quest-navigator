
import React from 'react';
import FeatureCard from './FeatureCard';
import { Target, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

const Features = () => {
  return (
    <section className="py-20 px-6 max-w-7xl mx-auto" id="features">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* First row - left column empty, right column has Discover Interview Questions */}
        <div className="hidden md:block">
          {/* Deliberately empty column for layout purposes */}
        </div>
        
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
        
        {/* Horizontal separator between rows */}
        <div className="col-span-1 md:col-span-2 my-8">
          <Separator className="bg-gray-200" />
        </div>
        
        {/* Second row - Get Real-time Feedback on the left */}
        <FeatureCard 
          icon={<Sparkles className="w-10 h-10" />}
          title="Get Real-time Feedback"
          description="Receive immediate, personalized feedback on your interview responses to help you improve your delivery, content, and overall interview performance before the real thing."
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
        
        <div className="hidden md:block">
          {/* Deliberately empty column for layout purposes */}
        </div>
      </div>
    </section>
  );
};

export default Features;
