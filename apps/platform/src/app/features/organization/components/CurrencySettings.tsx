import * as React from 'react';
import { Plus, Trash2, Star } from 'lucide-react';

import { Button, Card, CardContent, CardDescription, CardHeader, CardTitle, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import type { CurrencyConfig } from '../../../types/organization-settings.types';
import { validateCurrencies } from '../../../utils/organization-settings.utils';

interface CurrencySettingsProps {
  currencies: CurrencyConfig[];
  onChange: (currencies: CurrencyConfig[]) => void;
  disabled?: boolean;
}

const COMMON_CURRENCIES = [
  { code: 'USD', symbol: '$', name: 'US Dollar', precision: 2 },
  { code: 'EUR', symbol: '€', name: 'Euro', precision: 2 },
  { code: 'GBP', symbol: '£', name: 'British Pound', precision: 2 },
  { code: 'INR', symbol: '₹', name: 'Indian Rupee', precision: 2 },
  { code: 'JPY', symbol: '¥', name: 'Japanese Yen', precision: 0 },
  { code: 'CNY', symbol: '¥', name: 'Chinese Yuan', precision: 2 },
  { code: 'AUD', symbol: 'A$', name: 'Australian Dollar', precision: 2 },
  { code: 'CAD', symbol: 'C$', name: 'Canadian Dollar', precision: 2 },
  { code: 'CHF', symbol: 'CHF', name: 'Swiss Franc', precision: 2 },
  { code: 'BHD', symbol: 'BD', name: 'Bahraini Dinar', precision: 3 },
];

export function CurrencySettings({ currencies, onChange, disabled }: CurrencySettingsProps) {
  const { toast } = useToast();

  const handleAddCurrency = () => {
    const newCurrency: CurrencyConfig = {
      code: 'USD',
      symbol: '$',
      is_base_currency: currencies.length === 0,
      precision: 2,
      name: 'US Dollar',
    };
    onChange([...currencies, newCurrency]);
  };

  const handleRemoveCurrency = (index: number) => {
    if (currencies[index].is_base_currency) {
      toast({
        title: 'Cannot Remove',
        description: 'Cannot remove the base currency. Set another currency as base first.',
        variant: 'destructive',
      });
      return;
    }
    const updated = currencies.filter((_, i) => i !== index);
    onChange(updated);
  };

  const handleSetBaseCurrency = (index: number) => {
    const updated = currencies.map((c, i) => ({
      ...c,
      is_base_currency: i === index,
    }));
    onChange(updated);
  };

  const handleUpdateCurrency = (index: number, field: keyof CurrencyConfig, value: any) => {
    const updated = [...currencies];
    updated[index] = { ...updated[index], [field]: value };
    onChange(updated);
  };

  const handleSelectCommonCurrency = (index: number, currencyCode: string) => {
    const commonCurrency = COMMON_CURRENCIES.find((c) => c.code === currencyCode);
    if (commonCurrency) {
      handleUpdateCurrency(index, 'code', commonCurrency.code);
      handleUpdateCurrency(index, 'symbol', commonCurrency.symbol);
      handleUpdateCurrency(index, 'name', commonCurrency.name);
      handleUpdateCurrency(index, 'precision', commonCurrency.precision);
    }
  };

  const validation = validateCurrencies(currencies);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Supported Currencies</CardTitle>
        <CardDescription>
          Configure currencies for your organization. The base currency is used for FIFO valuation and ledger calculations.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {!validation.valid && (
          <div className="rounded-lg border border-destructive bg-destructive/10 p-3">
            <p className="text-sm text-destructive">{validation.error}</p>
          </div>
        )}

        {currencies.map((currency, index) => (
          <div key={index} className="rounded-lg border p-4 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant={currency.is_base_currency ? 'default' : 'outline'}
                  size="sm"
                  onClick={() => handleSetBaseCurrency(index)}
                  disabled={disabled}
                  className="gap-2"
                >
                  <Star className={`h-3 w-3 ${currency.is_base_currency ? 'fill-current' : ''}`} />
                  {currency.is_base_currency ? 'Base Currency' : 'Set as Base'}
                </Button>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                onClick={() => handleRemoveCurrency(index)}
                disabled={disabled || currency.is_base_currency}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label>Currency</Label>
                <Select
                  value={currency.code}
                  onValueChange={(value) => handleSelectCommonCurrency(index, value)}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {COMMON_CURRENCIES.map((c) => (
                      <SelectItem key={c.code} value={c.code}>
                        {c.code} - {c.name} ({c.symbol})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label>Symbol</Label>
                <Input
                  value={currency.symbol}
                  onChange={(e) => handleUpdateCurrency(index, 'symbol', e.target.value)}
                  disabled={disabled}
                  placeholder="$"
                />
              </div>

              <div className="space-y-2">
                <Label>Code (ISO 4217)</Label>
                <Input
                  value={currency.code}
                  onChange={(e) => handleUpdateCurrency(index, 'code', e.target.value.toUpperCase())}
                  disabled={disabled}
                  placeholder="USD"
                  maxLength={3}
                />
              </div>

              <div className="space-y-2">
                <Label>Decimal Precision</Label>
                <Select
                  value={String(currency.precision)}
                  onValueChange={(value) => handleUpdateCurrency(index, 'precision', Number(value))}
                  disabled={disabled}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0">0 (e.g., ¥100)</SelectItem>
                    <SelectItem value="2">2 (e.g., $100.00)</SelectItem>
                    <SelectItem value="3">3 (e.g., BD 100.000)</SelectItem>
                    <SelectItem value="4">4 (e.g., 100.0000)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>
        ))}

        <Button type="button" variant="outline" onClick={handleAddCurrency} disabled={disabled} className="w-full gap-2">
          <Plus className="h-4 w-4" />
          Add Currency
        </Button>
      </CardContent>
    </Card>
  );
}
