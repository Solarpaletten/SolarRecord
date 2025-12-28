import whisper
import os
import torch
from typing import Tuple

# Configuration from environment
MODEL = os.getenv("MODEL", "base")  # Changed from WHISPER_MODEL to MODEL
FORCE_CPU = os.getenv("FORCE_CPU", "true").lower() == "true"

# Model singleton
model = None

def get_model():
    """Lazy load Whisper model with explicit CPU mode"""
    global model
    if model is None:
        # Force CPU mode for Docker compatibility (no CUDA dependencies)
        device = "cpu" if FORCE_CPU else ("cuda" if torch.cuda.is_available() else "cpu")
        
        print(f"🎙 Loading Whisper model: {MODEL} on device: {device}")
        
        try:
            model = whisper.load_model(MODEL, device=device)
            print(f"✅ Whisper model '{MODEL}' loaded successfully on {device}")
        except Exception as e:
            print(f"❌ Failed to load Whisper model: {e}")
            raise
    
    return model

def transcribe_audio(video_path: str, language: str = None) -> Tuple[str, str]:
    """
    Transcribe audio from video file using Whisper
    
    Args:
        video_path: Path to video file
        language: Optional language code (e.g., 'lt', 'ru', 'en')
                 If None, auto-detect
    
    Returns:
        Tuple of (transcript_path, detected_language)
    """
    try:
        model = get_model()
        
        print(f"🎬 Transcribing: {video_path}")
        
        # Transcribe with language detection
        if language:
            result = model.transcribe(
                video_path,
                language=language,
                fp16=False,  # Disable FP16 for CPU compatibility
                verbose=False
            )
            detected_language = language
        else:
            # Auto-detect language
            result = model.transcribe(
                video_path,
                fp16=False,  # Critical for CPU mode
                verbose=False
            )
            detected_language = result.get("language", "unknown")
        
        # Generate transcript path
        transcript_path = video_path.replace("video", "transcripts").replace(".webm", ".txt")
        
        # Save transcript with metadata
        with open(transcript_path, "w", encoding="utf-8") as f:
            f.write(f"[Language: {detected_language}]\n")
            f.write(f"[Confidence: {result.get('language_probability', 0):.2%}]\n\n")
            f.write(result["text"])
        
        # Also save segments with timestamps
        segments_path = transcript_path.replace(".txt", "_segments.txt")
        with open(segments_path, "w", encoding="utf-8") as f:
            for segment in result.get("segments", []):
                start = segment["start"]
                end = segment["end"]
                text = segment["text"]
                f.write(f"[{format_timestamp(start)} --> {format_timestamp(end)}] {text}\n")
        
        print(f"✅ Transcription completed: {detected_language}")
        return transcript_path, detected_language
        
    except Exception as e:
        print(f"❌ Transcription error: {str(e)}")
        # Create error transcript
        error_path = video_path.replace("video", "transcripts").replace(".webm", ".txt")
        with open(error_path, "w", encoding="utf-8") as f:
            f.write(f"[ERROR] Transcription failed: {str(e)}")
        return error_path, "error"

def format_timestamp(seconds: float) -> str:
    """Format seconds to HH:MM:SS"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def get_supported_languages() -> dict:
    """Get list of supported languages"""
    return {
        "en": "English",
        "ru": "Russian",
        "lt": "Lithuanian",
        "de": "German",
        "fr": "French",
        "es": "Spanish",
        "it": "Italian",
        "pl": "Polish",
        "uk": "Ukrainian",
        "auto": "Auto-detect"
    }