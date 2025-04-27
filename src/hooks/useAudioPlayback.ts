
import { useState, useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

export const useAudioPlayback = () => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const audioUrlRef = useRef<string | null>(null);
  const { toast } = useToast();

  // Clean up audio element on unmount
  useEffect(() => {
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current.src = '';
        audioRef.current = null;
      }
    };
  }, []);

  const playAudio = useCallback(async (base64Audio: string, mimeType: string = 'audio/mp3') => {
    if (isMuted) return;

    try {
      setIsLoading(true);
      
      // Validate base64 string
      if (!base64Audio || typeof base64Audio !== 'string' || base64Audio.trim() === '') {
        throw new Error('Invalid audio data received');
      }

      console.log('Attempting to play audio, base64 length:', base64Audio.length);
      
      // Clean up any previous audio element
      if (audioRef.current) {
        const prevAudio = audioRef.current;
        prevAudio.oncanplaythrough = null;
        prevAudio.onerror = null;
        prevAudio.onended = null;
        prevAudio.pause();
        prevAudio.src = '';
      }
      
      // Create data URL
      const audioUrl = `data:${mimeType};base64,${base64Audio}`;
      audioUrlRef.current = audioUrl;
      
      // Create and configure audio element
      const audio = new Audio();
      
      // Set up event handlers before setting the source
      audio.onerror = (e) => {
        console.error('Audio playback error:', e);
        console.error('Audio error details:', audio.error);
        setIsPlaying(false);
        setIsLoading(false);
        toast({
          variant: "destructive",
          title: "Audio Error",
          description: `Failed to play audio: ${audio.error?.message || 'Unknown error'}`,
        });
      };
      
      // Only set the audio reference after we know it's valid
      audioRef.current = audio;
      
      // Important: Wait for audio to be fully loaded before playing
      audio.oncanplaythrough = () => {
        console.log('Audio loaded and ready to play');
        setIsLoading(false);
        setIsPlaying(true);
        
        // Play with catch for autoplay restrictions
        audio.play().catch(playError => {
          console.error('Error during audio.play():', playError);
          setIsPlaying(false);
          toast({
            variant: "destructive",
            title: "Playback Error",
            description: "Browser prevented automatic playback. Please try again.",
          });
        });
      };
      
      audio.onended = () => {
        console.log('Audio playback completed');
        setIsPlaying(false);
      };

      // Set the source and load the audio
      // Important: Set src after configuring all event handlers
      audio.src = audioUrl;
      
      // Explicitly call load() to start loading the audio
      audio.load();
      
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsLoading(false);
      toast({
        variant: "destructive",
        title: "Audio Error",
        description: error instanceof Error ? `Failed to play audio: ${error.message}` : "Failed to play the audio. You can continue with text.",
      });
    }
  }, [isMuted, toast]);

  const stopAudio = useCallback(() => {
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
    
    if (!isMuted && audioRef.current) {
      audioRef.current.pause();
      setIsPlaying(false);
    }
  }, [isMuted]);

  return {
    isPlaying,
    isLoading,
    isMuted,
    playAudio,
    stopAudio,
    toggleMute
  };
};
