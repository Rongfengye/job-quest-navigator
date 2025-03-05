
import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAnswers } from '@/hooks/useAnswers';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';

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
      // In a real implementation, you could call OpenAI API here for a generated answer
      const generatedText = question.modelAnswer || 
        "Throughout my career, I've gained significant experience in this area. " +
        "I've worked with various tools and technologies to solve complex problems. " +
        "In my previous role, I implemented a system that improved efficiency by 30%. " +
        "I ensure quality by following best practices and conducting thorough testing.";
      
      setInputAnswer(generatedText);
      
      // Don't auto-save the generated answer, let the user edit it first
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

        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-xl text-interview-primary">Question</CardTitle>
              {question.type && (
                <Badge 
                  variant={
                    question.type === 'technical' ? 'secondary' : 
                    question.type === 'experience' ? 'outline' : 'default'
                  }
                >
                  {question.type}
                </Badge>
              )}
            </div>
            <CardDescription className="text-lg font-medium text-gray-800 mt-2">
              {question.question}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {question.explanation && (
              <div className="mb-4 p-4 bg-gray-50 rounded-md">
                <p className="text-sm font-medium text-gray-700">Why this matters:</p>
                <p className="text-sm text-gray-600 mt-1">{question.explanation}</p>
              </div>
            )}
            
            {question.followUp && question.followUp.length > 0 && (
              <div className="mt-4">
                <p className="font-medium text-sm text-gray-700">Follow-up questions to consider:</p>
                <ul className="list-disc pl-5 mt-2 space-y-1">
                  {question.followUp.map((followUpQ, idx) => (
                    <li key={idx} className="text-sm text-gray-600">{followUpQ}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Your Answer</CardTitle>
            <CardDescription>
              Practice your response to this question below. You can save it for later reference.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-4">
              <Textarea 
                value={inputAnswer}
                onChange={(e) => setInputAnswer(e.target.value)}
                placeholder="Type your response here..."
                className="min-h-[200px]"
              />
              
              <div className="flex items-center justify-between">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleGenerateAnswer}
                  disabled={generatingAnswer}
                  className="flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  {generatingAnswer ? 'Generating...' : 'Generate Answer'}
                </Button>
                
                <Button 
                  type="submit" 
                  disabled={isSaving || inputAnswer.trim() === ''}
                  className="flex items-center gap-2"
                >
                  <Save className="w-4 h-4" />
                  {isSaving ? 'Saving...' : 'Save Answer'}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AnswerPage;
