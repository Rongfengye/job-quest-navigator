
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import DashboardLayout from '@/components/layouts/DashboardLayout';
import QuestionCard from '@/components/behavioral/QuestionCard';
import { behavioralQuestions } from '@/data/behavioralQuestions';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

const BehavioralTest = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [answers, setAnswers] = useState<string[]>(new Array(behavioralQuestions.length).fill(''));

  const handleAnswerChange = (value: string) => {
    const newAnswers = [...answers];
    newAnswers[currentQuestion] = value;
    setAnswers(newAnswers);
  };

  const handleNext = () => {
    if (answers[currentQuestion].trim().length < 50) {
      toast({
        variant: "destructive",
        title: "Answer too short",
        description: "Please provide a more detailed answer (minimum 50 characters)",
      });
      return;
    }

    if (currentQuestion < behavioralQuestions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    } else {
      // Handle completion
      toast({
        title: "Interview completed",
        description: "Great job! You've completed all the questions.",
      });
      // TODO: Navigate to results page
    }
  };

  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-120px)] px-4">
        <QuestionCard
          question={behavioralQuestions[currentQuestion]}
          currentQuestion={currentQuestion}
          totalQuestions={behavioralQuestions.length}
          answer={answers[currentQuestion]}
          onAnswerChange={handleAnswerChange}
          onNext={handleNext}
        />
      </div>
    </DashboardLayout>
  );
};

export default BehavioralTest;
