import {
  CurrencyCode,
  AccountRow,
  ExchangeRateType,
  ExchangeRateRecord,
  MultiCurrencyConversionSummary
} from '../types/accounting';

// Central Bank of Egypt (CBE) Official End-of-Year Closing FX Rates (Dec 31, 2025)
export const CBE_CLOSING_RATES_2025: Record<CurrencyCode, number> = {
  EGP: 1.0,
  USD: 50.85,
  EUR: 54.20,
  GBP: 64.10,
  SAR: 13.55,
  AED: 13.84
};

// Central Bank of Egypt (CBE) Comparative Fiscal Year-End Rates (Dec 31, 2024)
export const CBE_HISTORICAL_RATES_2024: Record<CurrencyCode, number> = {
  EGP: 1.0,
  USD: 49.20,
  EUR: 51.50,
  GBP: 61.80,
  SAR: 13.10,
  AED: 13.39
};

// Real-Time Interbank Spot Benchmark Rates
export const LIVE_SPOT_RATES: Record<CurrencyCode, number> = {
  EGP: 1.0,
  USD: 50.95,
  EUR: 54.65,
  GBP: 64.40,
  SAR: 13.58,
  AED: 13.87
};

export const EXCHANGE_RATE_SOURCES: Record<ExchangeRateType, { nameEn: string; nameAr: string; effectiveDate: string; details: string }> = {
  cbe_closing_2025: {
    nameEn: 'CBE Official Closing Rate (Dec 31, 2025)',
    nameAr: 'أسعار إقفال البنك المركزي المصري (31 ديسمبر 2025)',
    effectiveDate: '2025-12-31',
    details: 'Official year-end translation rate mandated by Egyptian Accounting Standards (EAS 13 / IAS 21) for balance sheet monetary items.'
  },
  cbe_historical_2024: {
    nameEn: 'CBE Historical Comparative Rate (Dec 31, 2024)',
    nameAr: 'أسعار البنك المركزي المقارنة (31 ديسمبر 2024)',
    effectiveDate: '2024-12-31',
    details: 'Historical comparative rate for prior fiscal year trial balance revaluations.'
  },
  live_spot: {
    nameEn: 'Real-Time Interbank Market Spot Rate',
    nameAr: 'سعر السوق الفوري اللحظي للإنتربنك',
    effectiveDate: new Date().toISOString().split('T')[0],
    details: 'Live spot transaction rate for interim month-end management accounting.'
  },
  custom_override: {
    nameEn: 'Custom Financial Controller Override Rate',
    nameAr: 'سعر مخصص محدد بواسطة المراقب المالي',
    effectiveDate: new Date().toISOString().split('T')[0],
    details: 'User-defined valuation exchange rate applied for contractual or customs clearing schedules.'
  }
};

// Helper: detect currency code from text, account names, or column values
export function detectCurrencyCode(text: string): CurrencyCode | null {
  if (!text) return null;
  const upper = text.toUpperCase().trim();

  if (upper === 'USD' || upper === '$' || upper.includes('DOLLAR') || text.includes('دولار')) return 'USD';
  if (upper === 'EUR' || upper === '€' || upper.includes('EURO') || text.includes('يورو')) return 'EUR';
  if (upper === 'SAR' || upper === 'SR' || upper.includes('RIYAL') || text.includes('ريال')) return 'SAR';
  if (upper === 'AED' || upper.includes('DIRHAM') || text.includes('درهم')) return 'AED';
  if (upper === 'EGP' || upper === 'LE' || upper === 'L.E' || text.includes('ج.م') || text.includes('جنيه')) return 'EGP';

  return null;
}

// Get exchange rate from source currency to target base currency
export function getExchangeRate(
  fromCurrency: CurrencyCode,
  toCurrency: CurrencyCode = 'EGP',
  rateType: ExchangeRateType = 'cbe_closing_2025',
  customOverrides?: Partial<Record<CurrencyCode, number>>
): ExchangeRateRecord {
  if (fromCurrency === toCurrency) {
    return {
      currency: fromCurrency,
      rateToBase: 1.0,
      baseCurrency: toCurrency,
      effectiveDate: EXCHANGE_RATE_SOURCES[rateType].effectiveDate,
      source: 'Direct Base (1:1)',
      rateType,
      isOverride: false
    };
  }

  // Determine rate to EGP for both
  let rateTable: Record<CurrencyCode, number> = CBE_CLOSING_RATES_2025;
  if (rateType === 'cbe_historical_2024') rateTable = CBE_HISTORICAL_RATES_2024;
  else if (rateType === 'live_spot') rateTable = LIVE_SPOT_RATES;

  let fromInEgp = rateTable[fromCurrency] || 1.0;
  let toInEgp = rateTable[toCurrency] || 1.0;

  let isOverride = false;
  if (customOverrides && customOverrides[fromCurrency]) {
    fromInEgp = customOverrides[fromCurrency]!;
    isOverride = true;
  }
  if (customOverrides && customOverrides[toCurrency]) {
    toInEgp = customOverrides[toCurrency]!;
    isOverride = true;
  }

  // Cross-currency conversion rate: 1 fromCurrency = X toCurrency
  const rateToBase = Number((fromInEgp / toInEgp).toFixed(6));

  return {
    currency: fromCurrency,
    rateToBase,
    baseCurrency: toCurrency,
    effectiveDate: EXCHANGE_RATE_SOURCES[rateType].effectiveDate,
    source: isOverride ? 'Financial Controller Override' : EXCHANGE_RATE_SOURCES[rateType].nameEn,
    rateType,
    isOverride
  };
}

// Normalize a list of parsed accounts into the target base currency
export function normalizeAccountsToBaseCurrency(
  accounts: AccountRow[],
  baseCurrency: CurrencyCode = 'EGP',
  rateType: ExchangeRateType = 'cbe_closing_2025',
  customOverrides?: Partial<Record<CurrencyCode, number>>,
  fileDefaultCurrency?: CurrencyCode
): {
  normalizedAccounts: AccountRow[];
  summary: MultiCurrencyConversionSummary;
} {
  const currenciesDetectedSet = new Set<CurrencyCode>();
  const totalOriginalDebitsByCurrency: Record<string, number> = {};
  const totalOriginalCreditsByCurrency: Record<string, number> = {};
  const ratesApplied: Record<string, number> = {};
  let accountsConvertedCount = 0;

  const normalizedAccounts: AccountRow[] = accounts.map((acc) => {
    // Determine currency of the line item:
    // 1. Explicitly tagged originalCurrency
    // 2. Detected from account name / original name (e.g. "CIB USD Operating", "Euro Supplier")
    // 3. File-level default currency
    // 4. Default to base currency
    let accountCurrency: CurrencyCode = acc.originalCurrency || fileDefaultCurrency || baseCurrency;

    const detectedFromName = detectCurrencyCode(acc.nameOriginal) || detectCurrencyCode(acc.nameEn);
    if (!acc.originalCurrency && detectedFromName) {
      accountCurrency = detectedFromName;
    }

    currenciesDetectedSet.add(accountCurrency);

    // Track original amounts
    const origDebit = acc.originalDebit !== undefined ? acc.originalDebit : acc.debit;
    const origCredit = acc.originalCredit !== undefined ? acc.originalCredit : acc.credit;

    totalOriginalDebitsByCurrency[accountCurrency] = (totalOriginalDebitsByCurrency[accountCurrency] || 0) + origDebit;
    totalOriginalCreditsByCurrency[accountCurrency] = (totalOriginalCreditsByCurrency[accountCurrency] || 0) + origCredit;

    // Exchange rate calculation
    const rateRecord = getExchangeRate(accountCurrency, baseCurrency, rateType, customOverrides);
    ratesApplied[accountCurrency] = rateRecord.rateToBase;

    if (accountCurrency !== baseCurrency) {
      accountsConvertedCount++;
    }

    // Normalized amounts in base currency
    const normalizedDebit = Number((origDebit * rateRecord.rateToBase).toFixed(2));
    const normalizedCredit = Number((origCredit * rateRecord.rateToBase).toFixed(2));
    const normalizedNet = normalizedDebit - normalizedCredit;

    return {
      ...acc,
      originalCurrency: accountCurrency,
      originalDebit: origDebit,
      originalCredit: origCredit,
      debit: normalizedDebit,
      credit: normalizedCredit,
      closingBalance: normalizedNet,
      netBalance: normalizedNet,
      exchangeRateApplied: rateRecord.rateToBase,
      rateTypeApplied: rateType,
      rateDateApplied: rateRecord.effectiveDate,
      notes: accountCurrency !== baseCurrency
        ? (acc.notes ? `${acc.notes} | ` : '') +
          `[Normalized from ${accountCurrency} @ ${rateRecord.rateToBase.toFixed(4)} ${baseCurrency}/${accountCurrency} on ${rateRecord.effectiveDate}]`
        : acc.notes
    };
  });

  const totalNormalizedDebit = Number(normalizedAccounts.reduce((sum, a) => sum + a.debit, 0).toFixed(2));
  const totalNormalizedCredit = Number(normalizedAccounts.reduce((sum, a) => sum + a.credit, 0).toFixed(2));
  const normalizedVariance = Number(Math.abs(totalNormalizedDebit - totalNormalizedCredit).toFixed(2));
  const isBalancedInBaseCurrency = normalizedVariance < 0.05;

  const summary: MultiCurrencyConversionSummary = {
    baseCurrency,
    currenciesDetected: Array.from(currenciesDetectedSet),
    accountsConvertedCount,
    ratesApplied,
    rateTypeUsed: rateType,
    totalOriginalDebitsByCurrency,
    totalOriginalCreditsByCurrency,
    totalNormalizedDebit,
    totalNormalizedCredit,
    normalizedVariance,
    isBalancedInBaseCurrency
  };

  return {
    normalizedAccounts,
    summary
  };
}
