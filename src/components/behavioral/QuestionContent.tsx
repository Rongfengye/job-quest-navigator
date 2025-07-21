
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
    console.log('=== QuestionContent Audio Effect ===');
    console.log('Current question changed:', currentQuestion?.question || 'No question');
    console.log('Has audio data:', currentQuestion?.audio ? 'Yes' : 'No');
    console.log('Audio data length:', currentQuestion?.audio?.length || 0);
    console.log('Audio data preview:', currentQuestion?.audio ? currentQuestion.audio.substring(0, 100) + '...' : 'No audio');
    
    if (currentQuestion?.audio) {
      console.log('Calling processAndPlayAudio with audio data');
      processAndPlayAudio(currentQuestion.audio);
    } else {
      console.log('No audio data to process');
    }
  }, [currentQuestion?.audio]);

  const processAndPlayAudio = async (base64Audio: string) => {
    console.log('=== processAndPlayAudio called ===');
    console.log('Base64 audio length:', base64Audio?.length || 0);
    console.log('Base64 audio preview:', base64Audio ? base64Audio.substring(0, 100) + '...' : 'Empty');
    
    if (!base64Audio) {
      console.log('No base64Audio provided, returning early');
      return;
    }
    
    try {
      console.log('Starting audio processing...');
      setIsProcessing(true);
      setIsPlaying(true);
      
      // Convert base64 to a binary array
      console.log('Converting base64 to binary array...');
      const byteCharacters = atob(base64Audio);
      const byteNumbers = new Array(byteCharacters.length);
      
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      
      const byteArray = new Uint8Array(byteNumbers);
      console.log('Created byte array with length:', byteArray.length);
      
      const audioBlob = new Blob([byteArray], { type: 'audio/mp3' });
      console.log('Created audio blob with size:', audioBlob.size);
      
      // Clean up previous audio if it exists
      if (audioSrc) {
        URL.revokeObjectURL(audioSrc);
      }
      
      const audioUrl = URL.createObjectURL(audioBlob);
      console.log('Created audio URL:', audioUrl);
      setAudioSrc(audioUrl);
      setIsProcessing(false);
      
      const audio = new Audio(audioUrl);
      console.log('Created Audio element, attempting to play...');
      
      audio.onended = () => {
        console.log('Audio playback ended');
        setIsPlaying(false);
      };
      
      audio.onerror = (error) => {
        console.error('Audio playback error:', error);
        setIsPlaying(false);
        setIsProcessing(false);
      };
      
      audio.onloadstart = () => {
        console.log('Audio loading started');
      };
      
      audio.oncanplay = () => {
        console.log('Audio can play');
      };
      
      audio.onplay = () => {
        console.log('Audio play event fired');
      };
      
      await audio.play();
      console.log('Audio.play() completed successfully');
      
    } catch (error) {
      console.error('Error processing/playing audio:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
        name: error.name
      });
      setIsPlaying(false);
      setIsProcessing(false);
    }
  };

  const handleTextToSpeech = () => {
    console.log('=== handleTextToSpeech called ===');
    if (currentQuestion?.audio) {
      console.log('Replaying audio from handleTextToSpeech');
      processAndPlayAudio(currentQuestion.audio);
    } else {
      console.log('No audio available for text-to-speech');
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
