import * as React from 'react';
import { useParams, useSearchParams } from 'react-router-dom';

import { CheckCircle2, XCircle, Loader2, QrCode } from 'lucide-react';

import { Button, Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { qrBlockService } from '../features/qr-management/services/qrBlockService';

interface VerificationResult {
  message: string;
  authentic: boolean;
  product_name: string | null;
  brand_name: string | null;
  gtin: string | null;
  serial_number: string | null;
}

export function QRVerifyPage() {
  const { serial, nonce } = useParams<{ serial?: string; nonce?: string }>();
  const [searchParams] = useSearchParams();
  const cipher = searchParams.get('c');

  const [qrUrl, setQrUrl] = React.useState('');
  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  // Auto-verify if URL params are present
  React.useEffect(() => {
    if (serial && nonce && cipher) {
      verifyQR({ serial_number: serial, nonce, cipher });
    }
  }, [serial, nonce, cipher]);

  const parseQRUrl = (url: string) => {
    try {
      const urlObj = new URL(url);
      const parts = urlObj.pathname.split('/');

      // GS1 Digital Link: /01/{gtin}/21/{serial}?c={sig}&n={nonce}
      const gs1Idx = parts.indexOf('21');
      if (gs1Idx !== -1 && parts[gs1Idx - 2] === '01' && parts[gs1Idx + 1]) {
        return {
          serial_number: parts[gs1Idx + 1],
          nonce: urlObj.searchParams.get('n') || '',
          cipher: urlObj.searchParams.get('c') || '',
        };
      }

      // Legacy: /g/{gtin}/s/{serial}/{nonce}?c={sig}
      const sIndex = parts.indexOf('s');

      if (sIndex === -1 || !parts[sIndex + 1] || !parts[sIndex + 2]) {
        throw new Error('Invalid QR URL format');
      }

      return {
        serial_number: parts[sIndex + 1],
        nonce: parts[sIndex + 2],
        cipher: urlObj.searchParams.get('c') || '',
      };
    } catch (err) {
      throw new Error('Invalid QR URL format. Expected: https://domain/01/{gtin}/21/{serial}?c={sig}&n={nonce} or https://domain/g/{gtin}/s/{serial}/{nonce}?c={signature}');
    }
  };

  const verifyQR = async (payload: { serial_number: string; nonce: string; cipher: string }) => {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await qrBlockService.authenticate(payload);
      setResult(res);
    } catch (err: any) {
      const detail = err.response?.data?.detail || 'Verification failed';
      setError(detail);
      setResult({
        authentic: false,
        message: detail,
        product_name: null,
        brand_name: null,
        gtin: null,
        serial_number: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleManualVerify = async () => {
    if (!qrUrl.trim()) return;

    try {
      const payload = parseQRUrl(qrUrl);
      await verifyQR(payload);
    } catch (err: any) {
      setError(err.message);
    }
  };

  return (
    <div className="container max-w-2xl mx-auto p-6 space-y-6">
      <div className="text-center space-y-2">
        <QrCode className="h-16 w-16 mx-auto text-primary" />
        <h1 className="text-3xl font-bold">QR Code Verification</h1>
        <p className="text-muted-foreground">
          Verify the authenticity of your QR code
        </p>
      </div>

      {/* Manual verification form */}
      {!serial && !nonce && (
        <Card>
          <CardHeader>
            <CardTitle>Enter QR URL</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="qr-url">QR Code URL</Label>
              <Input
                id="qr-url"
                type="text"
                value={qrUrl}
                onChange={(e) => setQrUrl(e.target.value)}
                placeholder="https://example.com/01/12345678901234/21/ABC123?c=...&n=..."
                className="font-mono text-sm"
              />
              <p className="text-xs text-muted-foreground">
                Paste the complete QR code URL from your scan
              </p>
            </div>
            <Button
              onClick={handleManualVerify}
              disabled={loading || !qrUrl.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Verifying...
                </>
              ) : (
                'Verify QR Code'
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Loading state */}
      {loading && !result && (
        <Card>
          <CardContent className="flex items-center justify-center py-12">
            <div className="text-center space-y-2">
              <Loader2 className="h-12 w-12 animate-spin mx-auto text-primary" />
              <p className="text-muted-foreground">Verifying QR code...</p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Error state */}
      {error && !result && (
        <Card className="border-destructive">
          <CardContent className="pt-6">
            <div className="flex items-start gap-3">
              <XCircle className="h-6 w-6 text-destructive shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold text-destructive">Verification Error</h3>
                <p className="text-sm text-muted-foreground mt-1">{error}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Result display */}
      {result && (
        <Card className={result.authentic ? 'border-green-500' : 'border-red-500'}>
          <CardContent className="pt-6">
            <div className="space-y-4">
              {/* Status header */}
              <div className="flex items-center gap-3">
                {result.authentic ? (
                  <>
                    <CheckCircle2 className="h-12 w-12 text-green-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-green-600">Authentic</h2>
                      <p className="text-sm text-muted-foreground">
                        This QR code is genuine and verified
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <XCircle className="h-12 w-12 text-red-600" />
                    <div>
                      <h2 className="text-2xl font-bold text-red-600">Invalid</h2>
                      <p className="text-sm text-muted-foreground">
                        This QR code could not be verified
                      </p>
                    </div>
                  </>
                )}
              </div>

              {/* Message */}
              <div className="p-3 bg-muted rounded-md">
                <p className="text-sm">{result.message}</p>
              </div>

              {/* Product details */}
              {result.authentic && (
                <div className="space-y-3 pt-4 border-t">
                  <h3 className="font-semibold">Product Details</h3>
                  <dl className="grid grid-cols-1 gap-3 text-sm">
                    {result.product_name && (
                      <div>
                        <dt className="text-muted-foreground">Product</dt>
                        <dd className="font-medium">{result.product_name}</dd>
                      </div>
                    )}
                    {result.brand_name && (
                      <div>
                        <dt className="text-muted-foreground">Brand</dt>
                        <dd className="font-medium">{result.brand_name}</dd>
                      </div>
                    )}
                    {result.gtin && (
                      <div>
                        <dt className="text-muted-foreground">GTIN</dt>
                        <dd className="font-mono">{result.gtin}</dd>
                      </div>
                    )}
                    {result.serial_number && (
                      <div>
                        <dt className="text-muted-foreground">Serial Number</dt>
                        <dd className="font-mono">{result.serial_number}</dd>
                      </div>
                    )}
                  </dl>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Help text */}
      <Card className="bg-muted/50">
        <CardContent className="pt-6">
          <h3 className="font-semibold mb-2">How to use</h3>
          <ul className="text-sm text-muted-foreground space-y-1 list-disc list-inside">
            <li>Scan the QR code with your mobile device</li>
            <li>The verification will happen automatically</li>
            <li>Or paste the complete QR URL in the form above</li>
            <li>Authentic products will show a green checkmark</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}
