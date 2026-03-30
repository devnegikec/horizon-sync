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
        setError((body as { detail?: string }).detail || 'Download failed');
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
