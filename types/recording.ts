

export interface RecordingMetadata {
  id: string;
  filename: string;
  createdAt: string;
  updatedAt: string;
  
  // Paths
  videoPath: string;
  transcriptPath?: string;
  mp4Path?: string;
  translationPath?: string;
  
  // Processing status
  status: ProcessingStatus;
  progress: ProcessingProgress;
  
  // Transcription
  language?: string;
  languageConfidence?: number;
  segmentsCount?: number;
  
  // File info
  fileSizeBytes?: number;
  durationSeconds?: number;
  
  // Translation
  translated: boolean;
  translationLanguage?: string;
  
  // Sync
  synced: boolean;
  syncStatus?: SyncStatus;
  solarCoreId?: string;
  syncedAt?: string;
  
  // Screenshots
  screenshots: Screenshot[];
  
  // Errors
  error?: ProcessingError;
}

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

export interface Screenshot {
  filename: string;
  timestamp: number;
  path: string;
  capturedAt: string;
  sizeBytes: number;
}

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface RecorderSyncRequest {
  id: string;
  language: string;
  video: string;
  transcript: string;
  translation?: string;
  createdAt: string;
  duration?: number;
  fileSize?: number;
  segmentsCount?: number;
}

export interface RecorderSyncResponse {
  status: SyncStatus;
  recordingId: string;
  timestamp: string;
  solarCoreId?: string;
  message?: string;
  error?: string;
}

export interface TranscribeResult {
  text: string;
  language: string;
  languageConfidence: number;
  segments: TranscribeSegment[];
  durationSeconds: number;
}

export interface TranscribeSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranslateRequest {
  recordingId: string;
  targetLanguage: string;
}

export interface TranslateResult {
  translatedText: string;
  translationPath: string;
}

export type WhisperMode = 'subprocess' | 'node' | 'cloud';

export interface WhisperConfig {
  mode: WhisperMode;
  model: string;
  language?: string;
}

export interface UploadResponse {
  status: 'success' | 'error';
  recording_id: string;
  message: string;
  video_url?: string;
}

export interface ApiError {
  error: string;
  details?: string;
  timestamp: string;
}

export interface Recording {
  id: string;
  filename: string;
  createdAt: Date;
  duration?: number;
  transcription?: string;
  translation?: string;
  status: RecordingStatus;
}

export type RecordingStatus =
  | 'uploading'
  | 'processing'
  | 'transcribing'
  | 'completed'
  | 'error';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}