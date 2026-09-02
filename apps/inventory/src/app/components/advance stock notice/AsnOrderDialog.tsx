import * as React from 'react';

import { useQuery } from '@tanstack/react-query';
import { Truck, Trash2, Mail, Eye, Download, Loader2 } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Badge, Button, DetailDialog, Separator } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { environment } from '../../../environments/environment';
import { useEmailWithPdfAttachment } from '../../hooks/useEmailWithPdfAttachment';
import { usePDFGeneration } from '../../hooks/usePDFGeneration';
import type {
  AsnOrder,
  AsnOrderType,
  AsnOrderCreate,
  AsnOrderItemCreate,
  AsnOrderStatus,
  AsnOrderUpdate,
  AsnOrderFormData,
  AsnOrderDialogProps,
} from '../../types/asn-order.types';
import type { Warehouse } from '../../types/warehouse.types';
import { WarehousesResponse } from '../../types/warehouse.types';
import { formatDate } from '../../utility';
import { asnOrderApi } from '../../utility/api/asn-orders';
import { warehouseApi } from '../../utility/api/warehouses';
import { parseAsnEntryCsv, ASN_ENTRY_SAMPLE_CSV } from '../../utility/asnEntryCsvParser';
import { convertAsnOrderToPDFData } from '../../utils/pdf/asnOrderToPDF';
import { EmailComposer } from '../common';
import { StatusBadge } from '../quotations/StatusBadge';
import { CsvImporter } from '../shared/CsvImporter';

import type { AsnEntryLineRow } from './AsnEntryLineItemsTable';
import { AsnEntryLineItemsTable } from './AsnEntryLineItemsTable';
import { AsnOrderFormFields } from './AsnOrderFormFields';
import { FulfillmentStatusTable } from './FulfillmentStatusTable';

const EMPTY_LINE: AsnEntryLineRow = {
  item_id: '',
  item_name: '',
  item_code: '',
  sku: '',
  qty: 0,
  uom: 'pcs',
  sort_order: 1,
};

// ---------- helpers ----------
function toDateInputValue(isoDate: string | null | undefined): string {
  if (!isoDate) return '';
  try {
    return new Date(isoDate).toISOString().slice(0, 10);
  } catch {
    return '';
  }
}

function buildFormFromEntry(entry: AsnOrder): AsnOrderFormData {
  return {
    asn_order_no: entry.asn_order_no,
    asn_type: (entry.asn_type === 'internal_transfer' || entry.asn_type === 'stock_receipt'
      ? entry.asn_type
      : 'purchase') as AsnOrderType,
    warehouse_id_from: entry.warehouse_id_from || '',
    warehouse_id_to: entry.warehouse_id_to || '',
    order_date: toDateInputValue(entry.order_date),
    delivery_date: toDateInputValue(entry.delivery_date),
    status: entry.status || 'draft',
    remarks: entry.remarks || '',
  };
}

function computeDocumentDiscount(subtotal: number, discountType: string, discountValue: number): number {
  if (!discountValue || discountValue <= 0) return 0;
  if (discountType === 'percentage') return Number(((subtotal * discountValue) / 100).toFixed(2));
  return Math.min(discountValue, subtotal);
}

function getAvailableStatuses(isEdit: boolean, currentStatus: AsnOrderStatus): AsnOrderStatus[] {
  if (!isEdit) return ['draft'];
  if (currentStatus === 'draft') return ['draft', 'confirmed'];
  if (currentStatus === 'confirmed') return ['confirmed', 'partially_delivered', 'delivered', 'cancelled'];
  if (currentStatus === 'partially_delivered') return ['partially_delivered', 'delivered', 'cancelled'];
  if (currentStatus === 'delivered') return ['delivered', 'closed', 'cancelled'];
  return [currentStatus];
}

function computeLineTotal(amount: number, discountAmount: number, taxRate: number): { taxAmount: number; totalAmount: number } {
  const netAmount = Math.max(0, amount - discountAmount);
  const taxAmount = Number(((netAmount * taxRate) / 100).toFixed(2));
  return { taxAmount, totalAmount: Number((netAmount + taxAmount).toFixed(2)) };
}

function normalizeLineNumbers(item: AsnOrder['items'][number]) {
  const qty = Number(item.qty) || 0;
  return { qty };
}

function mapItemsToCreate(rows: AsnEntryLineRow[]): AsnOrderItemCreate[] {
  return rows
    .filter((r) => !!r.item_id)
    .map((r, i) => ({
      item_id: r.item_id,
      qty: Number(r.qty) || 0,
      uom: r.uom || 'pcs',
      sort_order: i + 1,
    }));
}

function buildUpdatePayload(formData: AsnOrderFormData, items: AsnOrderItemCreate[]): AsnOrderUpdate {
  return {
    asn_type: formData.asn_type,
    warehouse_id_from: formData.asn_type === 'stock_receipt' ? null : formData.warehouse_id_from || null,
    warehouse_id_to: formData.warehouse_id_to || null,
    order_date: new Date(formData.order_date).toISOString(),
    delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : null,
    status: formData.status,
    remarks: formData.remarks || null,
    items,
  };
}

function buildCreatePayload(formData: AsnOrderFormData, items: AsnOrderItemCreate[], grandTotal: number): AsnOrderCreate {
  return {
    asn_order_no: formData.asn_order_no || undefined,
    asn_type: formData.asn_type,
    warehouse_id_from: formData.asn_type === 'stock_receipt' ? null : formData.warehouse_id_from || null,
    warehouse_id_to: formData.warehouse_id_to,
    order_date: new Date(formData.order_date).toISOString(),
    delivery_date: formData.delivery_date ? new Date(formData.delivery_date).toISOString() : null,
    status: formData.status,
    grand_total: grandTotal,
    remarks: formData.remarks || null,
    items,
  };
}

const STATUS_LABELS: Record<AsnOrderStatus, string> = {
  draft: 'Draft',
  confirmed: 'Confirmed',
  partially_delivered: 'Partially Delivered',
  delivered: 'Delivered',
  closed: 'Closed',
  cancelled: 'Cancelled',
};

const DEFAULT_FORM: AsnOrderFormData = {
  asn_order_no: '',
  asn_type: 'purchase',
  warehouse_id_from: '',
  warehouse_id_to: '',
  order_date: new Date().toISOString().slice(0, 10),
  delivery_date: '',
  status: 'draft',
  remarks: '',
};

function getSubmitLabel(saving: boolean, isEdit: boolean): string {
  if (saving) return 'Saving...';
  return isEdit ? 'Update ASN Order' : 'Create ASN Order';
}

function getDialogTitle(isEdit: boolean, viewMode?: boolean): string {
  if (viewMode) return 'View ASN Order';
  return isEdit ? 'Edit ASN Order' : 'Create ASN Order';
}

function formatArrivalStatus(status: string): string {
  return status.replace(/_/g, ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function VehicleDetails({ asnOrder }: { asnOrder: AsnOrder }) {
  const arrivals = asnOrder.vehicle_arrivals ?? [];

  return (
    <>
      <Separator />
      <section className="space-y-3">
        <div className="flex items-center gap-2">
          <Truck className="h-4 w-4" />
          <h3 className="text-sm font-medium">Vehicle Details</h3>
          {arrivals.length > 0 && <Badge variant="secondary">{arrivals.length}</Badge>}
        </div>

        {arrivals.length === 0 ? (
          <p className="text-sm text-muted-foreground">No vehicle arrival has been recorded for this ASN order.</p>
        ) : (
          <div className="space-y-3">
            {arrivals.map((arrival) => (
              <div key={arrival.id} className="grid gap-3 rounded-lg border p-4 sm:grid-cols-2 lg:grid-cols-4">
                <div>
                  <p className="text-xs text-muted-foreground">Vehicle Number</p>
                  <p className="font-mono text-sm font-medium">{arrival.vehicle_no || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver</p>
                  <p className="text-sm">{arrival.driver_name || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Driver Contact</p>
                  <p className="text-sm">{arrival.driver_contact || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Transporter</p>
                  <p className="text-sm">{arrival.transporter || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Dock</p>
                  <p className="text-sm">{arrival.dock || '—'}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Status</p>
                  <Badge variant={arrival.status === 'arrived' ? 'success' : 'secondary'}>{formatArrivalStatus(arrival.status)}</Badge>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">Arrived At</p>
                  <p className="text-sm">{formatDate(arrival.arrived_at, 'DD-MMM-YY', { includeTime: true })}</p>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </>
  );
}

function useAsnOrderPDFActions(targetWarehouse?: Warehouse | null) {
  const { toast } = useToast();
  const { loading, download, preview, generateBase64 } = usePDFGeneration();

  const handleDownload = async (asnOrder: AsnOrder) => {
    try {
      const pdfData = convertAsnOrderToPDFData(asnOrder, targetWarehouse);
      await download(pdfData, `${asnOrder.asn_order_no}.pdf`);
      toast({ title: 'PDF Downloaded', description: `${asnOrder.asn_order_no}.pdf has been downloaded` });
    } catch (error) {
      toast({ title: 'Download Failed', description: error instanceof Error ? error.message : 'Failed to download PDF', variant: 'destructive' });
    }
  };

  const handlePreview = async (asnOrder: AsnOrder) => {
    try {
      const pdfData = convertAsnOrderToPDFData(asnOrder, targetWarehouse);
      await preview(pdfData);
    } catch (error) {
      toast({ title: 'Preview Failed', description: error instanceof Error ? error.message : 'Failed to preview PDF', variant: 'destructive' });
    }
  };

  const handleGenerateBase64 = async (asnOrder: AsnOrder): Promise<string | null> => {
    const pdfData = convertAsnOrderToPDFData(asnOrder, targetWarehouse);
    return generateBase64(pdfData);
  };

  return { loading, handleDownload, handlePreview, handleGenerateBase64 };
}

function AsnOrderEmailComposer({
  asnOrder,
  targetWarehouse,
  emailDialogOpen,
  pdfAttachment,
  onOpenChange,
  onSuccess,
}: {
  asnOrder: AsnOrder;
  targetWarehouse?: Warehouse | null;
  emailDialogOpen: boolean;
  pdfAttachment: { filename: string; content: string; content_type: string } | null;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}) {
  return (
    <EmailComposer open={emailDialogOpen}
      onOpenChange={onOpenChange}
      docType="asn"
      docId={asnOrder.id}
      docNo={asnOrder.asn_order_no}
      defaultRecipient={targetWarehouse?.contact_email || asnOrder.warehouse?.email || ''}
      defaultSubject={`Advance Stock Notice ${asnOrder.asn_order_no}`}
      defaultMessage={`Dear Team,\n\nPlease find attached Advance Stock Notice ${asnOrder.asn_order_no} for your reference.\n\nBest regards`}
      defaultAttachments={pdfAttachment ? [pdfAttachment] : undefined}
      onSuccess={onSuccess} />
  );
}

// ---------- component ----------

// eslint-disable-next-line complexity
export function AsnOrderDialog({ open, viewMode, asnOrder, saving, onSave, onOpenChange, defaultAsnType }: AsnOrderDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [csvPreviewActive, setCsvPreviewActive] = React.useState(false);
  const [lineItems, setLineItems] = React.useState<AsnEntryLineRow[]>([{ ...EMPTY_LINE }]);
  const isEdit = !!asnOrder;

  const [formData, setFormData] = React.useState<AsnOrderFormData>({ ...DEFAULT_FORM });
  const [warehouseError, setWarehouseError] = React.useState('');
  const [importStatus, setImportStatus] = React.useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [clearKey, setClearKey] = React.useState(0);
  const { toast } = useToast();

  // Fetch full ASN order detail when dialog opens in view/edit mode
  const { data: orderDetail } = useQuery<AsnOrder>({
    queryKey: ['asn-order-detail', asnOrder?.id],
    queryFn: () => asnOrderApi.get(accessToken || '', asnOrder?.id || '') as Promise<AsnOrder>,
    enabled: !!accessToken && !!asnOrder?.id && open,
  });

  // Use API detail if available, otherwise fall back to prop
  const resolvedOrder = orderDetail || asnOrder;

  const { data: allWarehousesData } = useQuery<WarehousesResponse>({
    queryKey: ['warehouses-list', 'asn-all'],
    queryFn: () => warehouseApi.list(accessToken || '', 1, 100, 'all') as Promise<WarehousesResponse>,
    enabled: !!accessToken && open,
  });

  const { data: assignedWarehousesData } = useQuery<WarehousesResponse>({
    queryKey: ['warehouses-list', 'asn-assigned'],
    queryFn: () => warehouseApi.list(accessToken || '', 1, 100, 'assigned') as Promise<WarehousesResponse>,
    enabled: !!accessToken && open,
  });

  const allWarehouses = React.useMemo(() => allWarehousesData?.warehouses ?? [], [allWarehousesData?.warehouses]);
  const assignedWarehouses = React.useMemo(() => assignedWarehousesData?.warehouses ?? [], [assignedWarehousesData?.warehouses]);

  // Merge from_warehouse and to_warehouse from API response into warehouse lists
  // so they appear correctly in dropdowns even if not in the main warehouse lists
  const warehousesFrom = React.useMemo(() => {
    const list = [...allWarehouses];
    if (resolvedOrder?.from_warehouse?.id && resolvedOrder?.from_warehouse?.name) {
      const fromWh = resolvedOrder.from_warehouse;
      const alreadyExists = list.some((w) => w.id === fromWh.id);
      if (!alreadyExists) {
        list.push({ id: fromWh.id, name: fromWh.name, code: fromWh.code ?? '' } as Warehouse);
      }
    }
    return list;
  }, [allWarehouses, resolvedOrder?.from_warehouse]);

  const warehousesTo = React.useMemo(() => {
    const list = [...allWarehouses];
    if (resolvedOrder?.to_warehouse?.id && resolvedOrder?.to_warehouse?.name) {
      const toWh = resolvedOrder.to_warehouse;
      const alreadyExists = list.some((w) => w.id === toWh.id);
      if (!alreadyExists) {
        list.push({ id: toWh.id, name: toWh.name, code: toWh.code ?? '' } as Warehouse);
      }
    }
    return list;
  }, [allWarehouses, resolvedOrder?.to_warehouse]);

  const targetWarehouse = React.useMemo(() => {
    const warehouseId = resolvedOrder?.warehouse_id_to;
    if (!warehouseId) return null;
    return allWarehouses.find((w) => w.id === warehouseId) || null;
  }, [resolvedOrder?.warehouse_id_to, allWarehouses]);

  const { loading: pdfLoading, handleDownload, handlePreview, handleGenerateBase64 } = useAsnOrderPDFActions(targetWarehouse);
  const { emailDialogOpen, pdfAttachment, openEmailWithPdf, handleEmailClose, handleEmailSuccess } = useEmailWithPdfAttachment();

  const handleSendEmail = React.useCallback(() => {
    if (!resolvedOrder) return;
    openEmailWithPdf(() => handleGenerateBase64(resolvedOrder), `${resolvedOrder.asn_order_no}.pdf`);
  }, [resolvedOrder, handleGenerateBase64, openEmailWithPdf]);

  const downloadJson = (filename: string, data: unknown) => {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleExport856 = React.useCallback(async () => {
    if (!resolvedOrder) return;
    try {
      const data = await asnOrderApi.export856(accessToken || '', resolvedOrder.id);
      downloadJson(`${resolvedOrder.asn_order_no}-856.json`, data);
      toast({ title: 'Exported 856', description: `${resolvedOrder.asn_order_no}-856.json downloaded` });
    } catch (error) {
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export 856', variant: 'destructive' });
    }
  }, [accessToken, resolvedOrder]);

  const handleExportEpcis = React.useCallback(async () => {
    if (!resolvedOrder) return;
    try {
      const data = await asnOrderApi.exportEpcis(accessToken || '', resolvedOrder.id);
      downloadJson(`${resolvedOrder.asn_order_no}-epcis.json`, data);
      toast({ title: 'Exported EPCIS', description: `${resolvedOrder.asn_order_no}-epcis.json downloaded` });
    } catch (error) {
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export EPCIS', variant: 'destructive' });
    }
  }, [accessToken, resolvedOrder]);

  // Initialize form when dialog opens or asnOrder changes — use resolvedOrder (API detail or prop fallback)
  React.useEffect(() => {
    if (open && resolvedOrder) {
      setFormData(buildFormFromEntry(resolvedOrder));
      if (resolvedOrder.items && resolvedOrder.items.length > 0) {
        setLineItems(
          resolvedOrder.items.map((item, i) => ({
            item_id: item.item_id,
            item_name: item.item_name || '',
            item_code: item.item_code || item.item_sku || '',
            sku: item.sku || item.item_sku || '',
            qty: typeof item.qty === 'object' ? item.qty.qty : Number(item.qty) || 0,
            uom: item.uom || 'pcs',
            sort_order: item.sort_order || i + 1,
          })),
        );
      } else {
        setLineItems([{ ...EMPTY_LINE }]);
      }
    } else if (open && !asnOrder) {
      setFormData({ ...DEFAULT_FORM, asn_type: defaultAsnType || 'purchase' });
      setLineItems([{ ...EMPTY_LINE }]);
      setImportStatus(null);
      setWarehouseError('');
    }
  }, [open, resolvedOrder, asnOrder, defaultAsnType]);

  // Auto-populate target = user's own warehouse on creation. Source stays
  // user-selectable (stock receipts carry no source warehouse at all).
  React.useEffect(() => {
    if (open && !asnOrder && assignedWarehouses.length > 0 && !formData.warehouse_id_to) {
      const defaultWh = assignedWarehouses.find((w) => w.is_default) || assignedWarehouses[0];
      if (defaultWh) {
        setFormData((prev) => ({
          ...prev,
          warehouse_id_to: defaultWh.id,
        }));
      }
    }
  }, [open, asnOrder, assignedWarehouses, formData.warehouse_id_to]);

  // Real-time warehouse equality validation
  React.useEffect(() => {
    if (formData.warehouse_id_from && formData.warehouse_id_to && formData.warehouse_id_from === formData.warehouse_id_to) {
      setWarehouseError('Source and target warehouse must be different');
    } else {
      setWarehouseError('');
    }
  }, [formData.warehouse_id_from, formData.warehouse_id_to]);

  const handleChange = (field: string, value: string) => {
    if (field === 'asn_type' && value === 'stock_receipt') {
      // Stock receipts have no source warehouse (stock arrives from
      // manufacturing units, not another warehouse).
      setFormData((prev) => ({ ...prev, asn_type: value, warehouse_id_from: '' }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  /* CSV import handler — validates warehouses, auto-resolves items by code */
  const handleCsvImport = React.useCallback(
    async (rows: AsnEntryLineRow[]) => {
      if (!formData.warehouse_id_to) {
        toast({ title: 'Warehouse Required', description: 'Please select a target warehouse before importing items', variant: 'destructive' });
        return;
      }
      if (formData.asn_type !== 'stock_receipt' && !formData.warehouse_id_from) {
        toast({ title: 'Warehouse Required', description: 'Please select a source warehouse before importing items', variant: 'destructive' });
        return;
      }
      if (formData.asn_type !== 'stock_receipt' && formData.warehouse_id_from === formData.warehouse_id_to) {
        toast({ title: 'Invalid Warehouses', description: 'Source and target warehouse must be different', variant: 'destructive' });
        return;
      }

      // Stock Receipt ASNs resolve items against the target (mother) warehouse.
      const pickerWarehouseId =
        formData.asn_type === 'stock_receipt' ? formData.warehouse_id_to : formData.warehouse_id_from;

      setImporting(true);
      try {
        // eslint-disable-next-line complexity
        const resolveItem = async (row: AsnEntryLineRow): Promise<AsnEntryLineRow> => {
          if (!row.item_code || !accessToken) return row;
          try {
            const url = `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(row.item_code)}&warehouse_id=${encodeURIComponent(pickerWarehouseId)}`;
            const response = await fetch(url, {
              headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
            });
            if (!response.ok) return row;
            const data = await response.json();
            const match =
              data.items?.find((item: { item_code?: string }) => item.item_code?.toLowerCase() === row.item_code?.toLowerCase()) || data.items?.[0];
            if (match) {
              return {
                ...row,
                item_id: match.id,
                item_name: match.item_name,
                item_code: match.item_code || row.item_code,
                uom: match.uom || row.uom || 'pcs',
              };
            }
          } catch {
            // ignore resolution failures, keep unresolved row
          }
          return row;
        };

        const resolvedRows = await Promise.all(rows.map(resolveItem));

        const resolvedCount = resolvedRows.filter((r) => !!r.item_id).length;
        const unresolvedCount = resolvedRows.length - resolvedCount;

        setLineItems((prev) => {
          const existing = prev.filter((r) => !!r.item_id);
          const offset = existing.length;
          const imported = resolvedRows.map((r, i) => ({ ...r, sort_order: offset + i + 1 }));
          return existing.length > 0 ? [...existing, ...imported] : imported;
        });

        if (unresolvedCount > 0) {
          setImportStatus({ type: 'error', message: `${unresolvedCount} item(s) could not be auto-resolved — please select them manually` });
        } else if (resolvedCount > 0) {
          setImportStatus({ type: 'success', message: `${resolvedCount} item(s) imported successfully` });
        }
      } finally {
        setImporting(false);
      }
    },
    [accessToken, formData.asn_type, formData.warehouse_id_from, formData.warehouse_id_to],
  );

  const handleClearAllItems = React.useCallback(() => {
    setLineItems([{ ...EMPTY_LINE }]);
    setImportStatus(null);
    setCsvPreviewActive(false);
    setClearKey((k) => k + 1);
  }, []);

  const isReadOnly = viewMode || (isEdit && formData.status !== 'draft');
  const isLineItemEditingDisabled = isReadOnly;
  const availableStatuses = React.useMemo(() => getAvailableStatuses(isEdit, formData.status), [isEdit, formData.status]);

  // eslint-disable-next-line complexity
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const items = mapItemsToCreate(lineItems);
    if (items.length === 0) {
      toast({ title: 'Items Required', description: 'Please add at least one item', variant: 'destructive' });
      return;
    }

    if (!formData.warehouse_id_to) {
      toast({ title: 'Warehouse Required', description: 'Please select a target warehouse', variant: 'destructive' });
      return;
    }
    if (formData.asn_type !== 'stock_receipt' && !formData.warehouse_id_from) {
      toast({ title: 'Warehouse Required', description: 'Please select a source warehouse', variant: 'destructive' });
      return;
    }
    if (formData.asn_type !== 'stock_receipt' && formData.warehouse_id_from === formData.warehouse_id_to) {
      toast({ title: 'Invalid Warehouses', description: 'Source and target warehouse must be different', variant: 'destructive' });
      return;
    }
    if (formData.delivery_date && formData.order_date && formData.delivery_date < formData.order_date) {
      toast({ title: 'Invalid Dates', description: 'Delivery date cannot be before order date', variant: 'destructive' });
      return;
    }

    try {
      if (isEdit && resolvedOrder) {
        await onSave(buildUpdatePayload(formData, items), resolvedOrder.id);
      } else {
        await onSave(buildCreatePayload(formData, items, grandTotal));
      }
      onOpenChange(false);
    } catch (err) {
      // Error toast is shown by the caller (useAsnOrderManagement)
      console.error('ASN order save error:', err);
    }
  };

  const grandTotal = React.useMemo(() => lineItems.reduce((sum, r) => sum + (r.qty || 0), 0), [lineItems]);

  const summary = React.useMemo(
    () => ({
      documentDiscount: {
        disabled: isLineItemEditingDisabled,
      },
    }),
    [isLineItemEditingDisabled],
  );

  return (
    <>
      <DetailDialog open={open}
        onOpenChange={onOpenChange}
        size="lg"
        contentClassName="max-w-4xl flex flex-col"
        style={{ height: 'min(85vh, 820px)' }}
        showCloseButton={false}
        title={
          <div className="flex items-center gap-3">
            <Truck className="h-5 w-5" />
            <span>{getDialogTitle(isEdit, viewMode)}</span>
            <StatusBadge status={formData.status} />
          </div>
        }
        footer={
          <div className="flex items-center justify-end gap-2">
            {viewMode ? (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                  Close
                </Button>
                {formData.status !== 'draft' && (
                  <>
                    <Button type="button"
                      variant="outline"
                      onClick={() => resolvedOrder && handlePreview(resolvedOrder)}
                      disabled={pdfLoading}
                      className="gap-2">
                      <Eye className="h-4 w-4" />
                      Preview PDF
                    </Button>
                    <Button type="button"
                      variant="outline"
                      onClick={() => resolvedOrder && handleDownload(resolvedOrder)}
                      disabled={pdfLoading}
                      className="gap-2">
                      <Download className="h-4 w-4" />
                      Download PDF
                    </Button>
                    <Button type="button" variant="outline" onClick={handleSendEmail} disabled={pdfLoading} className="gap-2">
                      <Mail className="h-4 w-4" />
                      Send Email
                    </Button>
                    {formData.asn_type === 'internal_transfer' && (
                      <>
                        <Button type="button" variant="outline" onClick={handleExport856} className="gap-2">
                          <Download className="h-4 w-4" />
                          Export 856
                        </Button>
                        <Button type="button" variant="outline" onClick={handleExportEpcis} className="gap-2">
                          <Download className="h-4 w-4" />
                          Export EPCIS
                        </Button>
                      </>
                    )}
                  </>
                )}
              </>
            ) : (
              <>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={saving}>
                  Cancel
                </Button>
                <Button type="submit" form="asn-form" disabled={saving}>
                  {getSubmitLabel(saving, isEdit)}
                </Button>
              </>
            )}
          </div>
        }>
        <form id="asn-form" onSubmit={handleSubmit} noValidate className="space-y-6">
          <AsnOrderFormFields formData={formData}
            warehousesFrom={warehousesFrom}
            warehousesTo={warehousesTo}
            isEdit={isEdit}
            readOnly={isReadOnly}
            availableStatuses={availableStatuses}
            statusLabels={STATUS_LABELS}
            onFieldChange={handleChange}
            warehouseError={warehouseError} />

          <Separator />
          <div className="space-y-2">
            <h3 className="text-sm font-medium">Line Items</h3>
            {!isReadOnly && (
              <div className="flex items-center gap-2 flex-wrap">
                <CsvImporter key={`csv-${clearKey}`}
                  parseRows={parseAsnEntryCsv}
                  onImport={handleCsvImport}
                  // onFileSelected={handleBulkUpload}
                  onPreviewChange={setCsvPreviewActive}
                  disabled={importing || !formData.warehouse_id_to || (formData.asn_type !== 'stock_receipt' && !formData.warehouse_id_from)}
                  sampleCsv={ASN_ENTRY_SAMPLE_CSV}
                  sampleFileName="asn-order-sample.csv"
                  previewColumns={[
                    { key: 'item_id', label: 'Item Code' },
                    { key: 'qty', label: 'Qty' },
                    { key: 'uom', label: 'UOM' },
                  ]} />
                {(lineItems.length > 1 || (lineItems.length === 1 && lineItems[0].item_id)) && (
                  <Button type="button" variant="ghost" size="sm" onClick={handleClearAllItems} className="text-destructive hover:text-destructive">
                    <Trash2 className="h-4 w-4 mr-1" />
                    Clear All
                  </Button>
                )}
                {importing && (
                  <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                    <Loader2 className="h-3.5 w-3.5 animate-spin" />
                    Importing...
                  </span>
                )}
                {importStatus && !importing && (
                  <Badge variant={importStatus.type === 'success' ? 'success' : 'destructive'}>{importStatus.message}</Badge>
                )}
              </div>
            )}
            {!csvPreviewActive && (
              <AsnEntryLineItemsTable key={`table-${clearKey}`}
                items={lineItems}
                onItemsChange={setLineItems}
                disabled={isReadOnly}
                warehouseIdFrom={formData.asn_type === 'stock_receipt' ? formData.warehouse_id_to : formData.warehouse_id_from}
                warehouseIdTo={formData.warehouse_id_to}
                renderFooter={() => (
                  <tr>
                    <td colSpan={2} className="px-4 py-3 text-right text-sm font-medium text-muted-foreground">Total Quantity:</td>
                    <td className="px-4 py-3 text-right text-sm font-semibold">{grandTotal}</td>
                    <td className="px-4 py-3"></td>
                    <td className="px-4 py-3"></td>
                  </tr>
                )} />
            )}
          </div>

          {isEdit && resolvedOrder?.items && <FulfillmentStatusTable items={resolvedOrder.items} />}

          {viewMode && resolvedOrder && <VehicleDetails asnOrder={resolvedOrder} />}
        </form>
      </DetailDialog>

      {resolvedOrder && (
        <AsnOrderEmailComposer asnOrder={resolvedOrder}
          targetWarehouse={targetWarehouse}
          emailDialogOpen={emailDialogOpen}
          pdfAttachment={pdfAttachment}
          onOpenChange={handleEmailClose}
          onSuccess={handleEmailSuccess} />
      )}
    </>
  );
}
