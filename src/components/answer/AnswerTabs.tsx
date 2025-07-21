
import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { History, CheckCircle } from 'lucide-react';
import { AnswerIteration } from '@/hooks/useAnswers';
import { Question } from '@/hooks/useQuestionData';
import { QuestionVaultFeedback } from '@/hooks/useAnswerFeedback';
import AnswerForm from './AnswerForm';
import AnswerHistory from './AnswerHistory';

interface AnswerTabsProps {
  activeTab: string;
  setActiveTab: (tab: string) => void;
  inputAnswer: string;
  setInputAnswer: (value: string) => void;
  handleSubmit: (e: React.FormEvent<HTMLFormElement>) => void;
  handleGenerateAnswer: () => void;
  isSaving: boolean;
  generatingAnswer: boolean;
  processingThoughts: boolean;
  iterations: AnswerIteration[];
  question: Question | null;
  feedback: QuestionVaultFeedback | null;
  isFeedbackLoading: boolean;
  feedbackError: string | null;
}

const AnswerTabs: React.FC<AnswerTabsProps> = ({
  activeTab,
  setActiveTab,
  inputAnswer,
  setInputAnswer,
  handleSubmit,
  handleGenerateAnswer,
  isSaving,
  generatingAnswer,
  processingThoughts,
  iterations,
  question,
  feedback,
  isFeedbackLoading,
  feedbackError
}) => {
  return (
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
          processingThoughts={processingThoughts}
          question={question}
          feedback={feedback}
          isFeedbackLoading={isFeedbackLoading}
          feedbackError={feedbackError}
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
  );
};

export default AnswerTabs;
