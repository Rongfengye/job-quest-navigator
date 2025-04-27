
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const responseSchema = {
  "type": "object",
  "properties": {
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
          }
        },
        "required": ["question", "explanation", "modelAnswer", "followUp"]
      }
    },
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
          }
        },
        "required": ["question", "explanation", "modelAnswer", "followUp"]
      }
    }
  },
  "required": ["technicalQuestions", "behavioralQuestions"]
};

