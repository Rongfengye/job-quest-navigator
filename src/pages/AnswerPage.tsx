
import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, Mic } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAnswers } from '@/hooks/useAnswers';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';
import QuestionDisplay from '@/components/questions/QuestionDisplay';
import AnswerForm from '@/components/questions/AnswerForm';

const AnswerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');
  const questionIndexStr = queryParams.get('questionIndex');
  const questionIndex = questionIndexStr ? parseInt(questionIndexStr, 10) : 0;
  
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer, 
    saveAnswer, 
    error 
  } = useAnswers(storylineId || '', questionIndex);

  React.useEffect(() => {
    if (answer) {
      setInputAnswer(answer);
    }
  }, [answer]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (storylineId) {
      await saveAnswer(inputAnswer);
      // Navigate back to questions list
      navigate(`/questions?id=${storylineId}`);
    }
  };

  const handleGenerateAnswer = async () => {
    if (!question) return;
    
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
          <Card>
            <CardContent className="p-6">
              <p>Question not found. Please go back and try again.</p>
            </CardContent>
          </Card>
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

        <QuestionDisplay question={question} questionIndex={questionIndex} />

        <AnswerForm 
          inputAnswer={inputAnswer} 
          setInputAnswer={setInputAnswer} 
          handleSubmit={handleSubmit}
          handleGenerateAnswer={handleGenerateAnswer}
          generatingAnswer={generatingAnswer}
          isSaving={isSaving}
        />
      </div>
    </div>
  );
};

export default AnswerPage;
