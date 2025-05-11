
import { corsHeaders } from './index.ts';

// Handler for processing thoughts into a structured response
export async function handleProcessThoughts(openAIApiKey: string, questionIndex: number, questionType: string, questionText: string, userThoughts: string, previousResponse: string | null, corsHeaders: Record<string, string>) {
  console.log(`Processing thoughts for question #${questionIndex}`);
  console.log(`User's thoughts: ${userThoughts.substring(0, 200)}${userThoughts.length > 200 ? '...' : ''}`);
  console.log(`Previous response available: ${previousResponse ? 'Yes' : 'No'}`);
  if (previousResponse) {
    console.log(`Previous response length: ${previousResponse.length}`);
  }
  
  // Prepare the system prompt for OpenAI
  const systemPrompt = `You're an expert interview coach. You are an interview coach helping a candidate improve their behavioral response over multiple drafts.

  Your task is to enhance the user's raw thoughts or partial response by making it more clear, structured, and professional — but without turning it into a complete final answer.
  
  Preserve the user's tone, structure, and voice as much as possible. Use the STAR method (Situation, Task, Action, Result) as a guiding principle for your suggestions, but DO NOT force a full rewrite.

  DO NOT inventing facts or embellish random stories. Focus only on what's in the user's original text.
  ${previousResponse ? `\n\nThe user has submitted a previous response for this question. Use it as additional context to ensure consistency in their story and details, but prioritize the new thoughts they've shared.` : ''}
  `;
  
  // Prepare the user prompt
  const userPrompt = `
  Interview Question (${questionType}): ${questionText}

  ${previousResponse ? `The user previously submitted this response:
  
  PREVIOUS RESPONSE:
  ${previousResponse}
  
  They have now shared additional thoughts on how to improve their answer:` : `The user has shared their thoughts on how to answer this question:`}

    USER'S THOUGHTS:
    ${userThoughts}

    Please help build ${previousResponse ? 'an improved' : 'a'} response based on these thoughts. The response should:
    1. Be structured following the STAR method (Situation, Task, Action, Result) without explicitly labeling these sections
    2. Flow naturally as a cohesive narrative
    3. Be conversational yet professional 
    4. Add more content if their previousResponse or thoughts contains less than 150 words, cut down content if they have more than 300 words
    5. Focus on highlighting skills, experience, and achievements
    6. Eliminate any rambling, repetition, or unclear points from the original thoughts
    ${previousResponse ? '7. Maintain consistency with any specific details mentioned in their previous response' : ''}
  `;
  
  // Prepare API request
  const openAIRequestPayload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.7,
    max_tokens: 1000
  };
  
  // Log the OpenAI request payload for debugging
  console.log('OpenAI API request payload for thought processing:', JSON.stringify(openAIRequestPayload).substring(0, 500) + '...');
  
  // Call OpenAI API
  console.log('Sending request to OpenAI API for thought processing...');
  const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIApiKey}`
    },
    body: JSON.stringify(openAIRequestPayload)
  });
  
  console.log('OpenAI API response status for thought processing:', openAIResponse.status);
  
  if (!openAIResponse.ok) {
    console.error('OpenAI API error response status:', openAIResponse.status);
    
    try {
      // Try to get error details as JSON
      const errorData = await openAIResponse.json();
      console.error('OpenAI API error details:', JSON.stringify(errorData));
      throw new Error(`OpenAI API error: ${errorData.error?.message || JSON.stringify(errorData)}`);
    } catch (jsonError) {
      // If JSON parsing fails, try to get error as text
      console.error('Failed to parse error response as JSON, trying text...');
      const errorText = await openAIResponse.text().catch(() => 'Could not read response as text');
      console.error('OpenAI API error text:', errorText.substring(0, 200));
      throw new Error(`OpenAI API error (${openAIResponse.status}): ${errorText.substring(0, 200)}`);
    }
  }
  
  // Parse response from OpenAI
  let openAIData;
  try {
    openAIData = await openAIResponse.json();
    console.log('OpenAI API response received for thought processing');
  } catch (jsonError) {
    console.error('Error parsing OpenAI response as JSON:', jsonError);
    
    // Try to get response as text if JSON parsing failed
    const responseText = await openAIResponse.clone().text().catch(() => 'Could not read response as text');
    console.error('Response text that failed to parse:', responseText.substring(0, 200));
    throw new Error(`Failed to parse OpenAI response: ${jsonError.message}`);
  }
  
  // Validate response structure
  if (!openAIData.choices || !openAIData.choices[0] || !openAIData.choices[0].message) {
    console.error('Unexpected OpenAI response structure:', JSON.stringify(openAIData).substring(0, 500));
    throw new Error('OpenAI response missing expected data structure');
  }
  
  // Extract the response content
  const generatedContent = openAIData.choices[0].message.content;
  console.log('Generated response received, length:', generatedContent.length);
  
  // Process the generated content to extract just the response without any surrounding text
  let generatedResponse = generatedContent;
  
  // Check if the content contains markdown separators (---)
  const markdownSeparatorPattern = /^---\r?\n([\s\S]*?)\r?\n---/m;
  const match = generatedContent.match(markdownSeparatorPattern);
  
  if (match && match[1]) {
    // Extract only the content between the markdown separators
    generatedResponse = match[1].trim();
  } else {
    // If no separators, try to clean up any prefixes like "Here's a response:"
    const cleanupPattern = /^(Here'?s\s+a\s+(polished|structured|professional|formatted)\s+response.*?:?\s*)/i;
    generatedResponse = generatedContent.replace(cleanupPattern, '').trim();
  }
  
  // Extract any feedback or instructions from outside the response content
  let feedback = "";
  
  // Look for text after the last markdown separator
  if (match) {
    const afterSeparator = generatedContent.substring(generatedContent.lastIndexOf('---') + 3).trim();
    if (afterSeparator) {
      feedback = afterSeparator;
    }
  }
  
  // Return a structured response with the generated answer and any feedback
  const response = {
    success: true,
    generatedResponse: generatedResponse,
    feedback: feedback || "Response has been transformed based on your thoughts."
  };

  console.log('Returning final response with generated answer');
  console.log('====== FUNCTION COMPLETED SUCCESSFULLY ======');

  return new Response(
    JSON.stringify(response),
    { 
      headers: { 
        ...corsHeaders,
        'Content-Type': 'application/json' 
      } 
    }
  );
}
