
import React from 'react';
import { cn } from '@/lib/utils';

type FeatureCardProps = {
  icon: React.ReactNode;
  title: string;
  description: string;
  delay?: string;
  image?: React.ReactNode;
};

const FeatureCard = ({ icon, title, description, delay = '', image }: FeatureCardProps) => {
  return (
    <div 
      className={cn(
        "bg-white rounded-xl p-6 feature-card-shadow h-full flex flex-col",
        "opacity-0 animate-fade-up",
        delay
      )}
    >
      <div className="mb-4 text-interview-primary">{icon}</div>
      <h3 className="text-xl font-semibold mb-3 text-interview-text-primary">{title}</h3>
      <p className="text-interview-text-secondary text-sm mb-6">{description}</p>
      {image && (
        <div className="mt-auto bg-interview-card rounded-lg overflow-hidden">
          {image}
        </div>
      )}
    </div>
  );
};

export default FeatureCard;
