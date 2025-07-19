
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, Briefcase, Calendar, FileText, Plus, Play } from 'lucide-react';
import { analyzeInterviewState } from '@/utils/interviewStateUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useUserTokens } from '@/hooks/useUserTokens';
import PremiumNudge from '@/components/PremiumNudge';

interface BehavioralInterview {
  id: string;
  job_title: string;
  job_description: string;
  company_name: string | null;
  company_description: string | null;
  created_at: string;
  feedback: any;
  questions: any;
  responses: any;
  resume_path: string;
  cover_letter_path: string | null;
  additional_documents_path: string | null;
  _technical_count?: number;
}

const Behavioral = () => {
  const navigate = useNavigate();
  const { usageSummary, isLoadingUsage, isPremium, isBasic, fetchUserStatus } = useUserTokens();

  // Phase 3: Smart sync on premium feature entry
  React.useEffect(() => {
    fetchUserStatus('behavioral_page_entry');
  }, [fetchUserStatus]);

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['behavioral-interviews'],
    queryFn: async () => {
      // Single optimized query with LEFT JOIN to get behavioral interviews and their technical practice counts
      const { data, error } = await supabase
        .from('storyline_behaviorals')
        .select(`
          id,
          job_title,
          job_description,
          company_name,
          company_description,
          created_at,
          feedback,
          questions,
          responses,
          resume_path,
          cover_letter_path,
          additional_documents_path,
          storyline_jobs!storyline_jobs_behavioral_id_fkey(id)
        `)
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Transform the data to match the expected interface
      const enhancedBehaviorals = (data || []).map(behavioral => ({
        ...behavioral,
        _technical_count: behavioral.storyline_jobs?.length || 0
      }));
      
      return enhancedBehaviorals as BehavioralInterview[];
    }
  });
  
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return format(date, 'MMM d, yyyy');
  };

  const getInterviewBadge = (interview: BehavioralInterview) => {
    const state = analyzeInterviewState(interview.questions, interview.responses, interview.feedback);
    
    if (state.status === 'complete') {
      return (
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50">
          Complete
        </Badge>
      );
    } else if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
            Processing
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50">
          Question {state.currentQuestionIndex + 1} of 5
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50">
          Not Started
        </Badge>
      );
    }
  };

  const handleInterviewCardClick = (interview: BehavioralInterview) => {
    const state = analyzeInterviewState(interview.questions, interview.responses, interview.feedback);
    
    if (state.status === 'complete') {
      navigate(`/behavioralFeedback?id=${interview.id}`);
    } else if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        navigate(`/behavioralFeedback?id=${interview.id}`);
      } else {
        navigate('/behavioral/interview', {
          state: {
            isResuming: true,
            behavioralId: interview.id,
            resumePath: interview.resume_path,
            coverLetterPath: interview.cover_letter_path,
            additionalDocumentsPath: interview.additional_documents_path,
            formData: {
              jobTitle: interview.job_title,
              jobDescription: interview.job_description,
              companyName: interview.company_name || '',
              companyDescription: interview.company_description || ''
            }
          }
        });
      }
    } else {
      navigate(`/behavioralFeedback?id=${interview.id}`);
    }
  };

  const getCardButtonText = (interview: BehavioralInterview) => {
    const state = analyzeInterviewState(interview.questions, interview.responses, interview.feedback);
    
    if (state.status === 'complete') {
      return {
        icon: FileText,
        text: 'View Feedback'
      };
    } 
    
    if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        return {
          icon: FileText,
          text: 'Processing Feedback'
        };
      }
      return {
        icon: Play,
        text: 'Resume Interview'
      };
    } 
    
    return {
      icon: FileText,
      text: 'View Details'
    };
  };

  const hasData = (interviews && interviews.length > 0);

  return (
    <DashboardLayout>
      <div className="min-h-screen p-6">
        <div className="w-full max-w-6xl mx-auto">
          {isLoading ? (
            <div className="space-y-4">
              <div className="h-10 bg-gray-200 rounded w-1/3 mb-8 animate-pulse"></div>
              {[1, 2, 3].map(i => (
                <div key={i} className="bg-white rounded-lg border border-gray-200 p-6 animate-pulse">
                  <div className="h-6 bg-gray-200 rounded w-1/3 mb-4"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded w-1/5"></div>
                </div>
              ))}
            </div>
          ) : hasData ? (
            <>
              {/* Header for users with data */}
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                <div>
                  <h1 className="text-5xl font-bold text-interview-primary leading-tight">
                    Behavioral Interview
                    <br />
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-2">Manage your interview preparation</p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate('/behavioral/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Practice
                </Button>
              </div>

              {/* Premium Nudge Banner for Basic Users */}
              {isBasic && !isLoadingUsage && usageSummary && usageSummary.behavioral.remaining <= 2 && (
                <PremiumNudge 
                  variant="behavioral-banner" 
                  remainingPractices={usageSummary.behavioral.remaining}
                />
              )}

              {/* Practice Sessions Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Briefcase className="h-6 w-6" />
                  Previous Practice Sessions
                </h2>
                
                <div className="space-y-3">
                  {interviews.map(interview => {
                    const ButtonComponent = getCardButtonText(interview);
                    const hasTechnicalPractices = interview._technical_count && interview._technical_count > 0;

                    const practiceRow = (
                      <div 
                        className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleInterviewCardClick(interview)}
                      >
                        <div className="p-4">
                          <div className="flex justify-between items-center">
                            <div className="flex-1 mr-4">
                              <h3 className="text-lg font-bold text-gray-900 truncate">
                                {interview.job_title}
                              </h3>
                              {interview.company_name && (
                                <p className="text-base text-gray-600">
                                  {interview.company_name}
                                </p>
                              )}
                            </div>
                            
                            <div className="flex items-center gap-4 shrink-0">
                              {getInterviewBadge(interview)}
                              <Button variant="outline" size="sm" className="shrink-0">
                                <ButtonComponent.icon className="h-4 w-4 mr-2" />
                                {ButtonComponent.text}
                              </Button>
                            </div>
                          </div>
                        </div>
                      </div>
                    );

                    if (hasTechnicalPractices) {
                      return (
                        <Tooltip key={interview.id} delayDuration={100}>
                          <TooltipTrigger asChild>
                            {practiceRow}
                          </TooltipTrigger>
                          <TooltipContent>
                            <div className="flex items-center">
                              <Book className="h-4 w-4 mr-2" />
                              <p>
                                {interview._technical_count} related {interview._technical_count === 1 ? 'practice' : 'practices'}
                              </p>
                            </div>
                          </TooltipContent>
                        </Tooltip>
                      );
                    }

                    return (
                      <div key={interview.id}>
                        {practiceRow}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            // Empty State View from previous design
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold text-slate-900">Behavioral Interview Dashboard</h1>
                  <p className="text-muted-foreground mt-1">Manage your interview preparation</p>
                </div>
              </div>
              <div className="bg-gray-50 rounded-lg border border-dashed p-12 flex flex-col items-center justify-center text-center">
                <Briefcase className="h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-xl font-semibold text-gray-800 mb-2">No practice sessions yet</h3>
                <p className="text-gray-500 mb-6 max-w-sm">
                  Create your first behavioral practice to receive personalized feedback.
                </p>
                <Button 
                    onClick={() => navigate('/behavioral/create')}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                    <Plus className="h-4 w-4 mr-2" />
                    Start Practice
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Behavioral;
