"use client";

interface RecordingMetaProps {
  language?: string;
  translated: boolean;
}

export default function RecordingMeta({
  language,
  translated,
}: RecordingMetaProps) {
  return (
    <div className="flex items-center gap-4 text-sm text-gray-600">
      {language && <span>🌍 {language.toUpperCase()}</span>}
      {translated && <span>✓ Translated</span>}
    </div>
  );
}
