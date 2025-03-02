
import React, { useEffect, useState } from 'react';
import { useLocation, Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ArrowLeft, FileText, Lightbulb, User } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/components/ui/use-toast';

type Question = {
  question: string;
  explanation: string;
};

type QuestionsData = {
  technicalQuestions: Question[];
  behavioralQuestions: Question[];
  experienceQuestions: Question[];
};

const Questions = () => {
  const location = useLocation();
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(true);
  const [questions, setQuestions] = useState<QuestionsData | null>(null);
  const [jobDetails, setJobDetails] = useState({
    jobTitle: '',
    companyName: '',
  });

  // Get the storyline ID from the URL query parameter
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

        // Set job details
        setJobDetails({
          jobTitle: data.job_title || 'Untitled Position',
          companyName: data.company_name || 'Unnamed Company',
        });

        // Parse the OpenAI response from the database
        if (data.openai_response) {
          setQuestions(data.openai_response as QuestionsData);
        } else {
          toast({
            variant: "destructive",
            title: "Processing",
            description: "Your interview questions are still being generated. Please check back later.",
          });
        }
      } catch (error) {
        console.error('Error fetching questions:', error);
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
      return <p className="text-gray-500 italic py-4">No questions available in this category.</p>;
    }

    return questionsList.map((item, index) => (
      <Card key={index} className="mb-4 border-l-4 border-l-interview-primary">
        <CardHeader>
          <CardTitle className="text-lg font-semibold">{item.question}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-gray-600">
            <strong>Why this matters:</strong> {item.explanation}
          </CardDescription>
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

        {questions ? (
          <Tabs defaultValue="technical" className="w-full">
            <TabsList className="grid grid-cols-3 mb-8">
              <TabsTrigger value="technical" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                <span className="hidden sm:inline">Technical</span>
                <span className="inline sm:hidden">Tech</span>
              </TabsTrigger>
              <TabsTrigger value="behavioral" className="flex items-center gap-2">
                <Lightbulb className="w-4 h-4" />
                <span className="hidden sm:inline">Behavioral</span>
                <span className="inline sm:hidden">Behav</span>
              </TabsTrigger>
              <TabsTrigger value="experience" className="flex items-center gap-2">
                <User className="w-4 h-4" />
                <span className="hidden sm:inline">Experience</span>
                <span className="inline sm:hidden">Exp</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="technical" className="pt-2">
              <h2 className="text-xl font-semibold mb-4">Technical Questions</h2>
              {renderQuestions(questions.technicalQuestions)}
            </TabsContent>

            <TabsContent value="behavioral" className="pt-2">
              <h2 className="text-xl font-semibold mb-4">Behavioral Questions</h2>
              {renderQuestions(questions.behavioralQuestions)}
            </TabsContent>

            <TabsContent value="experience" className="pt-2">
              <h2 className="text-xl font-semibold mb-4">Experience Questions</h2>
              {renderQuestions(questions.experienceQuestions)}
            </TabsContent>
          </Tabs>
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
