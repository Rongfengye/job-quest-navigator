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
      description: "Lorem ipsum dolor sit amet, consectetur adipiscing elit. Sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit."
    },
    {
      src: "/video-assets/Feedbackrecording.mov", 
      title: "Receive Custom Feedback",
      description: "Vestibulum ante ipsum primis in faucibus orci luctus et ultrices posuere cubilia curae; Mauris viverra venenenatis lacus. Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium, totam rem aperiam, eaque ipsa quae ab illo inventore."
    },
    {
      src: "/video-assets/GenerateMoreIndividualQuestions.mov",
      title: "Practice more company specific questions",
      description: "Nulla facilisi morbi tempus iaculis urna id volutpat lacus laoreet. At varius vel pharetra vel turpis nunc eget lorem dolor. Pellentesque habitant morbi tristique senectus et netus et malesuada fames ac turpis egestas. Maecenas pharetra convallis posuere morbi leo urna."
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
                      <div className="relative h-auto bg-white rounded-xl shadow-md w-[80%] pt-[30px] px-6 pb-[30px]">
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
