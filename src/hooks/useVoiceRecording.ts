
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logger } from '@/lib/logger';

export const useVoiceRecording = (onTranscriptionComplete: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      logger.debug('Starting microphone access request');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      logger.info('Microphone access granted');
      
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        logger.debug('Audio chunk received', { size: e.data.size });
        audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        logger.debug('Recording stopped, processing chunks', { chunkCount: audioChunks.length });
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        logger.debug('Audio blob created', { size: audioBlob.size });
        
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          logger.debug('FileReader loaded audio data');
          const base64Audio = (reader.result as string).split(',')[1];
          logger.debug('Base64 audio encoded', { length: base64Audio?.length || 0 });
          
          try {
            logger.debug('Sending audio to storyline-audio-function');
            const { data, error } = await supabase.functions.invoke('storyline-audio-function', {
              body: { audio: base64Audio }
            });

            if (error) {
              logger.error('Supabase function error', { error });
              throw error;
            }
            
            logger.debug('Transcription response received', data);
            if (data.text) {
              logger.info('Transcribed text', { text: data.text });
              onTranscriptionComplete(data.text);
            } else {
              logger.warn('No text in transcription response');
            }
          } catch (error) {
            logger.error('Transcription error', { error });
            toast({
              title: "Error",
              description: "Failed to transcribe audio. Please try again.",
              variant: "destructive"
            });
          }
        };

        reader.onerror = (error) => {
          logger.error('FileReader error', { error });
        };

        logger.debug('Reading audio blob as data URL');
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      logger.debug('MediaRecorder started');
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone"
      });
    } catch (error) {
      logger.error('Error accessing microphone', { error });
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  }, [onTranscriptionComplete, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      logger.debug('Stopping recording');
      mediaRecorder.stop();
      mediaRecorder.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      setMediaRecorder(null);
      
      toast({
        title: "Processing",
        description: "Converting your speech to text..."
      });
    }
  }, [mediaRecorder, isRecording, toast]);

  return { isRecording, startRecording, stopRecording };
};
