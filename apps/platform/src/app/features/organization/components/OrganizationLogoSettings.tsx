import * as React from 'react';
import { useState } from 'react';

import { Building2, Image as ImageIcon, Loader2, Save, Trash2, Upload } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { clearOrganizationCache } from '../../../hooks/useOrganization';
import { getOrganizationLogoUrl } from '../../../hooks/useOrganizationBranding';
import { OrganizationService } from '../../../services/organization.service';

const MAX_LOGO_BYTES = 512 * 1024;
const ACCEPTED_LOGO_TYPES = ['image/png', 'image/jpeg', 'image/svg+xml', 'image/webp'];

interface OrganizationLogoSettingsProps {
  organizationId: string;
  accessToken: string;
  canEdit: boolean;
}

/**
 * Organization logo management.
 *
 * The logo is persisted as `logo_url` inside `organization.settings` (a data URL
 * from an upload, or any public https URL) and is rendered in the topbar.
 */
export function OrganizationLogoSettings({ organizationId, accessToken, canEdit }: OrganizationLogoSettingsProps) {
  const { toast } = useToast();
  const updateOrganization = useUserStore((s) => s.updateOrganization);
  const [savedLogo, setSavedLogo] = useState('');
  const [draftLogo, setDraftLogo] = useState('');
  const [urlInput, setUrlInput] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const org = await OrganizationService.getOrganization(organizationId, accessToken);
        if (cancelled) return;
        const logo = getOrganizationLogoUrl(org);
        setSavedLogo(logo);
        setDraftLogo(logo);
        setUrlInput(logo.startsWith('http') ? logo : '');
      } catch (error) {
        if (cancelled) return;
        toast({
          title: 'Error',
          description: error instanceof Error ? error.message : 'Failed to load organization logo',
          variant: 'destructive',
        });
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [organizationId, accessToken, toast]);

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file) return;

    if (!ACCEPTED_LOGO_TYPES.includes(file.type)) {
      toast({ title: 'Unsupported file', description: 'Upload a PNG, JPG, SVG or WebP image.', variant: 'destructive' });
      return;
    }

    if (file.size > MAX_LOGO_BYTES) {
      toast({ title: 'File too large', description: 'Logo must be 512 KB or smaller.', variant: 'destructive' });
      return;
    }

    const reader = new FileReader();
    reader.onloadend = () => {
      setDraftLogo(typeof reader.result === 'string' ? reader.result : '');
      setUrlInput('');
    };
    reader.readAsDataURL(file);
  };

  const handleUrlApply = () => {
    const value = urlInput.trim();
    if (!value) {
      setDraftLogo('');
      return;
    }

    try {
      const parsed = new URL(value);
      if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') throw new Error('invalid protocol');
    } catch {
      toast({
        title: 'Invalid URL',
        description: 'Enter a valid http:// or https:// image URL.',
        variant: 'destructive',
      });
      return;
    }

    setDraftLogo(value);
  };

  const handleRemove = () => {
    setDraftLogo('');
    setUrlInput('');
  };

  const handleDiscard = () => {
    setDraftLogo(savedLogo);
    setUrlInput(savedLogo.startsWith('http') ? savedLogo : '');
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      // Read the latest settings so unrelated keys (address, currencies, …) survive the PATCH.
      const org = await OrganizationService.getOrganization(organizationId, accessToken);
      const nextSettings: Record<string, unknown> = {
        ...((org.settings as Record<string, unknown> | null | undefined) ?? {}),
        logo_url: draftLogo || null,
      };

      const updated = await OrganizationService.updateOrganization(organizationId, { settings: nextSettings }, accessToken);

      updateOrganization({ settings: updated.settings ?? nextSettings });
      clearOrganizationCache(organizationId);
      setSavedLogo(draftLogo);
      toast({ title: 'Success', description: 'Organization logo saved successfully' });
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to save organization logo',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const hasChanges = draftLogo !== savedLogo;

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-[#3058EE] to-[#7D97F6]">
            <ImageIcon className="h-5 w-5 text-white" />
          </div>
          Organization Logo
        </CardTitle>
        <CardDescription>
          Shown in the topbar of your workspace. PNG, JPG, SVG or WebP up to 512 KB, or a public image URL.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-xl border border-dashed border-border bg-muted/40">
            {draftLogo ? (
              <img src={draftLogo} alt="Organization logo preview" className="h-full w-full object-contain p-2" />
            ) : (
              <Building2 className="h-8 w-8 text-muted-foreground" />
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <input ref={fileInputRef} type="file" accept={ACCEPTED_LOGO_TYPES.join(',')} className="sr-only" onChange={handleFileSelect} />
            <Button type="button" variant="outline" size="sm" className="gap-2" disabled={!canEdit || saving} onClick={() => fileInputRef.current?.click()}>
              <Upload className="h-4 w-4" />
              {draftLogo ? 'Replace image' : 'Upload image'}
            </Button>
            {draftLogo && (
              <Button type="button" variant="ghost" size="sm" className="gap-2 text-destructive hover:text-destructive" disabled={!canEdit || saving} onClick={handleRemove}>
                <Trash2 className="h-4 w-4" />
                Remove
              </Button>
            )}
          </div>
        </div>

        <div className="space-y-1">
          <p className="text-sm font-medium">Or paste an image URL</p>
          <div className="flex flex-wrap gap-2">
            <Input value={urlInput}
              onChange={(event) => setUrlInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  handleUrlApply();
                }
              }}
              placeholder="https://cdn.example.com/logo.png"
              disabled={!canEdit || saving || loading}
              className="max-w-md" />
            <Button type="button" variant="outline" size="sm" disabled={!canEdit || saving || loading} onClick={handleUrlApply}>
              Use URL
            </Button>
          </div>
        </div>

        {canEdit && (
          <div className="flex justify-end gap-2 border-t pt-4">
            <Button type="button" variant="ghost" size="sm" disabled={!hasChanges || saving} onClick={handleDiscard}>
              Discard
            </Button>
            <Button type="button" size="sm" className="gap-2" disabled={!hasChanges || saving || loading} onClick={handleSave}>
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              {saving ? 'Saving...' : 'Save logo'}
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
