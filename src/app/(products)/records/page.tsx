"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import ShareButton from "../components/ShareButton";

interface Recording {
  id: string;
  filename: string;
  created_at: string;
  language?: string;
  duration?: number;
  video_path: string;
  transcript_path?: string;
  pdf_path?: string;
  translated: boolean;
  translation_path?: string;
  synced?: boolean;
  sync_status?: string;
  solar_core_id?: string;
}

export default function RecordsPage() {
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [translating, setTranslating] = useState<string | null>(null);
  const router = useRouter();

  useEffect(() => {
    fetchRecordings();
  }, []);

  const fetchRecordings = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/files');
      
      if (!response.ok) {
        throw new Error(`Failed to fetch recordings: ${response.status}`);
      }
      
      const data = await response.json();
      setRecordings(data);
      
    } catch (err) {
      console.error("Fetch error:", err);
      setError(err instanceof Error ? err.message : "Failed to load recordings");
    } finally {
      setLoading(false);
    }
  };

  const translateRecording = async (recordingId: string, targetLang: string = "ru") => {
    try {
      setTranslating(recordingId);
      
      const response = await fetch('/api/translate', {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ recording_id: recordingId, target_language: targetLang })
      });
      
      if (!response.ok) {
        throw new Error("Translation failed");
      }
      
      await fetchRecordings();
      
    } catch (err) {
      console.error("Translation error:", err);
      alert("Translation failed. Please try again.");
    } finally {
      setTranslating(null);
    }
  };

  const deleteRecording = async (recordingId: string) => {
    if (!confirm("Are you sure you want to delete this recording?")) {
      return;
    }
    
    try {
      const response = await fetch(`/api/files/${recordingId}`, {
        method: "DELETE"
      });
      
      if (!response.ok) {
        throw new Error("Deletion failed");
      }
      
      await fetchRecordings();
      
    } catch (err) {
      console.error("Delete error:", err);
      alert("Failed to delete recording. Please try again.");
    }
  };

  const downloadPDF = (recordingId: string) => {
    window.open(`/api/download/${recordingId}/pdf`, "_blank");
  };

  const downloadMP4 = (recordingId: string) => {
    window.open(`/api/download/${recordingId}/mp4`, "_blank");
  };

  const downloadWebM = (recordingId: string) => {
    window.open(`/api/download/${recordingId}/webm`, "_blank");
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit"
    });
  };

  const getStatusBadge = (recording: Recording) => {
    if (recording.transcript_path && recording.pdf_path) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
          ✓ Ready
        </span>
      );
    } else if (recording.transcript_path) {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-yellow-100 text-yellow-800">
          ⏳ Processing PDF
        </span>
      );
    } else {
      return (
        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">
          ⏳ Transcribing
        </span>
      );
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="bg-white rounded-2xl shadow-lg p-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-blue-600 mb-2">
                📁 Recordings Library
              </h1>
              <p className="text-gray-600">
                Manage your screen recordings and transcripts
              </p>
            </div>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
            >
              ➕ New Recording
            </button>
          </div>
        </div>

        {/* Error Display */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <p className="text-red-700">⚠️ {error}</p>
            <button
              onClick={fetchRecordings}
              className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
            >
              Try again
            </button>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading recordings...</p>
          </div>
        )}

        {/* Empty State */}
        {!loading && recordings.length === 0 && (
          <div className="bg-white rounded-lg shadow p-12 text-center">
            <div className="text-6xl mb-4">🎥</div>
            <h2 className="text-2xl font-semibold text-gray-800 mb-2">
              No recordings yet
            </h2>
            <p className="text-gray-600 mb-6">
              Start by creating your first screen recording
            </p>
            <button
              onClick={() => router.push("/")}
              className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
            >
              Create Recording
            </button>
          </div>
        )}

        {/* Recordings Grid */}
        {!loading && recordings.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {recordings.map((recording) => (
              <div
                key={recording.id}
                className="bg-white rounded-xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
              >
                {/* Card Header */}
                <div className="bg-gradient-to-r from-blue-500 to-indigo-600 p-4 text-white">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="font-semibold text-lg truncate">
                      Recording {recording.id}
                    </h3>
                    <div className="flex gap-2">
                      {getStatusBadge(recording)}
                      {recording.synced && (
                        <span className="px-2 py-1 text-xs font-semibold rounded-full bg-white bg-opacity-20 text-white">
                          🔗 Synced
                        </span>
                      )}
                    </div>
                  </div>
                  <p className="text-blue-100 text-sm">
                    {formatDate(recording.created_at)}
                  </p>
                </div>

                {/* Card Body */}
                <div className="p-4 space-y-3">
                  {/* Metadata */}
                  <div className="flex items-center space-x-4 text-sm text-gray-600">
                    {recording.language && (
                      <span className="flex items-center space-x-1">
                        <span>🌍</span>
                        <span>{recording.language.toUpperCase()}</span>
                      </span>
                    )}
                    {recording.translated && (
                      <span className="flex items-center space-x-1">
                        <span>✓</span>
                        <span>Translated</span>
                      </span>
                    )}
                  </div>

                  {/* Actions Grid */}
                  <div className="grid grid-cols-2 gap-2">
                    {/* View Video */}
                    <a
                      href={`/api/static/video/${recording.filename}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium transition-all text-sm"
                    >
                      <span>▶️</span>
                      <span>Video</span>
                    </a>

                    {/* View Transcript */}
                    {recording.transcript_path ? (
                      <button
                        onClick={() => {
                          window.open(`/api/static/transcripts/${recording.id}.txt`, "_blank");
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-green-50 hover:bg-green-100 text-green-700 font-medium transition-all text-sm"
                      >
                        <span>📝</span>
                        <span>Transcript</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed"
                      >
                        <span>⏳</span>
                        <span>Processing</span>
                      </button>
                    )}

                    {/* Translate */}
                    {recording.transcript_path && !recording.translated ? (
                      <button
                        onClick={() => translateRecording(recording.id)}
                        disabled={translating === recording.id}
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-all text-sm disabled:opacity-50"
                      >
                        <span>🌐</span>
                        <span>{translating === recording.id ? "..." : "Translate"}</span>
                      </button>
                    ) : recording.translated ? (
                      <button
                        onClick={() => {
                          const langCode = recording.translation_path?.match(/_([a-z]{2})\.txt$/)?.[1] || "ru";
                          window.open(`/api/static/transcripts/${recording.id}_${langCode}.txt`, "_blank");
                        }}
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium transition-all text-sm"
                      >
                        <span>🌐</span>
                        <span>Translation</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed"
                      >
                        <span>🌐</span>
                        <span>Translate</span>
                      </button>
                    )}

                    {/* Download PDF */}
                    {recording.pdf_path ? (
                      <button
                        onClick={() => downloadPDF(recording.id)}
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-red-50 hover:bg-red-100 text-red-700 font-medium transition-all text-sm"
                      >
                        <span>📄</span>
                        <span>PDF</span>
                      </button>
                    ) : (
                      <button
                        disabled
                        className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-100 text-gray-400 font-medium text-sm cursor-not-allowed"
                      >
                        <span>📄</span>
                        <span>PDF</span>
                      </button>
                    )}
                  </div>

                  {/* Download Row - MP4 и WebM */}
                  <div className="grid grid-cols-2 gap-2 pt-2 border-t border-gray-200">
                    <button
                      onClick={() => downloadMP4(recording.id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-orange-50 hover:bg-orange-100 text-orange-700 font-medium transition-all text-sm"
                      title="Download MP4 (Telegram compatible)"
                    >
                      <span>📱</span>
                      <span>MP4</span>
                    </button>
                    
                    <button
                      onClick={() => downloadWebM(recording.id)}
                      className="flex items-center justify-center space-x-2 px-4 py-2 rounded-lg bg-gray-50 hover:bg-gray-100 text-gray-700 font-medium transition-all text-sm"
                      title="Download WebM (original)"
                    >
                      <span>💾</span>
                      <span>WebM</span>
                    </button>
                  </div>

                  {/* Share & Delete Row */}
                  <div className="flex gap-2 pt-2">
                    <ShareButton recording={recording} />
                    
                    <button
                      onClick={() => deleteRecording(recording.id)}
                      className="flex-1 px-4 py-2 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-600 hover:text-red-600 font-medium transition-all text-sm"
                    >
                      🗑️ Delete
                    </button>
                  </div>

                  {/* Solar Core Sync Info */}
                  {recording.solar_core_id && (
                    <div className="pt-3 border-t border-gray-200">
                      <div className="flex items-center justify-between text-xs">
                        <span className="text-gray-500">Solar Core ID:</span>
                        <span className="font-mono text-blue-600">{recording.solar_core_id}</span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats Footer */}
        {!loading && recordings.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4 text-center text-gray-600">
            <p>
              Total Recordings: <span className="font-semibold text-blue-600">{recordings.length}</span>
              {recordings.filter(r => r.synced).length > 0 && (
                <span className="ml-4">
                  Synced: <span className="font-semibold text-green-600">{recordings.filter(r => r.synced).length}</span>
                </span>
              )}
            </p>
          </div>
        )}

        {/* Info Banner про MP4 */}
        <div className="mt-6 bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow-lg p-6 text-white">
          <h3 className="text-lg font-semibold mb-2">💡 Tip for Telegram</h3>
          <p className="text-sm text-orange-50">
            Use the <strong>"MP4"</strong> button to download videos that work in Telegram, WhatsApp, and on iPhone. 
            WebM files are original quality but may not work in some apps.
          </p>
        </div>
      </div>
    </div>
  );
}
