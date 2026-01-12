# Architecture — SolarRecord v2.0.0

## Principles

1. **Separation of Concerns** — Each layer has single responsibility
2. **Adapter Pattern** — External tools (Whisper, FFmpeg) isolated behind adapters
3. **Orchestration vs Execution** — Processing orchestrates, adapters execute
4. **No Leaky Abstractions** — UI knows nothing about file paths or tools

## Layer Diagram
```
┌─────────────────────────────────────────────────────────────┐
│  UI LAYER                                                   │
│  components/recording/                                      │
│    ├── Recorder.tsx         (capture interface)             │
│    ├── RecordingCard.tsx    (card assembly)                 │
│    ├── ActionButtons.tsx    (state-changing actions)        │
│    └── RecordingDownloads.tsx (media access)                │
├─────────────────────────────────────────────────────────────┤
│  API LAYER                                                  │
│  app/api/recording/                                         │
│    ├── upload/route.ts      (receive + trigger processing)  │
│    ├── files/route.ts       (list recordings)               │
│    ├── files/[id]/route.ts  (get/delete recording)          │
│    ├── download/[id]/*/     (mp4, webm, pdf)                │
│    ├── translate/route.ts   (translation)                   │
│    └── sync/route.ts        (Solar Core sync)               │
├─────────────────────────────────────────────────────────────┤
│  SERVICE LAYER                                              │
│  lib/                                                       │
│    ├── recording-processing.ts  ← ORCHESTRATOR              │
│    ├── recording-transcribe.ts  ← Whisper adapter           │
│    ├── recording-convert.ts     ← FFmpeg adapter            │
│    ├── recording-storage.ts     ← File system adapter       │
│    └── recording-translate.ts   ← Translation adapter       │
├─────────────────────────────────────────────────────────────┤
│  EXTERNAL TOOLS                                             │
│    ├── venv/bin/python3 + whisper                           │
│    └── system ffmpeg                                        │
└─────────────────────────────────────────────────────────────┘
```

## Component Separation Rule
```
ActionButtons        = Actions that CHANGE state
                       (Transcript, Translate, PDF)

RecordingDownloads   = Access to MEDIA files
                       (Video, MP4, WebM)
```

**Why?** Different responsibilities, different update cycles.

## Why Whisper via Subprocess + venv?

1. **Isolation** — Python dependencies don't pollute system
2. **Portability** — venv travels with project
3. **Flexibility** — Can switch to cloud mode without code changes
4. **GPU Ready** — venv can have CUDA-enabled torch

## Why FFmpeg System-Level?

1. **Performance** — Native binary, no overhead
2. **Availability** — Pre-installed on most servers
3. **Reliability** — Battle-tested, stable API

## Data Flow
```
User clicks Record
       ↓
MediaRecorder captures WebM
       ↓
Blob uploaded to /api/recording/upload
       ↓
recording-storage.ts saves file + metadata
       ↓
recording-processing.ts orchestrates:
  ├── recording-transcribe.ts → venv/python3 → whisper
  ├── recording-convert.ts → ffmpeg
  └── metadata update
       ↓
UI polls or refreshes → shows results
```

## Key Design Decisions

| Decision | Rationale |
|----------|-----------|
| Local filesystem storage | Simplicity, no external DB for MVP |
| Background processing | Non-blocking upload response |
| On-demand MP4 | Convert only when requested |
| Metadata JSON files | Human-readable, easy debugging |
