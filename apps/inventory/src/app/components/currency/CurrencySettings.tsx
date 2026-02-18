import * as React from 'react';
import { useState, useEffect } from 'react';
import {
  Button,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Card,
} from '@horizon-sync/ui/components';
import { SUPPORTED_CURRENCIES } from '../../types/currency.types';

export function CurrencySettings() {
  const [baseCurrency, setBaseCurrency] = useState<string>('USD');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    loadBaseCurrency();
  }, []);

  const loadBaseCurrency = async () => {
    setLoading(true);
    setError(null);
    try {
      // TODO: Replace with actual API call
      // const response = await fetch('/api/v1/currency/base-currency');
      // const data = await response.json();
      // setBaseCurrency(data.base_currency);
      
      // Mock data for now
      setBaseCurrency('USD');
    } catch (err) {
      setError('Failed to load base currency');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleBaseCurrencyChange = (value: string) => {
    setBaseCurrency(value);
    setHasChanges(true);
    setSuccess(false);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    setSuccess(false);

    try {
      // TODO: Replace with actual API call
      // await fetch('/api/v1/currency/base-currency', {
      //   method: 'PUT',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ base_currency: baseCurrency }),
      // });

      // Mock success
      console.log('Saving base currency:', baseCurrency);
      setSuccess(true);
      setHasChanges(false);
      
      // Clear success message after 3 seconds
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      setError('Failed to save base currency');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const selectedCurrency = SUPPORTED_CURRENCIES.find(c => c.code === baseCurrency);

  return (
    <Card className="p-6">
      <div className="space-y-4">
        <div>
          <h3 className="text-lg font-semibold">Base Currency</h3>
          <p className="text-sm text-muted-foreground mt-1">
            Set the primary currency for your organization. All financial reports will use this currency.
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="base_currency">
            Base Currency <span className="text-destructive">*</span>
          </Label>
          <Select
            value={baseCurrency}
            onValueChange={handleBaseCurrencyChange}
            disabled={loading}
          >
            <SelectTrigger className="max-w-md">
              <SelectValue placeholder="Select base currency" />
            </SelectTrigger>
            <SelectContent>
              {SUPPORTED_CURRENCIES.map((currency) => (
                <SelectItem key={currency.code} value={currency.code}>
                  <div className="flex items-center gap-2">
                    <span className="font-medium">{currency.code}</span>
                    <span className="text-muted-foreground">-</span>
                    <span>{currency.name}</span>
                    <span className="text-muted-foreground">({currency.symbol})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          
          {selectedCurrency && (
            <p className="text-sm text-muted-foreground">
              Selected: {selectedCurrency.name} ({selectedCurrency.symbol})
            </p>
          )}
        </div>

        {error && (
          <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
            <p className="text-sm text-destructive">{error}</p>
          </div>
        )}

        {success && (
          <div className="p-3 bg-green-50 border border-green-200 rounded-md">
            <p className="text-sm text-green-800">Base currency updated successfully!</p>
          </div>
        )}

        <div className="flex gap-2">
          <Button 
            onClick={handleSave} 
            disabled={loading || !hasChanges}
          >
            {loading ? 'Saving...' : 'Save Changes'}
          </Button>
          {hasChanges && (
            <Button 
              variant="outline" 
              onClick={loadBaseCurrency}
              disabled={loading}
            >
              Cancel
            </Button>
          )}
        </div>

        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <div className="flex gap-2">
            <svg
              className="h-5 w-5 text-amber-600 flex-shrink-0"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              />
            </svg>
            <div>
              <p className="text-sm font-medium text-amber-800">Important Note</p>
              <p className="text-sm text-amber-700 mt-1">
                Changing the base currency will affect how all financial reports are calculated. 
                Existing transactions will be converted using historical exchange rates.
              </p>
            </div>
          </div>
        </div>
      </div>
    </Card>
  );
}
