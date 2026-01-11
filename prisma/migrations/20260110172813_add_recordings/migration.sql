-- CreateTable
CREATE TABLE "recordings" (
    "id" UUID NOT NULL,
    "filename" VARCHAR(255) NOT NULL,
    "webm_path" TEXT NOT NULL,
    "mp4_path" TEXT,
    "transcript_path" TEXT,
    "subtitles_path" TEXT,
    "file_size_bytes" BIGINT,
    "duration_seconds" INTEGER,
    "language" VARCHAR(10),
    "language_confidence" DOUBLE PRECISION,
    "status" VARCHAR(50) NOT NULL DEFAULT 'uploaded',
    "processing_step" VARCHAR(100),
    "processing_message" TEXT,
    "translated" BOOLEAN NOT NULL DEFAULT false,
    "synced" BOOLEAN NOT NULL DEFAULT false,
    "error_step" TEXT,
    "error_message" TEXT,
    "error_at" TIMESTAMPTZ(6),
    "created_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMPTZ(6) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "recordings_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "recordings_created_at_idx" ON "recordings"("created_at");

-- CreateIndex
CREATE INDEX "recordings_status_idx" ON "recordings"("status");
