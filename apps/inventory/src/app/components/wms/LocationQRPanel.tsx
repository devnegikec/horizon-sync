import * as React from 'react';

import { Printer, RefreshCw, Check, Loader2 } from 'lucide-react';
import QRCode from 'qrcode';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { useToast } from '@horizon-sync/ui/hooks';

import type { WarehouseLocation } from '../../types/wms.types';
import { layoutApi } from '../../utility/api/wms';

interface LocationQRPanelProps {
  warehouseId?: string;
}

async function generateQRDataUrl(data: string, size = 200): Promise<string> {
  return QRCode.toDataURL(data, { width: size, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
}

/**
 * Build the JSON payload encoded inside each bin QR.
 *
 * The mobile app (BWmobile) accepts either a 5-char short code or a JSON
 * payload of shape `{ type: "location", location_id, ... }`. Floor-plan
 * generated bins have no 5-char `qr_code` (their `code` is a dashed path like
 * "L01-BN01"), so the QR must carry the JSON payload with the location UUID —
 * otherwise scanning fails with "Invalid Code".
 */
function buildQrPayload(loc: WarehouseLocation): string {
  return JSON.stringify({
    type: 'location',
    location_id: loc.id,
    warehouse_id: loc.warehouse_id,
    full_path: loc.full_path || loc.code,
    location_code: loc.code,
    qr_code: loc.qr_code || loc.code,
  });
}

/**
 * Print a standalone HTML document using a hidden iframe.
 *
 * Using `window.open()` + `document.write()` + `print()` is fragile: popup
 * blockers can return null, and calling `print()` on a fixed 250ms timer can
 * race the document load, which freezes the tab while Chrome builds the print
 * preview. The iframe avoids popup blockers and waits for the document (and
 * embedded images) to be ready before invoking print.
 */
function printHTML(html: string): Promise<void> {
  return new Promise((resolve) => {
    const iframe = document.createElement('iframe');
    iframe.setAttribute('aria-hidden', 'true');
    iframe.style.position = 'fixed';
    iframe.style.right = '0';
    iframe.style.bottom = '0';
    iframe.style.width = '0';
    iframe.style.height = '0';
    iframe.style.border = '0';
    document.body.appendChild(iframe);

    const cleanup = () => {
      // Let the print dialog take over before removing the document.
      setTimeout(() => {
        iframe.remove();
        resolve();
      }, 500);
    };

    const contentWindow = iframe.contentWindow;
    const contentDocument = iframe.contentDocument;
    if (!contentWindow || !contentDocument) {
      iframe.remove();
      resolve();
      return;
    }

    contentDocument.open();
    contentDocument.write(html);
    contentDocument.close();

    const doPrint = () => {
      try {
        contentWindow.focus();
        contentWindow.print();
      } catch {
        // ignore — cleanup still runs
      }
      cleanup();
    };

    if (contentDocument.readyState === 'complete') {
      // Give the browser a tick to paint embedded images before printing.
      setTimeout(doPrint, 50);
    } else {
      let fired = false;
      const trigger = () => {
        if (fired) return;
        fired = true;
        setTimeout(doPrint, 50);
      };
      contentWindow.addEventListener('load', trigger);
      // Fallback in case `load` never fires.
      setTimeout(trigger, 800);
    }
  });
}

// ── QR image that only renders once the row is near the viewport ──
// Generating a QR PNG is CPU-heavy. Eagerly generating one for every bin in
// the table floods the main thread (and shows up as hundreds of
// `data:image/png;base64` entries in the Network tab), which hangs the UI.
// IntersectionObserver defers generation to the rows actually on screen.
// Declared at module scope (and memoized) so a parent re-render never changes
// its identity and remounts the row, restarting observers and QR generation.
const LazyQrCode = React.memo(function LazyQrCode({ value, size }: { value: string; size: number }) {
  const ref = React.useRef<HTMLDivElement | null>(null);
  const [inView, setInView] = React.useState(false);
  const [img, setImg] = React.useState<string>('');

  React.useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setInView(true);
      return;
    }
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting)) {
          setInView(true);
          observer.disconnect();
        }
      },
      { rootMargin: '200px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  React.useEffect(() => {
    if (!inView) return;
    let cancelled = false;
    generateQRDataUrl(value, size)
      .then((url) => {
        if (!cancelled) setImg(url);
      })
      .catch(() => { });
    return () => {
      cancelled = true;
    };
  }, [inView, value, size]);

  return (
    <div ref={ref} className="inline-flex items-center justify-center w-[80px] h-[80px]">
      {img ? (
        <img src={img} alt="QR" className="w-[80px] h-[80px] rounded border" />
      ) : (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      )}
    </div>
  );
});

// ── QR Row sub-component ──
function QRRow({ loc, qrValue, selected, onToggle, onPrint, printing }: {
  loc: WarehouseLocation;
  qrValue: string;
  selected: boolean;
  onToggle: () => void;
  onPrint: () => void;
  printing: boolean;
}) {
  // The QR image encodes the resolvable JSON payload; `qrValue` is only the
  // human-readable short code shown in the table.
  const qrPayload = React.useMemo(() => buildQrPayload(loc), [loc]);
  return (
    <tr className="border-t hover:bg-muted/30">
      <td className="p-3">
        <Checkbox checked={selected} onCheckedChange={onToggle} />
      </td>
      <td className="p-3 font-mono text-xs">{loc.full_path || loc.code}</td>
      <td className="p-3">
        <span className="font-mono text-sm font-bold text-blue-600 tracking-wider">{qrValue}</span>
      </td>
      <td className="p-3 text-xs text-muted-foreground">
        {loc.available_capacity}/{loc.total_capacity} {loc.capacity_uom || 'units'}
      </td>
      <td className="p-3 text-center">
        <div className="inline-flex flex-col items-center gap-1">
          <LazyQrCode value={qrPayload} size={120} />
          <span className="font-mono text-[10px] text-muted-foreground">{loc.code}</span>
        </div>
      </td>
      <td className="p-3 text-center">
        <Button variant="ghost" size="sm" onClick={onPrint} disabled={printing}>
          <Printer className="h-4 w-4" />
        </Button>
      </td>
    </tr>
  );
}

export function LocationQRPanel({ warehouseId }: LocationQRPanelProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [locations, setLocations] = React.useState<WarehouseLocation[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const [printing, setPrinting] = React.useState(false);

  const fetchLocations = React.useCallback(async () => {
    if (!accessToken || !warehouseId) return;
    setLoading(true);
    try {
      const result = await layoutApi.listLocations(accessToken, {
        warehouse_id: warehouseId,
        location_type: 'bin',
        is_active: true,
        page: 1,
        page_size: 100,
      });
      setLocations(result.locations);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to load bin locations', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouseId, toast]);

  React.useEffect(() => { fetchLocations(); }, [fetchLocations]);

  const filteredLocations = React.useMemo(() => {
    if (!search) return locations;
    const q = search.toLowerCase();
    return locations.filter(
      (l) =>
        l.code?.toLowerCase().includes(q) ||
        l.full_path?.toLowerCase().includes(q) ||
        l.name?.toLowerCase().includes(q)
    );
  }, [locations, search]);

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const selectAll = () => setSelectedIds(new Set(filteredLocations.map((l) => l.id)));
  const deselectAll = () => setSelectedIds(new Set());

  const selectedLocations = React.useMemo(
    () => filteredLocations.filter((l) => selectedIds.has(l.id)),
    [filteredLocations, selectedIds]
  );

  const handlePrintSelected = async () => {
    if (selectedLocations.length === 0) {
      toast({ title: 'No locations selected', description: 'Select at least one bin location to print.' });
      return;
    }
    setPrinting(true);
    try {
      const qrDataUrls = await Promise.all(
        selectedLocations.map((loc) => generateQRDataUrl(buildQrPayload(loc)))
      );

      const pages = selectedLocations.map((loc, idx) => {
        const breakStyle = idx < selectedLocations.length - 1 ? 'page-break-after:always;' : '';
        const label = loc.full_path || loc.code;
        const qrCode = loc.qr_code || loc.code;
        return `<div style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;${breakStyle}">
          <div style="text-align:center;border:1px dashed #ccc;padding:24px;max-width:280px;">
            <div style="font-size:18px;font-weight:700;margin-bottom:2px;">${label}</div>
            <div style="font-size:22px;font-weight:700;color:#1A73E8;margin-bottom:4px;font-family:monospace;">${qrCode}</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px;">Bin Location</div>
            <div style="margin:8px 0;"><img src="${qrDataUrls[idx]}" alt="QR" width="200" height="200" style="max-width:100%;height:auto;" /></div>
            <div style="font-size:9px;color:#999;margin-top:4px;">Scan for put-away / picking</div>
          </div>
        </div>`;
      });

      await printHTML(`
        <html><head><title>Bin Location QR Codes</title><style>
          @media print { body { margin: 0; } }
        </style></head><body>${pages.join('')}</body></html>
      `);
      toast({ title: 'Print Ready', description: `${selectedLocations.length} QR code(s) sent to printer.` });
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate QR codes', variant: 'destructive' });
    } finally {
      setPrinting(false);
    }
  };

  const handlePrintSingle = async (loc: WarehouseLocation) => {
    setPrinting(true);
    try {
      const qrCode = loc.qr_code || loc.code;
      const qrDataUrl = await generateQRDataUrl(buildQrPayload(loc));
      const label = loc.full_path || loc.code;

      await printHTML(`
        <html><head><title>Bin QR Code</title><style>
          body { display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif; }
          .label { text-align:center;border:1px dashed #ccc;padding:24px;max-width:300px; }
          .name { font-size:18px;font-weight:700;margin-bottom:2px; }
          .code { font-size:24px;font-weight:700;color:#1A73E8;margin-bottom:4px;font-family:monospace; }
          .type { font-size:11px;color:#666;margin-bottom:8px; }
          .qrcode { margin:8px 0; }
          .qrcode img { max-width:100%;height:auto; }
          .hint { font-size:9px;color:#999;margin-top:4px; }
        </style></head>
        <body><div class="label"><div class="name">${label}</div><div class="code">${qrCode}</div><div class="type">Bin Location</div><div class="qrcode"><img src="${qrDataUrl}" alt="QR" width="200" height="200" /></div><div class="hint">Scan for put-away / picking</div></div></body></html>
      `);
    } catch (err) {
      toast({ title: 'Error', description: 'Failed to generate QR code', variant: 'destructive' });
    } finally {
      setPrinting(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input placeholder="Search bins by code or path..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-80" />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchLocations}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={selectAll}><Check className="h-4 w-4 mr-1" />Select All</Button>
          <Button variant="outline" size="sm" onClick={deselectAll}>Deselect All</Button>
          <Button size="sm" onClick={handlePrintSelected} disabled={selectedIds.size === 0 || printing}>
            {printing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Printer className="h-4 w-4 mr-1" />}
            Print Selected ({selectedIds.size})
          </Button>
        </div>
      </div>

      {!warehouseId ? (
        <p className="text-sm text-muted-foreground text-center py-8">Select a warehouse to view bin locations.</p>
      ) : loading ? (
        <div className="flex items-center justify-center py-12"><Loader2 className="h-8 w-8 animate-spin text-muted-foreground" /></div>
      ) : filteredLocations.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-8">
          {search ? 'No bins match your search.' : 'No bin locations found for this warehouse.'}
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
            <table className="w-full text-sm">
              <thead className="bg-muted/50 sticky top-0">
                <tr>
                  <th className="w-10 p-3 text-left">
                    <Checkbox checked={selectedIds.size === filteredLocations.length && filteredLocations.length > 0}
                      onCheckedChange={(c) => c ? selectAll() : deselectAll()} />
                  </th>
                  <th className="p-3 text-left font-medium">Path</th>
                  <th className="p-3 text-left font-medium">Bin Code</th>
                  <th className="p-3 text-left font-medium">Capacity</th>
                  <th className="p-3 text-center font-medium w-[180px]">QR Code</th>
                  <th className="p-3 text-center font-medium w-20">Print</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => {
                  const qrValue = loc.qr_code || loc.code;
                  return <QRRow key={loc.id} loc={loc} qrValue={qrValue} selected={selectedIds.has(loc.id)}
                    onToggle={() => toggleSelection(loc.id)} onPrint={() => handlePrintSingle(loc)} printing={printing} />;
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
