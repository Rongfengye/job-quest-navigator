
import { corsHeaders } from './index.ts';

// Feature flag to control technical question generation
const ENABLE_TECHNICAL_QUESTIONS = false;

// A/B testing configuration for prompt variations
const PROMPT_VARIATION_CONFIG = {
  enabled: Deno.env.get('ENABLE_PROMPT_AB_TESTING') === 'true',
  defaultVariation: 'standard',
  variations: {
    standard: 'standard_search_prompt',
    enhanced: 'enhanced_search_prompt'
  }
};

// Phase 3: College-focused competencies for topic control
const COLLEGE_COMPETENCIES = [
  'teamwork', 'learning_agility', 'initiative', 'problem_solving', 
  'adaptability', 'communication', 'leadership', 'time_management',
  'collaboration', 'conflict_resolution', 'project_management'
];

// Phase 3: Topic distribution tracking
const TOPIC_DISTRIBUTION = {
  required_coverage: ['teamwork', 'learning_agility', 'initiative', 'problem_solving'],
  preferred_coverage: ['adaptability', 'communication', 'leadership'],
  max_per_topic: 2 // Prevent over-concentration on single topics
};

// Phase 4: Resume parsing for experience extraction
const RESUME_EXPERIENCE_KEYWORDS = {
  internships: ['intern', 'internship', 'co-op', 'coop', 'summer analyst', 'trainee'],
  leadership: ['president', 'leader', 'captain', 'coordinator', 'manager', 'director', 'head', 'chair'],
  projects: ['project', 'developed', 'built', 'created', 'designed', 'implemented', 'led team'],
  technical_skills: ['python', 'java', 'javascript', 'react', 'sql', 'git', 'aws', 'machine learning', 'data analysis'],
  achievements: ['award', 'recognition', 'scholarship', 'dean\'s list', 'honor', 'achievement', 'competition'],
  teamwork: ['team', 'collaborated', 'group project', 'cross-functional', 'committee', 'organization']
};

// Phase 5: Company culture research patterns
const CULTURE_RESEARCH_PATTERNS = [
  'company values', 'mission statement', 'company culture', 'work environment', 
  'employee testimonials', 'glassdoor culture reviews', 'linkedin company updates',
  'diversity and inclusion', 'remote work policy', 'employee benefits'
];

// Phase 4: Extract key experiences from resume text
function extractResumeExperiences(resumeText: string): any {
  if (!resumeText) return { experiences: [], skills: [], keywords: [] };
  
  const text = resumeText.toLowerCase();
  const extractedData = {
    experiences: [] as string[],
    skills: [] as string[],
    keywords: [] as string[],
    leadership: [] as string[],
    projects: [] as string[]
  };
  
  // Extract experiences by category
  Object.entries(RESUME_EXPERIENCE_KEYWORDS).forEach(([category, keywords]) => {
    keywords.forEach(keyword => {
      if (text.includes(keyword.toLowerCase())) {
        extractedData.keywords.push(keyword);
        if (category === 'leadership') extractedData.leadership.push(keyword);
        if (category === 'technical_skills') extractedData.skills.push(keyword);
        if (category === 'projects') extractedData.projects.push(keyword);
      }
    });
  });
  
  return extractedData;
}

// Phase 5: Generate company culture research prompts
function generateCultureResearchPrompts(companyName: string): string {
  return `
    COMPANY CULTURE RESEARCH for ${companyName}:
    - Search for ${companyName} company values, mission statement, and cultural principles
    - Look for employee testimonials and culture reviews on Glassdoor, Blind, LinkedIn
    - Research ${companyName}'s stance on diversity, inclusion, remote work, and work-life balance
    - Find information about ${companyName}'s leadership style and team dynamics
    - Identify any unique cultural aspects, traditions, or employee programs at ${companyName}
  `;
}

// Phase 2: Enhanced source attribution with validation scoring
const SOURCE_ATTRIBUTION = {
  'glassdoor-verified': { priority: 1, reliability: 5, category: 'interview_review', platform: 'Glassdoor' },
  'blind-verified': { priority: 2, reliability: 4, category: 'professional_forum', platform: 'Blind' },
  'company-official': { priority: 1, reliability: 5, category: 'official_source', platform: 'Company Website' },
  'reddit-cscareerquestions': { priority: 3, reliability: 3, category: 'community_forum', platform: 'Reddit' },
  'reddit-internships': { priority: 3, reliability: 3, category: 'community_forum', platform: 'Reddit' },
  'reddit-company': { priority: 2, reliability: 4, category: 'community_forum', platform: 'Reddit' },
  'forum-general': { priority: 4, reliability: 2, category: 'general_forum', platform: 'Various' },
  'ai-generated': { priority: 5, reliability: 2, category: 'ai_fallback', platform: 'AI' }
};

// Phase 2: Company-specific search patterns
function getCompanySpecificSearchPatterns(companyName: string): string[] {
  return [
    `"${companyName}" intern interview questions site:glassdoor.com`,
    `"${companyName}" interview experience site:blind.com`,
    `"${companyName}" internship interview site:reddit.com/r/cscareerquestions`,
    `"${companyName}" new grad interview site:reddit.com/r/internships`,
    `"${companyName}" behavioral interview questions`,
    `"${companyName}" entry level interview process`
  ];
}

function logSourceAttribution(companyName: string, requestId: string) {
  console.log(`[SOURCE-ATTRIBUTION] ${requestId} - Company: ${companyName}`);
  console.log(`[SOURCE-ATTRIBUTION] ${requestId} - Target sources prioritized:`, {
    primary: ['Glassdoor', 'Blind', 'Company Official'],
    secondary: ['Reddit (r/cscareerquestions, r/internships)', 'Quora'],
    fallback: ['AI-generated based on job description']
  });
}

function logPromptVariation(variation: string, requestId: string) {
  console.log(`[PROMPT-VARIATION] ${requestId} - Using variation: ${variation}`);
}

function determinePromptVariation(requestId: string): string {
  if (!PROMPT_VARIATION_CONFIG.enabled) {
    return PROMPT_VARIATION_CONFIG.defaultVariation;
  }
  
  // Simple A/B test logic - could be enhanced with proper experiment framework
  const variation = Math.random() < 0.5 ? 'standard' : 'enhanced';
  logPromptVariation(variation, requestId);
  return variation;
}

// Phase 3: Generate college-appropriate topic guidance
function generateTopicGuidance(): string {
  const shuffledRequiredTopics = [...TOPIC_DISTRIBUTION.required_coverage].sort(() => Math.random() - 0.5);
  const shuffledPreferredTopics = [...TOPIC_DISTRIBUTION.preferred_coverage].sort(() => Math.random() - 0.5);
  
  return `
    TOPIC DISTRIBUTION REQUIREMENTS for college students/new grads:
    - MUST cover these competencies (at least 1 question each): ${shuffledRequiredTopics.join(', ')}
    - PREFERRED coverage: ${shuffledPreferredTopics.join(', ')}
    - Focus on school projects, internships, part-time jobs, group work, leadership roles
    - Avoid requiring extensive professional experience
    - Maximum ${TOPIC_DISTRIBUTION.max_per_topic} questions per competency to ensure variety
  `;
}

function getSearchSpecification(companyName: string, variation: string): string {
  const baseWebsiteList = 'Glassdoor, Reddit, Blind, Wall Street Oasis, OneClass, Fishbowl, PrepLounge, Quora, LeetCode Discuss, Indeed';
  
  // Phase 2: Get company-specific search patterns
  const searchPatterns = getCompanySpecificSearchPatterns(companyName);
  const topicGuidance = generateTopicGuidance();
  // Phase 5: Add company culture research
  const cultureResearch = generateCultureResearchPrompts(companyName);
  
  if (variation === 'enhanced') {
    return `Search for REAL interview questions that have actually been asked by ${companyName} using this prioritized approach:

    PRIORITY 1 - Official Interview Experience Sources (Focus: intern/new grad roles):
    - Glassdoor interview experiences for ${companyName} internships and entry-level roles (mark as "source": "glassdoor-verified")
    - Blind company-specific posts about ${companyName} intern/new grad interviews (mark as "source": "blind-verified") 
    - ${companyName} official career pages and university recruiting guides (mark as "source": "company-official")

    PRIORITY 2 - Community & Forum Sources:
    - Reddit r/cscareerquestions posts mentioning ${companyName} intern interviews (mark as "source": "reddit-cscareerquestions")
    - Reddit r/internships ${companyName} interview experiences (mark as "source": "reddit-internships")
    - Company-specific subreddits discussing ${companyName} recruiting (mark as "source": "reddit-company")

    PRIORITY 3 - Fallback Sources:
    - Other professional forums focusing on entry-level roles (mark as "source": "forum-general")
    - If no real questions found, generate college-appropriate questions (mark as "source": "ai-generated")

    ${topicGuidance}

    ${cultureResearch}

    VALIDATION CRITERIA: Questions must be appropriate for college students/new grads with limited professional experience.`;
  }
  
  // Standard variation with topic guidance and culture research added
  return `Search the web across hiring forums, ${companyName}'s website, and job review sites (such as ${baseWebsiteList}) to find interview questions that have actually been asked by ${companyName} for intern and entry-level roles. 
  Focus on questions appropriate for college students and new graduates.
  If you find such questions, prioritize them in the list of returned questions. 
  If not, generate questions based on the job description and candidate profile.
  
  ${topicGuidance}
  
  ${cultureResearch}`;
}

export async function generateQuestion(requestData: any, perplexityApiKey: string) {
  const { 
    jobTitle, 
    jobDescription, 
    companyName, 
    companyDescription, 
    resumeText, 
    coverLetterText, 
    additionalDocumentsText,
    originalBehavioralQuestions = [] // New parameter for original questions
  } = requestData;

  // Generate unique request ID for tracking
  const requestId = crypto.randomUUID().substring(0, 8);

  // Phase 4: Extract resume experiences for personalization
  const resumeExperiences = extractResumeExperiences(resumeText);
  
  console.log(`[GENERATE-QUESTION] ${requestId} - Received request to generate interview questions`);
  console.log(`[GENERATE-QUESTION] ${requestId} - Job Title: ${jobTitle}, Company: ${companyName}`);
  console.log(`[GENERATE-QUESTION] ${requestId} - Resume text length: ${resumeText?.length || 0}`);
  console.log(`[RESUME-ANALYSIS] ${requestId} - Extracted experiences:`, resumeExperiences);
  console.log(`[GENERATE-QUESTION] ${requestId} - Original behavioral questions count: ${originalBehavioralQuestions.length}`);
  console.log(`[GENERATE-QUESTION] ${requestId} - Technical questions enabled: ${ENABLE_TECHNICAL_QUESTIONS}`);

  // Log source attribution strategy
  logSourceAttribution(companyName, requestId);

  // Determine prompt variation for A/B testing
  const promptVariation = determinePromptVariation(requestId);

  const formatSpecification = `
  Your response MUST be a valid JSON object in the following format:
  {
    ${ENABLE_TECHNICAL_QUESTIONS ? `"technicalQuestions": [
      {
        "question": "string",
        "explanation": "string",
        "modelAnswer": "string (STAR format)",
        "followUp": ["string"],
        "sourceAttribution": {
          "source": "string (e.g., glassdoor-verified, blind-verified, ai-generated)",
          "reliability": "number (1-5 scale)",
          "category": "string (e.g., interview_review, professional_forum)"
        }
      }
    ],` : ''}
    "behavioralQuestions": [
      {
        "question": "string",
        "explanation": "string",
        "modelAnswer": "string (STAR format)",
        "followUp": ["string"],
        "sourceAttribution": {
          "source": "string (e.g., glassdoor-verified, blind-verified, ai-generated)",
          "reliability": "number (1-5 scale)",
          "category": "string (e.g., interview_review, professional_forum)"
        }
      }
    ]
  }

  and for each of the strings values, please ensure they are formatted as follows:
  - Use standard sentence case (capitalize only the first letter and proper nouns).
  - Ensure there are spaces between all words.
  - Do not use all capital letters or run words together.
  `

  // Sonar system prompt
  const sonarSystemPrompt = `You are an experienced interviewer for a ${jobTitle} position.
  ${companyName ? `The company name is ${companyName}.` : ''}
  ${companyDescription ? `About the company: """${companyDescription}"""` : ''}
  ${jobDescription ? `About the job: """${jobDescription}"""` : ''}`

  // Get search specification based on prompt variation
  const searchSpecification = getSearchSpecification(companyName, promptVariation);

  console.log(`[SEARCH-STRATEGY] ${requestId} - Using ${promptVariation} search specification`);

  // Create the user prompt with conditional question generation
  const questionCount = ENABLE_TECHNICAL_QUESTIONS ? 10 : 5;
  const questionTypes = ENABLE_TECHNICAL_QUESTIONS 
    ? `- 5 technical questions focused on entry-level technical skills and problem-solving
    - 5 behavioral questions focused on teamwork, learning, and project experience`
    : `- 5 behavioral questions focused on teamwork, learning, and project experience`;

  // Phase 4: Generate experience-based personalization prompts
  const experiencePrompts = resumeExperiences.keywords.length > 0 ? 
    `
    CANDIDATE EXPERIENCE CUSTOMIZATION:
    - Based on candidate's resume, they have experience with: ${resumeExperiences.keywords.join(', ')}
    - Leadership experiences found: ${resumeExperiences.leadership.join(', ') || 'None identified'}
    - Technical skills mentioned: ${resumeExperiences.skills.join(', ') || 'None identified'}
    - Project experience: ${resumeExperiences.projects.join(', ') || 'None identified'}
    - Generate questions that allow the candidate to discuss their specific experiences
    - Reference their actual background when crafting model answers
    ` : '';

  const userPrompt = `
  Candidate Documents and Context:
  ${resumeText ? `Resume content: "${resumeText}"` : ''}
  ${coverLetterText ? `Cover Letter content: "${coverLetterText}"` : ''}
  ${additionalDocumentsText ? `Additional Documents content: "${additionalDocumentsText}"` : ''}

  Based on the provided information, generate ${questionCount} interview questions:
  ${questionTypes}

  ${searchSpecification}

  ${experiencePrompts}

  ${formatSpecification}
  `;

  // Define the JSON schema for response format with conditional technical questions
  const responseSchema = {
    "type": "object",
    "properties": {
      ...(ENABLE_TECHNICAL_QUESTIONS && {
        "technicalQuestions": {
          "type": "array",
          "items": {
            "type": "object",
            "properties": {
              "question": { "type": "string" },
              "explanation": { "type": "string" },
              "modelAnswer": { "type": "string" },
              "followUp": { 
                "type": "array",
                "items": { "type": "string" }
              },
              "sourceAttribution": {
                "type": "object",
                "properties": {
                  "source": { "type": "string" },
                  "reliability": { "type": "number" },
                  "category": { "type": "string" }
                }
              }
            },
            "required": ["question", "explanation", "modelAnswer", "followUp"]
          }
        }
      }),
      "behavioralQuestions": {
        "type": "array",
        "items": {
          "type": "object",
          "properties": {
            "question": { "type": "string" },
            "explanation": { "type": "string" },
            "modelAnswer": { "type": "string" },
            "followUp": { 
              "type": "array",
              "items": { "type": "string" }
            },
            "sourceAttribution": {
              "type": "object",
              "properties": {
                "source": { "type": "string" },
                "reliability": { "type": "number" },
                "category": { "type": "string" }
              }
            }
          },
          "required": ["question", "explanation", "modelAnswer", "followUp"]
        }
      }
    },
    "required": ENABLE_TECHNICAL_QUESTIONS ? ["technicalQuestions", "behavioralQuestions"] : ["behavioralQuestions"]
  };

  // New Perplexity Sonar API call with proper response_format
  console.log(`[PERPLEXITY-API] ${requestId} - Calling Perplexity Sonar API`);
  const perplexityResponse = await fetch('https://perplexity.helicone.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${perplexityApiKey}`,
      'Helicone-Auth': `Bearer ${Deno.env.get('HELICONE_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'sonar',
      messages: [
        { role: 'system', content: sonarSystemPrompt },
        { role: 'user', content: userPrompt }
      ],
      temperature: 0.3,
      max_tokens: 4000,
      top_p: 0.9,
      frequency_penalty: 1,
      presence_penalty: 0,
      response_format: {
        "type": "json_schema",
        "json_schema": { "schema": responseSchema }
      }
    }),
  });

  const perplexityData = await perplexityResponse.json();
  console.log(`[PERPLEXITY-API] ${requestId} - API response received`);

  if (perplexityData.error) {
    console.error(`[PERPLEXITY-ERROR] ${requestId} - API error:`, perplexityData.error);
    throw new Error(`Perplexity API error: ${perplexityData.error.message}`);
  }

  const generatedContent = perplexityData.choices[0].message.content;
  console.log(`[CONTENT-ANALYSIS] ${requestId} - Generated content length: ${generatedContent.length}`);
  console.log(`[CONTENT-ANALYSIS] ${requestId} - Content preview:`, generatedContent.substring(0, 100));

  let parsedContent;
  try {
    // Check if content is already a JSON object
    if (typeof generatedContent === 'object' && generatedContent !== null) {
      parsedContent = generatedContent;
      console.log(`[PARSING] ${requestId} - Content was already a JSON object`);
    } 
    // Try to parse as JSON string
    else if (typeof generatedContent === 'string') {
      // Remove markdown code blocks if present
      let cleanContent = generatedContent;
      if (cleanContent.includes('```json')) {
        cleanContent = cleanContent.replace(/```json/g, '').replace(/```/g, '').trim();
        console.log(`[PARSING] ${requestId} - Removed markdown code blocks`);
      }
      
      parsedContent = JSON.parse(cleanContent);
      console.log(`[PARSING] ${requestId} - Successfully parsed JSON string`);
    } else {
      console.error(`[PARSING-ERROR] ${requestId} - Unexpected content type:`, typeof generatedContent);
      throw new Error('Content is neither a string nor an object');
    }
    
    // Validate the expected structure
    console.log(`[STRUCTURE-CHECK] ${requestId} - Parsed content structure:`, 
      ENABLE_TECHNICAL_QUESTIONS ? (
        'technicalQuestions' in parsedContent ? 'has technicalQuestions' : 'no technicalQuestions'
      ) : 'technical questions disabled',
      'behavioralQuestions' in parsedContent ? 'has behavioralQuestions' : 'no behavioralQuestions',
      'questions' in parsedContent ? 'has questions' : 'no questions'
    );
    
    // Log source attribution analytics
    if (parsedContent.behavioralQuestions) {
      const sourceAnalytics = parsedContent.behavioralQuestions.reduce((acc: any, question: any) => {
        const source = question.sourceAttribution?.source || 'unknown';
        acc[source] = (acc[source] || 0) + 1;
        return acc;
      }, {});
      
      console.log(`[SOURCE-ANALYTICS] ${requestId} - Question source distribution:`, sourceAnalytics);
    }
    
    // Check if the response structure is valid based on feature flag
    const hasRequiredStructure = ENABLE_TECHNICAL_QUESTIONS 
      ? (parsedContent.technicalQuestions && parsedContent.behavioralQuestions)
      : parsedContent.behavioralQuestions;

    if (!hasRequiredStructure && !parsedContent.questions) {
      console.error(`[STRUCTURE-ERROR] ${requestId} - Invalid response structure:`, JSON.stringify(parsedContent).substring(0, 200));
      throw new Error('Perplexity did not return the expected data structure');
    }
    
    // Transform if the response doesn't match our expected structure
    if (!hasRequiredStructure && parsedContent.questions) {
      console.log(`[TRANSFORMATION] ${requestId} - Transforming questions array to separate technical and behavioral arrays`);
      
      const transformedContent = {
        ...(ENABLE_TECHNICAL_QUESTIONS && { technicalQuestions: [] }),
        behavioralQuestions: []
      };
      
      parsedContent.questions.forEach((q: any) => {
        const questionLower = q.question.toLowerCase();
        
        if (ENABLE_TECHNICAL_QUESTIONS && (
            questionLower.includes('technical') || 
            questionLower.includes('tool') || 
            questionLower.includes('skill') ||
            questionLower.includes('technology'))) {
          transformedContent.technicalQuestions!.push(q);
        } else {
          transformedContent.behavioralQuestions.push(q);
        }
      });
      
      // Ensure we have at least some questions
      if (ENABLE_TECHNICAL_QUESTIONS && transformedContent.technicalQuestions!.length === 0 && parsedContent.questions.length > 0) {
        transformedContent.technicalQuestions!.push(parsedContent.questions[0]);
      }
      if (transformedContent.behavioralQuestions.length === 0 && parsedContent.questions.length > 1) {
        transformedContent.behavioralQuestions.push(parsedContent.questions[1]);
      }
      
      parsedContent = transformedContent;
      console.log(`[TRANSFORMATION] ${requestId} - Transformed to expected structure`);
    }
    
    console.log(`[FINAL-STRUCTURE] ${requestId} - Final question counts:`, 
      ENABLE_TECHNICAL_QUESTIONS ? (
        'technicalQuestions:', parsedContent.technicalQuestions?.length || 0
      ) : 'technical questions disabled',
      'behavioralQuestions:', parsedContent.behavioralQuestions?.length || 0
    );
    
  } catch (parseError) {
    console.error(`[PARSING-ERROR] ${requestId} - Error parsing JSON response:`, parseError);
    console.log(`[PARSING-ERROR] ${requestId} - Raw response:`, generatedContent);
    
    throw new Error('Invalid JSON format in the Perplexity response');
  }

  // Initialize technical questions as empty array if disabled (to maintain structure)
  if (!ENABLE_TECHNICAL_QUESTIONS && !parsedContent.technicalQuestions) {
    parsedContent.technicalQuestions = [];
  }

  // NEW: Combine original behavioral questions with newly generated ones
  if (originalBehavioralQuestions.length > 0) {
    console.log(`[ORIGINAL-QUESTIONS] ${requestId} - Adding original behavioral questions to the response`);
    
    // Convert original questions to the expected format
    const formattedOriginalQuestions = originalBehavioralQuestions.map((question: string, index: number) => ({
      question: question,
      explanation: "This question was from your behavioral interview practice session.",
      modelAnswer: "Use the STAR method (Situation, Task, Action, Result) to structure your response based on your previous answer during the interview.",
      followUp: [`Can you elaborate on the results you achieved?`, `What would you do differently next time?`],
      type: 'original-behavioral' as const,
      originalIndex: index,
      sourceAttribution: {
        source: "behavioral-practice-session",
        reliability: 5,
        category: "practice_session"
      }
    }));

    // Add original questions to the parsed content
    parsedContent.originalBehavioralQuestions = formattedOriginalQuestions;
    
    console.log(`[ORIGINAL-QUESTIONS] ${requestId} - Added ${formattedOriginalQuestions.length} original behavioral questions`);
  }

  console.log(`[GENERATE-QUESTION] ${requestId} - Question generation completed successfully`);
  return parsedContent;
}
