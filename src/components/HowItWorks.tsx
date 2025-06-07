import React from "react";
import { FileText, Monitor, ChartBar } from "lucide-react";

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
              <div className="relative h-auto bg-white rounded-xl shadow-md w-[387px] pt-[30px] px-4 pb-[30px] -ml-[3px]">
                <div className="flex flex-col relative min-h-[20px] min-w-[20px] w-full">
                  <div className="relative">
                    <video
                      autoPlay
                      muted
                      controls={false}
                      playsInline
                      loop
                      className="w-full h-full object-cover object-center rounded-[1px] mb-5"
                    >
                      <source
                        type="video/mp4"
                        src="/video-assets/CreateBehavioralFlow.mov"
                      />
                    </video>
                  </div>
                </div>
                <span className="text-gray-800 text-xl font-semibold leading-7">
                  Upload your application info
                </span>
              </div>
            </div>
          </div>

          {/* Step 2: Practice */}
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative h-auto bg-white rounded-xl shadow-md w-[387px] pt-[30px] px-4 pb-[30px] -ml-[3px]">
                <div className="flex flex-col relative min-h-[20px] min-w-[20px] w-full">
                  <div className="relative">
                    <video
                      autoPlay
                      muted
                      controls={false}
                      playsInline
                      loop
                      className="w-full h-full object-cover object-center rounded-[1px] mb-5"
                    >
                      <source
                        type="video/mp4"
                        src="/video-assets/Feedbackrecording.mov"
                      />
                    </video>
                  </div>
                </div>
                <span className="text-gray-800 text-xl font-semibold leading-7">
                  Receive Custom Feedback
                </span>
              </div>
            </div>
          </div>

          {/* Step 3: Feedback */}
          <div className="text-center">
            <div className="mb-6 flex justify-center">
              <div className="relative h-auto bg-white rounded-xl shadow-md w-[387px] pt-[30px] px-4 pb-[30px] -ml-[3px]">
                <div className="flex flex-col relative min-h-[20px] min-w-[20px] w-full">
                  <div className="relative">
                    <video
                      autoPlay
                      muted
                      controls={false}
                      playsInline
                      loop
                      className="w-full h-full object-cover object-center rounded-[1px] mb-5"
                    >
                      <source
                        type="video/mp4"
                        src="/video-assets/CreateBehavioralFlow.mov"
                      />
                    </video>
                  </div>
                </div>
                <span className="text-gray-800 text-xl font-semibold leading-7">
                  Upload your resume and job description
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
