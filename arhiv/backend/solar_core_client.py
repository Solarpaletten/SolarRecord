"""
Solar Recorder - Solar Core Client
Sprint #2: Integration & Sync

HTTP client for communicating with Solar Core ERP
"""

import os
import requests
from typing import Optional, Dict, Any
from datetime import datetime
import json
from sync_models import (
    RecorderSyncRequest,
    SolarCorePayload,
    SyncStatus,
    SyncLog
)


class SolarCoreClient:
    """Client for Solar Core API communication"""
    
    def __init__(
        self,
        base_url: Optional[str] = None,
        api_key: Optional[str] = None,
        timeout: int = 30,
        max_retries: int = 3
    ):
        """
        Initialize Solar Core client
        
        Args:
            base_url: Solar Core API URL (default from env)
            api_key: API authentication key (default from env)
            timeout: Request timeout in seconds
            max_retries: Maximum retry attempts
        """
        self.base_url = base_url or os.getenv("SOLAR_CORE_URL", "http://localhost:8010")
        self.api_key = api_key or os.getenv("SOLAR_CORE_API_KEY", "")
        self.timeout = timeout
        self.max_retries = max_retries
        
        # Ensure base URL doesn't end with slash
        self.base_url = self.base_url.rstrip('/')
        
        # Configure session
        self.session = requests.Session()
        self.session.headers.update({
            "Content-Type": "application/json",
            "User-Agent": "SolarRecorder/1.2.0"
        })
        
        if self.api_key:
            self.session.headers.update({
                "Authorization": f"Bearer {self.api_key}"
            })
    
    def sync_recording(
        self,
        sync_request: RecorderSyncRequest,
        additional_metadata: Optional[Dict[str, Any]] = None
    ) -> Dict[str, Any]:
        """
        Sync recording to Solar Core
        
        Args:
            sync_request: Recording sync data
            additional_metadata: Extra metadata to include
            
        Returns:
            Solar Core response data
            
        Raises:
            requests.RequestException: On communication failure
        """
        # Create Solar Core payload
        payload = SolarCorePayload.from_sync_request(
            sync_request,
            additional_meta=additional_metadata
        )
        
        # Endpoint for importing records
        endpoint = f"{self.base_url}/api/v1/import/record"
        
        print(f"🔗 Syncing to Solar Core: {endpoint}")
        print(f"📦 Payload: {json.dumps(payload.dict(), indent=2)}")
        
        # Attempt sync with retries
        last_error = None
        for attempt in range(self.max_retries):
            try:
                response = self.session.post(
                    endpoint,
                    json=payload.dict(),
                    timeout=self.timeout
                )
                
                # Check response
                if response.status_code == 200:
                    result = response.json()
                    print(f"✅ Sync successful: {result}")
                    return result
                elif response.status_code == 201:
                    result = response.json()
                    print(f"✅ Record created: {result}")
                    return result
                else:
                    error_msg = f"Solar Core returned {response.status_code}: {response.text}"
                    print(f"⚠️ Attempt {attempt + 1}/{self.max_retries} failed: {error_msg}")
                    last_error = error_msg
                    
            except requests.RequestException as e:
                error_msg = f"Request failed: {str(e)}"
                print(f"⚠️ Attempt {attempt + 1}/{self.max_retries} failed: {error_msg}")
                last_error = error_msg
        
        # All retries failed
        raise Exception(f"Failed to sync after {self.max_retries} attempts: {last_error}")
    
    def health_check(self) -> bool:
        """
        Check if Solar Core is reachable
        
        Returns:
            True if Solar Core is healthy
        """
        try:
            endpoint = f"{self.base_url}/health"
            response = self.session.get(endpoint, timeout=5)
            return response.status_code == 200
        except:
            return False
    
    def get_sync_status(self, recording_id: str) -> Optional[Dict]:
        """
        Get sync status for a recording
        
        Args:
            recording_id: Recording ID
            
        Returns:
            Sync status data or None if not found
        """
        try:
            endpoint = f"{self.base_url}/api/v1/records/{recording_id}/status"
            response = self.session.get(endpoint, timeout=self.timeout)
            
            if response.status_code == 200:
                return response.json()
            return None
        except:
            return None
    
    def close(self):
        """Close the session"""
        self.session.close()
    
    def __enter__(self):
        """Context manager entry"""
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        """Context manager exit"""
        self.close()


class SyncLogger:
    """Logger for sync operations"""
    
    def __init__(self, log_dir: str = "uploads/sync_logs"):
        """Initialize sync logger"""
        self.log_dir = log_dir
        os.makedirs(log_dir, exist_ok=True)
    
    def log_sync(self, log_entry: SyncLog):
        """Log a sync operation"""
        log_file = os.path.join(
            self.log_dir,
            f"{log_entry.recording_id}_sync.json"
        )
        
        # Append to log file
        logs = []
        if os.path.exists(log_file):
            with open(log_file, 'r') as f:
                logs = json.load(f)
        
        logs.append(log_entry.dict())
        
        with open(log_file, 'w') as f:
            json.dump(logs, f, indent=2)
    
    def get_logs(self, recording_id: str) -> list:
        """Get all logs for a recording"""
        log_file = os.path.join(
            self.log_dir,
            f"{recording_id}_sync.json"
        )
        
        if not os.path.exists(log_file):
            return []
        
        with open(log_file, 'r') as f:
            return json.load(f)
    
    def get_latest_status(self, recording_id: str) -> Optional[SyncStatus]:
        """Get latest sync status for a recording"""
        logs = self.get_logs(recording_id)
        if not logs:
            return None
        
        latest = logs[-1]
        return SyncStatus(latest['status'])