
import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Volume2 } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface QuestionContentProps {
  currentQuestionIndex: number;
  currentQuestion: { question: string } | null;
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

  useEffect(() => {
    // Clean up audio when question changes
    return () => {
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
        setAudioSrc(null);
      }
    };
  }, [currentQuestion]);

  const handleTextToSpeech = async () => {
    if (!currentQuestion?.question) return;
    
    try {
      setIsPlaying(true);
      
      const { data, error } = await supabase.functions.invoke('storyline-text-to-speech', {
        body: { text: currentQuestion.question, voice: 'alloy' }
      });
      
      if (error) {
        console.error('Error calling text-to-speech:', error);
        setIsPlaying(false);
        return;
      }
      
      if (data.audio) {
        const base64Audio = data.audio;
        const byteCharacters = atob(base64Audio);
        const byteNumbers = new Array(byteCharacters.length);
        
        for (let i = 0; i < byteCharacters.length; i++) {
          byteNumbers[i] = byteCharacters.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
        
        const audioUrl = URL.createObjectURL(audioBlob);
        setAudioSrc(audioUrl);
        
        const audio = new Audio(audioUrl);
        audio.onended = () => {
          setIsPlaying(false);
        };
        audio.play();
      }
    } catch (error) {
      console.error('Error playing text-to-speech:', error);
      setIsPlaying(false);
    }
  };

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
            variant="ghost"
            onClick={handleTextToSpeech}
            disabled={isPlaying || !currentQuestion}
            className="flex items-center gap-1 ml-2 mt-1"
          >
            <Volume2 className={`h-4 w-4 ${isPlaying ? 'text-interview-primary' : ''}`} />
            {isPlaying ? 'Playing...' : ''}
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
