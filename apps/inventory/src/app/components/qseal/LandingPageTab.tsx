import * as React from 'react';

import {
  Package,
  Smartphone,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@horizon-sync/ui/components/ui/select';
import { Skeleton } from '@horizon-sync/ui/components/ui/skeleton';

import { landingPageApi } from '../../api/landing-page';
import { useQSealProducts } from '../../hooks/useQSealProducts';
import type { LandingPageConfig } from '../../types/landing-page.types';

import {
  VisualsSection,
  ProductDetailsSection,
  SocialLinksSection,
  FeedbackSection,
  WarrantySection,
  CustomCTASection,
  FooterSection,
  MobilePreview,
} from './landing-page';

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
// Sub-states
// ══════════════════════════════════════════════════════════════════════════════

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <Package className="h-12 w-12 mb-4 opacity-30" />
      <p className="text-sm font-medium">Select a product to get started</p>
      <p className="text-xs mt-1">
        Choose a product from the dropdown above to design its landing page.
      </p>
    </div>
  );
}

function LoadingState() {
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

function ErrorState({ message, onRetry }: { message: string; onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
      <AlertCircle className="h-12 w-12 mb-4 text-destructive opacity-50" />
      <p className="text-sm font-medium text-destructive">{message}</p>
      <Button variant="outline" size="sm" className="mt-2" onClick={onRetry}>
        <RefreshCw className="h-3.5 w-3.5 mr-1.5" />
        Retry
      </Button>
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
        res = await landingPageApi.update(accessToken, selectedProductId, config);
      } else {
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
    if (!hasProduct) return <EmptyState />;
    if (loading) return <LoadingState />;
    if (fetchError) {
      return (
        <ErrorState message={fetchError}
          onRetry={() => setSelectedProductId(selectedProductId)} />
      );
    }

    return (
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* ── Left: Editor ──────────────────────────────────────────── */}
        <div className="space-y-3 max-h-[calc(100vh-250px)] overflow-y-auto pr-1">
          <VisualsSection config={config} setConfig={setConfig} productId={selectedProductId} accessToken={accessToken} />
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
              <span className="text-sm font-medium text-muted-foreground">
                Live Preview — Mobile View
              </span>
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
            <Select value={selectedProductId}
              onValueChange={setSelectedProductId}
              disabled={productsLoading} >
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
