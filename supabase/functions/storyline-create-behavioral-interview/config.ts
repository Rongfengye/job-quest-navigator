
export const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

export const sonarConfig = {
  model: 'llama-3.1-sonar-small-128k-online',
  temperature: 0.2,
  max_tokens: 4000,
  top_p: 0.9,
  frequency_penalty: 1,
  presence_penalty: 0,
};

