
import React, { useState } from 'react';
import { useLocation, Link, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { ArrowLeft, Save, Sparkles, Mic, History, CheckCircle } from 'lucide-react';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { useAnswers } from '@/hooks/useAnswers';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';
import { format } from 'date-fns';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

const AnswerPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');
  const questionIndexStr = queryParams.get('questionIndex');
  const questionIndex = questionIndexStr ? parseInt(questionIndexStr, 10) : 0;
  
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('current');
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer,
    iterations,
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
      toast({
        title: "Success",
        description: "Your answer has been saved",
      });
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

  const formatQuestionIndex = (index: number) => {
    return index < 9 ? `0${index + 1}` : `${index + 1}`;
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
          <CardHeader className="border-b">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <span className="text-gray-500 font-mono font-medium">{formatQuestionIndex(questionIndex)}</span>
                <CardTitle className="text-xl">Question</CardTitle>
              </div>
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
          <CardContent className="pt-4">
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
            <Card>
              <CardHeader className="border-b">
                <div className="flex justify-between items-center">
                  <CardTitle className="text-xl">Your Answer</CardTitle>
                </div>
                <CardDescription>
                  Practice your response to this question below.
                </CardDescription>
              </CardHeader>
              <CardContent className="pt-6">
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="relative">
                    <Textarea 
                      value={inputAnswer}
                      onChange={(e) => setInputAnswer(e.target.value)}
                      placeholder="Type your response here..."
                      className="min-h-[200px] resize-y pr-10"
                    />
                    <Button 
                      type="button" 
                      size="icon" 
                      variant="ghost" 
                      className="absolute right-2 top-2 opacity-70 hover:opacity-100"
                    >
                      <Mic className="h-4 w-4" />
                    </Button>
                  </div>
                  
                  <div className="flex items-center justify-between pt-2">
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
          </TabsContent>
          
          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle className="text-xl">Answer History</CardTitle>
                <CardDescription>
                  Review your previous iterations to see how your answer has evolved.
                </CardDescription>
              </CardHeader>
              <CardContent>
                {iterations.length === 0 ? (
                  <p className="text-gray-500 italic">No previous iterations found.</p>
                ) : (
                  <div className="space-y-6">
                    {[...iterations].reverse().map((iteration, idx) => (
                      <div key={idx} className="border rounded-md p-4">
                        <div className="flex justify-between items-center mb-2">
                          <p className="text-sm font-medium text-gray-500">
                            Iteration {iterations.length - idx}
                          </p>
                          <p className="text-xs text-gray-400">
                            {format(new Date(iteration.timestamp), 'MMM d, yyyy h:mm a')}
                          </p>
                        </div>
                        <p className="text-gray-700 whitespace-pre-wrap">{iteration.text}</p>
                        <div className="mt-3 flex justify-end">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setInputAnswer(iteration.text);
                              setActiveTab('current');
                            }}
                          >
                            Use this answer
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnswerPage;
