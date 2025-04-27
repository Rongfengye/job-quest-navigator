
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  const playAudio = useCallback(async (base64Audio: string, mimeType: string = 'audio/mp3') => {
    if (isMuted) return;

    try {
      // Cleanup any previous audio element
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
      }
      
      setIsPlaying(true);
      
      // Validate base64 string
      if (!base64Audio || typeof base64Audio !== 'string' || base64Audio.trim() === '') {
        throw new Error('Invalid audio data received');
      }

      console.log('Attempting to play audio, base64 length:', base64Audio.length);
      
      // Create data URL
      const audioUrl = `data:${mimeType};base64,${base64Audio}`;
      
      // Create and configure audio element
      const audio = new Audio();
      audioRef.current = audio;
      
      // Set up event handlers before setting the source
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        console.error('Audio error details:', audio.error);
        setIsPlaying(false);
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: `Failed to play audio: ${audio.error?.message || 'Unknown error'}`,
        });
      };
      
      audio.oncanplaythrough = () => {
        console.log('Audio loaded and ready to play');
        audio.play().catch(playError => {
          console.error('Error during audio.play():', playError);
          setIsPlaying(false);
          throw playError;
        });
      };
      
      audio.onended = () => {
        console.log('Audio playback completed');
        setIsPlaying(false);
      };

      // Set the source and load the audio
      audio.src = audioUrl;
      await audio.load();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: error instanceof Error ? `Failed to play audio: ${error.message}` : "Failed to play the audio. You can continue with text.",
      });
    }
  }, [isMuted, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isMuted]);

  return {
    isPlaying,
    isMuted,
    playAudio,
    toggleMute
  };
};
