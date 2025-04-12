
import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { ArrowRightCircle, Sparkles } from 'lucide-react';

interface GuidedResponseChatProps {
  questions: string[] | null;
  onResponseGenerated: (response: string) => void;
  isLoading: boolean;
}

const GuidedResponseChat: React.FC<GuidedResponseChatProps> = ({ 
  questions, 
  onResponseGenerated,
  isLoading
}) => {
  const [thoughts, setThoughts] = useState('');
  const [processingThoughts, setProcessingThoughts] = useState(false);

  if (!questions || questions.length === 0) {
    return null;
  }

  const handleSubmitThoughts = async () => {
    if (!thoughts.trim() || processingThoughts) return;
    
    setProcessingThoughts(true);
    
    try {
      // Dispatch custom event to notify useGuidedResponse hook
      const thoughtsEvent = new CustomEvent('thoughtsSubmitted', {
        detail: { thoughts }
      });
      window.dispatchEvent(thoughtsEvent);
      
      // Clear the thoughts input after submission
      setThoughts('');
    } catch (error) {
      console.error('Error submitting thoughts:', error);
    } finally {
      setProcessingThoughts(false);
    }
  };

  return (
    <div className="mt-6 border-t pt-6">
      <h3 className="text-lg font-semibold mb-2">Your Thoughts</h3>
      <p className="text-sm text-gray-600 mb-4">
        Share your thoughts on these questions, and I'll help craft them into a structured response.
      </p>
      
      <div className="space-y-4">
        <Textarea
          value={thoughts}
          onChange={(e) => setThoughts(e.target.value)}
          placeholder="Type your thoughts about these questions here..."
          className="min-h-[120px] resize-y"
        />
        
        <div className="flex justify-end">
          <Button
            onClick={handleSubmitThoughts}
            disabled={!thoughts.trim() || processingThoughts || isLoading}
            className="flex items-center gap-2"
          >
            <Sparkles className="h-4 w-4" />
            {processingThoughts ? 'Processing...' : 'Transform into Response'}
            <ArrowRightCircle className="ml-1 h-4 w-4" />
          </Button>
        </div>
      </div>
    </div>
  );
};

export default GuidedResponseChat;
