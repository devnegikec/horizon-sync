import * as React from 'react';

import { ScanLine, CheckCircle2, XCircle, ShieldCheck } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useToast } from '@horizon-sync/ui/hooks';

import { useGateVerification } from '../../hooks/useWMS';

interface GateVerificationPanelProps {
  pickListId: string;
  onDispatchCreated?: (dispatchId: string) => void;
}

export function GateVerificationPanel({ pickListId, onDispatchCreated }: GateVerificationPanelProps) {
  const { toast } = useToast();
  const { session, progress, loading, error, startSession, recordScan, verify } = useGateVerification();
  const [qrInput, setQrInput] = React.useState('');
  const [vehicleNumber, setVehicleNumber] = React.useState('');
  const [driverName, setDriverName] = React.useState('');
  const [lastScanStatus, setLastScanStatus] = React.useState<'verified' | 'unauthorized' | null>(null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleStart = async () => {
    try {
      await startSession(pickListId, vehicleNumber || undefined, driverName || undefined);
      setTimeout(() => inputRef.current?.focus(), 100);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleScan = async () => {
    if (!qrInput.trim()) return;
    try {
      const result = await recordScan(qrInput.trim());
      setLastScanStatus(result.status);
      setQrInput('');
      inputRef.current?.focus();
    } catch (err) {
      toast({ title: 'Scan error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  const handleVerify = async () => {
    if (!window.confirm('Complete verification and create dispatch record?')) return;
    try {
      const result = await verify();
      toast({ title: 'Gate verified', description: 'Dispatch record created.' });
      if (result.dispatch) {
        onDispatchCreated?.(result.dispatch.id);
      }
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed', variant: 'destructive' });
    }
  };

  if (!session) {
    return (
      <div className="space-y-4 max-w-md">
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vehicle Number</Label>
            <Input value={vehicleNumber} onChange={(e) => setVehicleNumber(e.target.value)} placeholder="e.g. MH-01-AB-1234" />
          </div>
          <div className="space-y-2">
            <Label>Driver Name</Label>
            <Input value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" />
          </div>
        </div>
        {error && <p className="text-sm text-destructive">{error}</p>}
        <Button onClick={handleStart} disabled={loading} className="gap-2">
          <ShieldCheck className="h-4 w-4" />
          {loading ? 'Starting...' : 'Start Gate Verification'}
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Session info */}
      <div className="flex items-center justify-between p-3 bg-muted/50 rounded-lg border">
        <div className="flex items-center gap-3">
          <div className="h-2 w-2 rounded-full bg-blue-500 animate-pulse" />
          <span className="text-sm font-medium">Gate session active</span>
          {session.vehicle_number && <span className="text-sm text-muted-foreground">— {session.vehicle_number}</span>}
        </div>
        {progress && (
          <span className="text-sm font-semibold">
            {progress.verified_count} / {progress.expected_total_qty} verified
          </span>
        )}
      </div>

      {/* Unauthorized warning */}
      {progress && progress.unauthorized_count > 0 && (
        <div className="flex items-center gap-2 p-3 bg-destructive/10 border border-destructive/20 rounded-lg text-destructive text-sm">
          <XCircle className="h-4 w-4 shrink-0" />
          {progress.unauthorized_count} unauthorized item(s) detected
        </div>
      )}

      {/* Scan input */}
      <div className="flex gap-2">
        <Input
          ref={inputRef}
          value={qrInput}
          onChange={(e) => setQrInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && handleScan()}
          placeholder="Scan item QR code..."
          className="font-mono text-sm"
          autoFocus
        />
        <Button onClick={handleScan} className="gap-2 shrink-0">
          <ScanLine className="h-4 w-4" />
          Scan
        </Button>
      </div>

      {/* Last scan result */}
      {lastScanStatus && (
        <div className={`flex items-center gap-2 p-2.5 rounded-md text-sm ${
          lastScanStatus === 'verified'
            ? 'bg-green-50 text-green-700 dark:bg-green-900/20 dark:text-green-400'
            : 'bg-destructive/10 text-destructive'
        }`}>
          {lastScanStatus === 'verified' ? (
            <CheckCircle2 className="h-4 w-4 shrink-0" />
          ) : (
            <XCircle className="h-4 w-4 shrink-0" />
          )}
          Last scan: {lastScanStatus === 'verified' ? '✓ Verified' : '✗ UNAUTHORIZED'}
        </div>
      )}

      {error && <p className="text-sm text-destructive">{error}</p>}

      {/* Verify button */}
      {progress?.all_verified && (
        <Button onClick={handleVerify} disabled={loading} className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white">
          <ShieldCheck className="h-4 w-4" />
          {loading ? 'Verifying...' : 'Complete Verification & Create Dispatch'}
        </Button>
      )}
    </div>
  );
}
