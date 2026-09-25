import * as React from 'react';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link2, Loader2, Plus, Truck, Unlink } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Badge,
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import type { AsnOrder, AsnOrderVehicleArrivalInfo } from '../../types/asn-order.types';
import { canAttachVehicle } from '../../types/asn-order.types';
import type { PaginatedVehicleArrivals, VehicleArrivalListItem } from '../../types/wms.types';
import { getFriendlyErrorMessage } from '../../utility/api/core';
import { vehicleArrivalApi } from '../../utility/api/wms';

type AttachMode = 'new' | 'existing';

interface VehicleForm {
  vehicle_no: string;
  driver_name: string;
  driver_contact: string;
  transporter: string;
  dock: string;
  notes: string;
}

const EMPTY_FORM: VehicleForm = {
  vehicle_no: '',
  driver_name: '',
  driver_contact: '',
  transporter: '',
  dock: '',
  notes: '',
};

/** Vehicles already on the ASN, tolerating a list response without the field. */
function linkedArrivalsOf(order: AsnOrder | null): AsnOrderVehicleArrivalInfo[] {
  return order?.vehicle_arrivals ?? [];
}

/** Identity of the ASN under edit, read once so the body stays branch-free. */
function dialogIdentity(order: AsnOrder | null): { id: string | undefined; no: string } {
  return { id: order?.id, no: order?.asn_order_no ?? '' };
}

function statusOf(order: AsnOrder | null): string {
  return order?.status ?? '';
}

/** The link picker is only worth fetching once the operator actually opens it. */
function shouldLoadArrivals(hasToken: boolean, open: boolean, attachable: boolean, mode: AttachMode): boolean {
  return hasToken && open && attachable && mode === 'existing';
}

function arrivalDetails(arrival: AsnOrderVehicleArrivalInfo): string {
  return [arrival.driver_name, arrival.transporter, arrival.dock].filter(Boolean).join(' · ');
}

function LinkOptionLabel(arrival: VehicleArrivalListItem): string {
  const details = [arrival.dock, arrival.driver_name].filter(Boolean).join(' · ');
  return details ? `${arrival.vehicle_no ?? 'Vehicle'} · ${details}` : arrival.vehicle_no ?? 'Vehicle';
}

function LinkedVehicles({ arrivals }: { arrivals: AsnOrderVehicleArrivalInfo[] }) {
  if (arrivals.length === 0) {
    return <p className="text-sm text-muted-foreground">No vehicle is attached to this ASN yet.</p>;
  }
  return (
    <div className="space-y-2">
      {arrivals.map((arrival) => (
        <div key={arrival.id} className="text-xs">
          <p className="font-mono font-medium">{arrival.vehicle_no ?? 'Vehicle unavailable'}</p>
          <p className="text-muted-foreground">{arrivalDetails(arrival) || 'No additional arrival details'}</p>
          <Badge variant="outline" className="mt-1">
            {arrival.status}
          </Badge>
        </div>
      ))}
    </div>
  );
}

interface NewArrivalFormProps {
  form: VehicleForm;
  onChange: (key: keyof VehicleForm, value: string) => void;
}

/** Same fields the Vehicle Arrival tab captures at the dock. */
function NewArrivalForm({ form, onChange }: NewArrivalFormProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2">
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="asn-vehicle-no">Vehicle No *</Label>
        <Input id="asn-vehicle-no"
          className="font-mono"
          placeholder="e.g., KA01AB1234"
          value={form.vehicle_no}
          onChange={(e) => onChange('vehicle_no', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="asn-vehicle-driver">Driver</Label>
        <Input id="asn-vehicle-driver" value={form.driver_name} onChange={(e) => onChange('driver_name', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="asn-vehicle-contact">Driver Contact</Label>
        <Input id="asn-vehicle-contact" value={form.driver_contact} onChange={(e) => onChange('driver_contact', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="asn-vehicle-transporter">Transporter</Label>
        <Input id="asn-vehicle-transporter" value={form.transporter} onChange={(e) => onChange('transporter', e.target.value)} />
      </div>
      <div className="space-y-1">
        <Label htmlFor="asn-vehicle-dock">Dock</Label>
        <Input id="asn-vehicle-dock" value={form.dock} onChange={(e) => onChange('dock', e.target.value)} />
      </div>
      <div className="space-y-1 sm:col-span-2">
        <Label htmlFor="asn-vehicle-notes">Notes</Label>
        <Input id="asn-vehicle-notes" value={form.notes} onChange={(e) => onChange('notes', e.target.value)} />
      </div>
    </div>
  );
}

interface ExistingArrivalPickerProps {
  loading: boolean;
  options: VehicleArrivalListItem[];
  value: string;
  onChange: (value: string) => void;
}

function ExistingArrivalPicker({ loading, options, value, onChange }: ExistingArrivalPickerProps) {
  const isEmpty = !loading && options.length === 0;

  return (
    <div className="space-y-1">
      <Label htmlFor="asn-vehicle-existing">Existing arrival</Label>
      <Select value={value} onValueChange={onChange}>
        <SelectTrigger id="asn-vehicle-existing">
          <SelectValue placeholder={loading ? 'Loading arrivals…' : 'Select an arrival'} />
        </SelectTrigger>
        <SelectContent>
          {options.map((arrival) => (
            <SelectItem key={arrival.id} value={arrival.id}>
              {LinkOptionLabel(arrival)}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {isEmpty && (
        <p className="text-xs text-muted-foreground">
          No vehicle arrivals found for this warehouse — use <strong>New arrival</strong> instead.
        </p>
      )}
    </div>
  );
}

interface UnlinkRowProps {
  arrivals: AsnOrderVehicleArrivalInfo[];
  pending: boolean;
  onUnlink: (arrivalId: string) => void;
}

function UnlinkRow({ arrivals, pending, onUnlink }: UnlinkRowProps) {
  if (arrivals.length === 0) return null;

  return (
    <div className="space-y-2 border-t pt-3">
      <Label className="text-xs uppercase tracking-wide text-muted-foreground">Unlink</Label>
      <div className="flex flex-wrap gap-2">
        {arrivals.map((arrival) => (
          <Button key={arrival.id}
            type="button"
            size="sm"
            variant="outline"
            className="gap-1.5 text-destructive hover:text-destructive"
            disabled={pending}
            onClick={() => onUnlink(arrival.id)}>
            {pending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Unlink className="h-3.5 w-3.5" />}
            {arrival.vehicle_no ?? arrival.id}
          </Button>
        ))}
      </div>
    </div>
  );
}

function ModeToggle({ mode, onChange }: { mode: AttachMode; onChange: (mode: AttachMode) => void }) {
  return (
    <div className="flex gap-2 border-t pt-3">
      <Button type="button" size="sm" variant={mode === 'new' ? 'default' : 'outline'} onClick={() => onChange('new')}>
        <Plus className="h-3.5 w-3.5" />
        New arrival
      </Button>
      <Button type="button" size="sm" variant={mode === 'existing' ? 'default' : 'outline'} onClick={() => onChange('existing')}>
        <Truck className="h-3.5 w-3.5" />
        Link existing
      </Button>
    </div>
  );
}

interface VehicleBodyProps {
  attachable: boolean;
  status: string;
  arrivals: AsnOrderVehicleArrivalInfo[];
  mode: AttachMode;
  form: VehicleForm;
  existingLoading: boolean;
  existingOptions: VehicleArrivalListItem[];
  existingValue: string;
  unlinking: boolean;
  onModeChange: (mode: AttachMode) => void;
  onFieldChange: (key: keyof VehicleForm, value: string) => void;
  onExistingChange: (value: string) => void;
  onUnlink: (arrivalId: string) => void;
}

function VehicleBody({
  attachable,
  status,
  arrivals,
  mode,
  form,
  existingLoading,
  existingOptions,
  existingValue,
  unlinking,
  onModeChange,
  onFieldChange,
  onExistingChange,
  onUnlink,
}: VehicleBodyProps) {
  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label className="text-xs uppercase tracking-wide text-muted-foreground">On this ASN</Label>
        <LinkedVehicles arrivals={arrivals} />
      </div>

      {attachable ? (
        <>
          <ModeToggle mode={mode} onChange={onModeChange} />
          {mode === 'new' ? (
            <NewArrivalForm form={form} onChange={onFieldChange} />
          ) : (
            <ExistingArrivalPicker loading={existingLoading}
              options={existingOptions}
              value={existingValue}
              onChange={onExistingChange} />
          )}
          <UnlinkRow arrivals={arrivals} pending={unlinking} onUnlink={onUnlink} />
        </>
      ) : (
        <p className="text-sm text-muted-foreground">
          This ASN is {status} and final, so no further vehicle can be attached or removed.
        </p>
      )}
    </div>
  );
}

interface VehicleFooterProps {
  attachable: boolean;
  mode: AttachMode;
  saving: boolean;
  canSubmit: boolean;
  onCancel: () => void;
  onSubmit: () => void;
}

function VehicleFooter({ attachable, mode, saving, canSubmit, onCancel, onSubmit }: VehicleFooterProps) {
  return (
    <DialogFooter>
      <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
        Cancel
      </Button>
      {attachable && (
        <Button type="button" disabled={saving || !canSubmit} onClick={onSubmit}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Link2 className="h-4 w-4" />}
          {mode === 'new' ? 'Attach Vehicle' : 'Link Vehicle'}
        </Button>
      )}
    </DialogFooter>
  );
}

/** Arrivals offered in "link existing", tolerating a response without the field. */
function arrivalsOf(data: PaginatedVehicleArrivals | undefined): VehicleArrivalListItem[] {
  return data?.vehicle_arrivals ?? [];
}

export interface AsnVehicleDialogProps {
  /** The ASN receiving a vehicle. `null` closes the dialog. */
  order: AsnOrder | null;
  /** Warehouse used to scope the "link an existing arrival" list. */
  warehouseId?: string;
  onOpenChange: (open: boolean) => void;
  /** Fired after a successful attach, link or unlink so the caller can refetch. */
  onChanged?: () => void;
}

/**
 * Attach a vehicle to an ASN from the ASN side.
 *
 * Mirrors the Vehicle Arrival tab: register a new arrival (which links it to this
 * ASN in the same request) or link an arrival that is already checked in at the
 * dock. Only non-terminal ASNs accept a vehicle — a closed or cancelled ASN is
 * final, so the controls are hidden for those.
 */
export function AsnVehicleDialog({ order, warehouseId, onOpenChange, onChanged }: AsnVehicleDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const open = !!order;
  const { id: asnOrderId, no: asnOrderNo } = dialogIdentity(order);
  const attachable = !!order && canAttachVehicle(order.status);
  const arrivals = linkedArrivalsOf(order);

  const [mode, setMode] = React.useState<AttachMode>('new');
  const [form, setForm] = React.useState<VehicleForm>({ ...EMPTY_FORM });
  const [existingArrivalId, setExistingArrivalId] = React.useState('');

  // Re-seed for every ASN so a second attach never inherits the previous form.
  React.useEffect(() => {
    setMode('new');
    setForm({ ...EMPTY_FORM });
    setExistingArrivalId('');
  }, [asnOrderId]);

  const { data: existingArrivals, isLoading: existingLoading } = useQuery({
    queryKey: ['vehicle-arrivals', 'link-options', warehouseId],
    queryFn: () => vehicleArrivalApi.list(accessToken || '', { warehouse_id: warehouseId, page: 1, page_size: 50 }),
    enabled: shouldLoadArrivals(!!accessToken, open, attachable, mode),
  });

  const registerMutation = useMutation({
    mutationFn: () =>
      vehicleArrivalApi.register(accessToken || '', {
        vehicle_no: form.vehicle_no.trim(),
        driver_name: form.driver_name.trim() || null,
        driver_contact: form.driver_contact.trim() || null,
        transporter: form.transporter.trim() || null,
        dock: form.dock.trim() || null,
        notes: form.notes.trim() || null,
        warehouse_id: warehouseId ?? null,
        asn_order_ids: asnOrderId ? [asnOrderId] : [],
      }),
  });

  const linkMutation = useMutation({
    mutationFn: () => vehicleArrivalApi.linkAsns(accessToken || '', existingArrivalId, asnOrderId ? [asnOrderId] : []),
  });

  const unlinkMutation = useMutation({
    mutationFn: (arrivalId: string) => vehicleArrivalApi.unlinkAsn(accessToken || '', arrivalId, asnOrderId || ''),
  });

  const saving = registerMutation.isPending || linkMutation.isPending;
  const canSubmit = mode === 'new' ? form.vehicle_no.trim().length > 0 : !!existingArrivalId;

  /**
   * Attaching also changes the ASN row the table renders its Vehicle column
   * from, so both caches are invalidated before the caller refetches.
   */
  const afterChange = (title: string, description: string) => {
    toast({ title, description });
    queryClient.invalidateQueries({ queryKey: ['asn-orders'] });
    queryClient.invalidateQueries({ queryKey: ['vehicle-arrivals'] });
    onChanged?.();
    onOpenChange(false);
  };

  const fail = (err: unknown) => toast({ title: 'Error', description: getFriendlyErrorMessage(err), variant: 'destructive' });

  const register = () => registerMutation.mutate(undefined, {
    onSuccess: () => afterChange('Vehicle attached', `Vehicle ${form.vehicle_no.trim()} is now on ${asnOrderNo}.`),
    onError: fail,
  });

  const link = () => linkMutation.mutate(undefined, {
    onSuccess: () => afterChange('Vehicle linked', `The arrival is now linked to ${asnOrderNo}.`),
    onError: fail,
  });

  const unlink = (arrivalId: string) => unlinkMutation.mutate(arrivalId, {
    onSuccess: () => afterChange('Vehicle unlinked', `The vehicle was removed from ${asnOrderNo}.`),
    onError: fail,
  });

  const setField = (key: keyof VehicleForm, value: string) => setForm((prev) => ({ ...prev, [key]: value }));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Manage Vehicles</DialogTitle>
          <DialogDescription>
            <code className="font-medium">{asnOrderNo}</code> — attach the vehicle delivering this ASN, or link an arrival already
            checked in at the dock.
          </DialogDescription>
        </DialogHeader>

        <VehicleBody attachable={attachable}
          status={statusOf(order)}
          arrivals={arrivals}
          mode={mode}
          form={form}
          existingLoading={existingLoading}
          existingOptions={arrivalsOf(existingArrivals)}
          existingValue={existingArrivalId}
          unlinking={unlinkMutation.isPending}
          onModeChange={setMode}
          onFieldChange={setField}
          onExistingChange={setExistingArrivalId}
          onUnlink={unlink} />

        <VehicleFooter attachable={attachable}
          mode={mode}
          saving={saving}
          canSubmit={canSubmit}
          onCancel={() => onOpenChange(false)}
          onSubmit={mode === 'new' ? register : link} />
      </DialogContent>
    </Dialog>
  );
}
