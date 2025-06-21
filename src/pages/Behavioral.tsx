
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
import { Link } from 'react-router-dom';
import { analyzeInterviewState } from '@/utils/interviewStateUtils';

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

  const { data: interviews, isLoading } = useQuery({
    queryKey: ['behavioral-interviews'],
    queryFn: async () => {
      // First fetch behavioral interviews
      const { data: behaviorals, error } = await supabase
        .from('storyline_behaviorals')
        .select('*') // This includes ALL fields: resume_path, job_description, etc.
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      // Then fetch counts of technical questions for each behavioral
      const enhancedBehaviorals = await Promise.all(
        (behaviorals || []).map(async (behavioral) => {
          const { count, error: countError } = await supabase
            .from('storyline_jobs')
            .select('id', { count: 'exact', head: true })
            .eq('behavioral_id', behavioral.id);
          
          return {
            ...behavioral,
            _technical_count: count || 0
          };
        })
      );
      
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
        <Badge variant="outline" className="border-green-300 text-green-700">
          Complete
        </Badge>
      );
    } else if (state.status === 'in-progress') {
      if (state.currentQuestionIndex >= 5) {
        return (
          <Badge variant="outline" className="border-blue-300 text-blue-700">
            Processing
          </Badge>
        );
      }
      return (
        <Badge variant="outline" className="border-orange-300 text-orange-700">
          Question {state.currentQuestionIndex + 1} of 5
        </Badge>
      );
    } else {
      return (
        <Badge variant="outline" className="border-gray-300 text-gray-700">
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
      // If it's in progress, clicking should try to resume the interview,
      // unless all questions are answered and it's just waiting for feedback.
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
      // For 'not-started' interviews, navigate to the feedback page,
      // which will show a "No feedback" message.
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
      // If the interview is in-progress and not all questions are answered, show 'Resume'.
      // Otherwise, it's processing the final feedback.
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
    
    // Default for 'not-started'
    return {
      icon: FileText,
      text: 'View Details'
    };
  };

  const hasData = (interviews && interviews.length > 0);
  const hasError = false;

  return (
    <DashboardLayout>
      <div className="mb-6 flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold text-interview-primary">Behavioral Interview Dashboard</h1>
          <p className="text-muted-foreground mt-1">Manage your interview preparations</p>
        </div>
      </div>

      {hasData && (
        <Card className="w-full max-w-md mx-auto mb-8">
          <CardHeader className="text-center">
            <CardTitle className="text-2xl font-bold">Answer 5 Interview Questions</CardTitle>
            <CardDescription>
              When you're done, review your answers and discover insights.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center">
            <Button 
              className="w-full max-w-xs" 
              onClick={() => navigate('/behavioral/create')}
            >
              Start New Practice
            </Button>
          </CardContent>
        </Card>
      )}

      <div className="flex flex-col space-y-8 min-h-[calc(100vh-120px)]">
        <div className="w-full">
          {hasData && (
            <h2 className="text-xl font-semibold mb-4 flex items-center gap-2">
              <Briefcase className="h-5 w-5" />
              Previous Practice Sessions
            </h2>
          )}
          
          {isLoading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map(i => (
                <Card key={i} className="opacity-60 animate-pulse">
                  <CardHeader className="h-24 bg-gray-100"></CardHeader>
                  <CardContent className="h-20 mt-4 bg-gray-100 rounded"></CardContent>
                </Card>
              ))}
            </div>
          ) : hasError ? (
            <Card className="bg-red-50 border-red-200">
              <CardHeader>
                <CardTitle className="text-red-700">Error loading data</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-red-600">
                  There was an error loading your interview preparations. Please try again later.
                </p>
              </CardContent>
            </Card>
          ) : hasData ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {interviews.map(interview => {
                const ButtonComponent = getCardButtonText(interview);
                return (
                  <Card 
                    key={interview.id} 
                    className="h-full transition-all hover:shadow-md feature-card-shadow cursor-pointer"
                    onClick={() => handleInterviewCardClick(interview)}
                  >
                    <CardHeader>
                      <div className="flex justify-between items-start">
                        <div>
                          <CardTitle className="text-xl">{interview.job_title}</CardTitle>
                          {interview.company_name && (
                            <CardDescription>{interview.company_name}</CardDescription>
                          )}
                        </div>
                        {getInterviewBadge(interview)}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="flex items-center text-muted-foreground text-sm mb-4">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>Created on {formatDate(interview.created_at)}</span>
                      </div>
                      
                      {interview._technical_count > 0 && (
                        <div className="flex items-center text-sm text-blue-600">
                          <Book className="h-4 w-4 mr-2" />
                          <span>{interview._technical_count} related technical {interview._technical_count === 1 ? 'practice' : 'practices'}</span>
                        </div>
                      )}
                    </CardContent>
                    <CardFooter className="border-t pt-4">
                      <Button variant="ghost" className="w-full" size="sm">
                        <ButtonComponent.icon className="h-4 w-4 mr-2" />
                        {ButtonComponent.text}
                      </Button>
                    </CardFooter>
                  </Card>
                );
              })}
            </div>
          ) : (
            <div className="w-full flex flex-col items-center justify-center py-12 px-4 border border-dashed rounded-lg bg-gray-50">
              <Briefcase className="h-12 w-12 text-gray-300 mb-4" />
              <h3 className="text-xl font-medium text-gray-900 mb-1">No practice sessions yet</h3>
              <p className="text-gray-500 text-center mb-6">
                Create your first behavioral practice to receive personalized feedback
              </p>
              <div className="flex gap-4">
                <Button onClick={() => navigate('/behavioral/create')}>
                  <Plus className="h-4 w-4 mr-2" />
                  Start Practice
                </Button>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
};

export default Behavioral;
