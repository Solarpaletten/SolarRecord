/**
 * FFmpeg Video Conversion
 * DashkaRecord v2.0.0-alpha - Phase 3
 * 
 * Convert WebM recordings to MP4 for Telegram/WhatsApp compatibility
 */

import ffmpeg from 'fluent-ffmpeg';
import { promises as fs } from 'fs';
import path from 'path';
import { getRecordingPaths } from './storage';

// Try to use @ffmpeg-installer if available
try {
  const ffmpegInstaller = require('@ffmpeg-installer/ffmpeg');
  ffmpeg.setFfmpegPath(ffmpegInstaller.path);
} catch {
  // Use system ffmpeg
  console.warn('⚠️ @ffmpeg-installer not found, using system ffmpeg');
}

/**
 * Convert WebM to MP4
 */
export async function webmToMp4(recordingId: string): Promise<string | null> {
  const paths = getRecordingPaths(recordingId);
  const srcPath = paths.video;
  const dstPath = paths.mp4;

  try {
    // Check if source exists
    await fs.access(srcPath);

    // If MP4 already exists, return it
    try {
      await fs.access(dstPath);
      console.log(`✅ MP4 already exists: ${dstPath}`);
      
      const stats = await fs.stat(dstPath);
      const sizeMB = stats.size / (1024 * 1024);
      console.log(`   File size: ${sizeMB.toFixed(2)} MB`);
      
      return dstPath;
    } catch {
      // MP4 doesn't exist, continue with conversion
    }

    // Ensure output directory exists
    const mp4Dir = path.dirname(dstPath);
    await fs.mkdir(mp4Dir, { recursive: true });

    console.log(`🔄 Converting: ${srcPath} → ${dstPath}`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(srcPath)
        // Video settings
        .videoCodec('libx264')
        .videoBitrate('2500k')
        .outputOptions([
          '-preset veryfast',
          '-crf 23',
        ])
        // Audio settings
        .audioCodec('aac')
        .audioBitrate('192k')
        .audioChannels(2)
        .audioFrequency(44100)
        // Additional options
        .outputOptions([
          '-movflags +faststart',  // Enable streaming
        ])
        // Output
        .output(dstPath)
        // Events
        .on('start', (commandLine) => {
          console.log('FFmpeg command:', commandLine);
        })
        .on('progress', (progress) => {
          if (progress.percent) {
            console.log(`   Progress: ${progress.percent.toFixed(1)}%`);
          }
        })
        .on('end', async () => {
          try {
            const stats = await fs.stat(dstPath);
            const sizeMB = stats.size / (1024 * 1024);
            
            console.log(`✅ Conversion complete: ${dstPath}`);
            console.log(`   File size: ${sizeMB.toFixed(2)} MB`);
            
            resolve();
          } catch (error) {
            reject(error);
          }
        })
        .on('error', (error) => {
          console.error(`❌ FFmpeg error: ${error.message}`);
          reject(error);
        })
        .run();
    });

    return dstPath;
  } catch (error) {
    console.error('❌ Conversion error:', error);
    
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      throw new Error(
        'Source file not found. Please check if the WebM file exists.'
      );
    }
    
    return null;
  }
}

/**
 * Get video information using ffprobe
 */
export async function getVideoInfo(recordingId: string): Promise<{
  webmExists: boolean;
  mp4Exists: boolean;
  webmSizeMB?: number;
  mp4SizeMB?: number;
  webmHasAudio?: boolean;
  mp4HasAudio?: boolean;
  durationSeconds?: number;
}> {
  const paths = getRecordingPaths(recordingId);
  
  const info: any = {
    webmExists: false,
    mp4Exists: false,
  };

  // Check WebM
  try {
    const webmStats = await fs.stat(paths.video);
    info.webmExists = true;
    info.webmSizeMB = webmStats.size / (1024 * 1024);
    
    // Check audio
    const webmAudioInfo = await probeAudioTrack(paths.video);
    info.webmHasAudio = webmAudioInfo.hasAudio;
    info.durationSeconds = webmAudioInfo.duration;
  } catch {
    // WebM doesn't exist
  }

  // Check MP4
  try {
    const mp4Stats = await fs.stat(paths.mp4);
    info.mp4Exists = true;
    info.mp4SizeMB = mp4Stats.size / (1024 * 1024);
    
    // Check audio
    const mp4AudioInfo = await probeAudioTrack(paths.mp4);
    info.mp4HasAudio = mp4AudioInfo.hasAudio;
  } catch {
    // MP4 doesn't exist
  }

  return info;
}

/**
 * Probe audio track in video file
 */
async function probeAudioTrack(videoPath: string): Promise<{
  hasAudio: boolean;
  duration?: number;
}> {
  return new Promise((resolve) => {
    ffmpeg.ffprobe(videoPath, (error, metadata) => {
      if (error) {
        resolve({ hasAudio: false });
        return;
      }

      const audioStream = metadata.streams?.find(
        (stream) => stream.codec_type === 'audio'
      );

      resolve({
        hasAudio: !!audioStream,
        duration: metadata.format?.duration,
      });
    });
  });
}

/**
 * Check FFmpeg availability
 */
export async function checkFfmpegAvailability(): Promise<{
  available: boolean;
  version?: string;
  message: string;
}> {
  return new Promise((resolve) => {
    ffmpeg.getAvailableFormats((error, formats) => {
      if (error) {
        resolve({
          available: false,
          message: 'FFmpeg not found. Install: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Linux)',
        });
        return;
      }

      // Try to get version
      ffmpeg()
        .on('error', () => {
          resolve({
            available: true,
            message: 'FFmpeg available',
          });
        })
        .on('start', (commandLine) => {
          // Extract version from command line
          const versionMatch = commandLine.match(/ffmpeg version ([\d.]+)/);
          resolve({
            available: true,
            version: versionMatch ? versionMatch[1] : 'unknown',
            message: 'FFmpeg available',
          });
        })
        .run();
    });
  });
}

/**
 * Cleanup old converted files (older than specified days)
 */
export async function cleanupOldFiles(days: number = 7): Promise<number> {
  const mp4Dir = path.join(process.cwd(), 'uploads/mp4');
  const videoDir = path.join(process.cwd(), 'uploads/video');
  
  const cutoffTime = Date.now() - (days * 24 * 60 * 60 * 1000);
  let deletedCount = 0;

  try {
    // Clean MP4 files
    const mp4Files = await fs.readdir(mp4Dir);
    for (const file of mp4Files) {
      if (file.endsWith('.mp4')) {
        const filePath = path.join(mp4Dir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old MP4: ${file}`);
        }
      }
    }

    // Clean WebM files
    const webmFiles = await fs.readdir(videoDir);
    for (const file of webmFiles) {
      if (file.endsWith('.webm')) {
        const filePath = path.join(videoDir, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtimeMs < cutoffTime) {
          await fs.unlink(filePath);
          deletedCount++;
          console.log(`🗑️ Deleted old WebM: ${file}`);
        }
      }
    }

    console.log(`✅ Cleanup complete. Deleted ${deletedCount} files.`);
    return deletedCount;
  } catch (error) {
    console.error('❌ Cleanup error:', error);
    return deletedCount;
  }
}
