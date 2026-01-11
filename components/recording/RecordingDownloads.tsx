"use client";

interface RecordingDownloadsProps {
  id: string;
  onDownloadMP4: (id: string) => void;
  onDownloadWebM: (id: string) => void;
}

export default function RecordingDownloads({
  id,
  onDownloadMP4,
  onDownloadWebM,
}: RecordingDownloadsProps) {
  return (
    <div className="grid grid-cols-3 gap-2 pt-2 border-t">
      {/* Stream / Preview */}
      <button
        onClick={() => window.open(`/api/recording/download/${id}/webm`, "_blank")}
        className="flex items-center justify-center px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 text-sm"
      >
        ▶️ Video
      </button>

      {/* Downloads */}
      <button
        onClick={() => onDownloadMP4(id)}
        className="flex items-center justify-center px-4 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 text-sm"
      >
        📱 MP4
      </button>

      <button
        onClick={() => onDownloadWebM(id)}
        className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-700 text-sm"
      >
        💾 WebM
      </button>
    </div>
  );
}
