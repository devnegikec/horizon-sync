import * as React from 'react';

import {
  Image,
  Link,
  Globe,
  MessageSquare,
  Shield,
  MousePointerClick,
  Layout,
  Smartphone,
  Plus,
  Trash2,
  Upload,
  X,
  ChevronDown,
  ChevronRight,
  Info,
  Package,
  RefreshCw,
  AlertCircle,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Label } from '@horizon-sync/ui/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';
import { Switch } from '@horizon-sync/ui/components/ui/switch';
import { Textarea } from '@horizon-sync/ui/components/ui/textarea';

import { landingPageApi } from '../../api/landing-page';
import { useQSealProducts } from '../../hooks/useQSealProducts';
import type {
  LandingPageConfig,
  SocialLink,
  SocialPlatform,
  FeedbackType,
  CTAButtonStyle,
  CustomField,
  FooterLink,
} from '../../types/landing-page.types';
import { SOCIAL_PLATFORM_INFO } from '../../types/landing-page.types';

// ══════════════════════════════════════════════════════════════════════════════
// Social Media Icons (inline SVG)
// ══════════════════════════════════════════════════════════════════════════════

function SocialIcon({ platform, size = 16 }: { platform: SocialPlatform; size?: number }) {
  const s = size;
  switch (platform) {
    case 'facebook':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z" />
        </svg>
      );
    case 'twitter':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
      );
    case 'instagram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
          <circle cx="12" cy="12" r="5" />
          <circle cx="17.5" cy="6.5" r="1" fill="currentColor" stroke="none" />
        </svg>
      );
    case 'linkedin':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433c-1.144 0-2.063-.926-2.063-2.065 0-1.138.92-2.063 2.063-2.063 1.14 0 2.064.925 2.064 2.063 0 1.139-.925 2.065-2.064 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
        </svg>
      );
    case 'youtube':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M23.498 6.186a3.016 3.016 0 0 0-2.122-2.136C19.505 3.545 12 3.545 12 3.545s-7.505 0-9.377.505A3.017 3.017 0 0 0 .502 6.186C0 8.07 0 12 0 12s0 3.93.502 5.814a3.016 3.016 0 0 0 2.122 2.136c1.871.505 9.376.505 9.376.505s7.505 0 9.377-.505a3.015 3.015 0 0 0 2.122-2.136C24 15.93 24 12 24 12s0-3.93-.502-5.814zM9.545 15.568V8.432L15.818 12l-6.273 3.568z" />
        </svg>
      );
    case 'whatsapp':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 0 1-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 0 1-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 0 1 2.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0 0 12.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 0 0 5.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 0 0-3.48-8.413z" />
        </svg>
      );
    case 'telegram':
      return (
        <svg width={s} height={s} viewBox="0 0 24 24" fill="currentColor">
          <path d="M11.944 0A12 12 0 0 0 0 12a12 12 0 0 0 12 12 12 12 0 0 0 12-12A12 12 0 0 0 12 0a12 12 0 0 0-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 0 1 .171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.48.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
        </svg>
      );
    case 'website':
      return <Globe size={s} />;
    case 'other':
    default:
      return <Link size={s} />;
  }
}

// ══════════════════════════════════════════════════════════════════════════════
// Default Config
// ══════════════════════════════════════════════════════════════════════════════

const DEFAULT_CONFIG: LandingPageConfig = {
  product_id: '',
  logo_url: null,
  banner_image_url: null,
  primary_color: '#1a56db',
  accent_color: '#f59e0b',
  product_details: {
    show_gtin: true,
    show_batch: true,
    show_mfg_date: true,
    show_expiry_date: true,
    show_serial_number: false,
    custom_fields: [],
  },
  social_links: [],
  feedback: {
    enabled: false,
    type: 'none',
    title: 'Share Your Feedback',
    description: 'We value your opinion. Help us improve!',
    survey_url: '',
    thank_you_message: 'Thank you for your feedback!',
  },
  warranty: {
    enabled: false,
    title: 'Product Warranty',
    description: 'This product is covered under our warranty program.',
    cta_text: 'Register Warranty',
    cta_url: '',
  },
  custom_cta: {
    enabled: false,
    button_text: 'Learn More',
    button_url: '',
    button_style: 'primary',
  },
  footer: {
    text: '© 2026 Your Company. All rights reserved.',
    show_powered_by: true,
    custom_links: [],
  },
};

// ══════════════════════════════════════════════════════════════════════════════
// Collapsible Section Wrapper
// ══════════════════════════════════════════════════════════════════════════════

function CollapsibleSection({
  icon: Icon,
  title,
  defaultOpen = false,
  children,
}: {
  icon: React.ComponentType<{ className?: string }>;
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = React.useState(defaultOpen);
  return (
    <div className="rounded-lg border bg-card">
      <button type="button"
        className="flex w-full items-center justify-between px-4 py-3 hover:bg-muted/50 transition-colors"
        onClick={() => setOpen(!open)}>
        <div className="flex items-center gap-2 text-sm font-semibold">
          <Icon className="h-4 w-4 text-primary" />
          {title}
        </div>
        {open ? <ChevronDown className="h-4 w-4 text-muted-foreground" /> : <ChevronRight className="h-4 w-4 text-muted-foreground" />}
      </button>
      {open && (
        <div className="px-4 pb-4 pt-0 space-y-3 border-t">{children}</div>
      )}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Sub-component: Image Upload
// ══════════════════════════════════════════════════════════════════════════════

function ImageUploadField({
  label,
  hint,
  value,
  onChange,
}: {
  label: string;
  hint: string;
  value: string | null;
  onChange: (url: string | null) => void;
}) {
  const inputRef = React.useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    // In production, this would call landingPageApi.uploadImage()
    onChange(URL.createObjectURL(file));
  };

  return (
    <div className="space-y-1.5">
      <Label className="text-xs">{label}</Label>
      {value ? (
        <div className="relative rounded-md border overflow-hidden bg-muted/30 h-20">
          <img src={value} alt={label} className="w-full h-full object-contain" />
          <Button type="button"
            variant="ghost"
            size="icon"
            className="absolute top-1 right-1 h-6 w-6 bg-background/80"
            onClick={() => onChange(null)}>
            <X className="h-3 w-3" />
          </Button>
        </div>
      ) : (
        <button type="button"
          className="flex w-full items-center justify-center gap-2 rounded-md border-2 border-dashed p-4 text-xs text-muted-foreground hover:border-primary/50 transition-colors"
          onClick={() => inputRef.current?.click()}>
          <Upload className="h-4 w-4" />
          {hint}
        </button>
      )}
      <input ref={inputRef}
        type="file"
        accept="image/png,image/jpeg"
        className="hidden"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}/>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Visuals (Logo + Banner + Colors)
// ══════════════════════════════════════════════════════════════════════════════

function VisualsSection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
  return (
    <CollapsibleSection icon={Image} title="Visuals & Branding" defaultOpen>
      <div className="grid grid-cols-2 gap-3">
        <ImageUploadField label="Logo"
          hint="Upload Logo"
          value={config.logo_url}
          onChange={(v) => setConfig((c) => ({ ...c, logo_url: v }))}/>
        <ImageUploadField label="Banner Image"
          hint="Upload Banner"
          value={config.banner_image_url}
          onChange={(v) => setConfig((c) => ({ ...c, banner_image_url: v }))}/>
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label className="text-xs">Primary Color</Label>
          <div className="flex items-center gap-2">
            <Input type="color"
              value={config.primary_color}
              onChange={(e) => setConfig((c) => ({ ...c, primary_color: e.target.value }))}
              className="h-8 w-12 p-0.5 cursor-pointer"/>
            <Input value={config.primary_color}
              onChange={(e) => setConfig((c) => ({ ...c, primary_color: e.target.value }))}
              className="h-8 text-xs font-mono"
              placeholder="#1a56db"/>
          </div>
        </div>
        <div className="space-y-1">
          <Label className="text-xs">Accent Color</Label>
          <div className="flex items-center gap-2">
            <Input type="color"
              value={config.accent_color}
              onChange={(e) => setConfig((c) => ({ ...c, accent_color: e.target.value }))}
              className="h-8 w-12 p-0.5 cursor-pointer"/>
            <Input value={config.accent_color}
              onChange={(e) => setConfig((c) => ({ ...c, accent_color: e.target.value }))}
              className="h-8 text-xs font-mono"
              placeholder="#f59e0b"/>
          </div>
        </div>
      </div>
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Product Details
// ══════════════════════════════════════════════════════════════════════════════

function ProductDetailsSection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
  const pd = config.product_details;

  const toggle = (key: keyof typeof pd) => {
    setConfig((c) => ({
      ...c,
      product_details: { ...c.product_details, [key]: !c.product_details[key] },
    }));
  };

  const addCustomField = () => {
    setConfig((c) => ({
      ...c,
      product_details: {
        ...c.product_details,
        custom_fields: [...c.product_details.custom_fields, { label: '', value: '' }],
      },
    }));
  };

  const updateCustomField = (idx: number, field: 'label' | 'value', val: string) => {
    setConfig((c) => {
      const fields = [...c.product_details.custom_fields];
      fields[idx] = { ...fields[idx], [field]: val };
      return { ...c, product_details: { ...c.product_details, custom_fields: fields } };
    });
  };

  const removeCustomField = (idx: number) => {
    setConfig((c) => ({
      ...c,
      product_details: {
        ...c.product_details,
        custom_fields: c.product_details.custom_fields.filter((_, i) => i !== idx),
      },
    }));
  };

  return (
    <CollapsibleSection icon={Info} title="Authentic Product Details" defaultOpen>
      <div className="grid grid-cols-2 gap-x-4 gap-y-2">
        {([
          ['show_gtin', 'GTIN'],
          ['show_batch', 'Batch Number'],
          ['show_mfg_date', 'Mfg. Date'],
          ['show_expiry_date', 'Expiry Date'],
          ['show_serial_number', 'Serial Number'],
        ] as const).map(([key, label]) => (
          <div key={key} className="flex items-center justify-between">
            <Label className="text-xs cursor-pointer" onClick={() => toggle(key)}>
              {label}
            </Label>
            <Switch checked={pd[key]} onCheckedChange={() => toggle(key)} />
          </div>
        ))}
      </div>

      {/* Custom Fields */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <Label className="text-xs font-semibold">Custom Fields</Label>
          <Button variant="ghost" size="sm" className="h-6 text-xs" onClick={addCustomField}>
            <Plus className="h-3 w-3 mr-1" />
            Add
          </Button>
        </div>
        {pd.custom_fields.map((field: CustomField, i: number) => (
          <div key={i} className="flex items-center gap-2">
            <Input value={field.label}
              onChange={(e) => updateCustomField(i, 'label', e.target.value)}
              placeholder="Label"
              className="h-7 text-xs flex-1"/>
            <Input value={field.value}
              onChange={(e) => updateCustomField(i, 'value', e.target.value)}
              placeholder="Value"
              className="h-7 text-xs flex-1"/>
            <Button variant="ghost"
              size="icon"
              className="h-7 w-7 shrink-0"
              onClick={() => removeCustomField(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Social Media Links
// ══════════════════════════════════════════════════════════════════════════════

function SocialLinksSection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
  const platforms = Object.entries(SOCIAL_PLATFORM_INFO) as [SocialPlatform, (typeof SOCIAL_PLATFORM_INFO)[SocialPlatform]][];

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
          <Switch checked={link.enabled}
            onCheckedChange={(v) => updateLink(i, { enabled: v })}/>
          <span className="text-xs font-medium w-20 shrink-0 flex items-center gap-1.5">
            <SocialIcon platform={link.platform} size={14} />
            {SOCIAL_PLATFORM_INFO[link.platform]?.label ?? link.platform}
          </span>
          <Input value={link.url}
            onChange={(e) => updateLink(i, { url: e.target.value })}
            placeholder={SOCIAL_PLATFORM_INFO[link.platform]?.placeholder}
            className="h-7 text-xs flex-1"/>
          <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeLink(i)}>
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

// ══════════════════════════════════════════════════════════════════════════════
// Section: Feedback / Survey
// ══════════════════════════════════════════════════════════════════════════════

function FeedbackSection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
  const fb = config.feedback;

  return (
    <CollapsibleSection icon={MessageSquare} title="Feedback & Survey">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Enable Feedback / Survey</Label>
        <Switch checked={fb.enabled}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, feedback: { ...c.feedback, enabled: v } }))
          }/>
      </div>
      {fb.enabled && (
        <>
          <div className="space-y-1">
            <Label className="text-xs">Type</Label>
            <Select value={fb.type}
              onValueChange={(v) =>
                setConfig((c) => ({ ...c, feedback: { ...c.feedback, type: v as FeedbackType } }))
              }>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="feedback">Feedback Form</SelectItem>
                <SelectItem value="survey">Survey Link</SelectItem>
                <SelectItem value="none">None</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Input value={fb.title}
            onChange={(e) =>
              setConfig((c) => ({ ...c, feedback: { ...c.feedback, title: e.target.value } }))
            }
            placeholder="Section title"
            className="h-8 text-xs"/>
          <Textarea value={fb.description}
            onChange={(e) =>
              setConfig((c) => ({ ...c, feedback: { ...c.feedback, description: e.target.value } }))
            }
            placeholder="Description text"
            className="text-xs"
            rows={2}/>
          {fb.type === 'survey' && (
            <Input value={fb.survey_url ?? ''}
              onChange={(e) =>
                setConfig((c) => ({ ...c, feedback: { ...c.feedback, survey_url: e.target.value } }))
              }
              placeholder="Survey URL (e.g. Google Forms)"
              className="h-8 text-xs"/>
          )}
        </>
      )}
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Warranty
// ══════════════════════════════════════════════════════════════════════════════

function WarrantySection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
  const w = config.warranty;

  return (
    <CollapsibleSection icon={Shield} title="Warranty">
      <div className="flex items-center justify-between">
        <Label className="text-xs">Enable Warranty Section</Label>
        <Switch checked={w.enabled}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, warranty: { ...c.warranty, enabled: v } }))
          }/>
      </div>
      {w.enabled && (
        <>
          <Input value={w.title}
            onChange={(e) =>
              setConfig((c) => ({ ...c, warranty: { ...c.warranty, title: e.target.value } }))
            }
            placeholder="Section title"
            className="h-8 text-xs"/>
          <Textarea value={w.description}
            onChange={(e) =>
              setConfig((c) => ({
                ...c,
                warranty: { ...c.warranty, description: e.target.value },
              }))
            }
            placeholder="Description text"
            className="text-xs"
            rows={2}/>
          <div className="grid grid-cols-2 gap-2">
            <Input value={w.cta_text}
              onChange={(e) =>
                setConfig((c) => ({ ...c, warranty: { ...c.warranty, cta_text: e.target.value } }))
              }
              placeholder="CTA Button Text"
              className="h-8 text-xs"/>
            <Input value={w.cta_url}
              onChange={(e) =>
                setConfig((c) => ({ ...c, warranty: { ...c.warranty, cta_url: e.target.value } }))
              }
              placeholder="CTA Button URL"
              className="h-8 text-xs"/>
          </div>
        </>
      )}
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Section: Custom CTA Button
// ══════════════════════════════════════════════════════════════════════════════

function CustomCTASection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
  const cta = config.custom_cta;
  const styles: CTAButtonStyle[] = ['primary', 'secondary', 'outline'];

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
                {styles.map((s) => (
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

// ══════════════════════════════════════════════════════════════════════════════
// Section: Footer
// ══════════════════════════════════════════════════════════════════════════════

function FooterSection({
  config,
  setConfig,
}: {
  config: LandingPageConfig;
  setConfig: React.Dispatch<React.SetStateAction<LandingPageConfig>>;
}) {
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
      footer: { ...c.footer, custom_links: c.footer.custom_links.filter((_, i) => i !== idx) },
    }));
  };

  return (
    <CollapsibleSection icon={Layout} title="Custom Footer">
      <Input value={config.footer.text}
        onChange={(e) =>
          setConfig((c) => ({ ...c, footer: { ...c.footer, text: e.target.value } }))
        }
        placeholder="Footer copyright text"
        className="h-8 text-xs"/>
      <div className="flex items-center justify-between">
        <Label className="text-xs">Show "Powered by QSeal"</Label>
        <Switch checked={config.footer.show_powered_by}
          onCheckedChange={(v) =>
            setConfig((c) => ({ ...c, footer: { ...c.footer, show_powered_by: v } }))
          }/>
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
            <Input value={link.label}
              onChange={(e) => updateLink(i, 'label', e.target.value)}
              placeholder="Label"
              className="h-7 text-xs flex-1"/>
            <Input value={link.url}
              onChange={(e) => updateLink(i, 'url', e.target.value)}
              placeholder="URL"
              className="h-7 text-xs flex-1"/>
            <Button variant="ghost" size="icon" className="h-7 w-7 shrink-0" onClick={() => removeLink(i)}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        ))}
      </div>
    </CollapsibleSection>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Mobile Preview
// ══════════════════════════════════════════════════════════════════════════════

function MobilePreview({ config }: { config: LandingPageConfig }) {
  const primary = config.primary_color || '#1a56db';
  const accent = config.accent_color || '#f59e0b';

  const ctaStyleClasses: Record<string, string> = {
    primary: 'text-white hover:opacity-90',
    secondary: 'bg-white border text-gray-800 hover:bg-gray-50',
    outline: 'bg-transparent border-2 text-white border-white hover:bg-white/10',
  };

  const visibleSocials = config.social_links.filter((l) => l.enabled && l.url);

  return (
    <div className="flex justify-center">
      {/* Phone frame */}
      <div className="w-[375px] min-h-[700px] rounded-[3rem] border-[6px] border-gray-800 bg-white overflow-hidden shadow-2xl relative">
        {/* Notch */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-28 h-6 bg-gray-800 rounded-b-2xl z-10" />

        {/* Scrollable content */}
        <div className="h-full overflow-y-auto pt-8 pb-4">
          {/* Banner */}
          {config.banner_image_url && (
            <div className="w-full h-36 overflow-hidden">
              <img src={config.banner_image_url}
                alt="Banner"
                className="w-full h-full object-cover"/>
            </div>
          )}

          {/* Logo */}
          {config.logo_url && (
            <div className="flex justify-center -mt-10 relative z-10">
              <div className="w-20 h-20 rounded-xl border-4 border-white bg-white shadow-md overflow-hidden">
                <img src={config.logo_url}
                  alt="Logo"
                  className="w-full h-full object-contain p-1"/>
              </div>
            </div>
          )}

          {/* Product Details */}
          <div className="px-5 mt-3 space-y-3">
            {/* Title */}
            <div className="text-center">
              <h3 className="text-lg font-bold text-gray-900">Authentic Product</h3>
              <p className="text-xs text-gray-500">Verified by QSeal</p>
            </div>

            {/* Details */}
            <div className="rounded-xl border bg-gray-50/50 p-4 space-y-2">
              {config.product_details.show_gtin && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">GTIN</span>
                  <span className="font-mono font-medium">8901234567890</span>
                </div>
              )}
              {config.product_details.show_batch && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Batch No.</span>
                  <span className="font-mono font-medium">B2026-07-001</span>
                </div>
              )}
              {config.product_details.show_mfg_date && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Mfg. Date</span>
                  <span className="font-medium">15 Jul 2026</span>
                </div>
              )}
              {config.product_details.show_expiry_date && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Expiry Date</span>
                  <span className="font-medium">14 Jul 2028</span>
                </div>
              )}
              {config.product_details.show_serial_number && (
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Serial No.</span>
                  <span className="font-mono font-medium">SN-2026-0001</span>
                </div>
              )}
              {config.product_details.custom_fields.map(
                (f: CustomField, i: number) =>
                  f.label && (
                    <div key={i} className="flex justify-between text-xs">
                      <span className="text-gray-500">{f.label}</span>
                      <span className="font-medium">{f.value || '—'}</span>
                    </div>
                  ),
              )}
            </div>

            {/* Feedback / Survey */}
            {config.feedback.enabled && config.feedback.type !== 'none' && (
              <div className="rounded-xl p-4 text-white text-center"
                style={{ background: primary }}>
                <p className="font-semibold text-sm">{config.feedback.title || 'Share Your Feedback'}</p>
                {config.feedback.description && (
                  <p className="text-xs mt-1 opacity-90">{config.feedback.description}</p>
                )}
                <button type="button"
                  className="mt-2 px-4 py-1.5 rounded-full bg-white text-sm font-medium hover:bg-white/90 transition-colors"
                  style={{ color: primary }}>
                  {config.feedback.type === 'survey' ? 'Take Survey' : 'Give Feedback'}
                </button>
              </div>
            )}

            {/* Warranty */}
            {config.warranty.enabled && (
              <div className="rounded-xl border p-4 text-center">
                <Shield className="h-5 w-5 mx-auto" style={{ color: primary }} />
                <p className="font-semibold text-sm mt-1">{config.warranty.title || 'Product Warranty'}</p>
                {config.warranty.description && (
                  <p className="text-xs text-gray-500 mt-1">{config.warranty.description}</p>
                )}
                {config.warranty.cta_text && (
                  <button type="button"
                    className="mt-2 px-4 py-1.5 rounded-full text-sm font-medium text-white transition-colors hover:opacity-90"
                    style={{ background: primary }}>
                    {config.warranty.cta_text}
                  </button>
                )}
              </div>
            )}

            {/* Custom CTA */}
            {config.custom_cta.enabled && config.custom_cta.button_text && (
              <div className="text-center">
                <button type="button"
                  className={`px-6 py-2 rounded-full text-sm font-semibold transition-colors ${
                    ctaStyleClasses[config.custom_cta.button_style] || ctaStyleClasses.primary
                  }`}
                  style={
                    config.custom_cta.button_style !== 'secondary'
                      ? { background: primary }
                      : { borderColor: primary, color: primary }
                  }>
                  {config.custom_cta.button_text}
                </button>
              </div>
            )}

            {/* Social Links */}
            {visibleSocials.length > 0 && (
              <div className="text-center pt-2">
                <p className="text-xs text-gray-400 mb-2">Follow Us</p>
                <div className="flex justify-center gap-3">
                  {visibleSocials.map((link, i) => (
                    <a key={i}
                      href={link.url || '#'}
                      className="w-9 h-9 rounded-full flex items-center justify-center transition-colors hover:opacity-80"
                      style={{ background: primary, color: '#fff' }}
                      title={SOCIAL_PLATFORM_INFO[link.platform]?.label}>
                      <SocialIcon platform={link.platform} size={16} />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="mt-4 px-5 py-4 border-t bg-gray-50 text-center space-y-1">
            {config.footer.text && (
              <p className="text-[10px] text-gray-400">{config.footer.text}</p>
            )}
            {config.footer.custom_links.length > 0 && (
              <div className="flex justify-center gap-3">
                {config.footer.custom_links.map(
                  (link: FooterLink, i: number) =>
                    link.label && (
                      <a key={i}
                        href={link.url || '#'}
                        className="text-[10px] text-gray-500 hover:underline">
                        {link.label}
                      </a>
                    ),
                )}
              </div>
            )}
            {config.footer.show_powered_by && (
              <p className="text-[10px] text-gray-300">Powered by QSeal</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
// Main Landing Page Tab
// ══════════════════════════════════════════════════════════════════════════════

export function LandingPageTab() {
  const accessToken = useUserStore((s) => s.accessToken);
  const { products, loading: productsLoading } = useQSealProducts(1, {});

  const [selectedProductId, setSelectedProductId] = React.useState<string>('');
  const [config, setConfig] = React.useState<LandingPageConfig>(DEFAULT_CONFIG);
  const [configId, setConfigId] = React.useState<string | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [saving, setSaving] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [fetchError, setFetchError] = React.useState<string | null>(null);

  // Fetch landing page config when product is selected
  React.useEffect(() => {
    if (!selectedProductId || !accessToken) return;
    setLoading(true);
    setFetchError(null);
    landingPageApi
      .get(accessToken, selectedProductId)
      .then((res) => {
        setConfig(res.config);
        setConfigId(res.config.product_id);
      })
      .catch((err: unknown) => {
        const apiErr = err as { message?: string; status?: number };
        if (apiErr.status === 404) {
          // No config exists yet — use defaults
          setConfig({ ...DEFAULT_CONFIG, product_id: selectedProductId });
          setConfigId(null);
        } else {
          setFetchError(apiErr.message || 'Failed to load landing page config');
        }
      })
      .finally(() => setLoading(false));
  }, [selectedProductId, accessToken]);

  const handleSave = async () => {
    if (!selectedProductId || !accessToken) return;
    setSaving(true);
    setError(null);
    try {
      let res;
      if (configId) {
        // Update existing
        res = await landingPageApi.update(accessToken, selectedProductId, config);
      } else {
        // Create new
        res = await landingPageApi.create(accessToken, selectedProductId, config);
      }
      setConfig(res.config);
      setConfigId(res.config.product_id);
    } catch (err: unknown) {
      const apiErr = err as { message?: string };
      setError(apiErr.message || 'Failed to save landing page');
    } finally {
      setSaving(false);
    }
  };

  const hasProduct = !!selectedProductId;

  const renderContent = () => {
    if (!hasProduct) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <Package className="h-12 w-12 mb-4 opacity-30" />
          <p className="text-sm font-medium">Select a product to get started</p>
          <p className="text-xs mt-1">Choose a product from the dropdown above to design its landing page.</p>
        </div>
      );
    }

    if (loading) {
      return (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-32 w-full rounded-lg" />
            ))}
          </div>
          <Skeleton className="h-[700px] w-full rounded-xl" />
        </div>
      );
    }

    if (fetchError) {
      return (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <AlertCircle className="h-12 w-12 mb-4 text-destructive opacity-50" />
          <p className="text-sm font-medium text-destructive">{fetchError}</p>
          <Button variant="outline" size="sm" className="mt-2" onClick={() => setSelectedProductId(selectedProductId)}>
            <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
            Retry
          </Button>
        </div>
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Editor ──────────────────────────────────────────── */}
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          <VisualsSection config={config} setConfig={setConfig} />
          <ProductDetailsSection config={config} setConfig={setConfig} />
          <SocialLinksSection config={config} setConfig={setConfig} />
          <FeedbackSection config={config} setConfig={setConfig} />
          <WarrantySection config={config} setConfig={setConfig} />
          <CustomCTASection config={config} setConfig={setConfig} />
          <FooterSection config={config} setConfig={setConfig} />
        </div>

        {/* ── Right: Preview ────────────────────────────────────────── */}
        <div>
          <div className="sticky top-4">
            <div className="flex items-center gap-2 mb-3">
              <Smartphone className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm font-medium text-muted-foreground">Live Preview — Mobile View</span>
            </div>
            <div className="bg-gray-100 rounded-xl p-4 flex justify-center max-h-[calc(100vh-250px)] overflow-y-auto">
              <MobilePreview config={config} />
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold">Landing Page Builder</h3>
          <p className="text-xs text-muted-foreground">
            Design the landing page that customers see after scanning the QR code. Changes are
            reflected in the live preview on the right.
          </p>
        </div>
        <div className="flex items-center gap-3">
          {/* Product Selector */}
          <div className="flex items-center gap-2">
            <Package className="h-4 w-4 text-muted-foreground" />
            <Select value={selectedProductId} onValueChange={setSelectedProductId} disabled={productsLoading}>
              <SelectTrigger className="w-[220px] h-8 text-xs">
                <SelectValue placeholder={productsLoading ? 'Loading products…' : 'Select a product'} />
              </SelectTrigger>
              <SelectContent>
                {products.map((p) => (
                  <SelectItem key={p.id} value={p.id} className="text-xs">
                    {p.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button onClick={handleSave} disabled={saving || !hasProduct} size="sm">
            {saving ? 'Saving...' : 'Save Changes'}
          </Button>
        </div>
      </div>

      {error && (
        <div className="flex items-center gap-2 rounded-md bg-destructive/10 px-3 py-2 text-sm text-destructive">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {error}
        </div>
      )}

      {renderContent()}
    </div>
  );
}
