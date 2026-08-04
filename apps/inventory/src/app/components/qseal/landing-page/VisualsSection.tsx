import * as React from 'react';
import { Image } from 'lucide-react';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';

import { CollapsibleSection } from './CollapsibleSection';
import { ImageUploadField } from './ImageUploadField';
import type { VisualsSectionProps } from './types';

/**
 * Visuals & Branding section: Logo, Banner, Primary/Accent colors.
 */
export function VisualsSection({ config, setConfig, productId, accessToken }: VisualsSectionProps) {
  return (
    <CollapsibleSection icon={Image} title="Visuals & Branding" defaultOpen>
      <div className="grid grid-cols-2 gap-3">
        <ImageUploadField
          label="Logo"
          hint="Upload Logo"
          value={config.logo_url}
          onChange={(v) => setConfig((c) => ({ ...c, logo_url: v }))}
          productId={productId}
          accessToken={accessToken}
          imageType="logo"
        />
        <ImageUploadField
          label="Banner Image"
          hint="Upload Banner"
          value={config.banner_image_url}
          onChange={(v) => setConfig((c) => ({ ...c, banner_image_url: v }))}
          productId={productId}
          accessToken={accessToken}
          imageType="banner"
        />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Primary Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={config.primary_color}
              onChange={(e) => setConfig((c) => ({ ...c, primary_color: e.target.value }))}
              className="h-8 w-12 p-0.5 cursor-pointer"
            />
            <Input
              value={config.primary_color}
              onChange={(e) => setConfig((c) => ({ ...c, primary_color: e.target.value }))}
              className="h-8 text-xs font-mono"
              placeholder="#1a56db"
            />
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Accent Color</Label>
          <div className="flex items-center gap-2">
            <Input
              type="color"
              value={config.accent_color}
              onChange={(e) => setConfig((c) => ({ ...c, accent_color: e.target.value }))}
              className="h-8 w-12 p-0.5 cursor-pointer"
            />
            <Input
              value={config.accent_color}
              onChange={(e) => setConfig((c) => ({ ...c, accent_color: e.target.value }))}
              className="h-8 text-xs font-mono"
              placeholder="#f59e0b"
            />
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}
