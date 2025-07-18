import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, Calendar, TrendingUp } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface SoftUsageGateProps {
  usageType: 'behavioral' | 'question_vault';
  currentCount: number;
  limit: number;
  onContinue?: () => void;
  onWaitUntilNextMonth?: () => void;
  className?: string;
}

const SoftUsageGate: React.FC<SoftUsageGateProps> = ({ 
  usageType, 
  currentCount, 
  limit,
  onContinue,
  onWaitUntilNextMonth,
  className = '' 
}) => {
  const navigate = useNavigate();

  const usageTypeConfig = {
    behavioral: {
      emoji: '🔥',
      title: "You're on fire!",
      description: `You've completed all ${limit} monthly behavioral interview practices.`,
      feature: 'behavioral interview sessions',
      waitMessage: 'Your usage resets on the 1st of next month'
    },
    question_vault: {
      emoji: '🚀',
      title: "Amazing progress!",
      description: `You've used your ${limit} monthly question vault generation.`,
      feature: 'question vault generations',
      waitMessage: 'Your usage resets on the 1st of next month'
    }
  };

  const config = usageTypeConfig[usageType];

  return (
    <Card className={`bg-gradient-to-r from-indigo-50 to-blue-50 border-indigo-200 ${className}`}>
      <CardContent className="p-6 text-center">
        <div className="mb-4">
          <div className="text-4xl mb-3">{config.emoji}</div>
          <h3 className="text-xl font-semibold text-indigo-900 mb-2">
            {config.title}
          </h3>
          <p className="text-indigo-700 mb-4">
            {config.description} Ready to keep the momentum going?
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <Button 
            variant="outline"
            onClick={onWaitUntilNextMonth || (() => navigate('/dashboard'))}
            className="flex items-center gap-2 border-indigo-300 text-indigo-700 hover:bg-indigo-50"
          >
            <Calendar className="w-4 h-4" />
            Wait until next month
          </Button>
          
          <Button 
            onClick={onContinue || (() => navigate('/settings'))}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white"
          >
            <Crown className="w-4 h-4" />
            Get unlimited access
          </Button>
        </div>

        <div className="mt-4 pt-4 border-t border-indigo-200">
          <p className="text-sm text-indigo-600 flex items-center justify-center gap-1">
            <TrendingUp className="w-3 h-3" />
            {config.waitMessage}
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default SoftUsageGate;