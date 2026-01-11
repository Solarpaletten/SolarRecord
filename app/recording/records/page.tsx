"use client";
import { useEffect, useState } from "react";
import RecordingCard from "@/components/recording/RecordingCard";

export default function RecordsPage() {
  const [recordings, setRecordings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/recording/files")
      .then(res => {
        if (!res.ok) throw new Error("Failed to fetch");
        return res.json();
      })
      .then(data => {
        setRecordings(data);
        setLoading(false);
      })
      .catch(err => {
        console.error(err);
        setError(err.message);
        setLoading(false);
      });
  }, []);

  const deleteRecording = async (id: string) => {
    if (!confirm("Delete this recording?")) return;
    try {
      const res = await fetch(`/api/recording/files/${id}`, { method: "DELETE" });
      if (res.ok) {
        setRecordings(prev => prev.filter(r => r.id !== id));
      }
    } catch (err) {
      console.error("Delete failed:", err);
    }
  };

  const translateRecording = async (id: string) => {
    try {
      const res = await fetch("/api/recording/translate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id }),
      });
      if (res.ok) {
        // Refresh list
        const updated = await fetch("/api/recording/files").then(r => r.json());
        setRecordings(updated);
      }
    } catch (err) {
      console.error("Translate failed:", err);
    }
  };

  const downloadPDF = (id: string) => {
    window.open(`/api/recording/download/${id}/pdf`, "_blank");
  };

  const downloadMP4 = (id: string) => {
    window.open(`/api/recording/download/${id}/mp4`, "_blank");
  };

  const downloadWebM = (id: string) => {
    window.open(`/api/recording/download/${id}/webm`, "_blank");
  };

  if (loading) return <div className="p-6 text-center">Loading recordings...</div>;
  if (error) return <div className="p-6 text-red-500">Error: {error}</div>;
  if (recordings.length === 0) return (
    <div className="p-6 text-center">
      <p className="text-gray-500">No recordings yet</p>
      <a href="/recording" className="text-blue-600 hover:underline mt-2 inline-block">
        → Create your first recording
      </a>
    </div>
  );

  return (
    <div className="p-6 space-y-4">
      <div className="flex justify-between items-center mb-4">
        <h1 className="text-2xl font-bold text-gray-800">📁 Recordings Library</h1>
        <a
          href="/recording"
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          + New Recording
        </a>
      </div>
      {recordings.map((recording) => (
        <RecordingCard
          key={recording.id}
          recording={recording}
          onDelete={deleteRecording}
          onTranslate={translateRecording}
          onDownloadPDF={downloadPDF}
          onDownloadMP4={downloadMP4}
          onDownloadWebM={downloadWebM}
        />
      ))}
    </div>
  );
}