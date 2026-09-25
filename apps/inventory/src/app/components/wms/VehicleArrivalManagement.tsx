import * as React from 'react';

import { type ColumnDef } from '@tanstack/react-table';
import { Loader2, Plus, RefreshCw, Truck, X } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Card, CardContent, EmptyState, Input, Label, TableSkeleton } from '@horizon-sync/ui/components';
import { DataTable } from '@horizon-sync/ui/components/data-table';
import { useToast } from '@horizon-sync/ui/hooks';

import { useRefreshOnKey } from '../../hooks/useRefreshOnKey';
import { useVehicleArrivals } from '../../hooks/useWMS';
import type { VehicleArrivalCreate, VehicleArrivalListItem, VehicleArrivalUpdate } from '../../types/wms.types';
import { asnOrderApi } from '../../utility/api/asn-orders';

import { createVehicleArrivalColumns } from './VehicleArrivalColumns';

interface VehicleArrivalManagementProps {
  warehouseId?: string;
  /** Increment to trigger a refetch (e.g. from the panel-level Refresh button). */
  refreshKey?: number;
}

interface AsnOption {
  id: string;
  asn_order_no: string;
  status: string;
}

type ServerPagination = {
  totalItems: number;
  currentPage: number;
  pageSize: number;
  onPageChange: (page: number, pageSize: number) => void;
};

/** The vehicle details captured both on registration and when editing. */
type VehicleFields = {
  vehicle_no: string;
  driver_name: string;
  driver_contact: string;
  transporter: string;
  dock: string;
  notes: string;
};

const DEFAULT_PAGE_SIZE = 20;
const DASH = '\u2014';

const EMPTY_VEHICLE_FIELDS: VehicleFields = {
  vehicle_no: '',
  driver_name: '',
  driver_contact: '',
  transporter: '',
  dock: '',
  notes: '',
};

/** Inputs shared by the register form and the edit dialog, in display order. */
const VEHICLE_FIELD_DEFS: { key: keyof VehicleFields; label: string; placeholder: string }[] = [
  { key: 'vehicle_no', label: 'Vehicle Number *', placeholder: 'e.g., KA01AB1234' },
  { key: 'driver_name', label: 'Driver Name', placeholder: 'Driver name' },
  { key: 'driver_contact', label: 'Driver Contact', placeholder: 'Phone' },
  { key: 'transporter', label: 'Transporter', placeholder: 'Transporter name' },
  { key: 'dock', label: 'Dock', placeholder: 'e.g., Dock-A' },
  { key: 'notes', label: 'Notes', placeholder: 'Optional notes' },
];

/** Add or remove an id without mutating the previous set. */
function toggled(set: Set<string>, id: string): Set<string> {
  const next = new Set(set);
  if (next.has(id)) next.delete(id);
  else next.add(id);
  return next;
}

/** Blank inputs mean "not provided", so they are sent as null to clear the field. */
function arrivalPayload(fields: VehicleFields, warehouseId: string | undefined, asnOrderIds: Set<string>): VehicleArrivalCreate {
  return {
    vehicle_no: fields.vehicle_no.trim(),
    driver_name: fields.driver_name.trim() || null,
    driver_contact: fields.driver_contact.trim() || null,
    transporter: fields.transporter.trim() || null,
    warehouse_id: warehouseId || null,
    dock: fields.dock.trim() || null,
    notes: fields.notes.trim() || null,
    asn_order_ids: Array.from(asnOrderIds),
  };
}

function updatePayload(fields: VehicleFields): VehicleArrivalUpdate {
  return {
    vehicle_no: fields.vehicle_no.trim(),
    driver_name: fields.driver_name.trim() || null,
    driver_contact: fields.driver_contact.trim() || null,
    transporter: fields.transporter.trim() || null,
    dock: fields.dock.trim() || null,
    notes: fields.notes.trim() || null,
  };
}

// ─── Sub components ───────────────────────────────────────────────────────────

function VehicleArrivalHeader({
  showForm,
  refreshing,
  onToggleForm,
  onRefresh,
}: {
  showForm: boolean;
  refreshing: boolean;
  onToggleForm: () => void;
  onRefresh: () => void;
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
      <div>
        <h2 className="text-lg font-semibold">Vehicle Arrivals</h2>
        <p className="text-sm text-muted-foreground">
          Register vehicles arriving at the dock and associate them with one or more ASNs.
        </p>
      </div>
      <div className="flex shrink-0 gap-2 self-start sm:self-auto">
        <Button variant="outline" size="sm" className="gap-2" onClick={onRefresh} disabled={refreshing}>
          <RefreshCw className="h-3.5 w-3.5" />
          Refresh
        </Button>
        <Button size="sm" className="gap-2" onClick={onToggleForm}>
          {showForm ? <X className="h-3.5 w-3.5" /> : <Plus className="h-3.5 w-3.5" />}
          {showForm ? 'Cancel' : 'Register Arrival'}
        </Button>
      </div>
    </div>
  );
}

function VehicleFieldGrid({
  idPrefix,
  values,
  onChange,
}: {
  idPrefix: string;
  values: VehicleFields;
  onChange: (key: keyof VehicleFields, value: string) => void;
}) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
      {VEHICLE_FIELD_DEFS.map((field) => (
        <div key={field.key} className="space-y-1">
          <Label htmlFor={`${idPrefix}-${field.key}`}>{field.label}</Label>
          <Input id={`${idPrefix}-${field.key}`}
            value={values[field.key]}
            onChange={(e) => onChange(field.key, e.target.value)}
            placeholder={field.placeholder}/>
        </div>
      ))}
    </div>
  );
}

function AsnOptionList({
  options,
  loading,
  selectedIds,
  onToggle,
}: {
  options: AsnOption[];
  loading: boolean;
  selectedIds: Set<string>;
  onToggle: (id: string) => void;
}) {
  if (loading) {
    return (
      <div className="flex items-center gap-2 py-4 justify-center text-sm text-muted-foreground">
        <Loader2 className="h-4 w-4 animate-spin" />
        Loading ASNs…
      </div>
    );
  }

  if (options.length === 0) {
    return <p className="text-sm text-muted-foreground py-4 text-center">No confirmed ASNs found.</p>;
  }

  return (
    <div className="space-y-1 max-h-64 overflow-y-auto border rounded-md p-2">
      {options.map((asn) => (
        <label key={asn.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted cursor-pointer">
          <input type="checkbox" checked={selectedIds.has(asn.id)} onChange={() => onToggle(asn.id)}/>
          <span className="text-sm font-mono">{asn.asn_order_no}</span>
        </label>
      ))}
    </div>
  );
}

function RegisterArrivalForm({
  warehouseId,
  register,
  asnOptions,
  loadingAsns,
  onLoadAsns,
  onRegistered,
}: {
  warehouseId?: string;
  register: (payload: VehicleArrivalCreate) => Promise<unknown>;
  asnOptions: AsnOption[];
  loadingAsns: boolean;
  onLoadAsns: () => void;
  onRegistered: () => void;
}) {
  const { toast } = useToast();
  const [fields, setFields] = React.useState<VehicleFields>(EMPTY_VEHICLE_FIELDS);
  const [selectedAsnIds, setSelectedAsnIds] = React.useState<Set<string>>(new Set());
  const [pickerOpen, setPickerOpen] = React.useState(false);
  const [saving, setSaving] = React.useState(false);

  const setField = (key: keyof VehicleFields, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  const togglePicker = () => {
    onLoadAsns();
    setPickerOpen((v) => !v);
  };

  const handleRegister = async () => {
    if (!fields.vehicle_no.trim()) {
      toast({ title: 'Error', description: 'Vehicle number is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await register(arrivalPayload(fields, warehouseId, selectedAsnIds));
      toast({ title: 'Arrival registered', description: `Vehicle ${fields.vehicle_no.trim()} checked in.` });
      onRegistered();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to register arrival', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="border rounded-lg p-4 space-y-3 bg-muted/20">
      <VehicleFieldGrid idPrefix="va" values={fields} onChange={setField}/>

      <div className="space-y-1">
        <p className="text-sm font-medium">ASN Orders ({selectedAsnIds.size} selected)</p>
        <Button variant="outline" size="sm" className="gap-2" onClick={togglePicker}>
          <Truck className="h-4 w-4" />
          {pickerOpen ? 'Close ASN picker' : 'Select ASN(s)'}
        </Button>
        {pickerOpen && (
          <AsnOptionList options={asnOptions}
            loading={loadingAsns}
            selectedIds={selectedAsnIds}
            onToggle={(id) => setSelectedAsnIds((prev) => toggled(prev, id))}/>
        )}
      </div>

      <div className="flex justify-end">
        <Button onClick={handleRegister} disabled={saving}>
          {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
          Register Arrival
        </Button>
      </div>
    </div>
  );
}

function LinkAsnDialog({
  asnOptions,
  loadingAsns,
  onLoadAsns,
  saving,
  onCancel,
  onConfirm,
}: {
  asnOptions: AsnOption[];
  loadingAsns: boolean;
  onLoadAsns: () => void;
  saving: boolean;
  onCancel: () => void;
  onConfirm: (ids: string[]) => void;
}) {
  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(new Set());
  const loadedRef = React.useRef(false);

  React.useEffect(() => {
    if (loadedRef.current) return;
    loadedRef.current = true;
    onLoadAsns();
  }, [onLoadAsns]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-md w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Link ASN Orders</h3>
        <p className="text-sm text-muted-foreground mb-4">Select ASN order(s) to link to this vehicle arrival.</p>
        <AsnOptionList options={asnOptions}
          loading={loadingAsns}
          selectedIds={selectedIds}
          onToggle={(id) => setSelectedIds((prev) => toggled(prev, id))}/>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onConfirm(Array.from(selectedIds))} disabled={saving || selectedIds.size === 0}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Link ({selectedIds.size})
          </Button>
        </div>
      </div>
    </div>
  );
}

function EditVehicleDialog({
  arrival,
  saving,
  onCancel,
  onSave,
}: {
  arrival: VehicleArrivalListItem;
  saving: boolean;
  onCancel: () => void;
  onSave: (payload: VehicleArrivalUpdate) => void;
}) {
  const [fields, setFields] = React.useState<VehicleFields>(() => ({
    vehicle_no: arrival.vehicle_no ?? '',
    driver_name: arrival.driver_name ?? '',
    driver_contact: arrival.driver_contact ?? '',
    transporter: arrival.transporter ?? '',
    dock: arrival.dock ?? '',
    notes: arrival.notes ?? '',
  }));

  const setField = (key: keyof VehicleFields, value: string) => setFields((prev) => ({ ...prev, [key]: value }));

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-lg shadow-lg p-6 max-w-lg w-full mx-4 max-h-[85vh] overflow-y-auto">
        <h3 className="text-lg font-semibold mb-2">Edit Vehicle Details</h3>
        <p className="text-sm text-muted-foreground mb-4">
          Update vehicle, driver and dock details for arrival <span className="font-mono">{arrival.vehicle_no ?? DASH}</span>.
        </p>
        <VehicleFieldGrid idPrefix="ev" values={fields} onChange={setField}/>
        <div className="flex justify-end gap-3 mt-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button onClick={() => onSave(updatePayload(fields))} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
            Save Changes
          </Button>
        </div>
      </div>
    </div>
  );
}

function VehicleArrivalsEmpty() {
  return (
    <Card>
      <CardContent className="p-0">
        <div className="p-6">
          <EmptyState icon={<Truck className="h-12 w-12" />}
            title="No vehicle arrivals found"
            description="Register the first arriving vehicle using the button above."/>
        </div>
      </CardContent>
    </Card>
  );
}

function VehicleArrivalTable({
  isInitialLoading,
  error,
  arrivals,
  columns,
  serverPagination,
  pageSize,
}: {
  isInitialLoading: boolean;
  error: string | null;
  arrivals: VehicleArrivalListItem[];
  columns: ColumnDef<VehicleArrivalListItem>[];
  serverPagination?: ServerPagination;
  pageSize: number;
}) {
  const renderBody = () => {
    if (isInitialLoading) {
      return (
        <Card>
          <CardContent className="p-0">
            <TableSkeleton columns={8} rows={8} showHeader={true} />
          </CardContent>
        </Card>
      );
    }

    if (arrivals.length === 0) {
      return <VehicleArrivalsEmpty />;
    }

    return (
      <Card>
        <CardContent className="p-0">
          <DataTable columns={columns}
            data={arrivals}
            config={{
              showSerialNumber: true,
              showPagination: true,
              enableRowSelection: false,
              enableColumnVisibility: true,
              enableSorting: false,
              enableFiltering: false,
              initialPageSize: pageSize,
              serverPagination,
            }}
            fixedHeader
            maxHeight="auto"/>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="space-y-4">
      {error && <div className="text-sm text-destructive">{error}</div>}
      {renderBody()}
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────

export function VehicleArrivalManagement({ warehouseId, refreshKey }: VehicleArrivalManagementProps) {
  const { toast } = useToast();
  const accessToken = useUserStore((s) => s.accessToken);

  const [showForm, setShowForm] = React.useState(false);
  const [linkingArrivalId, setLinkingArrivalId] = React.useState<string | null>(null);
  const [editingArrival, setEditingArrival] = React.useState<VehicleArrivalListItem | null>(null);
  const [asnOptions, setAsnOptions] = React.useState<AsnOption[]>([]);
  const [loadingAsns, setLoadingAsns] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [page, setPage] = React.useState(1);
  const [pageSize, setPageSize] = React.useState(DEFAULT_PAGE_SIZE);

  const { data, loading, error, refetch, register, linkAsns, update } = useVehicleArrivals({
    warehouse_id: warehouseId,
    page,
    page_size: pageSize,
  });

  // Refetch when the panel-level Refresh button is pressed (skip the initial mount).
  useRefreshOnKey(refreshKey, refetch);

  const loadAsns = React.useCallback(async () => {
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

  const closeForm = React.useCallback(() => setShowForm(false), []);

  const handleEdit = React.useCallback((arrival: VehicleArrivalListItem) => setEditingArrival(arrival), []);
  const handleLinkAsn = React.useCallback((arrival: VehicleArrivalListItem) => setLinkingArrivalId(arrival.id), []);

  const columns = React.useMemo(
    () => createVehicleArrivalColumns({ onEdit: handleEdit, onLinkAsn: handleLinkAsn }),
    [handleEdit, handleLinkAsn],
  );

  const handleLinkAsns = async (ids: string[]) => {
    if (!linkingArrivalId) return;
    setSaving(true);
    try {
      await linkAsns(linkingArrivalId, ids);
      toast({ title: 'ASNs linked', description: 'Vehicle arrival updated.' });
      setLinkingArrivalId(null);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to link ASNs', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveEdit = async (payload: VehicleArrivalUpdate) => {
    if (!editingArrival) return;
    if (!payload.vehicle_no) {
      toast({ title: 'Error', description: 'Vehicle number is required', variant: 'destructive' });
      return;
    }
    setSaving(true);
    try {
      await update(editingArrival.id, payload);
      toast({ title: 'Vehicle updated', description: `Vehicle ${payload.vehicle_no} updated.` });
      setEditingArrival(null);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to update vehicle', variant: 'destructive' });
    } finally {
      setSaving(false);
    }
  };

  const arrivals = data?.vehicle_arrivals ?? [];
  const pagination = data?.pagination;

  const serverPagination = React.useMemo<ServerPagination | undefined>(() => {
    if (!pagination) return undefined;

    return {
      totalItems: pagination.total_items,
      currentPage: pagination.page,
      pageSize: pagination.page_size,
      onPageChange: (nextPage: number, nextPageSize: number) => {
        if (nextPageSize !== pagination.page_size) {
          setPageSize(nextPageSize);
          setPage(1);
          return;
        }
        setPage(nextPage);
      },
    };
  }, [pagination]);

  return (
    <div className="space-y-4">
      <VehicleArrivalHeader showForm={showForm}
        refreshing={loading}
        onToggleForm={() => setShowForm((v) => !v)}
        onRefresh={() => refetch()}/>

      {showForm && (
        <RegisterArrivalForm warehouseId={warehouseId}
          register={register}
          asnOptions={asnOptions}
          loadingAsns={loadingAsns}
          onLoadAsns={loadAsns}
          onRegistered={closeForm}/>
      )}

      <VehicleArrivalTable isInitialLoading={loading && !data}
        error={error}
        arrivals={arrivals}
        columns={columns}
        serverPagination={serverPagination}
        pageSize={pageSize}/>

      {linkingArrivalId && (
        <LinkAsnDialog asnOptions={asnOptions}
          loadingAsns={loadingAsns}
          onLoadAsns={loadAsns}
          saving={saving}
          onCancel={() => setLinkingArrivalId(null)}
          onConfirm={handleLinkAsns}/>
      )}

      {editingArrival && (
        <EditVehicleDialog arrival={editingArrival}
          saving={saving}
          onCancel={() => setEditingArrival(null)}
          onSave={handleSaveEdit}/>
      )}
    </div>
  );
}
