
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Linkedin } from 'lucide-react';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "As someone who's gone through the rigorous interview process at top tech companies, I know how overwhelming it can feel to prepare. Storyline made the process much more structured and less intimidating.\n\nThe interactive prep tools helped me practice common interview questions, refine my responses, and build confidence in telling my story. It felt like I had a coach guiding me at every step. \n\n Thanks to Storyline, I walked into my interviews feeling prepared, and it played a huge role in helping me land my role at Google and boosted my confidence overall! Highly recommend :)",
      name: "Aashna Doshi",
      role: "Software Engineer at Google",
      additionalRole: "Podcast Host '0 to 1'",
      image: "/lovable-uploads/aashna.jpeg",
      linkedin: "https://www.linkedin.com/in/aashnadoshi/"
    },
    {
      quote: "As a first-generation college student, I had no roadmap for navigating the recruiting space. I had experiences worth sharing but struggled to articulate them in ways that resonated with recruiters.\n\nStoryline helped me transform my unique journey into powerful stories that authentically conveyed who I am. The personalized questions and structured practice gave me the confidence to own my narrative. \n\n With Storyline, I secured opportunities I once thought were out of reach and landed my dream roles in tech.",
      name: "Alexander Eum", 
      role: "Incoming Software Engineer at Optiver",
      additionalRole: "Software Engineer Intern at IMC",
      image: "/lovable-uploads/alexEum.jpeg",
      linkedin: "https://www.linkedin.com/in/alexander-eum/"
    },
    {
      quote: "As a sophomore trying to break into finance, I wasn't sure where to start with interviews and networking. Storyline gave me a clear framework to prepare. From behavioral interview practice to mock technical questions, it helped me structure my answers and improve with each session.\n\nWhat I loved most was how easy it was to track my progress and see my confidence grow. Using Storyline not only helped me ace interviews but also opened doors to new opportunities I didn't think I'd have this early in my career.",
      name: "Parshva Shah",
      role: "Growth at Spotlight Realty (YC S25)",
      additionalRole: "Business Analyst at RareLiquid",
      image: "/lovable-uploads/parshva.jpeg",
      linkedin: "https://www.linkedin.com/in/parshvashah123/"
    }
  ];

  return (
    <section className="py-20 px-6 bg-white">
      <div className="max-w-7xl mx-auto">
        {/* Section Header */}
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-interview-text-primary mb-4">
            What Job Seekers Are Saying
          </h2>
        </div>

        {/* Three Column Layout */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-sm hover:shadow-md transition-shadow border border-gray-100 h-full flex flex-col">
              <CardContent className="p-6 flex flex-col h-full">
                {/* Header with Image and LinkedIn */}
                <div className="flex items-start justify-between mb-4">
                  <img 
                    src={testimonial.image} 
                    alt={testimonial.name}
                    className="w-16 h-16 rounded-full object-cover"
                  />
                  <a 
                    href={testimonial.linkedin}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-gray-400 hover:text-blue-600 transition-colors"
                    aria-label={`Visit ${testimonial.name}'s LinkedIn profile`}
                  >
                    <Linkedin className="w-5 h-5" />
                  </a>
                </div>
                
                {/* Quote with custom styling - flex-grow to push author to bottom */}
                <div className="mb-4 flex-grow">
                  <div className="text-gray-400 text-4xl leading-none mb-2">"</div>
                  <div className="text-gray-700 text-sm leading-relaxed -mt-3 space-y-3">
                    {testimonial.quote.split('\n\n').map((paragraph, idx) => (
                      <p key={idx}>{paragraph}</p>
                    ))}
                  </div>
                </div>
                
                {/* Author Info - Always at bottom */}
                <div className="space-y-1">
                  <h4 className="font-semibold text-interview-text-primary text-base">
                    {testimonial.name}
                  </h4>
                  <p className="text-gray-600 text-xs leading-snug">
                    {testimonial.role}
                    {testimonial.additionalRole && (
                      <>
                        <span className="text-gray-400 mx-1">•</span>
                        {testimonial.additionalRole}
                      </>
                    )}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
