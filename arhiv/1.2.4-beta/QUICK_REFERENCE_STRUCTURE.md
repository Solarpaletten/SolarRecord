# 🎯 DashkaRecord - Quick Reference Structure

**v1.2.4-beta** | **28.12.2024** | **Solar Team**

---

## 📊 PROJECT TREE

```
DashkaRecord/
│
├── 📂 backend/                          # FastAPI Backend (Python 3.11)
│   │
│   ├── ⭐ main.py                       # ENTRY POINT - API Server (16 endpoints)
│   ├── 🎙️ transcribe.py                # CORE - Whisper AI transcription
│   ├── 🌐 translate.py                 # CORE - DeepSeek translation
│   ├── 📄 pdf_generator.py             # CORE - PDF generation
│   ├── 🔄 convert.py                   # CORE - WebM→MP4 conversion
│   ├── 🔗 solar_core_client.py         # INTEGRATION - Solar Core sync
│   ├── 📦 sync_models.py               # MODELS - Pydantic schemas
│   ├── 🧪 mock_solar_core.py           # TESTING - Mock server (port 8010)
│   │
│   ├── 📄 requirements.txt             # Python deps (FastAPI, Whisper, PyTorch)
│   ├── 🐳 Dockerfile                   # Backend container
│   ├── 🔐 .env                         # Config (secret)
│   ├── 📋 .env.example                 # Config template
│   │
│   └── 📂 uploads/                     # File Storage
│       ├── video/                      # WebM recordings
│       ├── mp4/                        # MP4 conversions
│       ├── transcripts/                # TXT transcripts
│       ├── pdf/                        # PDF reports
│       ├── metadata/                   # JSON metadata
│       ├── sync_logs/                  # Sync logs
│       └── frames/                     # Screenshots (prepared)
│
├── 📂 frontend/                         # Next.js 14 Frontend (TypeScript)
│   │
│   ├── 📂 app/                         # Next.js App Router
│   │   ├── ⭐ page.tsx                 # ENTRY POINT - Home (imports Recorder)
│   │   ├── layout.tsx                  # Root layout
│   │   ├── globals.css                 # Global styles
│   │   └── 📂 records/
│   │       └── page.tsx                # Library view (400 lines)
│   │
│   ├── 📂 components/
│   │   ├── 🎥 Recorder.tsx             # CORE - Recording UI (785 lines)
│   │   └── 📤 ShareButton.tsx          # FEATURE - Share to Solar Core
│   │
│   ├── 📄 package.json                 # Node deps (Next.js, React, Tailwind)
│   ├── 📄 tsconfig.json                # TypeScript config
│   ├── 📄 tailwind.config.ts           # Tailwind config (Solar branding)
│   ├── 📄 next.config.js               # Next.js config
│   └── 🐳 Dockerfile                   # Frontend container
│
├── 🐳 docker-compose.yml               # Orchestration (backend + frontend)
├── 📖 README.md                        # Main documentation
└── 📄 .gitignore                       # Git exclusions
```

---

## 🎯 ENTRY POINTS

### Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
# → http://localhost:8000
# → http://localhost:8000/docs (Swagger)
```

### Frontend
```bash
cd frontend
npm run dev
# → http://localhost:3000
```

### Docker (Production)
```bash
docker compose up --build
# → Frontend: http://localhost:3000
# → Backend:  http://localhost:8000
```

---

## 🧩 CORE MODULES

### Recording (Frontend)
```
components/Recorder.tsx (785 lines)
├─ MediaRecorder API
├─ Combined streams (screen + tab + mic)
├─ VU meter (AudioContext)
├─ Timer (MM:SS)
├─ Screenshot (ImageCapture API)
└─ Upload to backend
```

### Transcription (Backend)
```
backend/transcribe.py (150 lines)
├─ Whisper model loading (lazy)
├─ Language auto-detection
├─ Transcript generation
└─ Segments with timestamps
```

### Processing Pipeline
```
backend/main.py → process_recording()
├─ 1. Transcribe → .txt
├─ 2. Generate PDF → .pdf
├─ 3. Convert MP4 → .mp4
└─ 4. Update metadata → .json
```

### Sync (Integration)
```
backend/solar_core_client.py
├─ HTTP POST to Solar Core
├─ Retry logic (3 attempts)
├─ Audit logging
└─ Health checks
```

---

## 📡 API ENDPOINTS (16 total)

### Upload & Files
```
POST   /upload                — Upload video
GET    /files                 — List recordings
GET    /files/{id}            — Get metadata
DELETE /files/{id}            — Delete recording
```

### Downloads
```
GET    /download/{id}/webm    — Download WebM
GET    /download/{id}/mp4     — Download MP4
GET    /download/{id}/pdf     — Download PDF
GET    /video-info/{id}       — Video info
```

### Processing
```
POST   /translate             — Translate transcript
```

### Sync (Sprint #2)
```
POST   /api/recorder-sync     — Sync to Solar Core
GET    /api/sync-status/{id}  — Get sync status
```

### Screenshots (Sprint #3, prepared)
```
POST   /screenshot            — Upload screenshot
GET    /screenshots/{id}      — List screenshots
GET    /download/{id}/screenshot/{file} — Download one
GET    /download/{id}/screenshots/all   — Download ZIP
```

### System
```
GET    /                      — API info
GET    /health                — Health check
```

---

## 🔄 WORKFLOW

```
┌─────────────────┐
│   1. RECORD     │  Recorder.tsx → MediaRecorder
│   (Frontend)    │  - Screen/Tab capture
└────────┬────────┘  - Microphone
         │           - VU meter
         ▼           - Timer
┌─────────────────┐  - Screenshots
│   2. UPLOAD     │  POST /upload
│   (Backend)     │  → Save WebM
└────────┬────────┘  → Create metadata
         │           → Start background task
         ▼
┌─────────────────┐
│ 3. PROCESSING   │  Background:
│   (Background)  │  1. Transcribe (Whisper)
└────────┬────────┘  2. Generate PDF
         │           3. Convert MP4
         ▼           4. Update metadata
┌─────────────────┐
│   4. VIEWING    │  /records page
│   (Frontend)    │  - List recordings
└────────┬────────┘  - Play video
         │           - Download files
         ▼           - Actions
┌─────────────────┐
│   5. SHARING    │  ShareButton
│   (Optional)    │  → Sync to Solar Core
└─────────────────┘  → Audit log
```

---

## 🔧 TECH STACK

### Backend
- **Language:** Python 3.11
- **Framework:** FastAPI 0.109.0
- **AI:** OpenAI Whisper (base)
- **ML:** PyTorch 2.1.2
- **PDF:** ReportLab 4.0.9
- **Video:** FFmpeg
- **API:** DeepSeek (translation)

### Frontend
- **Language:** TypeScript 5
- **Framework:** Next.js 14.1.0
- **UI:** React 18
- **Styling:** Tailwind CSS 3.3

### Infrastructure
- **Container:** Docker + Docker Compose
- **Storage:** File-based (JSON)
- **Network:** Bridge (solar-network)
- **Ports:** 3000, 8000, 8010

---

## 🗄️ DATA STRUCTURE

### Metadata JSON
```json
{
  "id": "20251101_192804",
  "filename": "20251101_192804.webm",
  "created_at": "2024-11-01T19:28:04",
  "language": "ru",
  "video_path": "uploads/video/...",
  "transcript_path": "uploads/transcripts/...",
  "pdf_path": "uploads/pdf/...",
  "translated": false,
  "synced": false,
  "solar_core_id": null,
  "screenshots": []
}
```

### File Sizes
```
WebM (5 min):  50-80 MB
MP4 (5 min):   40-70 MB
Transcript:    5-20 KB
PDF:           50-200 KB
Screenshot:    100-500 KB
```

---

## ⚡ PERFORMANCE

```
Upload:        5-10 seconds (50 MB)
Transcription: 15-30 seconds (5 min, base model)
PDF:           1-2 seconds
MP4:           10-20 seconds
```

---

## 🎨 FEATURES (v1.2.4-beta)

### ✅ Recording
- Screen/Tab capture
- Microphone audio
- Tab audio (system sound)
- Dual recording modes

### ✅ UI/UX
- Real-time VU meter
- Recording timer (MM:SS)
- Mode selector
- Status panel

### ✅ Processing
- AI transcription (Whisper)
- Auto language detection
- PDF generation
- MP4 conversion

### ✅ Integration
- Solar Core sync
- Share functionality
- Audit logging

### 📸 Screenshot (Prepared)
- Live capture during recording
- ImageCapture API + Canvas fallback
- Thumbnail preview
- Backend storage ready

---

## 🔑 KEY POINTS

1. **Architecture:** Separate products (SolarRecord + Solar Screen)
2. **Critical Fix:** Audio capture v1.2.0 (combined streams)
3. **Integration:** Solar Core ERP sync with retry
4. **Storage:** File-based, no database
5. **Processing:** Background tasks (non-blocking)
6. **Compatibility:** Chrome, Firefox, Safari
7. **Deployment:** Docker ready with health checks
8. **Team:** Leanid (Architect) + Dashka (Senior) + Claude (AI)
9. **Protocol:** D=>C (tasks), C=>D (reports), L (control)
10. **Status:** 🟢 v1.2.4-beta PRODUCTION READY

---

## 📚 DOCUMENTATION

- **README.md** — Main docs
- **backend/README.md** — Sprint #2 Summary
- **DASHKARECORD_PROJECT_STRUCTURE.md** — Full structure (this file)

---

## 🚀 QUICK START

```bash
# Development
cd backend && source venv/bin/activate
uvicorn main:app --reload &
cd ../frontend && npm run dev

# Production
docker compose up --build
```

---

**Version:** v1.2.4-beta  
**Status:** 🟢 PRODUCTION READY  
**Team:** Solar AI | IT | Team  

💪 **МЫ СУПЕРКОМАНДА!**
