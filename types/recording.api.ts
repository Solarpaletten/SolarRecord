// types/recording.api.ts Используется: /api/ * fetch / POST Solar Core

export type SyncStatus = 'pending' | 'syncing' | 'synced' | 'failed';

export interface RecorderSyncRequest {
  id: string;
  language: string;
  video: string;
  transcript: string;
  translation?: string;
  pdf?: string;
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
