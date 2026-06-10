export type CurrencyType = 'USD' | 'EUR' | 'GBP' | 'JPY' | 'INR' | 'CAD' | 'AUD';

export interface CurrencyConfig {
  symbol: string;
  label: string;
  flag: string;
  name: string;
}

export const CURRENCY_DETAILS: Record<CurrencyType, CurrencyConfig> = {
  USD: { symbol: '$', label: 'USD ($)', flag: '🇺🇸', name: 'US Dollar' },
  EUR: { symbol: '€', label: 'EUR (€)', flag: '🇪🇺', name: 'Euro' },
  GBP: { symbol: '£', label: 'GBP (£)', flag: '🇬🇧', name: 'British Pound' },
  INR: { symbol: '₹', label: 'INR (₹)', flag: '🇮🇳', name: 'Indian Rupee' },
  JPY: { symbol: '¥', label: 'JPY (¥)', flag: '🇯🇵', name: 'Japanese Yen' },
  AUD: { symbol: 'A$', label: 'AUD (A$)', flag: '🇦🇺', name: 'Australian Dollar' },
  CAD: { symbol: 'C$', label: 'CAD (C$)', flag: '🇨🇦', name: 'Canadian Dollar' },
};

export const FALLBACK_RATES: Record<CurrencyType, number> = {
  USD: 1,
  EUR: 0.92,
  GBP: 0.79,
  JPY: 156.0,
  INR: 83.3,
  AUD: 1.50,
  CAD: 1.37,
};

/**
 * Helper to convert and format a price in USD to target currency with symbol.
 */
export function formatPrice(
  usdAmount: number,
  targetCurrency: CurrencyType,
  rates: Record<string, number> = FALLBACK_RATES
): string {
  const rate = rates[targetCurrency] ?? FALLBACK_RATES[targetCurrency] ?? 1;
  const converted = usdAmount * rate;
  const config = CURRENCY_DETAILS[targetCurrency];
  const symbol = config ? config.symbol : '$';
  
  // Format with thousands separators and 2 decimal points
  return `${symbol}${converted.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
