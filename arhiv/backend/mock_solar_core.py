"""
Solar Core Mock Server
Sprint #2: Integration & Sync

Mock server for testing Solar Recorder sync functionality
Runs on port 8010
"""

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import Dict, Any
from datetime import datetime
import json
import os
import uvicorn

app = FastAPI(title="Solar Core Mock API", version="1.0.0")

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Storage directory
MOCK_DIR = "mock/imports"
os.makedirs(MOCK_DIR, exist_ok=True)

# In-memory storage
recordings_db: Dict[str, Any] = {}


@app.get("/")
async def root():
    return {
        "service": "Solar Core Mock API",
        "version": "1.0.0",
        "status": "operational",
        "purpose": "Testing Solar Recorder sync integration"
    }


@app.get("/health")
async def health():
    """Health check endpoint"""
    return {
        "status": "healthy",
        "timestamp": datetime.now().isoformat()
    }


@app.post("/api/v1/import/record")
async def import_record(request: Request):
    """
    Mock endpoint for importing recordings from Solar Recorder
    """
    try:
        # Parse request body
        payload = await request.json()
        
        # Generate Solar Core ID
        record_count = len(recordings_db) + 1
        solar_core_id = f"SC-REC-{datetime.now().year}-{record_count:03d}"
        
        # Extract recording ID from payload
        recording_id = payload.get("data", {}).get("id", "unknown")
        
        # Store in memory
        recordings_db[solar_core_id] = {
            "id": solar_core_id,
            "recording_id": recording_id,
            "payload": payload,
            "imported_at": datetime.now().isoformat()
        }
        
        # Save to file
        filename = f"{recording_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"
        filepath = os.path.join(MOCK_DIR, filename)
        
        with open(filepath, 'w', encoding='utf-8') as f:
            json.dump({
                "solar_core_id": solar_core_id,
                "payload": payload,
                "imported_at": datetime.now().isoformat()
            }, f, indent=2, ensure_ascii=False)
        
        print(f"✅ Imported recording: {recording_id} → {solar_core_id}")
        print(f"📁 Saved to: {filepath}")
        
        # Return success response
        return {
            "status": "success",
            "id": solar_core_id,
            "recording_id": recording_id,
            "timestamp": datetime.now().isoformat(),
            "message": "Recording imported successfully"
        }
    
    except Exception as e:
        print(f"❌ Import error: {str(e)}")
        return {
            "status": "error",
            "message": str(e)
        }, 500


@app.get("/api/v1/records/{record_id}/status")
async def get_record_status(record_id: str):
    """Get status of imported record"""
    
    # Search in database
    for solar_id, record in recordings_db.items():
        if record["recording_id"] == record_id:
            return {
                "solar_core_id": solar_id,
                "recording_id": record_id,
                "status": "imported",
                "imported_at": record["imported_at"]
            }
    
    return {
        "error": "Record not found"
    }, 404


@app.get("/api/v1/records")
async def list_records():
    """List all imported records"""
    return {
        "total": len(recordings_db),
        "records": list(recordings_db.values())
    }


if __name__ == "__main__":
    print("🚀 Starting Solar Core Mock Server on port 8010...")
    print("📍 Health check: http://localhost:8010/health")
    print("📍 Import endpoint: http://localhost:8010/api/v1/import/record")
    print("📁 Logs directory: ./mock/imports/")
    print("-" * 60)
    
    uvicorn.run(app, host="0.0.0.0", port=8010)