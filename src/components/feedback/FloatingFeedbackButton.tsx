
import React, { useState, useEffect } from 'react';
import { MessageCircle } from 'lucide-react';
import { Button } from "@/components/ui/button";
import { FeedbackModal } from './FeedbackModal';

export const FloatingFeedbackButton: React.FC = () => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showPulse, setShowPulse] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setShowPulse(false), 10000);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      <Button
        onClick={() => setIsModalOpen(true)}
        className={`fixed bottom-6 right-6 z-50 h-21 w-21 rounded-full shadow-lg hover:shadow-xl transition-all duration-200 hover:scale-105 flex items-center justify-center ${showPulse ? 'animate-pulse-glow' : ''}`}
        size="icon"
        aria-label="Share feedback"
      >
        <MessageCircle className="h-9 w-9" />
      </Button>
      <FeedbackModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </>
  );
};
