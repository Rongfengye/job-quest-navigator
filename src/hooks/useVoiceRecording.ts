
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

type TranscriptionCallback = (text: string) => void;

export const useVoiceRecording = (onTranscription?: TranscriptionCallback): UseVoiceRecordingResult => {
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

      recorder.onstop = async () => {
        setIsRecording(false);
        stream.getTracks().forEach(track => track.stop());
        
        // If there's a transcription callback, process the recording
        if (onTranscription && recording) {
          try {
            const reader = new FileReader();
            reader.readAsDataURL(event.data);
            reader.onloadend = async () => {
              const base64Audio = reader.result?.toString().split(',')[1];
              if (base64Audio) {
                const transcribedText = await transcribeAudio(base64Audio);
                if (transcribedText) {
                  onTranscription(transcribedText);
                }
              }
            };
          } catch (error) {
            console.error('Error processing transcription:', error);
          }
        }
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
  }, [toast, onTranscription, recording]);

  const stopRecording = useCallback(async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
      return Promise.resolve();
    }
    return Promise.resolve();
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
