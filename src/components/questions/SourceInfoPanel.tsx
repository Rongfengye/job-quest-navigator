import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Shield, ExternalLink, Globe, Brain, Users, Star, Info, ChevronDown, ChevronUp } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface SourceInfoPanelProps {
  questions: Array<{
    question: string;
    sourceAttribution?: {
      source: string;
      reliability: number;
      category: string;
      platform?: string;
    };
  }>;
}

export const SourceInfoPanel: React.FC<SourceInfoPanelProps> = ({ questions }) => {
  const [isOpen, setIsOpen] = React.useState(false);
  // Analyze question sources
  const sourceAnalytics = questions.reduce((acc, question) => {
    const source = question.sourceAttribution?.source || 'unknown';
    if (!acc[source]) {
      acc[source] = {
        count: 0,
        avgReliability: 0,
        totalReliability: 0,
      };
    }
    acc[source].count += 1;
    if (question.sourceAttribution) {
      acc[source].totalReliability += question.sourceAttribution.reliability;
      acc[source].avgReliability = acc[source].totalReliability / acc[source].count;
    }
    return acc;
  }, {} as Record<string, { count: number; avgReliability: number; totalReliability: number }>);

  const getSourceIcon = (source: string) => {
    const iconMap: Record<string, React.ElementType> = {
      'glassdoor-verified': Shield,
      'blind-verified': Shield,
      'company-official': Shield,
      'reddit-cscareerquestions': ExternalLink,
      'reddit-internships': ExternalLink,
      'reddit-company': ExternalLink,
      'forum-general': Globe,
      'ai-generated': Brain,
      'behavioral-practice-session': Users,
    };
    return iconMap[source] || Globe;
  };

  const getSourceLabel = (source: string) => {
    const labelMap: Record<string, string> = {
      'glassdoor-verified': 'Glassdoor (Verified)',
      'blind-verified': 'Blind (Verified)',
      'company-official': 'Company Official',
      'reddit-cscareerquestions': 'Reddit r/cscareerquestions',
      'reddit-internships': 'Reddit r/internships',
      'reddit-company': 'Reddit Company-specific',
      'forum-general': 'General Forums',
      'ai-generated': 'AI Generated',
      'behavioral-practice-session': 'Practice Session',
    };
    return labelMap[source] || source;
  };

  const totalQuestions = questions.length;
  const realQuestions = questions.filter(q => 
    q.sourceAttribution?.source && 
    !['ai-generated', 'behavioral-practice-session'].includes(q.sourceAttribution.source)
  ).length;

  if (totalQuestions === 0) return null;

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Info className="w-5 h-5" />
          Question Sources & Authenticity
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Info className="w-4 h-4 text-gray-400 cursor-help" />
              </TooltipTrigger>
              <TooltipContent className="max-w-xs">
                <p className="text-sm">
                  We gather questions either from real user reports online (Glassdoor, Blind, Reddit) 
                  or from your own practice sessions using our AI coach.
                </p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="flex flex-wrap gap-4 text-sm">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-600" />
              <span className="font-medium">{realQuestions}/{totalQuestions}</span>
              <span className="text-gray-600">real interview questions found</span>
            </div>
            <div className="flex items-center gap-2">
              <Star className="w-4 h-4 text-yellow-500" />
              <span className="font-medium">
                {Math.round(
                  Object.values(sourceAnalytics).reduce((acc, curr) => acc + curr.avgReliability, 0) / 
                  Object.keys(sourceAnalytics).length
                )}/5
              </span>
              <span className="text-gray-600">average reliability</span>
            </div>
          </div>

          {/* Source Breakdown - Collapsible */}
          <Collapsible open={isOpen} onOpenChange={setIsOpen}>
            <CollapsibleTrigger className="flex items-center justify-between w-full hover:bg-gray-50 p-2 rounded transition-colors">
              <h4 className="font-medium text-sm text-gray-700">Source Breakdown</h4>
              {isOpen ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
            </CollapsibleTrigger>
            <CollapsibleContent className="pt-2">
              <div className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {Object.entries(sourceAnalytics)
                    .sort(([,a], [,b]) => b.count - a.count)
                    .map(([source, data]) => {
                      const IconComponent = getSourceIcon(source);
                      const isHighReliability = data.avgReliability >= 4;
                      
                      return (
                        <div key={source} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                          <div className="flex items-center gap-2">
                            <IconComponent className="w-4 h-4 text-gray-600" />
                            <span className="text-sm font-medium">{getSourceLabel(source)}</span>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="secondary" className="text-xs">
                              {data.count} questions
                            </Badge>
                            {data.avgReliability > 0 && (
                              <Badge 
                                variant={isHighReliability ? "default" : "outline"}
                                className="text-xs"
                              >
                                {Math.round(data.avgReliability)}/5
                                {isHighReliability && <Star className="w-3 h-3 ml-1 fill-current" />}
                              </Badge>
                            )}
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </CollapsibleContent>
          </Collapsible>

          {/* Legend */}
          <div className="pt-3 border-t">
            <p className="text-xs text-gray-500">
              <strong>Reliability Scale:</strong> 5/5 = Official/Verified sources, 4/5 = Community verified, 3/5 = General forums, 2/5 = AI generated
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default SourceInfoPanel;