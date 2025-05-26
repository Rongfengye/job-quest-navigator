
import React from 'react';
import { FileText, Monitor, ChartBar } from 'lucide-react';

const HowItWorks = () => {
  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-interview-text-primary mb-4">
            How It Works
          </h2>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-12">
          {/* Step 1: Upload */}
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-white rounded-xl shadow-md flex items-center justify-center">
                <FileText className="w-12 h-12 text-interview-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">
              Upload your resume and job description
            </h3>
          </div>

          {/* Step 2: Practice */}
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-white rounded-xl shadow-md flex items-center justify-center">
                <Monitor className="w-12 h-12 text-interview-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">
              Get a tailored practice session
            </h3>
          </div>

          {/* Step 3: Feedback */}
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="w-24 h-24 bg-white rounded-xl shadow-md flex items-center justify-center">
                <ChartBar className="w-12 h-12 text-interview-primary" />
              </div>
            </div>
            <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">
              Receive guided coaching and feedback
            </h3>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
