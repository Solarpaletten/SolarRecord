# Changelog

## [2.0.0-alpha] - 2026-01-12

### Added
- Complete rewrite with clean architecture
- Whisper AI transcription (subprocess mode)
- Multi-language support (auto-detect)
- FFmpeg MP4 conversion
- Share to Solar Core ERP
- PDF transcript export
- Comprehensive documentation

### Architecture
- Separated ActionButtons / RecordingDownloads
- Clean service layer (storage, transcribe, convert)
- Python venv isolation for Whisper

### Fixed
- Navigation routing (/recording/records)
- Date display (Prisma camelCase mapping)
- Duplicate button issue
