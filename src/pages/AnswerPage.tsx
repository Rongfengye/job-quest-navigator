
import React from 'react';
import { useLocation } from 'react-router-dom';
import ErrorDisplay from '@/components/ui/error-display';
import Loading from '@/components/ui/loading';
import QuestionDisplay from '@/components/answer/QuestionDisplay';
import AnswerPageHeader from '@/components/answer/AnswerPageHeader';
import AnswerTabs from '@/components/answer/AnswerTabs';
import { useAnswerPage } from '@/hooks/useAnswerPage';
import { Question } from '@/hooks/useQuestionData';

const AnswerPage = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');
  const questionIndexStr = queryParams.get('questionIndex');
  const questionIndex = questionIndexStr ? parseInt(questionIndexStr, 10) : 0;
  const type = queryParams.get('type');
  // Map type to mode: type=1 -> guided (new vault), type=2 -> manual (continuing)
  const mode = type === '1' ? 'guided' : 'manual';
  
  // Get question data from navigation state
  const initialQuestion = (location.state as { question?: Question })?.question;
  
  const {
    inputAnswer,
    setInputAnswer,
    generatingAnswer,
    processingThoughts,
    activeTab,
    setActiveTab,
    isLoading,
    isSaving,
    question,
    iterations,
    error,
    feedback,
    isFeedbackLoading,
    feedbackError,
    handleSubmit,
    handleGenerateAnswer
  } = useAnswerPage(storylineId, questionIndex, initialQuestion);

  if (isLoading) {
    return <Loading message="Loading question..." />;
  }

  if (!question) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="container max-w-4xl mx-auto px-4">
          <AnswerPageHeader storylineId={storylineId} />
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
        <AnswerPageHeader storylineId={storylineId} />
        <ErrorDisplay message={error} />
        <QuestionDisplay 
          question={question} 
          questionIndex={questionIndex} 
        />
        <AnswerTabs
          activeTab={activeTab}
          setActiveTab={setActiveTab}
          inputAnswer={inputAnswer}
          setInputAnswer={setInputAnswer}
          handleSubmit={handleSubmit}
          handleGenerateAnswer={handleGenerateAnswer}
          isSaving={isSaving}
          generatingAnswer={generatingAnswer}
          processingThoughts={processingThoughts}
          iterations={iterations}
          question={question}
          feedback={feedback}
          isFeedbackLoading={isFeedbackLoading}
          feedbackError={feedbackError}
          mode={mode}
        />
      </div>
    </div>
  );
};

export default AnswerPage;
