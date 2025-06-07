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
              <div className="relative h-auto bg-white rounded-xl shadow-md w-[387px] -mt-[5px] -mb-[5px] -ml-[3px] pt-[30px] px-4 pb-[30px]">
                <div className="flex flex-col relative mt-5 min-h-[20px] min-w-[20px] w-full">
                  <div className="relative">
                    <video
                      autoPlay
                      muted
                      controls={false}
                      playsInline
                      loop
                      className="w-full h-full object-cover object-center rounded-[1px] relative flex flex-col mt-5 min-h-[20px] min-w-[20px]"
                    >
                      <source
                        type="video/mp4"
                        src="https://cdn.builder.io/o/assets%2Fb8e315bfeb1c42d1adbc4bb65543fa63%2F2ce2eb36b6884f168a9e3b27ae824d8a?alt=media&token=af5fdf7d-c8b5-47a5-8864-fdec10c7a867&apiKey=b8e315bfeb1c42d1adbc4bb65543fa63"
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
