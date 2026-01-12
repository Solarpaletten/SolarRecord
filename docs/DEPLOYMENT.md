# Deployment — SolarRecord v2.0.0

## Environments

| Environment | Purpose | Whisper Mode |
|-------------|---------|--------------|
| Local | Development | subprocess |
| Render | Build validation | cloud (or disabled) |
| DigitalOcean | Production | subprocess |

## Requirements

### Server Requirements
```
- Node.js 18+
- pnpm 8+
- Python 3.10+
- FFmpeg 5+
- 2GB RAM minimum (4GB for Whisper)
- 10GB disk (for uploads + models)
```

### Python Requirements
```
openai-whisper
torch
numpy
```

## Local Development
```bash
# Clone
git clone <repo>
cd SolarRecord

# Node
pnpm install

# Python venv
python3 -m venv venv
source venv/bin/activate
pip install openai-whisper

# Run
pnpm dev
```

## DigitalOcean Production

### 1. Server Setup
```bash
# SSH to server
ssh root@your-server

# Install dependencies
apt update
apt install -y nodejs npm python3 python3-venv ffmpeg

# Install pnpm
npm install -g pnpm
```

### 2. Clone & Setup
```bash
# Clone repository
cd /var/www
git clone <repo> solar-recorder
cd solar-recorder

# Node dependencies
pnpm install

# Python environment
python3 -m venv venv
source venv/bin/activate
pip install openai-whisper

# Environment
cp .env.example .env.local
nano .env.local
```

### 3. Build & Run
```bash
# Build
pnpm build

# Run with PM2
pm2 start "pnpm start" --name solar-recorder
pm2 save
```

### 4. Nginx Config
```nginx
server {
    listen 80;
    server_name recorder.yourdomain.com;

    location / {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        
        # For large uploads
        client_max_body_size 500M;
    }
}
```

## Render (Validation Only)

⚠️ **Note:** Whisper subprocess won't work on Render (no Python venv).

Use for build validation:
```yaml
# render.yaml
services:
  - type: web
    name: solar-recorder
    env: node
    buildCommand: pnpm install && pnpm build
    startCommand: pnpm start
    envVars:
      - key: WHISPER_MODE
        value: cloud
      - key: OPENAI_API_KEY
        value: <your-key>
```

## Update Procedure
```bash
# On production server
cd /var/www/solar-recorder

# Pull latest
git pull origin main

# Update dependencies
pnpm install
source venv/bin/activate
pip install -U openai-whisper

# Rebuild
pnpm build

# Restart
pm2 restart solar-recorder
```

## Monitoring
```bash
# Logs
pm2 logs solar-recorder

# Status
pm2 status

# Resources
htop
```

## Backup
```bash
# Backup uploads
tar -czf uploads-backup-$(date +%Y%m%d).tar.gz uploads/

# Restore
tar -xzf uploads-backup-YYYYMMDD.tar.gz
```
