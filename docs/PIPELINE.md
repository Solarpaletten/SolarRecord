# Processing Pipeline — SolarRecord v2.0.0

## Overview
```
┌─────────┐    ┌─────────┐    ┌─────────────┐    ┌─────────┐    ┌─────────┐
│ UPLOAD  │ → │ STORAGE │ → │ TRANSCRIBE  │ → │ CONVERT │ → │ COMPLETE│
└─────────┘    └─────────┘    └─────────────┘    └─────────┘    └─────────┘
    ↓              ↓               ↓                 ↓              ↓
  WebM          metadata        Whisper          FFmpeg         UI ready
  blob          .json           .txt             .mp4
```

## Step-by-Step

### 1. Upload (Instant)

**File:** `app/api/recording/upload/route.ts`
```
Input:  WebM blob from browser
Output: Recording ID + metadata file
```

Actions:
- Save WebM to `uploads/video/{id}.webm`
- Create `uploads/metadata/{id}.json`
- Return 200 immediately
- Trigger background processing

### 2. Transcription (5-60 seconds)

**File:** `lib/recording-transcribe.ts`
```
Input:  WebM file path
Output: Transcript text + segments
```

Actions:
- Call `venv/bin/python3 scripts/transcribe.py`
- Whisper processes audio
- Detect language automatically
- Save to `uploads/transcripts/{id}.txt`
- Save segments to `uploads/transcripts/{id}_segments.txt`

### 3. MP4 Conversion (5-30 seconds)

**File:** `lib/recording-convert.ts`
```
Input:  WebM file path
Output: MP4 file
```

Actions:
- Call FFmpeg with H.264 encoding
- Save to `uploads/mp4/{id}.mp4`
- Optimized for web streaming (`-movflags +faststart`)

### 4. Status Update

**File:** `lib/recording-processing.ts`
```
Input:  Processing results
Output: Updated metadata
```

Actions:
- Update `uploads/metadata/{id}.json`
- Set `status: "complete"`
- Add `transcript_path`, `mp4_path`
- Record detected `language`

## File Locations
```
uploads/
├── video/          # Original WebM recordings
│   └── {id}.webm
├── metadata/       # JSON metadata files
│   └── {id}.json
├── transcripts/    # Text transcripts
│   ├── {id}.txt
│   └── {id}_segments.txt
├── mp4/            # Converted MP4 files
│   └── {id}.mp4
├── pdf/            # Generated PDFs
│   └── {id}.pdf
└── sync_logs/      # Sync history
    └── {id}_sync.json
```

## Status Flow
```
uploading → transcribing → converting_mp4 → complete
                ↓
              error (if any step fails)
```

## Key Files

| File | Responsibility |
|------|----------------|
| `recording-processing.ts` | Orchestrates all steps |
| `recording-transcribe.ts` | Whisper subprocess management |
| `recording-convert.ts` | FFmpeg wrapper |
| `recording-storage.ts` | File paths, read/write metadata |

## Error Handling

- Each step wrapped in try/catch
- Errors logged with step name
- Metadata updated with error status
- UI shows "Processing" until complete/error
