
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, FileText } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';
import { Json } from '@/integrations/supabase/types';

type Question = {
  question: string;
  explanation?: string;
  modelAnswer?: string;
  followUp?: string[];
  type?: 'technical' | 'behavioral' | 'experience';
};

const Questions = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [jobDetails, setJobDetails] = useState({
    jobTitle: '',
    companyName: '',
  });
  const [error, setError] = useState<string | null>(null);

  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');

  useEffect(() => {
    const fetchQuestions = async () => {
      if (!storylineId) {
        toast({
          variant: "destructive",
          title: "Error",
          description: "No storyline ID provided. Please go back and try again.",
        });
        setIsLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('storyline')
          .select('*')
          .eq('id', storylineId)
          .single();

        if (error) throw error;

        if (!data) {
          toast({
            variant: "destructive",
            title: "Error",
            description: "No data found for this interview preparation.",
          });
          setIsLoading(false);
          return;
        }

        console.log("Storyline data retrieved:", data);

        setJobDetails({
          jobTitle: data.job_title || 'Untitled Position',
          companyName: data.company_name || 'Unnamed Company',
        });

        if (data.openai_response) {
          console.log("OpenAI response from database:", data.openai_response);
          
          let processedQuestions: Question[] = [];
          const response = data.openai_response;
          
          // Function to categorize a question by keywords in the text
          const categorizeQuestion = (questionText: string): 'technical' | 'behavioral' | 'experience' => {
            const lowerQuestion = questionText.toLowerCase();
            
            if (lowerQuestion.includes('technical') || 
                lowerQuestion.includes('tool') || 
                lowerQuestion.includes('technology') || 
                lowerQuestion.includes('gcp') ||
                lowerQuestion.includes('design') ||
                lowerQuestion.includes('skill')) {
              return 'technical';
            } else if (lowerQuestion.includes('experience') || 
                      lowerQuestion.includes('previous') || 
                      lowerQuestion.includes('worked') ||
                      lowerQuestion.includes('implement')) {
              return 'experience';
            } else {
              return 'behavioral';
            }
          };

          // Handle old format with separate question categories
          if (typeof response === 'object' && 
              response && 
              'technicalQuestions' in response && 
              'behavioralQuestions' in response && 
              'experienceQuestions' in response) {
            
            // Add type field to each question
            const technical = Array.isArray(response.technicalQuestions) 
              ? response.technicalQuestions.map(q => ({...q, type: 'technical' as const})) 
              : [];
              
            const behavioral = Array.isArray(response.behavioralQuestions)  
              ? response.behavioralQuestions.map(q => ({...q, type: 'behavioral' as const}))
              : [];
              
            const experience = Array.isArray(response.experienceQuestions)
              ? response.experienceQuestions.map(q => ({...q, type: 'experience' as const}))
              : [];
            
            processedQuestions = [...technical, ...behavioral, ...experience];
          } 
          // Handle new format with a single questions array
          else if (typeof response === 'object' && response && 'questions' in response) {
            const allQuestions = Array.isArray(response.questions) ? response.questions : [];
            
            processedQuestions = allQuestions.map(q => ({
              question: q.question,
              explanation: q.modelAnswer,
              modelAnswer: q.modelAnswer,
              followUp: q.followUp,
              type: categorizeQuestion(q.question)
            }));
          }
          // Try to handle string response (JSON string)
          else if (typeof response === 'string') {
            try {
              const parsed = JSON.parse(response);
              
              if (parsed.technicalQuestions && parsed.behavioralQuestions && parsed.experienceQuestions) {
                const technical = Array.isArray(parsed.technicalQuestions) 
                  ? parsed.technicalQuestions.map(q => ({...q, type: 'technical' as const}))
                  : [];
                  
                const behavioral = Array.isArray(parsed.behavioralQuestions)
                  ? parsed.behavioralQuestions.map(q => ({...q, type: 'behavioral' as const}))
                  : [];
                  
                const experience = Array.isArray(parsed.experienceQuestions)
                  ? parsed.experienceQuestions.map(q => ({...q, type: 'experience' as const}))
                  : [];
                
                processedQuestions = [...technical, ...behavioral, ...experience];
              } else if (parsed.questions) {
                const allQuestions = Array.isArray(parsed.questions) ? parsed.questions : [];
                
                processedQuestions = allQuestions.map(q => ({
                  question: q.question,
                  explanation: q.modelAnswer,
                  modelAnswer: q.modelAnswer,
                  followUp: q.followUp,
                  type: categorizeQuestion(q.question)
                }));
              }
            } catch (parseError) {
              console.error('Error parsing response string:', parseError);
              throw new Error("Failed to parse the interview questions data");
            }
          }
          
          setQuestions(processedQuestions);
        } else {
          toast({
            variant: "destructive",
            title: "Processing",
            description: "Your interview questions are still being generated. Please check back later.",
          });
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
        setError(error instanceof Error ? error.message : "Failed to load interview questions");
        toast({
          variant: "destructive",
          title: "Error",
          description: error instanceof Error ? error.message : "Failed to load interview questions",
        });
      } finally {
        setIsLoading(false);
      }
    };

    fetchQuestions();
  }, [storylineId, toast]);

  const renderQuestions = (questionsList: Question[] = []) => {
    if (!questionsList.length) {
      return (
        <p className="text-gray-500 italic py-4">
          No questions available. OpenAI might not have generated them correctly.
        </p>
      );
    }
  
    return questionsList.map((item, index) => (
      <Card key={index} className="mb-4 border-l-4 border-l-interview-primary">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg font-semibold">{item.question}</CardTitle>
            <Badge 
              variant={
                item.type === 'technical' ? 'secondary' : 
                item.type === 'experience' ? 'outline' : 'default'
              }
              className="ml-2"
            >
              {item.type || 'Question'}
            </Badge>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-gray-600">
            <strong>Why this matters:</strong> {item.explanation || item.modelAnswer || "No explanation provided."}
          </CardDescription>
          
          {item.followUp && item.followUp.length > 0 && (
            <div className="mt-4">
              <p className="font-medium text-sm text-gray-700">Follow-up questions:</p>
              <ul className="list-disc pl-5 mt-2 space-y-1">
                {item.followUp.map((followUpQ, idx) => (
                  <li key={idx} className="text-sm text-gray-600">{followUpQ}</li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    ));
  };
  

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-interview-primary mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your interview questions...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link to="/">
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Home
            </Button>
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-interview-primary mb-2">
            {jobDetails.jobTitle}
          </h1>
          {jobDetails.companyName && (
            <p className="text-gray-600 mb-4">{jobDetails.companyName}</p>
          )}
          <p className="text-gray-700">
            Here are your personalized interview questions based on the job description and your resume.
            Review them carefully and prepare your answers to make a great impression.
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <h3 className="text-red-800 font-semibold">Error</h3>
            <p className="text-red-600">{error}</p>
            <p className="text-red-600 mt-2">Please check the console for more details or try again.</p>
          </div>
        )}

        {questions.length > 0 ? (
          <div className="pt-2">
            <div className="flex items-center mb-4">
              <FileText className="w-5 h-5 mr-2 text-interview-primary" />
              <h2 className="text-xl font-semibold">Interview Questions</h2>
            </div>
            {renderQuestions(questions)}
          </div>
        ) : (
          <div className="bg-gray-100 rounded-lg p-8 text-center">
            <h2 className="text-xl font-semibold mb-4">Questions Not Available</h2>
            <p className="text-gray-600 mb-4">
              We couldn't find any interview questions for this job application.
              This could be because they're still being generated or there was an error.
            </p>
            <Link to="/create">
              <Button>Create New Interview Prep</Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default Questions;
