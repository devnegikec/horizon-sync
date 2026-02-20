import * as React from 'react';

import { DollarSign } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@horizon-sync/ui/components/ui/card';
import { Label } from '@horizon-sync/ui/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@horizon-sync/ui/components/ui/select';
import { useToast } from '@horizon-sync/ui/hooks/use-toast';

import { useUpdateOrganization } from '../hooks/useUpdateOrganization';
import { SUPPORTED_CURRENCIES, DEFAULT_CURRENCY } from '../types/organization.types';

interface CurrencySettingsProps {
  organizationId: string;
  accessToken: string;
  currentSettings: Record<string, unknown> | null;
  canEdit: boolean;
}

/**
 * CurrencySettings Component
 * 
 * Display and manage organization currency configuration.
 * 
 * Requirements: 7.3, 4.1, 4.2, 4.3, 4.4, 4.5, 4.6, 4.7
 */
export function CurrencySettings({ organizationId, accessToken, currentSettings, canEdit }: CurrencySettingsProps) {
  const { toast } = useToast();
  const { updateOrganization } = useUpdateOrganization();

  // Requirement 4.1, 4.2: Extract currency from settings or default to USD
  const currentCurrency = (currentSettings?.currency as string) || DEFAULT_CURRENCY;

  // State for selected currency and updating status
  const [selectedCurrency, setSelectedCurrency] = React.useState(currentCurrency);
  const [isUpdating, setIsUpdating] = React.useState(false);

  // Update local state when currentSettings changes
  React.useEffect(() => {
    setSelectedCurrency((currentSettings?.currency as string) || DEFAULT_CURRENCY);
  }, [currentSettings]);

  /**
   * Handle currency change
   * Requirements: 4.4, 4.5, 4.6
   */
  const handleCurrencyChange = async (newCurrency: string) => {
    const previousCurrency = selectedCurrency;
    
    // Optimistically update UI
    setSelectedCurrency(newCurrency);
    setIsUpdating(true);

    try {
      // Requirement 4.4: Update organization settings with JSON format
      await updateOrganization(
        organizationId,
        {
          settings: {
            ...currentSettings,
            currency: newCurrency,
          },
        },
        accessToken
      );

      // Requirement 4.5: Display success notification
      toast({
        title: 'Success',
        description: 'Currency updated successfully',
      });
    } catch (err) {
      // Requirement 4.6: Display error notification and revert currency
      setSelectedCurrency(previousCurrency);
      
      toast({
        title: 'Error',
        description: err instanceof Error ? err.message : 'Failed to update currency',
        variant: 'destructive',
      });
    } finally {
      setIsUpdating(false);
    }
  };

  /**
   * Get currency display name with symbol
   */
  const getCurrencyDisplay = (code: string) => {
    const currency = SUPPORTED_CURRENCIES.find((c) => c.code === code);
    return currency ? `${currency.symbol} ${currency.name} (${currency.code})` : code;
  };

  return (
    <Card className="border-border">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600">
            <DollarSign className="h-5 w-5 text-white" />
          </div>
          Currency Settings
        </CardTitle>
        <p className="text-sm text-muted-foreground mt-1">
          Configure your organization&apos;s preferred currency
        </p>
      </CardHeader>
      <CardContent className="space-y-0">
        {/* Currency Configuration */}
        {canEdit ? (
          // Requirement 4.3: Display currency dropdown when canEdit is true
          <div className="space-y-2">
            <Label htmlFor="currency">Preferred Currency</Label>
            <Select value={selectedCurrency} onValueChange={handleCurrencyChange} disabled={isUpdating}>
              <SelectTrigger id="currency" className="w-full">
                <SelectValue placeholder="Select currency" />
              </SelectTrigger>
              <SelectContent>
                {/* Requirement 4.7: Support specified currencies */}
                {SUPPORTED_CURRENCIES.map((currency) => (
                  <SelectItem key={currency.code} value={currency.code}>
                    {currency.symbol} {currency.name} ({currency.code})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {isUpdating && (
              <p className="text-xs text-muted-foreground">Updating currency...</p>
            )}
          </div>
        ) : (
          // View mode: Display current currency
          <div className="flex items-start gap-3 py-3">
            <DollarSign className="h-4 w-4 text-muted-foreground mt-0.5" />
            <div className="flex-1 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">Preferred Currency</p>
              <p className="text-base font-semibold">{getCurrencyDisplay(selectedCurrency)}</p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
