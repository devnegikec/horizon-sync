# QR Code Validation Flow - Visual Guide

## 🔄 Complete Flow Diagram

```
┌─────────────────────────────────────────────────────────────────┐
│                     QR CODE GENERATION                          │
│                                                                 │
│  1. User creates QR Block in QSeal UI                          │
│     ↓                                                           │
│  2. Backend generates unique serial numbers                     │
│     ↓                                                           │
│  3. For each item:                                             │
│     • Create message: "{gtin}|{serial}|{timestamp}"            │
│     • Sign with brand's private key (ECDSA P-256)              │
│     • Encode signature as base64                               │
│     ↓                                                           │
│  4. Generate QR URL:                                           │
│     http://localhost:4200/g/{gtin}/s/{serial}/{ts}?c={sig}    │
│     ↓                                                           │
│  5. Create QR code image from URL                              │
│     ↓                                                           │
│  6. Export to Excel with QR images                             │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     CONSUMER SCANNING                           │
│                                                                 │
│  1. Consumer opens phone camera                                │
│     ↓                                                           │
│  2. Points camera at QR code                                   │
│     ↓                                                           │
│  3. Phone detects QR code                                      │
│     ↓                                                           │
│  4. Shows notification: "Open in browser?"                     │
│     ↓                                                           │
│  5. Consumer taps notification                                 │
│     ↓                                                           │
│  6. Browser opens URL:                                         │
│     http://localhost:4200/g/29734929342/s/EPHADY/1774976...   │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     FRONTEND ROUTING                            │
│                                                                 │
│  1. React Router receives request                              │
│     ↓                                                           │
│  2. Matches route: /g/:gtin/s/:serial/:timestamp               │
│     ↓                                                           │
│  3. Loads QRValidationPage component                           │
│     ↓                                                           │
│  4. Component extracts URL parameters:                         │
│     • gtin = "29734929342"                                     │
│     • serial = "EPHADY"                                        │
│     • timestamp = "1774976401039"                              │
│     • cipher = "MEUCIQDYSvi6..." (from ?c= query param)        │
│     ↓                                                           │
│  5. Shows loading spinner                                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     API VALIDATION                              │
│                                                                 │
│  1. Frontend calls:                                            │
│     POST http://localhost:8001/api/v1/qr-products/authenticate │
│     {                                                          │
│       "serial_number": "EPHADY",                               │
│       "nonce": "1774976401039",                                │
│       "cipher": "MEUCIQDYSvi6..."                              │
│     }                                                          │
│     ↓                                                           │
│  2. Backend receives request                                   │
│     ↓                                                           │
│  3. Lookup product item by serial_number                       │
│     ↓                                                           │
│  4. Get associated brand and public key                        │
│     ↓                                                           │
│  5. Reconstruct message: "{gtin}|{serial}|{timestamp}"         │
│     ↓                                                           │
│  6. Decode base64 signature                                    │
│     ↓                                                           │
│  7. Verify signature using public key (ECDSA P-256)            │
│     ↓                                                           │
│  8. Return result:                                             │
│     {                                                          │
│       "authentic": true/false,                                 │
│       "message": "...",                                        │
│       "product_name": "...",                                   │
│       "brand_name": "..."                                      │
│     }                                                          │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
                              ↓
                              ↓
┌─────────────────────────────────────────────────────────────────┐
│                     RESULT DISPLAY                              │
│                                                                 │
│  IF AUTHENTIC:                                                 │
│  ┌─────────────────────────────────────┐                      │
│  │  ✅ Authentic Product                │                      │
│  │                                      │                      │
│  │  Product: Widget Pro                 │                      │
│  │  Brand: ACME Corp                    │                      │
│  │  GTIN: 29734929342                   │                      │
│  │  Serial: EPHADY                      │                      │
│  │                                      │                      │
│  │  🛡️ Verified Authentic               │                      │
│  │                                      │                      │
│  │  This product has been verified      │                      │
│  │  using digital signature technology. │                      │
│  └─────────────────────────────────────┘                      │
│                                                                 │
│  IF NOT AUTHENTIC:                                             │
│  ┌─────────────────────────────────────┐                      │
│  │  ❌ Authentication Failed            │                      │
│  │                                      │                      │
│  │  This QR code could not be verified. │                      │
│  │  It may be counterfeit or tampered.  │                      │
│  │                                      │                      │
│  │  Please contact the manufacturer.    │                      │
│  └─────────────────────────────────────┘                      │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## 🔐 Security Flow

```
┌──────────────────┐
│  Brand Created   │
│                  │
│  Auto-generates: │
│  • Private Key   │
│  • Public Key    │
│  (ECDSA P-256)   │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  QR Generation   │
│                  │
│  Message:        │
│  gtin|serial|ts  │
│                  │
│  Sign with       │
│  Private Key     │
│  ↓               │
│  Signature       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  QR Code URL     │
│                  │
│  Contains:       │
│  • Message parts │
│  • Signature     │
│                  │
│  Cannot be       │
│  modified!       │
└────────┬─────────┘
         │
         ▼
┌──────────────────┐
│  Validation      │
│                  │
│  Reconstruct     │
│  message         │
│                  │
│  Verify with     │
│  Public Key      │
│  ↓               │
│  ✅ or ❌        │
└──────────────────┘
```

## 📱 Mobile Scanning Flow

```
┌─────────────────────────────────────────────────────────────┐
│                                                             │
│  📱 PHONE SCREEN                                            │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │         📷 Camera View                              │   │
│  │                                                     │   │
│  │              ┌─────────┐                            │   │
│  │              │ ▓▓▓▓▓▓▓ │                            │   │
│  │              │ ▓     ▓ │  ← QR Code                 │   │
│  │              │ ▓ ▓▓▓ ▓ │                            │   │
│  │              │ ▓     ▓ │                            │   │
│  │              │ ▓▓▓▓▓▓▓ │                            │   │
│  │              └─────────┘                            │   │
│  │                                                     │   │
│  │  ┌─────────────────────────────────────────────┐   │   │
│  │  │ 🔗 Open "localhost:4200/g/..."             │   │   │
│  │  └─────────────────────────────────────────────┘   │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  User taps notification ↓                                  │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │         🌐 Browser Opens                            │   │
│  │                                                     │   │
│  │         🔄 Validating QR Code...                    │   │
│  │                                                     │   │
│  │         Please wait                                 │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
│  After 1 second ↓                                          │
│                                                             │
│  ┌─────────────────────────────────────────────────────┐   │
│  │                                                     │   │
│  │         ✅ Authentic Product                        │   │
│  │                                                     │   │
│  │         Product: Widget Pro                         │   │
│  │         Brand: ACME Corp                            │   │
│  │         GTIN: 29734929342                           │   │
│  │         Serial: EPHADY                              │   │
│  │                                                     │   │
│  │         🛡️ Verified Authentic                       │   │
│  │                                                     │   │
│  │         This product has been verified              │   │
│  │         using digital signature technology.         │   │
│  │                                                     │   │
│  └─────────────────────────────────────────────────────┘   │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🎯 Component Hierarchy

```
App (BrowserRouter)
│
├─ Route: /g/:gtin/s/:serial/:timestamp
│  │
│  └─ QRValidationPage
│     │
│     ├─ useParams() → Extract gtin, serial, timestamp
│     ├─ useSearchParams() → Extract cipher from ?c=
│     │
│     ├─ useEffect() → Call API on mount
│     │  │
│     │  └─ fetch('/api/v1/qr-products/authenticate')
│     │
│     ├─ Loading State
│     │  └─ Loader2 spinner + "Validating..."
│     │
│     ├─ Success State (if authentic)
│     │  ├─ CheckCircle icon
│     │  ├─ Product details
│     │  ├─ "Verified Authentic" badge
│     │  └─ Security message
│     │
│     └─ Error State (if not authentic)
│        ├─ XCircle icon
│        ├─ Error message
│        └─ Contact manufacturer message
│
└─ Route: /*
   │
   └─ MainApp (authenticated routes)
      ├─ Navigation bar
      └─ Routes for Items, Warehouses, etc.
```

## 🔄 State Machine

```
┌─────────────┐
│   INITIAL   │
│             │
│  Component  │
│   Mounts    │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│   LOADING   │
│             │
│  • Spinner  │
│  • API call │
└──────┬──────┘
       │
       ├─────────────┐
       │             │
       ▼             ▼
┌─────────────┐  ┌─────────────┐
│   SUCCESS   │  │    ERROR    │
│             │  │             │
│  • Green    │  │  • Red      │
│  • Details  │  │  • Message  │
│  • Badge    │  │  • Warning  │
└─────────────┘  └─────────────┘
```

## 📊 Data Flow

```
URL Parameters
    ↓
┌─────────────────────┐
│  gtin: "29734..."   │
│  serial: "EPHADY"   │
│  timestamp: "1774..." │
│  cipher: "MEUCI..." │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API Request        │
│  {                  │
│    serial_number,   │
│    nonce,           │
│    cipher           │
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  Backend            │
│  • Lookup item      │
│  • Get brand        │
│  • Verify signature │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  API Response       │
│  {                  │
│    authentic: bool, │
│    message: str,    │
│    product_name,    │
│    brand_name       │
│  }                  │
└──────────┬──────────┘
           │
           ▼
┌─────────────────────┐
│  UI Update          │
│  • Show result      │
│  • Display details  │
│  • Update colors    │
└─────────────────────┘
```

## 🎨 Visual States

### State 1: Loading

```
┌──────────────────────────┐
│                          │
│      ⏳ Loading...       │
│                          │
│   Spinner animation      │
│   "Validating QR Code"   │
│   "Please wait"          │
│                          │
│   Background: Blue       │
│   Duration: ~1 second    │
│                          │
└──────────────────────────┘
```

### State 2: Success

```
┌──────────────────────────┐
│                          │
│   ✅ Authentic Product   │
│                          │
│   Product: Widget Pro    │
│   Brand: ACME Corp       │
│   GTIN: 29734929342      │
│   Serial: EPHADY         │
│                          │
│   🛡️ Verified Badge      │
│                          │
│   Security message       │
│                          │
│   Background: Green      │
│   Confidence: High       │
│                          │
└──────────────────────────┘
```

### State 3: Error

```
┌──────────────────────────┐
│                          │
│   ❌ Authentication      │
│      Failed              │
│                          │
│   Error message          │
│   Explanation            │
│   Contact info           │
│                          │
│   Background: Red        │
│   Warning: High          │
│                          │
└──────────────────────────┘
```

---

**Visual Guide Complete!** 🎨

Use this to understand how everything connects together.
