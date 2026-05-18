import { getCurrencySymbol } from '../../types/currency.types';
import { cn } from '../../lib';

interface CurrencyIconProps {
  className?: string;
  /** The base currency code (e.g. 'INR', 'USD'). Defaults to 'INR'. */
  currency?: string | null;
}

/**
 * Dynamic currency icon that renders the base currency symbol.
 * Drop-in replacement for Lucide icons.
 *
 * Usage with store (in consuming app):
 *   const baseCurrency = useCurrencyStore((s) => s.baseCurrency);
 *   <CurrencyIcon currency={baseCurrency} className="h-5 w-5" />
 *
 * Usage without store (defaults to INR):
 *   <CurrencyIcon className="h-5 w-5" />
 */
export function CurrencyIcon({ className, currency }: CurrencyIconProps) {
  const symbol = getCurrencySymbol(currency || 'INR');
  return (
    <span className={cn('inline-flex items-center justify-center font-bold text-lg', className)}>
      {symbol}
    </span>
  );
}
