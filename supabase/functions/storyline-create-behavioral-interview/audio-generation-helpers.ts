
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

// Helper function to generate text-to-speech audio
export async function generateTextToSpeech(text: string, voice: string = 'alloy') {
  if (!text || text.length > 4000) {
    throw new Error('Invalid text for TTS (empty or too long)');
  }
  
  console.log('Generating speech for text:', text.substring(0, 100) + '...');
  
  const response = await fetch('https://oai.helicone.ai/v1/audio/speech', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Helicone-Auth': `Bearer ${Deno.env.get('HELICONE_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'tts-1',
      input: text,
      voice: voice,
      response_format: 'mp3',
    }),
  });
  
  if (!response.ok) {
    const error = await response.json();
    console.error('OpenAI TTS API error:', error);
    throw new Error(error.error?.message || 'Failed to generate speech');
  }
  
  // Convert audio buffer to base64
  const arrayBuffer = await response.arrayBuffer();
  console.log('Received audio data size:', arrayBuffer.byteLength, 'bytes');
  
  try {
    // Use our chunked base64 encoding
    const base64Audio = arrayBufferToBase64(arrayBuffer);
    console.log('Successfully generated base64 audio, length:', base64Audio.length);
    
    return base64Audio;
  } catch (e) {
    console.error('Error encoding audio to base64:', e);
    throw e;
  }
}
