
import React, { useState } from 'react';
import { X } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useFeedback } from '@/hooks/useFeedback';
import { QUICK_FEEDBACK_PROMPTS } from '@/types/feedback';
import type { FeedbackFormData } from '@/types/feedback';

interface FeedbackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const FeedbackModal: React.FC<FeedbackModalProps> = ({ isOpen, onClose }) => {
  const [formData, setFormData] = useState<FeedbackFormData>({
    feedback: '',
    email: '',
  });
  
  const { submitFeedback, isSubmitting, isAuthenticated } = useFeedback();

  const handleQuickPromptClick = (starter: string) => {
    setFormData(prev => ({
      ...prev,
      feedback: prev.feedback ? `${prev.feedback}\n\n${starter}` : starter,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.feedback.trim()) {
      return;
    }

    const success = await submitFeedback(formData);
    
    if (success) {
      setFormData({ feedback: '', email: '' });
      onClose();
    }
  };

  const resetForm = () => {
    setFormData({ feedback: '', email: '' });
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            Share your feedback
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClose}
              className="h-6 w-6 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Quick Prompts */}
          <div>
            <Label className="text-sm font-medium mb-2 block">
              Quick prompts (optional)
            </Label>
            <div className="grid grid-cols-1 gap-2">
              {QUICK_FEEDBACK_PROMPTS.map((prompt) => (
                <Button
                  key={prompt.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => handleQuickPromptClick(prompt.starter)}
                  className="justify-start text-left h-auto py-2 px-3 text-sm"
                >
                  {prompt.label}
                </Button>
              ))}
            </div>
          </div>

          {/* Email Input (for non-authenticated users) */}
          {!isAuthenticated && (
            <div>
              <Label htmlFor="feedback-email" className="text-sm font-medium">
                Email (optional)
              </Label>
              <Input
                id="feedback-email"
                type="email"
                placeholder="your@email.com"
                value={formData.email}
                onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                className="mt-1"
              />
            </div>
          )}

          {/* Feedback Textarea */}
          <div>
            <Label htmlFor="feedback-text" className="text-sm font-medium">
              Your feedback *
            </Label>
            <Textarea
              id="feedback-text"
              placeholder="Tell us what's on your mind..."
              value={formData.feedback}
              onChange={(e) => setFormData(prev => ({ ...prev, feedback: e.target.value }))}
              className="mt-1 min-h-[120px] resize-none"
              required
            />
          </div>

          {/* Submit Button */}
          <div className="flex justify-end space-x-2 pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting || !formData.feedback.trim()}
              className="min-w-[100px]"
            >
              {isSubmitting ? "Sending..." : "Send feedback"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
