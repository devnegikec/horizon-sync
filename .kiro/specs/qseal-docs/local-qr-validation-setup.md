# Local QR Code Validation Setup Guide

**Date:** March 31, 2026  
**Purpose:** Enable QR code scanning and validation on mobile devices in your local development environment

---

## Overview

This guide provides step-by-step instructions to test QR code generation and validation on your local network using mobile devices.

---

## Option 1: ngrok (Recommended for HTTPS)

### Why ngrok?

- Provides HTTPS URLs (required for signature verification)
- Works from any network
- Easy to set up
- Free tier available

### Step 1: Install ngrok

**macOS:**

```bash
brew install ngrok
```

**Linux:**

```bash
curl -s https://ngrok-agent.s3.amazonaws.com/ngrok.asc | sudo tee /etc/apt/trusted.gpg.d/ngrok.asc >/dev/null
echo "deb https://ngrok-agent.s3.amazonaws.com buster main" | sudo tee /etc/apt/sources.list.d/ngrok.list
sudo apt update && sudo apt install ngrok
```

**Windows:**
Download from https://ngrok.com/download

### Step 2: Sign up for ngrok (Free)

```bash
# Visit https://dashboard.ngrok.com/signup
# Get your auth token from https://dashboard.ngrok.com/get-started/your-authtoken

ngrok config add-authtoken YOUR_AUTH_TOKEN
```

### Step 3: Start Your Backend

```bash
# Start your FastAPI backend (assuming port 8001)
docker compose up core-service

# Or if running directly:
cd core-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Step 4: Expose Backend via ngrok

```bash
ngrok http 8001
```

You'll see output like:

```
Session Status                online
Account                       your-email@example.com
Version                       3.x.x
Region                        United States (us)
Latency                       -
Web Interface                 http://127.0.0.1:4040
Forwarding                    https://abc123def456.ngrok-free.app -> http://localhost:8001

Connections                   ttl     opn     rt1     rt5     p50     p90
                              0       0       0.00    0.00    0.00    0.00
```

**Important:** Copy the HTTPS forwarding URL (e.g., `https://abc123def456.ngrok-free.app`)

### Step 5: Update Backend Configuration

**Option A: Environment Variable (Recommended)**

Create or update `.env` in your backend:

```bash
# core-service/.env
QR_BASE_URL=https://abc123def456.ngrok-free.app
```

**Option B: Update Code Directly**

If your backend doesn't support env vars yet, update the QR generation service:

```python
# core-service/app/services/qr_product_service.py
import os

QR_BASE_URL = os.getenv("QR_BASE_URL", "https://abc123def456.ngrok-free.app")

def generate_qr_url(gtin: str, serial_number: str, nonce: str, signature: str) -> str:
    return f"{QR_BASE_URL}/verify/{serial_number}/{nonce}?c={signature}"
```

### Step 6: Update Frontend Configuration

Update your frontend to use the ngrok URL:

```bash
# apps/inventory/.env.local
REACT_APP_API_URL=https://abc123def456.ngrok-free.app
```

Restart your frontend:

```bash
npm run dev
```

### Step 7: Generate Test QR Codes

1. Open your frontend: http://localhost:4200
2. Navigate to QR Block creation
3. Create a new block with 10-20 QR codes
4. Download the Excel file
5. Open the Excel file and view the QR codes

### Step 8: Test on Mobile

1. Open the Excel file on your computer
2. Display a QR code on your screen
3. Scan with your mobile device's camera or QR scanner app
4. The URL will be: `https://abc123def456.ngrok-free.app/verify/...`
5. Your mobile device will hit the ngrok tunnel → your local backend
6. You should see the verification page with "Authentic" status

### Step 9: Monitor Requests

ngrok provides a web interface to monitor requests:

```
http://127.0.0.1:4040
```

Open this in your browser to see:

- All incoming requests
- Request/response details
- Timing information
- Errors

---

## Option 2: Local Network IP (HTTP Only)

### Why Local IP?

- No external service required
- Faster (no tunnel overhead)
- Works offline

### Limitations:

- HTTP only (HTTPS signature verification may fail)
- Only works on same WiFi network
- IP address changes if you move networks

### Step 1: Find Your Local IP

**macOS:**

```bash
ipconfig getifaddr en0
# Example output: 192.168.1.100
```

**Linux:**

```bash
hostname -I | awk '{print $1}'
# Example output: 192.168.1.100
```

**Windows:**

```bash
ipconfig
# Look for "IPv4 Address" under your active network adapter
```

### Step 2: Update Backend to Bind to 0.0.0.0

**Docker Compose:**

```yaml
# docker-compose.yml
services:
  core-service:
    ports:
      - '8001:8001'
    command: uvicorn main:app --host 0.0.0.0 --port 8001
```

**Direct Run:**

```bash
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Step 3: Update Backend Configuration

```bash
# core-service/.env
QR_BASE_URL=http://192.168.1.100:8001
```

### Step 4: Update Frontend Configuration

```bash
# apps/inventory/.env.local
REACT_APP_API_URL=http://192.168.1.100:8001
```

### Step 5: Test from Mobile

1. Connect your mobile device to the **same WiFi network**
2. Generate QR codes (they'll have URLs like `http://192.168.1.100:8001/verify/...`)
3. Scan with your mobile device
4. Should work if both devices are on same network

### Step 6: Troubleshooting

**If mobile can't connect:**

1. Check firewall:

```bash
# macOS - Allow incoming connections
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --add /path/to/python
sudo /usr/libexec/ApplicationFirewall/socketfilterfw --unblock /path/to/python
```

2. Verify backend is listening on 0.0.0.0:

```bash
netstat -an | grep 8001
# Should show: tcp4  0  0  *.8001  *.*  LISTEN
```

3. Test from another computer on same network:

```bash
curl http://192.168.1.100:8001/docs
```

---

## Option 3: Hybrid Approach (Best of Both)

Use ngrok for QR URLs but local IP for development:

### Step 1: Start ngrok

```bash
ngrok http 8001
```

### Step 2: Configure Backend

```bash
# core-service/.env
QR_BASE_URL=https://abc123def456.ngrok-free.app  # For QR generation
API_BASE_URL=http://localhost:8001                # For local dev
```

### Step 3: Configure Frontend

```bash
# apps/inventory/.env.local
REACT_APP_API_URL=http://localhost:8001           # For local dev
REACT_APP_QR_VERIFY_URL=https://abc123def456.ngrok-free.app  # For QR scanning
```

This way:

- You develop locally with fast HTTP connections
- QR codes use HTTPS ngrok URLs for mobile scanning
- Best performance for development
- Full HTTPS support for QR verification

---

## Testing Checklist

### Backend Tests

- [ ] Backend starts successfully
- [ ] ngrok tunnel is active (if using ngrok)
- [ ] Can access `/docs` endpoint from mobile
- [ ] Can access `/api/v1/qr-products/authenticate` endpoint

### QR Generation Tests

- [ ] Create a test block with 10 QR codes
- [ ] Download Excel file successfully
- [ ] QR codes contain correct URL format
- [ ] URLs use ngrok domain (or local IP)

### Mobile Scanning Tests

- [ ] Mobile device can scan QR code
- [ ] QR URL opens in mobile browser
- [ ] Verification page loads
- [ ] "Authentic" status shows for valid QR
- [ ] Product details display correctly

### Error Handling Tests

- [ ] Invalid QR URL shows error
- [ ] Tampered signature shows "Invalid"
- [ ] Network errors handled gracefully

---

## Common Issues & Solutions

### Issue: ngrok URL changes every restart

**Solution:** Get a static domain (ngrok paid plan) or use a startup script:

```bash
#!/bin/bash
# start-dev.sh

# Start ngrok in background
ngrok http 8001 > /dev/null &
sleep 2

# Get the ngrok URL
NGROK_URL=$(curl -s http://localhost:4040/api/tunnels | jq -r '.tunnels[0].public_url')
echo "ngrok URL: $NGROK_URL"

# Update .env file
echo "QR_BASE_URL=$NGROK_URL" > core-service/.env

# Start backend
cd core-service
uvicorn main:app --host 0.0.0.0 --port 8001
```

### Issue: CORS errors on mobile

**Solution:** Update FastAPI CORS settings:

```python
# core-service/main.py
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # For dev only - restrict in production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

### Issue: Signature verification fails

**Possible causes:**

1. Using HTTP instead of HTTPS (signature expects HTTPS)
2. Timestamp expired (nonce too old)
3. Wrong public key used for verification

**Solution:**

- Use ngrok for HTTPS
- Check backend logs for signature verification errors
- Verify the correct public key is being used

### Issue: Mobile shows "Connection refused"

**Checklist:**

1. Backend is running: `curl http://localhost:8001/docs`
2. ngrok is running: `curl http://localhost:4040/api/tunnels`
3. Mobile is on same network (if using local IP)
4. Firewall allows connections

---

## Production Deployment Notes

**Do NOT use ngrok in production!**

For production:

1. Deploy backend to a real domain (e.g., `api.yourdomain.com`)
2. Use proper SSL certificates (Let's Encrypt)
3. Update `QR_BASE_URL` to production domain
4. Implement rate limiting
5. Add authentication for admin endpoints
6. Use environment-specific configs

---

## Quick Reference

### Start Development Environment

```bash
# Terminal 1: Start backend
docker compose up core-service

# Terminal 2: Start ngrok
ngrok http 8001

# Terminal 3: Start frontend
cd apps/inventory
npm run dev

# Copy ngrok URL and update .env files
# Generate QR codes and test on mobile
```

### Stop Everything

```bash
# Stop ngrok: Ctrl+C in Terminal 2
# Stop frontend: Ctrl+C in Terminal 3
# Stop backend: Ctrl+C in Terminal 1 or docker compose down
```

---

## Support

If you encounter issues:

1. Check ngrok dashboard: http://127.0.0.1:4040
2. Check backend logs: `docker compose logs core-service`
3. Check frontend console: Browser DevTools
4. Verify network connectivity: `ping 192.168.1.100` (your local IP)

---

## Next Steps

After successful local testing:

1. Set up staging environment with real domain
2. Implement proper SSL certificates
3. Add monitoring and logging
4. Set up CI/CD pipeline
5. Deploy to production
