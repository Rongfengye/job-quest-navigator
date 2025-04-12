
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { filterValue } from '@/utils/supabaseTypes';
import { extractTextFromPDF } from './usePdfExtractor';

export const useResumeText = (storylineId: string | null) => {
  const [resumeText, setResumeText] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchResumeText = async () => {
      if (!storylineId) return;
      
      setIsLoading(true);
      
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
        setError(error instanceof Error ? error.message : 'Unknown error');
        // Non-blocking error - we'll just proceed without resume text
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchResumeText();
  }, [storylineId]);

  return { resumeText, isLoading, error };
};
