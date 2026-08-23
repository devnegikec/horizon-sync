import * as React from 'react';

import { Plus, Truck, X, Loader2, Link2 } from 'lucide-react';

import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Badge } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import { useUserStore } from '@horizon-sync/store';

import { useVehicleArrivals } from '../../hooks/useWMS';
import { asnOrderApi } from '../../utility/api/asn-orders';
import { formatDate } from '../../utility';
import type { VehicleArrivalListItem } from '../../types/wms.types';

interface VehicleArrivalManagementProps {
  warehouseId?: string;
}

interface AsnOption {
  id: string;
  asn_order_no: string;
  status: string;
}

function StatusBadge({ status }: { status: string }) {
  const variant = status === 'arrived' ? 'success' : status === 'unloaded' ? 'warning' : 'outline';
  return <Badge variant={variant as 'success' | 'warning' | 'outline'}>{status}</Badge>;
}

export function VehicleArrivalManagement({ warehouseId }: VehicleArrivalManagementProps) {
  const { toast } = useToast();
  const accessToken = useUserStore((s) => s.accessToken);

  const [showForm, setShowForm] = React.useState(false);
  const [vehicleNo, setVehicleNo] = React.useState('');
  const [driverName, setDriverName] = React.useState('');
  const [driverContact, setDriverContact] = React.useState('');
  const [transporter, setTransporter] = React.useState('');
  const [dock, setDock] = React.useState('');
  const [notes, setNotes] = React.useState('');
  const [selectedAsnIds, setSelectedAsnIds] = React.useState<Set<string>>(new Set());
  const [asnOptions, setAsnOptions] = React.useState<AsnOption[]>([]);
  const [asnPickerOpen, setAsnPickerOpen] = React.useState(false);
  const [loadingAsns, setLoadingAsns] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  // Linking additional ASNs to an existing arrival
  const [linkingArrivalId, setLinkingArrivalId] = React.useState<string | null>(null);
  const [linkSelectedIds, setLinkSelectedIds] = React.useState<Set<string>>(new Set());

  const { data, loading, error, refetch, register, linkAsns, unlinkAsn } = useVehicleArrivals({
    warehouse_id: warehouseId,
    page: 1,
    page_size: 50,
  });

  const fetchAsnOptions = React.useCallback(async () => {
    if (!accessToken) return;
    setLoadingAsns(true);
    try {
      const res = (await asnOrderApi.list(accessToken, 1, 100, {
        status: 'confirmed',
        warehouse_id: warehouseId,
      })) as { asn_orders: AsnOption[] };
      setAsnOptions(res.asn_orders ?? []);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load ASNs', variant: 'destructive' });
    } finally {
      setLoadingAsns(false);
    }
  }, [accessToken, warehouseId, toast]);

  const toggleAsn = (id: string, isLinkMode: boolean) => {
    const setter = isLinkMode ? setLinkSelectedIds : setSelectedAsnIds;
    setter((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleRegister = async () => {
    if (!vehicleNo.trim()) {
      toast({ title: 'Error', description: 'Vehicle number is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await register({
        vehicle_no: vehicleNo.trim(),
        driver_name: driverName.trim() || null,
        driver_contact: driverContact.trim() || null,
        transporter: transporter.trim() || null,
        warehouse_id: warehouseId || null,
        dock: dock.trim() || null,
        notes: notes.trim() || null,
        asn_order_ids: Array.from(selectedAsnIds),
      });
      toast({ title: 'Arrival registered', description: `Vehicle ${vehicleNo.trim()} checked in.` });
      resetForm();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to register arrival', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const resetForm = () => {
    setShowForm(false);
    setVehicleNo('');
    setDriverName('');
    setDriverContact('');
    setTransporter('');
    setDock('');
    setNotes('');
    setSelectedAsnIds(new Set());
    setAsnPickerOpen(false);
  };

  const handleLinkAsns = async () => {
    if (!linkingArrivalId) return;
    setSaving(true);
    try {
      await linkAsns(linkingArrivalId, Array.from(linkSelectedIds));
      toast({ title: 'ASNs linked', description: 'Vehicle arrival updated.' });
      setLinkingArrivalId(null);
      setLinkSelectedIds(new Set());
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to link ASNs', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleUnlink = async (arrivalId: string, asnOrderId: string) => {
    try {
      await unlinkAsn(arrivalId, asnOrderId);
      toast({ title: 'ASN unlinked', description: 'Vehicle arrival updated.' });
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to unlink ASN', variant: 'destructive' });
    }
  };

  const arrivals = data?.vehicle_arrivals ?? [];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold">Vehicle Arrivals</h2>
          <p className="text-sm text-muted-foreground">
            Register vehicles arriving at the dock and associate them with one or more ASNs.
          </p>
        </div>
        <Button onClick={() => { setShowForm((v) => !v); }} className="gap-2">
          {showForm ? <X className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          {showForm ? 'Cancel' : 'Register Arrival'}
        </Button>
      </div>

      {showForm && (
        <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label htmlFor="va-vehicle-no">Vehicle Number *</Label>
              <Input id="va-vehicle-no" value={vehicleNo} onChange={(e) => setVehicleNo(e.target.value)} placeholder="e.g., KA01AB1234" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="va-driver">Driver Name</Label>
              <Input id="va-driver" value={driverName} onChange={(e) => setDriverName(e.target.value)} placeholder="Driver name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="va-driver-contact">Driver Contact</Label>
              <Input id="va-driver-contact" value={driverContact} onChange={(e) => setDriverContact(e.target.value)} placeholder="Phone" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="va-transporter">Transporter</Label>
              <Input id="va-transporter" value={transporter} onChange={(e) => setTransporter(e.target.value)} placeholder="Transporter name" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="va-dock">Dock</Label>
              <Input id="va-dock" value={dock} onChange={(e) => setDock(e.target.value)} placeholder="e.g., Dock-A" />
            </div>
            <div className="space-y-1">
              <Label htmlFor="va-notes">Notes</Label>
              <Input id="va-notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Optional notes" />
            </div>
          </div>

          <div className="space-y-1">
            <Label>ASN Orders ({selectedAsnIds.size} selected)</Label>
            <Button variant="outline" size="sm" className="gap-2" onClick={() => { void fetchAsnOptions(); setAsnPickerOpen((v) => !v); }}>
              <Truck className="h-4 w-4" />
              {asnPickerOpen ? 'Close ASN picker' : 'Select ASN(s)'}
            </Button>
            {asnPickerOpen && (
              <div className="border rounded-md p-2 max-h-56 overflow-y-auto bg-background">
                {loadingAsns ? (
                  <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
                    <Loader2 className="h-4 w-4 animate-spin" /> Loading ASNs…
                  </div>
                ) : asnOptions.length === 0 ? (
                  <p className="text-sm text-muted-foreground py-4 text-center">No confirmed ASNs found.</p>
                ) : (
                  asnOptions.map((asn) => (
                    <label key={asn.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                      <input
                        type="checkbox"
                        checked={selectedAsnIds.has(asn.id)}
                        onChange={() => toggleAsn(asn.id, false)}
                      />
                      <span className="text-sm font-mono">{asn.asn_order_no}</span>
                    </label>
                  ))
                )}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <Button onClick={handleRegister} disabled={saving}>
              {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
              Register Arrival
            </Button>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center gap-2 py-8 justify-center text-sm text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" /> Loading arrivals…
        </div>
      ) : error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : arrivals.length === 0 ? (
        <p className="text-sm text-muted-foreground py-8 text-center">
          No vehicle arrivals yet. Register the first arriving vehicle above.
        </p>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-muted/50 text-left">
              <tr>
                <th className="px-3 py-2 font-medium">Vehicle #</th>
                <th className="px-3 py-2 font-medium">Driver</th>
                <th className="px-3 py-2 font-medium">Dock</th>
                <th className="px-3 py-2 font-medium">Status</th>
                <th className="px-3 py-2 font-medium">ASNs</th>
                <th className="px-3 py-2 font-medium">Arrived At</th>
                <th className="px-3 py-2 font-medium text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {arrivals.map((a: VehicleArrivalListItem) => (
                <tr key={a.id} className="border-t">
                  <td className="px-3 py-2 font-mono">{a.vehicle_no ?? '—'}</td>
                  <td className="px-3 py-2">{a.driver_name ?? '—'}</td>
                  <td className="px-3 py-2">{a.dock ?? '—'}</td>
                  <td className="px-3 py-2"><StatusBadge status={a.status} /></td>
                  <td className="px-3 py-2">{a.asn_order_count}</td>
                  <td className="px-3 py-2">{formatDate(a.arrived_at, 'DD-MMM-YY', { includeTime: true, timeFormat: 'HH:mm' })}</td>
                  <td className="px-3 py-2 text-right">
                    <Button variant="outline" size="sm" className="gap-1"
                      onClick={() => { setLinkingArrivalId(a.id); setLinkSelectedIds(new Set()); void fetchAsnOptions(); }}>
                      <Link2 className="h-3 w-3" /> Link ASN
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Link ASN modal */}
      {linkingArrivalId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-2">Link ASN Orders</h3>
            <p className="text-sm text-muted-foreground mb-4">Select ASN order(s) to link to this vehicle arrival.</p>
            {asnOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground py-4 text-center">No confirmed ASNs available.</p>
            ) : (
              <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-2">
                {asnOptions.map((asn) => (
                  <label key={asn.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
                    <input
                      type="checkbox"
                      checked={linkSelectedIds.has(asn.id)}
                      onChange={() => toggleAsn(asn.id, true)}
                    />
                    <span className="text-sm font-mono">{asn.asn_order_no}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="flex justify-end gap-3 mt-4">
              <Button variant="outline" onClick={() => setLinkingArrivalId(null)}>Cancel</Button>
              <Button onClick={handleLinkAsns} disabled={saving || linkSelectedIds.size === 0}>
                {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                Link ({linkSelectedIds.size})
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
