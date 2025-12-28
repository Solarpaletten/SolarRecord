#!/usr/bin/env python3
"""
Whisper Transcription Script for DashkaRecord
Phase 3: Subprocess mode

Usage:
    python3 transcribe.py --input video.webm --output result.json --model base [--language en]

Output JSON format:
{
  "text": "transcribed text...",
  "language": "en",
  "language_probability": 0.95,
  "duration": 123.45,
  "segments": [
    {"start": 0.0, "end": 5.0, "text": "Hello world"}
  ]
}
"""

import whisper
import argparse
import json
import sys
import os

def transcribe_audio(input_path, model_name='base', language=None):
    """
    Transcribe audio/video file using Whisper
    
    Args:
        input_path: Path to audio/video file
        model_name: Whisper model size (tiny, base, small, medium, large)
        language: Optional language code (en, ru, lt, etc.)
    
    Returns:
        dict: Transcription result
    """
    try:
        print(f"Loading Whisper model: {model_name}", file=sys.stderr)
        model = whisper.load_model(model_name, device="cpu")
        
        print(f"Transcribing: {input_path}", file=sys.stderr)
        
        # Transcribe with options
        options = {
            "fp16": False,  # Force CPU mode
            "verbose": False,
        }
        
        if language:
            options["language"] = language
        
        result = model.transcribe(input_path, **options)
        
        # Extract segments
        segments = []
        for segment in result.get("segments", []):
            segments.append({
                "start": segment["start"],
                "end": segment["end"],
                "text": segment["text"].strip()
            })
        
        # Build output
        output = {
            "text": result["text"].strip(),
            "language": result.get("language", "unknown"),
            "language_probability": float(result.get("language_probability", 0.9)),
            "duration": segments[-1]["end"] if segments else 0.0,
            "segments": segments
        }
        
        print(f"Transcription complete: {output['language']}", file=sys.stderr)
        print(f"Duration: {output['duration']:.2f}s, Segments: {len(segments)}", file=sys.stderr)
        
        return output
        
    except Exception as e:
        print(f"Error: {str(e)}", file=sys.stderr)
        raise

def main():
    parser = argparse.ArgumentParser(description='Transcribe audio/video using Whisper')
    parser.add_argument('--input', required=True, help='Input audio/video file')
    parser.add_argument('--output', required=True, help='Output JSON file')
    parser.add_argument('--model', default='base', help='Whisper model size (tiny, base, small, medium, large)')
    parser.add_argument('--language', help='Language code (en, ru, lt, etc.)')
    
    args = parser.parse_args()
    
    # Check input file exists
    if not os.path.exists(args.input):
        print(f"Error: Input file not found: {args.input}", file=sys.stderr)
        sys.exit(1)
    
    try:
        # Transcribe
        result = transcribe_audio(args.input, args.model, args.language)
        
        # Write output JSON
        with open(args.output, 'w', encoding='utf-8') as f:
            json.dump(result, f, ensure_ascii=False, indent=2)
        
        print(f"Results written to: {args.output}", file=sys.stderr)
        sys.exit(0)
        
    except Exception as e:
        print(f"Fatal error: {str(e)}", file=sys.stderr)
        sys.exit(1)

if __name__ == '__main__':
    main()
