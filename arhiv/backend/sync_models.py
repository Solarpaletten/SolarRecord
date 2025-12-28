"""
Solar Recorder - Sync Models
Sprint #2: Integration & Sync

Models for synchronization with Solar Core ERP
"""

from pydantic import BaseModel, Field, validator
from typing import Optional, Dict, Any
from datetime import datetime
from enum import Enum


class SyncStatus(str, Enum):
    """Sync status enumeration"""
    PENDING = "pending"
    SYNCING = "syncing"
    SYNCED = "synced"
    FAILED = "failed"
    RETRY = "retry"


class RecorderSyncRequest(BaseModel):
    """Request model for recorder sync"""
    id: str = Field(..., description="Recording ID")
    language: str = Field(..., description="Detected language code")
    video: str = Field(..., description="Path to video file")
    transcript: str = Field(..., description="Path to transcript file")
    translation: Optional[str] = Field(None, description="Path to translation file")
    pdf: str = Field(..., description="Path to PDF report")
    created_at: str = Field(..., description="ISO format timestamp")
    
    # Optional metadata
    duration: Optional[float] = Field(None, description="Video duration in seconds")
    file_size: Optional[int] = Field(None, description="Video file size in bytes")
    segments_count: Optional[int] = Field(None, description="Number of transcript segments")
    
    @validator('created_at')
    def validate_timestamp(cls, v):
        """Validate ISO timestamp format"""
        try:
            datetime.fromisoformat(v)
            return v
        except ValueError:
            raise ValueError(f"Invalid ISO timestamp: {v}")
    
    class Config:
        schema_extra = {
            "example": {
                "id": "20251012_011056",
                "language": "en",
                "video": "uploads/video/20251012_011056.webm",
                "transcript": "uploads/transcripts/20251012_011056.txt",
                "translation": "uploads/transcripts/20251012_011056_ru.txt",
                "pdf": "uploads/pdf/20251012_011056.pdf",
                "created_at": "2025-10-12T01:10:56.326172",
                "duration": 45.5,
                "file_size": 7123456,
                "segments_count": 12
            }
        }


class RecorderSyncResponse(BaseModel):
    """Response model for recorder sync"""
    status: SyncStatus
    recording_id: str
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    solar_core_id: Optional[str] = Field(None, description="ID assigned by Solar Core")
    message: Optional[str] = None
    error: Optional[str] = None
    
    class Config:
        schema_extra = {
            "example": {
                "status": "synced",
                "recording_id": "20251012_011056",
                "timestamp": "2025-10-12T01:15:30.123456",
                "solar_core_id": "SC-REC-2025-001",
                "message": "Successfully synced to Solar Core ERP"
            }
        }


class SolarCorePayload(BaseModel):
    """Payload structure for Solar Core API"""
    source: str = "solar_recorder"
    version: str = "1.2.0"
    type: str = "recording"
    data: Dict[str, Any]
    metadata: Dict[str, Any]
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    
    @classmethod
    def from_sync_request(cls, sync_req: RecorderSyncRequest, additional_meta: Optional[Dict] = None):
        """Create Solar Core payload from sync request"""
        metadata = {
            "language": sync_req.language,
            "created_at": sync_req.created_at,
            "has_translation": sync_req.translation is not None,
        }
        
        if sync_req.duration:
            metadata["duration_seconds"] = sync_req.duration
        if sync_req.file_size:
            metadata["file_size_bytes"] = sync_req.file_size
        if sync_req.segments_count:
            metadata["segments_count"] = sync_req.segments_count
            
        if additional_meta:
            metadata.update(additional_meta)
        
        return cls(
            data={
                "id": sync_req.id,
                "video_path": sync_req.video,
                "transcript_path": sync_req.transcript,
                "translation_path": sync_req.translation,
                "pdf_path": sync_req.pdf,
            },
            metadata=metadata
        )


class SyncLog(BaseModel):
    """Log entry for sync operations"""
    recording_id: str
    status: SyncStatus
    timestamp: str = Field(default_factory=lambda: datetime.now().isoformat())
    solar_core_response: Optional[Dict] = None
    error_message: Optional[str] = None
    retry_count: int = 0
    
    class Config:
        schema_extra = {
            "example": {
                "recording_id": "20251012_011056",
                "status": "synced",
                "timestamp": "2025-10-12T01:15:30.123456",
                "solar_core_response": {
                    "status": 200,
                    "id": "SC-REC-2025-001"
                },
                "retry_count": 0
            }
        }