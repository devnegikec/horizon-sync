import { useState } from 'react';

import { Plus, Download, Upload, ChevronDown, Loader2 } from 'lucide-react';

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

export function ItemManagementHeader({ onCreateItem }: ItemManagementHeaderProps) {
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
      await bulkImportApi.upload(accessToken, selectedFile);
      
      toast({
        title: 'Success',
        description: `File "${selectedFile.name}" imported successfully`,
      });
      
      setIsImportDialogOpen(false);
      setSelectedFile(null);
    } catch (error) {
      console.error('Import error:', error);
      toast({
        title: 'Import Failed',
        description: error instanceof Error ? error.message : 'Failed to import file',
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
      <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Items</DialogTitle>
            <DialogDescription>
              Upload a file to import items into your inventory. Supported formats: CSV, Excel.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="flex flex-col gap-2">
              <label htmlFor="file-upload" className="text-sm font-medium">
                Select File
              </label>
              <input id="file-upload"
                type="file"
                accept=".csv,.xlsx,.xls"
                onChange={handleFileChange}
                disabled={isImporting}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"/>
              {selectedFile && (
                <p className="text-sm text-muted-foreground">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" 
              onClick={() => setIsImportDialogOpen(false)}
              disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} 
              disabled={!selectedFile || isImporting}>
              {isImporting ? 'Importing...' : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
