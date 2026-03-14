import React, { useState, useEffect } from 'react';

import { Plus, Trash2, Save, Loader2, AlertCircle, CheckCircle2, Database, Trash } from 'lucide-react';

import { useUserStore } from '@horizon-sync/store';
import {
  Card,
  CardContent,
  Button,
  Input,
  Label,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Badge,
} from '@horizon-sync/ui/components';
import { useToast } from '@horizon-sync/ui/hooks';

import type {
  DefaultAccountMapping,
  DefaultAccountUpdate,
  AccountCodeFormat,
  Account,
  AccountListItem,
  AccountPaginationResponse,
  DefaultAccountUpdateResponse,
} from '../../types/account.types';
import { accountApi } from '../../utility/api/accounts';
import { environment } from '../../../environments/environment';

interface TransactionTypeConfig {
  transaction_type: string;
  scenario: string | null;
  account_id: string;
  account?: AccountListItem | null;
  validationError?: string | null;
}

const COMMON_TRANSACTION_TYPES = [
  'payment',
  'sales_invoice',
  'purchase_invoice',
  'inventory_purchase',
  'inventory_sale',
  'accounts_payable',
  'accounts_receivable',
  'sales_revenue',
  'cost_of_goods_sold',
  'purchase_expense',
  'payment_received',
  'payment_made',
  'inventory_adjustment',
];

const FORMAT_EXAMPLES = [
  { pattern: '^[0-9]{4}-[0-9]{2}$', example: '1000-01', description: 'Four digits, dash, two digits' },
  { pattern: '^[0-9]{4}$', example: '1000', description: 'Four digits only' },
  { pattern: '^[A-Z]{2}-[0-9]{4}$', example: 'AS-1000', description: 'Two letters, dash, four digits' },
  { pattern: '^[0-9]{1}-[0-9]{4}$', example: '1-1000', description: 'One digit, dash, four digits' },
];

export const SystemConfiguration: React.FC = () => {
  const { accessToken } = useUserStore();
  const { toast } = useToast();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [seeding, setSeeding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Default accounts state
  const [defaultAccounts, setDefaultAccounts] = useState<TransactionTypeConfig[]>([]);
  const [availableAccounts, setAvailableAccounts] = useState<AccountListItem[]>([]);
  const [loadingAccounts, setLoadingAccounts] = useState(false);

  // Account code format state
  const [codeFormat, setCodeFormat] = useState<AccountCodeFormat>({
    format_pattern: '',
    example: null,
  });
  const [customPattern, setCustomPattern] = useState('');
  const [patternError, setPatternError] = useState<string | null>(null);
  const [patternValid, setPatternValid] = useState<boolean>(false);

  useEffect(() => {
    loadConfiguration();
  }, []);

  const loadConfiguration = async () => {
    if (!accessToken) return;

    try {
      setLoading(true);
      setError(null);

      // Load default accounts
      const defaultsResponse = await accountApi.getDefaultAccounts(accessToken);
      const mappings = defaultsResponse as DefaultAccountMapping[];

      const configs: TransactionTypeConfig[] = mappings.map((mapping) => ({
        transaction_type: mapping.transaction_type,
        scenario: mapping.scenario,
        account_id: mapping.account_id,
        account: mapping.account_code ? {
          id: mapping.account_id,
          account_code: mapping.account_code,
          account_name: mapping.account_name || '',
          account_type: mapping.account_type || 'ASSET',
        } as AccountListItem : null,
      }));

      setDefaultAccounts(configs);

      // Load account code format
      const formatResponse = await accountApi.getAccountCodeFormat(accessToken);
      const format = formatResponse as AccountCodeFormat;
      setCodeFormat(format);
      setCustomPattern(format.format_pattern);
      validatePattern(format.format_pattern);

      // Load available accounts for selection
      await loadAvailableAccounts();
    } catch (err) {
      console.error('Failed to load configuration:', err);
      setError(err instanceof Error ? err.message : 'Failed to load configuration');
    } finally {
      setLoading(false);
    }
  };

  const loadAvailableAccounts = async () => {
    if (!accessToken) return;

    try {
      setLoadingAccounts(true);
      const response = await accountApi.list(accessToken, 1, 1000, { status: 'active' }) as AccountPaginationResponse;
      
      // Filter to only show posting accounts (is_posting_account = true)
      // Non-posting accounts are parent/group accounts and should not be used for transactions
      const postingAccounts = (response.chart_of_accounts || []).filter(
        account => account.is_posting_account === true
      );
      
      setAvailableAccounts(postingAccounts);
    } catch (err) {
      console.error('Failed to load accounts:', err);
    } finally {
      setLoadingAccounts(false);
    }
  };

  const handleAddDefaultAccount = () => {
    setDefaultAccounts([
      ...defaultAccounts,
      {
        transaction_type: '',
        scenario: null,
        account_id: '',
        account: null,
        validationError: null,
      },
    ]);
  };

  const handleRemoveDefaultAccount = (index: number) => {
    setDefaultAccounts(defaultAccounts.filter((_, i) => i !== index));
  };

  const handleDefaultAccountChange = (
    index: number,
    field: keyof TransactionTypeConfig,
    value: string | null
  ) => {
    const updated = [...defaultAccounts];
    if (field === 'account_id') {
      updated[index][field] = value || '';
      const account = availableAccounts.find((a) => a.id === value);
      updated[index].account = account || null;
      updated[index].validationError = null; // Clear validation error on change
    } else {
      updated[index][field] = value as never;
      if (field === 'transaction_type') {
        updated[index].validationError = null; // Clear validation error on change
      }
    }
    setDefaultAccounts(updated);
  };

  const handleSaveDefaultAccounts = async () => {
    if (!accessToken) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);

      // Clear previous validation errors
      const clearedAccounts = defaultAccounts.map(config => ({
        ...config,
        validationError: null,
      }));
      setDefaultAccounts(clearedAccounts);

      const invalidEntries = defaultAccounts.filter(
        (config) => !config.transaction_type || !config.account_id
      );

      if (invalidEntries.length > 0) {
        setError('All default accounts must have a transaction type and account selected');
        return;
      }

      const updates: DefaultAccountUpdate[] = defaultAccounts.map((config) => ({
        transaction_type: config.transaction_type,
        scenario: config.scenario,
        account_id: config.account_id,
      }));

      const response = await accountApi.updateDefaultAccounts(accessToken, updates) as DefaultAccountUpdateResponse;

      if (response.error_count > 0) {
        // Map errors back to the configurations
        const updatedWithErrors = [...defaultAccounts];
        response.errors.forEach((err: any) => {
          const index = updatedWithErrors.findIndex(
            config => config.transaction_type === err.data?.transaction_type &&
              config.scenario === err.data?.scenario
          );
          if (index !== -1) {
            updatedWithErrors[index].validationError = err.error;
          }
        });
        setDefaultAccounts(updatedWithErrors);

        // Format validation errors for display
        const errorMessages = response.errors.map((err: any) => {
          const txType = err.data?.transaction_type || 'Unknown';
          return `${txType}: ${err.error}`;
        }).join('; ');
        setError(`Validation errors: ${errorMessages}`);
        console.error('Default account errors:', response.errors);
      } else {
        setSuccess(`Successfully saved ${response.success_count} default account mapping(s)`);
      }

      await loadConfiguration();
    } catch (err) {
      console.error('Failed to save default accounts:', err);
      setError(err instanceof Error ? err.message : 'Failed to save default accounts');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveCodeFormat = async () => {
    if (!accessToken) return;

    try {
      setSaving(true);
      setError(null);
      setSuccess(null);
      setPatternError(null);

      if (!customPattern.trim()) {
        setPatternError('Pattern cannot be empty');
        return;
      }

      // Validate regex pattern on frontend before sending
      try {
        new RegExp(customPattern);
      } catch (regexError) {
        setPatternError(`Invalid regex pattern: ${regexError instanceof Error ? regexError.message : 'Invalid syntax'}`);
        return;
      }

      await accountApi.updateAccountCodeFormat(accessToken, customPattern);
      setSuccess('Account code format updated successfully');

      const formatResponse = await accountApi.getAccountCodeFormat(accessToken);
      const format = formatResponse as AccountCodeFormat;
      setCodeFormat(format);
    } catch (err) {
      console.error('Failed to save code format:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to save code format';
      setPatternError(errorMessage);
    } finally {
      setSaving(false);
    }
  };

  const handleSelectFormatExample = (pattern: string) => {
    setCustomPattern(pattern);
    setPatternError(null);
    validatePattern(pattern);
  };

  const validatePattern = (pattern: string) => {
    if (!pattern.trim()) {
      setPatternValid(false);
      return;
    }

    try {
      new RegExp(pattern);
      setPatternValid(true);
      setPatternError(null);
    } catch (err) {
      setPatternValid(false);
      setPatternError(err instanceof Error ? err.message : 'Invalid regex pattern');
    }
  };

  const handleSeedData = async () => {
    if (!accessToken) return;

    try {
      setSeeding(true);
      setError(null);

      // Get current user to extract organization_id
      const userResponse = await fetch(`${environment.apiBaseUrl}/identity/me`, {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user information');
      }

      const userData = await userResponse.json();
      const organizationId = userData.organization_id;

      if (!organizationId) {
        throw new Error('No organization found for current user');
      }

      // Call the manual trigger endpoint (same as identity service uses)
      // This uses DefaultChartSetupService with proper validation
      const response = await fetch(
        `${environment.apiCoreUrl}/setup/default-chart-of-accounts/${organizationId}/trigger`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            currency: 'USD',
            force_recreate: false,
          }),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to seed data');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message || 'Sample data seeded successfully. Refresh the page to see new accounts.',
        variant: 'default',
      });

      setSuccess('Sample data seeded successfully! Refresh the page to see the new accounts.');

      // Reload configuration after seeding
      setTimeout(() => {
        loadConfiguration();
      }, 2000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to seed data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  const handleClearData = async () => {
    if (!accessToken) return;

    const confirmed = window.confirm(
      'Are you sure you want to delete ALL accounts? This action cannot be undone!'
    );

    if (!confirmed) return;

    try {
      setSeeding(true);
      setError(null);

      const response = await fetch(`${environment.apiCoreUrl}/admin/clear-data`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to clear data');
      }

      const result = await response.json();

      toast({
        title: 'Success',
        description: result.message || 'All accounts deleted successfully.',
        variant: 'default',
      });

      setSuccess('All accounts deleted successfully!');

      // Reload configuration after clearing
      setTimeout(() => {
        loadConfiguration();
      }, 1000);

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to clear data';
      setError(errorMessage);
      toast({
        title: 'Error',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setSeeding(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-3xl font-bold tracking-tight">System Configuration</h2>
        <p className="text-muted-foreground mt-2">
          Configure default accounts and account code format patterns
        </p>
      </div>

      {error && (
        <div className="rounded-lg border border-destructive bg-destructive/10 p-4">
          <div className="flex items-center gap-2">
            <AlertCircle className="h-4 w-4 text-destructive" />
            <p className="text-sm text-destructive">{error}</p>
          </div>
        </div>
      )}

      {success && (
        <div className="rounded-lg border border-green-500 bg-green-50 p-4">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="h-4 w-4 text-green-600" />
            <p className="text-sm text-green-900">{success}</p>
          </div>
        </div>
      )}

      {/* Development Tools - Seed Data */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-dashed border-2 border-amber-300 bg-amber-50/50">
          <CardContent className="pt-6">
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Database className="h-5 w-5 text-amber-600" />
                  Development Tools
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  These tools are only available in development mode for testing purposes.
                </p>
              </div>

              <div className="flex gap-3">
                <Button onClick={handleSeedData}
                  disabled={seeding}
                  variant="outline"
                  className="gap-2 border-amber-300 hover:bg-amber-100">
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Seeding...
                    </>
                  ) : (
                    <>
                      <Database className="h-4 w-4" />
                      Create Default Chart of Accounts
                    </>
                  )}
                </Button>

                <Button onClick={handleClearData}
                  disabled={seeding}
                  variant="outline"
                  className="gap-2 border-red-300 hover:bg-red-100 text-red-600">
                  {seeding ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Clearing...
                    </>
                  ) : (
                    <>
                      <Trash className="h-4 w-4" />
                      Clear All Accounts
                    </>
                  )}
                </Button>
              </div>

              <div className="rounded-lg bg-amber-100 p-3 text-sm text-amber-900">
                <p className="font-medium">Note:</p>
                <ul className="list-disc list-inside mt-1 space-y-1">
                  <li>Seed data creates 35+ GL accounts with proper hierarchy</li>
                  <li>Includes accounts for all types (Assets, Liabilities, Equity, Revenue, Expenses)</li>
                  <li>Creates default account mappings for common transaction types</li>
                  <li>Validates account codes against your configured format</li>
                  <li>Idempotent - safe to call multiple times (won't create duplicates)</li>
                  <li>Clear data will DELETE ALL accounts - use with caution!</li>
                  <li>Refresh the page after seeding to see the new accounts</li>
                </ul>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardContent className="pt-6">
          <div className="flex justify-between items-center mb-4">
            <div>
              <h3 className="text-lg font-semibold">Default Accounts</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Configure default accounts for common transaction types
              </p>
            </div>
            <Button onClick={handleAddDefaultAccount}
              disabled={saving}
              size="sm">
              <Plus className="h-4 w-4 mr-2" />
              Add Mapping
            </Button>
          </div>

          {defaultAccounts.length === 0 ? (
            <div className="rounded-lg border bg-muted/50 p-4">
              <p className="text-sm text-muted-foreground">
                No default accounts configured. Click "Add Mapping" to create one.
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {defaultAccounts.map((config, index) => (
                <div key={index} className="space-y-2">
                  <div className={`flex gap-4 p-4 border rounded-lg items-start ${config.validationError ? 'border-destructive bg-destructive/5' : ''
                      }`}>
                    <div className="flex-1 space-y-2">
                      <Label>Transaction Type</Label>
                      <Select value={config.transaction_type}
                        onValueChange={(value) =>
                          handleDefaultAccountChange(index, 'transaction_type', value)
                        }
                        disabled={saving}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                          {COMMON_TRANSACTION_TYPES.map((type) => (
                            <SelectItem key={type} value={type}>
                              {type.replace(/_/g, ' ').replace(/\b\w/g, (l) => l.toUpperCase())}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label>Scenario (Optional)</Label>
                      <Input value={config.scenario || ''}
                        onChange={(e) =>
                          handleDefaultAccountChange(index, 'scenario', e.target.value || null)
                        }
                        placeholder="e.g., domestic, international"
                        disabled={saving}/>
                    </div>

                    <div className="flex-1 space-y-2">
                      <Label>Account</Label>
                      <Select value={config.account_id}
                        onValueChange={(value) =>
                          handleDefaultAccountChange(index, 'account_id', value)
                        }
                        disabled={saving || loadingAccounts}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select account" />
                        </SelectTrigger>
                        <SelectContent>
                          {availableAccounts.map((account) => (
                            <SelectItem key={account.id} value={account.id}>
                              {account.account_code} - {account.account_name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {config.account && (
                        <p className="text-xs text-muted-foreground">
                          Type: {config.account.account_type}
                        </p>
                      )}
                    </div>

                    <Button variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveDefaultAccount(index)}
                      disabled={saving}
                      className="mt-8">
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>

                  {config.validationError && (
                    <div className="px-4">
                      <p className="text-sm text-destructive flex items-center gap-1">
                        <AlertCircle className="h-4 w-4" />
                        {config.validationError}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}

          <div className="flex justify-end mt-6">
            <Button onClick={handleSaveDefaultAccounts}
              disabled={saving || defaultAccounts.length === 0}>
              {saving ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="h-4 w-4 mr-2" />
                  Save Default Accounts
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardContent className="pt-6">
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-semibold">Account Code Format</h3>
              <p className="text-sm text-muted-foreground mt-1">
                Define the format pattern for account codes using regular expressions
              </p>
            </div>

            <div>
              <Label className="text-sm font-medium">Current Format</Label>
              <div className="flex gap-4 items-center mt-2">
                <Badge variant="secondary">{codeFormat.format_pattern}</Badge>
                {codeFormat.example && (
                  <span className="text-sm text-muted-foreground">
                    Example: <strong>{codeFormat.example}</strong>
                  </span>
                )}
              </div>
            </div>

            <div className="border-t pt-6">
              <Label className="text-sm font-medium">Common Format Patterns</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {FORMAT_EXAMPLES.map((format) => (
                  <Badge key={format.pattern}
                    variant={customPattern === format.pattern ? 'default' : 'outline'}
                    className="cursor-pointer"
                    onClick={() => handleSelectFormatExample(format.pattern)}>
                    {format.example} - {format.description}
                  </Badge>
                ))}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="pattern">Custom Pattern (Regex)</Label>
              <div className="relative">
                <Input id="pattern"
                  value={customPattern}
                  onChange={(e) => {
                    setCustomPattern(e.target.value);
                    validatePattern(e.target.value);
                  }}
                  disabled={saving}
                  placeholder="Enter regex pattern"
                  className={patternError ? 'border-destructive' : patternValid ? 'border-green-500' : ''}/>
                {patternValid && !patternError && customPattern.trim() && (
                  <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-green-600" />
                )}
              </div>
              {patternError && (
                <p className="text-sm text-destructive flex items-center gap-1">
                  <AlertCircle className="h-4 w-4" />
                  {patternError}
                </p>
              )}
              {patternValid && !patternError && customPattern.trim() && (
                <p className="text-sm text-green-600 flex items-center gap-1">
                  <CheckCircle2 className="h-4 w-4" />
                  Valid regex pattern
                </p>
              )}
              <p className="text-sm text-muted-foreground">
                Enter a valid regular expression pattern for account codes
              </p>
            </div>

            <div className="rounded-lg border bg-muted/50 p-4">
              <div className="space-y-1">
                <p className="font-medium text-sm">Pattern Syntax:</p>
                <ul className="text-sm space-y-1 ml-4 text-muted-foreground">
                  <li>• <code>^</code> - Start of string</li>
                  <li>• <code>$</code> - End of string</li>
                  <li>• <code>[0-9]</code> - Any digit</li>
                  <li>• <code>[A-Z]</code> - Any uppercase letter</li>
                  <li>• <code>{'{'}</code>n<code>{'}'}</code> - Exactly n occurrences</li>
                </ul>
              </div>
            </div>

            <div className="flex justify-end">
              <Button onClick={handleSaveCodeFormat}
                disabled={saving || !customPattern.trim() || !patternValid}>
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4 mr-2" />
                    Save Format Pattern
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};
