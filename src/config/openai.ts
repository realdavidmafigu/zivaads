// OpenAI Configuration
export const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

// For development/testing only - replace with real key in production
export const OPENAI_CONFIG = {
  apiKey: OPENAI_API_KEY,
  model: 'gpt-3.5-turbo',
  maxTokens: 1000,
  temperature: 0.7,
}; 