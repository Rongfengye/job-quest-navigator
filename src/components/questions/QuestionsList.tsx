
import React from 'react';
import { FileText, Brain, MessageSquare, Users, Globe, Sparkles } from 'lucide-react';
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

  // Categorize questions by source (Real-World vs AI Practice)
  const isRealWorldQuestion = (question: Question) => {
    const realWorldSources = ['glassdoor-verified', 'blind-verified', 'company-official', 
                             'reddit-cscareerquestions', 'reddit-internships', 'reddit-company', 
                             'forum-general'];
    return question.sourceAttribution?.source && 
           realWorldSources.includes(question.sourceAttribution.source);
  };

  const realWorldQuestions = questions.filter(isRealWorldQuestion);
  const aiPracticeQuestions = questions.filter(q => !isRealWorldQuestion(q));

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

      {/* Real-World Interview Questions Section */}
      {realWorldQuestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
            <Globe className="w-5 h-5 mr-2 text-green-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              🧠 Real-World Interview Questions
            </h3>
            <span className="ml-2 text-xs text-green-600 bg-green-100 px-2 py-1 rounded-full">
              Scraped from Glassdoor, Blind
            </span>
          </div>
          {realWorldQuestions.map((question, index) => (
            <QuestionCard 
              key={`real-${index}`} 
              question={question} 
              index={questions.indexOf(question)} 
              storylineId={storylineId} 
              type={type}
            />
          ))}
        </div>
      )}

      {/* AI Practice Questions Section */}
      {aiPracticeQuestions.length > 0 && (
        <div className="mb-8">
          <div className="flex items-center mb-4 pb-2 border-b border-gray-200">
            <Sparkles className="w-5 h-5 mr-2 text-purple-600" />
            <h3 className="text-lg font-semibold text-gray-800">
              🪄 AI Practice Questions
            </h3>
            <span className="ml-2 text-xs text-purple-600 bg-purple-100 px-2 py-1 rounded-full">
              Generated from your resume and job description
            </span>
          </div>
          
          {/* Check if any questions are from practice sessions */}
          {aiPracticeQuestions.some(q => q.sourceAttribution?.source === 'behavioral-practice-session') && (
            <div className="border-l-4 border-blue-300 bg-blue-50 text-blue-800 p-3 text-sm rounded-md mb-4">
              These questions were generated based on your past responses in a practice session. 
              Use them as a foundation to refine your thinking and improve your performance.
            </div>
          )}
          
          {aiPracticeQuestions.map((question, index) => (
            <QuestionCard 
              key={`ai-${index}`} 
              question={question} 
              index={questions.indexOf(question)} 
              storylineId={storylineId} 
              type={type}
            />
          ))}
        </div>
      )}
    </div>
  );
};

export default QuestionsList;
