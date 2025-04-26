
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceRecording = (onTranscriptionComplete: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [transcribedText, setTranscribedText] = useState('');
  const [timerInterval, setTimerInterval] = useState<number | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      // Reset the recording timer
      setRecordingTime(0);
      
      // Start a timer to track recording duration
      const interval = window.setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
      
      setTimerInterval(interval);

      recorder.ondataavailable = (e) => {
        audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        // Clear the timer
        if (timerInterval) {
          clearInterval(timerInterval);
          setTimerInterval(null);
        }
        
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const reader = new FileReader();
        
        setIsProcessing(true);
        
        reader.onloadend = async () => {
          const base64Audio = (reader.result as string).split(',')[1];
          
          try {
            const { data, error } = await supabase.functions.invoke('transcribe-audio', {
              body: { audio: base64Audio }
            });

            if (error) throw error;
            
            if (data?.text) {
              setTranscribedText(data.text);
              onTranscriptionComplete(data.text);
              
              toast({
                title: "Transcription complete",
                description: "Your speech has been converted to text"
              });
            }
          } catch (error) {
            console.error('Transcription error:', error);
            toast({
              title: "Error",
              description: "Failed to transcribe audio. Please try again.",
              variant: "destructive"
            });
          } finally {
            setIsProcessing(false);
          }
        };

        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone"
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  }, [onTranscriptionComplete, toast, timerInterval]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
      
      // Clear the timer if it's still running
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
      
      toast({
        title: "Processing",
        description: "Converting your speech to text..."
      });
    }
  }, [mediaRecorder, isRecording, toast, timerInterval]);

  return { 
    isRecording, 
    isProcessing, 
    recordingTime,
    transcribedText,
    startRecording, 
    stopRecording 
  };
};
