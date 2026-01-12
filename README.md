# ☀️ SolarRecord v2.0.0-alpha

Local screen recording with AI-powered transcription.

## Overview

SolarRecord captures screen recordings in the browser, transcribes audio using OpenAI Whisper, and syncs results to Solar Core ERP.

## Tech Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 14, React 18, TypeScript, Tailwind CSS |
| Backend | Next.js API Routes |
| AI | OpenAI Whisper (subprocess) |
| Media | FFmpeg, MediaRecorder API |
| Storage | Local filesystem |

## Processing Pipeline
```
Browser Recording
       ↓
   POST /api/recording/upload
       ↓
   Save WebM → Create Metadata
       ↓
   Background Processing
       ├── 1. Whisper Transcription (venv/python3)
       ├── 2. Language Detection (auto)
       ├── 3. MP4 Conversion (ffmpeg)
       └── 4. Status Update
       ↓
   UI Refresh → Share/Sync
```

## Quick Start
```bash
# 1. Install Node dependencies
pnpm install

# 2. Setup Python environment for Whisper
python3 -m venv venv
source venv/bin/activate
pip install openai-whisper

# 3. Verify FFmpeg
ffmpeg -version

# 4. Run
pnpm dev
```

Open: http://localhost:3000/recording

## Environment Variables
```env
# Whisper Configuration
WHISPER_MODE=subprocess     # subprocess | cloud | node
WHISPER_MODEL=base          # tiny | base | small | medium | large

# Cloud Mode (optional)
OPENAI_API_KEY=sk-...       # Required only for WHISPER_MODE=cloud

# Solar Core Integration (optional)
SOLAR_CORE_URL=https://...
SOLAR_CORE_API_KEY=...
```

## Whisper Modes

| Mode | Requirements | Use Case |
|------|--------------|----------|
| `subprocess` | Python 3 + venv + openai-whisper | Local development |
| `cloud` | OpenAI API key | Production / serverless |
| `node` | Not implemented | Future |

## Project Structure
```
SolarRecord/
├── app/
│   ├── recording/              # Pages
│   │   ├── page.tsx            # Recorder UI
│   │   └── records/page.tsx    # Library UI
│   └── api/recording/          # API routes
├── components/recording/       # React components
├── lib/                        # Core services
│   ├── recording-processing.ts # Orchestrator
│   ├── recording-transcribe.ts # Whisper adapter
│   ├── recording-convert.ts    # FFmpeg adapter
│   └── recording-storage.ts    # File system
├── scripts/
│   └── transcribe.py           # Python Whisper script
├── uploads/                    # Local file storage
└── venv/                       # Python environment
```

## Documentation

- [Architecture](docs/ARCHITECTURE.md)
- [Pipeline](docs/PIPELINE.md)
- [Deployment](docs/DEPLOYMENT.md)

## Team

| Role | Name |
|------|------|
| Architect | Leanid |
| Senior Coordinator | Dashka |
| Engineer | Claude |

---

☀️ **SOLAR Team** — IT с AI мышлением

v2.0.0-alpha | January 2026
