import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Crown, TrendingUp, Target, Zap } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

interface PremiumNudgeProps {
  variant: 'usage-enhancement' | 'behavioral-banner' | 'post-practice-success';
  remainingPractices?: number;
  className?: string;
}

const PremiumNudge: React.FC<PremiumNudgeProps> = ({ 
  variant, 
  remainingPractices = 0,
  className = '' 
}) => {
  const navigate = useNavigate();

  if (variant === 'usage-enhancement') {
    return (
      <div className={`mt-4 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg ${className}`}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0">
            <Crown className="h-5 w-5 text-blue-600 mt-0.5" />
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-blue-900 mb-1">
              Accelerate Your Interview Success
            </h4>
            <p className="text-sm text-blue-700 mb-3">
              Premium members practice 3x more effectively with unlimited sessions and faster skill development.
            </p>
            <Button 
              size="sm"
              onClick={() => navigate('/settings')}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <TrendingUp className="w-4 h-4 mr-2" />
              Unlock Unlimited Practice
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (variant === 'behavioral-banner') {
    return (
      <Card className={`bg-gradient-to-r from-amber-50 to-orange-50 border-amber-200 mb-6 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Target className="h-6 w-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-amber-900 mb-1">
                You're Making Great Progress!
              </h3>
              <p className="text-sm text-amber-700 mb-3">
                {remainingPractices <= 2 
                  ? `Only ${remainingPractices} practice${remainingPractices === 1 ? '' : 's'} left this month. Keep your momentum going with unlimited access.`
                  : "Ready to accelerate your interview preparation? Get unlimited practice sessions."
                }
              </p>
              <Button 
                size="sm"
                onClick={() => navigate('/settings')}
                className="bg-amber-600 hover:bg-amber-700 text-white"
              >
                <Crown className="w-4 h-4 mr-2" />
                Continue Your Success
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (variant === 'post-practice-success') {
    return (
      <Card className={`bg-gradient-to-r from-green-50 to-emerald-50 border-green-200 ${className}`}>
        <CardContent className="p-4">
          <div className="flex items-center gap-3">
            <div className="flex-shrink-0">
              <Zap className="h-6 w-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-green-900 mb-1">
                Excellent Work! Ready for More?
              </h3>
              <p className="text-sm text-green-700 mb-3">
                You're building strong interview skills. Premium members typically see 2x faster improvement with unlimited practice.
              </p>
              <Button 
                size="sm"
                onClick={() => navigate('/settings')}
                className="bg-green-600 hover:bg-green-700 text-white"
              >
                <TrendingUp className="w-4 h-4 mr-2" />
                Accelerate Your Growth
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return null;
};

export default PremiumNudge;