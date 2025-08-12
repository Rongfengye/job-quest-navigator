
// Function to extract relevant topics for the interview using OpenAI API
export async function extractRelevantTopics(
  openAIApiKey: string,
  jobTitle: string,
  jobDescription: string,
  companyName: string,
  companyDescription: string,
  resumeText: string,
  coverLetterText: string,
  additionalDocumentsText: string
): Promise<{ topics: string[] }> {
  const systemPrompt = `You are an expert interview coach analyzing a job application to identify the most critical behavioral competencies to assess. 

Analyze the provided job context and candidate background to identify exactly 4-5 key behavioral competencies that would be most relevant for this specific role and candidate.

Focus on competencies that are:
1. Critical for success in this specific role
2. Relevant to the company context and culture
3. Aligned with what the candidate's background suggests they should be strong in
4. Diverse enough to provide comprehensive behavioral assessment

Return ONLY a JSON object with this exact format:
{
  "topics": ["competency1", "competency2", "competency3", "competency4", "competency5"]
}

Use clear, specific competency names like: "leadership", "stakeholder_management", "conflict_resolution", "initiative", "adaptability", "communication", "teamwork", "problem_solving", "ambiguity_handling", "ownership", "influence", "analytical_thinking", "resilience", "innovation", "time_management"`;

  const userPrompt = `Job Title: ${jobTitle}

Job Description: ${jobDescription}

Company: ${companyName}
Company Description: ${companyDescription}

${resumeText ? `Candidate Resume: ${resumeText}` : ''}

Based on this context, identify the 4-5 most critical behavioral competencies to assess for this specific role and candidate.`;

  try {
    console.log('Calling OpenAI API for topic extraction');
    
    const response = await fetch('https://oai.helicone.ai/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openAIApiKey}`,
        'Helicone-Auth': `Bearer ${Deno.env.get('HELICONE_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        response_format: { type: "json_object" },
        temperature: 0.3,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    console.log('OpenAI API response received for topic extraction');
    
    if (data.error) {
      throw new Error(`OpenAI API error: ${data.error.message}`);
    }

    const content = data.choices[0].message.content.trim();
    const parsedResponse = JSON.parse(content);
    
    if (!parsedResponse.topics || !Array.isArray(parsedResponse.topics)) {
      throw new Error('Invalid response format from OpenAI');
    }

    console.log('Extracted topics:', parsedResponse.topics);
    return { topics: parsedResponse.topics };
  } catch (error) {
    console.error('Error extracting topics:', error);
    // Fallback to general topics if extraction fails
    return { 
      topics: ["leadership", "communication", "problem_solving", "teamwork", "adaptability"] 
    };
  }
}

// Separate module for generating behavioral interview questions
export async function generateBehavioralQuestion(
  openAIApiKey: string,
  questionIndex: number,
  jobTitle: string,
  jobDescription: string,
  companyName: string,
  companyDescription: string,
  resumeText: string,
  coverLetterText: string,
  additionalDocumentsText: string,
  previousQuestions: string[] = [],
  previousAnswers: string[] = [],
  extractedTopics: string[] = [],
  askedTopics: string[] = [],
  topicFollowUpCounts: Record<string, number> = {}
) {
  let systemPrompt = '';

  const companyContextString = `You are an experienced interviewer for a ${jobTitle} position.
  ${companyName ? `The company name is ${companyName}.` : ''}
  ${companyDescription ? `About the company: """${companyDescription}"""` : ''}
  ${jobDescription ? `About the job: """${jobDescription}"""` : ''}`

  const formatRequirement = `
  Do not include any explanation, reasoning, or additional text. Only return the response as a JSON object like:
    {
      - 'question': The main interview question (string)
    }
  `
  
  // NOTE TO SELF, DO NOT DELETE
  // It is a very dense prompt, so we have to find a balance between Prompt Bloat/Context Window Saturation/Instruction Dilution/Semantic Overload
  if (questionIndex === 0) {
    const fewShotQuestionList = `
    Here are examples of thoughtful behavioral questions often used to evaluate early-career candidates:

    - "Tell me about a time when you worked with someone who had a very different communication or work style than you. How did you navigate that?"
    - "Describe a situation where you had to learn something unfamiliar quickly to succeed."
    - "Tell me about a time you failed or fell short of your goals. What did you take away from the experience?"
    - "Share how you've handled managing multiple competing priorities — what worked and what didn’t?"
    - "Describe a time when you took initiative on a project, even though it wasn’t expected of you."
    - "Tell me about a team project where you made a meaningful impact. What specifically did you contribute?"
    - "Give an example of a time you received difficult or constructive feedback. How did you respond, and what changed afterward?"
    - "Describe a time when you had to approach a problem differently than others around you. What did you do?"
    - "Tell me about a moment when you were under a tight deadline. How did you decide what to focus on?"
    - "Describe a time when you had to persuade someone — a teammate, a classmate, or a leader — to support your idea."

    These are examples to guide the tone and depth of your response. Your question should be tailored to the candidate's background and the job description.
    `

    // NOTE TO SELF, DO NOT DELETE
    // We may want to look into providing 10 example behaviorals, which would allow for few-shot prompting
    // However this is something we need to test out, as there is a tradeoff between guiding the model and constraining it
    // Can read up on semantic anchoring more

    const topicsGuidance = extractedTopics.length > 0 
      ? `Key competencies to focus on for this role: ${extractedTopics.join(', ')}. Your question should assess one of these competencies.`
      : '';

    systemPrompt = `${companyContextString}
    
    ${topicsGuidance}
    
    Based on the job description and candidate's resume, generate a thought-provoking behavioral interview question that:
    1. Assesses the candidate's past experiences relevant to this role
    2. Helps evaluate their soft skills and cultural fit
    3. Follows the format of "Tell me about a time when..." or similar open-ended behavioral question
    4. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response

    ${fewShotQuestionList}
    
    ${formatRequirement}`;
  } else {
    // Analytics: Track competency coverage and follow-up patterns
    const currentTopicFromLastQuestion = askedTopics[askedTopics.length - 1] || '';
    const currentTopicFollowUps = topicFollowUpCounts[currentTopicFromLastQuestion] || 0;
    
    // 40/60 Logic: Determine if we should follow up or explore new topic
    let baseFollowUpChance = 0.4;
    
    // CRITICAL: Prevent excessive follow-ups (max 2 per competency)
    if (currentTopicFollowUps >= 2) {
      baseFollowUpChance = 0; // Force new topic
      console.log(`Topic "${currentTopicFromLastQuestion}" has reached max follow-ups (${currentTopicFollowUps}), forcing new topic`);
    }
    
    // Smart context boosters for follow-up decisions
    const lastAnswer = previousAnswers[previousAnswers.length - 1] || '';
    const lastAnswerLength = lastAnswer.split(' ').length;
    
    // Boost follow-up chance if the last answer was rich (>50 words)
    if (lastAnswerLength > 50 && currentTopicFollowUps < 2) {
      baseFollowUpChance += 0.15;
    }
    
    // Reduce follow-up chance if we have limited topic coverage
    const uncoveredTopics = extractedTopics.filter(topic => !askedTopics.includes(topic));
    if (uncoveredTopics.length > 2) {
      baseFollowUpChance -= 0.1;
    }
    
    // Reduce follow-up chance if we're on the last question (question 5)
    if (questionIndex === 4) {
      baseFollowUpChance -= 0.2;
    }
    
    const shouldFollowUp = Math.random() < baseFollowUpChance;
    
    console.log(`Question ${questionIndex + 1}: Topic: "${currentTopicFromLastQuestion}", Follow-ups: ${currentTopicFollowUps}/2, Chance: ${baseFollowUpChance}, Decision: ${shouldFollowUp ? 'Follow-up' : 'New topic'}`);
    
    if (shouldFollowUp && previousQuestions.length > 0 && currentTopicFollowUps < 2) {
      // Follow-up mode: dive deeper into the last answer
      const lastQuestion = previousQuestions[previousQuestions.length - 1];
      
      systemPrompt = `${companyContextString}
      
      You just asked this question:
      """${lastQuestion}"""
      
      The candidate responded:
      """${lastAnswer}"""
      
      Generate a natural follow-up behavioral question that:
      1. Builds directly on their previous response
      2. Digs deeper into unexplored aspects of their story
      3. Seeks to understand their thought process, decision-making, or learnings
      4. Maintains the STAR format expectation
      5. Feels like a natural conversation progression
      
      Examples of good follow-up approaches:
      - "You mentioned [specific detail]. Can you tell me more about how you approached that particular challenge?"
      - "What would you do differently if you faced a similar situation again?"
      - "How did that experience change your approach to [relevant competency]?"
      
      ${formatRequirement}`;
    } else {
      // New topic mode: explore uncovered competencies
      const topicsGuidance = extractedTopics.length > 0 
        ? `Key competencies to focus on: ${extractedTopics.join(', ')}. ${askedTopics.length > 0 ? `Already covered: ${askedTopics.join(', ')}. ` : ''}Your question should explore a competency that hasn't been thoroughly covered yet.`
        : '';

      systemPrompt = `${companyContextString}
      
      ${topicsGuidance}
      
      You have already asked the following questions and received these answers:
      ${previousQuestions.map((q, i) => 
        `Q${i+1}: """${q}"""\nA${i+1}: """${previousAnswers[i] || "No answer provided"}"""`
      ).join('\n\n')}
      
      Based on this conversation history, the job description, and candidate's resume, generate the next behavioral interview question that:
      1. Explores a different aspect of the candidate's experience or skill set not yet covered
      2. Helps assess their fit for this specific role
      3. Is specific enough to elicit a detailed STAR (Situation, Task, Action, Result) response
      4. Focuses on competencies that haven't been thoroughly explored yet
      
      Make your question feel like a natural progression in the interview conversation.
      
      ${formatRequirement}`;
    }
  }

  const userPrompt = `
  Candidate Documents and Context:
  
  ${resumeText ? `Resume content: """${resumeText}"""` : ''}
  
  ${questionIndex > 0 ? 'Please generate the next question in the interview sequence, based on the conversation history provided in the system prompt.' : 'Please generate the first behavioral interview question for this candidate.'}
  `;

  console.log('Calling OpenAI API for question generation');

  const openAIResponse = await fetch('https://oai.helicone.ai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${openAIApiKey}`,
      'Helicone-Auth': `Bearer ${Deno.env.get('HELICONE_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ],
      response_format: { type: "json_object" }
    }),
  });

  const openAIData = await openAIResponse.json();
  console.log('OpenAI API response received for question');

  if (openAIData.error) {
    console.error('OpenAI API error:', openAIData.error);
    throw new Error(`OpenAI API error: ${openAIData.error.message}`);
  }

  const generatedContent = openAIData.choices[0].message.content;
  console.log('Generated question:', generatedContent.substring(0, 100) + '...');

  let parsedContent;
  try {
    if (typeof generatedContent === 'string') {
      parsedContent = JSON.parse(generatedContent);
    } else {
      parsedContent = generatedContent;
    }
    
    if (!parsedContent.question) {
      console.error('Invalid response structure:', parsedContent);
      throw new Error('OpenAI did not return the expected data structure');
    }
  } catch (parseError) {
    console.error('Error parsing JSON response:', parseError);
    console.log('Raw response:', generatedContent);
    throw new Error('Invalid JSON format in the OpenAI response');
  }
  
  // Generate analytics data for competency tracking
  const analytics = generateAnalytics(
    questionIndex,
    extractedTopics,
    askedTopics,
    topicFollowUpCounts,
    previousQuestions,
    previousAnswers
  );
  
  return {
    ...parsedContent,
    analytics
  };
}

// Analytics helper function for competency completion tracking
function generateAnalytics(
  questionIndex: number,
  extractedTopics: string[],
  askedTopics: string[],
  topicFollowUpCounts: Record<string, number>,
  previousQuestions: string[],
  previousAnswers: string[]
) {
  const uncoveredTopics = extractedTopics.filter(topic => !askedTopics.includes(topic));
  const totalQuestions = 5;
  const remainingQuestions = totalQuestions - (questionIndex + 1);
  
  // Calculate topic coverage percentage
  const coveragePercentage = extractedTopics.length > 0 
    ? Math.round((askedTopics.length / extractedTopics.length) * 100)
    : 0;
  
  // Calculate follow-up depth per topic
  const topicDepth = Object.entries(topicFollowUpCounts).map(([topic, count]) => ({
    topic,
    followUpCount: count,
    maxReached: count >= 2
  }));
  
  // Predict completion likelihood
  const completionPrediction = uncoveredTopics.length <= remainingQuestions 
    ? 'likely' 
    : uncoveredTopics.length <= remainingQuestions + 1 
    ? 'possible' 
    : 'unlikely';

  console.log(`Analytics - Coverage: ${coveragePercentage}%, Remaining topics: ${uncoveredTopics.length}, Completion: ${completionPrediction}`);

  return {
    questionNumber: questionIndex + 1,
    totalQuestions,
    remainingQuestions,
    extractedTopics,
    coveredTopics: askedTopics,
    uncoveredTopics,
    coveragePercentage,
    topicDepth,
    completionPrediction,
    interviewProgress: Math.round(((questionIndex + 1) / totalQuestions) * 100)
  };
}
