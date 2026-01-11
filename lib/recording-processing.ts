
import { webmToMp4 } from '@/lib/recording-convert';
import {
  readMetadata,
  recordProcessingError,
  updateMetadata,
  updateProcessingStatus
} from '@/lib/recording-storage';
import { transcribe } from '@/lib/recording-transcribe';

/**
 * Process recording in background
 * Called asynchronously after upload
 */
export async function processRecording(recordingId: string): Promise<void> {
  console.log(`\n🎬 Starting background processing: ${recordingId}`);
  console.log('='.repeat(60));

  try {
    const metadata = await readMetadata(recordingId);
    if (!metadata) {
      throw new Error('Recording metadata not found');
    }

    // STEP 1: Transcribe
    await updateProcessingStatus(
      recordingId,
      'transcribing',
      'Transcribing audio with Whisper',
      1
    );

    let transcriptPath: string;
    let language: string;
    let confidence: number;

    try {
      const transcribeResult = await transcribe(
        recordingId,
        metadata.videoPath
      );

      transcriptPath = transcribeResult.textPath;
      language = transcribeResult.language;
      confidence = transcribeResult.confidence;

      await updateMetadata(recordingId, {
        transcriptPath,
        language,
        languageConfidence: confidence,
        status: 'transcribed',
      });

      console.log(`✅ Step 1/4 complete: Transcription (${language})`);
    } catch (error) {
      await recordProcessingError(
        recordingId,
        'transcribe',
        (error as Error).message
      );
      throw error;
    }

    // STEP 2: Convert to MP4
    await updateProcessingStatus(
      recordingId,
      'converting_mp4',
      'Converting to MP4 for compatibility',
      3
    );

    let mp4Path: string | null = null;

    try {
      mp4Path = await webmToMp4(recordingId);

      if (mp4Path) {
        await updateMetadata(recordingId, {
          mp4Path,
        });
        console.log(`✅ Step 3/4 complete: MP4 conversion`);
      } else {
        console.warn(`⚠️ MP4 conversion returned null, continuing`);
      }
    } catch (error) {
      await recordProcessingError(
        recordingId,
        'mp4_conversion',
        (error as Error).message
      );
      // MP4 is non-critical, continue
      console.warn(`⚠️ MP4 conversion failed, continuing: ${(error as Error).message}`);
    }

    // STEP 3: Mark as complete
    await updateProcessingStatus(
      recordingId,
      'complete',
      'Processing complete',
      4,
      'All steps completed successfully'
    );

    console.log('='.repeat(60));
    console.log(`🎉 Background processing complete: ${recordingId}\n`);
  } catch (error) {
    console.error('='.repeat(60));
    console.error(`❌ Background processing failed: ${recordingId}`);
    console.error(`Error: ${(error as Error).message}\n`);

    // Ensure error is recorded
    try {
      const currentMetadata = await readMetadata(recordingId);
      if (currentMetadata && currentMetadata.status !== 'error') {
        await recordProcessingError(
          recordingId,
          'unknown',
          (error as Error).message
        );
      }
    } catch {
      // Ignore metadata errors
    }
  }
}

/**
 * Get processing status for recording
 */
export async function getProcessingStatus(recordingId: string): Promise<{
  status: string;
  progress: number;
  message?: string;
  error?: string;
} | null> {
  const metadata = await readMetadata(recordingId);
  if (!metadata) {
    return null;
  }

  return {
    status: metadata.status,
    progress: metadata.progress?.stepNumber || 0,
    message: metadata.progress?.message,
    error: metadata.error?.message,
  };
}

/**
 * Retry failed processing
 */
export async function retryProcessing(recordingId: string): Promise<boolean> {
  try {
    const metadata = await readMetadata(recordingId);
    if (!metadata) {
      return false;
    }

    // Reset error state
    await updateMetadata(recordingId, {
      status: 'uploaded',
      error: undefined,
      progress: {
        step: 'uploaded',
        stepNumber: 1,
        totalSteps: 4,
        message: 'Retrying processing',
      },
    });

    // Start processing again
    processRecording(recordingId).catch((error) => {
      console.error(`Retry failed for ${recordingId}:`, error);
    });

    return true;
  } catch {
    return false;
  }
}
