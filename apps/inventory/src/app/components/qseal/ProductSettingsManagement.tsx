import * as React from 'react';

import { Settings, Plus, RefreshCw, Pencil, Trash2, X, Check, KeyRound, Globe } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import { useQRProductSettings } from '../../hooks/useQRProductSettings';
import type { SettingType, QRProductSetting } from '../../types/qr-product-settings.types';

import { BrandManagement } from './BrandManagement';
import { LandingPageTab } from './LandingPageTab';

/* ------------------------------------------------------------------ */
/*  Tab metadata                                                       */
/* ------------------------------------------------------------------ */

interface TabMeta {
  key: SettingType;
  label: string;
  valuePlaceholder: string;
  labelPlaceholder: string;
}

const SETTING_TABS: TabMeta[] = [
  { key: 'serial_prefix', label: 'Serial Prefixes', valuePlaceholder: 'e.g. PH', labelPlaceholder: 'e.g. Pharma (PH)' },
  { key: 'channel', label: 'Channels', valuePlaceholder: 'e.g. retail', labelPlaceholder: 'e.g. Retail' },
  { key: 'destination', label: 'Destinations', valuePlaceholder: 'e.g. IN', labelPlaceholder: 'e.g. India' },
  { key: 'shelf_life', label: 'Shelf Life', valuePlaceholder: 'e.g. 12', labelPlaceholder: 'e.g. 12 Months' },
];

/* ------------------------------------------------------------------ */
/*  Inline form row                                                    */
/* ------------------------------------------------------------------ */

interface SettingFormData {
  value: string;
  label: string;
  description: string;
  sort_order: number;
}

interface SettingFormRowProps {
  valuePlaceholder: string;
  labelPlaceholder: string;
  initial?: SettingFormData;
  saving: boolean;
  onSave: (data: SettingFormData) => void;
  onCancel: () => void;
}

function SettingFormRow({ valuePlaceholder, labelPlaceholder, initial, saving, onSave, onCancel }: SettingFormRowProps) {
  const [value, setValue] = React.useState(initial?.value ?? '');
  const [label, setLabel] = React.useState(initial?.label ?? '');
  const [description, setDescription] = React.useState(initial?.description ?? '');
  const [sortOrder, setSortOrder] = React.useState(initial?.sort_order ?? 0);
  const isValid = value.trim().length > 0 && label.trim().length > 0;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({ value: value.trim(), label: label.trim(), description: description.trim(), sort_order: sortOrder });
  };

  return (
    <TableRow>
      <TableCell>
        <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={valuePlaceholder} maxLength={100} className="h-8 text-sm" disabled={!!initial} />
      </TableCell>
      <TableCell>
        <Input value={label} onChange={(e) => setLabel(e.target.value)} placeholder={labelPlaceholder} maxLength={150} className="h-8 text-sm" />
      </TableCell>
      <TableCell>
        <Input value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Optional" className="h-8 text-sm" />
      </TableCell>
      <TableCell>
        <Input type="number" value={sortOrder} onChange={(e) => setSortOrder(Number(e.target.value))} min={0} className="h-8 w-16 text-sm" />
      </TableCell>
      <TableCell />
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={handleSubmit} disabled={saving || !isValid}>
            <Check className="h-4 w-4 text-green-600" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onCancel} disabled={saving}>
            <X className="h-4 w-4 text-muted-foreground" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Setting row (read-only)                                            */
/* ------------------------------------------------------------------ */

function SettingRow({ setting, saving, onEdit, onDelete, onToggleActive }: {
  setting: QRProductSetting;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
}) {
  return (
    <TableRow>
      <TableCell className="font-mono text-sm">{setting.value}</TableCell>
      <TableCell>{setting.label}</TableCell>
      <TableCell className="text-muted-foreground text-sm">{setting.description || '—'}</TableCell>
      <TableCell>{setting.sort_order}</TableCell>
      <TableCell>
        <Badge variant={setting.is_active ? 'default' : 'secondary'} className="cursor-pointer select-none" onClick={onToggleActive}>
          {setting.is_active ? 'Active' : 'Inactive'}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive hover:text-destructive" onClick={onDelete} disabled={saving}>
            <Trash2 className="h-3.5 w-3.5" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  );
}

/* ------------------------------------------------------------------ */
/*  Single setting-type tab content                                    */
/* ------------------------------------------------------------------ */

function SettingTypeContent({ settingType, meta }: { settingType: SettingType; meta: TabMeta }) {
  const { settings, loading, error, saving, refetch, createSetting, updateSetting, deleteSetting } =
    useQRProductSettings(settingType);

  const [addingNew, setAddingNew] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDeleteSetting, setConfirmDeleteSetting] = React.useState<QRProductSetting | null>(null);

  const handleCreate = async (formData: SettingFormData) => {
    try {
      await createSetting({ setting_type: settingType, ...formData });
      setAddingNew(false);
    } catch {
      // error surfaced via hook state
    }
  };

  const handleUpdate = async (id: string, formData: SettingFormData) => {
    try {
      await updateSetting(id, formData);
      setEditingId(null);
    } catch {
      // error surfaced via hook state
    }
  };

  const handleDelete = (setting: QRProductSetting) => {
    setConfirmDeleteSetting(setting);
  };

  const executeDelete = async () => {
    if (!confirmDeleteSetting) return;
    try {
      await deleteSetting(confirmDeleteSetting.id);
    } catch {
      // error surfaced via hook state
    }
    setConfirmDeleteSetting(null);
  };

  const handleToggleActive = async (setting: QRProductSetting) => {
    try {
      await updateSetting(setting.id, { is_active: !setting.is_active });
    } catch {
      // error surfaced via hook state
    }
  };

  const renderRows = () => {
    if (loading && settings.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">Loading...</TableCell>
        </TableRow>
      );
    }
    if (settings.length === 0 && !addingNew) {
      return (
        <TableRow>
          <TableCell colSpan={6} className="h-24 text-center text-muted-foreground">
            {'No ' + meta.label.toLowerCase() + ' configured yet. Click "Add" to create one.'}
          </TableCell>
        </TableRow>
      );
    }
    return settings.map((setting) =>
      editingId === setting.id ? (
        <SettingFormRow key={setting.id} valuePlaceholder={meta.valuePlaceholder} labelPlaceholder={meta.labelPlaceholder} initial={{ value: setting.value, label: setting.label, description: setting.description ?? '', sort_order: setting.sort_order }} saving={saving} onSave={(d) => handleUpdate(setting.id, d)} onCancel={() => setEditingId(null)} />
      ) : (
        <SettingRow key={setting.id} setting={setting} saving={saving} onEdit={() => { setEditingId(setting.id); setAddingNew(false); }} onDelete={() => handleDelete(setting)} onToggleActive={() => handleToggleActive(setting)} />
      ),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <CardTitle className="text-base">{meta.label}</CardTitle>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => { setAddingNew(true); setEditingId(null); }} disabled={addingNew}>
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>
        )}
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">Value</TableHead>
                <TableHead className="w-[200px]">Label</TableHead>
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]">Order</TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addingNew && (
                <SettingFormRow valuePlaceholder={meta.valuePlaceholder} labelPlaceholder={meta.labelPlaceholder} saving={saving} onSave={handleCreate} onCancel={() => setAddingNew(false)} />
              )}
              {renderRows()}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog open={!!confirmDeleteSetting}
          onOpenChange={(open) => { if (!open) setConfirmDeleteSetting(null); }}
          title="Delete Setting"
          description={confirmDeleteSetting ? `Delete "${confirmDeleteSetting.label}"? This cannot be undone.` : ''}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={executeDelete}/>
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function ProductSettingsManagement() {
  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Product Settings
        </h2>
        <p className="text-muted-foreground">
          Configure allowed values for serial prefixes, channels, destinations, and shelf life. These appear as dropdown options during QR product and block creation.
        </p>
      </div>

      <Tabs defaultValue="serial_prefix" className="space-y-4">
        <TabsList>
          {SETTING_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>{tab.label}</TabsTrigger>
          ))}
          <TabsTrigger value="brands">
            <KeyRound className="h-3.5 w-3.5 mr-1.5" />
            Brands & Keys
          </TabsTrigger>
          <TabsTrigger value="landing-page">
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Landing Page
          </TabsTrigger>
        </TabsList>
        {SETTING_TABS.map((tab) => (
          <TabsContent key={tab.key} value={tab.key}>
            <SettingTypeContent settingType={tab.key} meta={tab} />
          </TabsContent>
        ))}
        <TabsContent value="brands">
          <BrandManagement />
        </TabsContent>
        <TabsContent value="landing-page">
          <LandingPageTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
