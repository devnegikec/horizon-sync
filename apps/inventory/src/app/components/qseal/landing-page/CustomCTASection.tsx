import * as React from 'react';

import { MousePointerClick } from 'lucide-react';

import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Switch } from '@horizon-sync/ui/components/ui/switch';

import type { CTAButtonStyle } from '../../../types/landing-page.types';

import { CollapsibleSection } from './CollapsibleSection';
import type { SectionProps } from './types';

const BUTTON_STYLES: CTAButtonStyle[] = ['primary', 'secondary', 'outline'];

/**
 * Custom Call to Action section: enable/disable, configure button text, URL, and style.
 */
export function CustomCTASection({ config, setConfig }: SectionProps) {
  const cta = config.custom_cta;

  return (
    <CollapsibleSection icon={MousePointerClick} title="Custom Call to Action">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Enable Custom CTA Button</Label>
        <Switch checked={cta.enabled}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, custom_cta: { ...c.custom_cta, enabled: v } }))
          }/>
      </div>
      {cta.enabled && (
        <>
          <Input value={cta.button_text}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                custom_cta: { ...c.custom_cta, button_text: e.target.value },
              }))
            }
            placeholder="Button text"
            className="h-8 text-xs"/>
          <Input value={cta.button_url}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                custom_cta: { ...c.custom_cta, button_url: e.target.value },
              }))
            }
            placeholder="Button URL"
            className="h-8 text-xs"/>
          <div className="space-y-1">
            <Label className="text-xs">Button Style</Label>
            <Select value={cta.button_style}
              onValueChange={(v) =>
                setConfig((c) => ({
                  ...c,
                  custom_cta: { ...c.custom_cta, button_style: v as CTAButtonStyle },
                }))
              }>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {BUTTON_STYLES.map((s) => (
                  <SelectItem key={s} value={s} className="text-xs capitalize">
                    {s}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}
