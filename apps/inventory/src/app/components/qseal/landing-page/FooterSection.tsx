import * as React from 'react';
import { Layout, Plus, Trash2 } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Switch } from '@horizon-sync/ui/components/ui/switch';

import { CollapsibleSection } from './CollapsibleSection';
import type { SectionProps } from './types';
import type { FooterLink } from '../../../types/landing-page.types';

/**
 * Custom Footer section: copyright text, "Powered by" toggle, and custom links.
 */
export function FooterSection({ config, setConfig }: SectionProps) {
  const addLink = () => {
    setConfig((c) => ({
      ...c,
      footer: {
        ...c.footer,
        custom_links: [...c.footer.custom_links, { label: '', url: '' }],
      },
    }));
  };

  const updateLink = (idx: number, field: 'label' | 'url', val: string) => {
    setConfig((c) => {
      const links = [...c.footer.custom_links];
      links[idx] = { ...links[idx], [field]: val };
      return { ...c, footer: { ...c.footer, custom_links: links } };
    });
  };

  const removeLink = (idx: number) => {
    setConfig((c) => ({
      ...c,
      footer: {
        ...c.footer,
        custom_links: c.footer.custom_links.filter((_, i) => i !== idx),
      },
    }));
  };

  return (
    <CollapsibleSection icon={Layout} title="Custom Footer">
      <Input
        value={config.footer.text}
        onChange={(e) =>
          setConfig((c) => ({ ...c, footer: { ...c.footer, text: e.target.value } }))
        }
        placeholder="Footer copyright text"
        className="h-8 text-xs"
      />
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show "Powered by QSeal"</Label>
        <Switch
          checked={config.footer.show_powered_by}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, footer: { ...c.footer, show_powered_by: v } }))
          }
        />
      </div>

      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Custom Links</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addLink}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {config.footer.custom_links.map((link: FooterLink, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Input
              value={link.label}
              onChange={(e) => updateLink(i, 'label', e.target.value)}
              placeholder="Label"
              className="h-7 text-xs flex-1"
            />
            <Input
              value={link.url}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              placeholder="URL"
              className="h-7 text-xs flex-1"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => removeLink(i)}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}
