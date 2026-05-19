import * as React from 'react';

import { ScanLine, X, CheckCircle2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useToast } from '@horizon-sync/ui/hooks';

import { useInboundSession } from '../../hooks/useWMS';
import type { ScanResult } from '../../types/wms.types';

interface InboundScanPanelProps {
  warehouseId: string;
  onSlipGenerated?: (slipId: string) => void;
}

export function InboundScanPanel({ warehouseId, onSlipGenerated }: InboundScanPanelProps) {
  const { session, loading, error, startSession, recordScan, endSession } = useInboundSession();
  const { toast } = useToast();
  const [qrInput, setQrInput] = React.useState('');
  const [dockLocation, setDockLocation] = React.useState('');
  const [scans, setScans] = React.useState<ScanResult[]>([]);
  const [scanError, setScanError] = React.useState<string | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    try {
      await startSession(warehouseId, dockLocation || undefined);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch {
      // error shown via hook
    }
  };

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    setScanError(null);
    try {
      const result = await recordScan(qrInput.trim());
      setScans((prev) => [result, ...prev]);
      setQrInput('');
      inputRef.current?.focus();
    } catch (err) {
      setScanError(err instanceof Error ? err.message : 'Scan failed');
    }
  };

  const handleEnd = async () => {
    if (!window.confirm(`End session? This will generate a receiving slip for ${session?.total_boxes_scanned ?? 0} scanned boxes.`)) return;
    try {
      const slip = await endSession();
      toast({ title: 'Session ended', description: `Receiving slip ${slip.slip_number} created.` });
      onSlipGenerated?.(slip.id);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to end session', variant: 'destructive' });
    }
  };

  if (!session) {
    return (
      <div className="space-y-4 max-w-md">
        <div className="space-y-2">
          <Label htmlFor="dock-location">Dock Location (optional)</Label>
          <Input
            id="dock-location"
            value={dockLocation}
            onChange={(e) => setDockLocation(e.target.value)}
            placeholder="e.g. Dock A, Bay 3"
          />
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleStart} disabled={loading} className="gap-2">
          <ScanLine className="h-4 w-4" />
          {loading ? 'Starting...' : 'Start Inbound Session'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session header */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-green-500 animate-pulse" />
          <span className="text-sm font-medium">Session active</span>
          {session.dock_location && (
            <span className="text-sm text-muted-foreground">— {session.dock_location}</span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold text-green-600 dark:text-green-400">
            {session.total_boxes_scanned} boxes scanned
          </span>
          <Button
            variant="destructive"
            size="sm"
            onClick={handleEnd}
            disabled={loading || session.total_boxes_scanned === 0}
          >
            End Session
          </Button>
        </div>
      </div>

      {/* Scan input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Scan or paste QR code data..."
          className="font-mono text-sm flex-1"
          autoFocus
        />
        <Button onClick={handleScan} className="gap-2 shrink-0">
          <ScanLine className="h-4 w-4" />
          Scan
        </Button>
      </div>

      {scanError && (
        <div className="flex items-start gap-2 p-3 bg-destructive/10 text-destructive rounded-md text-sm">
          <X className="h-4 w-4 mt-0.5 shrink-0" />
          {scanError}
        </div>
      )}

      {/* Scan log */}
      {scans.length > 0 && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-muted/50 px-3 py-2 text-xs font-medium text-muted-foreground uppercase tracking-wide">
            Recent Scans
          </div>
          <div className="divide-y max-h-64 overflow-y-auto">
            {scans.map((scan) => (
              <div key={scan.scan_item_id} className="flex items-center gap-3 px-3 py-2 text-sm">
                <CheckCircle2 className="h-4 w-4 text-green-500 shrink-0" />
                <span className="font-mono font-medium">{scan.sku}</span>
                <span className="text-muted-foreground">×{scan.quantity}</span>
                <span className="text-muted-foreground text-xs">{scan.batch_number}</span>
                <span className="ml-auto text-xs text-muted-foreground">
                  {scan.scanned_at ? new Date(scan.scanned_at).toLocaleTimeString() : '—'}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
