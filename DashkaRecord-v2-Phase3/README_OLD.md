# 🎥 DashkaRecord v2.0.0-alpha

**Next.js Monorepo - Phase 1-2 Complete**

Local screen recording platform with AI-powered transcription, translation, and PDF generation.

---

## 🚀 Quick Start (Phase 1-2)

### Prerequisites
- Node.js 20+
- npm

### Installation

```bash
# Install dependencies
npm install

# Setup environment (optional for Phase 1-2)
cp .env.local.example .env.local
# Edit .env.local with your API keys

# Run development server
npm run dev
```

### Access Application

- Frontend: http://localhost:3000
- Recordings Library: http://localhost:3000/records
- API Health: http://localhost:3000/api/health

---

## 📁 Project Structure

```
DashkaRecord-v2/
├── src/
│   └── app/
│       ├── (products)/              # Frontend Pages
│       │   ├── page.tsx             # Home (Recorder)
│       │   ├── records/
│       │   │   └── page.tsx         # Library
│       │   └── components/
│       │       ├── Recorder.tsx     # Recording UI
│       │       └── ShareButton.tsx  # Share modal
│       │
│       ├── api/                     # Backend API (Route Handlers)
│       │   ├── health/              # Health check
│       │   ├── upload/              # Video upload
│       │   ├── files/               # Files management
│       │   ├── translate/           # Translation
│       │   ├── sync/                # Solar Core sync
│       │   ├── screenshot/          # Screenshot upload
│       │   └── download/            # File downloads
│       │
│       ├── layout.tsx               # Root layout
│       └── globals.css              # Global styles
│
├── uploads/                         # File storage
│   ├── video/
│   ├── mp4/
│   ├── transcripts/
│   ├── pdf/
│   ├── metadata/
│   ├── sync_logs/
│   └── frames/
│
├── package.json
├── tsconfig.json
├── next.config.js
└── tailwind.config.ts
```

---

## 🎯 Phase 1-2 Status

### ✅ Completed

- [x] Project structure created
- [x] Frontend migrated from old structure
- [x] All components working (Recorder, ShareButton, Library)
- [x] API routes created (stubs)
- [x] All fetch calls point to `/api/*`
- [x] Application runs without errors
- [x] Tailwind CSS configured
- [x] TypeScript configured

### 📋 API Endpoints (Stubs)

All endpoints return stub responses:

- `GET /api/health` - Health check
- `POST /api/upload` - Upload video (stub)
- `GET /api/files` - List recordings (returns `[]`)
- `GET /api/files/[id]` - Get recording (stub)
- `DELETE /api/files/[id]` - Delete recording (stub)
- `POST /api/translate` - Translate transcript (stub)
- `POST /api/sync` - Sync to Solar Core (stub)
- `POST /api/screenshot` - Upload screenshot (stub)
- `GET /api/download/[id]/webm` - Download WebM (stub)
- `GET /api/download/[id]/mp4` - Download MP4 (stub)
- `GET /api/download/[id]/pdf` - Download PDF (stub)

### ⏳ Coming in Phase 3

- [ ] Backend logic implementation (lib/ modules)
- [ ] Real file upload handling
- [ ] Whisper transcription
- [ ] PDF generation
- [ ] FFmpeg conversion
- [ ] Solar Core sync
- [ ] Screenshot storage

---

## 🌟 Features (Phase 1-2)

### Frontend (Working)
- ✅ Screen recording with MediaRecorder API
- ✅ Dual recording modes (Screen + Mic / Tab + Mic)
- ✅ Real-time VU meter
- ✅ Recording timer
- ✅ Screenshot capture
- ✅ Video preview
- ✅ Recordings library UI
- ✅ Share button with recipients

### Backend (Stubs)
- ✅ API route structure
- ⏳ File storage (Phase 3)
- ⏳ Transcription (Phase 3)
- ⏳ PDF generation (Phase 3)
- ⏳ MP4 conversion (Phase 3)

---

## 🧪 Testing Phase 1-2

### 1. Start Application
```bash
npm run dev
```

### 2. Test Recording Page
- Open http://localhost:3000
- UI should load without errors
- Recording interface visible
- Mode selector works

### 3. Test Library Page
- Navigate to http://localhost:3000/records
- Empty state shows (no recordings yet)
- "New Recording" button works

### 4. Test API Health
```bash
curl http://localhost:3000/api/health
```

Expected response:
```json
{
  "status": "ok",
  "version": "2.0.0-alpha",
  "timestamp": "2024-12-28T..."
}
```

---

## 📝 Migration Notes

### Changes from v1.2.4-beta

1. **Structure**
   - ❌ Removed: `/backend` (Python FastAPI)
   - ❌ Removed: `/frontend` (separate Next.js app)
   - ✅ Created: `src/app` (unified Next.js monorepo)

2. **API Calls**
   - ❌ Before: `http://localhost:8000/upload`
   - ✅ After: `/api/upload`

3. **Runtime**
   - ❌ Before: Python + Node.js (2 servers)
   - ✅ After: Node.js only (1 server)

---

## 🚧 Known Limitations (Phase 1-2)

- Recording works but uploads don't persist (stub API)
- Library always shows empty (no real data)
- Screenshots capture but don't upload (stub API)
- Share button doesn't actually sync (stub API)
- All backend processing is stubbed

**These will be fixed in Phase 3!**

---

## 📦 Next Steps (Phase 3)

1. Create `lib/` modules:
   - `lib/storage.ts` - File & metadata management
   - `lib/transcribe.ts` - Whisper wrapper
   - `lib/pdf.ts` - PDF generation
   - `lib/convert.ts` - FFmpeg wrapper
   - `lib/translate.ts` - DeepSeek client
   - `lib/solar-core.ts` - Solar Core client

2. Implement real API routes:
   - File upload with storage
   - Background processing
   - Metadata management

3. Test end-to-end flow

---

## 👥 Team

- **Leanid** - Architect
- **Dashka** - Senior Coordinator  
- **Claude** - AI Implementation Lead

---

## 🎯 Version

**Current:** v2.0.0-alpha (Phase 1-2 Complete)  
**Previous:** v1.2.4-beta (FastAPI + Next.js)

---

**Built with ❤️ by Solar Team**  
**Next.js — это и frontend, и backend. One runtime. One brain.** 🚀
