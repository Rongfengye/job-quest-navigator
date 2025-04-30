// import { useState, useCallback } from 'react';
//  import { useToast } from '@/components/ui/use-toast';
//  import { supabase } from '@/integrations/supabase/client';
 
//  export const useVoiceRecording = (onTranscriptionComplete: (text: string) => void) => {
//    const [isRecording, setIsRecording] = useState(false);
//    const [mediaRecorder, setMediaRecorder] = useState<MediaRecorder | null>(null);
//    const { toast } = useToast();
 
//    const startRecording = useCallback(async () => {
//      try {
//        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
//        const recorder = new MediaRecorder(stream);
//        const audioChunks: BlobPart[] = [];
 
//        recorder.ondataavailable = (e) => {
//          audioChunks.push(e.data);
//        };
 
//        recorder.onstop = async () => {
//          const audioBlob = new Blob(audioChunks, { type: 'audio/webm' });
//          const reader = new FileReader();
         
//          reader.onloadend = async () => {
//            const base64Audio = (reader.result as string).split(',')[1];
           
//            try {
//              const { data, error } = await supabase.functions.invoke('storyline-audio-function', {
//                body: { audio: base64Audio }
//              });
 
//              if (error) throw error;
//              if (data.text) {
//                onTranscriptionComplete(data.text);
//              }
//            } catch (error) {
//              console.error('Transcription error:', error);
//              toast({
//                title: "Error",
//                description: "Failed to transcribe audio. Please try again.",
//                variant: "destructive"
//              });
//            }
//          };
 
//          reader.readAsDataURL(audioBlob);
//        };
 
//        recorder.start();
//        setMediaRecorder(recorder);
//        setIsRecording(true);
       
//        toast({
//          title: "Recording started",
//          description: "Speak clearly into your microphone"
//        });
//      } catch (error) {
//        console.error('Error accessing microphone:', error);
//        toast({
//          title: "Error",
//          description: "Could not access microphone. Please check your permissions.",
//          variant: "destructive"
//        });
//      }
//    }, [onTranscriptionComplete, toast]);
 
//    const stopRecording = useCallback(() => {
//      if (mediaRecorder && isRecording) {
//        mediaRecorder.stop();
//        mediaRecorder.stream.getTracks().forEach(track => track.stop());
//        setIsRecording(false);
//        setMediaRecorder(null);
       
//        toast({
//          title: "Processing",
//          description: "Converting your speech to text..."
//        });
//      }
//    }, [mediaRecorder, isRecording, toast]);
 
//    return { isRecording, startRecording, stopRecording };
//  };

import "https://deno.land/x/xhr@0.1.0/mod.ts"
 import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
 
 const corsHeaders = {
   'Access-Control-Allow-Origin': '*',
   'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
 }
 
 function processBase64Chunks(base64String: string, chunkSize = 32768) {
   const chunks: Uint8Array[] = [];
   let position = 0;
   
   while (position < base64String.length) {
     const chunk = base64String.slice(position, position + chunkSize);
     const binaryChunk = atob(chunk);
     const bytes = new Uint8Array(binaryChunk.length);
     
     for (let i = 0; i < binaryChunk.length; i++) {
       bytes[i] = binaryChunk.charCodeAt(i);
     }
     
     chunks.push(bytes);
     position += chunkSize;
   }
 
   const totalLength = chunks.reduce((acc, chunk) => acc + chunk.length, 0);
   const result = new Uint8Array(totalLength);
   let offset = 0;
 
   for (const chunk of chunks) {
     result.set(chunk, offset);
     offset += chunk.length;
   }
 
   return result;
 }
 
 serve(async (req) => {
   if (req.method === 'OPTIONS') {
     return new Response('ok', { headers: corsHeaders })
   }
 
   try {
     const { audio } = await req.json()
     
     if (!audio) {
       throw new Error('No audio data provided')
     }
 
     const binaryAudio = processBase64Chunks(audio)
     
     const formData = new FormData()
     const blob = new Blob([binaryAudio], { type: 'audio/webm' })
     formData.append('file', blob, 'audio.webm')
     formData.append('model', 'whisper-1')
 
     const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
       method: 'POST',
       headers: {
         'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
       },
       body: formData,
     })
 
     if (!response.ok) {
       throw new Error(`OpenAI API error: ${await response.text()}`)
     }
 
     const result = await response.json()
 
     return new Response(
       JSON.stringify({ text: result.text }),
       { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
     )
 
   } catch (error) {
     console.error('Error in transcribe-audio function:', error);
     return new Response(
       JSON.stringify({ error: error.message }),
       {
         status: 500,
         headers: { ...corsHeaders, 'Content-Type': 'application/json' },
       }
     )
   }
 })
