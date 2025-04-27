
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
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
    const response = await fetch('https://api.openai.com/v1/audio/speech', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'tts-1',
        input: text,
        voice: voice || 'alloy', // Default to 'alloy' voice if none specified
        response_format: 'mp3',
      }),
    })

    if (!response.ok) {
      const error = await response.json()
      throw new Error(error.error?.message || 'Failed to generate speech')
    }

    // Get the MP3 as an array buffer
    const arrayBuffer = await response.arrayBuffer()
    
    // Use a more efficient base64 encoding method that won't cause stack overflow
    // This handles the binary data in smaller chunks to avoid recursion issues
    const base64Audio = encodeBase64(arrayBuffer)

    return new Response(
      JSON.stringify({ audioContent: base64Audio }),
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

// Efficient base64 encoding function that works with chunks
function encodeBase64(arrayBuffer: ArrayBuffer): string {
  const uint8Array = new Uint8Array(arrayBuffer)
  const chunkSize = 1024 * 64 // Process in 64KB chunks to avoid stack overflow
  let base64 = ''
  
  for (let i = 0; i < uint8Array.length; i += chunkSize) {
    const chunk = uint8Array.slice(i, i + chunkSize)
    base64 += bufferToBase64Chunk(chunk)
  }
  
  return base64
}

// Helper function to convert a small chunk to base64
function bufferToBase64Chunk(chunk: Uint8Array): string {
  const binString = Array.from(chunk)
    .map(byte => String.fromCharCode(byte))
    .join('')
  
  return btoa(binString)
}
