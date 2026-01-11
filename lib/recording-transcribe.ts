
import { exec } from 'child_process';
import { promises as fs } from 'fs';
import path from 'path';
import { promisify } from 'util';
import { TranscribeResult, WhisperConfig, WhisperMode } from '@/types';
import { getRecordingPaths } from '@/lib/recording-storage';

const PYTHON_BIN = path.join(process.cwd(), 'venv/bin/python3');

const execPromise = promisify(exec);

// Configuration from environment
const WHISPER_MODE: WhisperMode = (process.env.WHISPER_MODE as WhisperMode) || 'subprocess';
const WHISPER_MODEL = process.env.WHISPER_MODEL || 'base';

/**
 * Main transcription function
 */
export async function transcribe(
  recordingId: string,
  videoPath: string,
  language?: string
): Promise<{ textPath: string; segmentsPath: string; language: string; confidence: number }> {
  console.log(`🎙️ Starting transcription for ${recordingId} (mode: ${WHISPER_MODE})`);

  const config: WhisperConfig = {
    mode: WHISPER_MODE,
    model: WHISPER_MODEL,
    language,
  };

  let result: TranscribeResult;

  switch (config.mode) {
    case 'subprocess':
      result = await transcribeSubprocess(videoPath, config);
      break;
    case 'node':
      result = await transcribeNode(videoPath, config);
      break;
    case 'cloud':
      result = await transcribeCloud(videoPath, config);
      break;
    default:
      throw new Error(`Unknown Whisper mode: ${config.mode}`);
  }

  // Save results to files
  const paths = getRecordingPaths(recordingId);

  // Save main transcript
  await fs.writeFile(
    paths.transcript,
    `[Language: ${result.language}]\n[Confidence: ${(result.languageConfidence * 100).toFixed(1)}%]\n\n${result.text}`,
    'utf-8'
  );

  // Save segments with timestamps
  const segmentsText = result.segments
    .map(s => `[${formatTime(s.start)} --> ${formatTime(s.end)}] ${s.text}`)
    .join('\n');

  await fs.writeFile(paths.transcriptSegments, segmentsText, 'utf-8');

  console.log(`✅ Transcription complete: ${result.language} (${result.segments.length} segments)`);

  return {
    textPath: paths.transcript,
    segmentsPath: paths.transcriptSegments,
    language: result.language,
    confidence: result.languageConfidence,
  };
}

/**
 * Subprocess mode: Call Python script
 */
async function transcribeSubprocess(
  videoPath: string,
  config: WhisperConfig
): Promise<TranscribeResult> {
  const scriptPath = path.join(process.cwd(), 'scripts/transcribe.py');

  // Check if script exists
  try {
    await fs.access(scriptPath);
  } catch {
    throw new Error(`Python transcribe script not found: ${scriptPath}`);
  }

  const outTextPath = `${videoPath}.transcript.json`;

  let command = `"${PYTHON_BIN}" ${scriptPath} --input "${videoPath}" --output "${outTextPath}" --model ${config.model}`;


  

  if (config.language) {
    command += ` --language ${config.language}`;
  }

  console.log(`🐍 Executing: ${command}`);

  try {
    const { stdout, stderr } = await execPromise(command, {
      timeout: 600000, // 10 minutes timeout
    });

    if (stderr) {
      console.warn('Python stderr:', stderr);
    }

    // Read result from JSON file
    const resultContent = await fs.readFile(outTextPath, 'utf-8');
    const result = JSON.parse(resultContent);

    // Clean up temp file
    await fs.unlink(outTextPath).catch(() => { });

    return {
      text: result.text,
      language: result.language,
      languageConfidence: result.language_probability || 0.9,
      segments: result.segments || [],
      durationSeconds: result.duration || 0,
    };
  } catch (error) {
    console.error('❌ Subprocess transcription error:', error);
    throw new Error(`Transcription failed: ${(error as Error).message}`);
  }
}

/**
 * Node mode: Use whisper-node (if installed)
 */
async function transcribeNode(
  videoPath: string,
  config: WhisperConfig
): Promise<TranscribeResult> {
  // This would require whisper-node package
  // For now, throw error with instructions
  throw new Error(
    'whisper-node mode not implemented. Install whisper-node or use subprocess mode.\n' +
    'Set WHISPER_MODE=subprocess in .env.local'
  );

  /* Future implementation:
  const { WhisperModel } = await import('whisper-node');
  const whisper = new WhisperModel({ modelName: config.model });
  const result = await whisper.transcribe(videoPath);
  return result;
  */
}

/**
 * Cloud mode: Use OpenAI Whisper API
 */
async function transcribeCloud(
  videoPath: string,
  config: WhisperConfig
): Promise<TranscribeResult> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      'OpenAI API key not found. Set OPENAI_API_KEY in .env.local or use subprocess mode.'
    );
  }

  try {
    // Read file
    const fileBuffer = await fs.readFile(videoPath);
    const filename = path.basename(videoPath);

    // Create FormData
    const formData = new FormData();
    formData.append('file', new Blob([fileBuffer]), filename);
    formData.append('model', 'whisper-1');

    if (config.language) {
      formData.append('language', config.language);
    }

    formData.append('response_format', 'verbose_json');

    // Call OpenAI API
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
      },
      body: formData,
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenAI API error: ${response.status} ${errorText}`);
    }

    const result = await response.json();

    return {
      text: result.text,
      language: result.language || 'unknown',
      languageConfidence: 0.95, // OpenAI doesn't provide this
      segments: result.segments || [],
      durationSeconds: result.duration || 0,
    };
  } catch (error) {
    console.error('❌ Cloud transcription error:', error);
    throw new Error(`Cloud transcription failed: ${(error as Error).message}`);
  }
}

/**
 * Format seconds to HH:MM:SS
 */
function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);

  if (hours > 0) {
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }
  return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages() {
  return {
    en: 'English',
    ru: 'Russian',
    lt: 'Lithuanian',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    it: 'Italian',
    pl: 'Polish',
    uk: 'Ukrainian',
    auto: 'Auto-detect',
  };
}

/**
 * Check Whisper availability
 */
export async function checkWhisperAvailability(): Promise<{
  available: boolean;
  mode: WhisperMode;
  message: string;
}> {
  switch (WHISPER_MODE) {
    case 'subprocess':
      try {
        const scriptPath = path.join(process.cwd(), 'scripts/transcribe.py');
        await fs.access(scriptPath);

        // Try to run python
        await execPromise(`"${PYTHON_BIN}" --version`);

        return {
          available: true,
          mode: 'subprocess',
          message: 'Python venv + Whisper available',
        };
      } catch {
        return {
          available: false,
          mode: 'subprocess',
          message: 'Python or transcribe.py not found. Install Python 3 and create scripts/transcribe.py',
        };
      }

    case 'node':
      return {
        available: false,
        mode: 'node',
        message: 'whisper-node not implemented yet. Use subprocess mode.',
      };

    case 'cloud':
      return {
        available: !!process.env.OPENAI_API_KEY,
        mode: 'cloud',
        message: process.env.OPENAI_API_KEY
          ? 'OpenAI API key configured'
          : 'OPENAI_API_KEY not set in environment',
      };

    default:
      return {
        available: false,
        mode: WHISPER_MODE,
        message: 'Unknown Whisper mode',
      };
  }
}
