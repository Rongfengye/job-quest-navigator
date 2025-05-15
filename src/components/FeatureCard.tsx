
import React from 'react';
import { cn } from '@/lib/utils';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
  image?: React.ReactNode;
  className?: string;
  imageClassName?: string;
};

const FeatureCard = ({ 
  icon, 
  title, 
  description, 
  delay = '', 
  image,
  className,
  imageClassName
}: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 shadow-md border border-gray-100 h-full flex flex-col transition-all hover:shadow-lg",
        "opacity-0 animate-fade-up",
        delay,
        className
      )}
    >
      <div className="mb-4 text-interview-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">{title}</h3>
      <p className="text-interview-text-secondary text-sm mb-6">{description}</p>
      {image && (
        <div className={cn("mt-auto bg-gray-100 rounded-lg overflow-hidden", imageClassName)}>
          {image}
        </div>
      )}
    </div>
  );
};

export default FeatureCard;
