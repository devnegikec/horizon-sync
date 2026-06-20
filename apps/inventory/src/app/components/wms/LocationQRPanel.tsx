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

interface BinQRPayload {
  type: 'location';
  org_id: string;
  org_name: string;
  warehouse_id: string;
  warehouse_code: string;
  warehouse_name: string;
  location_id: string;
  full_path: string;
  location_type: string;
  location_code: string;
}

async function generateQRDataUrl(data: string, size = 200): Promise<string> {
  return QRCode.toDataURL(data, { width: size, margin: 2, color: { dark: '#000000', light: '#ffffff' } });
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
        selectedLocations.map((loc) => {
          const payload: BinQRPayload = {
            type: 'location',
            org_id: loc.organization_id,
            org_name: '',
            warehouse_id: loc.warehouse_id,
            warehouse_code: '',
            warehouse_name: '',
            location_id: loc.id,
            full_path: loc.full_path || loc.code,
            location_type: loc.location_type,
            location_code: loc.code,
          };
          return generateQRDataUrl(JSON.stringify(payload));
        })
      );

      const win = window.open('', '_blank');
      if (!win) return;
      const pages = selectedLocations.map((loc, idx) => {
        const breakStyle = idx < selectedLocations.length - 1 ? 'page-break-after:always;' : '';
        const label = loc.full_path || loc.code;
        return `<div style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;${breakStyle}">
          <div style="text-align:center;border:1px dashed #ccc;padding:24px;max-width:280px;">
            <div style="font-size:20px;font-weight:700;margin-bottom:4px;">${label}</div>
            <div style="font-size:11px;color:#666;margin-bottom:8px;">Bin Location</div>
            <div style="margin:8px 0;"><img src="${qrDataUrls[idx]}" alt="QR" width="200" height="200" style="max-width:100%;height:auto;" /></div>
            <div style="font-size:9px;color:#999;margin-top:4px;">Scan for put-away / picking</div>
          </div>
        </div>`;
      });

      win.document.write(`
        <html><head><title>Bin Location QR Codes</title><style>
          @media print { body { margin: 0; } }
        </style></head><body>${pages.join('')}</body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 300);
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
      const payload: BinQRPayload = {
        type: 'location',
        org_id: loc.organization_id,
        org_name: '',
        warehouse_id: loc.warehouse_id,
        warehouse_code: '',
        warehouse_name: '',
        location_id: loc.id,
        full_path: loc.full_path || loc.code,
        location_type: loc.location_type,
        location_code: loc.code,
      };
      const qrDataUrl = await generateQRDataUrl(JSON.stringify(payload));
      const label = loc.full_path || loc.code;

      const win = window.open('', '_blank', 'width=400,height=400');
      if (!win) return;
      win.document.write(`
        <html><head><title>Bin QR Code</title><style>
          body { display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif; }
          .label { text-align:center;border:1px dashed #ccc;padding:24px;max-width:300px; }
          .name { font-size:20px;font-weight:700;margin-bottom:2px; }
          .type { font-size:11px;color:#666;margin-bottom:8px; }
          .qrcode { margin:8px 0; }
          .qrcode img { max-width:100%;height:auto; }
          .hint { font-size:9px;color:#999;margin-top:4px; }
        </style></head>
        <body><div class="label"><div class="name">${label}</div><div class="type">Bin Location</div><div class="qrcode"><img src="${qrDataUrl}" alt="QR" width="200" height="200" /></div><div class="hint">Scan for put-away / picking</div></div></body></html>
      `);
      win.document.close();
      win.focus();
      setTimeout(() => { win.print(); win.close(); }, 250);
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
                      onCheckedChange={(c) => c ? selectAll() : deselectAll()}/>
                  </th>
                  <th className="p-3 text-left font-medium">Code</th>
                  <th className="p-3 text-left font-medium">Full Path</th>
                  <th className="p-3 text-left font-medium">Name</th>
                  <th className="p-3 text-left font-medium">Capacity</th>
                  <th className="p-3 text-center font-medium w-24">Print QR</th>
                </tr>
              </thead>
              <tbody>
                {filteredLocations.map((loc) => (
                  <tr key={loc.id} className="border-t hover:bg-muted/30">
                    <td className="p-3">
                      <Checkbox checked={selectedIds.has(loc.id)} onCheckedChange={() => toggleSelection(loc.id)} />
                    </td>
                    <td className="p-3 font-mono text-xs">{loc.code}</td>
                    <td className="p-3 font-mono text-xs text-muted-foreground">{loc.full_path || '—'}</td>
                    <td className="p-3">{loc.name || '—'}</td>
                    <td className="p-3 text-xs text-muted-foreground">
                      {loc.available_capacity}/{loc.total_capacity} {loc.capacity_uom || 'units'}
                    </td>
                    <td className="p-3 text-center">
                      <Button variant="ghost" size="sm" onClick={() => handlePrintSingle(loc)} disabled={printing}>
                        <Printer className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
