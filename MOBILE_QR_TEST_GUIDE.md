# Mobile QR Code Testing Guide

## Quick Test Steps (5 minutes)

### Step 1: Generate a Test Block

1. Open the app in your browser
2. Navigate to: **QSeal Products** → Select any product → **Generate Block**
3. Fill in the form:
   - **Batch Name**: `TEST-MOBILE-2025`
   - **Quantity**: `5` (small number for quick testing)
   - **QR Type**: `Dynamic (D)`
   - **Serial Type**: `R6DAN`
   - ✅ **Check**: "Include QR code images in Excel"
4. Click **Generate Block**
5. Wait for status to change: `pending` → `in_progress` → `completed` (usually 10-30 seconds)

### Step 2: Download the Excel File

1. Once status shows **completed**, click **Download Excel**
2. Open the downloaded file (should be named like `qr_TEST-MOBILE-2025.xlsx`)
3. Verify you see **3 columns**:
   - Column A: QR URL (long URL starting with https://)
   - Column B: Serial Number (like ABC123)
   - Column C: QR Code (actual QR code image)

### Step 3: Test with Your Phone

1. **Open the Excel file on your computer**
2. **Zoom in** on one of the QR code images so it's clearly visible on screen
3. **Open your phone's camera app** (or any QR scanner app)
4. **Point your phone at the QR code** on your computer screen
5. **Tap the notification** that appears on your phone

### Expected Results

#### ✅ Success Scenario:

- Your phone should open a browser
- You'll see a URL like: `https://org.domain.com/g/1234567890123/s/ABC123/1234567890?c=...`
- The page might show an error (that's OK for now - we're just testing if the QR code scans)

#### ❌ If QR Code Doesn't Scan:

- Make sure the QR code image is large enough on screen
- Try increasing screen brightness
- Ensure there's no glare on the screen
- Try a different QR code from the Excel file

### Step 4: Verify the QR URL Format

Look at the URL that opened on your phone. It should have this structure:

```
https://{org}.{domain}/g/{GTIN}/s/{SERIAL}/{TIMESTAMP}?c={SIGNATURE}
```

Example:

```
https://testorg.qseal.com/g/1234567890123/s/A3K9F2/1705334400?c=MEUCIQDx...
```

## What to Check

### ✅ Checklist:

- [ ] Excel file has 3 columns (not just 2)
- [ ] QR code images are visible in Excel
- [ ] Phone camera recognizes the QR code
- [ ] QR code opens a URL in browser
- [ ] URL contains: `/g/`, `/s/`, and `?c=` parameters

### 📸 Take Screenshots:

1. Screenshot of the Excel file showing all 3 columns
2. Screenshot of your phone scanning the QR code
3. Screenshot of the URL that opens on your phone

## Troubleshooting

### Problem: Excel only has 2 columns (no QR images)

**Solution**:

- Make sure you checked "Include QR code images in Excel" when creating the block
- Try generating a new block with the checkbox enabled

### Problem: QR code won't scan

**Solution**:

- Increase the size of the QR code on screen (zoom in Excel)
- Increase screen brightness
- Try a different QR code from the file
- Try saving the QR image and opening it in a photo viewer

### Problem: QR code scans but shows error page

**This is actually OK!** We're testing if:

1. The QR code generates correctly ✅
2. The QR code scans ✅
3. The URL format is correct ✅

The error page is expected because:

- The domain might not be configured for local testing
- The authentication endpoint might need the backend running
- This is normal for development/testing

## Advanced Testing (Optional)

If you want to test the full authentication flow:

### Test the Authentication Endpoint Directly

1. **Copy the QR URL** from your phone's browser
2. **Parse the URL components**:
   - Find the serial number (after `/s/`)
   - Find the timestamp (number after serial)
   - Find the signature (after `?c=`)

3. **Test with curl** (in terminal):

```bash
curl -X POST http://localhost:8001/api/v1/qr-products/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "ABC123",
    "nonce": "1705334400",
    "cipher": "MEUCIQDx..."
  }'
```

4. **Expected Response**:

```json
{
  "message": "Authentication successful",
  "authentic": true,
  "product_name": "Your Product Name",
  "brand_name": "Your Brand Name",
  "gtin": "1234567890123",
  "serial_number": "ABC123"
}
```

## What to Report

After testing, please share:

1. ✅ or ❌ for each checklist item
2. Screenshots (if possible)
3. Any error messages you see
4. The QR URL format (you can redact the signature part)

Example report:

```
✅ Excel has 3 columns
✅ QR images visible
✅ Phone scans QR code
✅ URL opens in browser
❌ Shows 404 error (but URL format looks correct)

URL format: https://testorg.qseal.com/g/1234567890123/s/A3K9F2/1705334400?c=MEU...
```

## Quick Reference

**Good QR URL Format**:

```
https://{org}.{domain}/g/{14-digit-GTIN}/s/{serial}/timestamp?c={signature}
```

**Bad QR URL Format**:

```
http://localhost:8001/...  (missing domain)
https://domain.com/s/...   (missing /g/ segment)
```

## Need Help?

If something doesn't work:

1. Check that the backend is running: `docker compose ps`
2. Check backend logs: `docker compose logs core-service | tail -50`
3. Verify the block status is "completed" in the UI
4. Try generating a new block with a different batch name
