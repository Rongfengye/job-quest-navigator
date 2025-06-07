
import React from 'react';
import { Card, CardContent } from '@/components/ui/card';

const Testimonials = () => {
  const testimonials = [
    {
      quote: "Storyline helped me feel more confident and prepared for my interviews. The personalized questions were exactly what I needed to practice.",
      name: "Jonathan Chung",
      role: "Tax Technology Intern at PwC"
    },
    {
      quote: "The personalized questions were spot on. I landed my dream job thanks to Storyline's targeted interview preparation.",
      name: "Alexander Eum", 
      role: "Software Engineer Intern at IMC"
    },
    {
      quote: "The real-time feedback was incredibly valuable. I could improve immediately and see my progress with each practice session.",
      name: "Dylan Lai",
      role: "Technology Analyst at Accenture"
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
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <Card key={index} className="shadow-md border-0">
              <CardContent className="p-8">
                <div className="text-center">
                  {/* Quote */}
                  <blockquote className="text-gray-700 text-lg leading-relaxed mb-6">
                    "{testimonial.quote}"
                  </blockquote>
                  
                  {/* Author Info */}
                  <div>
                    <h4 className="font-semibold text-interview-text-primary text-lg">
                      {testimonial.name}
                    </h4>
                    <p className="text-gray-600 text-sm">
                      {testimonial.role}
                    </p>
                  </div>
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
