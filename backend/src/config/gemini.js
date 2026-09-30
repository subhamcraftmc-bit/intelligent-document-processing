import { GoogleGenAI } from '@google/genai';
import { config } from './env.js';
import { logger } from '../utils/logger.js';

export const isGeminiConfigured = () => {
  return Boolean(
    config.gemini.apiKey &&
    !config.gemini.apiKey.includes('your-gemini-api-key') &&
    config.gemini.apiKey.length > 10
  );
};

export let ai = null;

if (isGeminiConfigured()) {
  try {
    ai = new GoogleGenAI({ apiKey: config.gemini.apiKey });
    logger.info('Google Gen AI SDK initialized successfully');
  } catch (error) {
    logger.error('Failed to initialize Google Gen AI SDK:', error);
  }
} else {
  logger.warn('GEMINI_API_KEY is not configured. Running with high-fidelity realistic AI document extraction fallback.');
}
