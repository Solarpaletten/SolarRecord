// types/recording.processing.ts Используется: Whisper ffmpeg background jobs НЕ UI

export type ProcessingStatus =
  | 'uploaded'
  | 'transcribing'
  | 'transcribed'
  | 'converting_mp4'
  | 'complete'
  | 'error';

export interface ProcessingProgress {
  step: string;
  stepNumber: number;
  totalSteps: number;
  message?: string;
}

export interface ProcessingError {
  step: string;
  message: string;
  timestamp: string;
}

export interface TranscribeSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscribeResult {
  text: string;
  language: string;
  languageConfidence: number;
  segments: TranscribeSegment[];
  durationSeconds: number;
}

// Whisper transcription

export type WhisperMode =
  | 'subprocess'
  | 'node'
  | 'cloud';

export interface WhisperConfig {
  mode: WhisperMode;
  model: string;
  language?: string;
}

// Translation (DeepSeek / LLM)

export interface TranslateRequest {
  recordingId: string;
  targetLanguage: string;
}

export interface TranslateResult {
  translatedText: string;
  translationPath: string;
}
