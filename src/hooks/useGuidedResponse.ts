import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { Question } from '@/hooks/useQuestionData';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackData } from '@/hooks/useAnswerFeedback';
import { useAnswers } from '@/hooks/useAnswers';

export const useGuidedResponse = (
  questionIndex: number, 
  question: Question | null,
  storylineId: string,
  previousFeedback?: FeedbackData | null
) => {
  const { toast } = useToast();
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [processingThoughts, setProcessingThoughts] = useState(false);
  
  const { iterations } = useAnswers(storylineId, questionIndex);

  useEffect(() => {
    const handleThoughtsSubmitted = async (event: CustomEvent) => {
      if (!question) return;
      
      const { thoughts } = event.detail;
      
      setProcessingThoughts(true);
      
      try {
        let previousResponse = null;
        let latestFeedback = previousFeedback || null;
        
        if (iterations.length > 0) {
          const latestIteration = [...iterations].sort((a, b) => 
            new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
          )[0];
          
          previousResponse = latestIteration?.answerText || null;
          console.log(`Found previous response (${previousResponse ? previousResponse.length : 0} chars)`);
          
          if (latestIteration?.feedback && !latestFeedback) {
            latestFeedback = latestIteration.feedback;
            console.log('Found feedback in latest iteration:', latestFeedback ? 'Yes' : 'No');
          }
        }
        
        const requestPayload = {
          questionIndex,
          questionType: question.type,
          questionText: question.question,
          userThoughts: thoughts,
          previousResponse,
          previousFeedback: latestFeedback
        };
        
        console.log('Sending thoughts processing request with payload:', JSON.stringify({
          ...requestPayload,
          userThoughts: `${thoughts.substring(0, 50)}... (${thoughts.length} chars)`,
          previousResponse: previousResponse ? `(${previousResponse.length} chars)` : null,
          previousFeedback: latestFeedback ? `(has ${latestFeedback.pros?.length || 0} pros, ${latestFeedback.cons?.length || 0} cons)` : null
        }));
        
        const { data, error } = await supabase.functions.invoke('storyline-guided-response-generator', {
          body: {
            ...requestPayload,
            action: 'processThoughts'
          }
        });
        
        if (error) {
          throw new Error(error.message);
        }
        
        if (data && data.success && data.generatedResponse) {
          if (data.feedback) {
            toast({
              title: "AI Coach",
              description: data.feedback,
            });
          } else {
            toast({
              title: "Response Generated",
              description: "Your thoughts have been transformed into a structured answer.",
            });
          }
          
          const responseEvent = new CustomEvent('responseGenerated', {
            detail: { generatedResponse: data.generatedResponse }
          });
          window.dispatchEvent(responseEvent);
          
          return true;
        } else {
          throw new Error('Failed to process thoughts into a response');
        }
      } catch (error) {
        console.error('Error processing thoughts:', error);
        toast({
          variant: "destructive",
          title: "Error",
          description: `Failed to process thoughts: ${error instanceof Error ? error.message : 'Unknown error'}`,
        });
        
        return false;
      } finally {
        setProcessingThoughts(false);
      }
    };

    window.addEventListener('thoughtsSubmitted' as any, handleThoughtsSubmitted);
    
    return () => {
      window.removeEventListener('thoughtsSubmitted' as any, handleThoughtsSubmitted);
    };
  }, [questionIndex, question, toast, iterations, previousFeedback]);

  useEffect(() => {
    const handleResponseGenerated = (event: CustomEvent) => {
      const { generatedResponse } = event.detail;
      
      const responseEvent = new CustomEvent('responseReceived', {
        detail: { generatedResponse }
      });
      window.dispatchEvent(responseEvent);
    };

    window.addEventListener('responseGenerated' as any, handleResponseGenerated);
    
    return () => {
      window.removeEventListener('responseGenerated' as any, handleResponseGenerated);
    };
  }, []);

  const generateGuidedResponse = async (inputAnswer: string, resumeText: string) => {
    if (!question) return;
    
    setGeneratingAnswer(true);
    
    try {
      const requestPayload = {
        questionIndex,
        questionType: question.type,
        questionText: question.question,
        userInput: inputAnswer,
        resumeText: resumeText,
        action: 'generateQuestions',
        previousFeedback: previousFeedback || null
      };
      
      const { data, error } = await supabase.functions.invoke('storyline-guided-response-generator', {
        body: requestPayload
      });
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (!data || !data.success) {
        throw new Error('Failed to generate guided response');
      }
      
      if (data.guidance) {
        toast({
          title: "Response Guide",
          description: "Guiding questions have been provided to help you craft your answer.",
        });
        
        if (typeof data.guidance.guidingQuestions === 'string') {
          try {
            const questionsText = data.guidance.guidingQuestions;
            const questionsArray = questionsText
              .split(/\d+\.|\n/)
              .map(q => q.trim())
              .filter(q => q && q.endsWith('?'));
            
            if (questionsArray.length > 0) {
              const guidanceEvent = new CustomEvent('guidanceReceived', {
                detail: { guidingQuestions: questionsArray }
              });
              window.dispatchEvent(guidanceEvent);
            } else {
              const lines = questionsText
                .split('\n')
                .map(line => line.trim())
                .filter(line => line.length > 10);
              
              if (lines.length > 0) {
                const guidanceEvent = new CustomEvent('guidanceReceived', {
                  detail: { guidingQuestions: lines.slice(0, 5) }
                });
                window.dispatchEvent(guidanceEvent);
              }
            }
          } catch (parseError) {
            console.error('Error parsing guiding questions:', parseError);
          }
        } else if (Array.isArray(data.guidance.guidingQuestions)) {
          const guidanceEvent = new CustomEvent('guidanceReceived', {
            detail: { guidingQuestions: data.guidance.guidingQuestions }
          });
          window.dispatchEvent(guidanceEvent);
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      console.error('Error generating guided response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate guided response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      return false;
    } finally {
      setGeneratingAnswer(false);
    }
  };

  return { generatingAnswer, processingThoughts, generateGuidedResponse };
};
