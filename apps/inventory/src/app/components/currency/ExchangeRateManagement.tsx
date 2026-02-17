import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
} from '@horizon-sync/ui/components';
import { SUPPORTED_CURRENCIES, getCurrencySymbol } from '../../types/currency.types';
import type { ExchangeRate, CreateExchangeRatePayload } from '../../types/currency.types';

interface ExchangeRateManagementProps {
  baseCurrency?: string;
}

export function ExchangeRateManagement({ baseCurrency = 'USD' }: ExchangeRateManagementProps) {
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [editingRate, setEditingRate] = useState<ExchangeRate | null>(null);

  // Form state for adding/editing rates
  const [formData, setFormData] = useState<CreateExchangeRatePayload>({
    from_currency: baseCurrency,
    to_currency: '',
    rate: 1.0,
    effective_date: new Date().toISOString().split('T')[0],
  });

  useEffect(() => {
    loadExchangeRates();
  }, []);

  const loadExchangeRates = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/currency/exchange-rates');
      // const data = await response.json();
      // setExchangeRates(data);
      
      // Mock data for now
      setExchangeRates([
        {
          id: '1',
          from_currency: 'USD',
          to_currency: 'EUR',
          rate: 0.85,
          effective_date: '2024-01-01',
          created_at: '2024-01-01T00:00:00Z',
        },
        {
          id: '2',
          from_currency: 'USD',
          to_currency: 'GBP',
          rate: 0.73,
          effective_date: '2024-01-01',
          created_at: '2024-01-01T00:00:00Z',
        },
      ]);
    } catch (err) {
      setError('Failed to load exchange rates');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      // TODO: Replace with actual API call
      // if (editingRate) {
      //   await fetch(`/api/v1/currency/exchange-rates/${editingRate.id}`, {
      //     method: 'PUT',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      //   });
      // } else {
      //   await fetch('/api/v1/currency/exchange-rates', {
      //     method: 'POST',
      //     headers: { 'Content-Type': 'application/json' },
      //     body: JSON.stringify(formData),
      //   });
      // }

      // Mock success
      console.log('Saving exchange rate:', formData);
      
      // Reset form
      setFormData({
        from_currency: baseCurrency,
        to_currency: '',
        rate: 1.0,
        effective_date: new Date().toISOString().split('T')[0],
      });
      setEditingRate(null);
      
      // Reload rates
      await loadExchangeRates();
    } catch (err) {
      setError('Failed to save exchange rate');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (rate: ExchangeRate) => {
    setEditingRate(rate);
    setFormData({
      from_currency: rate.from_currency,
      to_currency: rate.to_currency,
      rate: rate.rate,
      effective_date: rate.effective_date,
    });
  };

  const handleCancelEdit = () => {
    setEditingRate(null);
    setFormData({
      from_currency: baseCurrency,
      to_currency: '',
      rate: 1.0,
      effective_date: new Date().toISOString().split('T')[0],
    });
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Exchange Rate Management</h2>
        <p className="text-muted-foreground mt-1">
          Manage currency exchange rates for multi-currency transactions
        </p>
      </div>

      {/* Add/Edit Exchange Rate Form */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">
          {editingRate ? 'Edit Exchange Rate' : 'Add Exchange Rate'}
        </h3>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            {/* From Currency */}
            <div className="space-y-2">
              <Label htmlFor="from_currency">
                From Currency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.from_currency}
                onValueChange={(value) => setFormData({ ...formData, from_currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* To Currency */}
            <div className="space-y-2">
              <Label htmlFor="to_currency">
                To Currency <span className="text-destructive">*</span>
              </Label>
              <Select
                value={formData.to_currency}
                onValueChange={(value) => setFormData({ ...formData, to_currency: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select currency" />
                </SelectTrigger>
                <SelectContent>
                  {SUPPORTED_CURRENCIES.filter(c => c.code !== formData.from_currency).map((currency) => (
                    <SelectItem key={currency.code} value={currency.code}>
                      {currency.code} - {currency.name} ({currency.symbol})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {/* Exchange Rate */}
            <div className="space-y-2">
              <Label htmlFor="rate">
                Exchange Rate <span className="text-destructive">*</span>
              </Label>
              <Input
                id="rate"
                type="number"
                step="0.000001"
                min="0"
                value={formData.rate}
                onChange={(e) => setFormData({ ...formData, rate: parseFloat(e.target.value) || 0 })}
                placeholder="1.0"
                required
              />
              {formData.from_currency && formData.to_currency && (
                <p className="text-xs text-muted-foreground">
                  1 {formData.from_currency} = {formData.rate} {formData.to_currency}
                </p>
              )}
            </div>

            {/* Effective Date */}
            <div className="space-y-2">
              <Label htmlFor="effective_date">
                Effective Date <span className="text-destructive">*</span>
              </Label>
              <Input
                id="effective_date"
                type="date"
                value={formData.effective_date}
                onChange={(e) => setFormData({ ...formData, effective_date: e.target.value })}
                required
              />
            </div>
          </div>

          {error && (
            <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-sm text-destructive">{error}</p>
            </div>
          )}

          <div className="flex gap-2">
            <Button type="submit" disabled={loading || !formData.to_currency}>
              {loading ? 'Saving...' : editingRate ? 'Update Rate' : 'Add Rate'}
            </Button>
            {editingRate && (
              <Button type="button" variant="outline" onClick={handleCancelEdit}>
                Cancel
              </Button>
            )}
          </div>
        </form>
      </Card>

      {/* Exchange Rates List */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Current Exchange Rates</h3>
        
        {loading && !exchangeRates.length ? (
          <p className="text-muted-foreground">Loading exchange rates...</p>
        ) : exchangeRates.length === 0 ? (
          <p className="text-muted-foreground">No exchange rates configured yet.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">From</th>
                  <th className="text-left py-3 px-4">To</th>
                  <th className="text-right py-3 px-4">Rate</th>
                  <th className="text-left py-3 px-4">Effective Date</th>
                  <th className="text-right py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {exchangeRates.map((rate) => (
                  <tr key={rate.id} className="border-b hover:bg-muted/50">
                    <td className="py-3 px-4">
                      <span className="font-medium">{rate.from_currency}</span>
                      <span className="text-muted-foreground ml-1">
                        ({getCurrencySymbol(rate.from_currency)})
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-medium">{rate.to_currency}</span>
                      <span className="text-muted-foreground ml-1">
                        ({getCurrencySymbol(rate.to_currency)})
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right font-mono">
                      {rate.rate.toFixed(6)}
                    </td>
                    <td className="py-3 px-4">
                      {new Date(rate.effective_date).toLocaleDateString()}
                    </td>
                    <td className="py-3 px-4 text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(rate)}
                      >
                        Edit
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>
    </div>
  );
}
