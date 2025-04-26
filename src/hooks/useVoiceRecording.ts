import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface UseVoiceRecordingResult {
  isRecording: boolean;
  recording: Blob | null;
  startRecording: () => Promise<void>;
  stopRecording: () => Promise<void>;
  transcribeAudio: (audioBase64: string) => Promise<string | null>;
  resetRecording: () => void;
}

export const useVoiceRecording = (): UseVoiceRecordingResult => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [recording, setRecording] = useState<Blob | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (event) => {
        setRecording(event.data);
      };

      recorder.onstop = () => {
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
      };

      setMediaRecorder(recorder);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to start recording. Please check your microphone permissions.",
      });
    }
  }, [toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  }, [mediaRecorder]);

  const transcribeAudio = async (audioBase64: string) => {
    try {
      const { data, error } = await supabase.functions.invoke('storyline-transcribe-audio', {
        body: { audio: audioBase64 }
      });

      if (error) {
        throw error;
      }

      if (data && data.text) {
        return data.text as string;
      } else {
        toast({
          variant: "destructive",
          title: "Transcription Failed",
          description: "Could not transcribe the audio. Please try again.",
        });
        return null;
      }
    } catch (error) {
      console.error('Error transcribing audio:', error);
      toast({
        variant: "destructive",
        title: "Transcription Error",
        description: "Failed to transcribe audio. Please try again.",
      });
      return null;
    }
  };

  const resetRecording = () => {
    setRecording(null);
  };

  return {
    isRecording,
    recording,
    startRecording,
    stopRecording,
    transcribeAudio,
    resetRecording
  };
};
