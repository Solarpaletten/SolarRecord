/**
 * Translation Service using DeepSeek API
 * DashkaRecord v2.0.0-alpha - Phase 3
 */

import { promises as fs } from 'fs';
import { TranslateRequest, TranslateResult } from '../types/recording';
import { getRecordingPaths, readMetadata, updateMetadata } from './storage';

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY || '';
const DEEPSEEK_API_URL = 'https://api.deepseek.ai/v1/chat/completions';

/**
 * Translate transcript using DeepSeek API
 */
export async function translateTranscript(
  request: TranslateRequest
): Promise<TranslateResult> {
  console.log(`🌐 Translating ${request.recordingId} to ${request.targetLanguage}`);

  const metadata = await readMetadata(request.recordingId);
  if (!metadata || !metadata.transcriptPath) {
    throw new Error('Transcript not found');
  }

  // Read transcript
  const transcriptContent = await fs.readFile(metadata.transcriptPath, 'utf-8');

  // Parse metadata lines
  const lines = transcriptContent.split('\n');
  let transcriptText = transcriptContent;
  let sourceLanguage = metadata.language || 'auto';

  if (lines[0].startsWith('[Language:')) {
    sourceLanguage = lines[0].replace('[Language:', '').replace(']', '').trim();
    transcriptText = lines.slice(3).join('\n');
  }

  // Translate using DeepSeek
  const translatedText = await translateWithDeepSeek(
    transcriptText,
    sourceLanguage,
    request.targetLanguage
  );

  // Save translation
  const paths = getRecordingPaths(request.recordingId);
  const translationPath = paths.transcript.replace('.txt', `_${request.targetLanguage}.txt`);

  await fs.writeFile(
    translationPath,
    `[Original Language: ${sourceLanguage}]\n[Translated to: ${request.targetLanguage}]\n\n${translatedText}`,
    'utf-8'
  );

  // Update metadata
  await updateMetadata(request.recordingId, {
    translated: true,
    translationLanguage: request.targetLanguage,
    translationPath,
  });

  console.log(`✅ Translation complete: ${translationPath}`);

  return {
    translatedText,
    translationPath,
  };
}

/**
 * Translate text using DeepSeek API
 */
async function translateWithDeepSeek(
  text: string,
  sourceLanguage: string,
  targetLanguage: string
): Promise<string> {
  if (!DEEPSEEK_API_KEY) {
    throw new Error('DEEPSEEK_API_KEY not configured in environment');
  }

  const languageNames: Record<string, string> = {
    en: 'English',
    ru: 'Russian',
    lt: 'Lithuanian',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    uk: 'Ukrainian',
    pl: 'Polish',
    it: 'Italian',
  };

  const sourceName = languageNames[sourceLanguage] || sourceLanguage;
  const targetName = languageNames[targetLanguage] || targetLanguage;

  const prompt = sourceLanguage === 'auto'
    ? `Translate the following text to ${targetName}. Preserve formatting and structure:\n\n${text}`
    : `Translate from ${sourceName} to ${targetName}. Preserve formatting and structure:\n\n${text}`;

  try {
    const response = await fetch(DEEPSEEK_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a professional translator. Translate accurately while preserving the original tone and structure.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.3,
        max_tokens: 4000,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`DeepSeek API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();
    const translatedText = result.choices[0].message.content.trim();

    return translatedText;
  } catch (error) {
    console.error('❌ Translation error:', error);
    throw error;
  }
}

/**
 * Get available translation languages
 */
export function getAvailableLanguages(): Record<string, string> {
  return {
    en: 'English',
    ru: 'Russian',
    lt: 'Lithuanian',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    uk: 'Ukrainian',
    pl: 'Polish',
    it: 'Italian',
  };
}

/**
 * Check if DeepSeek API is configured
 */
export function isTranslationAvailable(): boolean {
  return !!DEEPSEEK_API_KEY;
}
