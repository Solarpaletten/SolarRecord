/**
 * Solar Core ERP Integration Client
 * DashkaRecord v2.0.0-alpha - Phase 3
 */

import { RecorderSyncRequest, RecorderSyncResponse, SyncStatus } from './types';
import { readMetadata, updateMetadata } from './storage';
import { promises as fs } from 'fs';
import path from 'path';

const SOLAR_CORE_URL = process.env.SOLAR_CORE_URL || 'http://localhost:8010';
const SOLAR_CORE_API_KEY = process.env.SOLAR_CORE_API_KEY || '';
const MAX_RETRIES = 3;

/**
 * Sync recording to Solar Core ERP
 */
export async function syncToSolarCore(
  recordingId: string,
  recipient?: string
): Promise<RecorderSyncResponse> {
  console.log(`🔗 Syncing ${recordingId} to Solar Core`);

  const metadata = await readMetadata(recordingId);
  if (!metadata) {
    throw new Error('Recording not found');
  }

  // Build sync request
  const syncRequest: RecorderSyncRequest = {
    id: metadata.id,
    language: metadata.language || 'unknown',
    video: metadata.videoPath,
    transcript: metadata.transcriptPath || '',
    translation: metadata.translationPath,
    pdf: metadata.pdfPath || '',
    createdAt: metadata.createdAt,
    duration: metadata.durationSeconds,
    fileSize: metadata.fileSizeBytes,
    segmentsCount: metadata.segmentsCount,
  };

  // Check Solar Core health
  const isHealthy = await checkSolarCoreHealth();
  if (!isHealthy) {
    const errorResponse: RecorderSyncResponse = {
      status: 'failed',
      recordingId,
      timestamp: new Date().toISOString(),
      error: 'Solar Core is not reachable',
    };

    await logSync(recordingId, errorResponse);

    // Update metadata
    await updateMetadata(recordingId, {
      syncStatus: 'failed',
    });

    return errorResponse;
  }

  // Attempt sync with retries
  let lastError: Error | null = null;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${SOLAR_CORE_URL}/api/v1/import/record`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(SOLAR_CORE_API_KEY && {
            'Authorization': `Bearer ${SOLAR_CORE_API_KEY}`,
          }),
        },
        body: JSON.stringify({
          source: 'solar_recorder',
          version: '2.0.0-alpha',
          type: 'recording',
          data: syncRequest,
          metadata: {
            recipient,
            attempt: attempt + 1,
          },
          timestamp: new Date().toISOString(),
        }),
      });

      if (response.ok) {
        const result = await response.json();
        const solarCoreId = result.id || result.solar_core_id;

        const successResponse: RecorderSyncResponse = {
          status: 'synced',
          recordingId,
          timestamp: new Date().toISOString(),
          solarCoreId,
          message: 'Successfully synced to Solar Core ERP',
        };

        await logSync(recordingId, successResponse);

        // Update metadata
        await updateMetadata(recordingId, {
          synced: true,
          syncStatus: 'synced',
          solarCoreId,
          syncedAt: new Date().toISOString(),
        });

        console.log(`✅ Sync successful: ${solarCoreId}`);

        return successResponse;
      }

      const errorText = await response.text();
      lastError = new Error(`HTTP ${response.status}: ${errorText}`);
      console.warn(`⚠️ Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastError.message}`);
    } catch (error) {
      lastError = error as Error;
      console.warn(`⚠️ Attempt ${attempt + 1}/${MAX_RETRIES} failed: ${lastError.message}`);
    }
  }

  // All retries failed
  const errorResponse: RecorderSyncResponse = {
    status: 'failed',
    recordingId,
    timestamp: new Date().toISOString(),
    error: `Failed after ${MAX_RETRIES} attempts: ${lastError?.message}`,
  };

  await logSync(recordingId, errorResponse);

  // Update metadata
  await updateMetadata(recordingId, {
    syncStatus: 'failed',
  });

  return errorResponse;
}

/**
 * Check Solar Core health
 */
export async function checkSolarCoreHealth(): Promise<boolean> {
  try {
    const response = await fetch(`${SOLAR_CORE_URL}/health`, {
      method: 'GET',
      signal: AbortSignal.timeout(5000),
    });

    return response.ok;
  } catch {
    return false;
  }
}

/**
 * Log sync operation
 */
async function logSync(
  recordingId: string,
  response: RecorderSyncResponse
): Promise<void> {
  try {
    const logDir = path.join(process.cwd(), 'uploads/sync_logs');
    await fs.mkdir(logDir, { recursive: true });

    const logFile = path.join(logDir, `${recordingId}_sync.json`);

    // Read existing logs
    let logs: any[] = [];
    try {
      const content = await fs.readFile(logFile, 'utf-8');
      logs = JSON.parse(content);
    } catch {
      // File doesn't exist, start fresh
    }

    // Append new log
    logs.push({
      ...response,
      timestamp: new Date().toISOString(),
    });

    // Write logs
    await fs.writeFile(logFile, JSON.stringify(logs, null, 2), 'utf-8');
  } catch (error) {
    console.error('❌ Failed to write sync log:', error);
  }
}

/**
 * Get sync logs for recording
 */
export async function getSyncLogs(recordingId: string): Promise<any[]> {
  try {
    const logFile = path.join(
      process.cwd(),
      'uploads/sync_logs',
      `${recordingId}_sync.json`
    );

    const content = await fs.readFile(logFile, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

/**
 * Check if Solar Core is configured
 */
export function isSolarCoreConfigured(): boolean {
  return !!SOLAR_CORE_URL;
}
