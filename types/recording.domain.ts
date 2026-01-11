// types/recording.domain.ts  Используется: UI(RecordingCard) Бизнес - логика ERP / Solar Core


export interface Recording {
  id: string;
  filename: string;
  createdAt: string; // ISO
  duration?: number;
  language?: string;
  translated: boolean;
  synced: boolean;
  solar_core_id?: string;
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
