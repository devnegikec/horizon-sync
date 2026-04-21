import { useState, useEffect, useCallback } from 'react';
import { Plus, ToggleLeft } from 'lucide-react';

import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Switch,
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

import { FeatureFlagService } from '../services/feature-flag.service';
import type { FeatureFlag, FeatureFlagCreateData } from '../services/feature-flag.service';

export function FeatureControlsPage() {
  const [flags, setFlags] = useState<FeatureFlag[]>([]);
  const [loading, setLoading] = useState(false);
  const [togglingId, setTogglingId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [creating, setCreating] = useState(false);

  // Create form state
  const [formName, setFormName] = useState('');
  const [formDescription, setFormDescription] = useState('');
  const [formEnabled, setFormEnabled] = useState(false);

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

  const resetForm = () => {
    setFormName('');
    setFormDescription('');
    setFormEnabled(false);
  };

  const handleCreate = async () => {
    if (!formName.trim()) return;
    setCreating(true);
    try {
      const data: FeatureFlagCreateData = {
        name: formName.trim(),
        description: formDescription.trim() || null,
        enabled: formEnabled,
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

  const formatDate = (ts: string) => new Date(ts).toLocaleDateString();

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      {/* Header */}
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Feature Controls</h1>
          <p className="text-muted-foreground mt-1">Manage feature flags across the platform</p>
        </div>
        <Button
          onClick={() => setCreateOpen(true)}
          className="gap-2 bg-gradient-to-r from-[#3058EE] to-[#7D97F6] hover:opacity-90 text-white shadow-lg shadow-[#3058EE]/25"
        >
          <Plus className="h-4 w-4" />
          Create Flag
        </Button>
      </div>

      {/* Flags Table */}
      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Description</TableHead>
                <TableHead>Enabled</TableHead>
                <TableHead>Created</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
                    Loading feature flags...
                  </TableCell>
                </TableRow>
              ) : flags.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={4} className="text-center py-8">
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
