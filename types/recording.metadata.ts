// types/recording.metadata.ts
import { ProcessingStatus, ProcessingProgress, ProcessingError } from './recording.processing';

export interface Screenshot {
  filename: string;
  timestamp: number;
  path: string;
  capturedAt: string;
  sizeBytes: number;
}

export interface RecordingMetadata {
  id: string;
  filename: string;

  createdAt: string;
  updatedAt: string;

  videoPath: string;
  mp4Path?: string;
  transcriptPath?: string;
  pdfPath?: string;
  translationPath?: string;

  fileSizeBytes?: number;
  durationSeconds?: number;

  status: ProcessingStatus;
  progress: ProcessingProgress;

  language?: string;
  languageConfidence?: number;
  segmentsCount?: number;

  translated: boolean;
  translationLanguage?: string;

  synced: boolean;
  syncStatus?: 'pending' | 'syncing' | 'synced' | 'failed';
  solarCoreId?: string;
  syncedAt?: string;

  screenshots: Screenshot[];

  error?: ProcessingError;
}
