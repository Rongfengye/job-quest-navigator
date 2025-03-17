
import React, { useState, useEffect } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { ArrowLeft, History, CheckCircle, MessageSquare } from 'lucide-react';
import { useAnswers } from '@/hooks/useAnswers';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useToast } from '@/hooks/use-toast';
import QuestionDisplay from '@/components/answer/QuestionDisplay';
import AnswerForm from '@/components/answer/AnswerForm';
import AnswerHistory from '@/components/answer/AnswerHistory';
import AnswerFeedback from '@/components/answer/AnswerFeedback';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useAnswerFeedback } from '@/hooks/useAnswerFeedback';

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
  const [showFeedback, setShowFeedback] = useState(false);
  
  const { deductTokens } = useUserTokens();
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer,
    iterations,
    answerRecord,
    saveAnswer,
    error 
  } = useAnswers(storylineId || '', questionIndex);

  const {
    feedback,
    isLoading: isFeedbackLoading,
    error: feedbackError,
    generateFeedback,
    clearFeedback
  } = useAnswerFeedback(storylineId || '', question);

  useEffect(() => {
    console.log('AnswerPage: iterations updated from useAnswers', iterations);
  }, [iterations]);

  useEffect(() => {
    if (answer && answer !== inputAnswer) {
      setInputAnswer(answer);
    }
  }, [answer]);

  // Clear feedback when changing tabs or input
  useEffect(() => {
    if (showFeedback) {
      setShowFeedback(false);
      clearFeedback();
    }
  }, [activeTab, clearFeedback]);

  // Remove the automatic tab switching when new iterations are available
  // This was causing the UI to stay on the history tab
  
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (storylineId) {
      await saveAnswer(inputAnswer);
      // Always switch back to the current answer tab after saving
      setActiveTab('current');
      toast({
        title: "Success",
        description: "Your answer has been saved",
      });
    }
  };

  const handleGenerateAnswer = async () => {
    if (!question) return;
    
    const tokenCheck = await deductTokens(1);
    if (!tokenCheck?.success) {
      return;
    }
    
    setGeneratingAnswer(true);
    
    try {
      const generatedText = question.modelAnswer || 
        "Throughout my career, I've gained significant experience in this area. " +
        "I've worked with various tools and technologies to solve complex problems. " +
        "In my previous role, I implemented a system that improved efficiency by 30%. " +
        "I ensure quality by following best practices and conducting thorough testing.";
      
      setInputAnswer(generatedText);
    } catch (error) {
      console.error('Error generating answer:', error);
      await deductTokens(-1);
    } finally {
      setGeneratingAnswer(false);
    }
  };

  const handleGetFeedback = async () => {
    if (inputAnswer.trim().length < 30) {
      toast({
        variant: "destructive",
        title: "Answer too short",
        description: "Please provide a more complete answer to get meaningful feedback.",
      });
      return;
    }

    setShowFeedback(true);
    await generateFeedback(inputAnswer);
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
            <TabsTrigger value="feedback" className="flex items-center gap-1" disabled={!showFeedback}>
              <MessageSquare className="w-4 h-4" />
              Feedback
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
              onGetFeedback={handleGetFeedback}
              showFeedbackButton={true}
            />
            
            {showFeedback && activeTab === 'current' && (
              <AnswerFeedback 
                feedback={feedback} 
                isLoading={isFeedbackLoading} 
                error={feedbackError} 
              />
            )}
          </TabsContent>
          
          <TabsContent value="history">
            <AnswerHistory
              iterations={iterations}
              setInputAnswer={setInputAnswer}
              setActiveTab={setActiveTab}
            />
          </TabsContent>
          
          <TabsContent value="feedback">
            <AnswerFeedback 
              feedback={feedback} 
              isLoading={isFeedbackLoading} 
              error={feedbackError} 
            />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnswerPage;
