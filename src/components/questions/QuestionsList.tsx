
import React from 'react';
import { FileText, Brain, MessageSquare, Users } from 'lucide-react';
import QuestionCard, { Question } from './QuestionCard';

// Feature flag to control technical questions display (matches backend)
const ENABLE_TECHNICAL_QUESTIONS = false;

interface QuestionsListProps {
  questions: Question[];
  storylineId: string;
  mode?: string;
  type?: string;
}

const QuestionsList: React.FC<QuestionsListProps> = ({ questions, storylineId, mode = 'manual', type = '2' }) => {
  if (!questions.length) {
    return (
      <p className="text-gray-500 italic py-4">
        No questions available. OpenAI might not have generated them correctly.
      </p>
    );
  }

  // Group questions by type
  const technicalQuestions = ENABLE_TECHNICAL_QUESTIONS 
    ? questions.filter(q => q.type === 'technical')
    : [];
  const behavioralQuestions = questions.filter(q => q.type === 'behavioral');
  const originalBehavioralQuestions = questions.filter(q => q.type === 'original-behavioral');

  const hasOriginalQuestions = originalBehavioralQuestions.length > 0;
  
  // Update total count calculation to exclude technical questions when disabled
  const totalCount = ENABLE_TECHNICAL_QUESTIONS 
    ? technicalQuestions.length + behavioralQuestions.length + originalBehavioralQuestions.length
    : behavioralQuestions.length + originalBehavioralQuestions.length;

  return (
    <div className="pt-2">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center">
          <FileText className="w-5 h-5 mr-2 text-interview-primary" />
          <h2 className="text-xl font-semibold">Practice Interview Questions</h2>
        </div>
        <div className="text-sm text-gray-600 bg-gray-100 px-3 py-1 rounded-full">
          {totalCount} Total Questions
        </div>
      </div>

      {/* Technical Questions Section - Conditionally rendered */}
      {ENABLE_TECHNICAL_QUESTIONS && technicalQuestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
            <Brain className="w-4 h-4 mr-2 text-blue-600" />
            <h3 className="text-lg font-medium text-gray-800">
              Technical Questions ({technicalQuestions.length})
            </h3>
          </div>
          {technicalQuestions.map((question, index) => (
            <QuestionCard 
              key={`technical-${index}`} 
              question={question} 
              index={questions.indexOf(question)} 
              storylineId={storylineId} 
              mode={mode}
            />
          ))}
        </div>
      )}

      {/* New Behavioral Questions Section */}
      {behavioralQuestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
            <MessageSquare className="w-4 h-4 mr-2 text-green-600" />
            <h3 className="text-lg font-medium text-gray-800">
              New Behavioral Questions ({behavioralQuestions.length})
            </h3>
          </div>
          {behavioralQuestions.map((question, index) => (
            <QuestionCard 
              key={`behavioral-${index}`} 
              question={question} 
              index={questions.indexOf(question)} 
              storylineId={storylineId} 
              mode={mode}
            />
          ))}
        </div>
      )}

      {/* Original Behavioral Questions Section */}
      {hasOriginalQuestions && (
        <div className="mb-8">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
            <Users className="w-4 h-4 mr-2 text-purple-600" />
            <h3 className="text-lg font-medium text-gray-800">
              From Your Interview ({originalBehavioralQuestions.length})
            </h3>
            <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Practice Again
            </span>
          </div>
          {originalBehavioralQuestions.map((question, index) => (
            <QuestionCard 
              key={`original-${index}`} 
              question={question} 
              index={questions.indexOf(question)} 
              storylineId={storylineId} 
              mode={mode}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;
