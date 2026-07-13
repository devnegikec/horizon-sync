# QR Code Local Testing Guide

## Issue Fixed

The QR code images were not appearing in the Excel download because the `qr_image` parameter was missing from the block creation request. This has been fixed by:

1. Adding `includeQrImage` state to the CreateBlockDialog component
2. Adding a checkbox UI to allow users to toggle QR image inclusion
3. Passing `qr_image: includeQrImage` in the block creation payload

## How to Test QR Codes Locally

### Method 1: Using Your Phone (Recommended)

This is the easiest way to test QR codes:

1. **Generate a QR Block with Images**
   - Open the application in your browser
   - Navigate to QSeal Products → Select a product → Generate Block
   - Check the "Include QR code images in Excel" checkbox
   - Generate the block and wait for completion
   - Download the Excel file

2. **Open Excel on Your Computer**
   - Open the downloaded Excel file
   - You should see columns: QR URL, Serial Number, and QR Code (image)

3. **Scan with Your Phone**
   - Open your phone's camera app or a QR scanner app
   - Point it at the QR code image on your screen
   - The QR code should redirect to the URL shown in the "QR URL" column

### Method 2: Using ngrok (For Full Testing)

If you want to test the full authentication flow with a real domain:

1. **Install ngrok**

   ```bash
   # macOS
   brew install ngrok

   # Or download from https://ngrok.com/download
   ```

2. **Start Your Backend**

   ```bash
   # Make sure your backend is running on port 8001
   docker compose up
   ```

3. **Create ngrok Tunnel**

   ```bash
   ngrok http 8001
   ```

   This will give you a public URL like: `https://abc123.ngrok.io`

4. **Update QR URL Generation**
   - The backend needs to use the ngrok URL instead of localhost
   - Update the environment variable or configuration to use the ngrok domain

5. **Generate and Test**
   - Generate a new QR block
   - Download the Excel
   - Scan the QR code with your phone
   - It should now work with the public ngrok URL

### Method 3: Using a QR Code Reader Library

For automated testing without a physical device:

1. **Install a QR Code Reader**

   ```bash
   npm install qrcode-reader jimp
   ```

2. **Create a Test Script**

   ```javascript
   // test-qr.js
   const fs = require('fs');
   const Jimp = require('jimp');
   const QrCode = require('qrcode-reader');

   async function readQRCode(imagePath) {
     const image = await Jimp.read(imagePath);
     const qr = new QrCode();

     return new Promise((resolve, reject) => {
       qr.callback = (err, value) => {
         if (err) reject(err);
         else resolve(value.result);
       };
       qr.decode(image.bitmap);
     });
   }

   // Usage
   readQRCode('./qr-code.png')
     .then((url) => console.log('QR Code URL:', url))
     .catch((err) => console.error('Error:', err));
   ```

3. **Extract QR Image from Excel**
   - Open the Excel file
   - Right-click on a QR code image
   - Save as PNG
   - Run the test script on the saved image

### Method 4: Using Online QR Code Readers

1. **Generate and Download Excel**
   - Generate a block with QR images
   - Download the Excel file

2. **Extract QR Image**
   - Open Excel
   - Right-click on a QR code → Save as Image
   - Save as PNG or JPG

3. **Use Online Reader**
   - Go to https://webqr.com or https://zxing.org/w/decode
   - Upload the saved QR image
   - It will decode and show the URL

### Method 5: Testing the Authentication Endpoint Directly

You can test the QR authentication without scanning:

1. **Get QR URL from Excel**
   - Example: `https://org.domain.com/g/1234567890123/s/ABC123/1234567890?c=base64signature`

2. **Parse the URL Components**

   ```javascript
   const url = new URL('https://org.domain.com/g/1234567890123/s/ABC123/1234567890?c=base64signature');
   const pathParts = url.pathname.split('/');
   const sIndex = pathParts.indexOf('s');

   const payload = {
     serial_number: pathParts[sIndex + 1], // ABC123
     nonce: pathParts[sIndex + 2], // 1234567890
     cipher: url.searchParams.get('c'), // base64signature
   };
   ```

3. **Call Authentication Endpoint**

   ```bash
   curl -X POST http://localhost:8001/api/v1/qr-products/authenticate \
     -H "Content-Type: application/json" \
     -d '{
       "serial_number": "ABC123",
       "nonce": "1234567890",
       "cipher": "base64signature"
     }'
   ```

4. **Expected Response**
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

## Troubleshooting

### QR Images Not Showing in Excel

**Problem**: Excel file has only 2 columns (QR URL, Serial Number) but no QR image column

**Solution**:

- Make sure the "Include QR code images in Excel" checkbox is checked when generating the block
- The backend must support the `qr_image` parameter
- Check backend logs for any errors during QR image generation

### QR Code Scans But Shows Error

**Problem**: QR code scans successfully but the authentication fails

**Possible Causes**:

1. **Invalid Signature**: The ECDSA signature doesn't match
   - Check that the brand has a valid key pair
   - Verify the signature generation logic

2. **Expired Nonce**: The timestamp is too old
   - Check if there's a time window validation
   - Ensure system clocks are synchronized

3. **Product Not Activated**: The product hasn't been activated yet
   - Check product status in the database
   - Activate the product before testing

### QR Code Doesn't Scan

**Problem**: Phone camera doesn't recognize the QR code

**Possible Causes**:

1. **Image Quality**: QR code image is too small or blurry
   - Increase the QR code size in the generation settings
   - Use higher DPI for image generation

2. **Contrast Issues**: Not enough contrast between QR code and background
   - Ensure black QR code on white background
   - Check image format (PNG recommended)

3. **Damaged QR Code**: Part of the QR code is cut off or corrupted
   - Check the Excel cell size
   - Ensure the full QR code is visible

## Best Practices

1. **Always Include QR Images for Testing**
   - Check the "Include QR code images" option during development
   - This makes testing much easier

2. **Use Descriptive Batch Names**
   - Example: `TEST-2025-01-15` instead of `Batch1`
   - Makes it easier to track test blocks

3. **Test with Small Quantities First**
   - Start with 10-20 QR codes for testing
   - Verify everything works before generating large batches

4. **Keep Test Data Separate**
   - Use a test organization or tenant
   - Don't mix test QR codes with production data

5. **Document Your Test Cases**
   - Keep track of which QR codes you've tested
   - Note any issues or edge cases discovered

## Example Test Workflow

```bash
# 1. Start backend
docker compose up

# 2. Open frontend
npm run dev

# 3. Create a test brand
# - Name: "Test Brand"
# - Short Code: "TEST"
# - Key pair auto-generated

# 4. Create a test product
# - Name: "Test Product"
# - GTIN: "1234567890123"
# - Link to Test Brand

# 5. Generate a small test block
# - Batch: "TEST-2025-01-15"
# - Quantity: 10
# - QR Type: Dynamic (D)
# - Serial Type: R6DAN
# - ✅ Include QR code images

# 6. Wait for completion
# - Status should change: pending → in_progress → completed

# 7. Download Excel
# - Should have 3 columns: QR URL, Serial Number, QR Code

# 8. Test scanning
# - Open Excel
# - Scan QR code with phone
# - Should redirect to the URL

# 9. Test authentication
# - Copy the QR URL from Excel
# - Parse the URL components
# - Call the /authenticate endpoint
# - Should return authentic: true
```

## Additional Resources

- **QR Code Specification**: ISO/IEC 18004
- **ECDSA Signature**: Uses P-256 curve (secp256r1)
- **QR Code Libraries**:
  - Python: `qrcode`, `segno`
  - JavaScript: `qrcode`, `qr-image`
  - Online: https://www.qr-code-generator.com/

## Support

If you encounter issues:

1. Check backend logs: `docker compose logs core-service`
2. Check browser console for frontend errors
3. Verify the block status is "completed"
4. Ensure the product has a linked brand with key pair
5. Test the authentication endpoint directly with curl
