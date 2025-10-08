from fastapi import FastAPI, UploadFile, BackgroundTasks, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles
from pydantic import BaseModel
from typing import Optional, List
import os
import json
from datetime import datetime
from transcribe import transcribe_audio
from translate import translate_text
from pdf_generator import create_pdf

app = FastAPI(title="Solar Recorder API", version="1.1.1")

# CORS Configuration - Fixed to use CORS_ORIGINS
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

for directory in [UPLOAD_DIR, TRANSCRIPT_DIR, PDF_DIR, METADATA_DIR]:
    os.makedirs(directory, exist_ok=True)

# Mount static files
app.mount("/static/video", StaticFiles(directory=UPLOAD_DIR), name="video")
app.mount("/static/pdf", StaticFiles(directory=PDF_DIR), name="pdf")

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
    # Sort by created_at descending
    metadata_list.sort(key=lambda x: x.created_at, reverse=True)
    return metadata_list

def process_recording(recording_id: str, filepath: str, filename: str):
    """Background task to process recording"""
    try:
        print(f"🔄 Processing recording: {recording_id}")
        
        # Transcribe
        transcript_path, detected_language = transcribe_audio(filepath)
        print(f"✅ Transcription complete for {recording_id}")
        
        # Generate PDF
        pdf_path = create_pdf(transcript_path, filename)
        print(f"✅ PDF generated for {recording_id}")
        
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
        "version": "1.1.1",
        "status": "operational"
    }

@app.post("/upload")
async def upload_video(file: UploadFile, background_tasks: BackgroundTasks):
    """Upload and process video recording"""
    try:
        # Generate unique ID
        recording_id = datetime.now().strftime("%Y%m%d_%H%M%S")
        filename = f"{recording_id}.webm"
        filepath = os.path.join(UPLOAD_DIR, filename)
        
        print(f"📤 Uploading: {filename}")
        
        # Save video file
        with open(filepath, "wb") as f:
            content = await file.read()
            f.write(content)
        
        print(f"✅ Video saved: {filepath}")
        
        # Create initial metadata
        metadata = RecordingMetadata(
            id=recording_id,
            filename=filename,
            created_at=datetime.now().isoformat(),
            video_path=filepath
        )
        save_metadata(metadata)
        
        # Process in background
        background_tasks.add_task(process_recording, recording_id, filepath, filename)
        
        return {
            "status": "success",
            "message": "Video uploaded successfully. Processing in background.",
            "recording_id": recording_id,
            "video_url": f"/static/video/{filename}"
        }
        
    except Exception as e:
        print(f"❌ Upload failed: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Upload failed: {str(e)}")

@app.get("/files", response_model=List[RecordingMetadata])
async def get_files():
    """Get list of all recordings with metadata"""
    try:
        metadata_list = get_all_metadata()
        return metadata_list
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to retrieve files: {str(e)}")

@app.get("/files/{recording_id}", response_model=RecordingMetadata)
async def get_file(recording_id: str):
    """Get specific recording metadata"""
    metadata = load_metadata(recording_id)
    if not metadata:
        raise HTTPException(status_code=404, detail="Recording not found")
    return metadata

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
        
        # Read transcript
        with open(metadata.transcript_path, "r", encoding="utf-8") as f:
            transcript = f.read()
        
        # Translate
        translated_text = translate_text(
            transcript, 
            source_lang=metadata.language or "auto",
            target_lang=request.target_language
        )
        
        # Save translation
        translation_path = metadata.transcript_path.replace(".txt", f"_{request.target_language}.txt")
        with open(translation_path, "w", encoding="utf-8") as f:
            f.write(translated_text)
        
        # Update metadata
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
        
        # Delete all files
        files_to_delete = [
            metadata.video_path,
            metadata.transcript_path,
            metadata.pdf_path,
            metadata.translation_path,
            os.path.join(METADATA_DIR, f"{recording_id}.json")
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

@app.get("/health")
async def health_check():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat(),
        "model": os.getenv("MODEL", "base"),
        "force_cpu": os.getenv("FORCE_CPU", "true"),
        "uploads_dir": os.path.exists(UPLOAD_DIR),
        "transcripts_dir": os.path.exists(TRANSCRIPT_DIR),
        "pdf_dir": os.path.exists(PDF_DIR)
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)