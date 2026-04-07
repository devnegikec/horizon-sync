# Verify Frontend is Sending qr_image Correctly

## Quick Test (2 Minutes)

### Step 1: Open Browser DevTools

1. Open your application in Chrome/Firefox
2. Press `F12` to open DevTools
3. Go to the **Network** tab
4. Check "Preserve log" checkbox

### Step 2: Generate a Block

1. Navigate to QSeal Products
2. Select a product
3. Click "New Block"
4. **IMPORTANT**: Make sure "Include QR code images in Excel" is **CHECKED** ✅
5. Fill in batch name and quantity
6. Click "Generate"

### Step 3: Inspect the Request

1. In the Network tab, find the request to `blocks` (POST request)
2. Click on it
3. Go to the **Payload** or **Request** tab
4. You should see:

```json
{
  "batch": "YOUR_BATCH_NAME",
  "quantity": 100,
  "qr_type": "D",
  "sr_number_type": "R6DAN",
  "qr_image": true    ← THIS MUST BE HERE AND TRUE
}
```

## What to Check

### ✅ If you see `"qr_image": true`

**Frontend is working correctly!** The problem is in the backend.

**Next Steps:**

1. Check backend logs: `docker compose logs -f core-service`
2. Look for errors during block generation
3. Verify backend dependencies are installed
4. See `DEBUG_QR_IMAGE_ISSUE.md` for detailed backend debugging

### ❌ If you DON'T see `"qr_image": true`

**Frontend issue!** The parameter is not being sent.

**Possible Causes:**

1. Checkbox is not checked
2. Code changes didn't take effect (need to rebuild)
3. Using cached version of the app

**Fixes:**

```bash
# Clear browser cache
Ctrl+Shift+Delete (Chrome/Firefox)
# Or hard refresh
Ctrl+Shift+R

# Rebuild frontend
npm run build

# Restart dev server
npm run dev
```

### ❌ If you see `"qr_image": false`

**Checkbox is unchecked!**

**Fix:**

- Make sure to CHECK the "Include QR code images in Excel" checkbox before generating

## Screenshot Example

Your Network tab should look like this:

```
POST /api/v1/qr-products/abc-123-def/blocks
Status: 201 Created

Request Payload:
{
  "batch": "TEST-2025",
  "quantity": 10,
  "qr_type": "D",
  "sr_number_type": "R6DAN",
  "qr_image": true    ← MUST BE TRUE
}

Response:
{
  "id": "block-id-here",
  "batch": "TEST-2025",
  "quantity": 10,
  "qr_image": true,   ← SHOULD BE TRUE IN RESPONSE TOO
  "task_status": "pending",
  ...
}
```

## Alternative: Check with curl

If you want to test the API directly:

```bash
# Replace TOKEN and PRODUCT_ID with your values
curl -X POST http://localhost:8001/api/v1/qr-products/PRODUCT_ID/blocks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "batch": "TEST-CURL",
    "quantity": 5,
    "qr_image": true
  }' | jq

# Check the response includes "qr_image": true
```

## Common Issues

### Issue 1: Checkbox Exists But Not Sending Data

**Symptom**: Checkbox is visible but `qr_image` is not in the request

**Fix**: The code changes might not be compiled yet

```bash
# Stop the dev server (Ctrl+C)
# Clear build cache
rm -rf dist/ .nx/cache/
# Restart
npm run dev
```

### Issue 2: Old Version of App

**Symptom**: Don't see the checkbox at all

**Fix**: Hard refresh the browser

```bash
# Chrome/Firefox
Ctrl+Shift+R

# Or clear cache completely
Ctrl+Shift+Delete → Clear cache
```

### Issue 3: TypeScript Error

**Symptom**: Console shows TypeScript errors

**Fix**: Check the browser console (F12 → Console tab)

```bash
# If you see errors, rebuild
npm run build
```

## Verification Checklist

- [ ] Checkbox "Include QR code images in Excel" is visible in the form
- [ ] Checkbox is CHECKED before clicking Generate
- [ ] Network tab shows POST request to `/blocks`
- [ ] Request payload contains `"qr_image": true`
- [ ] Response also shows `"qr_image": true`
- [ ] No errors in browser console
- [ ] No errors in Network tab (status should be 201)

## If Everything Checks Out

If the frontend is sending `"qr_image": true` correctly but you still don't see images in Excel:

**The problem is 100% in the backend!**

Proceed to `DEBUG_QR_IMAGE_ISSUE.md` for backend debugging steps.

## Quick Backend Check

```bash
# Check if backend received the parameter
docker compose logs core-service | grep "qr_image"

# Should see something like:
# "Creating block with qr_image=True"
# or
# "Generating QR images for block..."
```

If you don't see any logs mentioning `qr_image`, the backend might be ignoring the parameter.
