import * as React from 'react';

import axios, { AxiosError } from 'axios';
import { useParams, useSearchParams } from 'react-router-dom';

import { environment } from '../../environments/environment';

const API_BASE_URL = environment.apiCoreUrl;

interface VerificationResult {
  message: string;
  authentic: boolean;
  product_name: string | null;
  brand_name: string | null;
  gtin: string | null;
  serial_number: string | null;
}

function LoadingView() {
  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <div style={styles.spinner} />
        <p style={styles.loadingText}>Verifying QR code...</p>
      </div>
    </div>
  );
}

function ErrorView({ message }: { message: string }) {
  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, borderTop: '4px solid #ef4444' }}>
        <div style={styles.iconError}>✕</div>
        <h2 style={styles.titleError}>Verification Error</h2>
        <p style={styles.message}>{message}</p>
      </div>
    </div>
  );
}

function ProductDetails({ result }: { result: VerificationResult }) {
  return (
    <div style={styles.details}>
      {result.product_name && (
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Product</span>
          <span style={styles.detailValue}>{result.product_name}</span>
        </div>
      )}
      {result.brand_name && (
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Brand</span>
          <span style={styles.detailValue}>{result.brand_name}</span>
        </div>
      )}
      {result.gtin && (
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>GTIN</span>
          <span style={{ ...styles.detailValue, fontFamily: 'monospace' }}>{result.gtin}</span>
        </div>
      )}
      {result.serial_number && (
        <div style={styles.detailRow}>
          <span style={styles.detailLabel}>Serial Number</span>
          <span style={{ ...styles.detailValue, fontFamily: 'monospace' }}>{result.serial_number}</span>
        </div>
      )}
    </div>
  );
}

function ResultView({ result }: { result: VerificationResult }) {
  const borderColor = result.authentic ? '#22c55e' : '#ef4444';

  return (
    <div style={styles.container}>
      <div style={{ ...styles.card, borderTop: `4px solid ${borderColor}` }}>
        {result.authentic ? (
          <>
            <div style={styles.iconSuccess}>✓</div>
            <h2 style={styles.titleSuccess}>Authentic Product22</h2>
            <p style={styles.message}>This QR code is genuine and verified.</p>
            <ProductDetails result={result} />
          </>
        ) : (
          <>
            <div style={styles.iconError}>✕</div>
            <h2 style={styles.titleError}>Verification Failed</h2>
            <p style={styles.message}>{result.message}</p>
          </>
        )}
      </div>
    </div>
  );
}

export function PublicQRValidation() {
  const { serial, timestamp } = useParams<{
    gtin: string;
    serial: string;
    timestamp: string;
  }>();
  const [searchParams] = useSearchParams();
  const cipher = searchParams.get('c');

  const [result, setResult] = React.useState<VerificationResult | null>(null);
  const [loading, setLoading] = React.useState(true);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (serial && timestamp && cipher) {
      verify(serial, timestamp, cipher);
    } else {
      setLoading(false);
      setError('Missing verification parameters');
    }
  }, [serial, timestamp, cipher]);

  const verify = async (serialNumber: string, nonce: string, sig: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await axios.post(
        `${API_BASE_URL}/api/v1/qr-products/authenticate`,
        { serial_number: serialNumber, nonce, cipher: sig }
      );
      setResult(res.data);
    } catch (err: unknown) {
      const axiosErr = err as AxiosError<Record<string, unknown>>;
      const data = axiosErr.response?.data;
      // API may return {detail: string}, {message: string}, or {message, status_code, code, errors}
      let detail = 'Verification failed';
      if (data) {
        if (typeof data.detail === 'string') detail = data.detail;
        else if (typeof data.message === 'string') detail = data.message;
        else if (typeof data.detail === 'object' && data.detail !== null) {
          const d = data.detail as Record<string, unknown>;
          detail = (typeof d.message === 'string' ? d.message : JSON.stringify(d));
        }
      }
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

  if (loading) return <LoadingView />;
  if (error && !result) return <ErrorView message={error} />;
  if (!result) return null;

  return <ResultView result={result} />;
}

const styles: Record<string, React.CSSProperties> = {
  container: {
    minHeight: '100vh',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    background: '#f9fafb',
    padding: 16,
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  },
  card: {
    background: '#fff',
    borderRadius: 12,
    padding: 32,
    maxWidth: 420,
    width: '100%',
    textAlign: 'center' as const,
    boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
  },
  spinner: {
    width: 40,
    height: 40,
    border: '4px solid #e5e7eb',
    borderTopColor: '#3b82f6',
    borderRadius: '50%',
    margin: '0 auto 16px',
    animation: 'spin 0.8s linear infinite',
  },
  loadingText: { color: '#6b7280', fontSize: 14 },
  iconSuccess: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#dcfce7',
    color: '#16a34a',
    fontSize: 28,
    lineHeight: '56px',
    margin: '0 auto 12px',
    fontWeight: 'bold' as const,
  },
  iconError: {
    width: 56,
    height: 56,
    borderRadius: '50%',
    background: '#fee2e2',
    color: '#dc2626',
    fontSize: 28,
    lineHeight: '56px',
    margin: '0 auto 12px',
    fontWeight: 'bold' as const,
  },
  titleSuccess: { color: '#16a34a', fontSize: 22, margin: '0 0 8px' },
  titleError: { color: '#dc2626', fontSize: 22, margin: '0 0 8px' },
  message: { color: '#6b7280', fontSize: 14, margin: '0 0 20px' },
  details: {
    borderTop: '1px solid #e5e7eb',
    paddingTop: 16,
    textAlign: 'left' as const,
  },
  detailRow: {
    display: 'flex',
    justifyContent: 'space-between',
    padding: '8px 0',
    borderBottom: '1px solid #f3f4f6',
  },
  detailLabel: { color: '#6b7280', fontSize: 13 },
  detailValue: { fontWeight: 500 as const, fontSize: 13 },
};
