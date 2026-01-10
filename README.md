# 🎥 DashkaRecord v2.0.0-alpha

**Phase 3: Real Backend Implementation - COMPLETE** ✅

Next.js Monorepo with full AI transcription and MP4 conversion.

---

## 🚀 Quick Start

### 1. Prerequisites

**Required:**
- Node.js 20+
- npm
- FFmpeg (for MP4 conversion)

**For Whisper (subprocess mode):**
- Python 3.8+
- pip

**Optional:**
- DeepSeek API key (for translation)
- Solar Core ERP (for sync)

### 2. Installation

```bash
# Install Node.js dependencies
npm install

# Setup environment
cp .env.local.example .env.local
# Edit .env.local with your settings

# Install Python dependencies (for Whisper subprocess mode)
pip install -r requirements.txt

# Install FFmpeg (if not already installed)
# macOS: brew install ffmpeg
# Ubuntu: sudo apt install ffmpeg
```

### 3. Run

```bash
npm run dev
```

Access: **http://localhost:3000**

---

## 📊 API Endpoints (All Working ✅)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/health` | GET | Health check |
| `/api/upload` | POST | Upload WebM + trigger processing |
| `/api/files` | GET | List recordings |
| `/api/files/[id]` | GET/DELETE | Get/Delete recording |
| `/api/download/[id]/webm` | GET | Download WebM |
| `/api/download/[id]/mp4` | GET | Download MP4 |
| `/api/translate` | POST | Translate transcript |
| `/api/sync` | POST | Sync to Solar Core |
| `/api/screenshot` | POST | Upload screenshot |

---

## 🔄 Processing Pipeline

```
Upload → Background Processing:
  1. Transcribe (Whisper) → .txt
  2. Convert MP4 (FFmpeg) → .mp4
  3. Update metadata → complete
```

---

## 🧪 Testing End-to-End

```bash
# 1. Start server
npm run dev

# 2. Record video at http://localhost:3000
- Click "Start Recording"
- Grant permissions
- Stop recording

# 3. Check /records
- Recording appears
- Wait for processing (30-60s)
- Download buttons active

# 4. Verify files
ls uploads/metadata/*.json
ls uploads/video/*.webm
ls uploads/transcripts/*.txt
ls uploads/mp4/*.mp4
```

---

## ⚙️ Configuration (.env.local)

```bash
WHISPER_MODE=subprocess        # subprocess | cloud
WHISPER_MODEL=base             # tiny | base | small | medium | large
DEEPSEEK_API_KEY=your_key      # For translation
SOLAR_CORE_URL=http://localhost:8010
```

---

## 🐛 Troubleshooting

**Transcription fails?**
```bash
# Check Python & Whisper
python3 --version
pip install openai-whisper
python3 scripts/transcribe.py --help
```

**MP4 conversion fails?**
```bash
# Install FFmpeg
brew install ffmpeg  # macOS
sudo apt install ffmpeg  # Ubuntu
ffmpeg -version
```

---

## 📦 Dependencies

**Node.js:**
- next, react, fluent-ffmpeg

**Python:**
- openai-whisper, torch

---

## 👥 Team

Solar AI | IT | Team

**Built with Next.js Monorepo - One Runtime 🚀**
