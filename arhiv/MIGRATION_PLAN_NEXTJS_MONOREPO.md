# 🚀 DashkaRecord - Migration Plan: Next.js Monorepo

**Dashka⇒Claude (D⇒C)** | **КРИТИЧЕСКОЕ АРХИТЕКТУРНОЕ ЗАДАНИЕ**  
**Дата:** 28.12.2024  
**Версия:** v1.2.4-beta → v2.0.0-alpha  
**Команда:** Solar Team (Leanid, Dashka, Claude)

---

## 🎯 ЦЕЛЬ МИГРАЦИИ

Полная миграция с **FastAPI (Python) + Next.js (TypeScript)** на **единое Next.js приложение (TypeScript)**

### ❌ УБИРАЕМ
```
/backend/                          — FastAPI сервер (Python 3.11)
  ├─ main.py                       — 16 endpoints
  ├─ transcribe.py                 — Whisper wrapper
  ├─ translate.py                  — DeepSeek wrapper
  ├─ pdf_generator.py              — ReportLab
  ├─ convert.py                    — FFmpeg wrapper
  ├─ solar_core_client.py          — HTTP client
  ├─ sync_models.py                — Pydantic models
  └─ requirements.txt              — Python deps
```

### ✅ СОЗДАЁМ
```
DashkaRecord/                      — Next.js Monorepo
  ├─ src/app/                      — Frontend + API
  │   ├─ (routes)/                 — Pages
  │   └─ api/                      — Route Handlers (Backend)
  ├─ lib/                          — Business Logic
  └─ package.json                  — Node.js deps only
```

---

## 📁 ФИНАЛЬНАЯ СТРУКТУРА ПРОЕКТА

```
DashkaRecord/
│
├─ src/
│  └─ app/
│     │
│     ├─ (products)/                        — Frontend Routes
│     │  ├─ page.tsx                        — Home (Recorder)
│     │  ├─ records/
│     │  │  └─ page.tsx                     — Library view
│     │  ├─ layout.tsx                      — Root layout
│     │  └─ globals.css                     — Global styles
│     │
│     ├─ components/                        — React Components
│     │  ├─ Recorder.tsx                    — Recording UI (785 строк)
│     │  └─ ShareButton.tsx                 — Share modal
│     │
│     └─ api/                               — Backend API (Route Handlers)
│        │
│        ├─ upload/
│        │  └─ route.ts                     — POST /api/upload
│        │
│        ├─ files/
│        │  ├─ route.ts                     — GET /api/files (list all)
│        │  └─ [id]/
│        │     ├─ route.ts                  — GET/DELETE /api/files/[id]
│        │     └─ transcribe/
│        │        └─ route.ts               — POST /api/files/[id]/transcribe
│        │
│        ├─ download/
│        │  └─ [id]/
│        │     ├─ webm/route.ts             — GET /api/download/[id]/webm
│        │     ├─ mp4/route.ts              — GET /api/download/[id]/mp4
│        │     └─ pdf/route.ts              — GET /api/download/[id]/pdf
│        │
│        ├─ translate/
│        │  └─ route.ts                     — POST /api/translate
│        │
│        ├─ sync/
│        │  ├─ route.ts                     — POST /api/sync
│        │  └─ status/
│        │     └─ [id]/route.ts             — GET /api/sync/status/[id]
│        │
│        ├─ screenshot/
│        │  └─ route.ts                     — POST /api/screenshot
│        │
│        └─ health/
│           └─ route.ts                     — GET /api/health
│
├─ lib/                                     — Business Logic (бывший backend)
│  │
│  ├─ transcribe.ts                         — Whisper wrapper (Node.js)
│  ├─ translate.ts                          — DeepSeek API client
│  ├─ pdf.ts                                — PDF generation
│  ├─ convert.ts                            — FFmpeg wrapper
│  ├─ solar-core.ts                         — Solar Core client
│  ├─ storage.ts                            — File storage & metadata
│  ├─ types.ts                              — TypeScript types
│  └─ utils.ts                              — Helpers
│
├─ public/                                  — Static assets
│  └─ favicon.ico
│
├─ uploads/                                 — File storage (unchanged)
│  ├─ video/                                — WebM recordings
│  ├─ mp4/                                  — MP4 conversions
│  ├─ transcripts/                          — TXT transcripts
│  ├─ pdf/                                  — PDF reports
│  ├─ metadata/                             — JSON metadata
│  ├─ sync_logs/                            — Sync logs
│  └─ frames/                               — Screenshots
│
├─ package.json                             — Dependencies
├─ tsconfig.json                            — TypeScript config
├─ next.config.js                           — Next.js config
├─ tailwind.config.ts                       — Tailwind config
├─ postcss.config.js                        — PostCSS config
├─ .env.local                               — Environment variables
├─ .gitignore                               — Git exclusions
└─ README.md                                — Documentation
```

---

## 🔄 MAPPING: Python → TypeScript

### 📊 Таблица Миграции

| # | Python (Backend) | TypeScript (Next.js) | Технология | Статус |
|---|------------------|---------------------|------------|--------|
| **1** | `main.py` (780 строк) | `app/api/**/route.ts` | Next.js Route Handlers | 🟢 |
| **2** | `transcribe.py` | `lib/transcribe.ts` | whisper-node / @ffmpeg/ffmpeg | 🟡 |
| **3** | `translate.py` | `lib/translate.ts` | HTTP fetch (DeepSeek API) | 🟢 |
| **4** | `pdf_generator.py` | `lib/pdf.ts` | pdfkit / jspdf | 🟢 |
| **5** | `convert.py` | `lib/convert.ts` | fluent-ffmpeg | 🟢 |
| **6** | `solar_core_client.py` | `lib/solar-core.ts` | HTTP fetch | 🟢 |
| **7** | `sync_models.py` | `lib/types.ts` | TypeScript interfaces | 🟢 |
| **8** | `mock_solar_core.py` | `app/api/mock/route.ts` | Next.js Route Handler | 🟢 |
| **9** | `requirements.txt` | `package.json` | npm dependencies | 🟢 |
| **10** | `Dockerfile` (backend) | `Dockerfile` (monorepo) | Single container | 🟢 |

### 📝 Детальный Mapping

#### 1. main.py → app/api/**/route.ts
```
Python FastAPI:
├─ @app.post("/upload")
├─ @app.get("/files")
├─ @app.delete("/files/{id}")
└─ ... (16 endpoints)

Next.js Route Handlers:
├─ app/api/upload/route.ts          → export async function POST(req)
├─ app/api/files/route.ts           → export async function GET(req)
├─ app/api/files/[id]/route.ts      → export async function DELETE(req, { params })
└─ ... (16 route handlers)
```

#### 2. transcribe.py → lib/transcribe.ts
```python
# Python (Whisper)
import whisper
model = whisper.load_model("base")
result = model.transcribe(video_path)
```

```typescript
// TypeScript (whisper-node)
import { WhisperModel } from 'whisper-node';
const whisper = new WhisperModel({ modelName: 'base' });
const result = await whisper.transcribe(videoPath);
```

**Альтернатива:** Вызов Python скрипта через `child_process`

#### 3. translate.py → lib/translate.ts
```python
# Python (DeepSeek API)
import requests
response = requests.post(DEEPSEEK_API_URL, json=payload)
```

```typescript
// TypeScript (fetch)
const response = await fetch(DEEPSEEK_API_URL, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(payload)
});
```

#### 4. pdf_generator.py → lib/pdf.ts
```python
# Python (ReportLab)
from reportlab.lib.pagesizes import A4
doc = SimpleDocTemplate(pdf_path, pagesize=A4)
```

```typescript
// TypeScript (pdfkit)
import PDFDocument from 'pdfkit';
const doc = new PDFDocument({ size: 'A4' });
doc.pipe(fs.createWriteStream(pdfPath));
```

#### 5. convert.py → lib/convert.ts
```python
# Python (subprocess FFmpeg)
subprocess.run(['ffmpeg', '-i', src, dst])
```

```typescript
// TypeScript (fluent-ffmpeg)
import ffmpeg from 'fluent-ffmpeg';
await new Promise((resolve, reject) => {
  ffmpeg(src)
    .output(dst)
    .on('end', resolve)
    .on('error', reject)
    .run();
});
```

#### 6. solar_core_client.py → lib/solar-core.ts
```python
# Python (requests)
class SolarCoreClient:
    def sync_recording(self, data):
        return self.session.post(endpoint, json=data)
```

```typescript
// TypeScript (fetch)
export class SolarCoreClient {
  async syncRecording(data: RecordingSyncData) {
    return await fetch(this.endpoint, {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }
}
```

#### 7. sync_models.py → lib/types.ts
```python
# Python (Pydantic)
class RecorderSyncRequest(BaseModel):
    id: str
    language: str
```

```typescript
// TypeScript (interfaces)
export interface RecorderSyncRequest {
  id: string;
  language: string;
}
```

---

## 📦 НОВЫЕ ЗАВИСИМОСТИ (package.json)

```json
{
  "name": "dashka-record",
  "version": "2.0.0-alpha",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "next build",
    "start": "next start",
    "lint": "next lint"
  },
  "dependencies": {
    "next": "^14.1.0",
    "react": "^18",
    "react-dom": "^18",
    
    "fluent-ffmpeg": "^2.1.2",
    "@ffmpeg-installer/ffmpeg": "^1.1.0",
    
    "pdfkit": "^0.14.0",
    "@types/pdfkit": "^0.13.0",
    
    "formidable": "^3.5.1",
    "@types/formidable": "^3.4.5"
  },
  "devDependencies": {
    "@types/node": "^20",
    "@types/react": "^18",
    "@types/react-dom": "^18",
    "typescript": "^5",
    "tailwindcss": "^3.4.0",
    "autoprefixer": "^10.4.16",
    "postcss": "^8.4.32",
    "eslint": "^8",
    "eslint-config-next": "14.1.0"
  }
}
```

### 🔍 Критичные Зависимости

| Функция | Python | Node.js Альтернатива | Статус |
|---------|--------|---------------------|--------|
| **Whisper AI** | openai-whisper | whisper-node / child_process | 🟡 |
| **FFmpeg** | subprocess | fluent-ffmpeg | 🟢 |
| **PDF** | ReportLab | pdfkit | 🟢 |
| **HTTP Client** | requests | fetch (native) | 🟢 |
| **File Upload** | python-multipart | formidable | 🟢 |
| **Validation** | pydantic | zod | 🟢 |

### ⚠️ WHISPER AI - Критичное Решение

**Проблема:** Whisper - это Python библиотека (PyTorch)

**Варианты:**

#### Вариант 1: whisper-node (Рекомендуется)
```typescript
import { WhisperModel } from 'whisper-node';

const whisper = new WhisperModel({
  modelName: 'base',
  modelPath: './models'
});

const result = await whisper.transcribe(videoPath);
```

**Плюсы:**
- ✅ Native Node.js
- ✅ Без Python runtime
- ✅ Использует whisper.cpp (C++)

**Минусы:**
- ⚠️ Требует компиляции

#### Вариант 2: Python Subprocess (Временное решение)
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';

const execPromise = promisify(exec);

async function transcribe(videoPath: string) {
  const script = `python3 scripts/transcribe.py "${videoPath}"`;
  const { stdout } = await execPromise(script);
  return JSON.parse(stdout);
}
```

**Плюсы:**
- ✅ Быстрая миграция
- ✅ Используем существующий код

**Минусы:**
- ❌ Зависимость от Python runtime
- ❌ Не чистая архитектура

#### Вариант 3: OpenAI Whisper API (Cloud)
```typescript
import OpenAI from 'openai';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

async function transcribe(audioFile: File) {
  const transcription = await openai.audio.transcriptions.create({
    file: audioFile,
    model: 'whisper-1'
  });
  return transcription.text;
}
```

**Плюсы:**
- ✅ Чистое Node.js решение
- ✅ Надёжность OpenAI
- ✅ Быстрая интеграция

**Минусы:**
- ❌ Требует API key
- ❌ Облачное решение (не локально)
- ❌ Стоимость

**🎯 РЕКОМЕНДАЦИЯ:** Начать с **Варианта 2** (Python subprocess), затем мигрировать на **Вариант 1** (whisper-node)

---

## 🛠️ ПРИМЕРЫ КОДА

### 1. Upload Route Handler

**app/api/upload/route.ts**
```typescript
import { NextRequest, NextResponse } from 'next/server';
import formidable from 'formidable';
import { promises as fs } from 'fs';
import { processRecording } from '@/lib/storage';

export const config = {
  api: {
    bodyParser: false,
  },
};

export async function POST(req: NextRequest) {
  try {
    const form = formidable({
      uploadDir: './uploads/video',
      keepExtensions: true,
    });

    const [fields, files] = await new Promise<[formidable.Fields, formidable.Files]>(
      (resolve, reject) => {
        form.parse(req as any, (err, fields, files) => {
          if (err) reject(err);
          else resolve([fields, files]);
        });
      }
    );

    const file = Array.isArray(files.file) ? files.file[0] : files.file;
    
    if (!file) {
      return NextResponse.json(
        { error: 'No file uploaded' },
        { status: 400 }
      );
    }

    const recordingId = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${recordingId}.webm`;

    // Process in background
    processRecording(recordingId, file.filepath, filename);

    return NextResponse.json({
      status: 'success',
      recording_id: recordingId,
      message: 'Video uploaded. Processing in background.',
    });

  } catch (error) {
    console.error('Upload error:', error);
    return NextResponse.json(
      { error: 'Upload failed' },
      { status: 500 }
    );
  }
}
```

### 2. Transcribe Library

**lib/transcribe.ts**
```typescript
import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs/promises';
import path from 'path';

const execPromise = promisify(exec);

interface TranscribeResult {
  text: string;
  language: string;
  segments: Array<{
    start: number;
    end: number;
    text: string;
  }>;
}

export async function transcribeAudio(
  videoPath: string,
  language?: string
): Promise<{ transcriptPath: string; detectedLanguage: string }> {
  try {
    console.log(`🎬 Transcribing: ${videoPath}`);

    // Временно: вызов Python скрипта
    const scriptPath = path.join(process.cwd(), 'scripts/transcribe.py');
    const command = `python3 ${scriptPath} "${videoPath}" ${language || 'auto'}`;
    
    const { stdout } = await execPromise(command);
    const result: TranscribeResult = JSON.parse(stdout);

    // Генерация путей
    const transcriptPath = videoPath
      .replace('video', 'transcripts')
      .replace('.webm', '.txt');

    // Сохранение транскрипта
    await fs.writeFile(
      transcriptPath,
      `[Language: ${result.language}]\n\n${result.text}`,
      'utf-8'
    );

    // Сохранение сегментов
    const segmentsPath = transcriptPath.replace('.txt', '_segments.txt');
    const segments = result.segments
      .map(s => `[${formatTime(s.start)} --> ${formatTime(s.end)}] ${s.text}`)
      .join('\n');
    
    await fs.writeFile(segmentsPath, segments, 'utf-8');

    console.log(`✅ Transcription complete: ${result.language}`);

    return {
      transcriptPath,
      detectedLanguage: result.language,
    };

  } catch (error) {
    console.error('❌ Transcription error:', error);
    throw error;
  }
}

function formatTime(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

export function getSupportedLanguages() {
  return {
    en: 'English',
    ru: 'Russian',
    lt: 'Lithuanian',
    de: 'German',
    fr: 'French',
    es: 'Spanish',
    auto: 'Auto-detect',
  };
}
```

### 3. PDF Generation

**lib/pdf.ts**
```typescript
import PDFDocument from 'pdfkit';
import fs from 'fs';
import path from 'path';

export async function createPDF(
  transcriptPath: string,
  videoFilename?: string
): Promise<string> {
  try {
    const pdfPath = transcriptPath
      .replace('transcripts', 'pdf')
      .replace('.txt', '.pdf');

    const pdfDir = path.dirname(pdfPath);
    await fs.promises.mkdir(pdfDir, { recursive: true });

    // Читаем транскрипт
    const content = await fs.promises.readFile(transcriptPath, 'utf-8');
    
    // Парсим метаданные
    const lines = content.split('\n');
    let language = 'Unknown';
    let transcriptText = content;
    
    if (lines[0].startsWith('[Language:')) {
      language = lines[0].replace('[Language:', '').replace(']', '').trim();
      transcriptText = lines.slice(2).join('\n');
    }

    // Создаём PDF
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 72, bottom: 72, left: 72, right: 72 },
    });

    const stream = fs.createWriteStream(pdfPath);
    doc.pipe(stream);

    // Заголовок
    doc
      .fontSize(24)
      .fillColor('#2563eb')
      .text('Solar Recorder', { align: 'center' });

    doc.moveDown();

    doc
      .fontSize(14)
      .fillColor('#1e40af')
      .text('Transcript Report', { align: 'center' });

    doc.moveDown(2);

    // Метаданные
    doc.fontSize(10).fillColor('#000');
    doc.text(`Recording Date: ${new Date().toLocaleString()}`);
    doc.text(`Detected Language: ${language}`);
    doc.text(`Video File: ${videoFilename || 'N/A'}`);

    doc.moveDown(2);

    // Транскрипт
    doc.fontSize(12).text('Transcript', { underline: true });
    doc.moveDown();

    doc.fontSize(11).text(transcriptText.trim(), {
      align: 'justify',
      lineGap: 4,
    });

    // Футер
    doc.moveDown(2);
    doc
      .fontSize(9)
      .fillColor('#666')
      .text('Generated by Solar Recorder | AI | IT | Solar', {
        align: 'center',
      });

    doc.end();

    await new Promise((resolve, reject) => {
      stream.on('finish', resolve);
      stream.on('error', reject);
    });

    console.log(`✅ PDF created: ${pdfPath}`);
    return pdfPath;

  } catch (error) {
    console.error('❌ PDF generation error:', error);
    throw error;
  }
}
```

### 4. FFmpeg Conversion

**lib/convert.ts**
```typescript
import ffmpeg from 'fluent-ffmpeg';
import ffmpegInstaller from '@ffmpeg-installer/ffmpeg';
import path from 'path';
import fs from 'fs/promises';

ffmpeg.setFfmpegPath(ffmpegInstaller.path);

export async function webmToMp4(recordingId: string): Promise<string | null> {
  const srcPath = path.join(process.cwd(), 'uploads/video', `${recordingId}.webm`);
  const dstPath = path.join(process.cwd(), 'uploads/mp4', `${recordingId}.mp4`);

  try {
    // Проверка существования
    await fs.access(srcPath);

    // Если MP4 уже есть
    try {
      await fs.access(dstPath);
      console.log(`✅ MP4 already exists: ${dstPath}`);
      return dstPath;
    } catch {
      // MP4 не существует, конвертируем
    }

    console.log(`🔄 Converting: ${srcPath} -> ${dstPath}`);

    await new Promise<void>((resolve, reject) => {
      ffmpeg(srcPath)
        .outputOptions([
          '-c:v libx264',
          '-preset veryfast',
          '-crf 23',
          '-c:a aac',
          '-b:a 192k',
          '-ar 44100',
          '-ac 2',
          '-movflags +faststart',
        ])
        .output(dstPath)
        .on('end', () => {
          console.log(`✅ Conversion complete: ${dstPath}`);
          resolve();
        })
        .on('error', (err) => {
          console.error(`❌ FFmpeg error: ${err.message}`);
          reject(err);
        })
        .run();
    });

    const stats = await fs.stat(dstPath);
    const sizeMB = stats.size / (1024 * 1024);
    console.log(`   File size: ${sizeMB.toFixed(2)} MB`);

    return dstPath;

  } catch (error) {
    console.error('❌ Conversion error:', error);
    return null;
  }
}

export async function getVideoInfo(recordingId: string) {
  const webmPath = path.join(process.cwd(), 'uploads/video', `${recordingId}.webm`);
  const mp4Path = path.join(process.cwd(), 'uploads/mp4', `${recordingId}.mp4`);

  const info = {
    recordingId,
    webmExists: false,
    mp4Exists: false,
    webmSizeMB: 0,
    mp4SizeMB: 0,
  };

  try {
    const webmStats = await fs.stat(webmPath);
    info.webmExists = true;
    info.webmSizeMB = webmStats.size / (1024 * 1024);
  } catch {}

  try {
    const mp4Stats = await fs.stat(mp4Path);
    info.mp4Exists = true;
    info.mp4SizeMB = mp4Stats.size / (1024 * 1024);
  } catch {}

  return info;
}
```

### 5. Solar Core Client

**lib/solar-core.ts**
```typescript
import { RecorderSyncRequest, RecorderSyncResponse } from './types';

export class SolarCoreClient {
  private baseUrl: string;
  private apiKey: string;
  private maxRetries: number = 3;

  constructor(
    baseUrl: string = process.env.SOLAR_CORE_URL || 'http://localhost:8010',
    apiKey: string = process.env.SOLAR_CORE_API_KEY || ''
  ) {
    this.baseUrl = baseUrl.replace(/\/$/, '');
    this.apiKey = apiKey;
  }

  async syncRecording(
    syncRequest: RecorderSyncRequest
  ): Promise<RecorderSyncResponse> {
    const endpoint = `${this.baseUrl}/api/v1/import/record`;

    console.log(`🔗 Syncing to Solar Core: ${endpoint}`);

    let lastError: Error | null = null;

    for (let attempt = 0; attempt < this.maxRetries; attempt++) {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            ...(this.apiKey && { Authorization: `Bearer ${this.apiKey}` }),
          },
          body: JSON.stringify({
            source: 'solar_recorder',
            version: '2.0.0',
            type: 'recording',
            data: syncRequest,
            timestamp: new Date().toISOString(),
          }),
        });

        if (response.ok) {
          const result = await response.json();
          console.log(`✅ Sync successful:`, result);
          return {
            status: 'synced',
            recordingId: syncRequest.id,
            solarCoreId: result.id,
            timestamp: new Date().toISOString(),
          };
        }

        const errorText = await response.text();
        console.warn(
          `⚠️ Attempt ${attempt + 1}/${this.maxRetries} failed: ${response.status} ${errorText}`
        );
        lastError = new Error(`HTTP ${response.status}: ${errorText}`);

      } catch (error) {
        console.warn(`⚠️ Attempt ${attempt + 1}/${this.maxRetries} failed:`, error);
        lastError = error as Error;
      }
    }

    throw new Error(
      `Failed to sync after ${this.maxRetries} attempts: ${lastError?.message}`
    );
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/health`, {
        method: 'GET',
        signal: AbortSignal.timeout(5000),
      });
      return response.ok;
    } catch {
      return false;
    }
  }
}
```

### 6. Storage & Metadata

**lib/storage.ts**
```typescript
import fs from 'fs/promises';
import path from 'path';
import { RecordingMetadata } from './types';

const METADATA_DIR = path.join(process.cwd(), 'uploads/metadata');

export async function saveMetadata(metadata: RecordingMetadata): Promise<void> {
  await fs.mkdir(METADATA_DIR, { recursive: true });
  
  const metadataPath = path.join(METADATA_DIR, `${metadata.id}.json`);
  await fs.writeFile(
    metadataPath,
    JSON.stringify(metadata, null, 2),
    'utf-8'
  );
}

export async function loadMetadata(
  recordingId: string
): Promise<RecordingMetadata | null> {
  try {
    const metadataPath = path.join(METADATA_DIR, `${recordingId}.json`);
    const content = await fs.readFile(metadataPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return null;
  }
}

export async function getAllMetadata(): Promise<RecordingMetadata[]> {
  await fs.mkdir(METADATA_DIR, { recursive: true });
  
  const files = await fs.readdir(METADATA_DIR);
  const metadataList: RecordingMetadata[] = [];

  for (const file of files) {
    if (file.endsWith('.json')) {
      const recordingId = file.replace('.json', '');
      const metadata = await loadMetadata(recordingId);
      if (metadata) {
        metadataList.push(metadata);
      }
    }
  }

  return metadataList.sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );
}

export async function deleteRecording(recordingId: string): Promise<void> {
  const metadata = await loadMetadata(recordingId);
  if (!metadata) {
    throw new Error('Recording not found');
  }

  // Удаляем все связанные файлы
  const filesToDelete = [
    metadata.videoPath,
    metadata.transcriptPath,
    metadata.pdfPath,
    metadata.translationPath,
    path.join(METADATA_DIR, `${recordingId}.json`),
    path.join(process.cwd(), 'uploads/mp4', `${recordingId}.mp4`),
  ].filter(Boolean);

  for (const filePath of filesToDelete) {
    try {
      await fs.unlink(filePath as string);
      console.log(`✓ Deleted: ${filePath}`);
    } catch (error) {
      console.warn(`Could not delete: ${filePath}`);
    }
  }

  // Удаляем директорию скриншотов
  const framesDir = path.join(process.cwd(), 'uploads/frames', recordingId);
  try {
    await fs.rm(framesDir, { recursive: true, force: true });
    console.log(`✓ Deleted frames: ${framesDir}`);
  } catch {}
}

// Background processing
export async function processRecording(
  recordingId: string,
  videoPath: string,
  filename: string
): Promise<void> {
  try {
    console.log(`📄 Processing recording: ${recordingId}`);

    // Импорты (dynamic для избежания циклических зависимостей)
    const { transcribeAudio } = await import('./transcribe');
    const { createPDF } = await import('./pdf');
    const { webmToMp4 } = await import('./convert');

    // 1. Транскрипция
    const { transcriptPath, detectedLanguage } = await transcribeAudio(videoPath);
    console.log(`✅ Transcription complete: ${detectedLanguage}`);

    // 2. PDF генерация
    const pdfPath = await createPDF(transcriptPath, filename);
    console.log(`✅ PDF generated: ${pdfPath}`);

    // 3. MP4 конвертация
    console.log(`🔄 Converting to MP4: ${recordingId}`);
    const mp4Path = await webmToMp4(recordingId);
    if (mp4Path) {
      console.log(`✅ MP4 conversion complete`);
    }

    // 4. Обновление метаданных
    const metadata = await loadMetadata(recordingId);
    if (metadata) {
      metadata.transcriptPath = transcriptPath;
      metadata.pdfPath = pdfPath;
      metadata.language = detectedLanguage;
      await saveMetadata(metadata);
      console.log(`✅ Metadata updated: ${recordingId}`);
    }

  } catch (error) {
    console.error(`❌ Processing error for ${recordingId}:`, error);
  }
}
```

### 7. TypeScript Types

**lib/types.ts**
```typescript
export interface RecordingMetadata {
  id: string;
  filename: string;
  createdAt: string;
  language?: string;
  duration?: number;
  videoPath: string;
  transcriptPath?: string;
  pdfPath?: string;
  translated: boolean;
  translationPath?: string;
  synced: boolean;
  syncStatus?: string;
  solarCoreId?: string;
  screenshots: Screenshot[];
}

export interface Screenshot {
  filename: string;
  timestamp: number;
  path: string;
  capturedAt: string;
  sizeBytes: number;
}

export interface RecorderSyncRequest {
  id: string;
  language: string;
  video: string;
  transcript: string;
  translation?: string;
  pdf: string;
  createdAt: string;
  duration?: number;
  fileSize?: number;
  segmentsCount?: number;
}

export interface RecorderSyncResponse {
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  recordingId: string;
  timestamp: string;
  solarCoreId?: string;
  message?: string;
  error?: string;
}

export interface TranslateRequest {
  recordingId: string;
  targetLanguage: string;
}
```

---

## 🚀 МИГРАЦИЯ: ПОШАГОВЫЙ ПЛАН

### Phase 1: Подготовка (1-2 часа)
- [ ] Создать новую структуру папок `src/app`
- [ ] Инициализировать `lib/` директорию
- [ ] Установить новые dependencies (package.json)
- [ ] Настроить TypeScript (tsconfig.json)
- [ ] Настроить Next.js (next.config.js)

### Phase 2: Перенос Frontend (2-3 часа)
- [ ] Переместить `frontend/app/` → `src/app/`
- [ ] Переместить `frontend/components/` → `src/app/components/`
- [ ] Обновить импорты (`@/` alias)
- [ ] Обновить API endpoints (`localhost:8000` → `/api/...`)

### Phase 3: Создание lib/ модулей (4-6 часов)
- [ ] `lib/types.ts` (Pydantic → TypeScript interfaces)
- [ ] `lib/storage.ts` (metadata management)
- [ ] `lib/convert.ts` (FFmpeg wrapper)
- [ ] `lib/pdf.ts` (PDF generation)
- [ ] `lib/translate.ts` (DeepSeek client)
- [ ] `lib/solar-core.ts` (Solar Core client)
- [ ] `lib/transcribe.ts` (Whisper wrapper - ВРЕМЕННО subprocess)

### Phase 4: API Route Handlers (6-8 часов)
- [ ] `app/api/upload/route.ts`
- [ ] `app/api/files/route.ts`
- [ ] `app/api/files/[id]/route.ts`
- [ ] `app/api/download/[id]/webm/route.ts`
- [ ] `app/api/download/[id]/mp4/route.ts`
- [ ] `app/api/download/[id]/pdf/route.ts`
- [ ] `app/api/translate/route.ts`
- [ ] `app/api/sync/route.ts`
- [ ] `app/api/sync/status/[id]/route.ts`
- [ ] `app/api/screenshot/route.ts`
- [ ] `app/api/health/route.ts`

### Phase 5: Тестирование (2-3 часа)
- [ ] Локальный запуск (`npm run dev`)
- [ ] Тест Upload + Processing
- [ ] Тест Transcription
- [ ] Тест PDF Generation
- [ ] Тест MP4 Conversion
- [ ] Тест Solar Core Sync
- [ ] Тест всех endpoints

### Phase 6: Очистка (1 час)
- [ ] Удалить `/backend` директорию
- [ ] Удалить `docker-compose.yml` (старый)
- [ ] Обновить README.md
- [ ] Обновить .gitignore
- [ ] Создать новый Dockerfile (опционально)

**Общее время:** ~16-23 часа

---

## 🗑️ ЧТО УДАЛИТЬ ПОСЛЕ МИГРАЦИИ

### Полностью удалить:
```
/backend/                              — Весь Python backend
  ├─ main.py
  ├─ transcribe.py
  ├─ translate.py
  ├─ pdf_generator.py
  ├─ convert.py
  ├─ solar_core_client.py
  ├─ sync_models.py
  ├─ mock_solar_core.py
  ├─ requirements.txt
  ├─ Dockerfile
  └─ README.md

/frontend/                             — Старая структура
  (всё переносится в src/app)

docker-compose.yml (старый)            — Заменить на новый (1 сервис)
```

### Сохранить временно (для Whisper):
```
scripts/transcribe.py                  — Python скрипт для Whisper
  (удалить после миграции на whisper-node)
```

---

## 📖 QUICK START (После Миграции)

### Development
```bash
# Установка зависимостей
npm install

# Настройка окружения
cp .env.example .env.local
# Заполнить:
# - DEEPSEEK_API_KEY
# - SOLAR_CORE_URL
# - SOLAR_CORE_API_KEY

# Запуск dev сервера
npm run dev

# Открыть в браузере
# http://localhost:3000
```

### Production Build
```bash
npm run build
npm start
```

### Docker (Опционально)
```bash
docker build -t dashka-record:2.0.0 .
docker run -p 3000:3000 dashka-record:2.0.0
```

---

## 🎨 НОВАЯ КОНФИГУРАЦИЯ

### next.config.js
```javascript
/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEEPSEEK_API_KEY: process.env.DEEPSEEK_API_KEY,
    SOLAR_CORE_URL: process.env.SOLAR_CORE_URL,
    SOLAR_CORE_API_KEY: process.env.SOLAR_CORE_API_KEY,
  },
  experimental: {
    serverActions: true,
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({
        'fluent-ffmpeg': 'commonjs fluent-ffmpeg',
      });
    }
    return config;
  },
};

module.exports = nextConfig;
```

### .env.local (example)
```env
# DeepSeek API
DEEPSEEK_API_KEY=your_deepseek_api_key_here

# Solar Core ERP
SOLAR_CORE_URL=http://localhost:8010
SOLAR_CORE_API_KEY=your_solar_core_api_key_here

# Whisper Model
WHISPER_MODEL=base
```

---

## ⚠️ РИСКИ И МИТИГАЦИЯ

| Риск | Вероятность | Воздействие | Митигация |
|------|------------|------------|-----------|
| **Whisper integration** | 🟡 Средняя | 🔴 Высокое | Использовать subprocess временно, затем whisper-node |
| **FFmpeg не установлен** | 🟢 Низкая | 🟡 Среднее | Использовать @ffmpeg-installer/ffmpeg |
| **Performance issues** | 🟡 Средняя | 🟡 Среднее | Background processing, chunked uploads |
| **Memory leaks** | 🟢 Низкая | 🟡 Среднее | Proper cleanup, stream handling |
| **PDF Cyrillic support** | 🟡 Средняя | 🟢 Низкое | Использовать шрифты с Unicode support |

---

## ✅ СТАТУС МИГРАЦИИ

| Компонент | Python (Backend) | TypeScript (Next.js) | Статус |
|-----------|-----------------|---------------------|--------|
| **Upload** | main.py | api/upload/route.ts | 🟢 Готово |
| **Transcribe** | transcribe.py | lib/transcribe.ts | 🟡 Subprocess |
| **PDF** | pdf_generator.py | lib/pdf.ts | 🟢 Готово |
| **Convert** | convert.py | lib/convert.ts | 🟢 Готово |
| **Translate** | translate.py | lib/translate.ts | 🟢 Готово |
| **Sync** | solar_core_client.py | lib/solar-core.ts | 🟢 Готово |
| **Storage** | main.py | lib/storage.ts | 🟢 Готово |
| **Types** | sync_models.py | lib/types.ts | 🟢 Готово |
| **API Routes** | FastAPI | Route Handlers | 🟢 Готово |
| **Frontend** | Next.js | Next.js | 🟢 Без изменений |

**Общий статус:** 🟡 **90% готово** (осталось только Whisper решение)

---

## 🚀 ПРЕИМУЩЕСТВА НОВОЙ АРХИТЕКТУРЫ

### 1. Упрощение
- ✅ Один язык (TypeScript)
- ✅ Один runtime (Node.js)
- ✅ Один сервер (Next.js)
- ✅ Один репозиторий

### 2. Производительность
- ✅ Edge Runtime опции
- ✅ Встроенный кэш
- ✅ Automatic code splitting
- ✅ Optimized bundling

### 3. Developer Experience
- ✅ Hot reload (frontend + backend)
- ✅ Type safety (end-to-end)
- ✅ Unified tooling
- ✅ Лучший DX

### 4. Deployment
- ✅ Один Docker контейнер
- ✅ Vercel ready (опционально)
- ✅ Простой CI/CD
- ✅ Меньше dependencies

### 5. Maintenance
- ✅ Меньше кода
- ✅ Проще тестирование
- ✅ Unified logging
- ✅ Easier debugging

---

## 📊 СРАВНЕНИЕ: До vs После

| Параметр | До (FastAPI + Next.js) | После (Next.js Monorepo) |
|----------|----------------------|-------------------------|
| **Языки** | Python + TypeScript | TypeScript only |
| **Runtimes** | Python + Node.js | Node.js only |
| **Серверы** | 2 (FastAPI + Next.js) | 1 (Next.js) |
| **Порты** | 3000, 8000 | 3000 only |
| **Docker контейнеры** | 2 | 1 |
| **Dependencies** | requirements.txt + package.json | package.json only |
| **API** | FastAPI decorators | Route Handlers |
| **Типизация** | Pydantic | TypeScript |
| **Hot Reload** | Partial | Full stack |
| **Deployment** | Complex | Simple |
| **Lines of code** | ~3000 | ~2500 (-17%) |

---

## 🎯 NEXT STEPS

### Immediate (Сегодня)
1. ✅ Создать plan миграции (ЭТОТ ДОКУМЕНТ)
2. ⏳ Утверждение от Dashka
3. ⏳ Review от Leanid

### Short-term (1-2 дня)
1. Создать новую структуру проекта
2. Перенести frontend без изменений
3. Создать все lib/ модули
4. Реализовать все API Route Handlers

### Mid-term (3-5 дней)
1. Тестирование всех функций
2. Оптимизация производительности
3. Документация обновления
4. Удаление старого backend

### Long-term (1-2 недели)
1. Миграция Whisper на whisper-node
2. Оптимизация Docker образа
3. CI/CD настройка
4. Production deployment

---

## 📚 ДОПОЛНИТЕЛЬНЫЕ РЕСУРСЫ

### Next.js Документация
- [Route Handlers](https://nextjs.org/docs/app/building-your-application/routing/route-handlers)
- [Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [API Routes Migration](https://nextjs.org/docs/app/building-your-application/upgrading/app-router-migration)

### Libraries
- [fluent-ffmpeg](https://github.com/fluent-ffmpeg/node-fluent-ffmpeg)
- [pdfkit](https://pdfkit.org/)
- [whisper-node](https://github.com/arihanv/whisper-node)
- [formidable](https://github.com/node-formidable/formidable)

---

**Статус:** 🟡 **PLAN READY - AWAITING APPROVAL**  
**Приоритет:** 🔴 **КРИТИЧЕСКИЙ**  
**Готово к началу:** ✅ **ДА**

**Команда:** Solar AI | IT | Team  
🚀 **Next.js — это и frontend, и backend. One runtime. One brain.**
