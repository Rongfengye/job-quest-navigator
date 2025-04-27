
import { useState, useCallback } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const { toast } = useToast();

  const playAudio = useCallback(async (base64Audio: string, mimeType: string = 'audio/mp3') => {
    if (isMuted) return;

    try {
      setIsPlaying(true);
      
      // Validate base64 string
      if (!base64Audio || base64Audio.trim() === '') {
        throw new Error('Invalid audio data received');
      }

      // Create and play audio
      const audio = new Audio(`data:${mimeType};base64,${base64Audio}`);
      
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        setIsPlaying(false);
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: "Failed to play the audio. You can continue with text.",
        });
      };
      
      audio.onended = () => {
        console.log('Audio playback completed');
        setIsPlaying(false);
      };

      await audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: "Failed to play the audio. You can continue with text.",
      });
    }
  }, [isMuted, toast]);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  return {
    isPlaying,
    isMuted,
    playAudio,
    toggleMute
  };
};
