import * as React from 'react';

import { Check, Coins, Globe, GripVertical, KeyRound, Pencil, Plus, RefreshCw, Search, Settings, Trash2, X, Zap } from 'lucide-react';

import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { ConfirmationDialog } from '@horizon-sync/ui/components/ui/confirmation-dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@horizon-sync/ui/components/ui/table';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Switch } from '@horizon-sync/ui/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import { useQRProductSettings } from '../../hooks/useQRProductSettings';
import type { SettingType, QRProductSetting } from '../../types/qr-product-settings.types';

import { ActivationManagement } from './ActivationManagement';
import { BrandManagement } from './BrandManagement';
import { CurrencySelect } from '../common/CurrencySelect';
import { LandingPageTab } from './LandingPageTab';
import { QRCreditSummary } from './QRCreditSummary';

/* ------------------------------------------------------------------ */
/*  Tab metadata                                                       */
/* ------------------------------------------------------------------ */

interface TabMeta {
  key: SettingType;
  label: string;
  valueLabel: string;
  valuePlaceholder: string;
  labelPlaceholder: string;
}

const SETTING_TABS: TabMeta[] = [
  { key: 'serial_prefix', label: 'Serial Prefixes', valueLabel: 'Prefix', valuePlaceholder: 'e.g. PH', labelPlaceholder: 'e.g. Pharma (PH)' },
  { key: 'channel', label: 'Channels', valueLabel: 'Channel key', valuePlaceholder: 'e.g. retail', labelPlaceholder: 'e.g. Retail' },
  { key: 'destination', label: 'Destinations', valueLabel: 'Country/region code', valuePlaceholder: 'e.g. IN', labelPlaceholder: 'e.g. India' },
  { key: 'shelf_life', label: 'Shelf Life', valueLabel: 'Duration', valuePlaceholder: 'e.g. 12', labelPlaceholder: 'e.g. 12 Months' },
];

const DESTINATION_OPTIONS = [
  { code: 'IN', name: 'India' },
  { code: 'US', name: 'United States' },
  { code: 'GB', name: 'United Kingdom' },
  { code: 'DE', name: 'Germany' },
  { code: 'FR', name: 'France' },
  { code: 'IT', name: 'Italy' },
  { code: 'ES', name: 'Spain' },
  { code: 'NL', name: 'Netherlands' },
  { code: 'AU', name: 'Australia' },
  { code: 'CA', name: 'Canada' },
  { code: 'JP', name: 'Japan' },
  { code: 'CN', name: 'China' },
  { code: 'SG', name: 'Singapore' },
  { code: 'AE', name: 'United Arab Emirates' },
  { code: 'SA', name: 'Saudi Arabia' },
  { code: 'CH', name: 'Switzerland' },
  { code: 'BR', name: 'Brazil' },
  { code: 'MX', name: 'Mexico' },
  { code: 'ZA', name: 'South Africa' },
  { code: 'NG', name: 'Nigeria' },
  { code: 'KE', name: 'Kenya' },
  { code: 'MY', name: 'Malaysia' },
  { code: 'PK', name: 'Pakistan' },
  { code: 'BD', name: 'Bangladesh' },
  { code: 'NZ', name: 'New Zealand' },
  { code: 'HK', name: 'Hong Kong' },
  { code: 'KR', name: 'South Korea' },
  { code: 'SE', name: 'Sweden' },
  { code: 'NO', name: 'Norway' },
  { code: 'DK', name: 'Denmark' },
  { code: 'PL', name: 'Poland' },
  { code: 'TR', name: 'Turkey' },
  { code: 'EG', name: 'Egypt' },
  { code: 'TH', name: 'Thailand' },
  { code: 'ID', name: 'Indonesia' },
  { code: 'PH', name: 'Philippines' },
  { code: 'VN', name: 'Vietnam' },
  { code: 'AR', name: 'Argentina' },
  { code: 'CL', name: 'Chile' },
  { code: 'CO', name: 'Colombia' },
] as const;

const DESTINATION_CURRENCY_MAP: Record<string, string> = {
  IN: 'INR',
  US: 'USD',
  GB: 'GBP',
  EU: 'EUR',
  DE: 'EUR',
  FR: 'EUR',
  IT: 'EUR',
  ES: 'EUR',
  NL: 'EUR',
  AU: 'AUD',
  CA: 'CAD',
  JP: 'JPY',
  CN: 'CNY',
  SG: 'SGD',
  AE: 'AED',
  SA: 'SAR',
  CH: 'CHF',
  BR: 'BRL',
  MX: 'MXN',
  ZA: 'ZAR',
  NG: 'NGN',
  KE: 'KES',
  MY: 'MYR',
  PK: 'PKR',
  BD: 'BDT',
  NZ: 'NZD',
  HK: 'HKD',
  KR: 'KRW',
  SE: 'SEK',
  NO: 'NOK',
  DK: 'DKK',
  PL: 'PLN',
  TR: 'TRY',
  EG: 'EGP',
  TH: 'THB',
  ID: 'IDR',
  PH: 'PHP',
  VN: 'VND',
  AR: 'ARS',
  CL: 'CLP',
  CO: 'COP',
};
const CUSTOM_DESTINATION_CODE = '__custom__';

/* ------------------------------------------------------------------ */
/*  Inline form row                                                    */
/* ------------------------------------------------------------------ */

interface SettingFormData {
  value: string;
  label: string;
  description: string;
  sort_order: number;
  currency: string;
  shelf_life_unit: ShelfLifeUnit;
}

type ShelfLifeUnit = 'days' | 'months' | 'years';

const SHELF_LIFE_UNITS: Array<{ value: ShelfLifeUnit; label: string }> = [
  { value: 'days', label: 'Days' },
  { value: 'months', label: 'Months' },
  { value: 'years', label: 'Years' },
];

interface SettingFormRowProps {
  settingType: SettingType;
  existingSettings: QRProductSetting[];
  excludeSettingId?: string;
  duplicateMessage: string;
  valuePlaceholder: string;
  labelPlaceholder: string;
  showCurrency: boolean;
  initial?: SettingFormData;
  saving: boolean;
  onSave: (data: SettingFormData) => void;
  onCancel: () => void;
}

const EMPTY_SETTING_FORM: SettingFormData = {
  value: '',
  label: '',
  description: '',
  sort_order: 0,
  currency: '',
  shelf_life_unit: 'months',
};

function normalizeSettingValue(settingType: SettingType, value: string) {
  const normalized = value.trim();
  return settingType === 'serial_prefix' || settingType === 'destination' ? normalized.toUpperCase() : normalized;
}

function settingComparisonValue(settingType: SettingType, value: string) {
  return normalizeSettingValue(settingType, value).toLowerCase();
}

function getShelfLifeUnit(setting: QRProductSetting): ShelfLifeUnit {
  const unit = setting.extra_data?.shelf_life_unit;
  return unit === 'days' || unit === 'years' ? unit : 'months';
}

function formatShelfLifeLabel(value: string, unit: ShelfLifeUnit): string {
  const unitLabel = SHELF_LIFE_UNITS.find((option) => option.value === unit)?.label ?? 'Months';
  return `${value.trim()} ${unitLabel}`;
}

function SettingFormRow({
  settingType,
  existingSettings,
  excludeSettingId,
  duplicateMessage,
  valuePlaceholder,
  labelPlaceholder,
  showCurrency,
  initial,
  saving,
  onSave,
  onCancel,
}: SettingFormRowProps) {
  const initialData = initial ?? EMPTY_SETTING_FORM;
  const [value, setValue] = React.useState(initialData.value);
  const [label, setLabel] = React.useState(initialData.label);
  const [description, setDescription] = React.useState(initialData.description);
  const [sortOrder, setSortOrder] = React.useState(initialData.sort_order);
  const [currency, setCurrency] = React.useState(initialData.currency);
  const [shelfLifeUnit, setShelfLifeUnit] = React.useState<ShelfLifeUnit>(initialData.shelf_life_unit);
  const normalizedValue = normalizeSettingValue(settingType, value);
  const [customDestination, setCustomDestination] = React.useState(
    settingType === 'destination' && Boolean(initialData.value) && !DESTINATION_OPTIONS.some((option) => option.code === normalizedValue),
  );
  const automaticCurrency = settingType === 'destination' && !customDestination ? DESTINATION_CURRENCY_MAP[normalizedValue] : undefined;
  const duplicateValue =
    normalizedValue.length > 0 &&
    existingSettings.some(
      (setting) =>
        setting.id !== excludeSettingId && settingComparisonValue(settingType, setting.value) === settingComparisonValue(settingType, value),
    );
  const shelfLifeValid = settingType !== 'shelf_life' || /^[1-9]\d*$/.test(normalizedValue);
  const effectiveLabel = settingType === 'shelf_life' && shelfLifeValid ? formatShelfLifeLabel(normalizedValue, shelfLifeUnit) : label.trim();
  const isValid =
    normalizedValue.length > 0 && effectiveLabel.length > 0 && (!showCurrency || currency.length > 0) && shelfLifeValid && !duplicateValue;

  const handleSubmit = () => {
    if (!isValid) return;
    onSave({
      value: normalizedValue,
      label: effectiveLabel,
      description: description.trim(),
      sort_order: sortOrder,
      currency: automaticCurrency || currency,
      shelf_life_unit: shelfLifeUnit,
    });
  };

  return (
    <TableRow>
      <TableCell>
        {settingType === 'destination' ? (
          <>
            <Select
              value={customDestination ? CUSTOM_DESTINATION_CODE : normalizedValue}
              onValueChange={(next) => {
                if (next === CUSTOM_DESTINATION_CODE) {
                  setCustomDestination(true);
                  setValue('');
                  setCurrency('');
                  return;
                }
                setCustomDestination(false);
                setValue(next);
                if (DESTINATION_CURRENCY_MAP[next]) setCurrency(DESTINATION_CURRENCY_MAP[next]);
              }}
              disabled={!!initial}
            >
              <SelectTrigger className="h-8 text-sm" aria-label="Destination country or region">
                <SelectValue placeholder="Select destination" />
              </SelectTrigger>
              <SelectContent>
                {DESTINATION_OPTIONS.map((option) => (
                  <SelectItem key={option.code} value={option.code}>
                    {option.name} ({option.code})
                  </SelectItem>
                ))}
                <SelectItem value={CUSTOM_DESTINATION_CODE}>Custom region</SelectItem>
              </SelectContent>
            </Select>
            {customDestination && (
              <Input
                value={value}
                onChange={(event) => setValue(event.target.value.toUpperCase())}
                placeholder="e.g. MENA"
                maxLength={20}
                className="mt-2 h-8 text-sm"
                disabled={!!initial}
              />
            )}
          </>
        ) : (
          <Input
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={valuePlaceholder}
            maxLength={settingType === 'serial_prefix' ? 20 : 100}
            type={settingType === 'shelf_life' ? 'number' : 'text'}
            min={settingType === 'shelf_life' ? 1 : undefined}
            inputMode={settingType === 'shelf_life' ? 'numeric' : undefined}
            className="h-8 text-sm"
            aria-invalid={duplicateValue || undefined}
            disabled={!!initial}
          />
        )}
        {settingType === 'serial_prefix' && normalizedValue && (
          <p className="mt-1 text-xs text-muted-foreground">Preview: {normalizedValue}-000001</p>
        )}
        {settingType === 'destination' && (
          <p className="mt-1 text-xs text-muted-foreground">
            {automaticCurrency ? `Currency auto-selected: ${automaticCurrency}` : 'Choose a country or region.'}
          </p>
        )}
        {settingType === 'shelf_life' && (
          <Select value={shelfLifeUnit} onValueChange={(next) => setShelfLifeUnit(next as ShelfLifeUnit)} disabled={saving}>
            <SelectTrigger className="mt-2 h-8 text-sm" aria-label="Shelf life unit">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {SHELF_LIFE_UNITS.map((unit) => (
                <SelectItem key={unit.value} value={unit.value}>
                  {unit.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
        {settingType === 'shelf_life' && value && !shelfLifeValid && <p className="mt-1 text-xs text-destructive">Enter a positive whole number.</p>}
        {duplicateValue && <p className="mt-1 text-xs text-destructive">{duplicateMessage}</p>}
      </TableCell>
      <TableCell>
        <Input
          value={settingType === 'shelf_life' && shelfLifeValid ? effectiveLabel : label}
          onChange={(e) => setLabel(e.target.value)}
          placeholder={labelPlaceholder}
          maxLength={150}
          className="h-8 text-sm"
          disabled={settingType === 'shelf_life'}
        />
        {settingType === 'shelf_life' && <p className="mt-1 text-xs text-muted-foreground">Generated from duration and unit.</p>}
      </TableCell>
      {showCurrency && (
        <TableCell className="min-w-[190px]">
          <CurrencySelect value={automaticCurrency || currency} onValueChange={setCurrency} disabled={saving || Boolean(automaticCurrency)} />
        </TableCell>
      )}
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

function getSettingCurrency(setting: QRProductSetting): string {
  const value = setting.extra_data?.currency_code ?? setting.extra_data?.currency;
  return typeof value === 'string' ? value : '';
}

/* ------------------------------------------------------------------ */
/*  Setting row (read-only)                                            */
/* ------------------------------------------------------------------ */

function SettingRow({
  setting,
  saving,
  onEdit,
  onDelete,
  onToggleActive,
  showCurrency,
  canDrag,
  isDragging,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
}: {
  setting: QRProductSetting;
  saving: boolean;
  onEdit: () => void;
  onDelete: () => void;
  onToggleActive: () => void;
  showCurrency: boolean;
  canDrag: boolean;
  isDragging: boolean;
  onDragStart: () => void;
  onDragOver: (event: React.DragEvent<HTMLTableRowElement>) => void;
  onDrop: () => void;
  onDragEnd: () => void;
}) {
  return (
    <TableRow
      draggable={canDrag}
      onDragStart={canDrag ? onDragStart : undefined}
      onDragOver={canDrag ? onDragOver : undefined}
      onDrop={canDrag ? onDrop : undefined}
      onDragEnd={canDrag ? onDragEnd : undefined}
      className={isDragging ? 'opacity-50' : undefined}
    >
      <TableCell className="font-mono text-sm">
        <div className="flex items-center gap-2">
          {canDrag && <GripVertical className="h-4 w-4 shrink-0 cursor-grab text-muted-foreground" aria-label="Drag to reorder" />}
          <span>{setting.value}</span>
        </div>
      </TableCell>
      <TableCell>{setting.label}</TableCell>
      {showCurrency && <TableCell>{getSettingCurrency(setting) || '—'}</TableCell>}
      <TableCell className="text-muted-foreground text-sm">{setting.description || '—'}</TableCell>
      <TableCell>{setting.sort_order}</TableCell>
      <TableCell>
        <div className="flex items-center gap-2">
          <Switch
            checked={setting.is_active}
            onCheckedChange={onToggleActive}
            disabled={saving}
            aria-label={`${setting.label}: ${setting.is_active ? 'active' : 'inactive'}`}
          />
          <span className="text-xs text-muted-foreground">{setting.is_active ? 'Active' : 'Inactive'}</span>
        </div>
        <p className="mt-1 text-xs text-muted-foreground">
          {setting.usage_count
            ? `Used by ${setting.usage_count} product${setting.usage_count === 1 ? '' : 's'}/block${setting.usage_count === 1 ? '' : 's'}`
            : 'Not used yet'}
        </p>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex items-center justify-end gap-1">
          <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onEdit}>
            <Pencil className="h-3.5 w-3.5" />
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7 text-destructive hover:text-destructive"
            onClick={onDelete}
            disabled={saving || Boolean(setting.usage_count)}
            title={setting.usage_count ? 'Deactivate this setting before deleting it.' : 'Delete setting'}
          >
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
  const { settings, loading, error, saving, refetch, createSetting, updateSetting, deleteSetting } = useQRProductSettings(settingType);
  const showCurrency = settingType === 'destination';

  const [addingNew, setAddingNew] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [confirmDeleteSetting, setConfirmDeleteSetting] = React.useState<QRProductSetting | null>(null);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [statusFilter, setStatusFilter] = React.useState<'all' | 'active' | 'inactive'>('all');
  const [draggedSettingId, setDraggedSettingId] = React.useState<string | null>(null);
  const [reordering, setReordering] = React.useState(false);
  const duplicateMessage = {
    serial_prefix: 'This serial prefix already exists.',
    channel: 'This channel already exists.',
    destination: 'This destination already exists.',
    shelf_life: 'This shelf-life value already exists.',
  }[settingType];

  const toPayload = (formData: SettingFormData, existing?: QRProductSetting) => {
    const extraData = { ...(existing?.extra_data || {}) };
    if (showCurrency) extraData.currency_code = formData.currency || null;
    if (settingType === 'shelf_life') extraData.shelf_life_unit = formData.shelf_life_unit;

    return {
      value: formData.value,
      label: formData.label,
      description: formData.description,
      sort_order: formData.sort_order,
      ...(Object.keys(extraData).length > 0 ? { extra_data: extraData } : {}),
    };
  };

  const handleCreate = async (formData: SettingFormData) => {
    try {
      await createSetting({ setting_type: settingType, ...toPayload(formData) });
      setAddingNew(false);
    } catch {
      // error surfaced via hook state
    }
  };

  const handleUpdate = async (id: string, formData: SettingFormData) => {
    try {
      const existing = settings.find((setting) => setting.id === id);
      await updateSetting(id, toPayload(formData, existing));
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

  const canReorder = !searchTerm.trim() && statusFilter === 'all' && !addingNew && !editingId && !reordering;

  const handleReorder = async (targetId: string) => {
    if (!draggedSettingId || draggedSettingId === targetId || !canReorder) return;
    const ordered = [...settings].sort((a, b) => a.sort_order - b.sort_order || a.label.localeCompare(b.label));
    const sourceIndex = ordered.findIndex((setting) => setting.id === draggedSettingId);
    const targetIndex = ordered.findIndex((setting) => setting.id === targetId);
    if (sourceIndex < 0 || targetIndex < 0) return;

    const [moved] = ordered.splice(sourceIndex, 1);
    ordered.splice(targetIndex, 0, moved);
    setDraggedSettingId(null);
    setReordering(true);
    try {
      for (const [index, setting] of ordered.entries()) {
        const nextPriority = index + 1;
        if (setting.sort_order !== nextPriority) await updateSetting(setting.id, { sort_order: nextPriority });
      }
    } catch {
      // Error is surfaced through the settings hook.
    } finally {
      setReordering(false);
    }
  };

  const filteredSettings = React.useMemo(() => {
    const query = searchTerm.trim().toLowerCase();
    return settings.filter((setting) => {
      const matchesStatus = statusFilter === 'all' || (statusFilter === 'active' ? setting.is_active : !setting.is_active);
      const matchesSearch = !query || [setting.value, setting.label, setting.description || ''].some((field) => field.toLowerCase().includes(query));
      return matchesStatus && matchesSearch;
    });
  }, [searchTerm, settings, statusFilter]);

  const renderRows = () => {
    if (loading && settings.length === 0) {
      return (
        <TableRow>
          <TableCell colSpan={showCurrency ? 7 : 6} className="h-24 text-center text-muted-foreground">
            Loading...
          </TableCell>
        </TableRow>
      );
    }
    if (settings.length === 0 && !addingNew) {
      return (
        <TableRow>
          <TableCell colSpan={showCurrency ? 7 : 6} className="h-24 text-center text-muted-foreground">
            {'No ' + meta.label.toLowerCase() + ' configured yet. Click "Add" to create one.'}
          </TableCell>
        </TableRow>
      );
    }
    if (filteredSettings.length === 0 && !addingNew) {
      return (
        <TableRow>
          <TableCell colSpan={showCurrency ? 7 : 6} className="h-24 text-center text-muted-foreground">
            No matching {meta.label.toLowerCase()} found. Try a different search or status filter.
          </TableCell>
        </TableRow>
      );
    }
    return filteredSettings.map((setting) =>
      editingId === setting.id ? (
        <SettingFormRow
          key={setting.id}
          settingType={settingType}
          existingSettings={settings}
          excludeSettingId={setting.id}
          duplicateMessage={duplicateMessage}
          valuePlaceholder={meta.valuePlaceholder}
          labelPlaceholder={meta.labelPlaceholder}
          showCurrency={showCurrency}
          initial={{
            value: setting.value,
            label: setting.label,
            description: setting.description ?? '',
            sort_order: setting.sort_order,
            currency: showCurrency ? getSettingCurrency(setting) : '',
            shelf_life_unit: settingType === 'shelf_life' ? getShelfLifeUnit(setting) : 'months',
          }}
          saving={saving || reordering}
          onSave={(d) => handleUpdate(setting.id, d)}
          onCancel={() => setEditingId(null)}
        />
      ) : (
        <SettingRow
          key={setting.id}
          setting={setting}
          saving={saving || reordering}
          onEdit={() => {
            setEditingId(setting.id);
            setAddingNew(false);
          }}
          onDelete={() => handleDelete(setting)}
          onToggleActive={() => handleToggleActive(setting)}
          showCurrency={showCurrency}
          canDrag={canReorder}
          isDragging={draggedSettingId === setting.id}
          onDragStart={() => setDraggedSettingId(setting.id)}
          onDragOver={(event) => event.preventDefault()}
          onDrop={() => void handleReorder(setting.id)}
          onDragEnd={() => setDraggedSettingId(null)}
        />
      ),
    );
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-4">
        <div>
          <CardTitle className="text-base">{meta.label}</CardTitle>
          <p className="mt-1 text-xs text-muted-foreground">
            {settings.filter((setting) => setting.is_active).length} active of {settings.length}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={refetch} disabled={loading || reordering}>
            <RefreshCw className={`h-3.5 w-3.5 mr-1.5 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            size="sm"
            onClick={() => {
              setAddingNew(true);
              setEditingId(null);
            }}
            disabled={addingNew || reordering}
          >
            <Plus className="h-3.5 w-3.5 mr-1.5" />
            Add
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {error && <div className="mb-4 rounded-md bg-destructive/10 px-4 py-3 text-sm text-destructive">{error}</div>}
        <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={searchTerm}
              onChange={(event) => setSearchTerm(event.target.value)}
              placeholder={`Search ${meta.label.toLowerCase()}...`}
              className="pl-9"
            />
          </div>
          <Select value={statusFilter} onValueChange={(value) => setStatusFilter(value as typeof statusFilter)}>
            <SelectTrigger className="w-full sm:w-[150px]" aria-label="Filter by status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All statuses</SelectItem>
              <SelectItem value="active">Active only</SelectItem>
              <SelectItem value="inactive">Inactive only</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <p className="mb-2 text-xs text-muted-foreground">
          Showing {filteredSettings.length} of {settings.length} {meta.label.toLowerCase()}.{' '}
          {canReorder ? 'Drag rows to change Priority.' : 'Clear filters and finish editing to reorder.'} Lower Priority numbers appear first.
        </p>
        <div className="rounded-md border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[140px]">{meta.valueLabel}</TableHead>
                <TableHead className="w-[200px]">Label</TableHead>
                {showCurrency && <TableHead className="w-[190px]">Currency</TableHead>}
                <TableHead>Description</TableHead>
                <TableHead className="w-[80px]" title="Lower numbers appear first">
                  Priority
                </TableHead>
                <TableHead className="w-[80px]">Status</TableHead>
                <TableHead className="w-[120px] text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {addingNew && (
                <SettingFormRow
                  valuePlaceholder={meta.valuePlaceholder}
                  settingType={settingType}
                  existingSettings={settings}
                  duplicateMessage={duplicateMessage}
                  labelPlaceholder={meta.labelPlaceholder}
                  showCurrency={showCurrency}
                  saving={saving}
                  onSave={handleCreate}
                  onCancel={() => setAddingNew(false)}
                />
              )}
              {renderRows()}
            </TableBody>
          </Table>
        </div>

        {/* Delete Confirmation Dialog */}
        <ConfirmationDialog
          open={!!confirmDeleteSetting}
          onOpenChange={(open) => {
            if (!open) setConfirmDeleteSetting(null);
          }}
          title="Delete Setting"
          description={confirmDeleteSetting ? `Delete "${confirmDeleteSetting.label}"? This cannot be undone.` : ''}
          confirmLabel="Delete"
          variant="destructive"
          onConfirm={executeDelete}
        />
      </CardContent>
    </Card>
  );
}

/* ------------------------------------------------------------------ */
/*  Main export                                                        */
/* ------------------------------------------------------------------ */

export function ProductSettingsManagement() {
  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
          <Settings className="h-6 w-6" />
          Settings
        </h2>
        <p className="text-muted-foreground">
          Configure allowed values for serial prefixes, channels, destinations, and shelf life. These appear as dropdown options during QR product and
          block creation.
        </p>
      </div>

      <Tabs defaultValue="serial_prefix" className="space-y-4">
        <TabsList>
          {SETTING_TABS.map((tab) => (
            <TabsTrigger key={tab.key} value={tab.key}>
              {tab.label}
            </TabsTrigger>
          ))}
          <TabsTrigger value="brands">
            <KeyRound className="h-3.5 w-3.5 mr-1.5" />
            Brands & Keys
          </TabsTrigger>
          <TabsTrigger value="landing-page">
            <Globe className="h-3.5 w-3.5 mr-1.5" />
            Landing Page
          </TabsTrigger>
          <TabsTrigger value="qr-credit">
            <Coins className="h-3.5 w-3.5 mr-1.5" />
            QR Credit
          </TabsTrigger>
          <TabsTrigger value="wms-activation">
            <Zap className="h-3.5 w-3.5 mr-1.5" />
            Batch
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
        <TabsContent value="qr-credit">
          <QRCreditSummary />
        </TabsContent>
        <TabsContent value="wms-activation">
          <ActivationManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
}
