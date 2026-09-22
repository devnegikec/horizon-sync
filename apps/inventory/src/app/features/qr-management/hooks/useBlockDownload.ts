import { useState } from 'react';

import { useUserStore } from '@horizon-sync/store';

import { environment } from '../../../../environments/environment';

export const useBlockDownload = () => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const accessToken = useUserStore((s) => s.accessToken);

  const download = async (blockId: string, filename?: string) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(
        `${environment.apiCoreUrl}/api/v1/qr-products/blocks/${blockId}/download`,
        { headers: { Authorization: `Bearer ${accessToken}` } },
      );

      if (res.status === 403) { setError('Download link expired. Click again to refresh.'); return; }
      if (res.status === 409) { setError('File is still generating. Please wait.'); return; }
      if (!res.ok) {
        const body = await res.json().catch(() => ({}));
        const detail = (body as { detail?: unknown }).detail;
        setError(typeof detail === 'string' ? detail : 'Download failed');
        return;
      }

      const contentType = res.headers.get('content-type') || '';
      if (contentType.includes('application/json')) {
        const body = await res.json() as { signed_url?: string };
        if (!body.signed_url) {
          setError('Download link was not returned by the server.');
          return;
        }
        const link = document.createElement('a');
        link.href = body.signed_url;
        link.rel = 'noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        return;
      }

      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename || `qr_block_${blockId}.xlsx`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch {
      setError('Download failed. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return { download, loading, error };
};
