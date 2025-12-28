"""
FFmpeg converter for WebM to MP4
Converts screen recordings for Telegram compatibility
v1.2.2-stable - Fixed audio mapping for Chrome WebM
"""
import os
import subprocess
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

# Directories
UPLOAD_DIR = Path("uploads")
VIDEO_DIR = UPLOAD_DIR / "video"
MP4_DIR = UPLOAD_DIR / "mp4"

# Create directories if they don't exist
MP4_DIR.mkdir(parents=True, exist_ok=True)


def webm_to_mp4(recording_id: str) -> str | None:
    """
    Convert WebM recording to MP4 format using FFmpeg
    
    Args:
        recording_id: Recording identifier (without extension)
        
    Returns:
        Path to converted MP4 file, or None if conversion failed
    """
    src = VIDEO_DIR / f"{recording_id}.webm"
    dst = MP4_DIR / f"{recording_id}.mp4"
    
    # Check if source exists
    if not src.exists():
        logger.error(f"Source WebM file not found: {src}")
        return None
    
    # If MP4 already exists, return it
    if dst.exists():
        logger.info(f"MP4 already exists: {dst}")
        return str(dst)
    
    try:
        # ИСПРАВЛЕННАЯ команда FFmpeg с правильным маппингом аудио
        cmd = [
            "ffmpeg",
            "-y",  # Overwrite output file if exists
            "-i", str(src),  # Input file
            "-map", "0:v:0",  # Map first video stream explicitly
            "-map", "0:a?",   # Map audio if exists (? = don't fail if missing)
            "-c:v", "libx264",  # Video codec: H.264
            "-preset", "veryfast",  # Encoding speed
            "-crf", "23",  # Quality (18-28, lower = better)
            "-c:a", "aac",  # Audio codec: AAC
            "-b:a", "192k",  # Audio bitrate (higher for better quality)
            "-ac", "2",  # Stereo audio
            "-ar", "44100",  # Sample rate
            "-movflags", "+faststart",  # Enable streaming
            str(dst)
        ]
        
        logger.info(f"Starting conversion: {src} -> {dst}")
        
        # Run FFmpeg
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300  # 5 minutes timeout
        )
        
        if result.returncode == 0:
            file_size = dst.stat().st_size / (1024*1024)
            
            # Проверка наличия аудио в выходном файле
            audio_check = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "a:0", 
                 "-show_entries", "stream=codec_name", "-of", "default=noprint_wrappers=1:nokey=1", 
                 str(dst)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10
            )
            
            has_audio = bool(audio_check.stdout.strip())
            audio_status = "✅ Audio detected" if has_audio else "❌ No audio"
            
            logger.info(f"✅ Conversion successful: {dst}")
            logger.info(f"   File size: {file_size:.2f} MB")
            logger.info(f"   {audio_status}")
            
            return str(dst)
        else:
            logger.error(f"❌ FFmpeg error:\n{result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Conversion timeout (>5 minutes)")
        return None
        
    except FileNotFoundError:
        logger.error("❌ FFmpeg not found. Install: brew install ffmpeg (macOS) or sudo apt install ffmpeg (Linux)")
        return None
        
    except Exception as e:
        logger.error(f"❌ Conversion error: {str(e)}")
        return None


def get_video_info(recording_id: str) -> dict:
    """
    Get information about video files (WebM and MP4)
    
    Args:
        recording_id: Recording identifier
        
    Returns:
        Dictionary with file information
    """
    webm_path = VIDEO_DIR / f"{recording_id}.webm"
    mp4_path = MP4_DIR / f"{recording_id}.mp4"
    
    info = {
        "recording_id": recording_id,
        "webm_exists": webm_path.exists(),
        "mp4_exists": mp4_path.exists(),
    }
    
    if info["webm_exists"]:
        info["webm_size_mb"] = webm_path.stat().st_size / (1024 * 1024)
        
        # Check if WebM has audio
        try:
            audio_check = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "a:0",
                 "-show_entries", "stream=codec_name", "-of", "default=noprint_wrappers=1:nokey=1",
                 str(webm_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10
            )
            info["webm_has_audio"] = bool(audio_check.stdout.strip())
        except:
            info["webm_has_audio"] = None
        
    if info["mp4_exists"]:
        info["mp4_size_mb"] = mp4_path.stat().st_size / (1024 * 1024)
        
        # Check if MP4 has audio
        try:
            audio_check = subprocess.run(
                ["ffprobe", "-v", "error", "-select_streams", "a:0",
                 "-show_entries", "stream=codec_name", "-of", "default=noprint_wrappers=1:nokey=1",
                 str(mp4_path)],
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10
            )
            info["mp4_has_audio"] = bool(audio_check.stdout.strip())
        except:
            info["mp4_has_audio"] = None
    
    return info


def cleanup_old_files(days: int = 7):
    """
    Delete video files older than specified days
    
    Args:
        days: Number of days to keep files
    """
    import time
    
    current_time = time.time()
    cutoff_time = current_time - (days * 86400)
    
    deleted_count = 0
    
    # Clean WebM files
    for file in VIDEO_DIR.glob("*.webm"):
        if file.stat().st_mtime < cutoff_time:
            file.unlink()
            deleted_count += 1
            logger.info(f"Deleted old WebM: {file.name}")
    
    # Clean MP4 files
    for file in MP4_DIR.glob("*.mp4"):
        if file.stat().st_mtime < cutoff_time:
            file.unlink()
            deleted_count += 1
            logger.info(f"Deleted old MP4: {file.name}")
    
    logger.info(f"Cleanup complete. Deleted {deleted_count} files.")
    return deleted_count


def merge_tracks_and_convert(recording_id: str, video_path: str, audio_path: str) -> str | None:
    """
    Merge video (with tab audio) and microphone into MP4 with 2 audio tracks
    
    Sprint #3: Dual Track Recording
    
    Args:
        recording_id: Recording identifier
        video_path: Path to video WebM (screen + tab audio)
        audio_path: Path to audio WebM (microphone)
        
    Returns:
        Path to merged MP4 file with 2 audio tracks, or None if failed
    """
    output_path = MP4_DIR / f"{recording_id}.mp4"
    
    if output_path.exists():
        logger.info(f"MP4 already exists: {output_path}")
        return str(output_path)
    
    try:
        # FFmpeg command for dual track MP4
        cmd = [
            "ffmpeg",
            "-y",
            "-i", str(video_path),  # Input 1: video + tab audio
            "-i", str(audio_path),  # Input 2: microphone
            "-map", "0:v:0",        # Video from input 1
            "-map", "0:a?",         # Tab audio from input 1 (track 1)
            "-map", "1:a:0",        # Microphone from input 2 (track 2)
            "-c:v", "libx264",      # Video codec
            "-preset", "veryfast",
            "-crf", "23",
            "-c:a", "aac",          # Audio codec for both tracks
            "-b:a", "256k",
            "-b:a:0", "192k",       # Bitrate for track 1 (tab audio)
            "-b:a:1", "128k",       # Bitrate for track 2 (microphone)
            "-ar", "48000",
            "-ac", "2",
            "-af", "loudnorm,highpass=f=80,lowpass=f=12000,volume=2dB",
            "-metadata:s:a:0", "title=Tab Audio",
            "-metadata:s:a:1", "title=Microphone",
            "-movflags", "+faststart",
            str(output_path)
        ]
        
        logger.info(f"🎚️ Merging dual tracks: {recording_id}")
        logger.info(f"   Video + Tab: {video_path}")
        logger.info(f"   Microphone:  {audio_path}")
        
        result = subprocess.run(
            cmd,
            stdout=subprocess.PIPE,
            stderr=subprocess.PIPE,
            text=True,
            timeout=300
        )
        
        if result.returncode == 0:
            file_size = output_path.stat().st_size / (1024*1024)
            
            # Check audio tracks
            probe_cmd = [
                "ffprobe", "-v", "error",
                "-select_streams", "a",
                "-show_entries", "stream=index,codec_name",
                "-of", "default=noprint_wrappers=1",
                str(output_path)
            ]
            
            probe_result = subprocess.run(
                probe_cmd,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                timeout=10
            )
            
            audio_tracks = probe_result.stdout.count("codec_name=aac")
            
            logger.info(f"✅ Dual track merge successful: {output_path}")
            logger.info(f"   File size: {file_size:.2f} MB")
            logger.info(f"   Audio tracks: {audio_tracks}")
            logger.info(f"   Track 1: Tab Audio (192k)")
            logger.info(f"   Track 2: Microphone (128k)")
            
            return str(output_path)
        else:
            logger.error(f"❌ FFmpeg merge error:\n{result.stderr}")
            return None
            
    except subprocess.TimeoutExpired:
        logger.error("❌ Merge timeout (>5 minutes)")
        return None
    except FileNotFoundError:
        logger.error("❌ FFmpeg not found")
        return None
    except Exception as e:
        logger.error(f"❌ Merge error: {str(e)}")
        return None