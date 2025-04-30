
import { useState, useCallback } from 'react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';

export const useVoiceRecording = (onTranscriptionComplete: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const { toast } = useToast();

  const startRecording = useCallback(async () => {
    try {
      console.log('🎤 Starting microphone access request');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('✅ Microphone access granted');
      
      const recorder = new MediaRecorder(stream);
      const audioChunks: BlobPart[] = [];

      recorder.ondataavailable = (e) => {
        console.log(`📊 Audio chunk received: ${e.data.size} bytes`);
        audioChunks.push(e.data);
      };

      recorder.onstop = async () => {
        console.log(`🔄 Recording stopped, processing ${audioChunks.length} chunks`);
        const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
        console.log(`🔊 Audio blob created: ${audioBlob.size} bytes`);
        
        const reader = new FileReader();
        
        reader.onloadend = async () => {
          console.log('📑 FileReader loaded audio data');
          const base64Audio = (reader.result as string).split(',')[1];
          console.log(`📦 Base64 audio length: ${base64Audio?.length || 0} characters`);
          
          try {
            console.log('🚀 Sending audio to storyline-audio-function');
            const { data, error } = await supabase.functions.invoke('storyline-audio-function', {
              body: { audio: base64Audio }
            });

            if (error) {
              console.error('❌ Supabase function error:', error);
              throw error;
            }
            
            console.log('✅ Transcription response received:', data);
            if (data.text) {
              console.log(`📝 Transcribed text: "${data.text}"`);
              onTranscriptionComplete(data.text);
            } else {
              console.warn('⚠️ No text in transcription response');
            }
          } catch (error) {
            console.error('❌ Transcription error:', error);
            toast({
              title: "Error",
              description: "Failed to transcribe audio. Please try again.",
              variant: "destructive"
            });
          }
        };

        reader.onerror = (error) => {
          console.error('❌ FileReader error:', error);
        };

        console.log('🔍 Reading audio blob as data URL');
        reader.readAsDataURL(audioBlob);
      };

      recorder.start();
      console.log('🎙️ MediaRecorder started');
      setMediaRecorder(recorder);
      setIsRecording(true);
      
      toast({
        title: "Recording started",
        description: "Speak clearly into your microphone"
      });
    } catch (error) {
      console.error('❌ Error accessing microphone:', error);
      toast({
        title: "Error",
        description: "Could not access microphone. Please check your permissions.",
        variant: "destructive"
      });
    }
  }, [onTranscriptionComplete, toast]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && isRecording) {
      console.log('🛑 Stopping recording');
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
