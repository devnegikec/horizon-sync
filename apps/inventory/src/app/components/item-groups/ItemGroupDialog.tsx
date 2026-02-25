import * as React from 'react';

import { Loader2, Layers } from 'lucide-react';

// eslint-disable-next-line @nx/enforce-module-boundaries
import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@horizon-sync/ui/components/ui/dialog';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { useItemGroupMutations } from '../../hooks/useItemGroups';
import { useUOMOptions } from '../../hooks/useUOMOptions';
import type { ItemGroupListItem } from '../../types/item-group.types';
import { FilterSelect } from '../shared/FilterSelect';

interface ItemGroupDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  itemGroup?: ItemGroupListItem | null;
  allItemGroups: ItemGroupListItem[];
  onCreated?: () => void;
  onUpdated?: () => void;
}

const VALUATION_METHODS = [
  { value: 'fifo', label: 'FIFO' },
  { value: 'lifo', label: 'LIFO' },
  { value: 'average', label: 'Moving Average' },
];

const DEFAULT_FORM = {
  name: '',
  code: '',
  description: '',
  parent_id: '',
  default_valuation_method: '',
  default_uom: '',
  is_active: true,
};

type FormData = typeof DEFAULT_FORM;
type SetField = (key: keyof FormData, value: string | boolean) => void;

interface FormFieldsProps {
  formData: FormData;
  set: SetField;
  isEditing: boolean;
  parentOptions: ItemGroupListItem[];
  uomOptions: { label: string; value: string }[];
  uomLoading: boolean;
}

function ItemGroupFormFields({ formData, set, isEditing, parentOptions, uomOptions, uomLoading }: FormFieldsProps) {
  return (
    <div className="grid gap-4 py-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ig-name">Name *</Label>
          <Input id="ig-name"
            value={formData.name}
            onChange={(e) => set('name', e.target.value)}
            placeholder="e.g., Electronics"
            required />
        </div>
        <div className="space-y-2">
          <Label htmlFor="ig-status">Status</Label>
          <Select value={formData.is_active ? 'active' : 'inactive'}
            onValueChange={(v) => set('is_active', v === 'active')}>
            <SelectTrigger id="ig-status">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {isEditing && (
        <div className="space-y-2">
          <Label htmlFor="ig-code">Code</Label>
          <Input id="ig-code"
            value={formData.code}
            readOnly
            className="bg-muted cursor-not-allowed" />
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="ig-description">Description</Label>
        <Textarea id="ig-description"
          value={formData.description}
          onChange={(e) => set('description', e.target.value)}
          placeholder="Optional description"
          rows={2} />
      </div>

      <div className="space-y-2">
        <Label htmlFor="ig-parent">Parent Group</Label>
        <Select value={formData.parent_id || 'none'}
          onValueChange={(v) => set('parent_id', v === 'none' ? '' : v)}>
          <SelectTrigger id="ig-parent">
            <SelectValue placeholder="None (top-level)" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">None (top-level)</SelectItem>
            {parentOptions.map((g) => (
              <SelectItem key={g.id} value={g.id}>{g.name} ({g.code})</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <Label htmlFor="ig-valuation">Valuation Method</Label>
          <Select value={formData.default_valuation_method || 'none'}
            onValueChange={(v) => set('default_valuation_method', v === 'none' ? '' : v)}>
            <SelectTrigger id="ig-valuation">
              <SelectValue placeholder="Default" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="none">Default</SelectItem>
              {VALUATION_METHODS.map((m) => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-2">
          <Label htmlFor="ig-uom">Unit of Measure</Label>
          <FilterSelect value={formData.default_uom}
            onValueChange={(v) => set('default_uom', v)}
            options={uomOptions}
            placeholder="Select UOM"
            loading={uomLoading}
            listMaxHeight="max-h-40"/>
        </div>
      </div>
    </div>
  );
}

export function ItemGroupDialog({ open, onOpenChange, itemGroup, allItemGroups, onCreated, onUpdated }: ItemGroupDialogProps) {
  const { createItemGroup, updateItemGroup, loading } = useItemGroupMutations();
  const { accessToken } = useUserStore();
  const { options: uomOptions, loading: uomLoading } = useUOMOptions(accessToken ?? '');
  const [formData, setFormData] = React.useState(DEFAULT_FORM);
  const [submitError, setSubmitError] = React.useState<string | null>(null);

  const isEditing = !!itemGroup;

  React.useEffect(() => {
    if (itemGroup) {
      setFormData({
        name: itemGroup.name,
        code: itemGroup.code,
        description: itemGroup.description || '',
        parent_id: itemGroup.parent_id || '',
        default_valuation_method: itemGroup.default_valuation_method || '',
        default_uom: itemGroup.default_uom || '',
        is_active: itemGroup.is_active,
      });
    } else {
      setFormData(DEFAULT_FORM);
    }
    setSubmitError(null);
  }, [itemGroup, open]);

  const set: SetField = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const buildPayload = () => ({
    name: formData.name,
    code: formData.code || undefined,
    description: formData.description || null,
    parent_id: formData.parent_id || null,
    default_valuation_method: formData.default_valuation_method || null,
    default_uom: formData.default_uom || null,
    is_active: formData.is_active,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitError(null);
    try {
      if (isEditing && itemGroup) {
        await updateItemGroup(itemGroup.id, buildPayload());
        onUpdated?.();
      } else {
        await createItemGroup(buildPayload());
        onCreated?.();
      }
      onOpenChange(false);
    } catch (err) {
      setSubmitError(err instanceof Error ? err.message : 'Failed to save item group');
    }
  };

  const parentOptions = allItemGroups.filter((g) => g.id !== itemGroup?.id);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[520px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
              <Layers className="h-5 w-5 text-primary" />
            </div>
            <div>
              <DialogTitle>{isEditing ? 'Edit Item Group' : 'Create Item Group'}</DialogTitle>
              <DialogDescription>{isEditing ? 'Update item group details' : 'Add a new item group to organize your inventory'}</DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <form onSubmit={handleSubmit}>
          <ItemGroupFormFields formData={formData} set={set} isEditing={isEditing} parentOptions={parentOptions} uomOptions={uomOptions} uomLoading={uomLoading}/>

          {submitError && <p className="text-sm text-destructive mb-4">{submitError}</p>}

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={loading}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />{isEditing ? 'Saving...' : 'Creating...'}</>
              ) : isEditing ? 'Save Changes' : 'Create Group'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
