
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Book, Briefcase, Calendar, FileText, Plus, Play, CheckCircle, Clock, AlertCircle, Loader, X } from 'lucide-react';
import { analyzeInterviewState } from '@/utils/interviewStateUtils';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { usePlanStatus } from '@/hooks/usePlanStatus';
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
  const { usageSummary, isLoadingUsage, isPremium, isBasic, fetchUserStatus } = usePlanStatus();
  const [showExampleSession, setShowExampleSession] = useState(false);

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
        <Badge variant="outline" className="border-green-500 text-green-700 bg-green-50 flex items-center gap-1">
          <CheckCircle className="h-3 w-3" />
          Complete
        </Badge>
      );
    } else if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        return (
          <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50 flex items-center gap-1">
            <Loader className="h-3 w-3 animate-spin" />
            Processing
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="border-orange-500 text-orange-700 bg-orange-50 flex items-center gap-1">
          <Clock className="h-3 w-3" />
          Question {state.currentQuestionIndex + 1} of 5
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-gray-400 text-gray-600 bg-gray-50 flex items-center gap-1">
          <AlertCircle className="h-3 w-3" />
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
        text: 'View Feedback',
        variant: 'secondary' as const
      };
    } 
    
    if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        return {
          icon: Loader,
          text: 'Processing…',
          variant: 'secondary' as const,
          disabled: true
        };
      }
      return {
        icon: Play,
        text: 'Continue Session',
        variant: 'default' as const
      };
    } 
    
    return {
      icon: FileText,
      text: 'View Details',
      variant: 'secondary' as const
    };
  };

  const getQuestionProgress = (interview: BehavioralInterview) => {
    const state = analyzeInterviewState(interview.questions, interview.responses, interview.feedback);
    const totalQuestions = 5;
    const completedQuestions = Math.min(state.currentQuestionIndex, totalQuestions);
    
    if (state.status === 'complete') {
      return `${totalQuestions} questions · Complete`;
    } else if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        return `${totalQuestions} questions · Processing`;
      }
      return `${completedQuestions}/${totalQuestions} questions`;
    }
    
    return `${totalQuestions} questions · Not started`;
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
                    Behavioral Practice
                    <br />
                    Sessions
                  </h1>
                  <p className="text-muted-foreground mt-2">Simulate real interviews and get AI-powered feedback on your answers.</p>
                </div>
                <Button 
                  size="lg"
                  onClick={() => navigate('/behavioral/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 text-base font-semibold"
                >
                  <Plus className="h-5 w-5 mr-2" />
                  New Behavioral Interview
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
              <div className="mb-12">
                <h2 className="text-xl font-semibold text-gray-900 mb-8 flex items-center gap-2">
                  <Briefcase className="h-5 w-5" />
                  Previous Practice Sessions
                </h2>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {interviews.map(interview => {
                    const ButtonComponent = getCardButtonText(interview);
                    const hasTechnicalPractices = interview._technical_count && interview._technical_count > 0;

                    const practiceCard = (
                      <Card className="transition-all hover:shadow-lg hover:scale-[1.02] cursor-pointer">
                        <CardContent className="p-6" onClick={() => handleInterviewCardClick(interview)}>
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1 min-w-0 mr-4">
                              <h3 className="text-lg font-semibold text-gray-900 truncate">
                                🧠 {interview.job_title}
                              </h3>
                              {interview.company_name && (
                                <p className="text-sm text-gray-600 mt-1">
                                  {interview.company_name}
                                </p>
                              )}
                            </div>
                            <div className="flex-shrink-0">
                              {getInterviewBadge(interview)}
                            </div>
                          </div>
                          
                          <div className="flex items-center text-xs text-gray-500 mb-4 gap-2">
                            <Calendar className="h-3 w-3" />
                            <span>{formatDate(interview.created_at)} · {getQuestionProgress(interview)}</span>
                          </div>

                          <Button 
                            variant={ButtonComponent.variant} 
                            size="sm" 
                            className="w-full"
                            disabled={ButtonComponent.disabled}
                            onClick={(e) => {
                              e.stopPropagation();
                              handleInterviewCardClick(interview);
                            }}
                          >
                            <ButtonComponent.icon className={`h-4 w-4 mr-2 ${ButtonComponent.disabled ? 'animate-spin' : ''}`} />
                            {ButtonComponent.text}
                          </Button>
                        </CardContent>
                      </Card>
                    );

                    if (hasTechnicalPractices) {
                      return (
                        <Tooltip key={interview.id} delayDuration={100}>
                          <TooltipTrigger asChild>
                            {practiceCard}
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
                        {practiceCard}
                      </div>
                    );
                  })}
                </div>
              </div>
            </>
          ) : (
            // Enhanced Empty State View with designer recommendations
            <>
              <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between mb-8">
                <div>
                  <h1 className="text-5xl font-bold text-interview-primary leading-tight">
                    Behavioral Practice
                    <br />
                    Sessions
                  </h1>
                  <p className="text-muted-foreground mt-2">Simulate real interviews and get AI-powered feedback on your answers.</p>
                </div>
              </div>
              
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border border-blue-200 p-8">
                <div className="max-w-4xl mx-auto text-center">
                  
                  {/* Main Headline */}
                  <div className="mb-8">
                    <h2 className="text-3xl font-bold text-gray-800 mb-4">
                      🎙️ Practice Real-Time Behavioral Interviews
                    </h2>
                    <p className="text-gray-600 max-w-2xl mx-auto text-lg">
                      Simulate interviews with personalized, AI-generated questions and receive immediate feedback on your responses.
                    </p>
                  </div>

                  {/* 3-Step Visualization */}
                  <div className="grid grid-cols-3 gap-4 text-center mt-8 mb-8">
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">①</div>
                      <p className="text-sm font-medium text-gray-700">Get 5 targeted questions</p>
                      <p className="text-xs text-gray-500 mt-1">dynamically generated in real-time</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">②</div>
                      <p className="text-sm font-medium text-gray-700">Answer out loud or in text</p>
                      <p className="text-xs text-gray-500 mt-1">AI listens & evaluates</p>
                    </div>
                    <div className="bg-white p-6 rounded-lg shadow-sm">
                      <div className="text-3xl font-bold text-blue-600 mb-2">③</div>
                      <p className="text-sm font-medium text-gray-700">Receive structured feedback</p>
                      <p className="text-xs text-gray-500 mt-1">for each response</p>
                    </div>
                  </div>

                  {/* Call to Action Button */}
                  <div className="mb-6">
                    <Button 
                      size="lg"
                      onClick={() => navigate('/behavioral/create')}
                      className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-4 text-lg font-semibold"
                    >
                      💬 Start My Mock Interview →
                    </Button>
                  </div>

                  {/* Reassurance Subtext */}
                  <p className="text-sm text-gray-500 max-w-md mx-auto mb-4">
                    Don't worry — you'll have a chance to preview each question and retry responses. Great for practicing at your own pace.
                  </p>

                  {/* Optional: See Example Session Link */}
                  <Button 
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowExampleSession(!showExampleSession)}
                    className="text-blue-600 hover:text-blue-800 hover:bg-blue-50 mb-4"
                  >
                    🔍 See example session
                  </Button>

                  {/* Connection Nudge */}
                  <p className="text-sm text-gray-500 mt-2 text-center max-w-lg mx-auto">
                    📘 Want to keep improving? You can revisit these questions and practice follow-ups later in your <a href="/questions" className="text-blue-600 hover:underline">Question Vault</a>.
                  </p>

                </div>
              </div>

              {/* Example Session Video Modal */}
              {showExampleSession && (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50" onClick={() => setShowExampleSession(false)}>
                  <div className="bg-white rounded-lg shadow-xl max-w-4xl w-full mx-4 max-h-[90vh] overflow-hidden" onClick={(e) => e.stopPropagation()}>
                    <div className="flex items-center justify-between p-4 border-b">
                      <h3 className="text-lg font-semibold">Example Behavioral Interview Session</h3>
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => setShowExampleSession(false)}
                        className="h-8 w-8 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="p-6">
                      <video 
                        controls 
                        muted
                        playsInline
                        className="w-full h-auto rounded-lg bg-gray-100"
                        preload="metadata"
                        onError={(e) => console.error('Video load error:', e)}
                        onLoadStart={() => console.log('Video loading started')}
                        onLoadedData={() => console.log('Video data loaded')}
                      >
                        <source src="/video-assets/CreateBehavioralFlow.mov" type="video/mp4" />
                        <p className="text-center p-4 text-gray-600">
                          Your browser does not support the video tag or the video failed to load.
                          <br />
                          <a href="/video-assets/CreateBehavioralFlow.mov" className="text-blue-600 hover:underline">
                            Download video instead
                          </a>
                        </p>
                      </video>
                      <p className="text-sm text-gray-600 mt-4 text-center">
                        See how the behavioral interview process works from start to finish
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Behavioral;
