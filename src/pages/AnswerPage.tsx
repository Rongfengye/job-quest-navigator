
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, CheckCircle } from 'lucide-react';
import { useAnswers } from '@/hooks/useAnswers';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/components/ui/use-toast';
import QuestionDisplay from '@/components/answer/QuestionDisplay';
import AnswerForm from '@/components/answer/AnswerForm';
import AnswerHistory from '@/components/answer/AnswerHistory';
import { useUserTokens } from '@/hooks/useUserTokens';

const AnswerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');
  const questionIndexStr = queryParams.get('questionIndex');
  const questionIndex = questionIndexStr ? parseInt(questionIndexStr, 10) : 0;
  
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('current');
  const [tokenCheckDone, setTokenCheckDone] = useState(false);
  
  const { deductTokens } = useUserTokens();
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer,
    iterations,
    saveAnswer, 
    error 
  } = useAnswers(storylineId || '', questionIndex);

  // Track if we've charged the user for starting the practice
  useEffect(() => {
    const checkTokensAndDeduct = async () => {
      if (tokenCheckDone || !question || isLoading) return;
      
      // Deduct 1 token for starting practice on this question
      const result = await deductTokens(1);
      if (!result?.success) {
        // If token deduction failed, redirect back to questions list
        navigate(`/questions?id=${storylineId}`);
        return;
      }
      
      setTokenCheckDone(true);
    };
    
    checkTokensAndDeduct();
  }, [question, isLoading, tokenCheckDone, deductTokens, navigate, storylineId]);

  useEffect(() => {
    if (answer) {
      setInputAnswer(answer);
    }
  }, [answer]);

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
    if (!question) return;
    
    // Check if user has enough tokens (1 token required)
    const tokenCheck = await deductTokens(1);
    if (!tokenCheck?.success) {
      return; // The token hook will show an error toast for insufficient tokens
    }
    
    setGeneratingAnswer(true);
    
    try {
      // Generate a sample answer based on the model answer or explanation
      const generatedText = question.modelAnswer || 
        "Throughout my career, I've gained significant experience in this area. " +
        "I've worked with various tools and technologies to solve complex problems. " +
        "In my previous role, I implemented a system that improved efficiency by 30%. " +
        "I ensure quality by following best practices and conducting thorough testing.";
      
      setInputAnswer(generatedText);
    } catch (error) {
      console.error('Error generating answer:', error);
      // If there was an error, refund the token
      await deductTokens(-1); // Add back the token that was deducted
    } finally {
      setGeneratingAnswer(false);
    }
  };

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
