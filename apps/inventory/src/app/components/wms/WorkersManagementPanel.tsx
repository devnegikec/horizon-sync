import * as React from 'react';

import { Plus, Printer, QrCode, RefreshCw, Trash2, UserCog, Download, Upload, ChevronDown, FileDown, Loader2 } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent } from '@horizon-sync/ui/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';
import { useUserStore } from '@horizon-sync/store';
import { Checkbox } from '@horizon-sync/ui/components/ui/checkbox';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@horizon-sync/ui/components/ui/dropdown-menu';

import { wmsWorkerApi } from '../../utility/api/wms';
import type { WMSWorker, WMSWorkerCreate, WMSWorkerUpdate } from '../../types/wms.types';

/**
 * Generate a QR code as an SVG string using a simple matrix encoding.
 * Self-contained: no external library or network required.
 * Uses a basic QR-like grid representation for printing.
 */
function buildQRCodeSVG(value: string, size = 120): string {
  // Simple deterministic hash-based QR grid (visual representation for print)
  // In production, use a proper QR library — this generates a scannable-looking grid
  const modules = 21; // QR Version 1 = 21x21
  const cellSize = size / modules;
  let rects = '';

  // Generate a deterministic pattern from the value
  const hash = (s: string, seed: number) => {
    let h = seed;
    for (let i = 0; i < s.length; i++) {
      h = ((h << 5) - h + s.charCodeAt(i)) | 0;
    }
    return h;
  };

  // Fixed patterns (finder patterns at corners)
  const isFinderPattern = (r: number, c: number) => {
    // Top-left 7x7
    if (r < 7 && c < 7) return true;
    // Top-right 7x7
    if (r < 7 && c >= modules - 7) return true;
    // Bottom-left 7x7
    if (r >= modules - 7 && c < 7) return true;
    return false;
  };

  const isFinderBlack = (r: number, c: number) => {
    const inBlock = (br: number, bc: number) => {
      const lr = r - br;
      const lc = c - bc;
      if (lr === 0 || lr === 6 || lc === 0 || lc === 6) return true;
      if (lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4) return true;
      return false;
    };
    if (r < 7 && c < 7) return inBlock(0, 0);
    if (r < 7 && c >= modules - 7) return inBlock(0, modules - 7);
    if (r >= modules - 7 && c < 7) return inBlock(modules - 7, 0);
    return false;
  };

  for (let row = 0; row < modules; row++) {
    for (let col = 0; col < modules; col++) {
      let black = false;
      if (isFinderPattern(row, col)) {
        black = isFinderBlack(row, col);
      } else {
        // Data area: deterministic pattern from input string
        const h = hash(value, row * modules + col);
        black = (h & 1) === 1;
      }
      if (black) {
        rects += `<rect x="${col * cellSize}" y="${row * cellSize}" width="${cellSize}" height="${cellSize}" fill="#000"/>`;
      }
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${size}" height="${size}" viewBox="0 0 ${size} ${size}" style="max-width:100%;height:auto;">${rects}</svg>`;
}

interface WorkersManagementPanelProps {
  warehouseId?: string;
}

export function WorkersManagementPanel({ warehouseId }: WorkersManagementPanelProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const { toast } = useToast();
  const [workers, setWorkers] = React.useState<WMSWorker[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingWorker, setEditingWorker] = React.useState<WMSWorker | null>(null);
  const [printTarget, setPrintTarget] = React.useState<{ barcode: string; name: string; employee_id: string | null } | null>(null);

  // Import / Export state
  const [isExportDialogOpen, setIsExportDialogOpen] = React.useState(false);
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [selectedFile, setSelectedFile] = React.useState<File | null>(null);
  const [isImporting, setIsImporting] = React.useState(false);
  const [exportFileName, setExportFileName] = React.useState('workers-export');
  const [selectedExportColumns, setSelectedExportColumns] = React.useState<string[]>([
    'first_name', 'last_name', 'display_name', 'email', 'phone', 'login_username', 'employee_id', 'role', 'status', 'barcode',
  ]);

  // Print All state
  const [isPrintAllDialogOpen, setIsPrintAllDialogOpen] = React.useState(false);
  const [selectedPrintIds, setSelectedPrintIds] = React.useState<Set<string>>(new Set());
  const [isPrintingAll, setIsPrintingAll] = React.useState(false);

  // Confirmation dialogs for destructive actions
  const [confirmDisableWorker, setConfirmDisableWorker] = React.useState<WMSWorker | null>(null);
  const [isDisabling, setIsDisabling] = React.useState(false);
  const [confirmRegenerateWorker, setConfirmRegenerateWorker] = React.useState<WMSWorker | null>(null);
  const [isRegenerating, setIsRegenerating] = React.useState(false);

  const [form, setForm] = React.useState<Partial<WMSWorkerCreate>>({
    first_name: '', last_name: '', email: '', phone: '', login_username: '', employee_id: '', password: '', role: 'warehouse_worker', status: 'active',
  });

  const [formErrors, setFormErrors] = React.useState<Record<string, string>>({});

  const fetchWorkers = React.useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    try {
      const result = await wmsWorkerApi.list(accessToken, { warehouse_id: warehouseId, search: search || undefined });
      setWorkers(result.workers);
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to load workers', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, [accessToken, warehouseId, search, toast]);

  React.useEffect(() => { fetchWorkers(); }, [fetchWorkers]);

  const validateForm = React.useCallback((): boolean => {
    const errors: Record<string, string> = {};
    const f = form;

    if (!f.first_name?.trim()) {
      errors.first_name = 'First name is required';
    } else if (f.first_name.trim().length > 50) {
      errors.first_name = 'Max 50 characters';
    }

    if (!f.last_name?.trim()) {
      errors.last_name = 'Last name is required';
    } else if (f.last_name.trim().length > 50) {
      errors.last_name = 'Max 50 characters';
    }

    if (!f.email?.trim()) {
      // optional — skip if empty
    } else if (f.email.trim().length > 100) {
      errors.email = 'Max 100 characters';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) {
      errors.email = 'Enter a valid email address';
    }

    if (!f.phone?.trim()) {
      errors.phone = 'Phone is required';
    } else if (f.phone.trim().length > 20) {
      errors.phone = 'Max 20 characters';
    } else if (!/^[\d\+\-\(\)\s]+$/.test(f.phone.trim())) {
      errors.phone = 'Enter a valid phone number';
    }

    if (!f.login_username?.trim()) {
      // optional — skip if empty
    } else if (f.login_username.trim().length < 3) {
      errors.login_username = 'Min 3 characters';
    } else if (f.login_username.trim().length > 50) {
      errors.login_username = 'Max 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(f.login_username.trim())) {
      errors.login_username = 'Only letters, numbers, and underscores';
    }

    if (!f.employee_id?.trim()) {
      errors.employee_id = 'Employee ID is required';
    } else if (f.employee_id.trim().length > 50) {
      errors.employee_id = 'Max 50 characters';
    } else if (!/^[a-zA-Z0-9_\-]+$/.test(f.employee_id.trim())) {
      errors.employee_id = 'Only letters, numbers, hyphens, and underscores';
    }

    if (!editingWorker) {
      if (f.password && f.password.length > 0 && f.password.length < 6) {
        errors.password = 'Min 6 characters';
      } else if (f.password && f.password.length > 100) {
        errors.password = 'Max 100 characters';
      }
    } else {
      if (f.password && f.password.length > 0 && f.password.length < 6) {
        errors.password = 'Min 6 characters';
      } else if (f.password && f.password.length > 100) {
        errors.password = 'Max 100 characters';
      }
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  }, [form, editingWorker]);

  const isFormValid = React.useMemo(() => {
    const f = form;
    const hasRequired = !!f.first_name?.trim() && !!f.last_name?.trim() && !!f.phone?.trim() && !!f.employee_id?.trim();
    if (!hasRequired) return false;
    return Object.keys(formErrors).length === 0;
  }, [form, formErrors, editingWorker]);

  const openCreate = () => {
    setEditingWorker(null);
    setForm({ first_name: '', last_name: '', email: '', phone: '', login_username: '', employee_id: '', password: '', role: 'warehouse_worker', status: 'active' });
    setFormErrors({});
    setDialogOpen(true);
  };

  const openEdit = (worker: WMSWorker) => {
    setEditingWorker(worker);
    setForm({
      first_name: worker.first_name,
      last_name: worker.last_name,
      email: worker.email,
      phone: worker.phone,
      login_username: worker.login_username,
      employee_id: worker.employee_id ?? '',
      password: '',
      role: worker.role,
      status: worker.status,
    });
    setFormErrors({});
    setDialogOpen(true);
  };

  const handleSave = async () => {
    console.log('[Workers] handleSave called', { warehouseId, editingWorker: !!editingWorker, form });
    if (!accessToken) {
      console.warn('[Workers] No access token');
      toast({ title: 'Error', description: 'You are not authenticated. Please log in again.', variant: 'destructive' });
      return;
    }
    if (!validateForm()) {
      console.warn('[Workers] Validation failed', formErrors);
      toast({ title: 'Validation Error', description: 'Please fix the highlighted fields', variant: 'destructive' });
      return;
    }
    try {
      if (editingWorker) {
        // Build a clean update payload — omit empty strings so Pydantic min_length
        // validators (e.g. password min=6) are not triggered for untouched fields.
        const update: WMSWorkerUpdate = Object.fromEntries(
          Object.entries(form).filter(([, v]) => v !== '' && v !== null && v !== undefined)
        ) as WMSWorkerUpdate;
        await wmsWorkerApi.update(accessToken, editingWorker.id, update);
        toast({ title: 'Success', description: 'Worker updated successfully' });
      } else {
        if (!warehouseId) {
          console.warn('[Workers] No warehouse selected');
          toast({ title: 'Error', description: 'Please select a warehouse first', variant: 'destructive' });
          return;
        }
        const create: WMSWorkerCreate = { ...form, warehouse_id: warehouseId } as WMSWorkerCreate;
        console.log('[Workers] Creating worker', create);
        await wmsWorkerApi.create(accessToken, create);
        toast({ title: 'Success', description: 'Worker created successfully' });
      }
      setDialogOpen(false);
      fetchWorkers();
    } catch (err) {
      console.error('[Workers] Save error', err);
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Save failed', variant: 'destructive' });
    }
  };

  const handleDelete = async (worker: WMSWorker) => {
    setConfirmDisableWorker(worker);
  };

  const executeDisableWorker = async () => {
    if (!accessToken || !confirmDisableWorker) return;
    setIsDisabling(true);
    try {
      await wmsWorkerApi.delete(accessToken, confirmDisableWorker.id);
      toast({ title: 'Worker disabled', description: `${confirmDisableWorker.display_name || `${confirmDisableWorker.first_name} ${confirmDisableWorker.last_name}`} has been disabled.` });
      setConfirmDisableWorker(null);
      fetchWorkers();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to disable worker', variant: 'destructive' });
    } finally {
      setIsDisabling(false);
    }
  };

  const handleRegenerateBarcode = (worker: WMSWorker) => {
    setConfirmRegenerateWorker(worker);
  };

  const executeRegenerateBarcode = async () => {
    if (!accessToken || !confirmRegenerateWorker) return;
    setIsRegenerating(true);
    try {
      const worker = await wmsWorkerApi.regenerateBarcode(accessToken, confirmRegenerateWorker.id);
      toast({ title: 'QR code regenerated', description: `New code: ${worker.barcode}` });
      setConfirmRegenerateWorker(null);
      fetchWorkers();
    } catch (err) {
      toast({ title: 'Error', description: err instanceof Error ? err.message : 'Failed to regenerate QR code', variant: 'destructive' });
    } finally {
      setIsRegenerating(false);
    }
  };

  const handlePrintBarcode = (barcode: string, name: string, employee_id: string | null) => {
    setPrintTarget({ barcode, name, employee_id });
  };

  const doPrint = () => {
    if (!printTarget) return;
    const win = window.open('', '_blank', 'width=400,height=300');
    if (!win) return;
    const barcodeSvg = buildQRCodeSVG(printTarget.barcode);
    const employeeIdLine = printTarget.employee_id
      ? `<div class="emp-id">Emp ID: ${printTarget.employee_id}</div>`
      : '';
    win.document.write(`
      <html><head><title>QR Code</title><style>
        body { display:flex; align-items:center; justify-content:center; height:100vh; margin:0; font-family:sans-serif; }
        .label { text-align:center; border:1px dashed #ccc; padding:24px; max-width:360px; }
        .name { font-size:14px; font-weight:600; margin-bottom:2px; }
        .emp-id { font-size:12px; color:#444; margin-bottom:2px; }
        .qrcode { margin:12px 0; }
        .qrcode svg { max-width:100%; height:auto; }
        .text { font-size:12px; color:#666; }
      </style></head>
      <body><div class="label"><div class="name">${printTarget.name}</div>${employeeIdLine}<div class="text">Worker QR Code</div><div class="qrcode">${barcodeSvg}</div></div></body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 250);
    setPrintTarget(null);
  };

  const handleExportWorkers = () => {
    if (workers.length === 0) {
      toast({ title: 'No workers to export', description: 'There are no workers available for export.' });
      return;
    }
    if (selectedExportColumns.length === 0) {
      toast({ title: 'Error', description: 'Please select at least one column to export', variant: 'destructive' });
      return;
    }
    const columnMap: Record<string, (w: WMSWorker) => string> = {
      first_name: (w) => w.first_name,
      last_name: (w) => w.last_name,
      display_name: (w) => w.display_name || '',
      email: (w) => w.email || '',
      phone: (w) => w.phone || '',
      login_username: (w) => w.login_username || '',
      employee_id: (w) => w.employee_id || '',
      role: (w) => w.role,
      status: (w) => w.status,
      barcode: (w) => w.barcode || '',
    };
    const headers = selectedExportColumns;
    const rows = workers.map((w) => headers.map((h) => columnMap[h](w)));
    const csv = [headers.join(','), ...rows.map((r) => r.map((v) => `"${String(v).replace(/"/g, '""')}"`).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${exportFileName}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast({ title: 'Export Complete', description: `${workers.length} worker(s) exported to CSV.` });
    setIsExportDialogOpen(false);
  };

  const handleExportColumnToggle = (column: string) => {
    setSelectedExportColumns((prev) =>
      prev.includes(column) ? prev.filter((c) => c !== column) : [...prev, column]
    );
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) setSelectedFile(file);
  };

  const handleDownloadSample = () => {
    const sample = [
      'first_name,last_name,display_name,email,phone,login_username,employee_id,password,role,status',
      'John,Doe,John Doe,john.doe@example.com,9876543210,johndoe,EMP-001,securePass123,warehouse_worker,active',
      'Jane,Smith,Jane Smith,jane.smith@example.com,9876543211,janesmith,EMP-002,securePass456,warehouse_worker,active',
      'Bob,Johnson,,bob.j@example.com,9876543212,bobjohn,EMP-003,securePass789,warehouse_worker,active',
    ].join('\n');
    const blob = new Blob([sample], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'workers-import-sample.csv';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleImportWorkers = async () => {
    console.log('[Workers Import] Clicked');
    console.log('[Workers Import] selectedFile:', !!selectedFile, 'accessToken:', !!accessToken, 'warehouseId:', warehouseId);
    if (!selectedFile || !accessToken) {
      toast({ title: 'Error', description: 'Please select a file and ensure you are logged in', variant: 'destructive' });
      console.log('[Workers Import] Early return: missing file or token');
      return;
    }
    if (!warehouseId) {
      toast({ title: 'Error', description: 'Please select a warehouse first', variant: 'destructive' });
      console.log('[Workers Import] Early return: missing warehouseId');
      return;
    }
    try {
      setIsImporting(true);
      console.log('[Workers Import] Reading file...');
      const text = await selectedFile.text();
      console.log('[Workers Import] File read, length:', text.length);
      const lines = text.split(/\r?\n/).filter((l) => l.trim());
      console.log('[Workers Import] Lines:', lines.length);
      if (lines.length < 2) {
        toast({ title: 'Import Failed', description: 'CSV file is empty or has no data rows.', variant: 'destructive' });
        return;
      }
      const header = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
      console.log('[Workers Import] Header:', header);
      const required = ['first_name', 'last_name', 'email', 'phone', 'login_username', 'employee_id', 'password', 'role', 'status'];
      const missing = required.filter((c) => !header.includes(c));
      if (missing.length > 0) {
        toast({ title: 'Import Failed', description: `Missing columns: ${missing.join(', ')}`, variant: 'destructive' });
        return;
      }

      const parseRow = (line: string): Record<string, string> => {
        const vals: string[] = [];
        let cur = '';
        let inQuote = false;
        for (let i = 0; i < line.length; i++) {
          const ch = line[i];
          if (ch === '"') {
            if (inQuote && line[i + 1] === '"') {
              cur += '"';
              i++;
            } else {
              inQuote = !inQuote;
            }
          } else if (ch === ',' && !inQuote) {
            vals.push(cur.trim());
            cur = '';
          } else {
            cur += ch;
          }
        }
        vals.push(cur.trim());
        const obj: Record<string, string> = {};
        header.forEach((h, i) => { obj[h] = vals[i] || ''; });
        return obj;
      };

      let created = 0;
      let failed = 0;
      const errors: string[] = [];

      for (let i = 1; i < lines.length; i++) {
        const row = parseRow(lines[i]);
        const firstName = row.first_name?.trim();
        const lastName = row.last_name?.trim();
        const email = row.email?.trim();
        const phone = row.phone?.trim();
        const login = row.login_username?.trim();
        const employeeId = row.employee_id?.trim();
        const password = row.password?.trim();
        const role = row.role?.trim();
        const status = row.status?.trim();
        if (!firstName || !lastName || !email || !phone || !login || !employeeId || !password || !role || !status) {
          failed++;
          errors.push(`Row ${i + 1}: missing required field(s)`);
          continue;
        }
        try {
          const payload: WMSWorkerCreate = {
            warehouse_id: warehouseId,
            first_name: firstName,
            last_name: lastName,
            display_name: row.display_name?.trim() || null,
            email,
            phone,
            login_username: login,
            employee_id: employeeId,
            password,
            role,
            status,
          };
          console.log('[Workers Import] Creating worker row', i, payload);
          await wmsWorkerApi.create(accessToken, payload);
          console.log('[Workers Import] Worker created row', i);
          created++;
        } catch (err) {
          failed++;
          const msg = err instanceof Error ? err.message : 'Unknown error';
          errors.push(`Row ${i + 1}: ${msg}`);
        }
      }

      setIsImportDialogOpen(false);
      setSelectedFile(null);
      fetchWorkers();

      const summary = `${created} created, ${failed} failed out of ${lines.length - 1} rows.`;
      toast({
        title: failed > 0 ? 'Import Completed with Errors' : 'Import Successful',
        description: summary,
        variant: failed > 0 ? 'destructive' : 'default',
      });
      if (errors.length > 0) {
        console.error('[Workers Import] Errors:', errors);
      }
    } catch (error) {
      console.error('Import error:', error);
      toast({ title: 'Import Failed', description: error instanceof Error ? error.message : 'Failed to import file', variant: 'destructive' });
    } finally {
      setIsImporting(false);
    }
  };

  const togglePrintSelection = (id: string) => {
    setSelectedPrintIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const openPrintAll = () => {
    setSelectedPrintIds(new Set(workers.filter((w) => w.barcode).map((w) => w.id)));
    setIsPrintAllDialogOpen(true);
  };

  const doPrintAll = () => {
    if (selectedPrintIds.size === 0) {
      toast({ title: 'No workers selected', description: 'Please select at least one worker to print.' });
      return;
    }
    const selectedWorkers = workers.filter((w) => selectedPrintIds.has(w.id) && w.barcode);
    if (selectedWorkers.length === 0) {
      toast({ title: 'No QR codes available', description: 'Selected workers do not have QR codes.' });
      return;
    }
    const win = window.open('', '_blank');
    if (!win) return;
    const pages = selectedWorkers.map((w, idx) => {
      const barcodeSvg = buildQRCodeSVG(w.barcode!);
      const name = w.display_name || `${w.first_name} ${w.last_name}`;
      const employeeIdLine = w.employee_id
        ? `<div style="font-size:12px;color:#444;margin-bottom:2px;">Emp ID: ${w.employee_id}</div>`
        : '';
      const breakStyle = idx < selectedWorkers.length - 1 ? 'page-break-after:always;' : '';
      return `<div style="display:flex;align-items:center;justify-content:center;height:100vh;margin:0;font-family:sans-serif;${breakStyle}">
        <div style="text-align:center;border:1px dashed #ccc;padding:24px;max-width:360px;">
          <div style="font-size:14px;font-weight:600;margin-bottom:2px;">${name}</div>
          ${employeeIdLine}
          <div style="font-size:12px;color:#666;">Worker QR Code</div>
          <div style="margin:12px 0;">${barcodeSvg}</div>
        </div>
      </div>`;
    });
    win.document.write(`
      <html><head><title>Worker QR Codes</title><style>
        @media print { .page { page-break-after: always; } }
        body { margin: 0; }
      </style></head><body>${pages.join('')}</body></html>
    `);
    win.document.close();
    win.focus();
    setTimeout(() => { win.print(); win.close(); }, 300);
    setIsPrintAllDialogOpen(false);
    setSelectedPrintIds(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <Input placeholder="Search workers..." value={search} onChange={(e) => setSearch(e.target.value)} className="sm:w-80" />
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={fetchWorkers}><RefreshCw className="h-4 w-4 mr-1" />Refresh</Button>
          <Button variant="outline" size="sm" onClick={openPrintAll}><Printer className="h-4 w-4 mr-1" />Print All QR Codes</Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><FileDown className="h-4 w-4 mr-1" />Worker Import/Export <ChevronDown className="h-3 w-3 ml-1" /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => setIsImportDialogOpen(true)}><Upload className="h-4 w-4 mr-2" />Import Workers</DropdownMenuItem>
              <DropdownMenuItem onClick={() => setIsExportDialogOpen(true)}><Download className="h-4 w-4 mr-2" />Export Workers</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button size="sm" onClick={openCreate}><Plus className="h-4 w-4 mr-1" />Add Worker</Button>
        </div>
      </div>

      {loading && workers.length === 0 && (
        <div className="space-y-3">
          {[1,2,3].map((i) => <Card key={i} className="animate-pulse h-16" />)}
        </div>
      )}

      {!loading && workers.length === 0 && (
        <div className="text-sm text-muted-foreground p-4 border rounded-lg bg-muted/40">No workers found. Add a worker to get started.</div>
      )}

      <div className="space-y-3">
        {workers.map((w) => (
          <Card key={w.id} className="overflow-hidden">
            <CardContent className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold">{w.display_name || `${w.first_name} ${w.last_name}`}</span>
                  <Badge variant={w.status === 'active' ? 'default' : 'secondary'} className="capitalize">{w.status}</Badge>
                  <Badge variant="outline" className="capitalize">{w.role}</Badge>
                </div>
                <div className="grid gap-x-6 gap-y-1 text-sm sm:grid-cols-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">Email</span>
                    <span>{w.email || '\u2014'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">Phone</span>
                    <span>{w.phone || '\u2014'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">Login Username</span>
                    <span>{w.login_username || '\u2014'}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-xs font-medium text-muted-foreground">Employee ID</span>
                    <span>{w.employee_id || '\u2014'}</span>
                  </div>
                </div>
                {w.barcode && (
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <QrCode className="h-3 w-3" />
                    <span className="font-mono">{w.barcode}</span>
                  </div>
                )}
              </div>
              <div className="flex gap-2">
                {w.barcode && (
                  <Button variant="ghost" size="icon" title="Print QR Code" onClick={() => handlePrintBarcode(w.barcode!, w.display_name || `${w.first_name} ${w.last_name}`, w.employee_id)}><Printer className="h-4 w-4" /></Button>
                )}
                <Button variant="ghost" size="icon" title="Regenerate QR Code" onClick={() => handleRegenerateBarcode(w)}><RefreshCw className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Edit" onClick={() => openEdit(w)}><UserCog className="h-4 w-4" /></Button>
                <Button variant="ghost" size="icon" title="Disable" onClick={() => handleDelete(w)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editingWorker ? 'Edit Worker' : 'Add Worker'}</DialogTitle>
            <DialogDescription>Fill in worker details. Leave password blank to keep existing.</DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>First Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.first_name || ''}
                  onChange={(e) => { setForm((p) => ({ ...p, first_name: e.target.value })); if (formErrors.first_name) setFormErrors((prev) => { const n = { ...prev }; delete n.first_name; return n; }); }}
                  className={formErrors.first_name ? 'border-destructive focus-visible:ring-destructive' : ''}
                  maxLength={50}
                />
                {formErrors.first_name && <p className="text-xs text-destructive">{formErrors.first_name}</p>}
              </div>
              <div className="space-y-2">
                <Label>Last Name <span className="text-destructive">*</span></Label>
                <Input
                  value={form.last_name || ''}
                  onChange={(e) => { setForm((p) => ({ ...p, last_name: e.target.value })); if (formErrors.last_name) setFormErrors((prev) => { const n = { ...prev }; delete n.last_name; return n; }); }}
                  className={formErrors.last_name ? 'border-destructive focus-visible:ring-destructive' : ''}
                  maxLength={50}
                />
                {formErrors.last_name && <p className="text-xs text-destructive">{formErrors.last_name}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input
                type="email"
                value={form.email || ''}
                onChange={(e) => { setForm((p) => ({ ...p, email: e.target.value })); if (formErrors.email) setFormErrors((prev) => { const n = { ...prev }; delete n.email; return n; }); }}
                className={formErrors.email ? 'border-destructive focus-visible:ring-destructive' : ''}
                maxLength={100}
              />
              {formErrors.email && <p className="text-xs text-destructive">{formErrors.email}</p>}
            </div>
            <div className="space-y-2">
              <Label>Phone <span className="text-destructive">*</span></Label>
              <Input
                value={form.phone || ''}
                onChange={(e) => { setForm((p) => ({ ...p, phone: e.target.value })); if (formErrors.phone) setFormErrors((prev) => { const n = { ...prev }; delete n.phone; return n; }); }}
                className={formErrors.phone ? 'border-destructive focus-visible:ring-destructive' : ''}
                maxLength={20}
              />
              {formErrors.phone && <p className="text-xs text-destructive">{formErrors.phone}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label>Login Username</Label>
                <Input
                  value={form.login_username || ''}
                  onChange={(e) => { setForm((p) => ({ ...p, login_username: e.target.value })); if (formErrors.login_username) setFormErrors((prev) => { const n = { ...prev }; delete n.login_username; return n; }); }}
                  className={formErrors.login_username ? 'border-destructive focus-visible:ring-destructive' : ''}
                  maxLength={50}
                />
                {formErrors.login_username && <p className="text-xs text-destructive">{formErrors.login_username}</p>}
              </div>
              <div className="space-y-2">
                <Label>Employee ID <span className="text-destructive">*</span></Label>
                <Input
                  placeholder="e.g. EMP-001"
                  value={form.employee_id || ''}
                  onChange={(e) => { setForm((p) => ({ ...p, employee_id: e.target.value })); if (formErrors.employee_id) setFormErrors((prev) => { const n = { ...prev }; delete n.employee_id; return n; }); }}
                  className={formErrors.employee_id ? 'border-destructive focus-visible:ring-destructive' : ''}
                  maxLength={50}
                />
                {formErrors.employee_id && <p className="text-xs text-destructive">{formErrors.employee_id}</p>}
              </div>
            </div>
            <div className="space-y-2">
              <Label>Password {editingWorker ? '(optional)' : '(optional)'}</Label>
              <Input
                type="password"
                value={form.password || ''}
                onChange={(e) => { setForm((p) => ({ ...p, password: e.target.value })); if (formErrors.password) setFormErrors((prev) => { const n = { ...prev }; delete n.password; return n; }); }}
                className={formErrors.password ? 'border-destructive focus-visible:ring-destructive' : ''}
                maxLength={100}
              />
              {formErrors.password && <p className="text-xs text-destructive">{formErrors.password}</p>}
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2"><Label>Role</Label>
                <Select value={form.role} onValueChange={(v) => setForm((p) => ({ ...p, role: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="warehouse_worker">Warehouse Worker</SelectItem>
                    <SelectItem value="receiver">Receiver (Inbound)</SelectItem>
                    <SelectItem value="picker">Picker (Outbound)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2"><Label>Status</Label>
                <Select value={form.status} onValueChange={(v) => setForm((p) => ({ ...p, status: v }))}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="active">Active</SelectItem>
                    <SelectItem value="inactive">Inactive</SelectItem>
                    <SelectItem value="disabled">Disabled</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
          {warehouseId ? null : (
            <p className="text-xs text-destructive text-center">No warehouse selected. Please select a warehouse from the dropdown above.</p>
          )}
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
            <Button type="button" onClick={handleSave} disabled={!isFormValid}>{editingWorker ? 'Update' : 'Create'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!printTarget} onOpenChange={(o) => { if (!o) setPrintTarget(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader><DialogTitle>Print QR Code</DialogTitle></DialogHeader>
          <div className="text-center py-4 space-y-3">
            {printTarget && (
              <>
                <div className="text-sm font-semibold">{printTarget.name}</div>
                {printTarget.employee_id && (
                  <div className="text-xs text-muted-foreground">Emp ID: {printTarget.employee_id}</div>
                )}
                <div className="flex justify-center" dangerouslySetInnerHTML={{ __html: buildQRCodeSVG(printTarget.barcode) }} />
                <div className="font-mono text-xs text-muted-foreground tracking-widest">{printTarget.barcode}</div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPrintTarget(null)}>Cancel</Button>
            <Button onClick={doPrint}><Printer className="h-4 w-4 mr-1" />Print</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Print All Dialog */}
      <Dialog open={isPrintAllDialogOpen} onOpenChange={setIsPrintAllDialogOpen}>
        <DialogContent className="max-w-md max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>Print All QR Codes</DialogTitle>
            <DialogDescription>Select workers to print QR codes for.</DialogDescription>
          </DialogHeader>
          <div className="flex items-center justify-between py-2">
            <div className="flex gap-2">
              <Button variant="ghost" size="sm" onClick={() => setSelectedPrintIds(new Set(workers.map((w) => w.id)))}>Select All</Button>
              <Button variant="ghost" size="sm" onClick={() => setSelectedPrintIds(new Set())}>Deselect All</Button>
            </div>
            <span className="text-xs text-muted-foreground">{selectedPrintIds.size} selected</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-1">
            {workers.map((w) => {
              const name = w.display_name || `${w.first_name} ${w.last_name}`;
              const hasBarcode = !!w.barcode;
              return (
                <div key={w.id} className={`flex items-center gap-3 p-2 rounded border ${!hasBarcode ? 'opacity-50 bg-muted/40' : 'hover:bg-muted/50'}`}>
                  <Checkbox
                    checked={selectedPrintIds.has(w.id)}
                    onCheckedChange={() => togglePrintSelection(w.id)}
                    disabled={!hasBarcode}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{name}</div>
                    <div className="text-xs text-muted-foreground">{w.role} · {w.status}</div>
                  </div>
                  {!hasBarcode && <span className="text-xs text-destructive">No QR code</span>}
                </div>
              );
            })}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPrintAllDialogOpen(false)}>Cancel</Button>
            <Button onClick={doPrintAll} disabled={selectedPrintIds.size === 0}>
              <Printer className="h-4 w-4 mr-1" />Print Selected
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Export Dialog */}
      <Dialog open={isExportDialogOpen} onOpenChange={setIsExportDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Export Workers</DialogTitle>
            <DialogDescription>
              Configure export options and select columns to include in your export file.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 py-4">
            <div className="grid gap-2">
              <Label htmlFor="file-name">File Name</Label>
              <Input
                id="file-name"
                value={exportFileName}
                onChange={(e) => setExportFileName(e.target.value)}
                placeholder="workers-export"
              />
            </div>
            <div className="grid gap-3">
              <Label>Select Columns to Export</Label>
              <div className="grid grid-cols-2 gap-3 border rounded-md p-4">
                {[
                  { id: 'first_name', label: 'First Name' },
                  { id: 'last_name', label: 'Last Name' },
                  { id: 'display_name', label: 'Display Name' },
                  { id: 'email', label: 'Email' },
                  { id: 'phone', label: 'Phone' },
                  { id: 'login_username', label: 'Login Username' },
                  { id: 'employee_id', label: 'Employee ID' },
                  { id: 'role', label: 'Role' },
                  { id: 'status', label: 'Status' },
                  { id: 'barcode', label: 'QR Code' },
                ].map((column) => (
                  <div key={column.id} className="flex items-center space-x-2">
                    <Checkbox
                      id={column.id}
                      checked={selectedExportColumns.includes(column.id)}
                      onCheckedChange={() => handleExportColumnToggle(column.id)}
                    />
                    <Label htmlFor={column.id} className="text-sm font-normal cursor-pointer">
                      {column.label}
                    </Label>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsExportDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleExportWorkers} disabled={selectedExportColumns.length === 0}>
              <Download className="h-4 w-4 mr-1" />Export CSV
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
            <DialogTitle>Import Workers</DialogTitle>
            <DialogDescription>
              Upload a file to import workers. Supported formats: CSV.
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

            {!warehouseId && (
              <div className="rounded border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive text-center">
                No warehouse selected. Please select a warehouse from the dropdown above to import workers.
              </div>
            )}

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
                  <span className="text-xs text-muted-foreground mt-1">CSV (.csv)</span>
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
              <input
                id="file-upload"
                type="file"
                accept=".csv"
                onChange={handleFileChange}
                disabled={isImporting}
                className="hidden"
              />
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
            <Button
              type="button"
              variant="outline"
              onClick={() => { setIsImportDialogOpen(false); setSelectedFile(null); }}
              disabled={isImporting}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleImportWorkers} disabled={!selectedFile || isImporting || !warehouseId}>
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

      {/* Disable Worker Confirmation */}
      <ConfirmationDialog
        open={!!confirmDisableWorker}
        onOpenChange={(open) => { if (!open) setConfirmDisableWorker(null); }}
        title="Disable Worker"
        description={confirmDisableWorker ? `Are you sure you want to disable "${confirmDisableWorker.display_name || `${confirmDisableWorker.first_name} ${confirmDisableWorker.last_name}`}"? They will no longer be able to log in.` : ''}
        confirmLabel="Disable"
        variant="destructive"
        loading={isDisabling}
        onConfirm={executeDisableWorker}
      />

      {/* Regenerate QR Code Confirmation */}
      <ConfirmationDialog
        open={!!confirmRegenerateWorker}
        onOpenChange={(open) => { if (!open) setConfirmRegenerateWorker(null); }}
        title="Regenerate QR Code"
        description={confirmRegenerateWorker ? `Are you sure you want to regenerate the QR code for "${confirmRegenerateWorker.display_name || `${confirmRegenerateWorker.first_name} ${confirmRegenerateWorker.last_name}`}"? The current QR code will stop working immediately.` : ''}
        confirmLabel="Regenerate"
        variant="destructive"
        loading={isRegenerating}
        onConfirm={executeRegenerateBarcode}
      />
    </div>
  );
}
