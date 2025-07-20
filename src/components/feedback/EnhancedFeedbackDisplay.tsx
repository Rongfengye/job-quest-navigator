import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { CheckCircle, XCircle, Lightbulb, TrendingUp, Star, Target } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnhancedFeedbackData, ScoreBreakdown, isEnhancedFeedback, FeedbackData } from '@/types/enhancedFeedback';

interface EnhancedFeedbackDisplayProps {
  feedback: FeedbackData;
  questionIndex?: number;
}

const ScoreBreakdownChart: React.FC<{ breakdown: ScoreBreakdown; confidence: number }> = ({ breakdown, confidence }) => {
  const dimensions = [
    { key: 'structure', label: 'STAR Structure', value: breakdown.structure },
    { key: 'clarity', label: 'Clarity', value: breakdown.clarity },
    { key: 'relevance', label: 'Relevance', value: breakdown.relevance },
    { key: 'specificity', label: 'Specificity', value: breakdown.specificity },
    { key: 'professionalism', label: 'Professionalism', value: breakdown.professionalism }
  ];

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'bg-green-500';
    if (score >= 60) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-blue-200 bg-blue-50/30">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Score Breakdown
          </span>
          <div className="flex items-center gap-1">
            <Star className="h-3 w-3 text-blue-600" />
            <span className={`text-xs font-medium ${getConfidenceColor(confidence)}`}>
              {Math.round(confidence * 100)}% confidence
            </span>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          {dimensions.map(({ key, label, value }) => (
            <div key={key} className="space-y-1">
              <div className="flex justify-between text-xs">
                <span className="font-medium text-gray-700">{label}</span>
                <span className="text-gray-600">{value}/100</span>
              </div>
              <Progress 
                value={value} 
                className="h-2"
                style={{
                  ['--progress-background' as any]: value >= 80 ? '#10b981' : value >= 60 ? '#f59e0b' : '#ef4444'
                }}
              />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

const EnhancedFeedbackDisplay: React.FC<EnhancedFeedbackDisplayProps> = ({ feedback, questionIndex }) => {
  const enhanced = isEnhancedFeedback(feedback);

  return (
    <div className="space-y-4">
      {/* Competency Focus (Enhanced only) */}
      {enhanced && (
        <div className="flex items-center gap-2 mb-4">
          <Target className="h-4 w-4 text-purple-600" />
          <span className="text-sm font-medium text-purple-800">
            Competency Focus: <span className="font-normal">{feedback.competencyFocus}</span>
          </span>
        </div>
      )}

      {/* Score Breakdown (Enhanced only) */}
      {enhanced && (
        <ScoreBreakdownChart breakdown={feedback.scoreBreakdown} confidence={feedback.confidence} />
      )}

      {/* Overall Score */}
      <div className="flex items-center justify-between">
        <span className="font-medium text-gray-700">Overall Score</span>
        <Badge className={`${feedback.score >= 80 ? 'bg-green-500' : feedback.score >= 60 ? 'bg-yellow-500' : 'bg-red-500'} text-white`}>
          {feedback.score}/100
        </Badge>
      </div>

      {/* Strengths Section */}
      <div>
        <h4 className="font-semibold text-md flex items-center gap-2 mb-3 text-green-700">
          <CheckCircle className="h-4 w-4" /> 
          Strengths
        </h4>
        <div className="flex flex-wrap gap-2">
          {feedback.pros.map((pro, index) => (
            <Badge 
              key={`pro-${index}`} 
              variant="secondary" 
              className="bg-green-100 text-green-800 border-green-300 text-sm px-3 py-1.5 rounded-full"
            >
              {pro}
            </Badge>
          ))}
        </div>
      </div>

      {/* Areas for Improvement Section */}
      <div>
        <h4 className="font-semibold text-md flex items-center gap-2 mb-3 text-red-700">
          <XCircle className="h-4 w-4" /> 
          Areas for Improvement
        </h4>
        <div className="flex flex-wrap gap-2">
          {feedback.cons.map((con, index) => (
            <Badge 
              key={`con-${index}`} 
              variant="secondary" 
              className="bg-red-100 text-red-800 border-red-300 text-sm px-3 py-1.5 rounded-full"
            >
              {con}
            </Badge>
          ))}
        </div>
      </div>

      {/* Improvement Suggestions */}
      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
        <h4 className="font-semibold text-md mb-2 flex items-center gap-2 text-blue-800">
          <Lightbulb className="h-4 w-4" />
          Suggestions
        </h4>
        <p className="text-blue-700 text-sm leading-relaxed">
          {feedback.suggestions || 
           (feedback as any).improvementSuggestions || 
           'No specific suggestions available'}
        </p>
      </div>

      {/* Overall Assessment */}
      {feedback.overall && (
        <div className="bg-gray-50 p-4 rounded-lg border border-gray-200">
          <h4 className="font-semibold text-md mb-2 text-gray-800">
            Overall Assessment
          </h4>
          <p className="text-gray-700 text-sm leading-relaxed">{feedback.overall}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedFeedbackDisplay;