import React from 'react';
import { Badge } from '@/components/ui/badge';
import { Shield, ExternalLink, Globe, Brain, Users, Star } from 'lucide-react';

interface SourceAttribution {
  source: string;
  reliability: number;
  category: string;
  platform?: string;
}

interface SourceBadgeProps {
  sourceAttribution?: SourceAttribution;
  showReliability?: boolean;
  className?: string;
}

export const SourceBadge: React.FC<SourceBadgeProps> = ({ 
  sourceAttribution, 
  showReliability = false,
  className = ""
}) => {
  if (!sourceAttribution) return null;

  const { source, reliability, category, platform } = sourceAttribution;
  
  const getSourceConfig = () => {
    const configs: Record<string, any> = {
      'glassdoor-verified': {
        icon: Shield,
        label: 'Glassdoor',
        variant: 'default',
        bgColor: 'bg-emerald-100',
        textColor: 'text-emerald-800',
        borderColor: 'border-emerald-300',
        description: 'Verified from Glassdoor interview experiences'
      },
      'blind-verified': {
        icon: Shield,
        label: 'Blind',
        variant: 'default',
        bgColor: 'bg-blue-100',
        textColor: 'text-blue-800',
        borderColor: 'border-blue-300',
        description: 'Verified from Blind professional forum'
      },
      'company-official': {
        icon: Shield,
        label: 'Official',
        variant: 'default',
        bgColor: 'bg-purple-100',
        textColor: 'text-purple-800',
        borderColor: 'border-purple-300',
        description: 'From official company sources'
      },
      'reddit-cscareerquestions': {
        icon: ExternalLink,
        label: 'Reddit CS',
        variant: 'secondary',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
        description: 'From r/cscareerquestions community'
      },
      'reddit-internships': {
        icon: ExternalLink,
        label: 'Reddit Intern',
        variant: 'secondary',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
        description: 'From r/internships community'
      },
      'reddit-company': {
        icon: ExternalLink,
        label: 'Reddit',
        variant: 'secondary',
        bgColor: 'bg-orange-100',
        textColor: 'text-orange-800',
        borderColor: 'border-orange-300',
        description: 'From company-specific Reddit discussions'
      },
      'forum-general': {
        icon: Globe,
        label: 'Forum',
        variant: 'secondary',
        bgColor: 'bg-gray-100',
        textColor: 'text-gray-800',
        borderColor: 'border-gray-300',
        description: 'From general professional forums'
      },
      'ai-generated': {
        icon: Brain,
        label: 'AI Generated',
        variant: 'outline',
        bgColor: 'bg-slate-100',
        textColor: 'text-slate-800',
        borderColor: 'border-slate-300',
        description: 'Generated based on job description and requirements'
      },
      'behavioral-practice-session': {
        icon: Users,
        label: 'Practice',
        variant: 'outline',
        bgColor: 'bg-violet-100',
        textColor: 'text-violet-800',
        borderColor: 'border-violet-300',
        description: 'From your previous practice session'
      }
    };
    
    return configs[source] || {
      icon: Globe,
      label: platform || 'External',
      variant: 'secondary',
      bgColor: 'bg-gray-100',
      textColor: 'text-gray-800',
      borderColor: 'border-gray-300',
      description: 'From external source'
    };
  };

  const config = getSourceConfig();
  const IconComponent = config.icon;
  const isHighReliability = reliability >= 4;

  return (
    <Badge 
      variant={config.variant}
      className={`${config.bgColor} ${config.textColor} ${config.borderColor} ${className}`}
      title={`${config.description} | Reliability: ${reliability}/5 | Category: ${category}`}
    >
      <IconComponent className="w-3 h-3 mr-1" />
      {config.label}
      {isHighReliability && (
        <Star className="w-3 h-3 ml-1 fill-current" />
      )}
      {showReliability && (
        <span className="ml-1 text-xs">({reliability}/5)</span>
      )}
    </Badge>
  );
};

export default SourceBadge;