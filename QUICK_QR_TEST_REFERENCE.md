# Quick QR Code Testing Reference

## 🚀 Quick Start (5 Minutes)

### Step 1: Generate Block with QR Images

```
1. Open app → QSeal Products
2. Select a product
3. Click "New Block"
4. ✅ Check "Include QR code images in Excel"
5. Enter batch name (e.g., "TEST-2025")
6. Set quantity (start with 10 for testing)
7. Click "Generate"
```

### Step 2: Download Excel

```
1. Wait for status: pending → in_progress → completed
2. Click "Download Excel"
3. Open the file
```

### Step 3: Verify QR Codes

```
Expected columns:
✅ QR URL
✅ Serial Number
✅ QR Code (image)
```

### Step 4: Test Scanning

```
1. Open Excel on your computer
2. Open camera app on your phone
3. Point camera at QR code on screen
4. QR code should be recognized
```

## 📱 Testing Methods (Choose One)

### Method A: Phone Camera (Easiest)

- ✅ No setup required
- ✅ Works immediately
- ❌ Can't test authentication flow locally

### Method B: ngrok Tunnel (Full Testing)

```bash
# Install ngrok
brew install ngrok

# Start tunnel
ngrok http 8001

# Use the https URL for testing
# Example: https://abc123.ngrok.io
```

- ✅ Full authentication testing
- ✅ Works with real URLs
- ❌ Requires ngrok setup

### Method C: Online QR Reader (No Phone)

```
1. Save QR image from Excel (right-click → Save as Image)
2. Go to https://webqr.com
3. Upload the image
4. View decoded URL
```

- ✅ No phone needed
- ✅ Quick verification
- ❌ Manual process

## 🔍 Troubleshooting

### No QR Images in Excel?

```
✅ Check "Include QR code images" is checked
✅ Wait for status to be "completed"
✅ Re-download the file
✅ Check backend logs for errors
```

### QR Code Won't Scan?

```
✅ Ensure good lighting
✅ Hold phone steady
✅ Try zooming in on the QR code
✅ Check QR code isn't cut off in Excel
```

### Authentication Fails?

```
✅ Verify product has a linked brand
✅ Check brand has key pair generated
✅ Ensure product is activated
✅ Check backend logs for signature errors
```

## 🧪 Test Authentication Endpoint

### Extract URL Components

```javascript
// Example QR URL:
// https://org.domain.com/g/1234567890123/s/ABC123/1234567890?c=signature

const url = 'https://org.domain.com/g/1234567890123/s/ABC123/1234567890?c=signature';
const urlObj = new URL(url);
const parts = urlObj.pathname.split('/');
const sIndex = parts.indexOf('s');

const payload = {
  serial_number: parts[sIndex + 1], // ABC123
  nonce: parts[sIndex + 2], // 1234567890
  cipher: urlObj.searchParams.get('c'), // signature
};
```

### Test with curl

```bash
curl -X POST http://localhost:8001/api/v1/qr-products/authenticate \
  -H "Content-Type: application/json" \
  -d '{
    "serial_number": "ABC123",
    "nonce": "1234567890",
    "cipher": "base64signature"
  }'
```

### Expected Response

```json
{
  "message": "Authentication successful",
  "authentic": true,
  "product_name": "Product Name",
  "brand_name": "Brand Name",
  "gtin": "1234567890123",
  "serial_number": "ABC123"
}
```

## 📊 Excel File Structure

### With QR Images (qr_image: true)

```
| QR URL                          | Serial Number | QR Code    |
|---------------------------------|---------------|------------|
| https://org.domain.com/g/...    | ABC123        | [QR Image] |
| https://org.domain.com/g/...    | ABC124        | [QR Image] |
```

### Without QR Images (qr_image: false)

```
| QR URL                          | Serial Number |
|---------------------------------|---------------|
| https://org.domain.com/g/...    | ABC123        |
| https://org.domain.com/g/...    | ABC124        |
```

## ⚡ Performance Tips

### For Testing (Small Batches)

- ✅ Check "Include QR images"
- Quantity: 10-20
- Generation time: ~10-30 seconds

### For Production (Large Batches)

- ❌ Uncheck "Include QR images" (unless needed)
- Quantity: 1000-10000
- Generation time: ~1-5 minutes (without images)

## 🔗 Quick Links

- **Backend Logs**: `docker compose logs core-service`
- **Frontend Dev**: `npm run dev`
- **API Docs**: http://localhost:8001/docs
- **Online QR Reader**: https://webqr.com
- **ngrok Download**: https://ngrok.com/download

## 📝 Common Test Scenarios

### Scenario 1: Basic QR Generation

```
1. Create brand → Auto-generates key pair
2. Create product → Link to brand
3. Generate block → 10 QR codes with images
4. Download → Verify 3 columns
5. Scan → Test with phone
```

### Scenario 2: Different QR Types

```
Test each type:
- D (Dynamic): Unique URL per item
- S (Static): Same serial for all
- B (Dual): Two QR codes per item
- O (OneTime): Deactivates after scan
- SC (SecureCode): Includes secret code
```

### Scenario 3: Serial Number Types

```
Test each type:
- R6DAN: ABC123 (6-char random)
- R4DAN: AB12 (4-char random)
- S8DN: 00000001 (8-digit sequential)
- S10DN: 0000000001 (10-digit sequential)
```

## 🎯 Success Checklist

- [ ] QR images appear in Excel (3 columns)
- [ ] Phone camera recognizes QR code
- [ ] QR URL matches expected format
- [ ] Serial numbers are unique
- [ ] Authentication endpoint returns authentic: true
- [ ] Block status shows "completed"
- [ ] Credits are deducted correctly

## 💡 Pro Tips

1. **Start Small**: Always test with 10 QR codes first
2. **Use Descriptive Names**: Batch names like "TEST-2025-01-15"
3. **Check Credits**: Ensure sufficient credits before large batches
4. **Save Test Data**: Keep a test brand/product for quick testing
5. **Monitor Logs**: Watch backend logs during generation
6. **Test Offline**: QR images work without internet once downloaded

## 🆘 Need Help?

1. Check `QR_CODE_LOCAL_TESTING_GUIDE.md` for detailed instructions
2. Check `QR_CODE_FIX_SUMMARY.md` for implementation details
3. Review backend logs: `docker compose logs core-service`
4. Check browser console for frontend errors
5. Verify block status is "completed" before downloading
