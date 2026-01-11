"use client";

interface ActionButtonsProps {
  recording: {
    id: string;
    filename: string;
    transcript_path?: string;
    pdf_path?: string;
    translated: boolean;
    translation_path?: string;
  };
  translatingId: string | null;
  onTranslate: (id: string) => void;
  onDownloadPDF: (id: string) => void;
}

export default function ActionButtons({
  recording,
  translatingId,
  onTranslate,
  onDownloadPDF,
}: ActionButtonsProps) {
  return (
    <div className="grid grid-cols-2 gap-2">
      {recording.transcript_path ? (
        <button
          onClick={() =>
            window.open(
              `/api/static/transcripts/${recording.id}.txt`,
              "_blank"
            )
          }
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 text-sm"
        >
          📝 Transcript
        </button>
      ) : (
        <button disabled className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm cursor-not-allowed">
          ⏳ Processing
        </button>
      )}

      {recording.transcript_path && !recording.translated ? (
        <button
          onClick={() => onTranslate(recording.id)}
          disabled={translatingId === recording.id}
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm"
        >
          🌐 {translatingId === recording.id ? "..." : "Translate"}
        </button>
      ) : recording.translated ? (
        <button
          onClick={() => {
            // TODO: language should come from API (not parsed from file path)
            const lang =
              recording.translation_path?.match(/_([a-z]{2})\.txt$/)?.[1] || "ru";

            window.open(
              `/api/static/transcripts/${recording.id}_${lang}.txt`,
              "_blank"
            );
          }}
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 text-sm"
        >
          🌐 Translation
        </button>
      ) : (
        <button disabled className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm cursor-not-allowed">
          🌐 Translate
        </button>
      )}

      {recording.pdf_path ? (
        <button
          onClick={() => onDownloadPDF(recording.id)}
          className="flex items-center justify-center px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 text-sm"
        >
          📄 PDF
        </button>
      ) : (
        <button disabled className="flex items-center justify-center px-4 py-2 rounded-lg bg-gray-100 text-gray-400 text-sm cursor-not-allowed">
          📄 PDF
        </button>
      )}
    </div>
  );
}