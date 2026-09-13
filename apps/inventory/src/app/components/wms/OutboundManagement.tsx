import * as React from 'react';

import {
  ArrowUpFromLine,
  ShieldCheck,
  Truck,
  Download,
  Upload,
  Loader2,
  FileUp,
  FileDown,
  Plus,
  ChevronDown,
  Trash2,
  AlertTriangle,
  PackageCheck,
  RefreshCw,
  type LucideIcon,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { cn } from '@horizon-sync/ui/lib';

import { environment } from '../../../environments/environment';
import type { SAPInvoicePayload, OutboundOrderListItem } from '../../types/wms.types';
import { outboundOrderApi } from '../../utility/api/wms';
import { ItemPickerSelect } from '../quotations/ItemPickerSelect';

import { DispatchList } from './DispatchList';
import { GateVerificationPanel } from './GateVerificationPanel';
import { OutboundOrderList } from './OutboundOrderList';
import { OutboundStats } from './OutboundStats';
import { PackingSlipList } from './PackingSlipList';
import { PickExceptionQueue } from './PickExceptionQueue';
import { PickListView } from './PickListView';

// ============================================
// TYPES
// ============================================

type OutboundTab = 'orders' | 'pick' | 'packing' | 'gate' | 'dispatch' | 'exceptions';

interface OutboundManagementProps {
  warehouseId: string | null;
}

/** Per-tab heading shown above the stats (title left, Refresh right). */
const TAB_HEADINGS: Record<OutboundTab, { title: string; subtitle: string }> = {
  orders: { title: 'Orders', subtitle: 'Manage outbound orders imported from incoming order files or created manually.' },
  pick: { title: 'Pick Lists', subtitle: 'Pick lists are generated from confirmed orders. Click View to see items and manage picking.' },
  packing: { title: 'Packing Slips', subtitle: 'Packing slips are created when a completed order is packed. Mark loading, then dispatch.' },
  gate: { title: 'Gate Verification', subtitle: 'Verify outbound shipments at the gate before dispatch.' },
  dispatch: { title: 'Dispatch Records', subtitle: 'End-to-end traceability for all outbound shipments.' },
  exceptions: { title: 'Pick Exception Queue', subtitle: 'Discrepancies, damage and short-picks reported during picking.' },
};

/** Gate is a scan-session form with nothing to re-fetch, so it has no Refresh action. */
const REFRESHABLE_TABS: OutboundTab[] = ['orders', 'pick', 'packing', 'dispatch', 'exceptions'];

// ============================================
// IMPORT DIALOG
// ============================================

interface ImportDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  warehouseId: string | null;
}

/** Toast copy for an import result, including the first few validation issues. */
function importToast(created: number, errors: string[], fileName: string): { title: string; description: string } {
  const shown = errors.slice(0, 3).join('; ');
  const issues = errors.length > 0 ? `. ${errors.length} issue(s): ${shown}${errors.length > 3 ? '...' : ''}` : '';
  return {
    title: created > 0 ? '✅ Import Complete' : '⚠️ Import Finished',
    description: `${created} order(s) created from ${fileName}${issues}`,
  };
}

const SAMPLE_ORDER_CSV = `invoice_reference,sku,description,quantity,uom
INV-1001,PPI-SKO-89,Prestige Digi Kettle 2.0 Litre with 6 Preset Modes,2,Nos
INV-1001,PPI-SKO-90,Prestige Deluxe Plus Aluminium Outer Lid Pressure Pan, Silver,2,Nos
`;

function downloadSampleCsv() {
  const blob = new Blob([SAMPLE_ORDER_CSV], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'incoming-order-sample.csv';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

function ImportDialog({ open, onClose, onSuccess, accessToken, warehouseId }: ImportDialogProps) {
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [importing, setImporting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [orderType, setOrderType] = React.useState<'asn' | 'sap'>('sap');

  const handleFileChange = React.useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSelectedFile(file);
      setError(null);
    }
  }, []);

  const handleImport = React.useCallback(async () => {
    if (!selectedFile || !accessToken || !warehouseId) return;
    setImporting(true);
    setError(null);

    try {
      const result = await outboundOrderApi.importOrders(accessToken, selectedFile, warehouseId, orderType);
      const created = result?.orders_created ?? 0;
      const errors: string[] = result?.errors ?? [];

      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: importToast(created, errors, selectedFile.name),
        }),
      );

      onClose();
      setSelectedFile(null);
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Import failed');
    } finally {
      setImporting(false);
    }
  }, [selectedFile, accessToken, warehouseId, orderType, onClose, onSuccess]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl border w-full max-w-md p-6 space-y-4">
        <h2 className="text-lg font-semibold">Import Incoming Order</h2>
        <p className="text-sm text-muted-foreground">Upload a PDF packing slip or CSV order file to create an outbound order.</p>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Order Type</p>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setOrderType('sap')}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                orderType === 'sap' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50',
              )}>
              SAP Order
            </button>
            <button type="button"
              onClick={() => setOrderType('asn')}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                orderType === 'asn' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50',
              )}>
              ASN Order
            </button>
          </div>
        </div>

        <Button variant="ghost" size="sm" className="gap-2 w-fit" onClick={downloadSampleCsv}>
          <FileDown className="h-4 w-4" />
          Download sample CSV
        </Button>

        {/* File drop zone */}
        <label className={cn(
            'flex flex-col items-center justify-center gap-3 p-6 border-2 border-dashed rounded-lg cursor-pointer',
            'hover:border-primary/50 hover:bg-muted/30 transition-colors',
            selectedFile ? 'border-primary bg-primary/5' : 'border-muted-foreground/25',
          )}>
          <FileUp className={cn('h-8 w-8', selectedFile ? 'text-primary' : 'text-muted-foreground')} />
          {selectedFile ? (
            <div className="text-center">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
            </div>
          ) : (
            <div className="text-center">
              <p className="text-sm font-medium">Click to browse</p>
              <p className="text-xs text-muted-foreground">PDF or CSV (max 10MB)</p>
            </div>
          )}
          <input type="file" accept=".csv,.pdf" onChange={handleFileChange} className="hidden" />
        </label>

        {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button variant="outline"
            onClick={() => {
              onClose();
              setSelectedFile(null);
              setError(null);
            }}>
            Cancel
          </Button>
          <Button onClick={handleImport} disabled={!selectedFile || importing}>
            {importing ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin mr-1" />
                Importing...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-1" />
                Import
              </>
            )}
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// CREATE PICK LIST DIALOG
// ============================================

interface PickerItem {
  id: string;
  item_code: string;
  item_name: string;
  uom: string | null;
  standard_rate: string | null;
}

interface CreateLineRow {
  key: string;
  item_id: string;
  sku: string;
  quantity: number;
  uom: string;
}

interface CreateOrderDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess: () => void;
  accessToken: string | null;
  warehouseId: string | null;
}

function makeKey() {
  return Math.random().toString(36).slice(2);
}

function CreateOrderDialog({ open, onClose, onSuccess, accessToken, warehouseId }: CreateOrderDialogProps) {
  const [invoiceRef, setInvoiceRef] = React.useState('');
  const [orderType, setOrderType] = React.useState<'asn' | 'sap'>('sap');
  const [lines, setLines] = React.useState<CreateLineRow[]>([{ key: makeKey(), item_id: '', sku: '', quantity: 1, uom: 'pcs' }]);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const itemsCacheRef = React.useRef<Map<string, PickerItem>>(new Map());

  const searchItems = React.useCallback(
    async (query: string): Promise<PickerItem[]> => {
      if (!accessToken || !warehouseId) return [];
      const url = `${environment.apiCoreUrl}/api/v1/items/picker?search=${encodeURIComponent(query)}&warehouse_id=${encodeURIComponent(warehouseId)}`;
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
      });
      if (!res.ok) throw new Error('Failed to fetch items');
      const data = await res.json();
      const items: PickerItem[] = data.items ?? [];
      items.forEach((it) => itemsCacheRef.current.set(it.id, it));
      return items;
    },
    [accessToken, warehouseId],
  );

  const updateLine = React.useCallback((key: string, patch: Partial<CreateLineRow>) => {
    setLines((prev) => prev.map((l) => (l.key === key ? { ...l, ...patch } : l)));
  }, []);

  const handleSelectItem = React.useCallback(
    (key: string, itemId: string) => {
      const item = itemsCacheRef.current.get(itemId);
      updateLine(key, {
        item_id: itemId,
        sku: item?.item_code ?? '',
        uom: item?.uom || 'pcs',
      });
    },
    [updateLine],
  );

  const addLine = React.useCallback(() => {
    setLines((prev) => [...prev, { key: makeKey(), item_id: '', sku: '', quantity: 1, uom: 'pcs' }]);
  }, []);

  const removeLine = React.useCallback((key: string) => {
    setLines((prev) => prev.filter((l) => l.key !== key));
  }, []);

  const handleSubmit = async () => {
    if (!accessToken || !warehouseId) return;
    if (!invoiceRef.trim()) {
      setError('Invoice reference is required');
      return;
    }
    const validLines = lines.filter((l) => l.item_id);
    if (validLines.length === 0) {
      setError('Add at least one item');
      return;
    }

    setSaving(true);
    setError(null);
    try {
      const payload: SAPInvoicePayload = {
        invoice_reference: invoiceRef.trim(),
        warehouse_id: warehouseId,
        items: validLines.map((l) => ({
          item_id: l.item_id,
          sku: l.sku,
          quantity: Number(l.quantity) || 0,
          uom: l.uom || 'pcs',
        })),
      };
      await outboundOrderApi.createOrder(accessToken, payload, orderType);
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { title: 'Order Created', description: `${orderType.toUpperCase()} order created for ${invoiceRef.trim()}` },
        }),
      );
      setInvoiceRef('');
      setLines([{ key: makeKey(), item_id: '', sku: '', quantity: 1, uom: 'pcs' }]);
      onClose();
      onSuccess();
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create order');
    } finally {
      setSaving(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-background rounded-xl shadow-xl border w-full max-w-2xl p-6 space-y-4">
        <h2 className="text-lg font-semibold">Create Order</h2>
        <p className="text-sm text-muted-foreground">Create an outbound order (ASN or SAP) from an invoice.</p>

        <div className="space-y-1.5">
          <p className="text-sm font-medium">Order Type</p>
          <div className="flex gap-2">
            <button type="button"
              onClick={() => setOrderType('sap')}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                orderType === 'sap' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50',
              )}>
              SAP Order
            </button>
            <button type="button"
              onClick={() => setOrderType('asn')}
              className={cn(
                'flex-1 rounded-md border px-3 py-2 text-sm font-medium transition-colors',
                orderType === 'asn' ? 'border-primary bg-primary/10 text-primary' : 'hover:bg-muted/50',
              )}>
              ASN Order
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <label htmlFor="create-order-invoice-ref" className="text-sm font-medium">
            Invoice Reference
          </label>
          <Input id="create-order-invoice-ref" value={invoiceRef} onChange={(e) => setInvoiceRef(e.target.value)} placeholder="e.g. INV-1001" />
        </div>

        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <p className="text-sm font-medium">Items</p>
            <Button variant="ghost" size="sm" onClick={addLine} className="gap-1">
              <Plus className="h-4 w-4" />
              Add Item
            </Button>
          </div>
          <div className="space-y-2">
            {lines.map((line) => (
              <div key={line.key} className="flex items-center gap-2">
                <div className="flex-1 min-w-0">
                  <ItemPickerSelect value={line.item_id}
                    onValueChange={(id) => handleSelectItem(line.key, id)}
                    searchItems={searchItems}
                    labelFormatter={(it) => `${it.item_name} (${it.item_code})`}
                    valueKey="id"
                    placeholder="Search item..."/>
                </div>
                <Input type="number"
                  min={1}
                  className="w-24"
                  value={line.quantity}
                  onChange={(e) => updateLine(line.key, { quantity: Number(e.target.value) || 0 })}/>
                <Input className="w-20" value={line.uom} onChange={(e) => updateLine(line.key, { uom: e.target.value })} placeholder="pcs" />
                <Button variant="ghost" size="icon" onClick={() => removeLine(line.key)} disabled={lines.length === 1}>
                  <Trash2 className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        </div>

        {error && <div className="p-3 text-sm text-destructive bg-destructive/10 rounded-md">{error}</div>}

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin mr-1" />}
            Create Order
          </Button>
        </div>
      </div>
    </div>
  );
}

// ============================================
// HEADER
// ============================================

interface HeaderProps {
  activeTab: OutboundTab;
  warehouseId: string | null;
  onImportSuccess: () => void;
}

function OutboundHeader({ activeTab, warehouseId, onImportSuccess }: HeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const [exporting, setExporting] = React.useState(false);
  const [importOpen, setImportOpen] = React.useState(false);
  const [createOpen, setCreateOpen] = React.useState(false);

  const showActions = activeTab === 'orders';

  const handleExport = React.useCallback(async () => {
    if (!accessToken || !warehouseId) return;
    setExporting(true);
    try {
      // Fetch all pages of orders
      const firstPage = await outboundOrderApi.listOrders(accessToken, { warehouse_id: warehouseId, page: 1, page_size: 100 });
      let allOrders: OutboundOrderListItem[] = firstPage.orders ?? [];
      const totalPages = (firstPage.pagination as { total_pages?: number })?.total_pages ?? 1;
      for (let p = 2; p <= totalPages; p++) {
        const page = await outboundOrderApi.listOrders(accessToken, { warehouse_id: warehouseId, page: p, page_size: 100 });
        allOrders = allOrders.concat(page.orders ?? []);
      }

      const headers = ['Order No', 'Type', 'Status', 'Invoice Ref', 'Total Items', 'Created At'];
      const rows = allOrders.map((o) => [
        o.order_no,
        o.order_type,
        o.status,
        o.invoice_reference ?? '',
        String(o.item_count ?? 0),
        o.created_at ?? '',
      ]);

      const csvContent = [headers.join(','), ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))].join('\n');

      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `outbound-orders-export.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { title: 'Export Complete', description: `${allOrders.length} orders exported` },
        }),
      );
    } catch (err) {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { title: 'Export Failed', description: err instanceof Error ? err.message : 'Unknown error', variant: 'destructive' },
        }),
      );
    } finally {
      setExporting(false);
    }
  }, [accessToken, warehouseId]);

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-lg font-semibold">Outbound Management</h2>
          <p className="text-sm text-muted-foreground">Manage pick lists, gate verification, and dispatch records.</p>
        </div>
        {showActions && (
          <div className="flex items-center gap-2">
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Upload className="h-4 w-4" />
                  Import/Export Incoming Order
                  <ChevronDown className="h-4 w-4 opacity-50" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setImportOpen(true)}>
                  <Upload className="h-4 w-4 mr-2" />
                  Import Incoming Order
                </DropdownMenuItem>
                <DropdownMenuItem onClick={handleExport} disabled={exporting}>
                  {exporting ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Download className="h-4 w-4 mr-2" />}
                  Export Orders
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button className="gap-2" onClick={() => setCreateOpen(true)}>
              <Plus className="h-4 w-4" />
              New Order
            </Button>
          </div>
        )}
      </div>

      <ImportDialog open={importOpen}
        onClose={() => setImportOpen(false)}
        onSuccess={onImportSuccess}
        accessToken={accessToken}
        warehouseId={warehouseId}/>

      <CreateOrderDialog open={createOpen}
        onClose={() => setCreateOpen(false)}
        onSuccess={onImportSuccess}
        accessToken={accessToken}
        warehouseId={warehouseId}/>
    </>
  );
}

// ============================================
// SUB-TABS
// ============================================

const SUB_TABS: { id: OutboundTab; label: string; icon: LucideIcon }[] = [
  { id: 'orders', label: 'Orders', icon: FileUp },
  { id: 'pick', label: 'Pick Lists', icon: ArrowUpFromLine },
  { id: 'packing', label: 'Packing Slips', icon: PackageCheck },
  { id: 'gate', label: 'Gate Verification', icon: ShieldCheck },
  { id: 'dispatch', label: 'Dispatches', icon: Truck },
  { id: 'exceptions', label: 'Exceptions', icon: AlertTriangle },
];

function OutboundSubTabs({ activeTab, onChange }: { activeTab: OutboundTab; onChange: (tab: OutboundTab) => void }) {
  return (
    <div className="flex border-b">
      {SUB_TABS.map((tab) => {
        const Icon = tab.icon;
        const active = activeTab === tab.id;
        return (
          <button key={tab.id}
            className={cn('px-4 py-2 text-sm font-medium', active ? 'bg-primary text-primary-foreground' : 'bg-muted/50 hover:bg-muted')}
            onClick={() => onChange(tab.id)}>
            <span className="flex items-center gap-2">
              <Icon className="h-4 w-4" />
              {tab.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ============================================
// TAB CONTENT
// ============================================

const EMPTY_REFRESH_KEYS: Record<OutboundTab, number> = {
  orders: 0,
  pick: 0,
  packing: 0,
  gate: 0,
  dispatch: 0,
  exceptions: 0,
};

interface TabContentProps {
  activeTab: OutboundTab;
  warehouseId?: string;
  gatePickListId: string;
  refreshKeys: Record<OutboundTab, number>;
  onGatePickListChange: (value: string) => void;
  onPickListsGenerated: () => void;
  onDispatchCreated: () => void;
}

function OutboundTabContent({
  activeTab,
  warehouseId,
  gatePickListId,
  refreshKeys,
  onGatePickListChange,
  onPickListsGenerated,
  onDispatchCreated,
}: TabContentProps) {
  switch (activeTab) {
    case 'orders':
      return <OutboundOrderList refreshKey={refreshKeys.orders} warehouseId={warehouseId} onPickListsGenerated={onPickListsGenerated} />;
    case 'pick':
      return <PickListView refreshKey={refreshKeys.pick} warehouseId={warehouseId} />;
    case 'packing':
      return <PackingSlipList refreshKey={refreshKeys.packing} warehouseId={warehouseId} />;
    case 'gate':
      return (
        <div className="max-w-lg space-y-3">
          <Input className="font-mono text-sm"
            placeholder="Enter Pick List ID..."
            value={gatePickListId}
            onChange={(e) => onGatePickListChange(e.target.value)}/>
          {gatePickListId && (
            <div className="border rounded-lg p-4 bg-card">
              <GateVerificationPanel pickListId={gatePickListId} onDispatchCreated={onDispatchCreated} />
            </div>
          )}
        </div>
      );
    case 'dispatch':
      return <DispatchList refreshKey={refreshKeys.dispatch} />;
    case 'exceptions':
      return <PickExceptionQueue refreshKey={refreshKeys.exceptions} warehouseId={warehouseId} />;
  }
}

// ============================================
// MAIN COMPONENT
// ============================================

export function OutboundManagement({ warehouseId }: OutboundManagementProps) {
  const [activeTab, setActiveTab] = React.useState<OutboundTab>('orders');
  const [gatePickListId, setGatePickListId] = React.useState('');
  const [statsRefreshKey, setStatsRefreshKey] = React.useState(0);
  const [refreshKeys, setRefreshKeys] = React.useState<Record<OutboundTab, number>>(EMPTY_REFRESH_KEYS);

  /** Bump the active tab's list and the stat cards. */
  const bumpTab = React.useCallback((tab: OutboundTab) => {
    setRefreshKeys((prev) => ({ ...prev, [tab]: prev[tab] + 1 }));
    setStatsRefreshKey((k) => k + 1);
  }, []);

  const handleOrdersRefresh = React.useCallback(() => bumpTab('orders'), [bumpTab]);
  const handlePickRefresh = React.useCallback(() => bumpTab('pick'), [bumpTab]);
  const handleRefresh = React.useCallback(() => bumpTab(activeTab), [activeTab, bumpTab]);
  const handleDispatchCreated = React.useCallback(() => setActiveTab('dispatch'), []);

  const heading = TAB_HEADINGS[activeTab];
  const canRefresh = REFRESHABLE_TABS.includes(activeTab);
  const wid = warehouseId ?? undefined;

  return (
    <div className="space-y-4">
      <OutboundHeader activeTab={activeTab} warehouseId={warehouseId} onImportSuccess={handleOrdersRefresh} />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-semibold">{heading.title}</h2>
          <p className="text-sm text-muted-foreground">{heading.subtitle}</p>
        </div>
        {canRefresh && (
          <Button variant="outline" size="sm" onClick={handleRefresh} className="gap-2 shrink-0 self-start sm:self-auto">
            <RefreshCw className="h-3.5 w-3.5" />
            Refresh
          </Button>
        )}
      </div>

      <OutboundStats warehouseId={wid} activeTab={activeTab} refreshKey={statsRefreshKey} />

      <div className="border rounded-lg overflow-hidden">
        <OutboundSubTabs activeTab={activeTab} onChange={setActiveTab} />

        <div className="p-4">
          <OutboundTabContent activeTab={activeTab}
            warehouseId={wid}
            gatePickListId={gatePickListId}
            refreshKeys={refreshKeys}
            onGatePickListChange={setGatePickListId}
            onPickListsGenerated={handlePickRefresh}
            onDispatchCreated={handleDispatchCreated}/>
        </div>
      </div>
    </div>
  );
}
