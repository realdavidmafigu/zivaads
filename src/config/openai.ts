// OpenAI Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

// For development/testing only - replace with real key in production
export const OPENAI_CONFIG = {
  apiKey: OPENAI_API_KEY,
  model: 'gpt-4o', // Latest and most capable OpenAI model
  maxTokens: 1000,
  temperature: 0.7,
}; 