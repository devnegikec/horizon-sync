# Quick QR Validation Test

## 🚀 Quick Start

```bash
# Terminal 1: Start backend
docker compose up core-service

# Terminal 2: Start frontend
npm run dev
```

## 🧪 Test URLs

### Test 1: Your Actual QR Code

```
http://localhost:4200/g/29734929342/s/EPHADY/1774976401039?c=MEUCIQDYSvi6+bjeumWjW8xuQ/HWgDdCBSL1H9v9cvBF/zX2YQIgGVDVrvioy+kGZ+BfuHQDx1jzd7v+kfeQLDC55jaU2zU=
```

### Test 2: Invalid Signature (Should Fail)

```
http://localhost:4200/g/29734929342/s/EPHADY/1774976401039?c=INVALID_SIGNATURE
```

### Test 3: Missing Serial (Should Show Error)

```
http://localhost:4200/g/29734929342/s//1774976401039?c=test
```

## ✅ Expected Results

### Test 1: Valid QR Code

- **Background**: Green gradient
- **Icon**: Green check circle
- **Title**: "Authentic Product"
- **Status**: "Verified Authentic" badge
- **Details**: Product name, brand, GTIN, serial number displayed

### Test 2: Invalid Signature

- **Background**: Red gradient
- **Icon**: Red X circle
- **Title**: "Authentication Failed"
- **Message**: "Authentication Failed" or signature error

### Test 3: Missing Parameters

- **Background**: Red gradient
- **Icon**: Red X circle
- **Title**: "Validation Failed"
- **Message**: "Invalid QR code format"

## 🔍 Debug Checklist

If validation fails, check:

1. **Backend Running?**

   ```bash
   curl http://localhost:8001/health
   ```

2. **Product Exists?**

   ```bash
   curl -X POST http://localhost:8001/api/v1/qr-products/authenticate \
     -H "Content-Type: application/json" \
     -d '{
       "serial_number": "EPHADY",
       "nonce": "1774976401039",
       "cipher": "MEUCIQDYSvi6+bjeumWjW8xuQ/HWgDdCBSL1H9v9cvBF/zX2YQIgGVDVrvioy+kGZ+BfuHQDx1jzd7v+kfeQLDC55jaU2zU="
     }'
   ```

3. **Frontend Running?**
   - Open http://localhost:4200
   - Should see the inventory app

4. **Browser Console**
   - Open DevTools (F12)
   - Check Console tab for errors
   - Check Network tab for API calls

## 📱 Mobile Test

1. **Generate QR Code**:
   - Go to http://localhost:4200/qseal
   - Create a block
   - Download Excel file

2. **Scan with Phone**:
   - Open Excel on computer
   - Use phone camera to scan QR code
   - Should open validation page

3. **Expected on Phone**:
   - Mobile-responsive layout
   - Large, readable text
   - Touch-friendly buttons
   - Smooth animations

## 🐛 Common Issues

### "Failed to validate QR code"

- Backend not running
- Wrong API URL in environment
- Network connectivity issue

### "Serial number not found"

- Product item doesn't exist in database
- Wrong serial number in URL
- Block generation failed

### "Authentication Failed"

- Invalid signature
- Tampered QR code
- Product not linked to brand with keys

### Page shows blank

- React Router not working
- Check browser console for errors
- Verify route is registered

## 🎯 Success Criteria

- ✅ Valid QR codes show green success screen
- ✅ Invalid QR codes show red error screen
- ✅ Product details display correctly
- ✅ Mobile responsive layout works
- ✅ Loading state shows while validating
- ✅ Error messages are user-friendly

## 📊 Test Matrix

| Test Case           | URL                            | Expected Result  |
| ------------------- | ------------------------------ | ---------------- |
| Valid QR            | Full URL with valid signature  | ✅ Green success |
| Invalid signature   | URL with wrong signature       | ❌ Red error     |
| Missing serial      | URL without serial             | ❌ Format error  |
| Missing cipher      | URL without ?c= param          | ❌ Format error  |
| Non-existent serial | Valid format, unknown serial   | ❌ Not found     |
| Expired timestamp   | Old timestamp (if implemented) | ❌ Expired       |

---

**Ready to test!** 🎉

Start both services and open the test URL in your browser.
