
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Volume2 } from 'lucide-react';

interface QuestionContentProps {
  currentQuestionIndex: number;
  currentQuestion: { question: string; audio?: string | null } | null;
  answer: string;
  setAnswer: (value: string) => void;
  isRecording: boolean;
  toggleRecording: () => void;
}

const QuestionContent = ({
  currentQuestionIndex,
  currentQuestion,
  answer,
  setAnswer,
  isRecording,
  toggleRecording
}: QuestionContentProps) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [audioSrc, setAudioSrc] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Clean up audio when component unmounts or question changes
  useEffect(() => {
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
        setAudioSrc(null);
      }
    };
  }, [currentQuestion]);

  // Process and play audio when a new question with audio data is received
  useEffect(() => {
    if (currentQuestion?.audio) {
      processAndPlayAudio(currentQuestion.audio);
    }
  }, [currentQuestion?.audio]);

  const processAndPlayAudio = async (base64Audio: string) => {
    if (!base64Audio) return;
    
    try {
      setIsProcessing(true);
      setIsPlaying(true);
      
      // Convert base64 to a binary array
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
      
      // Clean up previous audio if it exists
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      setAudioSrc(audioUrl);
      setIsProcessing(false);
      
      const audio = new Audio(audioUrl);
      audio.onended = () => {
        setIsPlaying(false);
        
        // Automatically start recording when audio finishes playing
        if (!isRecording) {
          toggleRecording();
        }
      };
      audio.play();
    } catch (error) {
      console.error('Error playing audio:', error);
      setIsPlaying(false);
      setIsProcessing(false);
    }
  };

  const handleTextToSpeech = () => {
    if (currentQuestion?.audio) {
      processAndPlayAudio(currentQuestion.audio);
    // } else if (currentQuestion?.question) {
    //   // Fall back to the old method only if needed
    //   playTextToSpeech(currentQuestion.question);
    }
  };

  // DO NOT DELETE Keep this for backward compatibility
  // const playTextToSpeech = async (text: string) => {
  //   if (!text || isProcessing) return;
    
  //   try {
  //     setIsProcessing(true);
  //     setIsPlaying(true);
      
  //     const { data, error } = await fetch('/api/storyline-text-to-speech', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify({ text: text, voice: 'alloy' }),
  //     }).then(res => res.json());
      
  //     setIsProcessing(false);
      
  //     if (error) {
  //       console.error('Error calling text-to-speech:', error);
  //       setIsPlaying(false);
  //       return;
  //     }
      
  //     if (data.audio) {
  //       processAndPlayAudio(data.audio);
  //     }
  //   } catch (error) {
  //     console.error('Error playing text-to-speech:', error);
  //     setIsPlaying(false);
  //     setIsProcessing(false);
  //   }
  // };

  return (
    <>
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2">
          Question {currentQuestionIndex + 1} of 5
        </div>
        <div className="flex justify-between items-start">
          <h2 className="text-xl md:text-2xl font-semibold text-interview-primary">
            {currentQuestion?.question || 'Loading question...'}
          </h2>
          <Button
            type="button"
            size="sm"
            variant={isPlaying || isProcessing ? "default" : "ghost"}
            onClick={handleTextToSpeech}
            disabled={isPlaying || isProcessing || !currentQuestion}
            className="flex items-center justify-center w-10 h-10 ml-2 mt-1"
            aria-label={isPlaying ? "Playing audio" : "Play audio"}
          >
            <Volume2 className={`h-4 w-4 ${isPlaying || isProcessing ? 'text-primary-foreground' : ''}`} />
          </Button>
        </div>
      </div>
      
      <div className="mt-6 flex-1">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
            Your Answer
          </label>
          
          <div className="flex items-center space-x-2">
            <Button
              type="button"
              size="sm"
              variant={isRecording ? "destructive" : "outline"}
              onClick={toggleRecording}
              className="flex items-center gap-1"
            >
              <Mic className="h-4 w-4" />
              {isRecording ? 'Stop' : 'Record'}
            </Button>
          </div>
        </div>
        
        <Textarea
          id="answer"
          value={answer}
          onChange={(e) => setAnswer(e.target.value)}
          className="min-h-[200px]"
          placeholder="Type your answer here..."
        />
      </div>
    </>
  );
};

export default QuestionContent;
