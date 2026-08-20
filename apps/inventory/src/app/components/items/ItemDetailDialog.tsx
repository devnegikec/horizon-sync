import * as React from 'react';

import {
  Package, Hash, Ruler, DollarSign, Layers, Archive, Calendar,
  BarChart3, Weight, ShieldCheck, Tag, Box, Settings2,
} from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { useCurrencyStore } from '@horizon-sync/store';
import { Badge } from '@horizon-sync/ui/components/ui/badge';
import { DetailDialog } from '@horizon-sync/ui/components';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@horizon-sync/ui/components/ui/tabs';

import type { Item } from '../../types/item.types';
import { getCurrencySymbol } from '../../types/currency.types';
import { apiRequest } from '../../utility/api/core';

// Full API response type for item detail
interface ItemDetailResponse {
  id: string;
  organization_id: string;
  item_code: string;
  item_name: string;
  description: string;
  sku: string | null;
  item_group_id: string | null;
  item_group: { id: string; code: string; name: string } | null;
  item_type: string;
  uom: string;
  maintain_stock: boolean;
  valuation_method: string;
  allow_negative_stock: boolean;
  has_variants: boolean;
  variant_of: string | null;
  variant_attributes: Record<string, unknown>;
  has_batch_no: boolean;
  has_serial_no: boolean;
  batch_number_series: string;
  serial_number_series: string;
  standard_rate: string;
  valuation_rate: string;
  enable_auto_reorder: boolean;
  reorder_level: number;
  reorder_qty: number;
  min_order_qty: number;
  max_order_qty: number;
  weight_per_unit: string;
  weight_uom: string;
  inspection_required_before_purchase: boolean;
  inspection_required_before_delivery: boolean;
  quality_inspection_template: string | null;
  sales_tax_template_id: string | null;
  purchase_tax_template_id: string | null;
  brand_id: string | null;
  gtin: string | null;
  industry: string | null;
  landing_page: string | null;
  warranty_period_months: number | null;
  qr_type: string | null;
  activation_method: string | null;
  sr_number_type: string | null;
  barcode: string;
  status: string;
  image_url: string;
  images: string[];
  tags: string[];
  custom_fields: Record<string, unknown>;
  extra_data: Record<string, unknown>;
  packaging_units: Array<{
    id: string;
    unit_name: string;
    conversion_factor: number;
    items_per_master_pack: number | null;
    length_mm: number | null;
    width_mm: number | null;
    height_mm: number | null;
    weight_grams: number | null;
    is_base_unit: boolean;
  }> | null;
  created_by: string | null;
  updated_by: string | null;
  created_at: string;
  updated_at: string;
}

interface ItemDetailDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  item: Item | null;
}

// --- Shared UI helpers ---

function InfoRow({ icon: Icon, label, value }: { icon: React.ComponentType<{ className?: string }>; label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs text-muted-foreground">{label}</p>
        <p className="text-sm font-medium truncate">{value || <span className="text-muted-foreground">—</span>}</p>
      </div>
    </div>
  );
}

function BooleanRow({ icon: Icon, label, value, trueLabel = 'Yes', falseLabel = 'No' }: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: boolean;
  trueLabel?: string;
  falseLabel?: string;
}) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex h-8 w-8 items-center justify-center rounded-md bg-muted">
        <Icon className="h-4 w-4 text-muted-foreground" />
      </div>
      <div>
        <p className="text-xs text-muted-foreground">{label}</p>
        <Badge variant={value ? 'success' : 'secondary'} className="text-xs">
          {value ? trueLabel : falseLabel}
        </Badge>
      </div>
    </div>
  );
}

function SectionCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border p-4">
      <h4 className="text-sm font-semibold mb-3 text-primary">{title}</h4>
      {children}
    </div>
  );
}

// --- Tab content components ---

function OverviewTab({ detail }: { detail: ItemDetailResponse }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Item Details">
        {detail.description && (
          <p className="text-sm text-muted-foreground mb-4">{detail.description}</p>
        )}
        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={Hash} label="Item Code" value={detail.item_code} />
          <InfoRow icon={Tag} label="SKU" value={detail.sku} />
          <InfoRow icon={Ruler} label="Unit of Measure" value={detail.uom} />
          <InfoRow icon={Layers} label="Item Group" value={detail.item_group?.name} />
          <InfoRow icon={Box} label="Item Type" value={detail.item_type ? detail.item_type.charAt(0).toUpperCase() + detail.item_type.slice(1) : ''} />
          <InfoRow icon={Tag} label="Barcode" value={detail.barcode} />
          <InfoRow icon={Calendar} label="Created" value={detail.created_at ? new Date(detail.created_at).toLocaleDateString() : ''} />
          <InfoRow icon={Calendar} label="Updated" value={detail.updated_at ? new Date(detail.updated_at).toLocaleDateString() : ''} />
        </div>
      </SectionCard>

      <QrProductDetailsCard detail={detail} />

      <PackagingDetailsCard detail={detail} />

      {detail.tags && detail.tags.length > 0 && (
        <SectionCard title="Tags">
          <div className="flex flex-wrap gap-2">
            {detail.tags.map((tag) => (
              <Badge key={tag} variant="outline">{tag}</Badge>
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

function PackagingDetailsCard({ detail }: { detail: ItemDetailResponse }) {
  const units = detail.packaging_units ?? [];
  if (units.length === 0) {
    return (
      <SectionCard title="Packaging Details">
        <p className="text-sm text-muted-foreground">No packaging details configured</p>
      </SectionCard>
    );
  }

  const base = units.find((u) => u.is_base_unit) ?? units[0];
  const hasDimensions = base.length_mm != null && base.width_mm != null && base.height_mm != null;

  return (
    <SectionCard title="Packaging Details">
      <div className="grid grid-cols-2 gap-4">
        <InfoRow icon={Box} label="Base Unit" value={base.unit_name} />
        <InfoRow icon={Layers} label="Conversion Factor" value={base.conversion_factor} />
        <InfoRow icon={Package} label="Items per Master Pack" value={base.items_per_master_pack ?? undefined} />
        <InfoRow
          icon={Ruler}
          label="Dimensions (L × W × H)"
          value={hasDimensions ? `${base.length_mm} × ${base.width_mm} × ${base.height_mm} mm` : undefined}
        />
        <InfoRow
          icon={Weight}
          label="Weight"
          value={base.weight_grams != null ? `${base.weight_grams} g` : undefined}
        />
      </div>
    </SectionCard>
  );
}

function QrProductDetailsCard({ detail }: { detail: ItemDetailResponse }) {
  const hasContent = !!(
    detail.gtin ||
    detail.industry ||
    detail.qr_type ||
    detail.activation_method ||
    detail.sr_number_type ||
    detail.warranty_period_months != null ||
    detail.landing_page
  );

  if (!hasContent) return null;

  return (
    <SectionCard title="QR / Product Details">
      <div className="grid grid-cols-2 gap-4">
        <InfoRow icon={Hash} label="GTIN" value={detail.gtin} />
        <InfoRow icon={Layers} label="Industry" value={detail.industry} />
        <InfoRow icon={Settings2} label="QR Type" value={detail.qr_type} />
        <InfoRow icon={Settings2} label="Activation Method" value={detail.activation_method} />
        <InfoRow icon={Settings2} label="SR Number Type" value={detail.sr_number_type} />
        <InfoRow icon={Calendar} label="Warranty (months)" value={detail.warranty_period_months ?? undefined} />
        <InfoRow icon={Tag} label="Landing Page" value={detail.landing_page} />
      </div>
    </SectionCard>
  );
}

function StockPricingTab({ detail, currencySymbol }: { detail: ItemDetailResponse; currencySymbol: string }) {
  const standardRate = detail.standard_rate ? parseFloat(detail.standard_rate) : 0;
  const valuationRate = detail.valuation_rate ? parseFloat(detail.valuation_rate) : 0;

  return (
    <div className="space-y-4">
      <SectionCard title="Pricing">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={DollarSign} label="Standard Rate" value={`${currencySymbol}${standardRate.toFixed(2)}`} />
          <InfoRow icon={DollarSign} label="Valuation Rate" value={valuationRate ? `${currencySymbol}${valuationRate.toFixed(2)}` : undefined} />
          <InfoRow icon={BarChart3} label="Valuation Method" value={detail.valuation_method} />
        </div>
      </SectionCard>

      <SectionCard title="Stock Settings">
        <div className="grid grid-cols-2 gap-4">
          <BooleanRow icon={Archive} label="Maintain Stock" value={detail.maintain_stock} />
          <BooleanRow icon={Archive} label="Allow Negative Stock" value={detail.allow_negative_stock} />
        </div>
      </SectionCard>

      <SectionCard title="Variants & Tracking">
        <div className="grid grid-cols-2 gap-4">
          <BooleanRow icon={Layers} label="Has Variants" value={detail.has_variants} />
          <BooleanRow icon={Hash} label="Has Batch No" value={detail.has_batch_no} />
          <BooleanRow icon={Hash} label="Has Serial No" value={detail.has_serial_no} />
        </div>
        {detail.batch_number_series && (
          <InfoRow icon={Settings2} label="Batch Number Series" value={detail.batch_number_series} />
        )}
        {detail.serial_number_series && (
          <InfoRow icon={Settings2} label="Serial Number Series" value={detail.serial_number_series} />
        )}
      </SectionCard>
    </div>
  );
}

function QualityReorderTab({ detail }: { detail: ItemDetailResponse }) {
  return (
    <div className="space-y-4">
      <SectionCard title="Reorder Settings">
        <div className="grid grid-cols-2 gap-4">
          <BooleanRow icon={Settings2} label="Auto Reorder" value={detail.enable_auto_reorder} trueLabel="Enabled" falseLabel="Disabled" />
          <InfoRow icon={BarChart3} label="Reorder Level" value={detail.reorder_level} />
          <InfoRow icon={BarChart3} label="Reorder Qty" value={detail.reorder_qty} />
          <InfoRow icon={BarChart3} label="Min Order Qty" value={detail.min_order_qty} />
          <InfoRow icon={BarChart3} label="Max Order Qty" value={detail.max_order_qty} />
        </div>
      </SectionCard>

      <SectionCard title="Quality Inspection">
        <div className="grid grid-cols-2 gap-4">
          <BooleanRow icon={ShieldCheck} label="Inspection Before Purchase" value={detail.inspection_required_before_purchase} trueLabel="Required" falseLabel="Not Required" />
          <BooleanRow icon={ShieldCheck} label="Inspection Before Delivery" value={detail.inspection_required_before_delivery} trueLabel="Required" falseLabel="Not Required" />
        </div>
      </SectionCard>

      <SectionCard title="Weight">
        <div className="grid grid-cols-2 gap-4">
          <InfoRow icon={Weight} label="Weight Per Unit" value={detail.weight_per_unit || undefined} />
          <InfoRow icon={Weight} label="Weight UOM" value={detail.weight_uom} />
        </div>
      </SectionCard>
    </div>
  );
}

function AdditionalTab({ detail }: { detail: ItemDetailResponse }) {
  const hasImages = detail.images && detail.images.length > 0;
  const hasCustomFields = detail.custom_fields && Object.keys(detail.custom_fields).length > 0;
  const hasExtraData = detail.extra_data && Object.keys(detail.extra_data).length > 0;
  const hasContent = hasImages || hasCustomFields || hasExtraData;

  if (!hasContent) {
    return (
      <div className="flex h-full min-h-[320px] flex-col items-center justify-center text-muted-foreground">
        <Settings2 className="h-8 w-8 mb-2 opacity-50" />
        <p className="text-sm">No additional data configured</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {hasImages && (
        <SectionCard title="Images">
          <div className="grid grid-cols-4 gap-2">
            {detail.images.map((img, idx) => (
              <img key={idx} src={img} alt={`${detail.item_name} ${idx + 1}`} className="rounded-md border object-cover h-20 w-full" />
            ))}
          </div>
        </SectionCard>
      )}

      {hasCustomFields && (
        <SectionCard title="Custom Fields">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(detail.custom_fields).map(([key, value]) => (
              <InfoRow key={key} icon={Settings2} label={key} value={String(value)} />
            ))}
          </div>
        </SectionCard>
      )}

      {hasExtraData && (
        <SectionCard title="Extra Data">
          <div className="grid grid-cols-2 gap-4">
            {Object.entries(detail.extra_data).map(([key, value]) => (
              <InfoRow key={key} icon={Settings2} label={key} value={String(value)} />
            ))}
          </div>
        </SectionCard>
      )}
    </div>
  );
}

// --- Main dialog ---

function DetailTabs({ detail, currencySymbol }: { detail: ItemDetailResponse; currencySymbol: string }) {
  return (
    <Tabs defaultValue="overview" className="flex min-h-0 flex-1 flex-col">
      <TabsList className="w-full shrink-0">
        <TabsTrigger value="overview" className="flex-1">Overview</TabsTrigger>
        <TabsTrigger value="stock" className="flex-1">Stock & Pricing</TabsTrigger>
        <TabsTrigger value="quality" className="flex-1">Quality & Reorder</TabsTrigger>
        <TabsTrigger value="additional" className="flex-1">Additional</TabsTrigger>
      </TabsList>

      <TabsContent value="overview" className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <OverviewTab detail={detail} />
      </TabsContent>
      <TabsContent value="stock" className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <StockPricingTab detail={detail} currencySymbol={currencySymbol} />
      </TabsContent>
      <TabsContent value="quality" className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <QualityReorderTab detail={detail} />
      </TabsContent>
      <TabsContent value="additional" className="mt-4 min-h-0 flex-1 overflow-y-auto">
        <AdditionalTab detail={detail} />
      </TabsContent>
    </Tabs>
  );
}

export function ItemDetailDialog({ open, onOpenChange, item }: ItemDetailDialogProps) {
  const accessToken = useUserStore((s) => s.accessToken);
  const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
  const currencySymbol = getCurrencySymbol(baseCurrency || 'USD');
  const [detail, setDetail] = React.useState<ItemDetailResponse | null>(null);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    if (!open || !item?.id || !accessToken) {
      setDetail(null);
      return;
    }

    setLoading(true);
    setError(null);

    apiRequest<ItemDetailResponse>(`/items/${item.id}`, accessToken)
      .then((data) => setDetail(data))
      .catch((err) => setError(err.message || 'Failed to load item details'))
      .finally(() => setLoading(false));
  }, [open, item?.id, accessToken]);

  if (!item) return null;

  const standardRate = detail?.standard_rate ? parseFloat(detail.standard_rate) : item.defaultPrice;

  return (
    <DetailDialog
      open={open}
      onOpenChange={onOpenChange}
      size="lg"
      contentClassName="max-w-4xl flex flex-col"
      style={{ height: 'min(85vh, 820px)' }}
      title={detail?.item_name || item.name}
      loading={loading}
      loadingMessage="Loading details..."
    >
      {error && (
        <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-4 text-sm text-destructive mb-4">
          {error}
        </div>
      )}

      {detail && !loading && (
        <div className="flex h-full min-h-0 flex-col">
          <div className="flex items-center justify-between gap-4 mb-4 shrink-0">
            <div className="min-w-0">
              <p className="text-sm text-muted-foreground font-mono">{detail.item_code}</p>
              <Badge variant={detail.status === 'active' ? 'success' : 'secondary'} className="mt-1">
                {detail.status}
              </Badge>
            </div>
            <div className="text-right shrink-0">
              <p className="text-2xl font-bold">{currencySymbol}{standardRate.toFixed(2)}</p>
              <p className="text-xs text-muted-foreground">Standard Rate</p>
            </div>
          </div>
          <DetailTabs detail={detail} currencySymbol={currencySymbol} />
        </div>
      )}
    </DetailDialog>
  );
}
