# 📁 DashkaRecord - Полная Структура Проекта

**Версия:** v1.2.4-beta  
**Дата анализа:** 28.12.2024  
**Команда:** Leanid (Architect) + Dashka (Senior) + Claude (AI Lead)  

---

## 🗂️ КОРНЕВАЯ СТРУКТУРА

```
DashkaRecord/
├── 📂 backend/                          — FastAPI Backend (Python 3.11)
├── 📂 frontend/                         — Next.js 14 Frontend (TypeScript)
├── 📄 docker-compose.yml                — Docker оркестрация (backend + frontend)
├── 📄 README.md                         — Основная документация проекта
├── 📄 .gitignore                        — Git исключения
└── 📄 setup.sh                          — Установочный скрипт (если есть)
```

---

## 🔧 BACKEND СТРУКТУРА

```
backend/
├── 📄 main.py                           — ⭐ ENTRY POINT: FastAPI сервер, все endpoints
├── 📄 transcribe.py                     — 🎙️ CORE: Whisper AI транскрипция аудио
├── 📄 translate.py                      — 🌐 CORE: DeepSeek перевод текстов
├── 📄 pdf_generator.py                  — 📄 CORE: ReportLab генерация PDF отчётов
├── 📄 convert.py                        — 🔄 CORE: FFmpeg WebM→MP4 конвертация
├── 📄 solar_core_client.py              — 🔗 INTEGRATION: HTTP клиент для Solar Core ERP
├── 📄 sync_models.py                    — 📦 MODELS: Pydantic модели синхронизации
├── 📄 mock_solar_core.py                — 🧪 TESTING: Mock сервер Solar Core (port 8010)
│
├── 📄 requirements.txt                  — Python зависимости (FastAPI, Whisper, PyTorch)
├── 📄 Dockerfile                        — Docker образ backend (Python 3.11-slim)
├── 📄 .env                              — Конфигурация (секретная, не в git)
├── 📄 .env.example                      — Пример конфигурации
├── 📄 package.json                      — Legacy Node зависимости (не используется)
├── 📄 README.md                         — Backend документация (Sprint #2 Summary)
│
└── 📂 uploads/                          — Хранилище файлов
    ├── 📂 video/                        — Оригинальные WebM записи
    ├── 📂 mp4/                          — Сконвертированные MP4 файлы
    ├── 📂 transcripts/                  — Текстовые транскрипты (.txt, _segments.txt)
    ├── 📂 pdf/                          — PDF отчёты
    ├── 📂 metadata/                     — JSON метаданные записей
    ├── 📂 sync_logs/                    — Логи синхронизаций с Solar Core
    └── 📂 frames/                       — Скриншоты (подготовлено для Solar Screen)
```

### 📋 Backend - Назначение Файлов

| Файл | Строк | Назначение |
|------|-------|-----------|
| **main.py** | ~780 | API сервер, все 16 endpoints, бизнес-логика, background tasks |
| **transcribe.py** | ~150 | Whisper AI загрузка модели, транскрипция видео, авто-определение языка |
| **translate.py** | ~120 | DeepSeek API интеграция, перевод транскриптов на другие языки |
| **pdf_generator.py** | ~180 | ReportLab генерация PDF с Cyrillic поддержкой (DejaVu fonts) |
| **convert.py** | ~200 | FFmpeg WebM→MP4, dual track merge, аудио маппинг |
| **solar_core_client.py** | ~200 | HTTP клиент с retry logic, health checks, синхронизация |
| **sync_models.py** | ~150 | Pydantic модели: RecorderSyncRequest, SyncLog, SolarCorePayload |
| **mock_solar_core.py** | ~120 | FastAPI mock сервер для тестирования синхронизации |

---

## ⚛️ FRONTEND СТРУКТУРА

```
frontend/
├── 📂 app/                              — Next.js 14 App Router
│   ├── 📄 page.tsx                      — ⭐ ENTRY POINT: Главная страница (импорт Recorder)
│   ├── 📄 layout.tsx                    — Root layout, metadata, глобальные стили
│   ├── 📄 globals.css                   — Tailwind глобальные стили
│   │
│   └── 📂 records/                      — Маршрут /records
│       └── 📄 page.tsx                  — 📚 Библиотека записей, плеер, действия
│
├── 📂 components/                       — React компоненты
│   ├── 📄 Recorder.tsx                  — 🎥 CORE: Главный компонент записи (785 строк)
│   └── 📄 ShareButton.tsx               — 📤 FEATURE: Share в Solar Core (250 строк)
│
├── 📂 public/                           — Статические файлы (если есть)
│
├── 📄 package.json                      — Node зависимости (Next.js 14, React 18)
├── 📄 tsconfig.json                     — TypeScript конфигурация
├── 📄 tailwind.config.ts                — Tailwind CSS конфигурация (Solar брендинг)
├── 📄 postcss.config.js                 — PostCSS конфигурация
├── 📄 next.config.js                    — Next.js конфигурация (standalone output)
├── 📄 next-env.d.ts                     — Next.js TypeScript типы
└── 📄 Dockerfile                        — Docker образ frontend (Node 20-alpine)
```

### 📋 Frontend - Назначение Файлов

| Файл | Строк | Назначение |
|------|-------|-----------|
| **app/page.tsx** | ~10 | Главная страница, рендерит компонент Recorder |
| **app/layout.tsx** | ~20 | Root layout, метаданные SEO, импорт глобальных стилей |
| **app/records/page.tsx** | ~400 | Библиотека записей: список, плеер, действия (translate, delete, share) |
| **components/Recorder.tsx** | ~785 | Запись экрана, микрофон, VU meter, timer, screenshot, MediaRecorder API |
| **components/ShareButton.tsx** | ~250 | Modal окно для share в Solar Core (Dashka/Claude/Custom) |
| **tailwind.config.ts** | ~60 | Tailwind конфигурация: Solar брендинг, цвета, тени, анимации |
| **next.config.js** | ~10 | Next.js конфигурация: API_URL env, standalone output для Docker |

---

## 🎯 ТОЧКИ ВХОДА (Entry Points)

### Backend
```python
# backend/main.py (строка ~780)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
```
**Запуск:** `uvicorn main:app --reload --port 8000`

### Frontend
```typescript
// frontend/app/page.tsx
import Recorder from "@/components/Recorder";
export default function Home() {
  return <Recorder />;
}
```
**Запуск:** `npm run dev` (Next.js dev server на port 3000)

### Docker
```yaml
# docker-compose.yml
services:
  backend: (port 8000)
  frontend: (port 3000)
```
**Запуск:** `docker compose up --build`

---

## 🧩 ЯДРО (Core Logic)

### 1. Запись Видео
**Файл:** `frontend/components/Recorder.tsx`
```
- MediaRecorder API
- displayMedia capture (screen/tab)
- getUserMedia (microphone)
- Combined stream (video + tab audio + mic)
- VU meter (AudioContext, AnalyserNode)
- Recording timer
- Screenshot capture (ImageCapture API)
```

### 2. Транскрипция
**Файл:** `backend/transcribe.py`
```
- Whisper model loading (lazy load)
- Audio extraction from video
- Language auto-detection
- Transcript generation (.txt)
- Segments with timestamps (_segments.txt)
```

### 3. Обработка
**Файл:** `backend/main.py` - функция `process_recording()`
```
Background task chain:
1. Transcribe audio → .txt
2. Generate PDF → .pdf
3. Convert WebM→MP4 → .mp4
4. Update metadata → .json
```

### 4. PDF Генерация
**Файл:** `backend/pdf_generator.py`
```
- ReportLab document creation
- DejaVu fonts (Cyrillic support)
- Metadata table
- Formatted transcript
- Solar branding
```

### 5. Синхронизация
**Файлы:** `backend/solar_core_client.py` + `sync_models.py`
```
- HTTP POST to Solar Core
- Retry logic (3 attempts)
- Audit logging
- Health checks
- Metadata update
```

---

## 🛠️ ВСПОМОГАТЕЛЬНЫЕ МОДУЛИ (Utils)

### Backend Utils
```
convert.py          — FFmpeg wrapper, WebM→MP4, dual track merge
translate.py        — DeepSeek API wrapper, text translation
sync_models.py      — Pydantic models для валидации данных
solar_core_client.py — HTTP client с retry и logging
mock_solar_core.py  — Testing mock server
```

### Frontend Utils
```
ShareButton.tsx     — UI компонент для share функционала
tailwind.config.ts  — UI utilities: colors, shadows, animations
globals.css         — Global CSS utilities
```

---

## 📊 API ENDPOINTS (Backend main.py)

### Основные (4)
```
POST   /upload                — Загрузка видео
GET    /files                 — Список всех записей
GET    /files/{id}            — Метаданные записи
DELETE /files/{id}            — Удаление записи
```

### Download (4)
```
GET    /download/{id}/webm    — Скачать WebM
GET    /download/{id}/mp4     — Скачать MP4
GET    /download/{id}/pdf     — Скачать PDF
GET    /video-info/{id}       — Информация о видео
```

### Processing (1)
```
POST   /translate             — Перевести транскрипт
```

### Sync (2)
```
POST   /api/recorder-sync     — Синхронизация с Solar Core
GET    /api/sync-status/{id}  — Статус синхронизации
```

### Screenshot (4)
```
POST   /screenshot            — Загрузить скриншот
GET    /screenshots/{id}      — Список скриншотов
GET    /download/{id}/screenshot/{file} — Скачать скриншот
GET    /download/{id}/screenshots/all   — Скачать ZIP
```

### System (2)
```
GET    /                      — API info
GET    /health                — Health check
```

**Всего:** 16 endpoints

---

## 🗄️ ХРАНИЛИЩЕ ДАННЫХ

### Metadata JSON (backend/uploads/metadata/)
```json
{
  "id": "20251101_192804",
  "filename": "20251101_192804.webm",
  "created_at": "2024-11-01T19:28:04",
  "language": "ru",
  "duration": 125.5,
  "video_path": "uploads/video/20251101_192804.webm",
  "transcript_path": "uploads/transcripts/20251101_192804.txt",
  "pdf_path": "uploads/pdf/20251101_192804.pdf",
  "translated": false,
  "translation_path": null,
  "synced": false,
  "sync_status": null,
  "solar_core_id": null,
  "screenshots": []
}
```

### Директории
```
uploads/video/       — WebM файлы (50-80 MB каждый)
uploads/mp4/         — MP4 файлы (40-70 MB каждый)
uploads/transcripts/ — TXT файлы (5-20 KB)
uploads/pdf/         — PDF файлы (50-200 KB)
uploads/metadata/    — JSON файлы (1-3 KB)
uploads/sync_logs/   — JSON логи синхронизаций
uploads/frames/      — PNG скриншоты (100-500 KB)
```

---

## 🔄 WORKFLOW (Жизненный Цикл Записи)

```
1. ЗАПИСЬ
   └─ frontend/components/Recorder.tsx
      ├─ MediaRecorder start
      ├─ VU meter monitoring
      ├─ Timer tracking
      └─ Screenshot capture (опционально)

2. UPLOAD
   └─ POST /upload → backend/main.py
      ├─ Сохранение WebM в uploads/video/
      ├─ Создание metadata JSON
      └─ Запуск background task

3. PROCESSING (Background)
   └─ process_recording()
      ├─ transcribe.py → .txt
      ├─ pdf_generator.py → .pdf
      └─ convert.py → .mp4

4. VIEWING
   └─ frontend/app/records/page.tsx
      ├─ Список записей
      ├─ Плеер видео
      ├─ Действия (translate, share, delete)
      └─ Download (WebM, MP4, PDF)

5. SHARING (Sprint #2)
   └─ ShareButton.tsx → POST /api/recorder-sync
      ├─ solar_core_client.py
      ├─ Retry logic
      ├─ Audit logging
      └─ Metadata update (synced: true)
```

---

## 🔧 ТЕХНОЛОГИЧЕСКИЙ СТЕК

### Backend
```yaml
Language:     Python 3.11
Framework:    FastAPI 0.109.0
AI/ML:        OpenAI Whisper (base model)
ML Engine:    PyTorch 2.1.2
PDF:          ReportLab 4.0.9
Video:        FFmpeg
Translation:  DeepSeek API
Server:       Uvicorn (ASGI)
Database:     File-based (JSON metadata)
```

### Frontend
```yaml
Language:     TypeScript 5
Framework:    Next.js 14.1.0
UI Library:   React 18
Styling:      Tailwind CSS 3.3
Build:        Next.js compiler
Runtime:      Node.js 20
```

### Infrastructure
```yaml
Containerization: Docker + Docker Compose
Storage:          Local filesystem
Network:          Bridge network (solar-network)
Ports:            3000 (frontend), 8000 (backend), 8010 (mock)
```

---

## 📦 ЗАВИСИМОСТИ

### Backend (requirements.txt)
```
fastapi==0.109.0              — Web framework
uvicorn[standard]==0.27.0     — ASGI server
python-multipart==0.0.6       — File upload support
openai-whisper==20231117      — AI transcription
torch==2.1.2                  — ML framework
torchaudio==2.1.2             — Audio processing
reportlab==4.0.9              — PDF generation
requests==2.31.0              — HTTP client
pydantic==2.5.3               — Data validation
python-dotenv==1.0.0          — Environment variables
```

### Frontend (package.json)
```json
{
  "dependencies": {
    "next": "14.1.0",           // Framework
    "react": "^18",             // UI library
    "react-dom": "^18"          // DOM renderer
  },
  "devDependencies": {
    "@types/node": "^20",       // Node types
    "@types/react": "^18",      // React types
    "typescript": "^5",         // TypeScript compiler
    "tailwindcss": "^3.3.0",    // CSS framework
    "autoprefixer": "^10.0.1",  // CSS post-processor
    "eslint": "^8"              // Linter
  }
}
```

---

## 🎨 КОНФИГУРАЦИЯ

### Environment Variables (backend/.env)
```env
MODEL=base                     # Whisper model: tiny|base|small|medium|large
DEEPSEEK_API_KEY=xxx          # DeepSeek API для переводов
CORS_ORIGINS=http://localhost:3000
FORCE_CPU=true                # CPU-only mode (без GPU)
SOLAR_CORE_URL=xxx            # Solar Core ERP URL
SOLAR_CORE_API_KEY=xxx        # Solar Core API key
```

### Environment Variables (frontend/.env.local)
```env
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## 🚀 DEPLOYMENT

### Development
```bash
# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn main:app --reload --port 8000

# Frontend
cd frontend
npm install
npm run dev  # port 3000

# Mock Solar Core (опционально)
cd backend
python mock_solar_core.py  # port 8010
```

### Production (Docker)
```bash
# Запуск всех сервисов
docker compose up --build

# Services:
# - backend:  http://localhost:8000
# - frontend: http://localhost:3000
# - API docs: http://localhost:8000/docs
```

---

## 📚 ДОКУМЕНТАЦИЯ

### Root Level
```
README.md                         — Основная документация проекта
.gitignore                        — Git исключения
docker-compose.yml                — Docker оркестрация
```

### Backend Documentation
```
backend/README.md                 — Sprint #2 Summary (Audio Fix + Sync)
backend/.env.example              — Пример конфигурации
```

### Generated (не в git)
```
AUDIO_PATCH_NOTES.md             — v1.2.0-beta Release Notes
SOLAR_RECORDER_SYNC.md           — Integration Documentation
SPRINT_2_SUMMARY.md              — Complete Implementation Report
UPDATE_TO_v1.1.1.md              — Upgrade Instructions
```

---

## 🔍 ОБЩЕЕ НАЗНАЧЕНИЕ ПРОЕКТА

**DashkaRecord (Solar Recorder)** — это локальная платформа для записи экрана с AI-powered транскрипцией и автоматической обработкой. Проект представляет собой privacy-first альтернативу облачным сервисам типа Loom, где все данные остаются на локальном сервере пользователя. Система захватывает экран и микрофон через браузерный MediaRecorder API, автоматически транскрибирует речь с помощью Whisper AI, генерирует профессиональные PDF отчёты через ReportLab, конвертирует видео в MP4 для совместимости с мессенджерами (Telegram), и синхронизирует записи с внутренней ERP системой Solar Core для командного доступа. Архитектура разделена на FastAPI backend (Python) для AI обработки и Next.js frontend (TypeScript) для UI, с полной Docker контейнеризацией и health checks для production deployment. Версия v1.2.4-beta готова к production использованию со всеми критическими фичами: dual recording modes (screen/tab), real-time VU meter, recording timer, и screenshot infrastructure (подготовлено для будущего продукта Solar Screen).

---

## ✅ КЛЮЧЕВЫЕ ТОЧКИ ДЛЯ ЗАПОМИНАНИЯ

### 1. Архитектурные Решения
- **Раздельные продукты:** SolarRecord (запись) и Solar Screen (скриншоты) — чистая архитектура
- **Background processing:** Транскрипция и конвертация не блокируют UI
- **File-based storage:** Простота, надёжность, локальность (no database)
- **Metadata-driven:** Вся логика управления через JSON метаданные

### 2. Критические Компоненты
- **Recorder.tsx (785 строк):** Главный UI компонент, MediaRecorder, combined streams
- **main.py (780 строк):** Все 16 endpoints, background tasks, business logic
- **transcribe.py:** Whisper lazy loading, CPU mode, language detection
- **convert.py:** FFmpeg audio mapping fix (v1.2.2-stable)

### 3. Известные Issues & Fixes
- **Audio Fix (v1.2.0-beta):** Комбинированный stream (video + tab audio + mic) — ИСПРАВЛЕНО
- **Timing Issue (v1.2.4-beta):** Screenshot upload требует recording_id, который создаётся после upload
- **Архитектурное решение:** Screenshot функционал выведен в Solar Screen (отдельный продукт)

### 4. Интеграции
- **Solar Core ERP:** Синхронизация через HTTP API с retry logic
- **DeepSeek API:** Перевод транскриптов (опционально)
- **FFmpeg:** WebM→MP4 конвертация для Telegram
- **Whisper AI:** CPU mode для Docker compatibility

### 5. Production Readiness
- **Health checks:** Backend + Frontend в docker-compose
- **CORS protection:** Настраиваемые origins
- **Error handling:** Try-catch во всех критических местах
- **Logging:** Консольные логи для debugging
- **Versioning:** Semantic versioning (v1.2.4-beta)

### 6. User Flow
```
Start Recording → Capture (screen+mic) → Stop Recording 
→ Upload WebM → Background (transcribe + PDF + MP4) 
→ View Library → Actions (play, download, translate, share, delete)
```

### 7. Performance
- **Upload:** 5-10 секунд (50 MB)
- **Transcription:** 15-30 секунд (5 min, base model)
- **PDF Generation:** 1-2 секунды
- **MP4 Conversion:** 10-20 секунд

### 8. Browser Compatibility
- **Chrome/Edge:** Full support (ImageCapture API для screenshots)
- **Firefox:** Full support (Canvas fallback для screenshots)
- **Safari:** Full support (Canvas fallback)

### 9. Deployment Modes
- **Development:** Local (backend port 8000, frontend port 3000)
- **Production:** Docker Compose (auto health checks, restart policies)
- **Testing:** Mock Solar Core (port 8010)

### 10. Команда & Протокол
- **Leanid (L):** Architect — структура, отзывы, утверждение
- **Dashka (D):** Senior Coordinator — задачи, приоритеты, координация
- **Claude (C):** AI Implementation Lead — разработка, документация
- **Протокол:** D=>C (задачи), C=>D (отчёты), L (контроль)

---

**Статус:** 🟢 v1.2.4-beta PRODUCTION READY  
**Дата:** 28.12.2024  
**Команда:** Solar AI | IT | Team  

🚀 **Космический корабль с заправленными баками!**
