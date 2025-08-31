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
    if (score >= 80) return 'bg-green-100 text-green-700';
    if (score >= 60) return 'bg-yellow-100 text-yellow-700';
    return 'bg-orange-100 text-orange-700';
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.8) return 'text-green-600';
    if (confidence >= 0.6) return 'text-yellow-600';
    return 'text-red-600';
  };

  return (
    <Card className="border-0 bg-gray-50 shadow-sm rounded-lg">
      <CardHeader className="pb-3">
        <CardTitle className="text-sm font-medium flex items-center justify-between">
          <span className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-blue-600" />
            Score Breakdown
          </span>
          {/* AI confidence moved to tooltip or removed entirely */}
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
                className="h-1.5 bg-gray-200"
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
        <Badge className={`${getScoreColor(feedback.score)}`}>
          {feedback.score}/100
        </Badge>
      </div>

      {/* Strengths Section */}
      <div className="border-l-4 border-green-200 pl-4">
        <h4 className="font-medium text-sm flex items-center gap-2 mb-2 text-gray-700">
          <CheckCircle className="h-4 w-4 text-green-600" /> 
          Strengths
        </h4>
        <ul className="space-y-1">
          {feedback.pros.map((pro, index) => (
            <li key={`pro-${index}`} className="text-sm text-gray-600">
              ✓ {pro}
            </li>
          ))}
        </ul>
      </div>

      {/* Areas for Improvement Section */}
      <div className="border-l-4 border-orange-200 pl-4">
        <h4 className="font-medium text-sm flex items-center gap-2 mb-2 text-gray-700">
          <XCircle className="h-4 w-4 text-orange-600" /> 
          Areas for Improvement
        </h4>
        <ul className="space-y-1">
          {feedback.cons.map((con, index) => (
            <li key={`con-${index}`} className="text-sm text-gray-600">
              ⚠ {con}
            </li>
          ))}
        </ul>
      </div>

      {/* Improvement Suggestions */}
      <div className="border-l-4 border-blue-200 pl-4">
        <h4 className="font-medium text-sm mb-2 flex items-center gap-2 text-gray-700">
          <Lightbulb className="h-4 w-4 text-blue-600" />
          Suggestions
        </h4>
        <p className="text-sm text-gray-600 leading-relaxed">
          💡 {feedback.suggestions || 
           (feedback as any).improvementSuggestions || 
           'No specific suggestions available'}
        </p>
      </div>

      {/* Overall Assessment */}
      {feedback.overall && (
        <div className="bg-gray-50 p-4 rounded-lg">
          <h4 className="font-medium text-sm mb-2 text-gray-700">
            Overall Assessment
          </h4>
          <p className="text-sm text-gray-600 leading-relaxed">{feedback.overall}</p>
        </div>
      )}
    </div>
  );
};

export default EnhancedFeedbackDisplay;