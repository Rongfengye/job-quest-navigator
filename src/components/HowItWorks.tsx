import React, { useState, useRef, useEffect } from "react";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
  type CarouselApi,
} from "@/components/ui/carousel";

const HowItWorks = () => {
  const [api, setApi] = useState<CarouselApi>();
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  const videoData = [
    {
      src: "/video-assets/CreateBehavioralFlow.mov",
      title: "Upload your application info",
      description: "Start by uploading your resume, job description, and any other relevant documents. Our AI analyzes your background and the role requirements to create personalized interview questions that match your experience and the position you're applying for."
    },
    {
      src: "/video-assets/BehavioralInterviewFlow.mov",
      title: "Practice Behavioral Interviews",
      description: "Transform your interview skills through immersive behavioral practice sessions. Answer real interview questions, learn to articulate your achievements effectively, and develop the confidence to showcase your experience in ways that resonate with Interviewers."
    },
    {
      src: "/video-assets/Feedbackrecording.mov", 
      title: "Receive Custom Feedback",
      description: "Practice answering behavioral questions and receive detailed, personalized feedback on your responses. Our AI evaluates your storytelling structure, relevance to the question, and overall delivery to help you improve your interview performance."
    },
    {
      src: "/video-assets/GenerateMoreIndividualQuestions.mov",
      title: "Practice more company specific questions",
      description: "Access an unlimited library of company-specific behavioral questions tailored to your target role. Practice with questions that are commonly asked at your dream company and refine your answers until you feel confident and prepared."
    },
    {
      src: "/video-assets/GuidedResponseTool.mov",
      title: "Get Guided Response Assistance",
      description: "Receive intelligent guidance and suggestions while crafting your interview responses. Our AI helps you structure your answers, suggests relevant examples from your experience, and ensures you're highlighting the most impactful aspects of your background."
    }
  ];

  // Handle video end to advance to next slide
  const handleVideoEnd = (videoIndex: number) => {
    if (videoIndex === currentSlideIndex && api) {
      const nextIndex = (currentSlideIndex + 1) % videoData.length;
      api.scrollTo(nextIndex);
    }
  };

  // Handle slide changes
  const handleSlideChange = () => {
    if (!api) return;
    
    const newIndex = api.selectedScrollSnap();
    setCurrentSlideIndex(newIndex);
    
    // Pause all videos
    videoRefs.current.forEach(video => {
      if (video) {
        video.pause();
        video.currentTime = 0;
      }
    });
    
    // Play current video
    const currentVideo = videoRefs.current[newIndex];
    if (currentVideo) {
      currentVideo.play();
    }
  };

  // Initialize carousel and start first video
  useEffect(() => {
    if (!api) return;

    api.on("select", handleSlideChange);
    
    // Start first video on component mount
    const firstVideo = videoRefs.current[0];
    if (firstVideo) {
      firstVideo.play();
    }

    return () => {
      api.off("select", handleSlideChange);
    };
  }, [api]);

  return (
    <section className="py-20 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-interview-text-primary mb-4">
            How It Works
          </h2>
        </div>

        {/* Carousel Container */}
        <div className="flex justify-center">
          <Carousel
            setApi={setApi}
            className="w-full max-w-4xl"
            opts={{
              align: "center",
              loop: true,
            }}
          >
            <CarouselContent>
              {videoData.map((video, index) => (
                <CarouselItem key={index}>
                  <div className="text-center">
                    <div className="mb-6 flex justify-center">
                      <div className="relative h-auto bg-white rounded-xl shadow-md w-[95%] pt-[30px] px-6 pb-[30px]">
                        <div className="flex flex-col relative min-h-[20px] min-w-[20px] w-full">
                          <div className="relative mb-5">
                            <video
                              ref={(el) => (videoRefs.current[index] = el)}
                              muted
                              controls={false}
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover object-center rounded-[1px]"
                              onEnded={() => handleVideoEnd(index)}
                            >
                              <source
                                type="video/mp4"
                                src={video.src}
                              />
                            </video>
                          </div>
                          <div className="text-center">
                            <h3 className="text-gray-800 text-xl font-semibold leading-7 mb-4">
                              {video.title}
                            </h3>
                            <p className="text-gray-600 text-sm leading-relaxed">
                              {video.description}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious className="bg-white hover:bg-gray-50 border-gray-200 shadow-md" />
            <CarouselNext className="bg-white hover:bg-gray-50 border-gray-200 shadow-md" />
          </Carousel>
        </div>

        {/* Progress Tracker */}
        <div className="flex justify-center mt-8 space-x-2">
          {videoData.map((_, index) => (
            <button
              key={index}
              onClick={() => api?.scrollTo(index)}
              className={`w-3 h-3 rounded-full transition-all duration-300 ${
                index === currentSlideIndex
                  ? 'bg-interview-primary shadow-md'
                  : 'bg-white/70 hover:bg-white border border-gray-200'
              }`}
              aria-label={`Go to video ${index + 1}`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default HowItWorks;
