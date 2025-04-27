
import "https://deno.land/x/xhr@0.1.0/mod.ts"
import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Improved base64 processing function with better error handling
function processBase64Chunks(base64String: string, chunkSize = 32768) {
  try {
    if (!base64String || typeof base64String !== 'string') {
      console.error('Invalid base64 input:', typeof base64String);
      throw new Error('Invalid base64 input');
    }
    
    console.log('Processing base64 string of length:', base64String.length);
    
    // Basic validation of base64 string
    if (!/^[A-Za-z0-9+/]*={0,2}$/.test(base64String)) {
      console.warn('Base64 string contains invalid characters');
    }
    
    const chunks: Uint8Array[] = [];
    let position = 0;
    
    while (position < base64String.length) {
      const chunk = base64String.slice(position, position + chunkSize);
      try {
        const binaryChunk = atob(chunk);
        const bytes = new Uint8Array(binaryChunk.length);
        
        for (let i = 0; i < binaryChunk.length; i++) {
          bytes[i] = binaryChunk.charCodeAt(i);
        }
        
        chunks.push(bytes);
      } catch (error) {
        console.error(`Error processing base64 chunk at position ${position}:`, error);
        throw new Error(`Base64 decoding error at position ${position}: ${error.message}`);
      }
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
  } catch (error) {
    console.error('Error in processBase64Chunks:', error);
    throw error;
  }
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
    
    console.log('Received audio base64 string of length:', audio.length);

    const binaryAudio = processBase64Chunks(audio)
    console.log('Successfully processed binary audio, size:', binaryAudio.length);
    
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
      const errorText = await response.text();
      console.error('OpenAI API error response:', errorText);
      throw new Error(`OpenAI API error: ${errorText}`);
    }

    const result = await response.json()
    console.log('Transcription result received:', result.text?.substring(0, 50) + '...');

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
