import { GoogleGenAI } from '@google/genai';
import { env } from '../config/env';
import { AppError } from '../types/index';
import { prisma } from '../config/database';

// ─────────────────────────────────────────────────────────────
// Gemini client — singleton pattern
// ─────────────────────────────────────────────────────────────

let _ai: GoogleGenAI | null = null;

function getAI(): GoogleGenAI {
  if (!_ai) {
    const apiKey = env.GEMINI_API_KEY;
    const isAuthKey = apiKey.startsWith('AQ.');

    _ai = new GoogleGenAI({
      apiKey,
      ...(isAuthKey && {
        httpOptions: {
          headers: {
            'Authorization': `Bearer ${apiKey}`
          }
        }
      })
    });
  }
  return _ai;
}

/**
 * Sends a prompt to Gemini and returns the raw text response.
 *
 * Throws AppError (502) on:
 * - API errors
 * - Empty responses
 * - Responses exceeding the size limit
 */
export async function generateContent(prompt: string): Promise<string> {
  const ai = getAI();
  let rawText: string;

  try {
    const response = await ai.models.generateContent({
      model: env.GEMINI_MODEL,
      contents: prompt,
      config: {
        temperature: 0.25,      // Low temperature for deterministic JSON
        topP: 0.85,
        topK: 40,
        maxOutputTokens: 2048, // Limit response size
      }
    });

    rawText = response.text || '';

    // Log success metric
    void prisma.plannerMetric.create({
      data: {
        metric: 'GEMINI_CALL',
        status: 'SUCCESS',
      }
    }).catch(e => console.error('Failed to log success metric:', e));

  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown Gemini error';

    // Log failure metric
    void prisma.plannerMetric.create({
      data: {
        metric: 'GEMINI_CALL',
        status: 'FAILURE',
        details: message.substring(0, 500),
      }
    }).catch(e => console.error('Failed to log failure metric:', e));

    throw new AppError(`Gemini API request failed: ${message}`, 502);
  }

  if (!rawText || rawText.trim().length === 0) {
    throw new AppError('Gemini returned an empty response', 502);
  }

  // Hard limit on response size to prevent runaway outputs
  if (rawText.length > 8000) {
    throw new AppError('Gemini response exceeded the allowed size limit', 502);
  }

  return rawText.trim();
}
