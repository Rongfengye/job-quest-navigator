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
        .select('*')
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
      <div className="min-h-screen bg-sky-50 p-6">
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
                  <h1 className="text-5xl font-bold text-gray-900 leading-tight">
                    Behavioral Interview
                    <br />
                    Dashboard
                  </h1>
                  <p className="text-muted-foreground mt-2">Manage your interview preparation</p>
                </div>
                <Button 
                  onClick={() => navigate('/behavioral/create')}
                  className="bg-blue-600 hover:bg-blue-700 text-white"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  New Practice
                </Button>
              </div>

              {/* Practice Sessions Section */}
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center gap-3">
                  <Briefcase className="h-6 w-6" />
                  Previous Practice Sessions
                </h2>
                
                <div className="space-y-4">
                  {interviews.map(interview => {
                    const ButtonComponent = getCardButtonText(interview);
                    return (
                      <div 
                        key={interview.id} 
                        className="bg-white rounded-lg border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        onClick={() => handleInterviewCardClick(interview)}
                      >
                        <div className="p-6">
                          <div className="flex justify-between items-start mb-4">
                            <div className="flex-1">
                              <h3 className="text-2xl font-bold text-gray-900 mb-1">
                                {interview.job_title}
                              </h3>
                              {interview.company_name && (
                                <p className="text-lg text-gray-600 mb-3">
                                  {interview.company_name}
                                </p>
                              )}
                              
                              <div className="flex items-center gap-6 text-sm text-gray-500">
                                <div className="flex items-center">
                                  <Calendar className="h-4 w-4 mr-2" />
                                  <span>Created {formatDate(interview.created_at)}</span>
                                </div>
                                
                                {interview._technical_count > 0 && (
                                  <div className="flex items-center text-blue-600">
                                    <Book className="h-4 w-4 mr-2" />
                                    <span>{interview._technical_count} related technical {interview._technical_count === 1 ? 'practice' : 'practices'}</span>
                                  </div>
                                )}
                              </div>
                            </div>
                            
                            <div className="flex items-center gap-4">
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
                  })}
                </div>
              </div>
            </>
          ) : (
            // Empty State View
            <div className="text-center pt-8">
              <div className="mb-12">
                <h1 className="text-5xl font-bold text-gray-900 mb-4">
                  Behavioral Interview Dashboard
                </h1>
                <p className="text-xl text-gray-600 mb-8">
                  Master your interview skills with personalized practice sessions
                </p>
              </div>
              
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8 max-w-md mx-auto">
                <h2 className="text-2xl font-bold text-gray-900 mb-3">
                  Ready to Practice?
                </h2>
                <p className="text-gray-600 mb-6">
                  Answer 5 tailored questions and get detailed feedback
                </p>
                <Button 
                  size="lg"
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 text-lg font-medium"
                  onClick={() => navigate('/behavioral/create')}
                >
                  <Plus className="h-5 w-5 mr-2" />
                  Start New Practice
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
