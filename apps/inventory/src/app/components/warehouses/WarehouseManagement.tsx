import { useMemo, useState, useEffect } from 'react';

import { type Table } from '@tanstack/react-table';
import {
  Warehouse as WarehouseIcon,
  Plus,
  Download,
  Upload,
  ChevronDown,
  FileDown,
  Loader2,
  Building2,
  Store,
} from 'lucide-react';

import { Button, DataTableViewOptions, SearchInput, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@horizon-sync/ui/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';

import { useWarehouses, useWarehouseMutations } from '../../hooks/useWarehouses';
import type { Warehouse, WarehouseFilters } from '../../types/warehouse.types';
import { apiRequest } from '../../utility/api/core';
import { StatCard } from '../shared';

import { WarehouseDetailDialog } from './WarehouseDetailDialog';
import { WarehouseDialog } from './WarehouseDialog';
import { WarehousesTable } from './WarehousesTable';

const WAREHOUSE_EXPORT_COLUMNS = [
  { id: 'id', label: 'ID' },
  { id: 'name', label: 'Name' },
  { id: 'code', label: 'Code' },
  { id: 'warehouse_type', label: 'Type' },
  { id: 'is_active', label: 'Active' },
  { id: 'city', label: 'City' },
  { id: 'address_line1', label: 'Address' },
  { id: 'total_capacity', label: 'Capacity' },
];

export function WarehouseManagement() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();

  const [filters, setFilters] = useState<WarehouseFilters>({
    search: '',
    warehouseType: 'all',
    status: 'all',
  });

  const { warehouses, pagination, statusCounts, typeCounts, loading, error, refetch, setPage, setPageSize, currentPage, currentPageSize } = useWarehouses(1, 20, filters);
  const { deleteWarehouse, updateWarehouse } = useWarehouseMutations();
  const [warehouseDialogOpen, setWarehouseDialogOpen] = useState(false);
  const [detailDialogOpen, setDetailDialogOpen] = useState(false);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [tableInstance, setTableInstance] = useState<Table<Warehouse> | null>(null);
  const [confirmDeleteWarehouse, setConfirmDeleteWarehouse] = useState<Warehouse | null>(null);
  const [confirmToggleWarehouse, setConfirmToggleWarehouse] = useState<Warehouse | null>(null);

  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Export state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFileName, setExportFileName] = useState('warehouses export file');
  const [exportFileFormat, setExportFileFormat] = useState<'csv' | 'xlsx' | 'json'>('csv');
  const [selectedColumns, setSelectedColumns] = useState<string[]>(
    WAREHOUSE_EXPORT_COLUMNS.map((c) => c.id)
  );

  useEffect(() => {
    setPage(1);
  }, [filters, setPage]);

  const stats = useMemo(() => {
    const total = pagination?.total_items ?? 0;
    const active = statusCounts?.active ?? 0;
    const warehouseCount = typeCounts?.warehouse ?? 0;
    const storeCount = typeCounts?.store ?? 0;
    return { total, active, warehouseCount, storeCount };
  }, [pagination, statusCounts, typeCounts]);

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId) ? prev.filter((id) => id !== columnId) : [...prev, columnId]
    );
  };

  const handleExportSubmit = async () => {
    if (!accessToken) {
      toast({ title: 'Error', description: 'Please ensure you are logged in', variant: 'destructive' });
      return;
    }
    if (selectedColumns.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one column to export', variant: 'destructive' });
      return;
    }
    try {
      setIsExporting(true);
      const headers = WAREHOUSE_EXPORT_COLUMNS.filter((c) => selectedColumns.includes(c.id));
      const rows = warehouses.map((w) =>
        headers.map((h) => {
          const val = (w as unknown as Record<string, unknown>)[h.id];
          return val === null || val === undefined ? '' : String(val);
        }).join(',')
      );
      const csvContent = [headers.map((h) => h.label).join(','), ...rows].join('\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}.${exportFileFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast({ title: 'Success', description: `File "${exportFileName}.${exportFileFormat}" exported successfully` });
      setIsExportDialogOpen(false);
    } catch (error) {
      toast({ title: 'Export Failed', description: error instanceof Error ? error.message : 'Failed to export file', variant: 'destructive' });
    } finally {
      setIsExporting(false);
    }
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleImportSubmit = async () => {
    if (!selectedFile || !accessToken) {
      toast({ title: 'Error', description: 'Please select a file and ensure you are logged in', variant: 'destructive' });
      return;
    }
    try {
      setIsImporting(true);
      const formData = new FormData();
      formData.append('file', selectedFile);
      const result = await apiRequest<Record<string, unknown>>('/warehouses/import', accessToken, { method: 'POST', body: formData });

      const createdCount = Number(result?.created ?? 0);
      const updatedCount = Number(result?.updated ?? 0);
      const failCount = Number(result?.failed ?? 0);
      const totalRows = Number(result?.total_rows ?? 0);

      setIsImportDialogOpen(false);
      setSelectedFile(null);

      setTimeout(() => {
        const message = `${createdCount} created, ${updatedCount} updated out of ${totalRows} row(s)${failCount > 0 ? `. ${failCount} failed.` : '.'}`;
        toast({ title: '✅ Import Successful', description: message });
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { title: '✅ Import Successful', description: message }
        }));
      }, 100);

      refetch();
      window.dispatchEvent(new CustomEvent('warehouse:changed', { detail: { source: 'import' } }));
    } catch (error) {
      toast({ title: 'Import Failed', description: error instanceof Error ? error.message : 'Failed to import file', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const handleDownloadSample = () => {
    const csvContent = [
      'name,code,description,warehouse_type,is_active,address_line1,city,state,country,postal_code,contact_name,contact_phone,contact_email,total_capacity,capacity_uom',
      'Main Warehouse,WH-001,Primary storage facility,warehouse,true,123 Industrial Ave,New York,NY,US,10001,John Smith,+1-555-0101,john@example.com,5000,sqft',
      'Downtown Store,ST-001,Retail store location,store,true,456 Main Street,Los Angeles,CA,US,90001,Jane Doe,+1-555-0102,jane@example.com,1200,sqft',
      'Transit Hub,TR-001,Goods in transit holding area,transit,true,789 Logistics Blvd,Chicago,IL,US,60601,Bob Johnson,+1-555-0103,bob@example.com,2000,sqft',
      'East Warehouse,WH-002,Secondary storage facility,warehouse,true,321 East Park Rd,Houston,TX,US,77001,Alice Brown,+1-555-0104,alice@example.com,3500,sqft',
    ].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'warehouses-import-sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleCreateWarehouse = () => {
    setSelectedWarehouse(null);
    setWarehouseDialogOpen(true);
  };

  const handleEditWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setWarehouseDialogOpen(true);
  };

  const handleViewWarehouse = (warehouse: Warehouse) => {
    setSelectedWarehouse(warehouse);
    setDetailDialogOpen(true);
  };

  const handleDeleteWarehouse = (warehouse: Warehouse) => {
    setConfirmDeleteWarehouse(warehouse);
  };

  const executeDeleteWarehouse = async () => {
    if (!confirmDeleteWarehouse) return;
    try {
      await deleteWarehouse(confirmDeleteWarehouse.id);
      refetch();
    } catch {
      // Error handled in hook
    }
    setConfirmDeleteWarehouse(null);
  };

  const handleToggleWarehouseStatus = (warehouse: Warehouse) => {
    setConfirmToggleWarehouse(warehouse);
  };

  const executeToggleWarehouseStatus = async () => {
    if (!confirmToggleWarehouse) return;
    try {
      await updateWarehouse(confirmToggleWarehouse.id, { is_active: !confirmToggleWarehouse.is_active });
      refetch();
    } catch {
      // Error handled in hook
    }
    setConfirmToggleWarehouse(null);
  };

  const handleTableReady = (table: Table<Warehouse>) => {
    setTableInstance(table);
  };

  const serverPaginationConfig = useMemo(() => ({
    pageIndex: currentPage - 1,
    pageSize: currentPageSize,
    totalItems: pagination?.total_items ?? 0,
    onPaginationChange: (pageIndex: number, newPageSize: number) => {
      setPage(pageIndex + 1);
      setPageSize(newPageSize);
    },
  }), [currentPage, currentPageSize, pagination?.total_items, setPage, setPageSize]);

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Warehouse Management</h1>
          <p className="text-muted-foreground mt-1">Organize inventory across multiple locations and bins</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Warehouse Export/Import
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}>
                <Download className="h-4 w-4" />
                Export Warehouses
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                Import Warehouses
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={handleCreateWarehouse} className="gap-2 text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4" />
            Add Warehouse
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Total Locations" value={stats.total} icon={WarehouseIcon} iconBg="bg-slate-100 dark:bg-slate-800" iconColor="text-slate-600 dark:text-slate-400" />
        <StatCard title="Active Locations" value={stats.active} icon={Building2} iconBg="bg-emerald-100 dark:bg-emerald-900/20" iconColor="text-emerald-600 dark:text-emerald-400" />
        <StatCard title="Warehouses" value={stats.warehouseCount} icon={Building2} iconBg="bg-blue-100 dark:bg-blue-900/20" iconColor="text-blue-600 dark:text-blue-400" />
        <StatCard title="Stores" value={stats.storeCount} icon={Store} iconBg="bg-amber-100 dark:bg-amber-900/20" iconColor="text-amber-600 dark:text-amber-400" />
      </div>

      {/* Filters */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <SearchInput className="sm:w-80" placeholder="Search by name, code, or city..." onSearch={(value) => setFilters((prev) => ({ ...prev, search: value }))} />
          <div className="flex gap-3">
            <Select value={filters.warehouseType} onValueChange={(value) => setFilters((prev) => ({ ...prev, warehouseType: value }))}>
              <SelectTrigger className="w-[160px]">
                <SelectValue placeholder="All Types" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="warehouse">Warehouse</SelectItem>
                <SelectItem value="store">Store</SelectItem>
                <SelectItem value="transit">Transit</SelectItem>
              </SelectContent>
            </Select>
            <Select value={filters.status} onValueChange={(value) => setFilters((prev) => ({ ...prev, status: value }))}>
              <SelectTrigger className="w-[140px]">
                <SelectValue placeholder="All Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        <div className="flex items-center">
          {tableInstance && <DataTableViewOptions table={tableInstance} />}
        </div>
      </div>

      {/* Warehouses Table */}
      <WarehousesTable
        warehouses={warehouses}
        loading={loading}
        error={error}
        hasActiveFilters={!!filters.search || filters.warehouseType !== 'all' || filters.status !== 'all'}
        onView={handleViewWarehouse}
        onEdit={handleEditWarehouse}
        onDelete={handleDeleteWarehouse}
        onToggleStatus={handleToggleWarehouseStatus}
        onCreateWarehouse={handleCreateWarehouse}
        onTableReady={handleTableReady}
        serverPagination={serverPaginationConfig}
      />

      {/* Dialogs */}
      <WarehouseDialog
        open={warehouseDialogOpen}
        onOpenChange={setWarehouseDialogOpen}
        warehouse={selectedWarehouse}
        warehouses={warehouses}
        onCreated={() => { refetch(); window.dispatchEvent(new CustomEvent('warehouse:changed', { detail: { source: 'create' } })); }}
        onUpdated={() => { refetch(); window.dispatchEvent(new CustomEvent('warehouse:changed', { detail: { source: 'update' } })); }}
      />
      <WarehouseDetailDialog open={detailDialogOpen} onOpenChange={setDetailDialogOpen} warehouse={selectedWarehouse} />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmDeleteWarehouse}
        onOpenChange={(open) => { if (!open) setConfirmDeleteWarehouse(null); }}
        title="Delete Warehouse"
        description={`Are you sure you want to delete "${confirmDeleteWarehouse?.name}"?`}
        confirmLabel="Delete"
        variant="destructive"
        onConfirm={executeDeleteWarehouse}
      />

      {/* Toggle Status Confirmation Dialog */}
      <ConfirmationDialog
        open={!!confirmToggleWarehouse}
        onOpenChange={(open) => { if (!open) setConfirmToggleWarehouse(null); }}
        title={confirmToggleWarehouse?.is_active ? 'Deactivate Warehouse' : 'Activate Warehouse'}
        description={`Are you sure you want to ${confirmToggleWarehouse?.is_active ? 'deactivate' : 'activate'} "${confirmToggleWarehouse?.name}"?`}
        confirmLabel={confirmToggleWarehouse?.is_active ? 'Deactivate' : 'Activate'}
        variant={confirmToggleWarehouse?.is_active ? 'destructive' : 'default'}
        onConfirm={executeToggleWarehouseStatus}
      />

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Warehouses</DialogTitle>
            <DialogDescription>Configure export options and select columns to include.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="wh-file-name">File Name</Label>
              <Input id="wh-file-name" value={exportFileName} onChange={(e) => setExportFileName(e.target.value)} disabled={isExporting} />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="wh-file-format">File Format</Label>
              <Select value={exportFileFormat} onValueChange={(v: 'csv' | 'xlsx' | 'json') => setExportFileFormat(v)} disabled={isExporting}>
                <SelectTrigger id="wh-file-format"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid gap-3">
              <Label>Select Columns to Export</Label>
              <div className="grid grid-cols-2 gap-3 border rounded-md p-4">
                {WAREHOUSE_EXPORT_COLUMNS.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox id={`wh-col-${column.id}`} checked={selectedColumns.includes(column.id)} onCheckedChange={() => handleColumnToggle(column.id)} disabled={isExporting} />
                    <Label htmlFor={`wh-col-${column.id}`} className="text-sm font-normal cursor-pointer">{column.label}</Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {isExporting && (
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg border border-muted">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <p className="text-sm font-medium">Exporting your data...</p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)} disabled={isExporting}>Cancel</Button>
            <Button onClick={handleExportSubmit} disabled={isExporting || selectedColumns.length === 0}>
              {isExporting ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" />Exporting...</> : 'Export'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Warehouses</DialogTitle>
            <DialogDescription>Upload a CSV or Excel file to import warehouses.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex items-center justify-between rounded-md border border-dashed p-3 bg-muted/40">
              <div className="text-sm">
                <p className="font-medium">Need a template?</p>
                <p className="text-muted-foreground">Download the sample file to see the required format.</p>
              </div>
              <Button type="button" variant="outline" size="sm" onClick={handleDownloadSample} className="shrink-0 ml-4 gap-1.5">
                <FileDown className="h-4 w-4" />
                Sample CSV
              </Button>
            </div>
            <div className="flex flex-col gap-2">
              <label htmlFor="wh-file-upload" className="text-sm font-medium">Select File</label>
              {!selectedFile ? (
                <label
                  htmlFor="wh-file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-primary">Click to select file</span>
                  <span className="text-xs text-muted-foreground mt-1">CSV or Excel (.csv, .xlsx, .xls)</span>
                </label>
              ) : (
                <div className="flex items-center gap-3 p-3 border rounded-lg bg-muted/30">
                  <Upload className="h-5 w-5 text-primary shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{selectedFile.name}</p>
                    <p className="text-xs text-muted-foreground">{(selectedFile.size / 1024).toFixed(1)} KB</p>
                  </div>
                  <Button type="button" variant="ghost" size="sm" onClick={() => setSelectedFile(null)} disabled={isImporting}>
                    Change
                  </Button>
                </div>
              )}
              <input id="wh-file-upload" type="file" accept=".csv,.xlsx,.xls" onChange={handleFileChange} disabled={isImporting} className="hidden" />
            </div>

            {isImporting && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Uploading and processing...</p>
                  <p className="text-muted-foreground">This may take a moment depending on file size.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportDialogOpen(false); setSelectedFile(null); }} disabled={isImporting}>Cancel</Button>
            <Button onClick={handleImportSubmit} disabled={!selectedFile || isImporting}>
              {isImporting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>) : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
