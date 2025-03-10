
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, CheckCircle, AlertCircle } from 'lucide-react';
import { useAnswers } from '@/hooks/useAnswers';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import QuestionDisplay from '@/components/answer/QuestionDisplay';
import AnswerForm from '@/components/answer/AnswerForm';
import AnswerHistory from '@/components/answer/AnswerHistory';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

const AnswerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user } = useAuthContext();
  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');
  const questionIndexStr = queryParams.get('questionIndex');
  const questionIndex = questionIndexStr ? parseInt(questionIndexStr, 10) : 0;
  
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('current');
  const [hasStarted, setHasStarted] = useState(false);
  const { tokens, fetchTokens } = useUserTokens();
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer,
    answerRecord,
    iterations,
    saveAnswer, 
    error 
  } = useAnswers(storylineId || '', questionIndex);

  useEffect(() => {
    if (answer) {
      setInputAnswer(answer);
      setHasStarted(true);
    }
  }, [answer]);

  const deductStartToken = async () => {
    if (!user || !storylineId || hasStarted) return;
    
    try {
      // Deduct token for starting a question practice
      const { data, error } = await supabase.rpc(
        'deduct_user_tokens',
        { user_id: user.id, amount: 1 }
      );
      
      if (error) throw error;
      
      setHasStarted(true);
      fetchTokens();
      
      toast({
        title: "Practice Started",
        description: "1 token has been deducted from your balance.",
      });
    } catch (error) {
      console.error('Token deduction error:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to start practice.",
      });
      
      // If insufficient tokens, navigate back
      if (error instanceof Error && error.message.includes("Insufficient")) {
        navigate(`/questions?id=${storylineId}`);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (storylineId) {
      await saveAnswer(inputAnswer);
      toast({
        title: "Success",
        description: "Your answer has been saved",
      });
    }
  };

  const handleGenerateAnswer = async () => {
    if (!question || !user) return;
    
    // Check if user has enough tokens
    if (tokens !== null && tokens < 1) {
      toast({
        variant: "destructive",
        title: "Insufficient Tokens",
        description: "You need at least 1 token to generate an answer.",
      });
      return;
    }
    
    setGeneratingAnswer(true);
    
    try {
      // Deduct token for generating an answer
      const { data, error } = await supabase.rpc(
        'deduct_user_tokens',
        { user_id: user.id, amount: 1 }
      );
      
      if (error) throw error;
      
      // Generate a sample answer based on the model answer or explanation
      const generatedText = question.modelAnswer || 
        "Throughout my career, I've gained significant experience in this area. " +
        "I've worked with various tools and technologies to solve complex problems. " +
        "In my previous role, I implemented a system that improved efficiency by 30%. " +
        "I ensure quality by following best practices and conducting thorough testing.";
      
      setInputAnswer(generatedText);
      fetchTokens();
      
      toast({
        title: "Answer Generated",
        description: "1 token has been deducted from your balance.",
      });
    } catch (error) {
      console.error('Error generating answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate answer.",
      });
    } finally {
      setGeneratingAnswer(false);
    }
  };

  useEffect(() => {
    // If user has tokens and hasn't started yet, deduct a token when the page loads
    if (user && tokens !== null && tokens >= 1 && !hasStarted && !isLoading) {
      deductStartToken();
    }
  }, [user, tokens, hasStarted, isLoading]);

  if (isLoading) {
    return <Loading message="Loading question..." />;
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link to={`/questions?id=${storylineId}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Questions
              </Button>
            </Link>
          </div>
          <div className="p-6 bg-white rounded-lg shadow">
            <p>Question not found. Please go back and try again.</p>
          </div>
        </div>
      </div>
    );
  }

  // Show token warning if insufficient tokens and not started
  if (tokens !== null && tokens < 1 && !hasStarted) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <div className="mb-6">
            <Link to={`/questions?id=${storylineId}`}>
              <Button variant="outline" className="flex items-center gap-2">
                <ArrowLeft className="w-4 h-4" />
                Back to Questions
              </Button>
            </Link>
          </div>
          
          <div className="p-8 bg-white rounded-lg shadow text-center">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-2xl font-bold mb-4">Insufficient Tokens</h2>
            <p className="mb-6">
              You need at least 1 token to start practicing this question.
            </p>
            <Button onClick={() => navigate('/settings')}>
              Get More Tokens
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <div className="mb-6">
          <Link to={`/questions?id=${storylineId}`}>
            <Button variant="outline" className="flex items-center gap-2">
              <ArrowLeft className="w-4 h-4" />
              Back to Questions
            </Button>
          </Link>
        </div>

        <ErrorDisplay message={error} />

        <QuestionDisplay 
          question={question} 
          questionIndex={questionIndex} 
        />

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="mb-4">
            <TabsTrigger value="current" className="flex items-center gap-1">
              <CheckCircle className="w-4 h-4" />
              Current Answer
            </TabsTrigger>
            <TabsTrigger value="history" className="flex items-center gap-1" disabled={iterations.length === 0}>
              <History className="w-4 h-4" />
              Previous Iterations {iterations.length > 0 && `(${iterations.length})`}
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="current">
            <AnswerForm
              inputAnswer={inputAnswer}
              setInputAnswer={setInputAnswer}
              handleSubmit={handleSubmit}
              handleGenerateAnswer={handleGenerateAnswer}
              isSaving={isSaving}
              generatingAnswer={generatingAnswer}
              question={question}
              questionId={answerRecord?.id}
            />
          </TabsContent>
          
          <TabsContent value="history">
            <AnswerHistory
              iterations={iterations}
              setInputAnswer={setInputAnswer}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnswerPage;
