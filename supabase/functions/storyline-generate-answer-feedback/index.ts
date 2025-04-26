
import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // Get API key from environment variables
  const openAIApiKey = Deno.env.get('OPENAI_API_KEY');
  
  try {
    const { 
      answerText, 
      question, 
      questionType, 
      jobTitle, 
      jobDescription, 
      companyName 
    } = await req.json();

    console.log('Received request to generate feedback for answer');
    console.log('Question type:', questionType);
    console.log('Answer length:', answerText?.length || 0);

    // Prepare the system prompt
    const systemPrompt = `You are an expert interview coach specializing in providing constructive feedback on interview answers.
    
    Analyze the candidate's response to the interview question and provide detailed feedback in JSON format with the following sections:
    
    1. "pros" - An array of strings, each highlighting a strength in the answer (be specific about what was good)
    2. "cons" - An array of strings, each highlighting a weakness or area for improvement (be specific and actionable)
    3. "guidelines" - A string with concise guidelines on how to better answer this type of question
    4. "improvementSuggestions" - A string with 2-3 specific suggestions to enhance this particular answer
    5. "score" - A number between 1-100 representing the overall quality of the answer
    
    For ${questionType || 'interview'} questions, focus on:
    ${questionType === 'technical' ? 
      '- Depth of technical knowledge\n- Clarity of explanation\n- Problem-solving approach\n- Relevant experience with technologies' : 
      questionType === 'behavioral' ? 
      '- Structure using the STAR method (Situation, Task, Action, Result)\n- Specific examples that demonstrate relevant soft skills\n- Quantifiable results or impact\n- Self-reflection and learning\n- Relevance to the job requirements\n- Depth of experience\n- Challenges faced and solutions implemented\n- Measurable achievements and impact' :
      '- Clarity and structure\n- Relevance to the question\n- Specific examples\n- Results and impact'}
    
    ${jobTitle ? `For a ${jobTitle} position` : 'For this position'}
    ${companyName ? `at ${companyName}` : ''}
    ${jobDescription ? `consider how well the answer aligns with these job requirements: ${jobDescription}` : ''}
    
    Make your feedback specific, actionable, and balanced. The feedback should help the candidate improve their answer while recognizing what they did well.`;

    // Call the OpenAI API
    const openAIResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: `Question: ${question}\n\nAnswer: ${answerText}` }
        ],
        response_format: { type: "json_object" }
      }),
    });

    const openAIData = await openAIResponse.json();
    console.log('OpenAI API response received');
    
    if (openAIData.error) {
      console.error('OpenAI API error:', openAIData.error);
      throw new Error(`OpenAI API error: ${openAIData.error.message}`);
    }

    // Extract the feedback from the OpenAI response
    const generatedContent = openAIData.choices[0].message.content;
    console.log('Generated feedback received, parsing JSON');
    
    // Parse the JSON content
    let feedbackContent;
    try {
      feedbackContent = JSON.parse(generatedContent);
      
      // Ensure the structure is valid
      if (!feedbackContent.pros || !feedbackContent.cons) {
        console.error('Invalid feedback structure:', feedbackContent);
        throw new Error('OpenAI did not return the expected data structure');
      }
    } catch (parseError) {
      console.error('Error parsing feedback JSON:', parseError);
      throw new Error('Invalid JSON format in the OpenAI response');
    }

    return new Response(JSON.stringify(feedbackContent), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    console.error('Error processing request:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 500,
    });
  }
});
