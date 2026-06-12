import * as React from 'react';

import { Monitor, Plus, RefreshCw, Trash2 } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { wmsDeviceApi } from '../../utility/api/wms';
import type { WMSDevice, WMSDeviceCreate, WMSDeviceUpdate } from '../../types/wms.types';

interface DeviceManagementPanelProps {
  warehouseId?: string;
}

export function DeviceManagementPanel({ warehouseId }: DeviceManagementPanelProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [devices, setDevices] = React.useState<WMSDevice[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingDevice, setEditingDevice] = React.useState<WMSDevice | null>(null);

  const [form, setForm] = React.useState<Partial<WMSDeviceCreate>>({
    name: '', device_code: '', device_type: '', manufacturer: '', model: '', serial_number: '', os_version: '', status: 'active',
  });

  const fetchDevices = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await wmsDeviceApi.list(accessToken, { warehouse_id: warehouseId, search: search || undefined });
      setDevices(result.devices);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load devices', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouseId, search, toast]);

  React.useEffect(() => { fetchDevices(); }, [fetchDevices]);

  const openCreate = () => {
    setEditingDevice(null);
    setForm({ name: '', device_code: '', device_type: '', manufacturer: '', model: '', serial_number: '', os_version: '', status: 'active' });
    setDialogOpen(true);
  };

  const openEdit = (device: WMSDevice) => {
    setEditingDevice(device);
    setForm({
      name: device.name,
      device_code: device.device_code,
      device_type: device.device_type,
      manufacturer: device.manufacturer,
      model: device.model,
      serial_number: device.serial_number,
      os_version: device.os_version,
      status: device.status,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!accessToken) return;
    if (!form.name || !form.device_code) {
      toast({ title: 'Validation Error', description: 'Name and device code are required', variant: 'destructive' });
      return;
    }
    try {
      if (editingDevice) {
        const update: WMSDeviceUpdate = { ...form };
        await wmsDeviceApi.update(accessToken, editingDevice.id, update);
        toast({ title: 'Success', description: 'Device updated successfully' });
      } else {
        if (!warehouseId) {
          toast({ title: 'Error', description: 'Please select a warehouse first', variant: 'destructive' });
          return;
        }
        const create: WMSDeviceCreate = { ...form, warehouse_id: warehouseId } as WMSDeviceCreate;
        await wmsDeviceApi.create(accessToken, create);
        toast({ title: 'Success', description: 'Device created successfully' });
      }
      setDialogOpen(false);
      fetchDevices();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Save failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (id: string) => {
    if (!accessToken) return;
    if (!window.confirm('Are you sure you want to delete this device?')) return;
    try {
      await wmsDeviceApi.delete(accessToken, id);
      toast({ title: 'Success', description: 'Device deleted' });
      fetchDevices();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Delete failed', variant: 'destructive' });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input placeholder="Search devices..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-80" />
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchDevices}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Device</Button>
        </div>
      </div>

      {loading && devices.length === 0 && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Card key={i} className="animate-pulse h-16" />)}
        </div>
      )}

      {!loading && devices.length === 0 && (
        <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/40">No devices found. Add a device to get started.</div>
      )}

      <div className="space-y-3">
        {devices.map((d) => (
          <Card key={d.id} className="overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-muted-foreground" />
                  <span className="font-semibold">{d.name}</span>
                  <Badge variant={d.status === 'active' ? 'default' : d.status === 'maintenance' ? 'destructive' : 'secondary'} className="capitalize">{d.status}</Badge>
                  <Badge variant="outline">{d.device_code}</Badge>
                </div>
                <div className="text-sm text-muted-foreground">
                  {d.device_type && <span className="mr-3">{d.device_type}</span>}
                  {d.manufacturer && <span className="mr-3">{d.manufacturer}</span>}
                  {d.model && <span className="mr-3">{d.model}</span>}
                  {d.serial_number && <span className="mr-3">SN: {d.serial_number}</span>}
                </div>
              </div>
              <div className="flex gap-2">
                <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(d)}><RefreshCw className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Delete" onClick={() => handleDelete(d.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingDevice ? 'Edit Device' : 'Add Device'}</DialogTitle>
            <DialogDescription>Fill in device details.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Name</Label><Input value={form.name || ''} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Device Code</Label><Input value={form.device_code || ''} onChange={(e) => setForm((p) => ({ ...p, device_code: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Type</Label><Input value={form.device_type || ''} onChange={(e) => setForm((p) => ({ ...p, device_type: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Manufacturer</Label><Input value={form.manufacturer || ''} onChange={(e) => setForm((p) => ({ ...p, manufacturer: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Model</Label><Input value={form.model || ''} onChange={(e) => setForm((p) => ({ ...p, model: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Serial Number</Label><Input value={form.serial_number || ''} onChange={(e) => setForm((p) => ({ ...p, serial_number: e.target.value }))} /></div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>OS Version</Label><Input value={form.os_version || ''} onChange={(e) => setForm((p) => ({ ...p, os_version: e.target.value }))} /></div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="maintenance">Maintenance</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button onClick={handleSave}>{editingDevice ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
