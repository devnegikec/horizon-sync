import * as React from 'react';

import { Check, ChevronsUpDown, Loader2, RotateCcw, Search } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import { Button } from '@horizon-sync/ui/components/ui/button';
import { Input } from '@horizon-sync/ui/components/ui/input';
import { Popover, PopoverContent, PopoverTrigger } from '@horizon-sync/ui/components/ui/popover';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { cn } from '@horizon-sync/ui/lib/utils';

import { qrProductApi } from '../../api/qr-products';
import type {
  BlockStatus,
  QRBlockFilters as Filters,
  QRBlockFilterType,
} from '../../features/qr-management/types/qrBlock.types';
import type { QSealProductListItem } from '../../types/qseal.types';

interface BlockFiltersProps {
  filters: Filters;
  search: string;
  onSearchChange: (value: string) => void;
  onChange: (filters: Filters) => void;
  onReset: () => void;
}

interface ProductFilterProps {
  value?: string;
  onChange: (value?: string) => void;
}

function filtersAreActive(filters: Filters, search: string): boolean {
  return Boolean(search) || Object.values(filters).some(Boolean);
}

function withStatus(filters: Filters, value: string): Filters {
  return {
    ...filters,
    status: value === 'all' ? undefined : value as BlockStatus,
  };
}

function withQrType(filters: Filters, value: string): Filters {
  return {
    ...filters,
    qr_type: value === 'all' ? undefined : value as QRBlockFilterType,
  };
}

function ProductFilter({ value, onChange }: ProductFilterProps) {
  const accessToken = useUserStore((state) => state.accessToken);
  const [open, setOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [products, setProducts] = React.useState<QSealProductListItem[]>([]);
  const [selectedName, setSelectedName] = React.useState('');
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (!value) setSelectedName('');
  }, [value]);

  React.useEffect(() => {
    if (!open || !accessToken) return;
    const timeout = window.setTimeout(async () => {
      setLoading(true);
      try {
        const response = await qrProductApi.list(accessToken, 1, 30, {
          search: search || undefined,
        });
        setProducts(response.products);
      } catch {
        setProducts([]);
      } finally {
        setLoading(false);
      }
    }, 250);
    return () => window.clearTimeout(timeout);
  }, [accessToken, open, search]);

  const selectProduct = (product: QSealProductListItem) => {
    setSelectedName(product.name);
    onChange(product.id);
    setOpen(false);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline"
          role="combobox"
          aria-expanded={open}
          className="w-full justify-between md:w-[210px] font-normal">
          <span className="truncate">{value ? selectedName || 'Selected product' : 'All Products'}</span>
          <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[280px] p-2" align="start">
        <div className="relative mb-2">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search Products…"
            className="pl-8" />
        </div>
        <button type="button"
          onClick={() => { onChange(undefined); setOpen(false); }}
          className="flex w-full items-center rounded-sm px-2 py-2 text-sm hover:bg-accent">
          <Check className={cn('mr-2 h-4 w-4', value ? 'opacity-0' : 'opacity-100')} />
          All Products
        </button>
        {loading && (
          <div className="flex items-center gap-2 px-2 py-3 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" /> Loading…
          </div>
        )}
        {!loading && products.map((product) => (
          <button type="button"
            key={product.id}
            onClick={() => selectProduct(product)}
            className="flex w-full items-center rounded-sm px-2 py-2 text-left text-sm hover:bg-accent">
            <Check className={cn('mr-2 h-4 w-4', value === product.id ? 'opacity-100' : 'opacity-0')} />
            <span className="truncate">{product.name}</span>
          </button>
        ))}
        {!loading && products.length === 0 && (
          <p className="px-2 py-3 text-sm text-muted-foreground">No Products found.</p>
        )}
      </PopoverContent>
    </Popover>
  );
}

export function BlockFilters({
  filters,
  search,
  onSearchChange,
  onChange,
  onReset,
}: BlockFiltersProps) {
  const hasFilters = filtersAreActive(filters, search);

  return (
    <div className="flex flex-nowrap items-center gap-3 overflow-x-auto rounded-lg border bg-card p-4">
      <div className="relative w-[240px] shrink-0">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <Input value={search}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Search batches or products…"
          className="pl-9" />
      </div>

      <ProductFilter value={filters.product_id}
        onChange={(productId) => onChange({ ...filters, product_id: productId })} />

      <Select value={filters.status || 'all'}
        onValueChange={(value) => onChange(withStatus(filters, value))}>
        <SelectTrigger className="w-[145px] shrink-0"><SelectValue placeholder="Status" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All Statuses</SelectItem>
          <SelectItem value="pending">Pending</SelectItem>
          <SelectItem value="in_progress">Generating</SelectItem>
          <SelectItem value="completed">Completed</SelectItem>
          <SelectItem value="failed">Failed</SelectItem>
        </SelectContent>
      </Select>

      <Select value={filters.qr_type || 'all'}
        onValueChange={(value) => onChange(withQrType(filters, value))}>
        <SelectTrigger className="w-[150px] shrink-0"><SelectValue placeholder="QR Type" /></SelectTrigger>
        <SelectContent>
          <SelectItem value="all">All QR Types</SelectItem>
          <SelectItem value="dynamic">Dynamic</SelectItem>
          <SelectItem value="dual">Dual</SelectItem>
          <SelectItem value="secure_code">SecureCode</SelectItem>
          <SelectItem value="one_time">One-Time</SelectItem>
        </SelectContent>
      </Select>

      <label htmlFor="block-created-from" className="flex shrink-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground">From</span>
        <Input id="block-created-from"
          type="date"
          value={filters.created_from || ''}
          max={filters.created_to}
          className="w-[145px]"
          onChange={(event) => onChange({ ...filters, created_from: event.target.value || undefined })} />
      </label>
      <label htmlFor="block-created-to" className="flex shrink-0 items-center gap-2 text-sm">
        <span className="text-muted-foreground">To</span>
        <Input id="block-created-to"
          type="date"
          value={filters.created_to || ''}
          min={filters.created_from}
          className="w-[145px]"
          onChange={(event) => onChange({ ...filters, created_to: event.target.value || undefined })} />
      </label>
      {hasFilters && (
        <Button variant="ghost" size="sm" onClick={onReset} className="shrink-0">
          <RotateCcw className="mr-2 h-4 w-4" /> Reset
        </Button>
      )}
    </div>
  );
}
