import * as React from 'react';
import { Globe, Trash2 } from 'lucide-react';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Switch } from '@horizon-sync/ui/components/ui/switch';

import { CollapsibleSection } from './CollapsibleSection';
import { SocialIcon } from './SocialIcon';
import type { SectionProps } from './types';
import type { SocialLink, SocialPlatform } from '../../../types/landing-page.types';
import { SOCIAL_PLATFORM_INFO } from '../../../types/landing-page.types';

/**
 * Social Media Links section: add/edit/remove social platform links.
 */
export function SocialLinksSection({ config, setConfig }: SectionProps) {
  const platforms = Object.entries(SOCIAL_PLATFORM_INFO) as [
    SocialPlatform,
    (typeof SOCIAL_PLATFORM_INFO)[SocialPlatform],
  ][];

  const addLink = (platform: SocialPlatform) => {
    const exists = config.social_links.some((l) => l.platform === platform);
    if (exists) return;
    setConfig((c) => ({
      ...c,
      social_links: [
        ...c.social_links,
        { platform, url: '', enabled: true, sort_order: c.social_links.length },
      ],
    }));
  };

  const updateLink = (idx: number, data: Partial<SocialLink>) => {
    setConfig((c) => {
      const links = [...c.social_links];
      links[idx] = { ...links[idx], ...data };
      return { ...c, social_links: links };
    });
  };

  const removeLink = (idx: number) => {
    setConfig((c) => ({
      ...c,
      social_links: c.social_links.filter((_, i) => i !== idx),
    }));
  };

  const availablePlatforms = platforms.filter(
    ([p]) => !config.social_links.some((l) => l.platform === p),
  );

  return (
    <CollapsibleSection icon={Globe} title="Social Media Links">
      {config.social_links.map((link, i) => (
        <div key={i} className="flex items-center gap-2">
          <Switch checked={link.enabled} onCheckedChange={(v) => updateLink(i, { enabled: v })} />
          <span className="text-xs font-medium w-20 shrink-0 flex items-center gap-1.5">
            <SocialIcon platform={link.platform} size={14} />
            {SOCIAL_PLATFORM_INFO[link.platform]?.label ?? link.platform}
          </span>
          <Input
            value={link.url}
            onChange={(e) => updateLink(i, { url: e.target.value })}
            placeholder={SOCIAL_PLATFORM_INFO[link.platform]?.placeholder}
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

      {availablePlatforms.length > 0 && (
        <Select onValueChange={(v) => addLink(v as SocialPlatform)}>
          <SelectTrigger className="h-8 text-xs">
            <SelectValue placeholder="+ Add social platform" />
          </SelectTrigger>
          <SelectContent>
            {availablePlatforms.map(([p, info]) => (
              <SelectItem key={p} value={p} className="text-xs">
                <span className="flex items-center gap-1.5">
                  <SocialIcon platform={p} size={14} />
                  {info.label}
                </span>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      )}
    </CollapsibleSection>
  );
}
