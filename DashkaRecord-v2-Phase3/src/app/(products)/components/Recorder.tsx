"use client";
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";

export default function Recorder() {
  const [recording, setRecording] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  
  const [recordingMode, setRecordingMode] = useState<"screen" | "tab">("screen");
  const [audioLevel, setAudioLevel] = useState(0);
  const [recordingTime, setRecordingTime] = useState(0);
  
  const [screenshots, setScreenshots] = useState<string[]>([]);
  const [screenshotCount, setScreenshotCount] = useState(0);
  const [capturingScreenshot, setCapturingScreenshot] = useState(false);
  const [showScreenshotSuccess, setShowScreenshotSuccess] = useState(false);
  
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<BlobPart[]>([]);
  const displayStreamRef = useRef<MediaStream | null>(null);
  const audioStreamRef = useRef<MediaStream | null>(null);
  
  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const timerIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const lastScreenshotTimeRef = useRef<number>(0);
  
  const router = useRouter();

  useEffect(() => {
    return () => {
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current);
      }
      if (timerIntervalRef.current) {
        clearInterval(timerIntervalRef.current);
      }
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
      screenshots.forEach(url => URL.revokeObjectURL(url));
    };
  }, []);

  const setupAudioMonitoring = (stream: MediaStream) => {
    try {
      const audioContext = new AudioContext();
      const analyser = audioContext.createAnalyser();
      const microphone = audioContext.createMediaStreamSource(stream);
      
      analyser.fftSize = 256;
      analyser.smoothingTimeConstant = 0.8;
      
      microphone.connect(analyser);
      
      audioContextRef.current = audioContext;
      analyserRef.current = analyser;
      
      updateAudioLevel();
    } catch (err) {
      console.error("Audio monitoring setup failed:", err);
    }
  };

  const updateAudioLevel = () => {
    if (!analyserRef.current) return;
    
    const dataArray = new Uint8Array(analyserRef.current.frequencyBinCount);
    analyserRef.current.getByteFrequencyData(dataArray);
    
    const average = dataArray.reduce((a, b) => a + b, 0) / dataArray.length;
    const normalized = Math.min(100, (average / 255) * 100);
    
    setAudioLevel(normalized);
    
    animationFrameRef.current = requestAnimationFrame(updateAudioLevel);
  };

  const startTimer = () => {
    setRecordingTime(0);
    timerIntervalRef.current = setInterval(() => {
      setRecordingTime(prev => prev + 1);
    }, 1000);
  };

  const stopTimer = () => {
    if (timerIntervalRef.current) {
      clearInterval(timerIntervalRef.current);
      timerIntervalRef.current = null;
    }
  };

  const formatTime = (seconds: number): string => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    
    if (hrs > 0) {
      return `${hrs}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const captureScreenshot = async () => {
    if (!recording || !displayStreamRef.current || !recordingId) {
      console.warn("⚠️ Cannot capture screenshot: recording not active");
      return;
    }

    const now = Date.now();
    if (now - lastScreenshotTimeRef.current < 1000) {
      console.warn("⚠️ Screenshot throttled - wait 1 second");
      return;
    }
    lastScreenshotTimeRef.current = now;

    try {
      setCapturingScreenshot(true);
      console.log("📸 Capturing screenshot...");

      const videoTrack = displayStreamRef.current.getVideoTracks()[0];
      
      if (typeof ImageCapture !== 'undefined') {
        const imageCapture = new ImageCapture(videoTrack);
        const bitmap = await imageCapture.grabFrame();
        
        const canvas = document.createElement('canvas');
        canvas.width = bitmap.width;
        canvas.height = bitmap.height;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context not available");
        
        ctx.drawImage(bitmap, 0, 0);
        
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        await uploadScreenshot(blob);
        
        const thumbnailUrl = URL.createObjectURL(blob);
        setScreenshots(prev => [...prev, thumbnailUrl]);
        setScreenshotCount(prev => prev + 1);
        
        setShowScreenshotSuccess(true);
        setTimeout(() => setShowScreenshotSuccess(false), 1000);
        
        console.log("✅ Screenshot captured successfully");
        
      } else {
        console.log("⚠️ ImageCapture not available, using Canvas fallback");
        
        const video = document.createElement('video');
        video.srcObject = displayStreamRef.current;
        video.muted = true;
        
        await new Promise((resolve) => {
          video.onloadedmetadata = resolve;
          video.play();
        });
        
        const canvas = document.createElement('canvas');
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
        
        const ctx = canvas.getContext('2d');
        if (!ctx) throw new Error("Canvas context not available");
        
        ctx.drawImage(video, 0, 0);
        
        const blob = await new Promise<Blob>((resolve) => {
          canvas.toBlob((b) => resolve(b!), 'image/png');
        });
        
        video.pause();
        video.srcObject = null;
        
        await uploadScreenshot(blob);
        
        const thumbnailUrl = URL.createObjectURL(blob);
        setScreenshots(prev => [...prev, thumbnailUrl]);
        setScreenshotCount(prev => prev + 1);
        
        setShowScreenshotSuccess(true);
        setTimeout(() => setShowScreenshotSuccess(false), 1000);
        
        console.log("✅ Screenshot captured (fallback method)");
      }
      
    } catch (err) {
      console.error("❌ Screenshot capture error:", err);
      setError("Screenshot capture failed");
    } finally {
      setCapturingScreenshot(false);
    }
  };

  const uploadScreenshot = async (blob: Blob) => {
    try {
      const formData = new FormData();
      const timestamp = Date.now();
      const filename = `screenshot_${timestamp}.png`;
      
      formData.append('file', blob, filename);
      formData.append('recording_id', recordingId!);
      formData.append('timestamp', recordingTime.toString());
      
      console.log(`📤 Uploading screenshot: ${filename} (${blob.size} bytes)`);
      
      const response = await fetch('/api/screenshot', {
        method: 'POST',
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Screenshot upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      console.log("✅ Screenshot uploaded:", data);
      
    } catch (err) {
      console.error("❌ Screenshot upload error:", err);
      throw err;
    }
  };

  const startRecording = async () => {
    try {
      setError(null);
      
      console.log("🎬 Starting recording...");
      console.log("Mode:", recordingMode);
      
      const captureTabAudio = recordingMode === "tab";
      
      const displayStream = await navigator.mediaDevices.getDisplayMedia({
        video: {
          width: { ideal: 1920 },
          height: { ideal: 1080 },
          frameRate: { ideal: 30 }
        },
        audio: captureTabAudio ? {
          echoCancellation: true,
          noiseSuppression: true
        } : false
      });
      
      console.log("✅ Display stream obtained");
      
      const audioStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
          sampleRate: 48000,
          channelCount: 2
        }
      });
      
      console.log("✅ Audio stream obtained");
      
      setupAudioMonitoring(audioStream);
      startTimer();
      
      const videoTracks = displayStream.getVideoTracks();
      const tabAudioTracks = displayStream.getAudioTracks();
      const micAudioTracks = audioStream.getAudioTracks();
      
      const combinedStream = new MediaStream([
        ...videoTracks,
        ...tabAudioTracks,
        ...micAudioTracks
      ]);
      
      console.log("✅ Combined stream created:", {
        videoTracks: videoTracks.length,
        tabAudioTracks: tabAudioTracks.length,
        micAudioTracks: micAudioTracks.length
      });
      
      displayStreamRef.current = displayStream;
      audioStreamRef.current = audioStream;
      chunksRef.current = [];
      
      const recorder = new MediaRecorder(combinedStream, {
        mimeType: "video/webm;codecs=vp8,opus",
        videoBitsPerSecond: 2500000,
        audioBitsPerSecond: 128000
      });
      
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) {
          chunksRef.current.push(e.data);
          console.log(`📦 Chunk received: ${e.data.size} bytes`);
        }
      };
      
      recorder.onstop = async () => {
        console.log("🛑 Recording stopped");
        stopTimer();
        
        if (animationFrameRef.current) {
          cancelAnimationFrame(animationFrameRef.current);
        }
        
        if (audioContextRef.current) {
          audioContextRef.current.close();
        }
        
        const blob = new Blob(chunksRef.current, { type: "video/webm" });
        const url = URL.createObjectURL(blob);
        setVideoUrl(url);
        
        console.log(`✅ Video blob created: ${blob.size} bytes`);
        
        stopAllStreams();
        await uploadVideo(blob);
      };
      
      recorder.onerror = (e) => {
        console.error("❌ MediaRecorder error:", e);
        setError("Recording error occurred");
        setRecording(false);
        stopTimer();
        stopAllStreams();
      };
      
      displayStream.getVideoTracks()[0].onended = () => {
        console.log("📺 Screen sharing ended by user");
        if (recording) {
          stopRecording();
        }
      };
      
      mediaRecorderRef.current = recorder;
      recorder.start(1000);
      setRecording(true);
      console.log("▶️ Recording started!");
      
    } catch (err) {
      console.error("❌ Error starting recording:", err);
      if (err instanceof Error) {
        if (err.name === "NotAllowedError") {
          setError("Permission denied. Please allow screen and microphone access.");
        } else if (err.name === "NotFoundError") {
          setError("No screen or microphone found");
        } else {
          setError(`Failed to start recording: ${err.message}`);
        }
      } else {
        setError("Failed to start recording");
      }
      stopAllStreams();
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== "inactive") {
      mediaRecorderRef.current.stop();
    }
    setRecording(false);
  };

  const stopAllStreams = () => {
    if (displayStreamRef.current) {
      displayStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🔌 Stopped display track: ${track.kind}`);
      });
      displayStreamRef.current = null;
    }
    
    if (audioStreamRef.current) {
      audioStreamRef.current.getTracks().forEach(track => {
        track.stop();
        console.log(`🔌 Stopped audio track: ${track.kind}`);
      });
      audioStreamRef.current = null;
    }
  };

  const uploadVideo = async (blob: Blob) => {
    try {
      setUploading(true);
      setError(null);
      
      const formData = new FormData();
      formData.append("file", blob, "recording.webm");
      
      console.log(`📤 Uploading ${blob.size} bytes...`);
      
      const response = await fetch('/api/upload', {
        method: "POST",
        body: formData
      });
      
      if (!response.ok) {
        throw new Error(`Upload failed: ${response.status}`);
      }
      
      const data = await response.json();
      setRecordingId(data.recording_id);
      
      console.log("✅ Upload successful:", data);
      
    } catch (err) {
      console.error("❌ Upload error:", err);
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
    setRecordingTime(0);
    setAudioLevel(0);
    screenshots.forEach(url => URL.revokeObjectURL(url));
    setScreenshots([]);
    setScreenshotCount(0);
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
          <p className="text-sm text-gray-500 mt-1">v2.0.0-alpha</p>
        </div>

        {/* Error Display */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
            <p className="text-red-700 text-sm">⚠️ {error}</p>
          </div>
        )}

        {/* Recording Mode Selector */}
        {!recording && !videoUrl && (
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm font-semibold text-gray-700 mb-3">📹 Recording Mode:</p>
            <div className="flex flex-col space-y-3">
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="mode"
                  value="screen"
                  checked={recordingMode === "screen"}
                  onChange={(e) => setRecordingMode(e.target.value as "screen")}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">
                    🖥️ Entire Screen + Microphone
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Record full screen with your voice commentary
                  </p>
                </div>
              </label>
              
              <label className="flex items-start space-x-3 cursor-pointer group">
                <input
                  type="radio"
                  name="mode"
                  value="tab"
                  checked={recordingMode === "tab"}
                  onChange={(e) => setRecordingMode(e.target.value as "tab")}
                  className="w-5 h-5 text-blue-600 mt-0.5"
                />
                <div className="flex-1">
                  <div className="font-medium text-gray-800 group-hover:text-blue-600">
                    🔖 Browser Tab + Audio
                  </div>
                  <p className="text-xs text-gray-600 mt-1">
                    Capture tab audio (music/video) + microphone
                  </p>
                </div>
              </label>
            </div>
            <div className="mt-3 p-2 bg-yellow-50 border border-yellow-200 rounded text-xs text-yellow-800">
              💡 <strong>Tip:</strong> Choose "Browser Tab" to record system audio from YouTube, Spotify, etc.
            </div>
          </div>
        )}

        {/* Recording Status Panel with VU Meter and Timer */}
        {recording && (
          <div className="mb-6 p-6 bg-gradient-to-r from-red-50 to-pink-50 border-2 border-red-300 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="w-4 h-4 bg-red-600 rounded-full animate-pulse"></div>
                <span className="font-bold text-red-700 text-lg">Recording in progress</span>
              </div>
              <div className="text-3xl font-mono font-bold text-gray-800 tabular-nums">
                {formatTime(recordingTime)}
              </div>
            </div>
            
            {/* VU Meter */}
            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span className="flex items-center space-x-2">
                  <span>🎤</span>
                  <span>Microphone Level</span>
                </span>
                <span className="font-mono tabular-nums">{Math.round(audioLevel)}%</span>
              </div>
              <div className="w-full h-4 bg-gray-200 rounded-full overflow-hidden shadow-inner">
                <div
                  className={`h-full transition-all duration-100 ${
                    audioLevel > 70 ? 'bg-red-500' :
                    audioLevel > 40 ? 'bg-yellow-500' :
                    audioLevel > 10 ? 'bg-green-500' :
                    'bg-gray-400'
                  }`}
                  style={{ width: `${audioLevel}%` }}
                ></div>
              </div>
              <p className="text-xs text-gray-500 text-center">
                {audioLevel < 10 ? '🔇 Speak louder for better audio quality' :
                 audioLevel > 70 ? '🔊 Good level!' :
                 '✓ Audio detected'}
              </p>
            </div>
            
            {/* Screenshot Button */}
            <div className="flex items-center justify-center space-x-4">
              <button
                onClick={captureScreenshot}
                disabled={capturingScreenshot}
                className={`
                  px-6 py-3 rounded-lg font-semibold text-white
                  transition-all duration-300 transform
                  ${capturingScreenshot 
                    ? 'bg-gray-400 cursor-not-allowed' 
                    : 'bg-purple-600 hover:bg-purple-700 hover:scale-105 shadow-lg'
                  }
                  ${showScreenshotSuccess ? 'animate-pulse' : ''}
                `}
              >
                📷 {capturingScreenshot ? 'Capturing...' : 'Screenshot'}
                {screenshotCount > 0 && (
                  <span className="ml-2 px-2 py-1 bg-white text-purple-600 rounded-full text-xs font-bold">
                    {screenshotCount}
                  </span>
                )}
              </button>
            </div>
            
            {/* Screenshot Success Animation */}
            {showScreenshotSuccess && (
              <div className="mt-3 text-center">
                <span className="inline-block px-4 py-2 bg-green-100 text-green-700 rounded-full text-sm font-semibold animate-bounce">
                  ✅ Screenshot saved!
                </span>
              </div>
            )}
            
            <div className="mt-3 text-sm text-red-600 text-center">
              {recordingMode === "tab" ? "🎵 Recording tab audio + microphone" : "🎙️ Recording screen + microphone"}
            </div>
          </div>
        )}

        {/* Screenshot Thumbnails */}
        {screenshots.length > 0 && (
          <div className="mb-6 p-4 bg-purple-50 border border-purple-200 rounded-lg">
            <h3 className="text-sm font-semibold text-gray-700 mb-3 flex items-center justify-between">
              <span>📸 Captured Screenshots</span>
              <span className="text-xs bg-purple-200 text-purple-700 px-2 py-1 rounded-full">
                {screenshots.length} {screenshots.length === 1 ? 'screenshot' : 'screenshots'}
              </span>
            </h3>
            <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
              {screenshots.map((url, idx) => (
                <div key={idx} className="relative group">
                  <img
                    src={url}
                    alt={`Screenshot ${idx + 1}`}
                    className="w-full h-20 object-cover rounded border-2 border-purple-200 group-hover:border-purple-400 transition-all cursor-pointer"
                    onClick={() => window.open(url, '_blank')}
                  />
                  <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all rounded flex items-center justify-center">
                    <span className="text-white opacity-0 group-hover:opacity-100 text-xs">🔍 View</span>
                  </div>
                </div>
              ))}
            </div>
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
                Uploading and processing...
              </span>
            </div>
          </div>
        )}

        {/* Success Message */}
        {recordingId && !uploading && (
          <div className="mb-6 p-4 bg-green-50 border border-green-200 rounded-lg">
            <p className="text-green-700 font-medium">
              ✅ Recording uploaded! Processing in background.
            </p>
            <p className="text-green-600 text-sm mt-1">
              ID: {recordingId} • Duration: {formatTime(recordingTime)}
              {screenshotCount > 0 && ` • Screenshots: ${screenshotCount}`}
            </p>
          </div>
        )}

        {/* Video Preview */}
        {videoUrl && (
          <div className="mt-6">
            <h3 className="text-xl font-semibold text-gray-800 mb-4">
              🎬 Recording Preview (WebM)
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
          <h3 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <span>🌟 Features</span>
            <span className="text-xs bg-purple-100 text-purple-700 px-2 py-1 rounded-full">
              v2.0.0-alpha
            </span>
          </h3>
          <ul className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-gray-600">
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>Local storage - no cloud uploads</span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span><strong>Real-time VU meter</strong></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span><strong>Recording timer (MM:SS)</strong></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-green-600">✓</span>
              <span><strong>Dual recording modes</strong></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-purple-600">✓</span>
              <span><strong>Live screenshot capture 📸</strong></span>
            </li>
            <li className="flex items-start space-x-2">
              <span className="text-blue-600">✓</span>
              <span>AI-powered transcription (coming soon)</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
}
