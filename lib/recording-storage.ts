/**
 * Storage & Metadata Management
 * DashkaRecord v2.0.0-alpha - Phase 3
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ProcessingStatus, RecordingMetadata, Screenshot } from '@/types';

// Base upload directory (can be configured via env variable)
const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');

// Directories
const UPLOAD_BASE = path.join(process.cwd(), 'uploads');
const VIDEO_DIR = path.join(UPLOAD_BASE, 'video');
const MP4_DIR = path.join(UPLOAD_BASE, 'mp4');
const TRANSCRIPT_DIR = path.join(UPLOAD_BASE, 'transcripts');
const PDF_DIR = path.join(UPLOAD_BASE, 'pdf');
const METADATA_DIR = path.join(UPLOAD_BASE, 'metadata');
const SYNC_LOGS_DIR = path.join(UPLOAD_BASE, 'sync_logs');
const FRAMES_DIR = path.join(UPLOAD_BASE, 'frames');

export async function ensureDirs(): Promise<void> {
  const dirs = [
    VIDEO_DIR,
    MP4_DIR,
    TRANSCRIPT_DIR,
    PDF_DIR,
    METADATA_DIR,
    SYNC_LOGS_DIR,
    FRAMES_DIR,
  ];

  for (const dir of dirs) {
    await fs.mkdir(dir, { recursive: true });
  }
}

export function createRecordingId(): string {
  const now = new Date();
  return now.toISOString()
    .replace(/[-:]/g, '')
    .replace('T', '_')
    .split('.')[0];
}

export async function saveWebm(
  id: string,
  fileBuffer: Buffer
): Promise<string> {
  await ensureDirs();

  const filename = `${id}.webm`;
  const filepath = path.join(VIDEO_DIR, filename);

  await fs.writeFile(filepath, fileBuffer);

  console.log(`✅ Saved WebM: ${filepath} (${fileBuffer.length} bytes)`);

  return filepath;
}

export async function createMetadata(
  id: string,
  filename: string,
  videoPath: string,
  fileSizeBytes: number
): Promise<RecordingMetadata> {
  await ensureDirs();

  const metadata: RecordingMetadata = {
    id,
    filename,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    videoPath,
    fileSizeBytes,
    status: 'uploaded',
    progress: {
      step: 'uploaded',
      stepNumber: 1,
      totalSteps: 4,
      message: 'Video uploaded successfully'
    },
    translated: false,
    synced: false,
    screenshots: [],
  };

  await writeMetadata(id, metadata);

  console.log(`✅ Created metadata: ${id}`);

  return metadata;
}

export async function readMetadata(id: string): Promise<RecordingMetadata | null> {
  try {
    const metadataPath = path.join(METADATA_DIR, `${id}.json`);
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw error;
  }
}

export async function writeMetadata(
  id: string,
  metadata: RecordingMetadata
): Promise<void> {
  await ensureDirs();

  metadata.updatedAt = new Date().toISOString();

  const metadataPath = path.join(METADATA_DIR, `${id}.json`);
  await fs.writeFile(
    metadataPath,
    JSON.stringify(metadata, null, 2),
    'utf-8'
  );
}

export async function updateMetadata(
  id: string,
  updates: Partial<RecordingMetadata>
): Promise<RecordingMetadata | null> {
  const metadata = await readMetadata(id);
  if (!metadata) {
    return null;
  }

  const updated = { ...metadata, ...updates };
  await writeMetadata(id, updated);

  return updated;
}

export async function listRecordings(): Promise<RecordingMetadata[]> {
  await ensureDirs();

  try {
    const files = await fs.readdir(METADATA_DIR);
    const metadataFiles = files.filter(f => f.endsWith('.json'));

    const recordings: RecordingMetadata[] = [];

    for (const file of metadataFiles) {
      const id = file.replace('.json', '');
      const metadata = await readMetadata(id);
      if (metadata) {
        recordings.push(metadata);
      }
    }

    // Sort by creation date (newest first)
    recordings.sort((a, b) =>
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    return recordings;
  } catch (error) {
    console.error('Error listing recordings:', error);
    return [];
  }
}

export async function deleteRecording(id: string): Promise<boolean> {
  try {
    const metadata = await readMetadata(id);
    if (!metadata) {
      return false;
    }

   
    const filesToDelete = [
      metadata.videoPath,
      metadata.transcriptPath,
      metadata.pdfPath,
      metadata.mp4Path,
      metadata.translationPath,
      path.join(METADATA_DIR, `${id}.json`),
      path.join(SYNC_LOGS_DIR, `${id}_sync.json`),
    ].filter(Boolean) as string[];

    for (const filepath of filesToDelete) {
      try {
        await fs.unlink(filepath);
        console.log(`  ✓ Deleted: ${filepath}`);
      } catch (error) {
        // File might not exist, continue
        console.warn(`  ⚠ Could not delete: ${filepath}`);
      }
    }

    // Delete screenshots directory
    const framesDir = path.join(FRAMES_DIR, id);
    try {
      await fs.rm(framesDir, { recursive: true, force: true });
      console.log(`  ✓ Deleted frames: ${framesDir}`);
    } catch {
      // Directory might not exist
    }

    console.log(`✅ Recording ${id} deleted successfully`);

    return true;
  } catch (error) {
    console.error(`❌ Error deleting recording ${id}:`, error);
    return false;
  }
}

export async function saveScreenshot(
  recordingId: string,
  filename: string,
  fileBuffer: Buffer,
  timestamp: number
): Promise<Screenshot> {
  await ensureDirs();

  const recordingFramesDir = path.join(FRAMES_DIR, recordingId);
  await fs.mkdir(recordingFramesDir, { recursive: true });

  const filepath = path.join(recordingFramesDir, filename);
  await fs.writeFile(filepath, fileBuffer);

  const screenshot: Screenshot = {
    filename,
    timestamp,
    path: filepath,
    capturedAt: new Date().toISOString(),
    sizeBytes: fileBuffer.length,
  };

  // Update metadata
  const metadata = await readMetadata(recordingId);
  if (metadata) {
    metadata.screenshots.push(screenshot);
    await writeMetadata(recordingId, metadata);
  }

  console.log(`✅ Screenshot saved: ${filepath} (${fileBuffer.length} bytes)`);

  return screenshot;
}

export async function getFileStats(filepath: string) {
  try {
    const stats = await fs.stat(filepath);
    return {
      exists: true,
      sizeBytes: stats.size,
      sizeMB: stats.size / (1024 * 1024),
      createdAt: stats.birthtime,
      modifiedAt: stats.mtime,
    };
  } catch {
    return {
      exists: false,
      sizeBytes: 0,
      sizeMB: 0,
    };
  }
}

export function getRecordingPaths(id: string) {
  return {
    video: path.join(VIDEO_DIR, `${id}.webm`),
    mp4: path.join(MP4_DIR, `${id}.mp4`),
    transcript: path.join(TRANSCRIPT_DIR, `${id}.txt`),
    transcriptSegments: path.join(TRANSCRIPT_DIR, `${id}_segments.txt`),
    pdf: path.join(PDF_DIR, `${id}.pdf`),
    metadata: path.join(METADATA_DIR, `${id}.json`),
    framesDir: path.join(FRAMES_DIR, id),
  };
}

export async function updateProcessingStatus(
  id: string,
  status: ProcessingStatus,
  step: string,
  stepNumber: number,
  message?: string
): Promise<void> {
  await updateMetadata(id, {
    status,
    progress: {
      step,
      stepNumber,
      totalSteps: 4,
      message,
    },
  });

  console.log(`📊 ${id}: ${status} - ${step} (${stepNumber}/4)`);
}

export async function recordProcessingError(
  id: string,
  step: string,
  errorMessage: string
): Promise<void> {
  await updateMetadata(id, {
    status: 'error',
    error: {
      step,
      message: errorMessage,
      timestamp: new Date().toISOString(),
    },
  });

  console.error(`❌ ${id}: Error at ${step} - ${errorMessage}`);
}
