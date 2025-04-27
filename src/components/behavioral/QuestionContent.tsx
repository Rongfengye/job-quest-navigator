
import React, { useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Mic, Volume2, VolumeX, RefreshCw, Loader2 } from 'lucide-react';

interface QuestionContentProps {
  currentQuestionIndex: number;
  currentQuestion: { question: string } | null;
  answer: string;
  setAnswer: (value: string) => void;
  isRecording: boolean;
  toggleRecording: () => void;
  stopRecording: () => void;  // Added this prop
  isMuted: boolean;
  isPlaying: boolean;
  isLoading?: boolean;
  toggleMute: () => void;
  playQuestionAudio: (question: string) => void;
}

const QuestionContent = ({
  currentQuestionIndex,
  currentQuestion,
  answer,
  setAnswer,
  isRecording,
  toggleRecording,
  stopRecording,  // Added this prop
  isMuted,
  isPlaying,
  isLoading = false,
  toggleMute,
  playQuestionAudio
}: QuestionContentProps) => {
  // Updated useEffect with cleanup
  useEffect(() => {
    if (currentQuestion?.question && !isMuted) {
      console.log('QuestionContent: Auto-playing new question:', currentQuestion.question.substring(0, 50) + '...');
      playQuestionAudio(currentQuestion.question);

      // Cleanup function to stop audio when component unmounts or question changes
      return () => {
        console.log('QuestionContent: Cleaning up audio playback');
        stopRecording();  // Stop any ongoing recording
        setAnswer('');    // Clear the answer field
      };
    }
  }, [currentQuestion?.question, isMuted, playQuestionAudio, stopRecording, setAnswer]);

  const handleReplayClick = () => {
    if (currentQuestion && !isPlaying && !isLoading) {
      console.log("QuestionContent: Manual replay requested for question:", currentQuestion.question.substring(0, 50) + "...");
      playQuestionAudio(currentQuestion.question);
    }
  };

  return (
    <>
      <div className="mb-4">
        <div className="text-sm text-gray-500 mb-2 flex items-center justify-between">
          <span>Question {currentQuestionIndex + 1} of 5</span>
          <div className="flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={toggleMute}
              className="flex items-center gap-1"
            >
              {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              {isMuted ? 'Unmute' : 'Mute'}
            </Button>
            {!isMuted && currentQuestion && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                onClick={handleReplayClick}
                disabled={isPlaying || isLoading}
                className="flex items-center gap-1"
              >
                {isLoading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className={`h-4 w-4 ${isPlaying ? 'animate-spin' : ''}`} />
                )}
                {isLoading ? 'Loading...' : isPlaying ? 'Playing...' : 'Replay'}
              </Button>
            )}
          </div>
        </div>
        <h2 className="text-xl md:text-2xl font-semibold text-interview-primary">
          {currentQuestion?.question || 'Loading question...'}
        </h2>
      </div>
      
      <div className="mt-6 flex-1">
        <div className="flex justify-between items-center mb-2">
          <label htmlFor="answer" className="block text-sm font-medium text-gray-700">
            Your Answer
          </label>
          
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
