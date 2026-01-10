# 🔄 Руководство по миграции SolarRecord → SOLAR NextJS Template

## Обзор

Данный документ описывает пошаговый процесс интеграции функционала **SolarRecord** (запись видео/аудио с транскрипцией) в унифицированную структуру **SOLAR NextJS Template**.

---

## 📊 Сравнительный анализ структур

### Исходный проект: SolarRecord

```
SolarRecord/
├── lib/                          # Утилиты (7 файлов)
│   ├── convert.ts
│   ├── processing.ts
│   ├── solar-core.ts
│   ├── storage.ts
│   ├── transcribe.ts
│   ├── translate.ts
│   └── types.ts
├── scripts/
│   └── transcribe.py             # Python транскрипция
├── src/app/
│   ├── (products)/
│   │   ├── components/
│   │   │   ├── Recorder.tsx
│   │   │   └── ShareButton.tsx
│   │   ├── page.tsx
│   │   └── records/page.tsx
│   └── api/
│       ├── download/[id]/{mp4,pdf,webm}/
│       ├── files/[id]/
│       ├── health/
│       ├── screenshot/
│       ├── sync/
│       ├── translate/
│       └── upload/
└── uploads/                      # Локальное хранилище
```

### Целевой проект: solar-nextjs-template

```
solar-nextjs-template/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   ├── listings/
│   └── page.tsx
├── components/                   # Компоненты по категориям
│   ├── map/
│   ├── listings/
│   ├── mobile/
│   ├── sidebar/
│   └── ui/
├── config/                       # Конфигурация
├── docs/                         # Документация
├── hooks/                        # React hooks
├── lib/                          # Утилиты
├── prisma/                       # База данных
├── public/                       # Статические файлы
└── types/                        # TypeScript типы
```

---

## 🗂️ Схема маппинга файлов

| SolarRecord (источник) | solar-nextjs-template (цель) | Примечания |
|------------------------|------------------------------|------------|
| `lib/*.ts` | `lib/` | Объединить с существующими утилитами |
| `lib/types.ts` | `types/recording.ts` | Выделить типы в отдельную директорию |
| `src/app/(products)/components/` | `components/recording/` | Новая категория компонентов |
| `src/app/(products)/page.tsx` | `app/recording/page.tsx` | Переименовать раздел |
| `src/app/(products)/records/` | `app/recording/records/` | Вложенный роут |
| `src/app/api/*` | `app/api/recording/*` | Namespace для API |
| `scripts/transcribe.py` | `scripts/transcribe.py` | Копировать напрямую |
| `uploads/` | `uploads/` или Prisma/S3 | Решить по хранению |

---

## 📋 Пошаговая инструкция миграции

### Этап 1: Подготовка целевого проекта

```bash
# Клонируем целевой шаблон (если ещё не склонирован)
cd ~/projects
git clone <solar-nextjs-template-repo>
cd solar-nextjs-template

# Создаём ветку для миграции
git checkout -b feature/solarrecord-integration
```

### Этап 2: Создание структуры директорий

```bash
# Создаём необходимые директории
mkdir -p components/recording
mkdir -p app/recording/records
mkdir -p app/api/recording/download/[id]/mp4
mkdir -p app/api/recording/download/[id]/pdf
mkdir -p app/api/recording/download/[id]/webm
mkdir -p app/api/recording/files/[id]
mkdir -p app/api/recording/health
mkdir -p app/api/recording/screenshot
mkdir -p app/api/recording/sync
mkdir -p app/api/recording/translate
mkdir -p app/api/recording/upload
mkdir -p types
mkdir -p scripts
mkdir -p uploads/{frames,metadata,mp4,pdf,sync_logs,transcripts,video}
```

### Этап 3: Миграция библиотек (lib/)

#### 3.1 Копирование файлов утилит

```bash
# Из директории SolarRecord
cp lib/convert.ts      ../solar-nextjs-template/lib/recording-convert.ts
cp processing.ts recording-processing.ts
cp solar-core.ts recording-core.ts
cp storage.ts recording-storage.ts
cp transcribe.ts recording-transcribe.ts
cp translate.ts recording-translate.ts
```

#### 3.2 Миграция типов

Создайте файл `types/recording.ts`:

```typescript
// types/recording.ts
// Скопировать содержимое из SolarRecord/lib/types.ts

export interface Recording {
  id: string;
  filename: string;
  createdAt: Date;
  duration?: number;
  transcription?: string;
  translation?: string;
  status: RecordingStatus;
}

export type RecordingStatus = 
  | 'uploading' 
  | 'processing' 
  | 'transcribing' 
  | 'completed' 
  | 'error';

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

// ... остальные типы из lib/types.ts
```

#### 3.3 Обновление импортов Не сделал не понял в каком файле                               TODO

В каждом перенесённом файле обновите импорты:

```typescript
// До (SolarRecord)
import { Recording } from './types';

// После (solar-nextjs-template)
import { Recording } from '@/types/recording';
```

### Этап 4: Миграция компонентов

#### 4.1 Копирование React компонентов

```bash
cp Recorder.tsx components/recording/Recorder.tsx
cp ShareButton.tsx components/recording/ShareButton.tsx
```

#### 4.2 Создание индексного файла

```typescript
// components/recording/index.ts
export { default as Recorder } from './Recorder';
export { default as ShareButton } from './ShareButton';
```

#### 4.3 Обновление импортов в компонентах Не сделал не понял в каком файле                   TODO

```typescript
// components/recording/Recorder.tsx

// До
import { startRecording } from '../../../lib/solar-core';

// После  
import { startRecording } from '@/lib/recording-core';
```

### Этап 5: Миграция страниц (App Router)

#### 5.1 Главная страница записи

```bash
cp src/app/(products)/page.tsx ../solar-nextjs-template/app/recording/page.tsx
```

Обновите содержимое `app/recording/page.tsx`:

```typescript
// app/recording/page.tsx
import { Recorder, ShareButton } from '@/components/recording';

export const metadata = {
  title: 'Recording | SOLAR',
  description: 'Record and transcribe audio/video',
};

export default function RecordingPage() {
  return (
    <main className="container mx-auto py-8">
      <h1 className="text-3xl font-bold mb-6">Запись</h1>
      <Recorder />
    </main>
  );
}
```

#### 5.2 Страница списка записей

```bash
cp src/app/(products)/records/page.tsx ../solar-nextjs-template/app/recording/records/page.tsx
```

### Этап 6: Миграция API Routes

#### 6.1 Структура API

```
app/api/recording/
├── download/
│   └── [id]/
│       ├── mp4/route.ts
│       ├── pdf/route.ts
│       └── webm/route.ts
├── files/
│   ├── [id]/route.ts
│   └── route.ts
├── health/route.ts
├── screenshot/route.ts
├── sync/route.ts
├── translate/route.ts
└── upload/route.ts
```

#### 6.2 Копирование API routes

```bash
# Download routes
cp mp4/route.ts  mp4/route.ts
cp pdf/route.ts  pdf/route.ts
cp webm/route.ts webm/route.ts

# Other routes
cp files/route.ts       ../solar-nextjs-template/app/api/recording/files/route.ts
cp files/[id]/route.ts  ../solar-nextjs-template/app/api/recording/files/[id]/route.ts
cp src/app/api/health/route.ts      ../solar-nextjs-template/app/api/recording/health/route.ts
cp src/app/api/screenshot/route.ts  ../solar-nextjs-template/app/api/recording/screenshot/route.ts
cp src/app/api/sync/route.ts        ../solar-nextjs-template/app/api/recording/sync/route.ts
cp src/app/api/translate/route.ts   ../solar-nextjs-template/app/api/recording/translate/route.ts
cp src/app/api/upload/route.ts      ../solar-nextjs-template/app/api/recording/upload/route.ts
```

#### 6.3 Обновление API путей в коде Нашел в каждам файле b          нужна проверка           TODO

```typescript
// До
fetch('/api/upload', { ... }). ?????? 

// После
fetch('/api/recording/upload', { ... }) TODO 
```

### Этап 7: Миграция Python скриптов

```bash
cp scripts/transcribe.py ../solar-nextjs-template/scripts/transcribe.py
cp requirements.txt ../solar-nextjs-template/requirements.txt
```

### Этап 8: Миграция конфигурации

#### 8.1 Обновление package.json

Добавьте зависимости из SolarRecord в целевой `package.json`:

```json
{
  "dependencies": {
    // Существующие зависимости solar-nextjs-template
    "mapbox-gl": "^3.17.0",
    "prisma": "^5.22.0",
    
    // Добавить из SolarRecord (проверьте актуальные версии)
    "ffmpeg-static": "^5.x.x",
    "@google-cloud/speech": "^6.x.x",
    // ... другие зависимости для записи/транскрипции
  }
}
```

#### 8.2 Переменные окружения

Объедините `.env.local.example`:

```bash
# === SOLAR Template (существующие) ===
DATABASE_URL="postgresql://..."
NEXT_PUBLIC_MAPBOX_TOKEN="pk.xxx"

# === SolarRecord (добавить) ===
GOOGLE_CLOUD_PROJECT_ID="your-project"
GOOGLE_APPLICATION_CREDENTIALS="./credentials.json"
OPENAI_API_KEY="sk-xxx"
DEEPL_API_KEY="xxx"

# Storage
UPLOAD_DIR="./uploads"
MAX_FILE_SIZE="100mb"
```

### Этап 9: Обновление навигации

Добавьте ссылку на новый раздел в layout или навигационный компонент:

```typescript
// components/Navigation.tsx или app/layout.tsx  С 10 то или то здесь или то поставить или то я поставил и тот и тот файл проверить пожалуйста                                                     musst du, ChérieTODO

const navItems = [
  { href: '/', label: 'Главная' },
  { href: '/listings', label: 'Объекты' },
  { href: '/recording', label: 'Запись' },  // Добавить
];
```

### Этап 10: Интеграция с Prisma (опционально)

Если хотите хранить метаданные записей в БД вместо файловой системы:

```prisma
// prisma/schema.prisma

model Recording {
  id          String   @id @default(cuid())
  filename    String
  duration    Int?
  transcript  String?  @db.Text
  translation String?  @db.Text
  status      String   @default("uploading")
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Связь с пользователем (если есть auth)
  // userId      String?
  // user        User?    @relation(fields: [userId], references: [id])
}
```

Затем выполните миграцию:

```bash
npx prisma migrate dev --name add_recordings
npx prisma generate
```

---

## ✅ Чеклист миграции

- [ ] Создана ветка `feature/solarrecord-integration`
- [ ] Созданы все необходимые директории
- [ ] Перенесены файлы `lib/` с переименованием
- [ ] Типы вынесены в `types/recording.ts`
- [ ] Компоненты перенесены в `components/recording/`
- [ ] Страницы перенесены в `app/recording/`
- [ ] API routes перенесены в `app/api/recording/`
- [ ] Обновлены все импорты
- [ ] Обновлены API пути в клиентском коде
- [ ] Перенесены Python скрипты
- [ ] Объединены зависимости в `package.json`
- [ ] Объединены переменные окружения
- [ ] Добавлена навигация
- [ ] (Опционально) Создана Prisma модель
- [ ] Выполнен `pnpm install`
- [ ] Проект успешно собирается (`pnpm build`)
- [ ] Протестированы все функции записи
- [ ] Создан Pull Request

---

## 🧹 Пост-миграционная очистка

После успешной миграции можно:

1. Удалить старые audit/report файлы, если они не нужны:
   - `AUDIT_SUMMARY.md`
   - `PHASE_3_COMPLETE_REPORT.md`
   - `PHASE_3_SUMMARY.md`
   - `POST_CLEANUP_AUDIT.md`

2. Обновить README.md с информацией о новом функционале

3. Архивировать или удалить исходный репозиторий SolarRecord

---

## 📁 Финальная структура

После миграции структура solar-nextjs-template будет выглядеть:

```
solar-nextjs-template/
├── app/
│   ├── api/
│   │   ├── clusters/
│   │   ├── houses/
│   │   ├── recording/          # ✨ НОВОЕ
│   │   │   ├── download/[id]/
│   │   │   ├── files/
│   │   │   ├── health/
│   │   │   ├── screenshot/
│   │   │   ├── sync/
│   │   │   ├── translate/
│   │   │   └── upload/
│   │   └── ...
│   ├── listings/
│   ├── recording/              # ✨ НОВОЕ
│   │   ├── page.tsx
│   │   └── records/page.tsx
│   └── page.tsx
├── components/
│   ├── map/
│   ├── listings/
│   ├── recording/              # ✨ НОВОЕ
│   │   ├── Recorder.tsx
│   │   ├── ShareButton.tsx
│   │   └── index.ts
│   └── ui/
├── lib/
│   ├── clustering.ts
│   ├── db.ts
│   ├── recording-convert.ts    # ✨ НОВОЕ
│   ├── recording-core.ts       # ✨ НОВОЕ
│   ├── recording-processing.ts # ✨ НОВОЕ
│   ├── recording-storage.ts    # ✨ НОВОЕ
│   ├── recording-transcribe.ts # ✨ НОВОЕ
│   ├── recording-translate.ts  # ✨ НОВОЕ
│   └── utils.ts
├── scripts/
│   └── transcribe.py           # ✨ НОВОЕ
├── types/
│   ├── api.ts
│   ├── map.ts
│   └── recording.ts            # ✨ НОВОЕ
├── uploads/                    # ✨ НОВОЕ
│   ├── frames/
│   ├── metadata/
│   ├── mp4/
│   ├── pdf/
│   ├── sync_logs/
│   ├── transcripts/
│   └── video/
├── prisma/
│   └── schema.prisma           # Добавлена модель Recording
└── ...
```

---

## 🔧 Возможные проблемы и решения

### Проблема: Конфликт зависимостей

```bash
# Решение: использовать pnpm для лучшего управления зависимостями
pnpm install --force
```

### Проблема: Путь к uploads не найден

```typescript
// lib/recording-storage.ts
import path from 'path';

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(process.cwd(), 'uploads');
```

### Проблема: CORS при загрузке файлов

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/api/recording/:path*',
        headers: [
          { key: 'Access-Control-Allow-Origin', value: '*' },
          { key: 'Access-Control-Allow-Methods', value: 'GET,POST,PUT,DELETE' },
        ],
      },
    ];
  },
};
```

---

## 📞 Поддержка

При возникновении вопросов по миграции:

1. Проверьте чеклист выше
2. Убедитесь, что все импорты обновлены
3. Проверьте консоль браузера и серверные логи

---

*Документ создан: Январь 2026*
*Версия: 1.0*

Claudy когда будешь проверять проверь пожалуйста 4.3, 5.3, 6.3; везде везде где есть TODO