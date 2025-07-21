import { useState, useCallback, useRef } from 'react';
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

// Helper function to create deep copy of audio data
const createAudioDeepCopy = (audio: string | null | undefined): string | null => {
  if (!audio) return null;
  
  // Create a proper deep copy of the audio string
  const audioCopy = String(audio);
  console.log('=== Audio Deep Copy Created ===');
  console.log('Original audio length:', audio?.length || 0);
  console.log('Copy audio length:', audioCopy?.length || 0);
  console.log('Audio validation - strings match:', audio === audioCopy);
  
  return audioCopy;
};

// Helper function to validate audio data
const validateAudioData = (audio: string | null | undefined, context: string): boolean => {
  console.log(`=== Audio Validation - ${context} ===`);
  console.log('Audio exists:', !!audio);
  console.log('Audio length:', audio?.length || 0);
  console.log('Audio type:', typeof audio);
  console.log('Audio is non-empty string:', typeof audio === 'string' && audio.length > 0);
  
  const isValid = typeof audio === 'string' && audio.length > 0;
  console.log(`Audio validation result for ${context}:`, isValid);
  
  return isValid;
};

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
  
  // Add a ref to prevent multiple initializations
  const isInitializedRef = useRef(false);
  
  const { toast } = useToast();
  const { user } = useAuthContext();
  const navigate = useNavigate();
  const location = useLocation();
  const locationState = location.state as LocationState | null;

  // Enhanced setCurrentQuestionWithLog with detailed audio tracking
  const setCurrentQuestionWithLog = (value: BehavioralQuestionData | null) => {
    console.log('=== PRE-setCurrentQuestionWithLog ===');
    console.log('About to set current question:', value?.question || 'null');
    console.log('Question object before setting:', value);
    
    if (value?.audio) {
      console.log('=== PRE-SET Audio Analysis ===');
      console.log('Audio exists before setting:', !!value.audio);
      console.log('Audio length before setting:', value.audio?.length || 0);
      console.log('Audio type before setting:', typeof value.audio);
      console.log('Audio preview before setting:', value.audio ? value.audio.substring(0, 50) + '...' : 'No audio');
      
      // Validate audio before setting
      const isValidBeforeSet = validateAudioData(value.audio, 'PRE-SET');
      console.log('Audio validation before set:', isValidBeforeSet);
    } else {
      console.log('=== PRE-SET: No audio data to analyze ===');
    }
    
    // Create deep copy of the entire question object to prevent reference issues
    const questionCopy = value ? {
      ...value,
      audio: createAudioDeepCopy(value.audio)
    } : null;
    
    console.log('=== Question Copy Created ===');
    console.log('Original question audio:', value?.audio ? 'EXISTS' : 'MISSING');
    console.log('Copy question audio:', questionCopy?.audio ? 'EXISTS' : 'MISSING');
    console.log('Audio preserved in copy:', !!questionCopy?.audio && !!value?.audio);
    
    // Set the state with the deep copy
    setCurrentQuestion(questionCopy);
    
    // Post-set validation
    setTimeout(() => {
      console.log('=== POST-setCurrentQuestionWithLog (async check) ===');
      console.log('Current question set successfully');
      
      if (questionCopy?.audio) {
        console.log('=== POST-SET Audio Analysis ===');
        console.log('Audio should exist after setting:', !!questionCopy.audio);
        console.log('Audio length after setting:', questionCopy.audio?.length || 0);
        
        // Validate audio after setting
        const isValidAfterSet = validateAudioData(questionCopy.audio, 'POST-SET');
        console.log('Audio validation after set:', isValidAfterSet);
        
        if (!isValidAfterSet) {
          console.error('=== AUDIO LOST DURING STATE SETTING ===');
          console.error('This indicates a state management issue');
        }
      } else {
        console.log('=== POST-SET: No audio in final state ===');
      }
    }, 100);
    
    // If this is the first question being set, mark initial loading as complete
    if (value && isInitialLoading) {
      console.log('First question set, marking initial loading as complete');
      setIsInitialLoading(false);
    }
  };

  const loadExistingOrSetupInterview = useCallback(async (behavioralId: string, firstQuestion?: { question: string; audio?: string | null }) => {
    console.log('=== loadExistingOrSetupInterview called ===');
    console.log('Behavioral ID:', behavioralId);
    console.log('First question provided:', firstQuestion ? 'Yes' : 'No');
    
    if (firstQuestion?.audio) {
      console.log('=== INITIAL Audio Analysis ===');
      console.log('First question audio exists:', !!firstQuestion.audio);
      console.log('First question audio length:', firstQuestion.audio?.length || 0);
      console.log('First question audio type:', typeof firstQuestion.audio);
      console.log('First question audio preview:', firstQuestion.audio ? firstQuestion.audio.substring(0, 50) + '...' : 'No audio');
      
      // Validate initial audio
      const isValidInitial = validateAudioData(firstQuestion.audio, 'INITIAL-LOAD');
      console.log('Initial audio validation:', isValidInitial);
    } else {
      console.log('=== INITIAL: No audio data provided ===');
    }
    
    // Prevent multiple initializations
    if (isInitializedRef.current) {
      console.log('Already initialized, skipping...');
      return;
    }
    
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
      
      // Mark as initialized BEFORE setting current question
      isInitializedRef.current = true;
      
      // Determine what question to display
      if (existingQuestions.length === 0 && firstQuestion) {
        // Fresh start - use the provided first question with audio
        console.log('=== Fresh start - processing first question with audio ===');
        
        if (firstQuestion.audio) {
          console.log('=== BEFORE State Setting - Audio Preservation ===');
          console.log('Original firstQuestion.audio exists:', !!firstQuestion.audio);
          console.log('Original firstQuestion.audio length:', firstQuestion.audio?.length || 0);
          
          // Create deep copy before state setting
          const preservedAudio = createAudioDeepCopy(firstQuestion.audio);
          console.log('=== Audio Deep Copy Results ===');
          console.log('Preserved audio exists:', !!preservedAudio);
          console.log('Preserved audio length:', preservedAudio?.length || 0);
          console.log('Audio preservation successful:', !!preservedAudio && preservedAudio.length > 0);
          
          // Validate preserved audio
          const isValidPreserved = validateAudioData(preservedAudio, 'PRESERVED-COPY');
          
          if (!isValidPreserved) {
            console.error('=== AUDIO PRESERVATION FAILED ===');
            console.error('Audio was lost during deep copy process');
          }
          
          // Create question object with preserved audio
          const questionWithAudio = {
            question: firstQuestion.question,
            questionIndex: 0,
            audio: preservedAudio // Use the preserved copy
          };
          
          console.log('=== FINAL Question Object Before State Setting ===');
          console.log('Question object:', questionWithAudio);
          console.log('Question object audio exists:', !!questionWithAudio.audio);
          console.log('Question object audio length:', questionWithAudio.audio?.length || 0);
          
          // Final validation before state setting
          const isValidFinal = validateAudioData(questionWithAudio.audio, 'FINAL-BEFORE-STATE');
          
          if (isValidFinal) {
            console.log('=== CALLING setCurrentQuestionWithLog with valid audio ===');
            setCurrentQuestionWithLog(questionWithAudio);
          } else {
            console.error('=== AUDIO VALIDATION FAILED - NOT SETTING STATE ===');
            console.error('Audio was lost during processing, setting question without audio');
            setCurrentQuestionWithLog({
              question: firstQuestion.question,
              questionIndex: 0,
              audio: null
            });
          }
        } else {
          console.log('=== Setting first question without audio ===');
          setCurrentQuestionWithLog({
            question: firstQuestion.question,
            questionIndex: 0,
            audio: null
          });
        }
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
  }, [toast]); // Only depend on toast, not on the changing firstQuestion

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
    // Reset the initialization flag
    isInitializedRef.current = false;
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
