
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
 
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}
 
// Helper function to convert ArrayBuffer to base64 in chunks
function arrayBufferToBase64(buffer: ArrayBuffer) {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  const chunkSize = 10240; // Process ~10KB chunks
  
  console.log('Starting base64 encoding of buffer size:', buffer.byteLength);
  
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const chunk = bytes.slice(i, Math.min(i + chunkSize, bytes.length));
    binary += String.fromCharCode.apply(null, chunk);
    
    if (i % (chunkSize * 10) === 0) {
      console.log(`Processed ${i}/${bytes.length} bytes`);
    }
  }
  
  console.log('Completed binary string conversion, length:', binary.length);
  const base64 = btoa(binary);
  console.log('Completed base64 encoding, length:', base64.length);
  
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

    // Generate speech from text using OpenAI
    if (text.length > 4000) {
      throw new Error('Text is too long (max 4000 characters)')
    }
    
    console.log('Generating speech for text:', text.substring(0, 100) + '...')
    
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
    
    // Convert audio buffer to base64
    const arrayBuffer = await response.arrayBuffer()
    console.log('Received audio data size:', arrayBuffer.byteLength, 'bytes')
    
    try {
      // Use our new chunked base64 encoding
      const base64Audio = arrayBufferToBase64(arrayBuffer)
      console.log('Successfully generated base64 audio, length:', base64Audio.length)
      
      return new Response(
        JSON.stringify({ audio: base64Audio }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    } catch (e) {
      console.error('Error encoding audio to base64:', e)
      throw e
    }
  } catch (error) {
    console.error('Error in text-to-speech function:', error)
    
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      }
    )
  }
})
