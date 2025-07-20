
import { corsHeaders } from './index.ts';

// Handler for processing thoughts into a structured response
export async function handleProcessThoughts(
  openAIApiKey: string, 
  questionIndex: number, 
  questionType: string, 
  questionText: string, 
  userThoughts: string, 
  previousResponse: string | null, 
  corsHeaders: Record<string, string>,
  previousFeedback: { pros: string[], cons: string[], improvementSuggestions?: string, guidelines?: string, score?: number } | null = null
) {
  console.log(`Processing thoughts for question #${questionIndex}`);
  console.log(`User's thoughts: ${userThoughts.substring(0, 200)}${userThoughts.length > 200 ? '...' : ''}`);
  console.log(`Previous response available: ${previousResponse ? 'Yes' : 'No'}`);
  console.log(`Previous feedback available: ${previousFeedback ? 'Yes' : 'No'}`);
  
  if (previousResponse) {
    console.log(`Previous response length: ${previousResponse.length}`);
  }
  
  if (previousFeedback) {
    console.log(`Previous feedback: ${previousFeedback.pros.length} strengths, ${previousFeedback.cons.length} weaknesses`);
  }
  
  // Calculate the approximate word count of user input
  const wordCount = userThoughts.trim().split(/\s+/).length;
  console.log(`Approximate user input word count: ${wordCount}`);
  
  // Determine target response length based on input
  const targetResponseMultiplier = previousResponse ? 1.3 : 1.5; // Less aggressive expansion
  const maxResponseWords = Math.min(Math.max(wordCount * targetResponseMultiplier, 75), 200);
  console.log(`Target response size: ~${maxResponseWords} words`);
  
  // Prepare the system prompt for OpenAI with feedback integration
  let systemPrompt = `You are an interview coach helping a candidate improve their response to a behavioral question through incremental iterations.

  Your goal is to make modest, focused improvements to the user's raw thoughts - NOT to create a complete polished answer yet.
  
  Key guidelines:
  1. Make small improvements that build on the user's exact ideas and wording
  2. Maintain the user's voice, tone, and style
  3. Focus on enhancing clarity, structure, and specificity
  4. Add minimal professional polish without sounding artificial
  5. Do NOT invent new details or examples that weren't in the original text
  6. Keep your response proportional to the user's input length (approximately ${Math.round(targetResponseMultiplier * 100)}% of their word count)
  7. Absolutely avoid creating complete STAR stories if the user hasn't provided all those elements
  8. DO NOT begin your response with any introductory phrases like "Here's a response:" or "Sure!" or similar text
  9. Return ONLY the enhanced response text with no additional commentary
  `;
  
  // Add feedback-specific instructions if available
  if (previousFeedback && previousFeedback.pros.length > 0 || previousFeedback?.cons.length > 0) {
    systemPrompt += `\n\n===FEEDBACK INTEGRATION INSTRUCTIONS===
    The user has received specific feedback on their previous response. Your task is to:
    1. PRESERVE and BUILD UPON the strengths identified in the previous response
    2. ADDRESS and IMPROVE upon the weaknesses identified
    3. Incorporate the user's new thoughts within this feedback framework
    4. Maintain a consistent narrative with the previous response\n`;
  }
  
  systemPrompt += `\n${previousResponse ? `\nThe user has submitted a previous response for this question. Consider this context, but focus primarily on improving the new thoughts they've shared. Don't make dramatic changes to their story direction.` : 'This is their first draft, so focus on modest improvements.'}`;
  
  // Prepare the user prompt with feedback integration
  let userPrompt = `
  Interview Question (${questionType}): ${questionText}\n\n`;
  
  if (previousResponse) {
    userPrompt += `The user previously submitted this response:
  
  PREVIOUS RESPONSE:
  ${previousResponse}\n\n`;
    
    if (previousFeedback) {
      userPrompt += `This response received the following feedback:
      
  STRENGTHS TO PRESERVE:
  ${previousFeedback.pros.map(pro => `- ${pro}`).join('\n')}
  
  WEAKNESSES TO ADDRESS:
  ${previousFeedback.cons.map(con => `- ${con}`).join('\n')}\n\n`;
      
      if (previousFeedback.improvementSuggestions) {
        userPrompt += `IMPROVEMENT SUGGESTIONS:
  ${previousFeedback.improvementSuggestions}\n\n`;
      }
    }
    
    userPrompt += `They have now shared additional thoughts on how to improve their answer:`;
  } else {
    userPrompt += `The user has shared their initial thoughts on how to answer this question:`;
  }
  
  userPrompt += `\n\nUSER'S THOUGHTS:
  ${userThoughts}\n\n`;
  
  userPrompt += `Please help build ${previousResponse ? 'an incrementally improved' : 'a slightly enhanced'} version of their response. Your response should:
  
  1. Make modest improvements to clarity, structure, and detail
  2. Maintain the user's original tone and voice
  3. Be approximately ${Math.round(targetResponseMultiplier * 100)}% the length of their input
  4. Focus only on what they've explicitly mentioned`;
  
  if (previousFeedback) {
    userPrompt += `
  5. Address the specific weaknesses identified in the feedback
  6. Preserve and build upon the strengths identified in the feedback`;
  } else {
    userPrompt += `
  5. Not create a complete STAR method response unless all elements are already present
  6. Avoid artificial expansions or embellishments`;
  }
  
  userPrompt += `
  ${previousResponse ? '7. Maintain consistency with the general story from their previous response' : ''}
  8. DO NOT include any introductory text like "Here's your response:" or "Here's an improved version:"
  9. Return ONLY the enhanced answer with no other text

  Remember: This is an iterative process. The goal is gradual improvement, not a complete transformation.
  `;
  
  // Prepare API request
  const openAIRequestPayload = {
    model: 'gpt-4o-mini',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userPrompt }
    ],
    temperature: 0.4, // Lower temperature for more focused, less creative expansions
    max_tokens: 700,  // Limit token count
  };
  
  // Log the OpenAI request payload for debugging
  console.log('OpenAI API request payload for thought processing:', JSON.stringify(openAIRequestPayload).substring(0, 500) + '...');
  
  // Call OpenAI API
  console.log('Sending request to OpenAI API for thought processing...');
  const openAIResponse = await fetch('https://oai.helicone.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${openAIApiKey}`,
      'Helicone-Auth': `Bearer ${Deno.env.get('HELICONE_API_KEY')}`
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
  
  // Process the generated content - remove any prefixes like "Here's a response:" or "Sure!"
  let generatedResponse = generatedContent;
  
  // Clean up any prefixes from the response - be conservative to avoid cutting legitimate content
  const prefixesToRemove = [
    // AI assistant intro phrases
    /^(Sure!|Here'?s|I've|Now|Here is|This is|I have|Following is|Below is|As requested|As an improvement|Here are|I'd suggest|Let me|Your improved|The following is|An enhanced version of|The updated version of|Based on your thoughts|Enhancing your response)\s*/i,
    
    // Common response wrapper phrases  
    /^(a |an |the |your |some |my |this |that |these |those )?(slightly |enhanced |improved |updated |modified |polished |revised |refined |adjusted |clearer |better |structured |more |professional |tailored |focused |concise )+(version|response|answer|draft|iteration|text|note|narrative|statement|submission|enhancement)\s*:?\s*/i,
    
    // Very specific intro patterns - only match obvious AI prefixes, not legitimate content
    /^(Here'?s what I would suggest|Let me help you|I recommend|My suggestion is|Consider this)\s*:?\s*/i,
    
    // Only match single words followed by colon when they're obviously AI prefixes
    /^(Response|Answer|Suggestion|Improvement|Enhancement)\s*:\s*/i
  ];
  
  console.log('Original response before prefix removal:', generatedResponse.substring(0, 100) + '...');
  
  // Try each pattern and remove the prefix if found
  for (const pattern of prefixesToRemove) {
    const match = generatedResponse.match(pattern);
    if (match && match.index === 0) {
      const removedText = match[0];
      generatedResponse = generatedResponse.substring(match[0].length).trim();
      console.log('Removed prefix:', removedText);
      console.log('Response after prefix removal:', generatedResponse.substring(0, 100) + '...');
      break;
    }
  }
  
  // Safety check: ensure we haven't removed too much content
  if (generatedResponse.length < 10) {
    console.log('Warning: Response too short after prefix removal, reverting to original');
    generatedResponse = generatedContent.trim();
  }
  
  // Remove any quotes that might be wrapping the response
  generatedResponse = generatedResponse.replace(/^["']|["']$/g, '').trim();
  
  // Return a structured response with the generated answer
  const response = {
    success: true,
    generatedResponse: generatedResponse,
    feedback: previousFeedback 
      ? "Your response has been improved based on previous feedback and your new thoughts." 
      : "Your response has been incrementally improved based on your thoughts. Continue refining for a stronger answer."
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
