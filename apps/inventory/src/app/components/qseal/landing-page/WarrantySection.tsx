import * as React from 'react';
import { Shield } from 'lucide-react';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Switch } from '@horizon-sync/ui/components/ui/switch';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { CollapsibleSection } from './CollapsibleSection';
import type { SectionProps } from './types';

/**
 * Warranty section: enable/disable, configure title, description, CTA text, and URL.
 */
export function WarrantySection({ config, setConfig }: SectionProps) {
  const w = config.warranty;

  return (
    <CollapsibleSection icon={Shield} title="Warranty">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Enable Warranty Section</Label>
        <Switch
          checked={w.enabled}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, warranty: { ...c.warranty, enabled: v } }))
          }
        />
      </div>
      {w.enabled && (
        <>
          <Input
            value={w.title}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                warranty: { ...c.warranty, title: e.target.value },
              }))
            }
            placeholder="Section title"
            className="h-8 text-xs"
          />
          <Textarea
            value={w.description}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                warranty: { ...c.warranty, description: e.target.value },
              }))
            }
            placeholder="Description text"
            className="text-xs"
            rows={2}
          />
          <div className="grid grid-cols-2 gap-2">
            <Input
              value={w.cta_text}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  warranty: { ...c.warranty, cta_text: e.target.value },
                }))
              }
              placeholder="CTA Button Text"
              className="h-8 text-xs"
            />
            <Input
              value={w.cta_url}
              onChange={(e) =>
                setConfig((c) => ({
                  ...c,
                  warranty: { ...c.warranty, cta_url: e.target.value },
                }))
              }
              placeholder="CTA Button URL"
              className="h-8 text-xs"
            />
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}
