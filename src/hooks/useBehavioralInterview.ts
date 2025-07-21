import { useState, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useToast } from '@/hooks/use-toast';
import { useAuthContext } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';

interface BehavioralQuestionData {
  question: string;
  explanation?: string;
  questionIndex: number;
  storylineId?: string;
  audio?: string | null;
  extractedTopics?: string[];
  analytics?: {
    questionNumber: number;
    totalQuestions: number;
    remainingQuestions: number;
    extractedTopics: string[];
    coveredTopics: string[];
    uncoveredTopics: string[];
    coveragePercentage: number;
    topicDepth: Array<{
      topic: string;
      followUpCount: number;
      maxReached: boolean;
    }>;
    completionPrediction: string;
    interviewProgress: number;
  };
}

interface LocationState {
  formData?: {
    jobTitle: string;
    jobDescription: string;
    companyName: string;
    companyDescription: string;
  };
  resumeText?: string;
  resumePath?: string;
  coverLetterText?: string;
  coverLetterPath?: string;
  additionalDocumentsText?: string;
  additionalDocumentsPath?: string;
  isResuming?: boolean;
  behavioralId?: string;
}

export const useBehavioralInterview = () => {
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(false);
  const [isTransitionLoading, setIsTransitionLoading] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [questions, setQuestions] = useState<string[]>([]);
  const [answers, setAnswers] = useState<string[]>([]);
  const [currentQuestion, setCurrentQuestion] = useState<BehavioralQuestionData | null>(null);
  const [interviewComplete, setInterviewComplete] = useState(false);
  const [behavioralId, setBehavioralId] = useState<string | null>(null);
  
  // Topic tracking state for enhanced question generation
  const [extractedTopics, setExtractedTopics] = useState<string[]>([]);
  const [askedTopics, setAskedTopics] = useState<string[]>([]);
  const [topicFollowUpCounts, setTopicFollowUpCounts] = useState<Record<string, number>>({});
  
  const { toast } = useToast();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  // Debug logging for currentQuestion state changes
  const setCurrentQuestionWithLog = (value: BehavioralQuestionData | null) => {
    setCurrentQuestion(value);
    
    // If this is the first question being set, mark initial loading as complete
    if (value && isInitialLoading) {
      setIsInitialLoading(false);
    }
  };

  const loadExistingOrSetupInterview = useCallback(async (behavioralId: string, firstQuestion?: { question: string; audio?: string | null }) => {
    setIsLoading(true);
    
    try {
      console.log('Loading existing or setting up interview:', behavioralId);
      
      const { data: interviewData, error } = await supabase
        .from('storyline_behaviorals')
        .select('*')
        .eq('id', behavioralId)
        .single();
      
      if (error) {
        throw new Error(`Failed to load interview: ${error.message}`);
      }
      
      if (!interviewData) {
        throw new Error('Interview not found');
      }
      
      console.log('Loaded interview data:', interviewData);
      
      // Extract and validate data
      const existingQuestions = (Array.isArray(interviewData.questions) ? interviewData.questions : []) as string[];
      const existingResponses = (Array.isArray(interviewData.responses) ? interviewData.responses : []) as string[];
      
      // Calculate where to resume based on existing data
      const resumeQuestionIndex = existingResponses.length;
      
      console.log(`Setting up interview at question ${resumeQuestionIndex + 1} with ${existingQuestions.length} existing questions`);
      
      // Set the state
      setQuestions(existingQuestions);
      setAnswers(existingResponses);
      setCurrentQuestionIndex(resumeQuestionIndex);
      setBehavioralId(behavioralId);
      
      // Determine what question to display
      if (existingQuestions.length === 0 && firstQuestion) {
        // Fresh start - use the provided first question with audio
        console.log('Fresh start - using first question with audio');
        setCurrentQuestionWithLog({
          question: firstQuestion.question,
          questionIndex: 0,
          audio: firstQuestion.audio || null
        });
      } else if (resumeQuestionIndex < existingQuestions.length) {
        // Resume with existing question - no audio replay
        console.log('Resuming with existing question at index:', resumeQuestionIndex);
        const currentQuestionText = existingQuestions[resumeQuestionIndex];
        setCurrentQuestionWithLog({
          question: currentQuestionText,
          questionIndex: resumeQuestionIndex,
          audio: null // Don't replay audio for existing questions
        });
      } else if (resumeQuestionIndex === existingQuestions.length && resumeQuestionIndex < 5) {
        // Need to generate next question
        console.log('Ready to generate next question at index:', resumeQuestionIndex);
        setCurrentQuestionWithLog(null);
      } else {
        // Interview complete or invalid state
        console.log('Interview complete or invalid state');
        setCurrentQuestionWithLog(null);
      }
      
      // Return the loaded form data
      return {
        formData: {
          jobTitle: interviewData.job_title,
          jobDescription: interviewData.job_description,
          companyName: interviewData.company_name || '',
          companyDescription: interviewData.company_description || ''
        },
        resumePath: interviewData.resume_path,
        coverLetterPath: interviewData.cover_letter_path,
        additionalDocumentsPath: interviewData.additional_documents_path
      };
      
    } catch (error) {
      console.error('Error in loadExistingOrSetupInterview:', error);
      toast({
        variant: "destructive",
        title: "Error loading interview",
        description: error instanceof Error ? error.message : "Failed to load interview",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const loadExistingInterview = useCallback(async (behavioralId: string) => {
    setIsLoading(true);
    
    try {
      console.log('Loading existing interview:', behavioralId);
      
      const { data: interviewData, error } = await supabase
        .from('storyline_behaviorals')
        .select('*')
        .eq('id', behavioralId)
        .single();
      
      if (error) {
        throw new Error(`Failed to load interview: ${error.message}`);
      }
      
      if (!interviewData) {
        throw new Error('Interview not found');
      }
      
      console.log('Loaded interview data:', interviewData);
      
      // Extract and validate data
      const existingQuestions = (Array.isArray(interviewData.questions) ? interviewData.questions : []) as string[];
      const existingResponses = (Array.isArray(interviewData.responses) ? interviewData.responses : []) as string[];
      
      // Load topic tracking data from database
      const extractedTopicsFromDb = Array.isArray(interviewData.extracted_topics) ? interviewData.extracted_topics as string[] : [];
      const askedTopicsFromDb = Array.isArray(interviewData.asked_topics) ? interviewData.asked_topics as string[] : [];
      const topicFollowUpCountsFromDb = (interviewData.topic_follow_up_counts && typeof interviewData.topic_follow_up_counts === 'object' && !Array.isArray(interviewData.topic_follow_up_counts)) 
        ? interviewData.topic_follow_up_counts as Record<string, number> 
        : {};
      
      // Calculate where to resume
      const resumeQuestionIndex = existingResponses.length;
      
      console.log(`Resuming at question ${resumeQuestionIndex + 1} of ${existingQuestions.length}`);
      console.log('Loaded topic tracking data:', {
        extractedTopics: extractedTopicsFromDb,
        askedTopics: askedTopicsFromDb,
        topicFollowUpCounts: topicFollowUpCountsFromDb
      });
      
      // Set the state
      setQuestions(existingQuestions);
      setAnswers(existingResponses);
      setCurrentQuestionIndex(resumeQuestionIndex);
      setBehavioralId(behavioralId);
      setExtractedTopics(extractedTopicsFromDb);
      setAskedTopics(askedTopicsFromDb);
      setTopicFollowUpCounts(topicFollowUpCountsFromDb);
      
      // If we have a question to display immediately
      if (resumeQuestionIndex < existingQuestions.length) {
        const currentQuestionText = existingQuestions[resumeQuestionIndex];
        setCurrentQuestionWithLog({
          question: currentQuestionText,
          questionIndex: resumeQuestionIndex,
          audio: null // We don't store audio for resumed questions
        });
        console.log('Resuming with an existing question.');
      } 
      // If we have answered all fetched questions and there are more to come
      else if (resumeQuestionIndex === existingQuestions.length && resumeQuestionIndex < 5) {
        // We don't have the next question text yet, but we are in a state to generate it.
        // Set currentQuestion to null, and the interview page will trigger generation.
        setCurrentQuestionWithLog(null);
        console.log('Ready to generate next question on resume.');
      }
      // If we have answered 5 or more, or some other invalid state.
      else {
        console.error(`Invalid resume state: resumeIndex=${resumeQuestionIndex}, questions=${existingQuestions.length}`);
        throw new Error('No more questions to resume from');
      }
      
      // Return the loaded form data so it can be set in the component
      return {
        formData: {
          jobTitle: interviewData.job_title,
          jobDescription: interviewData.job_description,
          companyName: interviewData.company_name || '',
          companyDescription: interviewData.company_description || ''
        },
        resumePath: interviewData.resume_path,
        coverLetterPath: interviewData.cover_letter_path,
        additionalDocumentsPath: interviewData.additional_documents_path
      };
      
    } catch (error) {
      console.error('Error loading existing interview:', error);
      toast({
        variant: "destructive",
        title: "Error loading interview",
        description: error instanceof Error ? error.message : "Failed to load existing interview",
      });
      throw error;
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  const setInitialQuestions = async (generatedData: any) => {
    if (!generatedData) return;
    
    try {
      const technicalQuestions = generatedData.technicalQuestions || [];
      const behavioralQuestions = generatedData.behavioralQuestions || [];
      const allQuestions = [...technicalQuestions, ...behavioralQuestions].slice(0, 5);
      
      if (allQuestions.length === 0) {
        throw new Error('No questions found in the generated data');
      }
      
      const randomIndex = Math.floor(Math.random() * allQuestions.length);
      const randomQuestion = allQuestions[randomIndex];
      
      const formattedQuestion: BehavioralQuestionData = {
        question: randomQuestion.question,
        explanation: randomQuestion.explanation || '',
        questionIndex: 0
      };
      
      const questionTexts = allQuestions.map((q: any) => q.question);
      setQuestions(questionTexts);
      setCurrentQuestionWithLog(formattedQuestion);
      setIsLoading(false);
      
      console.log('Set initial questions:', questionTexts);
    } catch (error) {
      console.error('Error setting initial questions:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to process the generated questions. Please try again.",
      });
    }
  };

  const generateQuestion = useCallback(async (
    formData: {
      jobTitle: string;
      jobDescription: string;
      companyName: string;
      companyDescription: string;
    },
    resumeText: string,
    coverLetterText: string = '',
    additionalDocumentsText: string = '',
    resumePath: string = '',
    coverLetterPath: string = '',
    additionalDocumentsPath: string = '',
    existingBehavioralId?: string
  ) => {
    setIsLoading(true);
    
    try {
      // If we have an existing behavioralId, use it
      if (existingBehavioralId) {
        setBehavioralId(existingBehavioralId);
      }
      
      const requestBody = {
        jobTitle: formData.jobTitle,
        jobDescription: formData.jobDescription,
        companyName: formData.companyName,
        companyDescription: formData.companyDescription,
        resumeText,
        coverLetterText,
        additionalDocumentsText,
        previousQuestions: questions,
        previousAnswers: answers,
        questionIndex: currentQuestionIndex,
        generateAudio: true,
        voice: 'alloy',
        resumePath: resumePath || '',
        // Add usage limit check parameters
        userId: user?.id,
        isFirstQuestion: currentQuestionIndex === 0,
        // Topic tracking parameters for enhanced question generation
        extractedTopics,
        askedTopics,
        topicFollowUpCounts,
        existingBehavioralId: existingBehavioralId || behavioralId
      };
      
      console.log(`Generating question at index: ${currentQuestionIndex}`);
      console.log(`Using resume path: ${resumePath}`);
      
      const { data, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: requestBody,
      });
      
      if (error) {
        // Handle usage limit exceeded error - don't block, let soft gate handle it
        if (error.message && error.message.includes('Usage limit exceeded')) {
          // Let the UI components handle the soft gate display
          console.log('Usage limit reached, letting soft gate handle it');
          return null;
        }
        throw new Error(`Error generating question: ${error.message}`);
      }
      
      if (!data || !data.question) {
        throw new Error('No question was generated');
      }
      
      console.log('Question generated:', data.question);
      console.log('Audio data received:', data.audio ? 'Yes' : 'No');
      console.log('Analytics received:', data.analytics);
      
      // Update topic tracking state with new data from response
      if (data.extractedTopics && data.extractedTopics.length > 0) {
        setExtractedTopics(data.extractedTopics);
      }
      
      // Update analytics and topic tracking from response
      if (data.analytics) {
        setAskedTopics(data.analytics.coveredTopics);
        
        // Update follow-up counts based on analytics topic depth
        const newFollowUpCounts: Record<string, number> = {};
        data.analytics.topicDepth.forEach(topicInfo => {
          newFollowUpCounts[topicInfo.topic] = topicInfo.followUpCount;
        });
        setTopicFollowUpCounts(newFollowUpCounts);
      }
      
      const questionData: BehavioralQuestionData = {
        ...data,
        storylineId: behavioralId || undefined
      };
      
      setCurrentQuestionWithLog(questionData);
      
      // Update questions array immediately when question is generated
      const existingQuestions = [...questions];
      existingQuestions.push(data.question);
      setQuestions(existingQuestions);
      
      const BehavioralIdToUse = existingBehavioralId || behavioralId;
      
      console.log('BehavioralIdToUse', BehavioralIdToUse, 'existingBehavioralId', existingBehavioralId, 'behavioralId', behavioralId)
      if (BehavioralIdToUse) {
        // Append the new question to the questions array in the database
        const { data: currentData } = await supabase
          .from('storyline_behaviorals')
          .select('questions')
          .eq('id', BehavioralIdToUse)
          .single();
          
        if (currentData) {
          const updatedQuestions = Array.isArray(currentData.questions) ? currentData.questions : [];
          updatedQuestions.push(data.question);
          
          const { error: updateError } = await supabase
            .from('storyline_behaviorals')
            .update({
              questions: updatedQuestions
            })
            .eq('id', BehavioralIdToUse);
            
          if (updateError) {
            console.error('Error updating questions:', updateError);
          } else {
            console.log('Successfully appended question in database');
          }
        }
      }
      
      return data;
    } catch (error) {
      console.error('Error in generateQuestion:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate interview question",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  }, [currentQuestionIndex, questions, answers, behavioralId, toast, user?.id, navigate]);

  const generateFeedback = async (providedAnswers?: string[]) => {
    setIsLoading(true);
    try {
      let questionsToUse = questions;
      let answersToUse = providedAnswers || answers;
      
      // Fetch latest questions and responses from DB for consistency
      if (behavioralId) {
        const { data: dbData, error: dbError } = await supabase
          .from('storyline_behaviorals')
          .select('questions, responses')
          .eq('id', behavioralId)
          .single();
        if (dbError) {
          throw new Error(`Error fetching latest questions/responses: ${dbError.message}`);
        }
        if (dbData) {
          questionsToUse = Array.isArray(dbData.questions) ? dbData.questions.filter((q: any) => typeof q === 'string') as string[] : questionsToUse;
          answersToUse = Array.isArray(dbData.responses) ? dbData.responses.filter((a: any) => typeof a === 'string') as string[] : answersToUse;
        }
      }
      
      if (!answersToUse.every(a => a?.trim())) {
        console.error('One or more answers are empty', answersToUse);
        throw new Error('Cannot generate feedback: one or more answers are empty');
      }
      
      const jobData = locationState?.formData || {
        jobTitle: '',
        jobDescription: '',
        companyName: '',
        companyDescription: '',
      };

      console.log('Generating feedback for questions:', questionsToUse);
      console.log('Generating feedback for answers:', answersToUse);

      const { data: response, error } = await supabase.functions.invoke('storyline-create-behavioral-interview', {
        body: {
          generateFeedback: true,
          questions: questionsToUse,
          answers: answersToUse,
          jobTitle: jobData.jobTitle,
          jobDescription: jobData.jobDescription,
          companyName: jobData.companyName,
          companyDescription: jobData.companyDescription,
          resumeText: locationState?.resumeText || '',
          extractedTopics: extractedTopics
        },
      });

      if (error) {
        throw new Error(`Error generating feedback: ${error.message}`);
      }

      if (!response || !response.feedback) {
        throw new Error('No feedback was generated');
      }

      console.log('Feedback received:', response.feedback);

      if (behavioralId) {
        // Save both feedback and ensure questions are also saved
        const updateResult = await supabase
          .from('storyline_behaviorals')
          .update({
            feedback: response.feedback,
            questions: questionsToUse,  // Ensure questions are saved with feedback
            responses: answersToUse
          })
          .eq('id', behavioralId);
          
        if (updateResult.error) {
          console.error('Error saving feedback to database:', updateResult.error);
        } else {
          console.log('Successfully saved feedback and questions to database');
        }
      }

      toast({
        title: "Feedback Generated",
        description: "Your interview responses have been evaluated.",
      });
      
      return response.feedback;
    } catch (error) {
      console.error('Error in generateFeedback:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to generate feedback",
      });
      return null;
    } finally {
      setIsLoading(false);
    }
  };

  const submitAnswer = async (answer: string) => {
    if (!currentQuestion) return;
    
    try {
      const updatedAnswers = [...answers];
      updatedAnswers.push(answer);
      setAnswers(updatedAnswers);
      
      if (behavioralId) {
        // Append the new answer to the responses array in the database
        const { data: currentData } = await supabase
          .from('storyline_behaviorals')
          .select('responses')
          .eq('id', behavioralId)
          .single();
          
        if (currentData) {
          const existingResponses = Array.isArray(currentData.responses) ? currentData.responses : [];
          existingResponses.push(answer);
          
          const { error: updateError } = await supabase
            .from('storyline_behaviorals')
            .update({
              responses: existingResponses
            })
            .eq('id', behavioralId);
            
          if (updateError) {
            console.error('Error updating responses:', updateError);
          } else {
            console.log('Successfully appended response in database');
          }
        }
      }
      
      if (currentQuestionIndex >= 4) {
        setInterviewComplete(true);
        console.log('Final answer submitted, all answers:', {
          answers: updatedAnswers
        });
      } else {
        setIsTransitionLoading(true);
        setCurrentQuestionIndex(prev => prev + 1);
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to save your answer. Please try again.",
      });
    }
  };

  const resetInterview = () => {
    setCurrentQuestionIndex(0);
    setQuestions([]);
    setAnswers([]);
    setCurrentQuestionWithLog(null);
    setInterviewComplete(false);
    setBehavioralId(null);
    setIsInitialLoading(true);
    setIsTransitionLoading(false);
    setExtractedTopics([]);
    setAskedTopics([]);
    setTopicFollowUpCounts({});
  };

  return {
    isLoading,
    isInitialLoading,
    isTransitionLoading,
    currentQuestionIndex,
    questions,
    answers,
    currentQuestion,
    interviewComplete,
    generateQuestion,
    submitAnswer,
    resetInterview,
    setInitialQuestions,
    generateFeedback,
    behavioralId,
    setIsTransitionLoading,
    setCurrentQuestion: setCurrentQuestionWithLog,
    setBehavioralId,
    loadExistingInterview,
    loadExistingOrSetupInterview
  };
};
