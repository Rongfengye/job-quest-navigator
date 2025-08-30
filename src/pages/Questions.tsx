
import React from 'react';
import { useLocation } from 'react-router-dom';
import { useQuestionData } from '@/hooks/useQuestionData';
import { usePlanStatus } from '@/hooks/usePlanStatus';
import Loading from '@/components/ui/loading';
import ErrorDisplay from '@/components/ui/error-display';
import QuestionsList from '@/components/questions/QuestionsList';
import NoQuestions from '@/components/questions/NoQuestions';
import QuestionPageHeader from '@/components/questions/QuestionPageHeader';
import SourceInfoPanel from '@/components/questions/SourceInfoPanel';

const Questions = () => {
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const storylineId = queryParams.get('id');
  const type = queryParams.get('type');
  // Map type to mode: type=1 -> guided (new vault), type=2 -> manual (continuing)
  const mode = type === '1' ? 'guided' : 'manual';
  const { fetchUserStatus } = usePlanStatus();
  
  // Phase 3: Smart sync on premium feature entry
  React.useEffect(() => {
    fetchUserStatus('question_vault_page_entry');
  }, [fetchUserStatus]);
  
  const { isLoading, questions, jobDetails, error } = useQuestionData(storylineId);

  if (isLoading) {
    return <Loading message="Loading your behavioral practice questions..." />;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container max-w-4xl mx-auto px-4">
        <QuestionPageHeader behavioralId={jobDetails.behavioralId} />

        <div className="bg-white rounded-lg shadow-sm p-6 mb-8">
          <h1 className="text-3xl font-bold text-interview-primary mb-2">
            {jobDetails.jobTitle}
          </h1>
          {jobDetails.companyName && (
            <p className="text-gray-600 mb-4">{jobDetails.companyName}</p>
          )}
          {(() => {
            const hasOnlyOriginalQuestions = questions.length > 0 && 
              questions.every(q => q.type === 'original-behavioral');
            
            if (hasOnlyOriginalQuestions) {
              return (
                <p className="text-gray-700">
                  Here are the behavioral questions from your recent interview practice session. 
                  Review them again to strengthen your responses and build confidence.
                </p>
              );
            } else {
              return (
                <p className="text-gray-700">
                  Here are your personalized behavioral interview questions based on the job description and your resume.
                  Review them carefully and prepare your answers to make a great impression.
                </p>
              );
            }
          })()}
        </div>

        <ErrorDisplay message={error} />

        {questions.length > 0 ? (
          <>
            <SourceInfoPanel questions={questions} />
            <QuestionsList questions={questions} storylineId={storylineId || ''} mode={mode} type={type || '2'} />
          </>
        ) : (
          <NoQuestions />
        )}
      </div>
    </div>
  );
};

export default Questions;
