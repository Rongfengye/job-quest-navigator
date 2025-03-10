
import React, { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Mic, StopCircle, Loader2 } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuthContext } from '@/context/AuthContext';
import { useUserTokens } from '@/hooks/useUserTokens';

interface AudioRecorderProps {
  onTranscriptionComplete: (text: string) => void;
  questionId?: string;
}

const AudioRecorder: React.FC<AudioRecorderProps> = ({
  onTranscriptionComplete,
  questionId
}) => {
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();
  const { user } = useAuthContext();
  const { tokens, fetchTokens } = useUserTokens();

  useEffect(() => {
    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
      stopRecording();
    };
  }, []);

  const startRecording = async () => {
    if (!user) {
      toast({
        variant: "destructive",
        title: "Authentication Required",
        description: "Please log in to use this feature.",
      });
      return;
    }

    if (tokens !== null && tokens < 1) {
      toast({
        variant: "destructive",
        title: "Insufficient Tokens",
        description: "You need at least 1 token to use voice transcription.",
      });
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        processAudio();
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      
      // Start timer
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);

      toast({
        title: "Recording Started",
        description: "Speak clearly into your microphone.",
      });
    } catch (error) {
      console.error('Error accessing microphone:', error);
      toast({
        variant: "destructive",
        title: "Microphone Error",
        description: "Could not access your microphone. Please check permissions.",
      });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      mediaRecorderRef.current.stream.getTracks().forEach(track => track.stop());
      setIsRecording(false);
      
      // Stop timer
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const processAudio = async () => {
    if (audioChunksRef.current.length === 0) return;
    
    setIsProcessing(true);
    try {
      const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
      
      // Convert blob to base64
      const reader = new FileReader();
      reader.readAsDataURL(audioBlob);
      reader.onloadend = async () => {
        const base64data = reader.result as string;
        // Remove the data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Audio = base64data.split(',')[1];
        
        // Call the Supabase Edge Function
        const { data, error } = await supabase.functions.invoke('audio-transcription', {
          body: { 
            audio: base64Audio,
            userId: user?.id,
            questionId
          }
        });

        if (error) {
          throw error;
        }

        if (data.error) {
          throw new Error(data.error);
        }

        // Update the transcript and tokens
        onTranscriptionComplete(data.text);
        fetchTokens();
        
        toast({
          title: "Transcription Complete",
          description: "Your speech has been transcribed.",
        });
      };
    } catch (error) {
      console.error('Transcription error:', error);
      toast({
        variant: "destructive",
        title: "Transcription Failed",
        description: error instanceof Error ? error.message : "An error occurred during transcription.",
      });
    } finally {
      setIsProcessing(false);
      audioChunksRef.current = [];
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="flex items-center gap-2">
      {!isRecording ? (
        <Button
          type="button"
          variant="outline"
          onClick={startRecording}
          disabled={isProcessing || (tokens !== null && tokens < 1)}
          className="flex items-center gap-2"
          title={tokens !== null && tokens < 1 ? "Insufficient tokens" : "Record your answer"}
        >
          <Mic className="h-4 w-4" />
          Record Answer
        </Button>
      ) : (
        <Button
          type="button"
          variant="destructive"
          onClick={stopRecording}
          className="flex items-center gap-2"
        >
          <StopCircle className="h-4 w-4" />
          Stop ({formatTime(recordingTime)})
        </Button>
      )}
      
      {isProcessing && (
        <span className="flex items-center text-sm text-muted-foreground ml-2">
          <Loader2 className="h-4 w-4 animate-spin mr-1" />
          Processing...
        </span>
      )}
    </div>
  );
};

export default AudioRecorder;
