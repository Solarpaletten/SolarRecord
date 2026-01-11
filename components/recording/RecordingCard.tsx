"use client";
import type { Recording } from "@/types";
import RecordingHeader from "@/components/recording/RecordingHeader";
import RecordingMeta from "@/components/recording/RecordingMeta";
import ActionButtons from "@/components/recording/ActionButtons";
import RecordingDownloads from "@/components/recording/RecordingDownloads";
import RecordingSolarCore from "@/components/recording/RecordingSolarCore";
import ShareButton from "@/components/recording/ShareButton";
import DeleteButton from "@/components/recording/DeleteButton";


interface RecordingCardProps {
  recording: Recording;
  onDelete: (id: string) => void;
  onTranslate: (id: string) => void;
  onDownloadPDF: (id: string) => void;
  onDownloadMP4: (id: string) => void;
  onDownloadWebM: (id: string) => void;
}

export default function RecordingCard({
  recording,
  onDelete,
  onTranslate,
  onDownloadPDF,
  onDownloadMP4,
  onDownloadWebM,
}: RecordingCardProps) {

  return (
    <div className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow">

      <RecordingHeader
        id={recording.id}
        createdAt={recording.createdAt}
        synced={recording.synced}
      />

      <div className="p-4 space-y-3">
        <RecordingMeta
          language={recording.language}
          translated={recording.translated}
        />

        {/* Основные действия: Video, Transcript, Translate, PDF */}
        <ActionButtons
          recording={recording}
          translatingId={null}
          onTranslate={onTranslate}
          onDownloadPDF={onDownloadPDF}
        />

        {/* Загрузки: MP4, WebM */}
        <RecordingDownloads
          id={recording.id}
          onDownloadMP4={onDownloadMP4}
          onDownloadWebM={onDownloadWebM}
        />

        <div className="flex gap-2 pt-2">
          <ShareButton
            payload={{
              id: recording.id,
              language: recording.language,
              video_path: "",        // TODO: storage layer
              transcript_path: "",   // TODO: storage layer
              createdAt: recording.createdAt,
            }}
          />
          <DeleteButton id={recording.id} onDelete={onDelete} />
        </div>
        <RecordingSolarCore solar_core_id={recording.solar_core_id} />
      </div>
    </div>
  );
}