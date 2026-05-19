import { useState } from 'react';

import { Plus, Download, Upload, ChevronDown, Loader2, FileDown } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
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
import { Label } from '@horizon-sync/ui/components/ui/label';
import { useToast } from '@horizon-sync/ui/hooks';

import { apiRequest } from '../../utility/api/core';

interface ItemGroupManagementHeaderProps {
  onCreateGroup: () => void;
  onImportSuccess?: () => void;
  itemGroups?: Array<{
    id: string;
    name: string;
    code: string;
    description?: string | null;
    default_valuation_method?: string | null;
    default_uom?: string | null;
    is_active?: boolean;
  }>;
}

export function ItemGroupManagementHeader({ onCreateGroup, onImportSuccess, itemGroups = [] }: ItemGroupManagementHeaderProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();

  // Import state
  const [isImportDialogOpen, setIsImportDialogOpen] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isImporting, setIsImporting] = useState(false);

  const handleDownloadSample = () => {
    const csvContent = [
      'name,code,description,default_valuation_method,default_uom,is_active',
      'Electronics,ELEC,Electronic devices and accessories,fifo,Unit,true',
      'Furniture,FURN,Office and home furniture,moving_average,Piece,true',
      'Stationery,STAT,Office stationery and supplies,fifo,Piece,true',
      'Services,SERV,Service-based items,standard,Nos,true',
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'item-groups-import-sample.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExport = () => {
    if (itemGroups.length === 0) {
      toast({ title: 'No Data', description: 'No item groups to export', variant: 'destructive' });
      return;
    }

    const headers = ['name', 'code', 'description', 'default_valuation_method', 'default_uom', 'is_active'];
    const rows = itemGroups.map((g) =>
      [
        g.name ?? '',
        g.code ?? '',
        g.description ?? '',
        g.default_valuation_method ?? '',
        g.default_uom ?? '',
        g.is_active !== undefined ? String(g.is_active) : 'true',
      ]
        .map((cell) => `"${cell.replace(/"/g, '""')}"`)
        .join(',')
    );
    const csvContent = [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'item-groups-export.csv';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({ title: 'Success', description: 'Item groups exported successfully' });
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

      const result = await apiRequest<Record<string, unknown>>('/item-groups/import', accessToken, {
        method: 'POST',
        body: formData,
      });

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

      if (onImportSuccess) {
        setTimeout(() => onImportSuccess(), 1000);
      }
    } catch (error: unknown) {
      let errorMessage = 'Failed to import file. Please check the file format and try again.';
      if (error && typeof error === 'object') {
        const err = error as Record<string, unknown>;
        if (err.details && typeof err.details === 'object') {
          const details = err.details as Record<string, unknown>;
          errorMessage = String(details.detail || details.message || errorMessage);
        } else if (err.message) {
          errorMessage = String(err.message);
        }
      }
      toast({ title: 'Import Failed', description: errorMessage, variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  return (
    <>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Item Groups</h1>
          <p className="text-muted-foreground mt-1">Organize your inventory items into logical categories</p>
        </div>
        <div className="flex items-center gap-3">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="gap-2">
                Export/Import
                <ChevronDown className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={handleExport}>
                <Download className="h-4 w-4" />
                Export Item Groups
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}>
                <Upload className="h-4 w-4" />
                Import Item Groups
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button onClick={onCreateGroup} className="gap-2 text-primary-foreground shadow-lg">
            <Plus className="h-4 w-4" />
            New Group
          </Button>
        </div>
      </div>

      {/* Import Dialog */}
      <Dialog open={isImportDialogOpen} onOpenChange={(open) => {
        setIsImportDialogOpen(open);
        if (!open) setSelectedFile(null);
      }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Import Item Groups</DialogTitle>
            <DialogDescription>
              Upload a CSV file to import item groups. Existing groups (by name) will be updated.
            </DialogDescription>
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
              <Label htmlFor="ig-file-upload" className="text-sm font-medium">Select File</Label>
              {!selectedFile ? (
                <label
                  htmlFor="ig-file-upload"
                  className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                  <span className="text-sm font-medium text-primary">Click to select file</span>
                  <span className="text-xs text-muted-foreground mt-1">CSV (.csv)</span>
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
              <input id="ig-file-upload" type="file" accept=".csv" onChange={handleFileChange} disabled={isImporting} className="hidden" />
            </div>

            {isImporting && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg border">
                <Loader2 className="h-5 w-5 animate-spin text-primary shrink-0" />
                <div className="text-sm">
                  <p className="font-medium">Uploading and processing...</p>
                  <p className="text-muted-foreground">This may take a moment.</p>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIsImportDialogOpen(false); setSelectedFile(null); }} disabled={isImporting}>
              Cancel
            </Button>
            <Button onClick={handleImportSubmit} disabled={!selectedFile || isImporting}>
              {isImporting ? (<><Loader2 className="h-4 w-4 mr-2 animate-spin" />Importing...</>) : 'Import'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
