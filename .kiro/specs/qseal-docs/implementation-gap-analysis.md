# QSeal Products-MFE Implementation Gap Analysis

**Date:** March 31, 2026  
**Status:** Analysis Complete  
**Reviewed Against:** `migration_frontend_products_mfe.md`

---

## Executive Summary

Your current implementation has **most core features** in place but is missing several critical components specified in the technical specification. The gaps primarily relate to:

1. **Exponential backoff polling** (currently fixed 3s interval)
2. **Progress tracking** (0-100% indicator)
3. **Notification system** (toast-based feedback)
4. **QR Authentication endpoint** (public verification)
5. **Remaining credits display**
6. **Error handling for specific HTTP codes** (409, 422 credit errors)
7. **Local network QR validation setup**

---

## Detailed Gap Analysis

### ✅ **Implemented Features**

| Feature               | Status      | Location                                 |
| --------------------- | ----------- | ---------------------------------------- |
| BlockCreateForm       | ✅ Complete | `CreateBlockDialog.tsx`                  |
| Product search/select | ✅ Complete | `CreateBlockDialog.tsx` (ProductSelect)  |
| Block status polling  | ✅ Partial  | `useBlockStatus.ts` (fixed interval)     |
| BlockItemsTable       | ✅ Complete | `BlockDetailDialog.tsx`                  |
| Download button       | ✅ Complete | `BlockDetailDialog.tsx` (DownloadButton) |
| Status badges         | ✅ Complete | `BlockDetailDialog.tsx` (STATUS_BADGE)   |
| API service layer     | ✅ Complete | `qrBlockService.ts`                      |
| JWT auth headers      | ✅ Complete | `qrBlockService.ts`                      |

---

### ❌ **Missing Features**

#### 1. **Exponential Backoff Polling** ⚠️ HIGH PRIORITY

**Spec Requirement:**

> Start at 1s intervals. Apply exponential backoff (e.g., 1s → 3s → 10s) to reduce server load for large batches.

**Current Implementation:**

```typescript
// useBlockStatus.ts - Line 8
const POLL_MS = 3000; // Fixed 3-second interval
```

**Gap:** No exponential backoff. All blocks poll at 3s regardless of size.

**Recommended Fix:**

```typescript
// useBlockStatus.ts - Enhanced version
const INITIAL_POLL_MS = 1000;
const MAX_POLL_MS = 10000;
const BACKOFF_MULTIPLIER = 1.5;

export const useBlockStatus = (blockId: string | null) => {
  const [block, setBlock] = useState<QRBlock | null>(null);
  const [loading, setLoading] = useState(false);
  const [pollInterval, setPollInterval] = useState(INITIAL_POLL_MS);
  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const stop = () => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }
  };

  const poll = async () => {
    if (!blockId) return;
    try {
      const data = await qrBlockService.getBlock(blockId);
      setBlock(data);

      if (TERMINAL.includes(data.status)) {
        stop();
      } else {
        // Exponential backoff
        const nextInterval = Math.min(pollInterval * BACKOFF_MULTIPLIER, MAX_POLL_MS);
        setPollInterval(nextInterval);
        timeoutRef.current = setTimeout(poll, nextInterval);
      }
    } catch {
      // Retry with backoff on error
      const nextInterval = Math.min(pollInterval * BACKOFF_MULTIPLIER, MAX_POLL_MS);
      setPollInterval(nextInterval);
      timeoutRef.current = setTimeout(poll, nextInterval);
    }
  };

  useEffect(() => {
    if (!blockId) return;
    setPollInterval(INITIAL_POLL_MS); // Reset on new block
    setLoading(true);
    poll().finally(() => setLoading(false));
    return stop;
  }, [blockId]);

  return { block, loading, pollInterval };
};
```

---

#### 2. **Progress Indicator (0-100%)** ⚠️ MEDIUM PRIORITY

**Spec Requirement:**

> Returns status, progress (0-100), and download_url.

**Current Implementation:**

- No `progress` field in TypeScript types
- No progress bar in UI

**Gap:** Backend may return progress, but frontend doesn't display it.

**Recommended Fix:**

**Update types:**

```typescript
// qrBlock.types.ts
export interface QRBlock {
  id: string;
  product_id: string;
  batch: string;
  quantity: number;
  qr_type: QRType | null;
  status: BlockStatus;
  progress?: number; // 0-100 ← ADD THIS
  task_id: string | null;
  download_url: string | null;
  completed_at: string | null;
  created_at: string;
  updated_at: string;
}
```

**Add progress bar to BlockDetailDialog:**

```typescript
// BlockDetailDialog.tsx - Add to BlockInfoPanel
{block.status === 'in_progress' && block.progress !== undefined && (
  <div className="col-span-2 space-y-2">
    <div className="flex items-center justify-between text-sm">
      <span className="text-muted-foreground">Progress</span>
      <span className="font-medium">{block.progress}%</span>
    </div>
    <div className="w-full bg-gray-200 rounded-full h-2">
      <div
        className="bg-blue-600 h-2 rounded-full transition-all duration-300"
        style={{ width: `${block.progress}%` }}
      />
    </div>
  </div>
)}
```

---

#### 3. **Toast Notification System** ⚠️ HIGH PRIORITY

**Spec Requirement:**

> Toast-based feedback for success, warnings, and API errors.

**Current Implementation:**

- Inline error messages only
- No success notifications
- No global error handling

**Gap:** No toast/notification system implemented.

**Recommended Fix:**

Install a toast library:

```bash
npm install sonner
# or
npm install react-hot-toast
```

**Create notification service:**

```typescript
// services/notificationService.ts
import { toast } from 'sonner'; // or react-hot-toast

export const notificationService = {
  success: (message: string) => toast.success(message),
  error: (message: string) => toast.error(message),
  warning: (message: string) => toast.warning(message),
  info: (message: string) => toast.info(message),

  // Specific handlers
  insufficientCredits: (available: number, required: number) => {
    toast.error(`Insufficient credits: ${available} available, ${required} required. Please contact support.`, { duration: 6000 });
  },

  blockGenerating: () => {
    toast.info('Block generation started. This may take a few minutes.');
  },

  blockCompleted: (blockNo: string) => {
    toast.success(`Block ${blockNo} generated successfully!`);
  },

  networkError: () => {
    toast.error('Connection lost. Retrying...', { duration: 3000 });
  },
};
```

**Add to App root:**

```typescript
// app.tsx
import { Toaster } from 'sonner';

export function App() {
  return (
    <>
      <Toaster position="top-right" richColors />
      {/* ... rest of app */}
    </>
  );
}
```

**Use in CreateBlockDialog:**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    notificationService.blockGenerating();
    const block = await createBlock(productId, { ... });
    notificationService.blockCompleted(block.batch);
    onCreated(block.id);
  } catch (err: any) {
    if (err.response?.status === 422) {
      const detail = err.response.data?.detail || '';
      if (detail.includes('Insufficient credits')) {
        // Parse available/required from error message
        notificationService.insufficientCredits(0, quantity);
      }
    } else {
      notificationService.error('Failed to create block');
    }
  }
};
```

---

#### 4. **QR Authentication Endpoint** ⚠️ HIGH PRIORITY

**Spec Requirement:**

> Public endpoint to verify ECDSA-signed QR codes.

**Current Implementation:**

- No authentication endpoint in `qrBlockService.ts`
- No public QR verification page

**Gap:** Cannot validate QR codes after generation.

**Recommended Fix:**

**Add to qrBlockService.ts:**

```typescript
// Public endpoint - no auth required
async authenticate(data: {
  serial_number: string;
  nonce: string;
  cipher: string;
}): Promise<{
  message: string;
  authentic: boolean;
  product_name: string | null;
  brand_name: string | null;
  gtin: string | null;
  serial_number: string | null;
}> {
  const res = await axios.post(
    `${API_BASE_URL}/api/v1/qr-products/authenticate`,
    data,
    // NO AUTH HEADER - public endpoint
  );
  return res.data;
}
```

**Create QR scanner page:**

```typescript
// pages/QRVerify.tsx
import { useState } from 'react';
import { qrBlockService } from '../features/qr-management/services/qrBlockService';

export function QRVerifyPage() {
  const [qrUrl, setQrUrl] = useState('');
  const [result, setResult] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const parseQRUrl = (url: string) => {
    const urlObj = new URL(url);
    const parts = urlObj.pathname.split('/');
    const sIndex = parts.indexOf('s');
    return {
      serial_number: parts[sIndex + 1],
      nonce: parts[sIndex + 2],
      cipher: urlObj.searchParams.get('c') || '',
    };
  };

  const handleVerify = async () => {
    setLoading(true);
    try {
      const payload = parseQRUrl(qrUrl);
      const res = await qrBlockService.authenticate(payload);
      setResult(res);
    } catch (err: any) {
      setResult({ authentic: false, message: 'Verification failed' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Verify QR Code</h1>
      <input
        type="text"
        value={qrUrl}
        onChange={(e) => setQrUrl(e.target.value)}
        placeholder="Paste QR URL here"
        className="w-full p-2 border rounded mb-4"
      />
      <button
        onClick={handleVerify}
        disabled={loading || !qrUrl}
        className="w-full bg-blue-600 text-white p-2 rounded"
      >
        {loading ? 'Verifying...' : 'Verify'}
      </button>

      {result && (
        <div className={`mt-4 p-4 rounded ${result.authentic ? 'bg-green-100' : 'bg-red-100'}`}>
          <h2 className="font-bold">{result.authentic ? '✓ Authentic' : '✗ Invalid'}</h2>
          <p>{result.message}</p>
          {result.authentic && (
            <div className="mt-2 text-sm">
              <p>Product: {result.product_name}</p>
              <p>Brand: {result.brand_name}</p>
              <p>GTIN: {result.gtin}</p>
              <p>Serial: {result.serial_number}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
```

---

#### 5. **Remaining Credits Display** ⚠️ MEDIUM PRIORITY

**Spec Requirement:**

> System displays "Remaining Credits" badge.

**Current Implementation:**

- No credits display in CreateBlockDialog

**Gap:** Users don't know how many credits they have before creating a block.

**Recommended Fix:**

**Create credits hook:**

```typescript
// hooks/useQRCredits.ts
import { useState, useEffect } from 'react';
import axios from 'axios';
import { useUserStore } from '@horizon-sync/store';
import { environment } from '../../../environments/environment';

export const useQRCredits = () => {
  const [credits, setCredits] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const accessToken = useUserStore((s) => s.accessToken);

  useEffect(() => {
    const fetchCredits = async () => {
      try {
        const res = await axios.get(`${environment.apiCoreUrl}/api/v1/qr-credits/balance`, { headers: { Authorization: `Bearer ${accessToken}` } });
        setCredits(res.data.balance_credits);
      } catch {
        setCredits(null);
      } finally {
        setLoading(false);
      }
    };
    fetchCredits();
  }, [accessToken]);

  return { credits, loading };
};
```

**Add to CreateBlockDialog:**

```typescript
export function CreateBlockDialog({ ... }) {
  const { credits, loading: creditsLoading } = useQRCredits();
  // ... rest of component

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center justify-between">
            <span>Generate QR Block</span>
            {!creditsLoading && credits !== null && (
              <Badge variant={credits < 500 ? 'destructive' : 'secondary'}>
                {credits.toLocaleString()} credits remaining
              </Badge>
            )}
          </DialogTitle>
        </DialogHeader>
        {/* ... form */}
      </DialogContent>
    </Dialog>
  );
}
```

---

#### 6. **Enhanced Error Handling** ⚠️ MEDIUM PRIORITY

**Spec Requirement:**

> - 422: Trigger "Insufficient Credits" modal
> - 409: Block is locked/generating; maintain polling state
> - Network Failure: Automatic retry with exponential backoff

**Current Implementation:**

- Generic error messages
- No specific handling for 409 or 422
- No retry logic

**Gap:** Error handling is too generic.

**Recommended Fix:**

**Create error interceptor:**

```typescript
// services/apiClient.ts
import axios from 'axios';
import { notificationService } from './notificationService';

export const apiClient = axios.create({
  baseURL: environment.apiCoreUrl,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    const detail = error.response?.data?.detail || '';

    switch (status) {
      case 401:
        // Redirect to login
        window.location.href = '/login';
        break;

      case 409:
        // Block is locked - this is expected during generation
        // Don't show error, just continue polling
        break;

      case 422:
        if (detail.includes('Insufficient credits')) {
          const match = detail.match(/available=(\d+), required=(\d+)/);
          if (match) {
            notificationService.insufficientCredits(parseInt(match[1]), parseInt(match[2]));
          } else {
            notificationService.error('Insufficient QR credits');
          }
        } else {
          notificationService.error(detail || 'Validation error');
        }
        break;

      case 500:
        notificationService.error('Server error. Please try again.');
        break;

      default:
        if (!navigator.onLine) {
          notificationService.networkError();
        }
    }

    return Promise.reject(error);
  },
);
```

---

#### 7. **BlockStatusPanel Component** ⚠️ LOW PRIORITY

**Spec Requirement:**

> Displays real-time progress, status badges, and download links.

**Current Implementation:**

- Functionality exists in `BlockDetailDialog`
- Not a separate reusable component

**Gap:** Minor - functionality exists but not as a standalone component.

**Recommended Fix:**
Extract `BlockInfoPanel` from `BlockDetailDialog.tsx` into a separate file for reusability.

---

## Local Network QR Validation Setup

### Problem

You want to scan QR codes generated in your dev environment using a mobile device on your local network.

### Solution: ngrok + Local Backend

#### Step 1: Install ngrok

```bash
# macOS
brew install ngrok

# Or download from https://ngrok.com/download
```

#### Step 2: Start your backend

```bash
# Assuming FastAPI runs on port 8001
docker compose up core-service
# or
uvicorn main:app --host 0.0.0.0 --port 8001
```

#### Step 3: Expose backend via ngrok

```bash
ngrok http 8001
```

You'll get output like:

```
Forwarding  https://abc123.ngrok.io -> http://localhost:8001
```

#### Step 4: Update QR URL generation

**Option A: Environment variable (recommended)**

```bash
# .env.local
REACT_APP_QR_BASE_URL=https://abc123.ngrok.io
```

**Option B: Backend configuration**
Update your FastAPI QR generation service to use the ngrok URL:

```python
# core-service/app/services/qr_product_service.py
QR_BASE_URL = os.getenv("QR_BASE_URL", "https://abc123.ngrok.io")

def generate_qr_url(serial_number: str, nonce: str, signature: str) -> str:
    return f"{QR_BASE_URL}/g/{gtin}/s/{serial_number}/{nonce}?c={signature}"
```

#### Step 5: Test QR scanning

1. Generate a new block with the ngrok URL
2. Download the Excel file
3. Open QR codes on your mobile device
4. Scan with any QR scanner app
5. The URL will hit your ngrok tunnel → local backend

#### Step 6: Create a public verification page

**Add route to your frontend:**

```typescript
// App.tsx or routes.tsx
<Route path="/verify/:serial/:nonce" element={<QRVerifyPage />} />
```

**QR URL format:**

```
https://abc123.ngrok.io/verify/ABC123/1234567890?c=base64signature
```

**Verification page auto-verifies on load:**

```typescript
// pages/QRVerifyPage.tsx
import { useParams, useSearchParams } from 'react-router-dom';

export function QRVerifyPage() {
  const { serial, nonce } = useParams();
  const [searchParams] = useSearchParams();
  const cipher = searchParams.get('c');

  useEffect(() => {
    if (serial && nonce && cipher) {
      verifyQR({ serial_number: serial, nonce, cipher });
    }
  }, [serial, nonce, cipher]);

  // ... rest of component
}
```

---

### Alternative: Local Network Access (No ngrok)

If you want to test without ngrok:

#### Step 1: Find your local IP

```bash
# macOS
ipconfig getifaddr en0
# Example output: 192.168.1.100
```

#### Step 2: Update backend to bind to 0.0.0.0

```bash
# docker-compose.yml
services:
  core-service:
    ports:
      - "8001:8001"
    command: uvicorn main:app --host 0.0.0.0 --port 8001
```

#### Step 3: Update QR URLs to use local IP

```python
QR_BASE_URL = "http://192.168.1.100:8001"
```

#### Step 4: Access from mobile

- Connect mobile to same WiFi
- Scan QR code
- URL will be `http://192.168.1.100:8001/verify/...`

**Limitation:** HTTPS signature verification may fail if your QR codes expect HTTPS but you're using HTTP.

---

## Priority Roadmap

### Phase 1: Critical Fixes (Week 1)

- [ ] Implement exponential backoff polling
- [ ] Add toast notification system
- [ ] Add QR authentication endpoint
- [ ] Set up ngrok for local QR testing

### Phase 2: UX Enhancements (Week 2)

- [ ] Add progress bar (0-100%)
- [ ] Display remaining credits
- [ ] Enhanced error handling (409, 422)

### Phase 3: Polish (Week 3)

- [ ] Extract BlockStatusPanel component
- [ ] Add unit tests (Jest + RTL)
- [ ] Add E2E tests (Cypress/Playwright)

---

## Testing Checklist

### Manual Testing

- [ ] Create block with 100 QR codes
- [ ] Verify exponential backoff (check network tab)
- [ ] Test insufficient credits error
- [ ] Test network failure retry
- [ ] Scan generated QR code on mobile
- [ ] Verify QR authentication works

### Automated Testing

- [ ] Unit tests for useBlockStatus hook
- [ ] Unit tests for notification service
- [ ] Integration tests with MSW
- [ ] E2E test: Create → Poll → Download flow

---

## Conclusion

Your implementation is **70% complete** compared to the spec. The core functionality works, but you're missing:

1. **Exponential backoff** (performance optimization)
2. **Toast notifications** (UX feedback)
3. **QR authentication** (verification flow)
4. **Credits display** (user awareness)
5. **Local QR testing setup** (dev workflow)

Focus on Phase 1 items first, as they're critical for production readiness.
