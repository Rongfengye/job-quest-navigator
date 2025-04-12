import { useState, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';
import { useUserTokens } from '@/hooks/useUserTokens';
import { useAnswers } from '@/hooks/useAnswers';
import { useAnswerFeedback } from '@/hooks/useAnswerFeedback';
import { supabase } from '@/integrations/supabase/client';
import * as pdfjsLib from 'pdfjs-dist';
import { filterValue, safeDatabaseData } from '@/utils/supabaseTypes';

// Set up the worker for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const useAnswerPage = (storylineId: string | null, questionIndex: number) => {
  const { toast } = useToast();
  const [inputAnswer, setInputAnswer] = useState<string>('');
  const [generatingAnswer, setGeneratingAnswer] = useState(false);
  const [activeTab, setActiveTab] = useState<string>('current');
  const [resumeText, setResumeText] = useState<string>('');
  
  const { deductTokens } = useUserTokens();
  
  const { 
    isLoading, 
    isSaving, 
    question, 
    answer,
    iterations,
    answerRecord,
    saveAnswer,
    error 
  } = useAnswers(storylineId || '', questionIndex);

  const {
    feedback,
    isLoading: isFeedbackLoading,
    error: feedbackError,
    generateFeedback,
    clearFeedback
  } = useAnswerFeedback(storylineId || '', question, questionIndex);

  // Extract text from PDF buffer
  const extractTextFromPDF = async (pdfBuffer: ArrayBuffer): Promise<string> => {
    try {
      const typedArray = new Uint8Array(pdfBuffer);
      
      // Load the PDF document
      const loadingTask = pdfjsLib.getDocument({ data: typedArray });
      const pdfDocument = await loadingTask.promise;
      
      console.log(`PDF loaded successfully. Total pages: ${pdfDocument.numPages}`);
      
      // Extract text from all pages
      let fullText = "";
      const maxPages = pdfDocument.numPages;
      
      for (let i = 1; i <= maxPages; i++) {
        console.log(`Processing page ${i} of ${maxPages}...`);
        const page = await pdfDocument.getPage(i);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
          .map((item: any) => item.str)
          .join(' ');
        
        fullText += pageText + '\n';
        
        // Limit text extraction if it's getting too large
        if (fullText.length > 100000) {
          console.log("Text extraction reached 100000 characters, stopping...");
          break;
        }
      }
      
      // Clean the extracted text - remove PDF artifacts and normalize whitespace
      let cleanedText = fullText
        .replace(/(\r\n|\n|\r)/gm, " ")  // Replace line breaks with spaces
        .replace(/\s+/g, " ")            // Replace multiple spaces with single space
        .trim();                          // Trim whitespace
      
      // Limit to 5000 characters to prevent token overusage
      const truncatedText = cleanedText.substring(0, 5000);
      console.log(`Text extraction complete. Total characters: ${cleanedText.length}, truncated to 5000 characters.`);
      console.log("Text preview:", truncatedText.substring(0, 100) + "...");
      
      return truncatedText;
    } catch (error) {
      console.error("Error extracting text from PDF:", error);
      return "";
    }
  };

  // Fetch resume text when the component loads
  useEffect(() => {
    const fetchResumeText = async () => {
      if (!storylineId) return;
      
      try {
        const { data, error } = await supabase
          .from('storyline_jobs')
          .select('resume_path')
          .eq('id', filterValue(storylineId))
          .single();
          
        if (error) throw error;
        
        if (data?.resume_path) {
          // Download the resume file from storage
          const { data: fileData, error: fileError } = await supabase
            .storage
            .from('job_documents')
            .download(data.resume_path);
            
          if (fileError) throw fileError;
          
          if (fileData) {
            // Extract text from the PDF file
            const buffer = await fileData.arrayBuffer();
            const text = await extractTextFromPDF(buffer);
            setResumeText(text);
          }
        }
      } catch (error) {
        console.error('Error fetching resume text:', error);
        // Non-blocking error - we'll just proceed without resume text
      }
    };
    
    fetchResumeText();
  }, [storylineId]);

  useEffect(() => {
    console.log('AnswerPage: iterations updated from useAnswers', iterations);
  }, [iterations]);

  useEffect(() => {
    if (answer && answer !== inputAnswer) {
      setInputAnswer(answer);
    }
  }, [answer]);

  useEffect(() => {
    // Clear feedback when switching tabs or when the answer changes
    if (activeTab !== 'current') {
      clearFeedback();
    }
  }, [activeTab, clearFeedback]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    
    if (inputAnswer.trim().length < 30) {
      toast({
        variant: "destructive",
        title: "Answer too short",
        description: "Please provide a more complete answer (minimum 30 characters).",
      });
      return;
    }
    
    if (storylineId) {
      // Generate feedback before saving
      const feedbackData = await generateFeedback(inputAnswer);
      
      if (feedbackData) {
        // Save answer with the feedback data
        await saveAnswer(inputAnswer, feedbackData);
        
        toast({
          title: "Success",
          description: "Your answer has been saved and feedback generated.",
        });
      } else {
        // If feedback generation failed, still save the answer without feedback
        await saveAnswer(inputAnswer);
      }
    }
  };

  const handleGenerateAnswer = async () => {
    if (!question) return;
    
    const tokenCheck = await deductTokens(1);
    if (!tokenCheck?.success) {
      return;
    }
    
    setGeneratingAnswer(true);
    
    try {
      // Create the request payload
      const requestPayload = {
        questionIndex,
        questionType: question.type,
        questionText: question.question,
        userInput: inputAnswer, // Pass the current user input
        resumeText: resumeText // Pass the cleaned resume text
      };
      
      console.log('Guided response generator request payload:', JSON.stringify(requestPayload).substring(0, 500) + '...');
      
      // Make the API request
      const { data, error } = await supabase.functions.invoke('guided-response-generator', {
        body: requestPayload
      });
      
      console.log('Guided response generator response:', data, error);
      
      if (error) {
        throw new Error(error.message);
      }
      
      if (data && data.success) {
        // We're not replacing the user's input with a generated answer anymore,
        // just showing the guidance
        
        // Display the guidance information in a toast
        if (data.guidance) {
          toast({
            title: "Response Guide",
            description: "Guiding questions have been provided to help you craft your answer.",
          });
          
          // Parse guiding questions
          if (typeof data.guidance.guidingQuestions === 'string') {
            try {
              // Try to extract questions from a text format
              const questionsText = data.guidance.guidingQuestions;
              const questionsArray = questionsText
                .split(/\d+\.|\n/)
                .map(q => q.trim())
                .filter(q => q && q.endsWith('?'));
              
              if (questionsArray.length > 0) {
                // Dispatch custom event with guiding questions
                const guidanceEvent = new CustomEvent('guidanceReceived', {
                  detail: { guidingQuestions: questionsArray }
                });
                window.dispatchEvent(guidanceEvent);
              } else {
                // Fallback if no questions with question marks were found
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
            // If we already have an array, use it directly
            const guidanceEvent = new CustomEvent('guidanceReceived', {
              detail: { guidingQuestions: data.guidance.guidingQuestions }
            });
            window.dispatchEvent(guidanceEvent);
          }
        }
      } else {
        throw new Error('Failed to generate guided response');
      }
    } catch (error) {
      console.error('Error generating guided response:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: `Failed to generate guided response: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
      
      // Refund token on error
      await deductTokens(-1);
    } finally {
      setGeneratingAnswer(false);
    }
  };

  return {
    inputAnswer,
    setInputAnswer,
    generatingAnswer,
    activeTab,
    setActiveTab,
    isLoading,
    isSaving,
    question,
    answer,
    iterations,
    error,
    feedback,
    isFeedbackLoading,
    feedbackError,
    handleSubmit,
    handleGenerateAnswer
  };
};
