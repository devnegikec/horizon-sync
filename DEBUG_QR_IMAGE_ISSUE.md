# Debugging QR Image Issue

## Current Status

✅ **Frontend Fix Applied**: The `qr_image: true` parameter is now being sent to the backend
✅ **Backend API Supports It**: The OpenAPI spec shows `qr_image` field exists in `QRBlockCreate` schema

## Issue

Despite the frontend sending `qr_image: true`, the Excel file still doesn't contain QR code images.

## Possible Causes

### 1. Backend Implementation Not Complete

The backend might accept the `qr_image` parameter but not actually generate the images.

**How to Check:**

```bash
# Check backend logs when generating a block
docker compose logs -f core-service

# Or if using a different service name
docker compose logs -f backend
docker compose logs -f api
```

**What to Look For:**

- Errors related to QR code generation
- Missing dependencies (qrcode, PIL/Pillow libraries)
- Excel generation errors
- Task/worker failures

### 2. Celery/Background Worker Not Running

QR block generation might use a background task queue (Celery, RQ, etc.) that isn't running.

**How to Check:**

```bash
# Check if worker service is running
docker compose ps

# Check worker logs
docker compose logs -f worker
docker compose logs -f celery
```

**What to Look For:**

- Worker service status (should be "Up")
- Task execution logs
- Connection errors to Redis/RabbitMQ

### 3. Missing Python Dependencies

The backend might be missing required libraries for QR image generation.

**Required Libraries:**

- `qrcode` - QR code generation
- `Pillow` (PIL) - Image manipulation
- `openpyxl` or `xlsxwriter` - Excel with images

**How to Check:**

```bash
# SSH into backend container
docker compose exec core-service bash

# Check if libraries are installed
python -c "import qrcode; print('qrcode OK')"
python -c "import PIL; print('PIL OK')"
python -c "from openpyxl.drawing.image import Image; print('openpyxl images OK')"
```

### 4. File Storage/Download URL Issue

The Excel file might be generated with images, but the download URL points to an old version.

**How to Check:**

- Delete the old Excel file from storage
- Generate a new block
- Download and verify

### 5. Excel Library Limitation

The backend might be using a library that doesn't support embedding images.

**Check Backend Code:**
Look for the Excel generation code and verify it's using image embedding:

```python
# Good - openpyxl with images
from openpyxl.drawing.image import Image
img = Image(qr_image_path)
worksheet.add_image(img, f'C{row}')

# Bad - csv or basic xlsx without image support
writer = pd.ExcelWriter('output.xlsx', engine='xlsxwriter')
```

## Debugging Steps

### Step 1: Check Backend Logs

```bash
# Terminal 1: Watch backend logs
docker compose logs -f core-service

# Terminal 2: Generate a block with qr_image=true
# Watch Terminal 1 for any errors
```

### Step 2: Verify Request Payload

Open browser DevTools → Network tab:

1. Generate a new block
2. Find the POST request to `/api/v1/qr-products/{id}/blocks`
3. Check the Request Payload contains: `"qr_image": true`

### Step 3: Check Block Status

```bash
# Call the API directly to see block details
curl -H "Authorization: Bearer YOUR_TOKEN" \
  http://localhost:8001/api/v1/qr-products/blocks/BLOCK_ID
```

Look for:

- `"qr_image": true` in the response
- `"task_status": "completed"` (not "failed")
- `"download_url"` is present

### Step 4: Inspect Excel File

```bash
# Download the Excel file
# Unzip it (Excel files are ZIP archives)
unzip qr_block.xlsx -d qr_block_extracted

# Check for embedded images
ls -la qr_block_extracted/xl/media/

# If this folder exists and has images, the backend IS generating them
# If it's empty or doesn't exist, the backend is NOT generating images
```

### Step 5: Test Backend Directly

Create a minimal test script:

```python
# test_qr_generation.py
import qrcode
from io import BytesIO
from openpyxl import Workbook
from openpyxl.drawing.image import Image

# Generate QR code
qr = qrcode.QRCode(version=1, box_size=10, border=5)
qr.add_data('https://example.com/test')
qr.make(fit=True)
img = qr.make_image(fill_color="black", back_color="white")

# Save to BytesIO
img_bytes = BytesIO()
img.save(img_bytes, format='PNG')
img_bytes.seek(0)

# Create Excel with image
wb = Workbook()
ws = wb.active
ws['A1'] = 'Test QR'

# Add image to Excel
openpyxl_img = Image(img_bytes)
ws.add_image(openpyxl_img, 'B1')

wb.save('test_qr.xlsx')
print("✅ Test Excel with QR image created successfully!")
```

Run this in the backend container:

```bash
docker compose exec core-service python test_qr_generation.py
```

If this fails, the backend is missing dependencies.

## Quick Fixes

### Fix 1: Install Missing Dependencies

```bash
# In backend container
pip install qrcode[pil] Pillow openpyxl
```

### Fix 2: Restart Worker Service

```bash
docker compose restart worker
# or
docker compose restart celery
```

### Fix 3: Clear Cache/Storage

```bash
# Delete old Excel files
docker compose exec core-service rm -rf /app/storage/qr_blocks/*

# Or clear Redis cache
docker compose exec redis redis-cli FLUSHALL
```

### Fix 4: Check Environment Variables

```bash
# Ensure these are set
ENABLE_QR_IMAGES=true
QR_IMAGE_SIZE=300
EXCEL_ENGINE=openpyxl  # Not xlsxwriter or csv
```

## Expected Backend Behavior

When `qr_image: true` is sent, the backend should:

1. ✅ Accept the parameter (already working)
2. ✅ Generate QR codes as PNG images
3. ✅ Embed images in Excel using openpyxl
4. ✅ Store Excel file with images
5. ✅ Return download URL

## Next Steps

1. **Check backend logs** - This is the most important step
2. **Verify request payload** - Ensure frontend is sending qr_image=true
3. **Test dependencies** - Run the test script above
4. **Contact backend team** - If backend code needs to be updated

## Backend Code to Look For

Search for these files in the backend:

- `qr_product_service.py` or `qr_service.py`
- `block_generator.py` or `qr_generator.py`
- `excel_generator.py` or `xlsx_generator.py`

Look for code like:

```python
if qr_image:
    # Generate QR image
    qr = qrcode.make(url)
    # Add to Excel
    worksheet.add_image(qr_img, cell)
```

If this code doesn't exist or is commented out, that's the problem!

## Contact Backend Developer

If you're not the backend developer, share this information:

**Issue**: QR images not appearing in Excel despite `qr_image: true` being sent

**Frontend**: ✅ Sending `qr_image: true` correctly

**Backend Needed**:

- Implement QR image generation using `qrcode` library
- Embed images in Excel using `openpyxl.drawing.image.Image`
- Ensure dependencies are installed: `qrcode[pil]`, `Pillow`, `openpyxl`

**Test Command**:

```bash
# This should create an Excel with QR images
curl -X POST http://localhost:8001/api/v1/qr-products/{product_id}/blocks \
  -H "Authorization: Bearer TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batch": "TEST",
    "quantity": 5,
    "qr_image": true
  }'
```
