import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserTokens } from '@/hooks/useUserTokens';
import { Question } from '@/hooks/useQuestionData';
import { supabase } from '@/integrations/supabase/client';
import { FeedbackData } from '@/hooks/useAnswerFeedback';

export const useGuidedResponse = (questionIndex: number, question: Question | null, previousFeedback?: FeedbackData | null) => {
  const { toast } = useToast();
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [processingThoughts, setProcessingThoughts] = useState(false);
  const { deductTokens } = useUserTokens();

  useEffect(() => {
    const handleThoughtsSubmitted = async (event: CustomEvent) => {
      if (!question) return;
      
      const { thoughts } = event.detail;
      
      const tokenCheck = await deductTokens(1);
      if (!tokenCheck?.success) {
        toast({
          variant: "destructive",
          title: "Insufficient tokens",
          description: "You need 1 token to process your thoughts into a response.",
        });
        return;
      }
      
      setProcessingThoughts(true);
      
      try {
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
        
        await deductTokens(-1);
        return false;
      } finally {
        setProcessingThoughts(false);
      }
    };

    window.addEventListener('thoughtsSubmitted' as any, handleThoughtsSubmitted);
    
    return () => {
      window.removeEventListener('thoughtsSubmitted' as any, handleThoughtsSubmitted);
    };
  }, [questionIndex, question, deductTokens, toast]);

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
    
    const tokenCheck = await deductTokens(1);
    if (!tokenCheck?.success) {
      toast({
        variant: "destructive",
        title: "Insufficient tokens",
        description: "You need 1 token to generate guided response.",
      });
      return;
    }
    
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
      
      if (data && data.success) {
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
      } else {
        throw new Error('Failed to generate guided response');
      }
      
      return false;
    } catch (error) {
      console.error('Error generating guided response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate guided response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      await deductTokens(-1);
      return false;
    } finally {
      setGeneratingAnswer(false);
    }
  };

  return { generatingAnswer, processingThoughts, generateGuidedResponse };
};
