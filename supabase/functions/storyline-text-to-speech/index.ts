
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

// Process base64 in chunks to prevent memory issues
function processBase64Chunks(arrayBuffer: ArrayBuffer, chunkSize = 32768): string {
  const uint8Array = new Uint8Array(arrayBuffer);
  let base64 = '';
  
  // Process in smaller chunks to avoid memory issues
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize);
    base64 += btoa(String.fromCharCode.apply(null, [...chunk]));
  }
  
  // Log the first and last few characters for debugging
  console.log('Processed based audio length:', base64.length);
  console.log('Base64 suffix:', base64.substring(base64.length - 20));
  console.log('Base64 prefix:', base64.substring(0, 20));
  
  return base64;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { text, voice } = await req.json()

    if (!text) {
      throw new Error('Text is required')
    }

    if (text.length > 4000) {
      throw new Error('Text is too long (max 4000 characters)')
    }

    console.log('Generating speech for text:', text.substring(0, 100) + '...')

    // Generate speech from text using OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy',
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      console.error('OpenAI API error:', error)
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    // Get the audio data and process it in chunks
    const arrayBuffer = await response.arrayBuffer()
    console.log('Received audio data size:', arrayBuffer.byteLength, 'bytes')
    
    const base64Audio = processBase64Chunks(arrayBuffer)

    return new Response(
      JSON.stringify({ 
        audioContent: base64Audio,
        mimeType: 'audio/mp3'
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } },
    )
  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    return new Response(
      JSON.stringify({ error: error.message }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    )
  }
})
