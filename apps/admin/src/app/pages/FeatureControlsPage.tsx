import { useState, useEffect, useCallback } from 'react';
import { Plus, ToggleLeft, Trash2 } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Switch,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@horizon-sync/ui/components';
import { toast } from '@horizon-sync/ui';

import { AdminOrganizationService } from '../services/admin-organization.service';
import { FeatureFlagService } from '../services/feature-flag.service';
import type { FeatureFlag, FeatureFlagCreateData } from '../services/feature-flag.service';

/** Sentinel value for the "Global flags" option in the org selector. */
const GLOBAL_SELECT_VALUE = '__global__';

function formatDate(ts: string): string {
  return new Date(ts).toLocaleDateString();
}

interface TenantFlagsTableProps {
  flags: FeatureFlag[];
  loading: boolean;
  toggling: string | null;
  removing: string | null;
  onToggle: (flag: FeatureFlag) => void;
  onRemove: (flag: FeatureFlag) => void;
}

function TenantFlagsTable({ flags, loading, toggling, removing, onToggle, onRemove }: TenantFlagsTableProps) {
  return (
    <Card>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Name</TableHead>
              <TableHead>Description</TableHead>
              <TableHead>Enabled</TableHead>
              <TableHead>Visible</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">Loading tenant flags...</TableCell>
              </TableRow>
            ) : flags.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex flex-col items-center gap-2">
                    <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                    <p className="text-muted-foreground">No tenant overrides for this organization.</p>
                  </div>
                </TableCell>
              </TableRow>
            ) : (
              flags.map((flag) => (
                <TableRow key={flag.id}>
                  <TableCell className="font-medium font-mono text-sm">{flag.name}</TableCell>
                  <TableCell className="text-muted-foreground max-w-xs truncate">{flag.description || '—'}</TableCell>
                  <TableCell>
                    <Switch checked={flag.enabled}
                      disabled={toggling === flag.name}
                      onCheckedChange={() => onToggle(flag)}
                      aria-label={`Toggle ${flag.name}`} />
                  </TableCell>
                  <TableCell>
                    <span className="text-muted-foreground">{flag.visible ? 'Visible' : 'Hidden'}</span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-muted-foreground">{formatDate(flag.created_at)}</TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost"
                      size="sm"
                      disabled={removing === flag.name}
                      onClick={() => onRemove(flag)}
                      aria-label={`Remove ${flag.name} override`}>
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}

export function FeatureControlsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [togglingVisibleId, setTogglingVisibleId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Org-scoped (TENANT) control state
  const [organizations, setOrganizations] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedOrgId, setSelectedOrgId] = useState('');
  const [tenantFlags, setTenantFlags] = useState<FeatureFlag[]>([]);
  const [tenantLoading, setTenantLoading] = useState(false);
  const [tenantToggling, setTenantToggling] = useState<string | null>(null);
  const [tenantRemoving, setTenantRemoving] = useState<string | null>(null);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState(false);
  const [formVisible, setFormVisible] = useState(true);

  const fetchFlags = useCallback(async () => {
    setLoading(true);
    try {
      const res = await FeatureFlagService.listFlags();
      setFlags(res.flags);
    } catch {
      toast({ title: 'Error', description: 'Failed to load feature flags', variant: 'destructive' });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchFlags();
  }, [fetchFlags]);

  // Load the organization list for the org selector.
  useEffect(() => {
    let cancelled = false;
    AdminOrganizationService.getOrganizations({ page_size: 100 })
      .then((res) => {
        if (!cancelled) setOrganizations(res.organizations ?? []);
      })
      .catch(() => {
        if (!cancelled) toast({ title: 'Error', description: 'Failed to load organizations', variant: 'destructive' });
      });
    return () => {
      cancelled = true;
    };
  }, []);

  // Load the selected org's TENANT-scoped flags.
  useEffect(() => {
    if (!selectedOrgId) {
      setTenantFlags([]);
      return;
    }
    let cancelled = false;
    setTenantLoading(true);
    FeatureFlagService.listTenantFlags(selectedOrgId)
      .then((res) => {
        if (!cancelled) setTenantFlags(res.flags);
      })
      .catch(() => {
        if (!cancelled) toast({ title: 'Error', description: 'Failed to load tenant flags', variant: 'destructive' });
      })
      .finally(() => {
        if (!cancelled) setTenantLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedOrgId]);

  const handleTenantToggle = async (flag: FeatureFlag) => {
    setTenantToggling(flag.name);
    try {
      const updated = await FeatureFlagService.upsertTenantFlag(selectedOrgId, flag.name, { enabled: !flag.enabled });
      setTenantFlags((prev) => prev.map((f) => (f.name === updated.name ? updated : f)));
    } catch {
      toast({ title: 'Error', description: `Failed to toggle "${flag.name}"`, variant: 'destructive' });
    } finally {
      setTenantToggling(null);
    }
  };

  const handleTenantRemove = async (flag: FeatureFlag) => {
    if (!window.confirm(`Remove the "${flag.name}" override for this organization?`)) return;
    setTenantRemoving(flag.name);
    try {
      await FeatureFlagService.deleteTenantFlag(selectedOrgId, flag.name);
      setTenantFlags((prev) => prev.filter((f) => f.name !== flag.name));
      toast({ title: 'Override removed', description: `"${flag.name}" now falls back to the global value.` });
    } catch {
      toast({ title: 'Error', description: `Failed to remove "${flag.name}"`, variant: 'destructive' });
    } finally {
      setTenantRemoving(null);
    }
  };

  const handleToggle = async (flag: FeatureFlag) => {
    setTogglingId(flag.id);
    try {
      const updated = await FeatureFlagService.updateFlag(flag.id, { enabled: !flag.enabled });
      setFlags((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch {
      toast({ title: 'Error', description: `Failed to toggle "${flag.name}"`, variant: 'destructive' });
    } finally {
      setTogglingId(null);
    }
  };

  const handleToggleVisible = async (flag: FeatureFlag) => {
    setTogglingVisibleId(flag.id);
    try {
      const updated = await FeatureFlagService.updateFlag(flag.id, { visible: !flag.visible });
      setFlags((prev) => prev.map((f) => (f.id === updated.id ? updated : f)));
    } catch {
      toast({ title: 'Error', description: `Failed to toggle visibility for "${flag.name}"`, variant: 'destructive' });
    } finally {
      setTogglingVisibleId(null);
    }
  };

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormEnabled(false);
    setFormVisible(true);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const data: FeatureFlagCreateData = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        enabled: formEnabled,
        visible: formVisible,
      };
      const created = await FeatureFlagService.createFlag(data);
      setFlags((prev) => [...prev, created]);
      toast({ title: 'Flag created', description: `"${created.name}" has been created.` });
      resetForm();
      setCreateOpen(false);
    } catch (error: any) {
      const message =
        error?.data?.detail && typeof error.data.detail === 'string'
          ? error.data.detail
          : 'Failed to create feature flag';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Controls</h1>
          <p className="text-muted-foreground mt-1">Manage feature flags across the platform</p>
        </div>
        <div className="flex items-center gap-3">
          <Select value={selectedOrgId || GLOBAL_SELECT_VALUE}
            onValueChange={(v) => setSelectedOrgId(v === GLOBAL_SELECT_VALUE ? '' : v)}>
            <SelectTrigger className="w-64">
              <SelectValue placeholder="Select organization" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={GLOBAL_SELECT_VALUE}>Global flags</SelectItem>
              {organizations.map((org) => (
                <SelectItem key={org.id} value={org.id}>
                  {org.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={() => setCreateOpen(true)}
            className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25">
            <Plus className="h-4 w-4" />
            Create Flag
          </Button>
        </div>
      </div>

      {/* Tenant flags for the selected organization */}
      {selectedOrgId && (
        <TenantFlagsTable flags={tenantFlags}
          loading={tenantLoading}
          toggling={tenantToggling}
          removing={tenantRemoving}
          onToggle={handleTenantToggle}
          onRemove={handleTenantRemove} />
      )}

      {/* Flags Table (global view) */}
      {!selectedOrgId && (
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Visible</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    Loading feature flags...
                  </TableCell>
                </TableRow>
              ) : flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={5} className="text-center py-8">
                    <div className="flex flex-col items-center gap-2">
                      <ToggleLeft className="h-8 w-8 text-muted-foreground" />
                      <p className="text-muted-foreground">No feature flags found</p>
                      <Button variant="outline" size="sm" onClick={() => setCreateOpen(true)}>
                        Create your first flag
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                flags.map((flag) => (
                  <TableRow key={flag.id}>
                    <TableCell className="font-medium font-mono text-sm">{flag.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-xs truncate">
                      {flag.description || '—'}
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.enabled}
                        disabled={togglingId === flag.id}
                        onCheckedChange={() => handleToggle(flag)}
                        aria-label={`Toggle ${flag.name}`}
                      />
                    </TableCell>
                    <TableCell>
                      <Switch
                        checked={flag.visible}
                        disabled={togglingVisibleId === flag.id}
                        onCheckedChange={() => handleToggleVisible(flag)}
                        aria-label={`Toggle visibility for ${flag.name}`}
                      />
                    </TableCell>
                    <TableCell className="whitespace-nowrap text-muted-foreground">
                      {formatDate(flag.created_at)}
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      )}

      {/* Create Flag Dialog */}
      <Dialog open={createOpen} onOpenChange={(open) => { setCreateOpen(open); if (!open) resetForm(); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create Feature Flag</DialogTitle>
            <DialogDescription>
              Add a new global feature flag. Use lowercase snake_case for the name.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <Label htmlFor="flag-name">Name</Label>
              <Input
                id="flag-name"
                placeholder="e.g. invoice_auto_journal_posting"
                value={formName}
                onChange={(e) => setFormName(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Lowercase letters, numbers, and underscores only.
              </p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="flag-description">Description</Label>
              <Input
                id="flag-description"
                placeholder="What does this flag control?"
                value={formDescription}
                onChange={(e) => setFormDescription(e.target.value)}
              />
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="flag-enabled"
                checked={formEnabled}
                onCheckedChange={setFormEnabled}
              />
              <Label htmlFor="flag-enabled">
                {formEnabled ? 'Enabled' : 'Disabled'}
              </Label>
            </div>
            <div className="flex items-center gap-3">
              <Switch
                id="flag-visible"
                checked={formVisible}
                onCheckedChange={setFormVisible}
              />
              <Label htmlFor="flag-visible">
                {formVisible ? 'Visible' : 'Hidden'}
              </Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setCreateOpen(false); resetForm(); }}>
              Cancel
            </Button>
            <Button onClick={handleCreate} disabled={creating || !formName.trim()}>
              {creating ? 'Creating...' : 'Create Flag'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
