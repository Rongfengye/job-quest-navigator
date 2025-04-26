import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoiceRecording = (onTranscriptionComplete: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' });

      recorder.ondataavailable = (event) => {
        setAudioChunks((prev) => [...prev, event.data]);
      };

      recorder.onstop = async () => {
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);

        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        const base64Audio = await new Promise<string>((resolve) => {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(audioBlob);
        });

        try {
          const { data: transcriptionData, error } = await supabase.functions.invoke('storyline-transcribe-audio', {
            body: { audio: base64Audio.split(',')[1] }
          });

          if (error) {
            throw new Error(`Failed to transcribe audio: ${error.message}`);
          }

          if (transcriptionData && transcriptionData.text) {
            onTranscriptionComplete(transcriptionData.text);
            toast({
              title: "Transcription Complete",
              description: "Voice recording transcribed successfully.",
            });
          } else {
            throw new Error('No transcription text received');
          }
        } catch (error) {
          console.error('Error transcribing audio:', error);
          toast({
            variant: "destructive",
            title: "Transcription Error",
            description: `Failed to transcribe voice recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
          });
        } finally {
          setAudioChunks([]);
        }
      };

      setMediaRecorder(recorder);
      setAudioChunks([]);
      recorder.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: `Failed to start voice recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [onTranscriptionComplete, toast]);

  const stopRecording = async () => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      mediaRecorder.stop();
    }
  };

  return { isRecording, startRecording, stopRecording };
};
