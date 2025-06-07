
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
      title: "Upload your application info"
    },
    {
      src: "/video-assets/Feedbackrecording.mov", 
      title: "Receive Custom Feedback"
    },
    {
      src: "/video-assets/CreateBehavioralFlow.mov",
      title: "Upload your resume and job description"
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
    <section className="py-20 px-6 bg-white">
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
            className="w-full max-w-md"
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
                      <div className="relative h-auto bg-white rounded-xl shadow-md w-[387px] pt-[30px] px-4 pb-[30px] -ml-[3px]">
                        <div className="flex flex-col relative min-h-[20px] min-w-[20px] w-full">
                          <div className="relative">
                            <video
                              ref={(el) => (videoRefs.current[index] = el)}
                              muted
                              controls={false}
                              playsInline
                              preload="metadata"
                              className="w-full h-full object-cover object-center rounded-[1px] mb-5"
                              onEnded={() => handleVideoEnd(index)}
                            >
                              <source
                                type="video/mp4"
                                src={video.src}
                              />
                            </video>
                          </div>
                        </div>
                        <span className="text-gray-800 text-xl font-semibold leading-7">
                          {video.title}
                        </span>
                      </div>
                    </div>
                  </div>
                </CarouselItem>
              ))}
            </CarouselContent>
            <CarouselPrevious />
            <CarouselNext />
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
                  ? 'bg-interview-primary'
                  : 'bg-gray-300 hover:bg-gray-400'
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
