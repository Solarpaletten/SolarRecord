from fastapi import FastAPI, UploadFile, File, Form, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List, Dict
import os
import json
from datetime import datetime
from transcribe import transcribe_audio
from translate import translate_text
from pdf_generator import create_pdf

# НОВОЕ: Import для merge
from convert import webm_to_mp4, get_video_info, merge_tracks_and_convert

# Sprint #2: Import sync modules
from sync_models import (
    RecorderSyncRequest,
    RecorderSyncResponse,
    SyncStatus,
    SyncLog
)
from solar_core_client import SolarCoreClient, SyncLogger

app = FastAPI(title="Solar Recorder API", version="1.2.4-beta")

# CORS Configuration
CORS_ORIGINS = os.getenv("CORS_ORIGINS", "http://localhost:3000").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_methods=["*"],
    allow_headers=["*"],
    allow_credentials=True
)

# Directories
UPLOAD_DIR = "uploads/video"
TRANSCRIPT_DIR = "uploads/transcripts"
PDF_DIR = "uploads/pdf"
METADATA_DIR = "uploads/metadata"
SYNC_LOG_DIR = "uploads/sync_logs"
MP4_DIR = "uploads/mp4"
FRAMES_DIR = "uploads/frames"  # 📸 НОВОЕ: директория для скриншотов

for directory in [UPLOAD_DIR, TRANSCRIPT_DIR, PDF_DIR, METADATA_DIR, SYNC_LOG_DIR, MP4_DIR, FRAMES_DIR]:
    os.makedirs(directory, exist_ok=True)

# Mount static files
app.mount("/static/video", StaticFiles(directory=UPLOAD_DIR), name="video")
app.mount("/static/pdf", StaticFiles(directory=PDF_DIR), name="pdf")
app.mount("/static/transcripts", StaticFiles(directory=TRANSCRIPT_DIR), name="transcripts")
app.mount("/static/frames", StaticFiles(directory=FRAMES_DIR), name="frames")  # 📸 НОВОЕ

# Initialize sync logger
sync_logger = SyncLogger(SYNC_LOG_DIR)

# Models
class RecordingMetadata(BaseModel):
    id: str
    filename: str
    created_at: str
    language: Optional[str] = None
    duration: Optional[float] = None
    video_path: str
    transcript_path: Optional[str] = None
    pdf_path: Optional[str] = None
    translated: bool = False
    translation_path: Optional[str] = None
    synced: bool = False
    sync_status: Optional[str] = None
    solar_core_id: Optional[str] = None
    screenshots: Optional[List[Dict]] = []  # 📸 НОВОЕ: список скриншотов

class TranslateRequest(BaseModel):
    recording_id: str
    target_language: str = "ru"

# Helper Functions
def save_metadata(metadata: RecordingMetadata):
    """Save recording metadata to JSON file"""
    metadata_path = os.path.join(METADATA_DIR, f"{metadata.id}.json")
    with open(metadata_path, "w", encoding="utf-8") as f:
        json.dump(metadata.dict(), f, ensure_ascii=False, indent=2)

def load_metadata(recording_id: str) -> Optional[RecordingMetadata]:
    """Load recording metadata from JSON file"""
    metadata_path = os.path.join(METADATA_DIR, f"{recording_id}.json")
    if not os.path.exists(metadata_path):
        return None
    with open(metadata_path, "r", encoding="utf-8") as f:
        data = json.load(f)
        return RecordingMetadata(**data)

def get_all_metadata() -> List[RecordingMetadata]:
    """Get all recording metadata"""
    metadata_list = []
    for filename in os.listdir(METADATA_DIR):
        if filename.endswith(".json"):
            recording_id = filename.replace(".json", "")
            metadata = load_metadata(recording_id)
            if metadata:
                metadata_list.append(metadata)
    metadata_list.sort(key=lambda x: x.created_at, reverse=True)
    return metadata_list

def process_recording(recording_id: str, filepath: str, filename: str):
    """Background task to process recording"""
    try:
        print(f"📄 Processing recording: {recording_id}")
        
        # Transcribe
        transcript_path, detected_language = transcribe_audio(filepath)
        print(f"✅ Transcription complete for {recording_id}")
        
        # Generate PDF
        pdf_path = create_pdf(transcript_path, filename)
        print(f"✅ PDF generated for {recording_id}")
        
        # НОВОЕ: Convert to MP4 for Telegram compatibility
        print(f"🔄 Converting to MP4: {recording_id}")
        mp4_path = webm_to_mp4(recording_id)
        if mp4_path:
            print(f"✅ MP4 conversion complete: {mp4_path}")
        else:
            print(f"⚠️ MP4 conversion failed for {recording_id}")
        
        # Update metadata
        metadata = load_metadata(recording_id)
        if metadata:
            metadata.transcript_path = transcript_path
            metadata.pdf_path = pdf_path
            metadata.language = detected_language
            save_metadata(metadata)
            print(f"✅ Metadata updated for {recording_id}")
            
    except Exception as e:
        print(f"❌ Error processing recording {recording_id}: {str(e)}")

# API Endpoints
@app.get("/")
async def root():
    return {
        "service": "Solar Recorder API",
        "version": "1.2.4-beta",
        "status": "operational",
        "features": {
            "recording": True,
            "transcription": True,
            "translation": True,
            "pdf_generation": True,
            "mp4_conversion": True,
            "solar_core_sync": True,
            "screenshots": True  # 📸 НОВОЕ
        }
    }

@app.post("/upload")
async def upload_video(file: UploadFile, background_tasks: BackgroundTasks):
    """Upload and process video recording"""
    try:
        recording_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{recording_id}.webm"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        print(f"📤 Uploading: {filename}")
        
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"✅ Video saved: {filepath} ({len(content)} bytes)")
        
        metadata = RecordingMetadata(
            id=recording_id,
            filename=filename,
            created_at=datetime.now().isoformat(),
            video_path=filepath
        )
        save_metadata(metadata)
        
        # Queue background processing (transcription + PDF + MP4)
        background_tasks.add_task(process_recording, recording_id, filepath, filename)
        
        return {
            "status": "success",
            "message": "Video uploaded. Processing transcript, PDF, and MP4 in background.",
            "recording_id": recording_id,
            "video_url": f"/static/video/{filename}"
        }
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

# ==================== SPRINT #3: DUAL TRACK UPLOAD ====================

@app.post("/upload-separate")
async def upload_separate_tracks(
    video: UploadFile,
    audio: UploadFile,
    background_tasks: BackgroundTasks
):
    """
    Upload video (with tab audio) and microphone audio separately
    Sprint #3: Dual Track Recording
    """
    try:
        recording_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        
        # Save video file (screen + tab audio)
        video_filename = f"{recording_id}_video.webm"
        video_path = os.path.join(UPLOAD_DIR, video_filename)
        
        print(f"📤 Uploading separate tracks for: {recording_id}")
        
        video_content = await video.read()
        with open(video_path, "wb") as f:
            f.write(video_content)
        
        print(f"✅ Video saved: {video_path} ({len(video_content)} bytes)")
        
        # Save audio file (microphone)
        audio_filename = f"{recording_id}_audio.webm"
        audio_path = os.path.join(UPLOAD_DIR, audio_filename)
        
        audio_content = await audio.read()
        with open(audio_path, "wb") as f:
            f.write(audio_content)
        
        print(f"✅ Audio saved: {audio_path} ({len(audio_content)} bytes)")
        
        # Create metadata
        metadata = RecordingMetadata(
            id=recording_id,
            filename=video_filename,
            created_at=datetime.now().isoformat(),
            video_path=video_path
        )
        save_metadata(metadata)
        
        # Queue dual track processing
        background_tasks.add_task(
            process_dual_track_recording,
            recording_id,
            video_path,
            audio_path,
            video_filename
        )
        
        return {
            "status": "success",
            "message": "Dual track files uploaded. Merging and processing in background.",
            "recording_id": recording_id,
            "video_file": video_filename,
            "audio_file": audio_filename
        }
        
    except Exception as e:
        print(f"❌ Dual track upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

def process_dual_track_recording(
    recording_id: str,
    video_path: str,
    audio_path: str,
    filename: str
):
    """Background task for dual track recording processing"""
    try:
        print(f"🎚️ Processing dual track: {recording_id}")
        
        # Merge tracks
        print(f"🔄 Merging tracks into MP4...")
        mp4_path = merge_tracks_and_convert(recording_id, video_path, audio_path)
        
        if mp4_path:
            print(f"✅ MP4 with dual tracks: {mp4_path}")
        else:
            print(f"❌ MP4 merge failed for {recording_id}")
        
        # Transcribe
        print(f"📄 Transcribing video track...")
        transcript_path, detected_language = transcribe_audio(video_path)
        print(f"✅ Transcription complete: {detected_language}")
        
        # Generate PDF
        pdf_path = create_pdf(transcript_path, filename)
        print(f"✅ PDF generated")
        
        # Update metadata
        metadata = load_metadata(recording_id)
        if metadata:
            metadata.transcript_path = transcript_path
            metadata.pdf_path = pdf_path
            metadata.language = detected_language
            save_metadata(metadata)
        
        print(f"🎉 Dual track processing complete: {recording_id}")
            
    except Exception as e:
        print(f"❌ Dual track processing error {recording_id}: {str(e)}")

# ==================== END SPRINT #3 ====================

@app.get("/files", response_model=List[RecordingMetadata])
async def get_files():
    """Get list of all recordings"""
    try:
        return get_all_metadata()
    except Exception as e:
        print(f"❌ Failed to retrieve files: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Failed to retrieve files: {str(e)}")

@app.get("/files/{recording_id}", response_model=RecordingMetadata)
async def get_file(recording_id: str):
    """Get specific recording metadata"""
    metadata = load_metadata(recording_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Recording not found")
    return metadata

# ==================== НОВЫЕ ЭНДПОИНТЫ: DOWNLOAD ====================

@app.get("/download/{recording_id}/webm")
def download_webm(recording_id: str):
    """Download original WebM recording"""
    webm_path = os.path.join(UPLOAD_DIR, f"{recording_id}.webm")
    
    if not os.path.exists(webm_path):
        raise HTTPException(status_code=404, detail="WebM file not found")
    
    print(f"📥 Downloading WebM: {recording_id}")
    
    return FileResponse(
        webm_path,
        media_type="video/webm",
        filename=f"recording_{recording_id}.webm"
    )

@app.get("/download/{recording_id}/mp4")
def download_mp4(recording_id: str):
    """Download MP4 version (converts on-demand if not exists)"""
    mp4_path = os.path.join(MP4_DIR, f"{recording_id}.mp4")
    
    if not os.path.exists(mp4_path):
        print(f"🔄 On-demand MP4 conversion: {recording_id}")
        converted_path = webm_to_mp4(recording_id)
        
        if not converted_path:
            raise HTTPException(
                status_code=404,
                detail="MP4 conversion failed. Check if WebM exists and FFmpeg is installed."
            )
        
        mp4_path = converted_path
    
    print(f"📥 Downloading MP4: {recording_id}")
    
    return FileResponse(
        mp4_path,
        media_type="video/mp4",
        filename=f"recording_{recording_id}.mp4"
    )

@app.get("/video-info/{recording_id}")
def video_info(recording_id: str):
    """Get information about video files"""
    info = get_video_info(recording_id)
    
    if not info["webm_exists"]:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    return info

# ==================== END НОВЫЕ ЭНДПОИНТЫ ====================

@app.get("/download/{recording_id}/pdf")
async def download_pdf(recording_id: str):
    """Download PDF report"""
    metadata = load_metadata(recording_id)
    if not metadata or not metadata.pdf_path:
        raise HTTPException(status_code=404, detail="PDF not found")
    
    if not os.path.exists(metadata.pdf_path):
        raise HTTPException(status_code=404, detail="PDF file not found")
    
    return FileResponse(
        metadata.pdf_path,
        media_type="application/pdf",
        filename=f"solar_recorder_{recording_id}.pdf"
    )

# ==================== SPRINT #2: SYNC ENDPOINT ====================

@app.post("/api/recorder-sync", response_model=RecorderSyncResponse)
async def sync_to_solar_core(sync_request: RecorderSyncRequest):
    """
    Sync recording to Solar Core ERP
    """
    try:
        print(f"🔗 Sync request for recording: {sync_request.id}")
        
        metadata = load_metadata(sync_request.id)
        if not metadata:
            raise HTTPException(
                status_code=404,
                detail=f"Recording {sync_request.id} not found"
            )
        
        additional_meta = {}
        if os.path.exists(sync_request.video):
            additional_meta["file_size_bytes"] = os.path.getsize(sync_request.video)
        
        with SolarCoreClient() as client:
            if not client.health_check():
                log_entry = SyncLog(
                    recording_id=sync_request.id,
                    status=SyncStatus.FAILED,
                    error_message="Solar Core is not reachable"
                )
                sync_logger.log_sync(log_entry)
                
                return RecorderSyncResponse(
                    status=SyncStatus.FAILED,
                    recording_id=sync_request.id,
                    error="Solar Core is not reachable. Sync will be retried later."
                )
            
            try:
                result = client.sync_recording(sync_request, additional_meta)
                solar_core_id = result.get("id") or result.get("record_id")
                
                metadata.synced = True
                metadata.sync_status = "synced"
                metadata.solar_core_id = solar_core_id
                save_metadata(metadata)
                
                log_entry = SyncLog(
                    recording_id=sync_request.id,
                    status=SyncStatus.SYNCED,
                    solar_core_response=result
                )
                sync_logger.log_sync(log_entry)
                
                return RecorderSyncResponse(
                    status=SyncStatus.SYNCED,
                    recording_id=sync_request.id,
                    solar_core_id=solar_core_id,
                    message="Successfully synced to Solar Core ERP"
                )
                
            except Exception as sync_error:
                error_msg = str(sync_error)
                print(f"❌ Sync failed: {error_msg}")
                
                log_entry = SyncLog(
                    recording_id=sync_request.id,
                    status=SyncStatus.FAILED,
                    error_message=error_msg
                )
                sync_logger.log_sync(log_entry)
                
                return RecorderSyncResponse(
                    status=SyncStatus.FAILED,
                    recording_id=sync_request.id,
                    error=error_msg
                )
    
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Sync endpoint error: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")

@app.get("/api/sync-status/{recording_id}")
async def get_sync_status(recording_id: str):
    """Get sync status and logs for a recording"""
    metadata = load_metadata(recording_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    logs = sync_logger.get_logs(recording_id)
    
    return {
        "recording_id": recording_id,
        "synced": metadata.synced,
        "sync_status": metadata.sync_status,
        "solar_core_id": metadata.solar_core_id,
        "sync_logs": logs
    }

# ==================== END SPRINT #2 ====================

# ==================== SPRINT #3: SCREENSHOT ENDPOINTS ====================

@app.post("/screenshot")
async def upload_screenshot(
    file: UploadFile = File(...),
    recording_id: str = Form(...),
    timestamp: int = Form(...)
):
    """📸 Загрузка скриншота во время записи"""
    try:
        print(f"📸 Screenshot upload: {recording_id} @ {timestamp}s")
        
        # Проверка существования записи
        metadata = load_metadata(recording_id)
        if not metadata:
            raise HTTPException(404, f"Recording {recording_id} not found")
        
        # Создание директории для скриншотов
        recording_frames_dir = os.path.join(FRAMES_DIR, recording_id)
        os.makedirs(recording_frames_dir, exist_ok=True)
        
        # Генерация имени файла
        filename = f"screenshot_{timestamp}_{int(datetime.now().timestamp())}.png"
        filepath = os.path.join(recording_frames_dir, filename)
        
        # Сохранение файла
        content = await file.read()
        with open(filepath, "wb") as f:
            f.write(content)
        
        file_size_kb = len(content) / 1024
        print(f"💾 Screenshot saved: {filepath} ({file_size_kb:.1f} KB)")
        
        # Обновление метаданных
        screenshot_info = {
            "filename": filename,
            "timestamp": timestamp,
            "path": filepath,
            "captured_at": datetime.now().isoformat(),
            "size_bytes": len(content)
        }
        
        if not hasattr(metadata, 'screenshots') or metadata.screenshots is None:
            metadata.screenshots = []
        
        metadata.screenshots.append(screenshot_info)
        save_metadata(metadata)
        
        print(f"✅ Total screenshots: {len(metadata.screenshots)}")
        
        return {
            "status": "success",
            "message": "Screenshot saved successfully",
            "recording_id": recording_id,
            "filename": filename,
            "timestamp": timestamp,
            "url": f"/static/frames/{recording_id}/{filename}",
            "total_screenshots": len(metadata.screenshots)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Screenshot upload failed: {str(e)}")
        raise HTTPException(500, f"Screenshot upload failed: {str(e)}")

@app.get("/screenshots/{recording_id}")
async def get_screenshots(recording_id: str):
    """📋 Получение списка скриншотов"""
    try:
        metadata = load_metadata(recording_id)
        if not metadata:
            raise HTTPException(404, f"Recording {recording_id} not found")
        
        screenshots = getattr(metadata, 'screenshots', []) or []
        
        # Добавление URL
        for screenshot in screenshots:
            screenshot['url'] = f"/static/frames/{recording_id}/{screenshot['filename']}"
        
        print(f"📸 Retrieved {len(screenshots)} screenshots for {recording_id}")
        
        return {
            "recording_id": recording_id,
            "screenshots": screenshots,
            "count": len(screenshots)
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ Failed to get screenshots: {str(e)}")
        raise HTTPException(500, f"Failed to retrieve screenshots: {str(e)}")

@app.get("/download/{recording_id}/screenshot/{filename}")
async def download_screenshot(recording_id: str, filename: str):
    """📥 Скачивание скриншота"""
    screenshot_path = os.path.join(FRAMES_DIR, recording_id, filename)
    
    if not os.path.exists(screenshot_path):
        print(f"⚠️ Screenshot not found: {screenshot_path}")
        raise HTTPException(404, "Screenshot not found")
    
    print(f"📥 Downloading screenshot: {filename}")
    
    return FileResponse(
        screenshot_path,
        media_type="image/png",
        filename=filename
    )

@app.get("/download/{recording_id}/screenshots/all")
async def download_all_screenshots(recording_id: str):
    """📦 Скачивание всех скриншотов в ZIP"""
    try:
        print(f"📦 ZIP download request: {recording_id}")
        
        metadata = load_metadata(recording_id)
        if not metadata:
            raise HTTPException(404, f"Recording {recording_id} not found")
        
        recording_frames_dir = os.path.join(FRAMES_DIR, recording_id)
        
        if not os.path.exists(recording_frames_dir):
            raise HTTPException(404, "No screenshots found")
        
        screenshot_files = [f for f in os.listdir(recording_frames_dir) if f.endswith('.png')]
        
        if not screenshot_files:
            raise HTTPException(404, "No screenshots to download")
        
        # Создание ZIP
        import zipfile
        import tempfile
        
        temp_zip = tempfile.NamedTemporaryFile(delete=False, suffix='.zip')
        zip_path = temp_zip.name
        temp_zip.close()
        
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for screenshot_file in screenshot_files:
                file_path = os.path.join(recording_frames_dir, screenshot_file)
                zipf.write(file_path, screenshot_file)
        
        print(f"✅ ZIP created: {len(screenshot_files)} files")
        
        zip_filename = f"screenshots_{recording_id}.zip"
        
        return FileResponse(
            path=zip_path,
            media_type="application/zip",
            filename=zip_filename
        )
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"❌ ZIP creation failed: {str(e)}")
        raise HTTPException(500, f"Failed to create archive: {str(e)}")

# ==================== END SCREENSHOT ENDPOINTS ====================

@app.post("/translate")
async def translate_recording(request: TranslateRequest, background_tasks: BackgroundTasks):
    """Translate recording transcript"""
    metadata = load_metadata(request.recording_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    if not metadata.transcript_path:
        raise HTTPException(status_code=400, detail="Transcript not available yet")
    
    try:
        print(f"🌐 Translating {request.recording_id} to {request.target_language}")
        
        with open(metadata.transcript_path, "r", encoding="utf-8") as f:
            transcript = f.read()
        
        translated_text = translate_text(
            transcript, 
            source_lang=metadata.language or "auto",
            target_lang=request.target_language
        )
        
        translation_path = metadata.transcript_path.replace(".txt", f"_{request.target_language}.txt")
        with open(translation_path, "w", encoding="utf-8") as f:
            f.write(translated_text)
        
        metadata.translated = True
        metadata.translation_path = translation_path
        save_metadata(metadata)
        
        print(f"✅ Translation complete for {request.recording_id}")
        
        return {
            "status": "success",
            "message": "Translation completed",
            "translation_path": translation_path
        }
        
    except Exception as e:
        print(f"❌ Translation failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Translation failed: {str(e)}")

@app.delete("/files/{recording_id}")
async def delete_recording(recording_id: str):
    """Delete recording and all associated files"""
    metadata = load_metadata(recording_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Recording not found")
    
    try:
        print(f"🗑 Deleting recording: {recording_id}")
        
        # 📸 НОВОЕ: Удаление скриншотов
        import shutil
        recording_frames_dir = os.path.join(FRAMES_DIR, recording_id)
        if os.path.exists(recording_frames_dir):
            shutil.rmtree(recording_frames_dir)
            print(f"  ✓ Deleted screenshots: {recording_frames_dir}")
        
        # Остальные файлы
        files_to_delete = [
            metadata.video_path,
            metadata.transcript_path,
            metadata.pdf_path,
            metadata.translation_path,
            os.path.join(METADATA_DIR, f"{recording_id}.json"),
            os.path.join(SYNC_LOG_DIR, f"{recording_id}_sync.json"),
            os.path.join(MP4_DIR, f"{recording_id}.mp4")
        ]
        
        for file_path in files_to_delete:
            if file_path and os.path.exists(file_path):
                os.remove(file_path)
                print(f"  ✓ Deleted: {file_path}")
        
        print(f"✅ Recording {recording_id} deleted successfully")
        
        return {"status": "success", "message": "Recording deleted successfully"}
        
    except Exception as e:
        print(f"❌ Deletion failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Deletion failed: {str(e)}")

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    solar_core_status = "unknown"
    try:
        with SolarCoreClient() as client:
            solar_core_status = "connected" if client.health_check() else "unreachable"
    except:
        solar_core_status = "error"
    
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "version": "1.2.4-beta",
        "model": os.getenv("MODEL", "base"),
        "force_cpu": os.getenv("FORCE_CPU", "true"),
        "uploads_dir": os.path.exists(UPLOAD_DIR),
        "transcripts_dir": os.path.exists(TRANSCRIPT_DIR),
        "pdf_dir": os.path.exists(PDF_DIR),
        "mp4_dir": os.path.exists(MP4_DIR),
        "frames_dir": os.path.exists(FRAMES_DIR),  # 📸 НОВОЕ
        "solar_core_status": solar_core_status,
        "features": {
            "recording": True,
            "transcription": True,
            "translation": True,
            "pdf_generation": True,
            "mp4_conversion": True,
            "solar_core_sync": True,
            "screenshots": True  # 📸 НОВОЕ
        }
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000, reload=True)
