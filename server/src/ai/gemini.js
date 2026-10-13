/**
 * Gemini AI Client
 * Server-side only. Initializes from GEMINI_API_KEY.
 * Uses @google/genai SDK with schema-constrained JSON output.
 */

import { GoogleGenAI } from '@google/genai';
import env from '../config/env.js';
import logger from '../utils/logger.js';
import { SCAM_ANALYSIS_SYSTEM_PROMPT, AI_PROMPT_CHECK_SYSTEM_PROMPT, ANALYST_BRIEFING_SYSTEM_PROMPT } from './prompts.js';
import { scamAnalysisResponseSchema, aiPromptCheckResponseSchema, analystBriefingResponseSchema } from './schemas.js';
import { verifyGrounding, validateAdjustment } from './grounding.js';

let genai = null;

export function isAIAvailable() {
  return !!env.GEMINI_API_KEY;
}

function getClient() {
  if (!genai && env.GEMINI_API_KEY) {
    genai = new GoogleGenAI({ apiKey: env.GEMINI_API_KEY });
  }
  return genai;
}

async function callGemini(systemInstruction, userPrompt, schema, retryCount = 0) {
  const client = getClient();
  if (!client) throw new Error('AI not available');

  const model = env.GEMINI_MODEL;
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 20000);

  try {
    const response = await client.models.generateContent({
      model: model,
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      config: {
        systemInstruction: systemInstruction,
        temperature: 0.2,
        maxOutputTokens: 4096,
        responseMimeType: 'application/json',
      },
    });

    clearTimeout(timeout);

    const text = response?.text || '';
    let parsed;
    try {
      parsed = JSON.parse(text);
    } catch {
      if (retryCount < 1) {
        logger.warn('AI response not valid JSON, retrying with reminder');
        return callGemini(systemInstruction, userPrompt + '\n\nIMPORTANT: Return valid JSON only. No markdown wrapping.', schema, retryCount + 1);
      }
      throw new Error('AI returned invalid JSON after retry');
    }

    // Validate with Zod
    const validated = schema.safeParse(parsed);
    if (!validated.success) {
      if (retryCount < 1) {
        logger.warn({ errors: validated.error.errors.map(e => e.message) }, 'AI schema validation failed, retrying');
        return callGemini(systemInstruction, userPrompt + '\n\nIMPORTANT: Your previous response did not match the required schema. Return valid JSON only matching the exact schema.', schema, retryCount + 1);
      }
      throw new Error('AI response failed schema validation after retry');
    }

    return validated.data;
  } catch (err) {
    clearTimeout(timeout);
    
    if (err.name === 'AbortError') {
      throw new Error('AI request timed out');
    }
    
    // Retry on 429/5xx
    const status = err.status || err.httpStatusCode;
    if ((status === 429 || (status >= 500 && status < 600)) && retryCount < 1) {
      const backoff = (retryCount + 1) * 2000;
      logger.warn({ status }, `AI rate limited or server error, retrying in ${backoff}ms`);
      await new Promise(resolve => setTimeout(resolve, backoff));
      return callGemini(systemInstruction, userPrompt, schema, retryCount + 1);
    }
    
    throw err;
  }
}

/**
 * Run scam analysis with Gemini.
 */
export async function analyzeWithAI(params) {
  const { buildScamAnalysisPrompt } = await import('./prompts.js');
  const prompt = buildScamAnalysisPrompt(params);
  
  const result = await callGemini(SCAM_ANALYSIS_SYSTEM_PROMPT, prompt, scamAnalysisResponseSchema);
  
  // Verify grounding
  const grounded = verifyGrounding(result, params.sanitizedText);
  
  // Validate adjustment
  const { adjustment, reason } = validateAdjustment(grounded);
  grounded.risk_adjustment = adjustment;
  grounded.adjustment_reason = reason;
  
  return grounded;
}

/**
 * Run AI prompt safety check with Gemini.
 */
export async function checkAIPromptSafety(params) {
  const { buildAiPromptCheckPrompt } = await import('./prompts.js');
  const prompt = buildAiPromptCheckPrompt(params);
  
  return callGemini(AI_PROMPT_CHECK_SYSTEM_PROMPT, prompt, aiPromptCheckResponseSchema);
}

/**
 * Generate analyst briefing with Gemini.
 */
export async function generateBriefing(aggregates) {
  const { buildBriefingPrompt } = await import('./prompts.js');
  const prompt = buildBriefingPrompt(aggregates);
  
  const result = await callGemini(ANALYST_BRIEFING_SYSTEM_PROMPT, prompt, analystBriefingResponseSchema);
  
  // Verify supporting numbers exist in aggregates
  const aggregateStr = JSON.stringify(aggregates);
  if (result.top_trends) {
    result.top_trends = result.top_trends.map(trend => ({
      ...trend,
      supporting_numbers: trend.supporting_numbers?.filter(num => aggregateStr.includes(num)) || [],
    }));
  }
  
  return result;
}
