import { useState } from 'react';

import { Plus, Download, Upload, ChevronDown, Loader2, FileDown } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { useToast } from '@horizon-sync/ui/hooks';

import { bulkImportApi, bulkExportApi, BulkExportPayload } from '../../utility/api';

interface ItemManagementHeaderProps {
  onCreateItem: () => void;
  onImportSuccess?: () => void;
}

const AVAILABLE_COLUMNS = [
  { id: 'id', label: 'ID' },
  { id: 'item_code', label: 'Item Code' },
  { id: 'item_name', label: 'Item Name' },
  { id: 'description', label: 'Description' },
  { id: 'item_type', label: 'Item Type' },
  { id: 'status', label: 'Status' },
  { id: 'uom', label: 'UOM' },
  { id: 'standard_rate', label: 'Standard Rate' },
];

export function ItemManagementHeader({ onCreateItem, onImportSuccess }: ItemManagementHeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  
  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  // Export state
  const [isExportDialogOpen, setIsExportDialogOpen] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [exportFileName, setExportFileName] = useState('items export file');
  const [exportFileFormat, setExportFileFormat] = useState<'csv' | 'xlsx' | 'json' | 'pdf'>('csv');
  const [exportItemType, setExportItemType] = useState<string>('all');
  const [exportStatus, setExportStatus] = useState<string>('all');
  const [selectedColumns, setSelectedColumns] = useState<string[]>([
    'id',
    'item_code',
    'item_name',
    'description',
    'item_type',
    'status',
    'uom',
    'standard_rate',
  ]);

  const handleExport = () => {
    setIsExportDialogOpen(true);
  };

  const handleColumnToggle = (columnId: string) => {
    setSelectedColumns((prev) =>
      prev.includes(columnId)
        ? prev.filter((id) => id !== columnId)
        : [...prev, columnId]
    );
  };

  const handleExportSubmit = async () => {
    if (!accessToken) {
      toast({
        title: 'Error',
        description: 'Please ensure you are logged in',
        variant: 'destructive',
      });
      return;
    }

    if (selectedColumns.length === 0) {
      toast({
        title: 'Error',
        description: 'Please select at least one column to export',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsExporting(true);

      const payload: BulkExportPayload = {
        file_format: exportFileFormat,
        file_name: exportFileName,
        selected_columns: selectedColumns,
      };

      // Add filters only if they're not 'all'
      const filters: { item_type?: string; status?: string } = {};
      if (exportItemType !== 'all') {
        filters.item_type = exportItemType;
      }
      if (exportStatus !== 'all') {
        filters.status = exportStatus;
      }
      if (Object.keys(filters).length > 0) {
        payload.filters = filters;
      }

      const blob = await bulkExportApi.export(accessToken, payload);

      // Create download link
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `${exportFileName}.${exportFileFormat}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast({
        title: 'Success',
        description: `File "${exportFileName}.${exportFileFormat}" exported successfully`,
      });

      setIsExportDialogOpen(false);
    } catch (error) {
      console.error('Export error:', error);
      toast({
        title: 'Export Failed',
        description: error instanceof Error ? error.message : 'Failed to export file',
        variant: 'destructive',
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = () => {
    setIsImportDialogOpen(true);
  };

  const handleDownloadSample = () => {
    const csvContent = [
      'item_name,description,item_type,status,uom,standard_rate,maintain_stock,barcode,item_group_name,valuation_method,min_order_qty,max_order_qty',
      'Laptop 15 Pro,High performance laptop with 16GB RAM,stock,active,Unit,1200.00,true,8901234567890,Electronics,fifo,1,100',
      'Office Chair Ergonomic,Adjustable ergonomic office chair,stock,active,Piece,350.00,true,8901234567891,Furniture,fifo,1,50',
      'Annual Support Contract,12-month software support and maintenance,service,active,Nos,500.00,false,,Services,,1,',
      'HDMI Cable 2m,High-speed HDMI 2.0 cable 2 meters,stock,active,Piece,15.00,true,8901234567892,Electronics,fifo,1,500',
      'Printer Paper A4,80gsm A4 printer paper ream of 500 sheets,stock,active,Ream,8.00,true,8901234567893,Stationery,fifo,5,1000',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'items-import-sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setSelectedFile(file);
    }
  };

  const handleImportSubmit = async () => {
    if (!selectedFile || !accessToken) {
      toast({
        title: 'Error',
        description: 'Please select a file and ensure you are logged in',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsImporting(true);
      const result = await bulkImportApi.upload(accessToken, selectedFile) as Record<string, unknown>;
      
      const successCount = Number(result?.successful_rows ?? 0);
      const failCount = Number(result?.failed_rows ?? 0);
      const totalCount = Number(result?.total_rows ?? successCount + failCount);
      const jobStatus = String(result?.status ?? '');

      console.log('[Import] Result:', { successCount, failCount, totalCount, jobStatus, result });

      // Close dialog and reset file first
      setIsImportDialogOpen(false);
      setSelectedFile(null);

      // Show toast AFTER dialog closes (so it doesn't get unmounted with the dialog)
      setTimeout(() => {
        const message = totalCount > 0
          ? `${successCount} of ${totalCount} item(s) processed successfully (created or updated)${failCount > 0 ? `. ${failCount} row(s) failed.` : '.'}`
          : `Import completed successfully.`;

        // Try toast (works if Toaster is in same React tree)
        toast({
          title: '✅ Import Successful',
          description: message,
        });

        // Also dispatch custom event for host app's Toaster to pick up
        window.dispatchEvent(new CustomEvent('app:toast', {
          detail: { title: '✅ Import Successful', description: message }
        }));
      }, 100);

      // Auto-refresh item list after successful import
      if (onImportSuccess) {
        // Small delay to allow backend processing to complete
        setTimeout(() => onImportSuccess(), 1000);
      }
    } catch (error: unknown) {
      console.error('Import error:', error);
      let errorMessage = 'Failed to import file. Please check the file format and try again.';
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        if (err.details && typeof err.details === 'object') {
          const details = err.details as Record<string, unknown>;
          errorMessage = String(details.detail || details.message || errorMessage);
        } else if (err.message) {
          errorMessage = String(err.message);
        }
      } else if (error instanceof Error) {
        errorMessage = error.message;
      }
      toast({
        title: 'Import Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Management</h1>
          <p className="text-muted-foreground mt-1">Manage your product catalog, pricing, and inventory levels</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Item Export/Import
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export Items
              </DropdownMenuItem>
              <DropdownMenuItem onClick={handleImport}>
                <Upload className="h-4 w-4" />
                Import Items
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateItem} className="gap-2 text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4" />
            Add Item
          </Button>
        </div>
      </div>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Items</DialogTitle>
            <DialogDescription>
              Configure export options and select columns to include in your export file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            {/* File Name */}
            <div className="grid gap-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input id="file-name"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="stock_items_export"
                disabled={isExporting}/>
            </div>

            {/* File Format */}
            <div className="grid gap-2">
              <Label htmlFor="file-format">File Format</Label>
              <Select value={exportFileFormat}
                onValueChange={(value: 'csv' | 'xlsx' | 'json' | 'pdf') => setExportFileFormat(value)}
                disabled={isExporting}>
                <SelectTrigger id="file-format">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="xlsx">Excel (XLSX)</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="pdf">PDF</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Filters */}
            <div className="grid gap-4">
              <Label>Filters</Label>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="item-type" className="text-sm">Item Type</Label>
                  <Select value={exportItemType}
                    onValueChange={setExportItemType}
                    disabled={isExporting}>
                    <SelectTrigger id="item-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="stock">Stock</SelectItem>
                      <SelectItem value="service">Service</SelectItem>
                      <SelectItem value="non-stock">Non-Stock</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid gap-2">
                  <Label htmlFor="status" className="text-sm">Status</Label>
                  <Select value={exportStatus}
                    onValueChange={setExportStatus}
                    disabled={isExporting}>
                    <SelectTrigger id="status">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="inactive">Inactive</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Column Selection */}
            <div className="grid gap-3">
              <Label>Select Columns to Export</Label>
              <div className="grid grid-cols-2 gap-3 border rounded-md p-4">
                {AVAILABLE_COLUMNS.map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox id={column.id}
                      checked={selectedColumns.includes(column.id)}
                      onCheckedChange={() => handleColumnToggle(column.id)}
                      disabled={isExporting}/>
                    <Label htmlFor={column.id}
                      className="text-sm font-normal cursor-pointer">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          {isExporting && (
            <div className="flex items-center justify-center gap-3 p-4 bg-muted/50 rounded-lg border border-muted">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
              <div className="text-sm">
                <p className="font-medium">Exporting your data...</p>
                <p className="text-muted-foreground">Please wait while we prepare your file for download.</p>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline"
              onClick={() => setIsExportDialogOpen(false)}
              disabled={isExporting}>
              Cancel
            </Button>
            <Button onClick={handleExportSubmit} disabled={isExporting || selectedColumns.length === 0}>
              {isExporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Exporting...
                </>
              ) : (
                'Export'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) { setSelectedFile(null); }
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Items</DialogTitle>
            <DialogDescription>
              Upload a file to import items into your inventory. Supported formats: CSV, Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            {/* Sample file download */}
            <div className="flex items-center justify-between rounded-md border border-dashed p-3 bg-muted/40">
              <div className="text-sm">
                <p className="font-medium">Need a template?</p>
                <p className="text-muted-foreground">Download the sample file to see the required format.</p>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleDownloadSample}
                className="shrink-0 ml-4 gap-1.5"
              >
                <FileDown className="h-4 w-4" />
                Sample CSV
              </Button>
            </div>

            <div className="flex flex-col gap-2">
              <Label htmlFor="file-upload" className="text-sm font-medium">
                Select File
              </Label>
              {!selectedFile ? (
                <label
                  htmlFor="file-upload"
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
                    <p className="text-xs text-muted-foreground">
                      {(selectedFile.size / 1024).toFixed(1)} KB
                    </p>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    disabled={isImporting}
                  >
                    Change
                  </Button>
                </div>
              )}
              <input id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
                className="hidden"/>
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
            <Button variant="outline" 
              onClick={() => { setIsImportDialogOpen(false); setSelectedFile(null); }}
              disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} 
              disabled={!selectedFile || isImporting}>
              {isImporting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Importing...
                </>
              ) : (
                'Import'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
