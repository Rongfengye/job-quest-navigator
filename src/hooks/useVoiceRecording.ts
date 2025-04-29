
import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useVoiceRecording = (onTranscriptionComplete: (text: string) => void) => {
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
  const [audioChunks, setAudioChunks] = useState<Blob[]>([]);
  const { toast } = useToast();

  // Check browser support for audio capabilities
  const checkBrowserSupport = useCallback(() => {
    console.log('Checking browser media support:');
    console.log('- getUserMedia support:', !!navigator.mediaDevices?.getUserMedia);
    console.log('- MediaRecorder support:', typeof MediaRecorder !== 'undefined');
    
    if (MediaRecorder && MediaRecorder.isTypeSupported) {
      console.log('Audio format support:');
      console.log('- audio/webm support:', MediaRecorder.isTypeSupported('audio/webm'));
      console.log('- audio/webm;codecs=opus support:', MediaRecorder.isTypeSupported('audio/webm;codecs=opus'));
      console.log('- audio/mp4 support:', MediaRecorder.isTypeSupported('audio/mp4'));
      console.log('- audio/ogg support:', MediaRecorder.isTypeSupported('audio/ogg'));
      console.log('- audio/wav support:', MediaRecorder.isTypeSupported('audio/wav'));
    }
  }, []);

  const startRecording = useCallback(async () => {
    console.log('Starting recording...');
    checkBrowserSupport();
    
    try {
      console.log('Requesting microphone permission...');
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      console.log('Microphone permission granted', stream);
      
      // Choose the most compatible format based on browser support
      let mimeType = 'audio/webm';
      if (MediaRecorder.isTypeSupported) {
        if (MediaRecorder.isTypeSupported('audio/webm')) {
          mimeType = 'audio/webm';
        } else if (MediaRecorder.isTypeSupported('audio/mp4')) {
          mimeType = 'audio/mp4';
        } else if (MediaRecorder.isTypeSupported('audio/ogg')) {
          mimeType = 'audio/ogg';
        }
      }
      console.log(`Using audio format: ${mimeType}`);
      
      const recorder = new MediaRecorder(stream, { mimeType });
      console.log('MediaRecorder created:', recorder);
      
      recorder.ondataavailable = (event) => {
        console.log(`Data available event, data size: ${event.data.size} bytes`);
        if (event.data.size > 0) {
          setAudioChunks((prev) => [...prev, event.data]);
        }
      };

      recorder.onstop = async () => {
        console.log('Recording stopped');
        stream.getTracks().forEach(track => {
          console.log(`Stopping track: ${track.kind}`, track);
          track.stop();
        });
        setIsRecording(false);

        console.log(`Total audio chunks: ${audioChunks.length}`);
        
        if (audioChunks.length === 0) {
          console.error('No audio chunks collected');
          toast({
            variant: "destructive",
            title: "Recording Error",
            description: "No audio data was captured. Please try again.",
          });
          return;
        }

        const audioBlob = new Blob(audioChunks, { type: mimeType });
        console.log(`Audio blob created, size: ${audioBlob.size} bytes, type: ${audioBlob.type}`);
        
        if (audioBlob.size < 100) {
          console.error('Audio blob too small, likely no data recorded');
          toast({
            variant: "destructive",
            title: "Recording Error",
            description: "Recording too short or no audio captured. Please try again.",
          });
          setAudioChunks([]);
          return;
        }

        try {
          console.log('Converting audio blob to base64...');
          const base64Audio = await new Promise<string>((resolve) => {
            const reader = new FileReader();
            reader.onloadend = () => {
              const result = reader.result as string;
              console.log(`Base64 conversion complete, length: ${result.length}`);
              resolve(result);
            };
            reader.readAsDataURL(audioBlob);
          });
          
          const base64Data = base64Audio.split(',')[1];
          console.log(`Base64 data extracted, length: ${base64Data?.length || 0}`);
          
          if (!base64Data || base64Data.length < 100) {
            throw new Error('Invalid or empty base64 audio data');
          }

          console.log('Sending audio to transcription service...');
          const { data: transcriptionData, error } = await supabase.functions.invoke('storyline-audio-function', {
            body: { audio: base64Data }
          });

          console.log('Transcription response:', { transcriptionData, error });

          if (error) {
            throw new Error(`Failed to transcribe audio: ${error.message}`);
          }

          if (transcriptionData && transcriptionData.text) {
            console.log('Transcription successful:', transcriptionData.text);
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
      
      // Start recording with small timeslices for more frequent ondataavailable events
      recorder.start(1000); // Collect data every second
      console.log('Recording started');
      setIsRecording(true);
    } catch (error) {
      console.error('Error starting recording:', error);
      toast({
        variant: "destructive",
        title: "Recording Error",
        description: `Failed to start voice recording: ${error instanceof Error ? error.message : 'Unknown error'}`,
      });
    }
  }, [audioChunks, onTranscriptionComplete, toast, checkBrowserSupport]);

  const stopRecording = useCallback(() => {
    if (mediaRecorder && mediaRecorder.state === 'recording') {
      console.log('Stopping recording...');
      mediaRecorder.stop();
    } else {
      console.log('Cannot stop recording - no active recorder or not recording', { 
        mediaRecorder: mediaRecorder ? mediaRecorder.state : 'null' 
      });
    }
  }, [mediaRecorder]);

  // Run the browser support check on hook initialization
  useState(() => {
    checkBrowserSupport();
  });

  return { isRecording, startRecording, stopRecording };
};
