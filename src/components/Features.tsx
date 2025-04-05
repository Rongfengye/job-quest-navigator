
import React from 'react';
import { Target, Sparkles } from 'lucide-react';
import { Separator } from '@/components/ui/separator';

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
    </section>
  );
};

export default Features;
