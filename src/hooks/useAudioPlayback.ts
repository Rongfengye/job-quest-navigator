
import { useState, useCallback, useRef } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const { toast } = useToast();

  // Helper to validate base64 string
  const isValidBase64 = (str: string): boolean => {
    try {
      // Check if it's a non-empty string
      if (!str || typeof str !== 'string' || str.trim() === '') {
        return false;
      }
      
      // Basic pattern check (might have padding)
      const base64Regex = /^[A-Za-z0-9+/]*={0,2}$/;
      return base64Regex.test(str);
    } catch (e) {
      console.error('Base64 validation error:', e);
      return false;
    }
  };

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
      if (!base64Audio || base64Audio.trim() === '') {
        throw new Error('Invalid audio data: empty string received');
      }

      // Log base64 prefix and suffix for debugging
      console.log('Audio base64 prefix:', base64Audio.substring(0, 30));
      console.log('Audio base64 suffix:', base64Audio.substring(base64Audio.length - 30));
      
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
      
      audio.onended = () => {
        console.log('Audio playback completed');
        setIsPlaying(false);
      };
      
      audio.oncanplay = () => {
        console.log('Audio can play, starting playback');
      };

      // Set the source and load the audio
      audio.src = audioUrl;
      await audio.load();
      
      // Play the audio
      try {
        await audio.play();
        console.log('Audio playback started successfully');
      } catch (playError) {
        console.error('Error during audio.play():', playError);
        setIsPlaying(false);
        throw playError;
      }
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
    
    // Stop any playing audio when muting
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
