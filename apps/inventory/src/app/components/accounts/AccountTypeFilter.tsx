import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  Label,
  Badge,
} from '@horizon-sync/ui/components';

import type { AccountType } from '../../types/account.types';
import { ACCOUNT_TYPE_COLORS } from '../../utils/accountColors';

export interface AccountTypeFilterProps {
  value?: AccountType | 'all';
  onValueChange: (value: AccountType | 'all') => void;
  label?: string;
  placeholder?: string;
  showAllOption?: boolean;
  disabled?: boolean;
  showBadges?: boolean;
}

const ACCOUNT_TYPES: { value: AccountType; label: string; color: string }[] = [
  { value: 'ASSET', label: 'Asset', color: ACCOUNT_TYPE_COLORS.ASSET },
  { value: 'LIABILITY', label: 'Liability', color: ACCOUNT_TYPE_COLORS.LIABILITY },
  { value: 'EQUITY', label: 'Equity', color: ACCOUNT_TYPE_COLORS.EQUITY },
  { value: 'REVENUE', label: 'Revenue', color: ACCOUNT_TYPE_COLORS.REVENUE },
  { value: 'EXPENSE', label: 'Expense', color: ACCOUNT_TYPE_COLORS.EXPENSE },
];

/**
 * Account type filter component with optional badge display
 * 
 * @example
 * ```tsx
 * <AccountTypeFilter
 *   value={accountType}
 *   onValueChange={setAccountType}
 *   label="Account Type"
 *   showAllOption={true}
 * />
 * ```
 */
export function AccountTypeFilter({
  value = 'all',
  onValueChange,
  label = 'Account Type',
  placeholder = 'Select type',
  showAllOption = true,
  disabled = false,
  showBadges = false,
}: AccountTypeFilterProps) {
  const selectedType = ACCOUNT_TYPES.find(t => t.value === value);

  if (showBadges) {
    return (
      <div className="space-y-2">
        {label && <Label>{label}</Label>}
        <div className="flex flex-wrap gap-2">
          {showAllOption && (
            <Badge
              variant={value === 'all' ? 'default' : 'outline'}
              className="cursor-pointer"
              onClick={() => !disabled && onValueChange('all')}
            >
              All Types
            </Badge>
          )}
          {ACCOUNT_TYPES.map((type) => (
            <Badge
              key={type.value}
              variant={value === type.value ? 'default' : 'outline'}
              className={`cursor-pointer ${value === type.value ? '' : 'hover:bg-accent'}`}
              onClick={() => !disabled && onValueChange(type.value)}
            >
              {type.label}
            </Badge>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {label && <Label>{label}</Label>}
      
      <Select
        value={value}
        onValueChange={onValueChange}
        disabled={disabled}
      >
        <SelectTrigger>
          <SelectValue placeholder={placeholder}>
            {value === 'all' ? 'All Types' : selectedType?.label}
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {showAllOption && (
            <SelectItem value="all">All Types</SelectItem>
          )}
          {ACCOUNT_TYPES.map((type) => (
            <SelectItem key={type.value} value={type.value}>
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${type.color}`} />
                <span>{type.label}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}

/**
 * Get the color class for an account type badge
 */
export function getAccountTypeColor(type: AccountType): string {
  return ACCOUNT_TYPE_COLORS[type] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/20 dark:text-gray-400';
}

/**
 * Get the label for an account type
 */
export function getAccountTypeLabel(type: AccountType): string {
  const typeConfig = ACCOUNT_TYPES.find(t => t.value === type);
  return typeConfig?.label || type;
}
