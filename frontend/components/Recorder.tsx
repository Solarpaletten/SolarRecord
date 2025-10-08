"use client";
import { useState, useRef } from "react";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const router = useRouter();

  const startRecording = async () => {
    try {
      setError(null);
      
      // Request screen capture
      const stream = await navigator.mediaDevices.getDisplayMedia({
        video: { mediaSource: "screen" },
        audio: true
      });
      
      streamRef.current = stream;
      chunksRef.current = [];
      
      // Create MediaRecorder
      const recorder = new MediaRecorder(stream, {
        mimeType: "video/webm;codecs=vp8,opus"
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
        }
      };
      
      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        
        // Stop all tracks
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
        
        // Upload video
        await uploadVideo(blob);
      };
      
      recorder.onerror = (e) => {
        console.error("MediaRecorder error:", e);
        setError("Recording error occurred");
        setRecording(false);
      };
      
      // Handle user stopping share from browser UI
      stream.getVideoTracks()[0].onended = () => {
        if (recording) {
          stopRecording();
        }
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start(1000); // Collect data every second
      setRecording(true);
      
    } catch (err) {
      console.error("Error starting recording:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Screen recording permission denied");
        } else if (err.name === "NotFoundError") {
          setError("No screen capture source found");
        } else {
          setError(`Failed to start recording: ${err.message}`);
        }
      } else {
        setError("Failed to start recording");
      }
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const uploadVideo = async (blob: Blob) => {
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      
      const response = await fetch(`${API_URL}/upload`, {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      setRecordingId(data.recording_id);
      
      // Show success message
      console.log("Upload successful:", data);
      
    } catch (err) {
      console.error("Upload error:", err);
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const viewRecordings = () => {
    router.push("/records");
  };

  const resetRecording = () => {
    setVideoUrl(null);
    setRecordingId(null);
    setError(null);
    chunksRef.current = [];
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex flex-col items-center justify-center p-6">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-4xl w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-blue-600 mb-2">
            🎥 Solar Recorder
          </h1>
          <p className="text-gray-600">
            Local screen recording with AI-powered transcription
          </p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* Recording Controls */}
        <div className="flex flex-col items-center space-y-4 mb-8">
          {!videoUrl ? (
            <>
              <button
                onClick={recording ? stopRecording : startRecording}
                disabled={uploading}
                className={`
                  px-8 py-4 rounded-xl text-white font-semibold text-lg
                  transition-all duration-300 transform hover:scale-105
                  disabled:opacity-50 disabled:cursor-not-allowed
                  ${recording 
                    ? "bg-red-500 hover:bg-red-600 shadow-lg shadow-red-200" 
                    : "bg-blue-600 hover:bg-blue-700 shadow-lg shadow-blue-200"
                  }
                `}
              >
                {recording ? "⏹ Stop Recording" : "▶️ Start Recording"}
              </button>
              
              {recording && (
                <div className="flex items-center space-x-2 text-red-600 animate-pulse">
                  <div className="w-3 h-3 bg-red-600 rounded-full"></div>
                  <span className="font-medium">Recording in progress...</span>
                </div>
              )}
            </>
          ) : (
            <div className="flex space-x-4">
              <button
                onClick={resetRecording}
                className="px-6 py-3 rounded-lg bg-gray-500 hover:bg-gray-600 text-white font-semibold transition-all"
              >
                🔄 New Recording
              </button>
              <button
                onClick={viewRecordings}
                className="px-6 py-3 rounded-lg bg-blue-600 hover:bg-blue-700 text-white font-semibold transition-all"
              >
                📁 View All Recordings
              </button>
            </div>
          )}
          
          <button
            onClick={viewRecordings}
            className="text-blue-600 hover:text-blue-800 font-medium text-sm underline"
          >
            → Go to Recordings Library
          </button>
        </div>

        {/* Upload Status */}
        {uploading && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center space-x-3">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-blue-600"></div>
              <span className="text-blue-700 font-medium">
                Uploading and processing... This may take a moment.
              </span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {recordingId && !uploading && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">
              ✅ Recording uploaded successfully! Processing transcript in background.
            </p>
            <p className="text-green-600 text-sm mt-1">
              ID: {recordingId}
            </p>
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              📹 Recording Preview
            </h3>
            <video
              className="w-full rounded-lg shadow-lg border-2 border-gray-200"
              controls
              src={videoUrl}
            >
              Your browser does not support video playback.
            </video>
          </div>
        )}

        {/* Features List */}
        <div className="mt-8 pt-8 border-t border-gray-200">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            🌟 Features
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>Local storage - no cloud uploads</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>AI-powered transcription</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>Automatic language detection</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>PDF report generation</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>Optional translation</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>GDPR-compliant</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
