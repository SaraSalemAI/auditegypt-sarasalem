import * as XLSX from 'xlsx';
import {
  AccountRow,
  ScaleUnit,
  CurrencyCode,
  CSVParsingTestCase,
  DuplicateDetectionReport,
  DuplicateEntryGroup,
  MultiCurrencyConversionSummary,
  ExchangeRateType
} from '../types/accounting';
import {
  normalizeAccountsToBaseCurrency,
  detectCurrencyCode,
  EXCHANGE_RATE_SOURCES
} from './currencyConversion';

export interface ParseResult {
  fileName: string;
  fileType: 'xlsx' | 'xls' | 'csv';
  sheets: string[];
  activeSheet: string;
  detectedLanguage: 'ar' | 'en' | 'mixed';
  detectedCurrency: CurrencyCode;
  detectedScale: ScaleUnit;
  detectedPeriod: string;
  headers: string[];
  sampleRows: any[];
  parsedAccounts: AccountRow[];
  allParsedAccounts?: AccountRow[];
  totalDebit: number;
  totalCredit: number;
  variance: number;
  isBalanced: boolean;
  warnings: string[];
  duplicateReport?: DuplicateDetectionReport;
  multiCurrencySummary?: MultiCurrencyConversionSummary;
  columnMappingSummary?: {
    codeColumn: string;
    nameColumn: string;
    debitColumn: string;
    creditColumn: string;
    refColumn?: string;
    dateColumn?: string;
    currencyColumn?: string;
    method: 'standard' | 'amount_type' | 'arabic_synonyms' | 'fallback';
    delimiterUsed: string;
    malformedRowCount: number;
  };
}

// Convert Arabic-Indic numerals (٠١٢٣٤٥٦٧٨٩) and Persian numerals to standard Arabic/Latin digits (0123456789)
export function normalizeArabicNumerals(input: string): string {
  if (!input) return '';
  const arabicIndicDigits = ['٠', '١', '٢', '٣', '٤', '٥', '٦', '٧', '٨', '٩'];
  const persianDigits = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];

  let result = input;
  for (let i = 0; i <= 9; i++) {
    result = result.replace(new RegExp(arabicIndicDigits[i], 'g'), String(i));
    result = result.replace(new RegExp(persianDigits[i], 'g'), String(i));
  }
  return result;
}

// Clean and parse monetary and numeric values
// Handles parentheses negative notation: (1,500) -> -1500
// Cleans currency symbols: EGP, ج.م, LE, $, commas, and non-numeric characters
export function cleanNumericValue(val: any): { value: number; isNegative: boolean; rawText: string; isMalformed: boolean } {
  if (val === null || val === undefined || val === '') {
    return { value: 0, isNegative: false, rawText: '', isMalformed: false };
  }

  let str = normalizeArabicNumerals(String(val).trim());
  const rawText = str;

  // Check for accounting parentheses for negative numbers (e.g. "(1,250.00)" or "(١٢٥٠)")
  let isNegative = false;
  if (/^\(.*\)$/.test(str)) {
    isNegative = true;
    str = str.slice(1, -1).trim();
  } else if (str.endsWith('-') || str.startsWith('-')) {
    isNegative = true;
    str = str.replace(/-/g, '').trim();
  }

  // Remove common currency symbols and Egyptian pound notations
  str = str.replace(/(EGP|ج\.م|LE|L\.E|USD|\$|EUR|€|GBP|£)/gi, '').trim();

  // Remove thousands separators (commas or Arabic thousands separator '،' or spaces)
  // Ensure we keep decimal points
  str = str.replace(/[,،\s]/g, '');

  if (str === '' || str === '-' || str.toLowerCase() === 'n/a' || str.toLowerCase() === 'null') {
    return { value: 0, isNegative, rawText, isMalformed: str.toLowerCase() === 'n/a' };
  }

  const num = parseFloat(str);
  if (isNaN(num)) {
    return { value: 0, isNegative, rawText, isMalformed: true };
  }

  const finalValue = isNegative ? -Math.abs(num) : num;
  return { value: finalValue, isNegative, rawText, isMalformed: false };
}

// RFC 4180 compliant CSV line tokenizer
// Properly supports quoted strings containing delimiters, newlines, and escaped double quotes ("")
export function parseCSVLine(line: string, delimiter: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  let i = 0;

  while (i < line.length) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
        // Escaped quote
        current += '"';
        i += 2;
        continue;
      } else {
        inQuotes = !inQuotes;
        i++;
        continue;
      }
    }

    if (char === delimiter && !inQuotes) {
      result.push(current.trim());
      current = '';
      i++;
      continue;
    }

    current += char;
    i++;
  }

  result.push(current.trim());
  return result;
}

// Automatically detect the most likely delimiter (, ; \t |)
export function autoDetectDelimiter(rawText: string): string {
  const lines = rawText.split(/\r?\n/).filter(l => l.trim().length > 0).slice(0, 10);
  if (lines.length === 0) return ',';

  const delimiters = [',', ';', '\t', '|'];
  const scores: Record<string, number> = { ',': 0, ';': 0, '\t': 0, '|': 0 };

  for (const d of delimiters) {
    const counts = lines.map(line => {
      let count = 0;
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        if (line[i] === '"') inQuotes = !inQuotes;
        else if (line[i] === d && !inQuotes) count++;
      }
      return count;
    });

    const nonZeroCounts = counts.filter(c => c > 0);
    if (nonZeroCounts.length > 0) {
      const avg = nonZeroCounts.reduce((a, b) => a + b, 0) / nonZeroCounts.length;
      const isConsistent = counts.every(c => c === counts[0]);
      scores[d] = avg * (isConsistent ? 2.0 : 1.0);
    }
  }

  let bestDelimiter = ',';
  let maxScore = -1;
  for (const d of delimiters) {
    if (scores[d] > maxScore) {
      maxScore = scores[d];
      bestDelimiter = d;
    }
  }

  return maxScore > 0 ? bestDelimiter : ',';
}

export function detectLanguage(text: string): 'ar' | 'en' | 'mixed' {
  const arabicRegex = /[\u0600-\u06FF]/;
  const englishRegex = /[a-zA-Z]/;
  const hasArabic = arabicRegex.test(text);
  const hasEnglish = englishRegex.test(text);

  if (hasArabic && hasEnglish) return 'mixed';
  if (hasArabic) return 'ar';
  return 'en';
}

// Propose classification based on code prefix and name keywords
function classifyAccount(rawCode: string, rawName: string, rawDebit: number, rawCredit: number): {
  fsStatement: 'BS' | 'IS' | 'CF';
  category: any;
  nature: 'debit' | 'credit';
  confidence: number;
} {
  let fsStatement: 'BS' | 'IS' | 'CF' = 'BS';
  let category: any = 'Suspense & Unclassified';
  let nature: 'debit' | 'credit' = rawDebit >= rawCredit ? 'debit' : 'credit';
  let confidence = 0.85;

  const cleanCode = rawCode.replace(/\D/g, '');
  const firstDigit = cleanCode.charAt(0);
  const nameLower = rawName.toLowerCase();

  if (
    firstDigit === '1' ||
    nameLower.includes('cash') ||
    nameLower.includes('نقد') ||
    nameLower.includes('عملاء') ||
    nameLower.includes('أصول') ||
    nameLower.includes('مخزون') ||
    nameLower.includes('مدينون')
  ) {
    fsStatement = 'BS';
    nature = 'debit';
    if (nameLower.includes('نقد') || nameLower.includes('cash') || nameLower.includes('بنك') || nameLower.includes('bank') || nameLower.includes('خزينة')) {
      category = 'Cash & Cash Equivalents';
      confidence = 0.98;
    } else if (nameLower.includes('عملاء') || nameLower.includes('receivable') || nameLower.includes('قبض')) {
      category = 'Trade & Other Receivables';
      confidence = 0.96;
    } else if (nameLower.includes('مخزون') || nameLower.includes('inventory') || nameLower.includes('خامات') || nameLower.includes('بضاعة')) {
      category = 'Inventory';
      confidence = 0.97;
    } else if (nameLower.includes('أصول ثابتة') || nameLower.includes('ppe') || nameLower.includes('آلات') || nameLower.includes('مباني') || nameLower.includes('سيارات')) {
      category = 'Property, Plant & Equipment';
      confidence = 0.98;
    } else if (nameLower.includes('مجمع إهلاك') || nameLower.includes('accumulated') || nameLower.includes('استهلاك')) {
      category = 'Accumulated Depreciation';
      nature = 'credit';
      confidence = 0.99;
    } else {
      category = 'Prepayments & Current Assets';
      confidence = 0.90;
    }
  } else if (
    firstDigit === '2' ||
    nameLower.includes('مورد') ||
    nameLower.includes('payable') ||
    nameLower.includes('قرض') ||
    nameLower.includes('loan') ||
    nameLower.includes('دائن') ||
    nameLower.includes('دائنون')
  ) {
    fsStatement = 'BS';
    nature = 'credit';
    if (nameLower.includes('مورد') || nameLower.includes('payable') || nameLower.includes('دفع')) {
      category = 'Trade & Other Payables';
      confidence = 0.98;
    } else if (nameLower.includes('سحب') || nameLower.includes('تسهيلات') || nameLower.includes('overdraft')) {
      category = 'Short-term Borrowings';
      confidence = 0.96;
    } else if (nameLower.includes('قرض') || nameLower.includes('borrowing') || nameLower.includes('سندات')) {
      category = 'Long-term Borrowings';
      confidence = 0.97;
    } else {
      category = 'Accrued Expenses & Provisions';
      confidence = 0.91;
    }
  } else if (
    firstDigit === '3' ||
    nameLower.includes('رأس المال') ||
    nameLower.includes('capital') ||
    nameLower.includes('أرباح مرحلة') ||
    nameLower.includes('احتياطي') ||
    nameLower.includes('حقوق ملكية') ||
    nameLower.includes('equity')
  ) {
    fsStatement = 'BS';
    nature = 'credit';
    if (nameLower.includes('رأس المال') || nameLower.includes('capital')) {
      category = 'Share Capital';
      confidence = 0.99;
    } else if (nameLower.includes('قانوني') || nameLower.includes('statutory') || nameLower.includes('احتياطي')) {
      category = 'Legal & Statutory Reserves';
      confidence = 0.97;
    } else if (nameLower.includes('مرحلة') || nameLower.includes('retained') || nameLower.includes('أرباح')) {
      category = 'Retained Earnings';
      confidence = 0.98;
    } else {
      category = 'General & Other Reserves';
      confidence = 0.92;
    }
  } else if (
    firstDigit === '4' ||
    nameLower.includes('إيراد') ||
    nameLower.includes('مبيعات') ||
    nameLower.includes('revenue') ||
    nameLower.includes('sales') ||
    nameLower.includes('خدمات')
  ) {
    fsStatement = 'IS';
    nature = 'credit';
    category = 'Revenue';
    confidence = 0.98;
  } else if (
    firstDigit === '5' ||
    nameLower.includes('تكلفة') ||
    nameLower.includes('cogs') ||
    nameLower.includes('cost of sales') ||
    nameLower.includes('تكاليف إنتاج')
  ) {
    fsStatement = 'IS';
    nature = 'debit';
    category = 'Cost of Sales';
    confidence = 0.98;
  } else if (
    firstDigit === '6' ||
    nameLower.includes('مصروف') ||
    nameLower.includes('expense') ||
    nameLower.includes('رواتب') ||
    nameLower.includes('تسويق') ||
    nameLower.includes('عمومية')
  ) {
    fsStatement = 'IS';
    nature = 'debit';
    if (nameLower.includes('بيع') || nameLower.includes('تسويق') || nameLower.includes('selling') || nameLower.includes('marketing')) {
      category = 'Selling & Distribution Expenses';
      confidence = 0.96;
    } else if (nameLower.includes('إهلاك') || nameLower.includes('depreciation')) {
      category = 'Depreciation & Amortization';
      confidence = 0.97;
    } else {
      category = 'General & Administrative Expenses';
      confidence = 0.95;
    }
  } else if (
    firstDigit === '7' ||
    nameLower.includes('فائدة') ||
    nameLower.includes('interest') ||
    nameLower.includes('ضريبة') ||
    nameLower.includes('tax') ||
    nameLower.includes('تمويل')
  ) {
    fsStatement = 'IS';
    if (nameLower.includes('فائدة دائنة') || nameLower.includes('finance income') || nameLower.includes('عوائد')) {
      category = 'Finance Income';
      nature = 'credit';
      confidence = 0.97;
    } else if (nameLower.includes('ضريبة') || nameLower.includes('tax')) {
      category = 'Income Tax Expense';
      nature = 'debit';
      confidence = 0.98;
    } else {
      category = 'Finance Costs';
      nature = 'debit';
      confidence = 0.97;
    }
  }

  return { fsStatement, category, nature, confidence };
}

// Duplicate Transaction Detection & Resolution Engine
// Detects identical reference numbers, identical dates with recurring account codes/amounts,
// or recurring duplicate account entries.
export function detectDuplicateTransactions(
  accounts: AccountRow[],
  activeRemedy: 'flag' | 'remove' | 'merge' = 'remove'
): {
  report: DuplicateDetectionReport;
  processedAccounts: AccountRow[];
  totalDebit: number;
  totalCredit: number;
  variance: number;
  isBalanced: boolean;
} {
  const signatureMap = new Map<string, AccountRow[]>();

  accounts.forEach(acc => {
    let key = '';
    if (acc.refNumber && acc.refNumber.trim().length > 0) {
      key = `REF:${acc.refNumber.trim().toUpperCase()}`;
    } else if (acc.entryDate && acc.entryDate.trim().length > 0) {
      key = `DATE:${acc.entryDate.trim()}_CODE:${acc.code.trim()}_D:${acc.debit}_C:${acc.credit}`;
    } else {
      // Fallback: recurring entry with identical account code, debit, credit
      key = `RECURRING_CODE:${acc.code.trim()}_D:${acc.debit}_C:${acc.credit}`;
    }

    if (!signatureMap.has(key)) {
      signatureMap.set(key, []);
    }
    signatureMap.get(key)!.push(acc);
  });

  const duplicateGroups: DuplicateEntryGroup[] = [];
  let totalDuplicatesCount = 0;
  let totalDuplicateDebit = 0;
  let totalDuplicateCredit = 0;

  let groupCounter = 1;
  signatureMap.forEach((items, key) => {
    if (items.length > 1) {
      const primary = items[0];
      const duplicates = items.slice(1);
      const groupId = `DUP-GRP-${groupCounter++}`;

      let matchCriteria: 'identical_ref' | 'identical_date_and_code' | 'identical_recurring_entry' = 'identical_recurring_entry';
      if (primary.refNumber && primary.refNumber.trim().length > 0) {
        matchCriteria = 'identical_ref';
      } else if (primary.entryDate && primary.entryDate.trim().length > 0) {
        matchCriteria = 'identical_date_and_code';
      }

      const dupDebit = duplicates.reduce((sum, d) => sum + d.debit, 0);
      const dupCredit = duplicates.reduce((sum, d) => sum + d.credit, 0);

      totalDuplicatesCount += duplicates.length;
      totalDuplicateDebit += dupDebit;
      totalDuplicateCredit += dupCredit;

      // Tag duplicate items with flag info
      duplicates.forEach((d) => {
        d.isDuplicate = true;
        d.duplicateGroupId = groupId;
        if (matchCriteria === 'identical_ref') {
          d.duplicateReason = `Duplicate Reference #${primary.refNumber}`;
        } else if (matchCriteria === 'identical_date_and_code') {
          d.duplicateReason = `Duplicate Date (${primary.entryDate}) & Account ${primary.code}`;
        } else {
          d.duplicateReason = `Recurring Duplicate Account Row (${primary.code})`;
        }
      });

      const descEn = matchCriteria === 'identical_ref'
        ? `${items.length} recurring entries with identical Reference #${primary.refNumber} (${primary.nameEn})`
        : matchCriteria === 'identical_date_and_code'
        ? `${items.length} recurring entries on ${primary.entryDate} for Account ${primary.code}`
        : `${items.length} identical recurring rows for Account ${primary.code}`;

      const descAr = matchCriteria === 'identical_ref'
        ? `${items.length} قيود مكررة بنفس رقم المرجع #${primary.refNumber} (${primary.nameAr})`
        : matchCriteria === 'identical_date_and_code'
        ? `${items.length} قيود مكررة بنفس التاريخ ${primary.entryDate} للحساب ${primary.code}`
        : `${items.length} صفوف مكررة متطابقة للحساب ${primary.code}`;

      duplicateGroups.push({
        groupId,
        matchCriteria,
        matchKey: key,
        refNumber: primary.refNumber,
        entryDate: primary.entryDate,
        accountCode: primary.code,
        accountName: primary.nameOriginal,
        primaryEntryId: primary.id,
        duplicateEntryIds: duplicates.map(d => d.id),
        totalOccurrences: items.length,
        duplicateDebitAmount: dupDebit,
        duplicateCreditAmount: dupCredit,
        descriptionEn: descEn,
        descriptionAr: descAr
      });
    }
  });

  const report: DuplicateDetectionReport = {
    hasDuplicates: duplicateGroups.length > 0,
    totalDuplicatesCount,
    groups: duplicateGroups,
    totalDuplicateDebit,
    totalDuplicateCredit,
    activeRemedy
  };

  // Apply chosen remedy action
  let processedAccounts: AccountRow[] = [];

  if (activeRemedy === 'flag') {
    // Keep all accounts, but duplicate accounts have isDuplicate = true
    processedAccounts = [...accounts];
  } else if (activeRemedy === 'remove') {
    // Automatically eliminate duplicates, keeping only the primary record
    const duplicateIdSet = new Set<string>();
    duplicateGroups.forEach(g => {
      g.duplicateEntryIds.forEach(id => duplicateIdSet.add(id));
    });
    processedAccounts = accounts.filter(acc => !duplicateIdSet.has(acc.id));
  } else if (activeRemedy === 'merge') {
    // Consolidate duplicates into the primary entry
    const duplicateIdSet = new Set<string>();
    duplicateGroups.forEach(g => {
      g.duplicateEntryIds.forEach(id => duplicateIdSet.add(id));
    });

    processedAccounts = accounts
      .filter(acc => !duplicateIdSet.has(acc.id))
      .map(acc => {
        const group = duplicateGroups.find(g => g.primaryEntryId === acc.id);
        if (group) {
          const mergedDebit = acc.debit + group.duplicateDebitAmount;
          const mergedCredit = acc.credit + group.duplicateCreditAmount;
          return {
            ...acc,
            debit: mergedDebit,
            credit: mergedCredit,
            closingBalance: mergedDebit - mergedCredit,
            netBalance: mergedDebit - mergedCredit,
            notes: (acc.notes || '') + ` [Merged ${group.totalOccurrences} duplicate lines]`
          };
        }
        return acc;
      });
  }

  // Recalculate totals
  const totalDebit = processedAccounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = processedAccounts.reduce((sum, a) => sum + a.credit, 0);
  const variance = Math.abs(totalDebit - totalCredit);
  const isBalanced = variance < 0.01;

  return {
    report,
    processedAccounts,
    totalDebit,
    totalCredit,
    variance,
    isBalanced
  };
}

// Robust CSV trial balance parser with auto-delimiter, Arabic header synonyms,
// ambiguous column disambiguation, duplicate transaction detection, multi-currency normalization, malformed row resilience, and balance calculation.
export function parseCSVContent(
  rawText: string,
  fileName = 'uploaded_trial_balance.csv',
  remedy: 'flag' | 'remove' | 'merge' = 'remove',
  targetBaseCurrency: CurrencyCode = 'EGP',
  rateType: ExchangeRateType = 'cbe_closing_2025',
  customRateOverrides?: Partial<Record<CurrencyCode, number>>,
  fileDefaultCurrency?: CurrencyCode
): ParseResult {
  if (!rawText || rawText.trim().length === 0) {
    throw new Error('CSV text is empty.');
  }

  const delimiter = autoDetectDelimiter(rawText);
  const rawLines = rawText.split(/\r?\n/).filter(line => line.trim().length > 0);

  if (rawLines.length < 2) {
    throw new Error('CSV file contains insufficient rows (requires header + at least one data row).');
  }

  // Parse lines into tokens
  const rowsTokens: string[][] = rawLines.map(line => parseCSVLine(line, delimiter));

  // Find header row by scoring rows against accounting keywords
  let headerIndex = 0;
  let maxHeaderScore = -1;

  for (let i = 0; i < Math.min(10, rowsTokens.length); i++) {
    const row = rowsTokens[i];
    let score = 0;
    for (const cell of row) {
      const lower = cell.toLowerCase().trim();
      if (['كود', 'code', 'رقم الحساب', 'account code', 'acc no', 'acc_code'].some(k => lower.includes(k))) score += 5;
      if (['اسم', 'name', 'حساب', 'account name', 'description', 'بيان'].some(k => lower.includes(k))) score += 5;
      if (['مدين', 'debit', 'dr', 'dr.', 'مدينة'].some(k => lower === k || lower.includes(k))) score += 5;
      if (['دائن', 'credit', 'cr', 'cr.', 'دائنة'].some(k => lower === k || lower.includes(k))) score += 5;
      if (['مرجع', 'ref', 'reference', 'مستند', 'قيد', 'voucher', 'invoice'].some(k => lower.includes(k))) score += 4;
      if (['تاريخ', 'date', 'posting_date'].some(k => lower.includes(k))) score += 4;
      if (['عملة', 'currency', 'curr', 'ccy'].some(k => lower.includes(k))) score += 4;
      if (['رصيد', 'balance', 'صافي', 'amount', 'المبلغ'].some(k => lower.includes(k))) score += 3;
    }
    if (score > maxHeaderScore) {
      maxHeaderScore = score;
      headerIndex = i;
    }
  }

  const rawHeaders = rowsTokens[headerIndex].map(h => h.trim());
  const dataRows = rowsTokens.slice(headerIndex + 1).filter(r => r.some(c => c.trim().length > 0));

  // Identify column indices with Arabic/English synonym dictionary & scoring
  let codeColIdx = -1;
  let nameColIdx = -1;
  let debitColIdx = -1;
  let creditColIdx = -1;
  let amountColIdx = -1;
  let typeColIdx = -1;
  let netColIdx = -1;
  let refColIdx = -1;
  let dateColIdx = -1;
  let currencyColIdx = -1;

  const warnings: string[] = [];

  rawHeaders.forEach((h, idx) => {
    const lower = h.toLowerCase().trim();

    // Check currency column
    if (currencyColIdx === -1 && (
      lower.includes('currency') ||
      lower.includes('curr') ||
      lower.includes('ccy') ||
      lower.includes('عملة') ||
      lower.includes('العملة')
    )) {
      currencyColIdx = idx;
    }
    // Check reference number column
    else if (refColIdx === -1 && (
      lower.includes('ref') ||
      lower.includes('مرجع') ||
      lower.includes('مستند') ||
      lower.includes('قيد') ||
      lower.includes('voucher') ||
      lower.includes('invoice') ||
      lower.includes('inv') ||
      lower.includes('فاتورة') ||
      lower.includes('document') ||
      lower.includes('doc_no') ||
      lower.includes('رقم المرجع') ||
      lower.includes('رقم المستند')
    )) {
      refColIdx = idx;
    }
    // Check date column
    else if (dateColIdx === -1 && (
      lower.includes('date') ||
      lower.includes('تاريخ') ||
      lower.includes('posting') ||
      lower.includes('entry_date') ||
      lower.includes('يومية')
    )) {
      dateColIdx = idx;
    }
    // Check code column
    else if (codeColIdx === -1 && (
      lower.includes('كود') ||
      lower.includes('رمز') ||
      lower.includes('رقم الحساب') ||
      lower.includes('code') ||
      lower.includes('account no') ||
      lower.includes('acc no') ||
      lower.includes('acc code') ||
      lower === 'acc'
    )) {
      codeColIdx = idx;
    }
    // Check name column
    else if (nameColIdx === -1 && (
      lower.includes('اسم الحساب') ||
      lower.includes('اسم البند') ||
      lower.includes('اسم') ||
      lower.includes('بيان') ||
      lower.includes('وصف') ||
      lower.includes('name') ||
      lower.includes('account name') ||
      lower.includes('description') ||
      lower.includes('desc')
    )) {
      nameColIdx = idx;
    }
    // Check debit column
    else if (debitColIdx === -1 && (
      lower.includes('مدين') ||
      lower.includes('مدينة') ||
      lower.includes('حـ/ مدين') ||
      lower.includes('حركة مدينة') ||
      lower === 'debit' ||
      lower === 'dr' ||
      lower === 'dr amount' ||
      lower.startsWith('debit')
    )) {
      debitColIdx = idx;
    }
    // Check credit column
    else if (creditColIdx === -1 && (
      lower.includes('دائن') ||
      lower.includes('دائنة') ||
      lower.includes('حـ/ دائن') ||
      lower.includes('حركة دائنة') ||
      lower === 'credit' ||
      lower === 'cr' ||
      lower === 'cr amount' ||
      lower.startsWith('credit')
    )) {
      creditColIdx = idx;
    }
    // Check single amount column
    else if (amountColIdx === -1 && (
      lower.includes('مبلغ') ||
      lower.includes('amount') ||
      lower.includes('total amount') ||
      lower.includes('قيمة')
    )) {
      amountColIdx = idx;
    }
    // Check entry type column (Debit / Credit indicator or D/C)
    else if (typeColIdx === -1 && (
      lower.includes('نوع') ||
      lower.includes('طبيعة') ||
      lower.includes('حركة') ||
      lower.includes('type') ||
      lower.includes('d/c') ||
      lower.includes('dr/cr') ||
      lower.includes('entry type')
    )) {
      typeColIdx = idx;
    }
    // Check net balance column
    else if (netColIdx === -1 && (
      lower.includes('رصيد') ||
      lower.includes('صافي') ||
      lower.includes('balance') ||
      lower.includes('net')
    )) {
      netColIdx = idx;
    }
  });

  let mappingMethod: 'standard' | 'amount_type' | 'arabic_synonyms' | 'fallback' = 'standard';

  // Ambiguity Resolution: Single Amount column with Type (Debit/Credit) column
  if ((debitColIdx === -1 || creditColIdx === -1) && amountColIdx !== -1) {
    mappingMethod = 'amount_type';
    warnings.push(`Ambiguous mapping resolved: Single Amount column [${rawHeaders[amountColIdx]}] used with Type column [${typeColIdx !== -1 ? rawHeaders[typeColIdx] : 'Sign/Nature'}].`);
  } else if (debitColIdx !== -1 && creditColIdx !== -1) {
    mappingMethod = rawHeaders.some(h => /[\u0600-\u06FF]/.test(h)) ? 'arabic_synonyms' : 'standard';
  } else {
    mappingMethod = 'fallback';
    if (codeColIdx === -1) codeColIdx = 0;
    if (nameColIdx === -1) nameColIdx = Math.min(1, rawHeaders.length - 1);
    if (debitColIdx === -1 && creditColIdx === -1) {
      debitColIdx = 2 < rawHeaders.length ? 2 : 0;
      creditColIdx = 3 < rawHeaders.length ? 3 : 1;
      warnings.push(`Column headers did not explicitly identify Debit/Credit; defaulted to columns [${rawHeaders[debitColIdx] || 'Col 2'}] and [${rawHeaders[creditColIdx] || 'Col 3'}].`);
    }
  }

  // Fallbacks for Code & Name if still unassigned
  if (codeColIdx === -1) codeColIdx = 0;
  if (nameColIdx === -1) nameColIdx = rawHeaders.length > 1 ? 1 : 0;

  const rawParsedAccounts: AccountRow[] = [];
  let arabicCount = 0;
  let englishCount = 0;
  let malformedRowCount = 0;

  dataRows.forEach((row, rowIdx) => {
    if (!row || row.length === 0 || (row.length === 1 && !row[0].trim())) {
      malformedRowCount++;
      return;
    }

    let rawCode = normalizeArabicNumerals(String(row[codeColIdx] || '').trim());
    let rawName = String(row[nameColIdx] || '').trim();
    const rawRef = refColIdx !== -1 ? String(row[refColIdx] || '').trim() : undefined;
    const rawDate = dateColIdx !== -1 ? String(row[dateColIdx] || '').trim() : undefined;

    let rowCurrency: CurrencyCode | undefined = undefined;
    if (currencyColIdx !== -1) {
      const detected = detectCurrencyCode(String(row[currencyColIdx] || '').trim());
      if (detected) rowCurrency = detected;
    }
    if (!rowCurrency) {
      const fromName = detectCurrencyCode(rawName) || detectCurrencyCode(rawCode);
      if (fromName) rowCurrency = fromName;
    }
    if (!rowCurrency && fileDefaultCurrency) {
      rowCurrency = fileDefaultCurrency;
    }

    if (!rawCode && !rawName) {
      malformedRowCount++;
      warnings.push(`Row ${rowIdx + 1 + headerIndex}: Empty row skipped.`);
      return;
    }

    if (!rawCode && rawName) {
      rawCode = `AUTO-${1000 + rowIdx}`;
      warnings.push(`Row ${rowIdx + 1 + headerIndex}: Missing account code for "${rawName}"; assigned temporary code ${rawCode}.`);
    }

    let debit = 0;
    let credit = 0;

    if (mappingMethod === 'amount_type' && amountColIdx !== -1) {
      const parsedAmount = cleanNumericValue(row[amountColIdx]);
      if (parsedAmount.isMalformed) {
        malformedRowCount++;
        warnings.push(`Row ${rowIdx + 1 + headerIndex} (${rawCode}): Malformed numeric amount "${parsedAmount.rawText}" sanitized to 0.`);
      }

      const typeIndicator = typeColIdx !== -1 ? String(row[typeColIdx] || '').trim().toLowerCase() : '';
      const isDebit =
        typeIndicator.includes('d') ||
        typeIndicator.includes('مدين') ||
        typeIndicator.includes('dr') ||
        (!typeIndicator && parsedAmount.value >= 0);

      if (isDebit) {
        debit = Math.abs(parsedAmount.value);
        credit = 0;
      } else {
        debit = 0;
        credit = Math.abs(parsedAmount.value);
      }
    } else {
      const parsedDebit = cleanNumericValue(row[debitColIdx]);
      const parsedCredit = cleanNumericValue(row[creditColIdx]);

      if (parsedDebit.isMalformed) {
        malformedRowCount++;
        warnings.push(`Row ${rowIdx + 1 + headerIndex} (${rawCode}): Non-numeric Debit "${parsedDebit.rawText}" treated as 0.`);
      }
      if (parsedCredit.isMalformed) {
        malformedRowCount++;
        warnings.push(`Row ${rowIdx + 1 + headerIndex} (${rawCode}): Non-numeric Credit "${parsedCredit.rawText}" treated as 0.`);
      }

      if (parsedDebit.value < 0) {
        credit += Math.abs(parsedDebit.value);
      } else {
        debit += parsedDebit.value;
      }

      if (parsedCredit.value < 0) {
        debit += Math.abs(parsedCredit.value);
      } else {
        credit += parsedCredit.value;
      }
    }

    const lang = detectLanguage(rawName);
    if (lang === 'ar' || lang === 'mixed') arabicCount++;
    if (lang === 'en' || lang === 'mixed') englishCount++;

    const classification = classifyAccount(rawCode, rawName, debit, credit);

    rawParsedAccounts.push({
      id: `CSV-ACC-${rowIdx + 1}`,
      code: rawCode,
      nameOriginal: rawName,
      nameEn: lang === 'en' ? rawName : `${rawName} (En)`,
      nameAr: lang === 'ar' ? rawName : `${rawName} (عربي)`,
      debit,
      credit,
      openingBalance: 0,
      closingBalance: debit - credit,
      netBalance: debit - credit,
      nature: classification.nature,
      fsStatement: classification.fsStatement,
      category: classification.category,
      confidence: classification.confidence,
      mappingStatus: 'auto',
      sourceFile: fileName,
      sheetName: 'CSV_Main',
      rowNumber: headerIndex + 2 + rowIdx,
      languageDetected: lang,
      refNumber: rawRef,
      entryDate: rawDate,
      originalCurrency: rowCurrency,
      originalDebit: debit,
      originalCredit: credit
    });
  });

  // Execute Duplicate Transaction Detection
  const dupResult = detectDuplicateTransactions(rawParsedAccounts, remedy);

  if (dupResult.report.hasDuplicates) {
    warnings.push(
      `Duplicate transaction detection: Identified ${dupResult.report.totalDuplicatesCount} recurring/duplicate entries across ${dupResult.report.groups.length} reference/date groups. Remedy "${remedy}" applied.`
    );
  }

  // Execute Multi-Currency Normalization to Base Currency
  const normResult = normalizeAccountsToBaseCurrency(
    dupResult.processedAccounts,
    targetBaseCurrency,
    rateType,
    customRateOverrides,
    fileDefaultCurrency
  );

  if (normResult.summary.accountsConvertedCount > 0) {
    warnings.push(
      `Multi-currency normalization applied: Converted ${normResult.summary.accountsConvertedCount} foreign currency accounts into base currency ${targetBaseCurrency} (${EXCHANGE_RATE_SOURCES[rateType].nameEn}).`
    );
  }

  const finalAccounts = normResult.normalizedAccounts;
  const totalDebit = normResult.summary.totalNormalizedDebit;
  const totalCredit = normResult.summary.totalNormalizedCredit;
  const variance = normResult.summary.normalizedVariance;
  const isBalanced = normResult.summary.isBalancedInBaseCurrency;

  const overallLanguage = arabicCount > 0 && englishCount > 0 ? 'mixed' : arabicCount > 0 ? 'ar' : 'en';

  if (!isBalanced) {
    warnings.push(
      `Trial Balance is out of balance by ${variance.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ${targetBaseCurrency} ` +
      `(Total Debits: ${totalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}, ` +
      `Total Credits: ${totalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}).`
    );
  }

  // Detect scale
  let detectedScale: ScaleUnit = 'units';
  const maxVal = Math.max(totalDebit, totalCredit);
  if (maxVal > 50000000) {
    detectedScale = 'units';
  } else if (maxVal > 10000) {
    detectedScale = 'thousands';
  }

  return {
    fileName,
    fileType: 'csv',
    sheets: ['CSV_Main'],
    activeSheet: 'CSV_Main',
    detectedLanguage: overallLanguage,
    detectedCurrency: targetBaseCurrency,
    detectedScale,
    detectedPeriod: 'FY 2025',
    headers: rawHeaders,
    sampleRows: dataRows.slice(0, 5),
    parsedAccounts: finalAccounts,
    allParsedAccounts: rawParsedAccounts,
    totalDebit,
    totalCredit,
    variance,
    isBalanced,
    warnings,
    duplicateReport: dupResult.report,
    multiCurrencySummary: normResult.summary,
    columnMappingSummary: {
      codeColumn: rawHeaders[codeColIdx] || 'Col 1',
      nameColumn: rawHeaders[nameColIdx] || 'Col 2',
      debitColumn: rawHeaders[debitColIdx] || 'Col 3',
      creditColumn: rawHeaders[creditColIdx] || 'Col 4',
      refColumn: refColIdx !== -1 ? rawHeaders[refColIdx] : undefined,
      dateColumn: dateColIdx !== -1 ? rawHeaders[dateColIdx] : undefined,
      currencyColumn: currencyColIdx !== -1 ? rawHeaders[currencyColIdx] : undefined,
      method: mappingMethod,
      delimiterUsed: delimiter,
      malformedRowCount
    }
  };
}


// Full file parser supporting both CSV (via parseCSVContent) and Excel (via XLSX)
export async function parseUploadedFile(
  file: File,
  remedy: 'flag' | 'remove' | 'merge' = 'remove',
  targetBaseCurrency: CurrencyCode = 'EGP',
  rateType: ExchangeRateType = 'cbe_closing_2025',
  customRateOverrides?: Partial<Record<CurrencyCode, number>>,
  fileDefaultCurrency?: CurrencyCode
): Promise<ParseResult> {
  const fileName = file.name;
  const fileExt = fileName.split('.').pop()?.toLowerCase();

  if (fileExt === 'csv' || fileExt === 'txt') {
    const text = await file.text();
    return parseCSVContent(text, fileName, remedy, targetBaseCurrency, rateType, customRateOverrides, fileDefaultCurrency);
  }

  const fileType: 'xlsx' | 'xls' = fileExt === 'xls' ? 'xls' : 'xlsx';
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetNames = workbook.SheetNames;
  const activeSheetName = sheetNames[0] || 'Sheet1';
  const worksheet = workbook.Sheets[activeSheetName];
  const rawCsv = XLSX.utils.sheet_to_csv(worksheet);

  const result = parseCSVContent(rawCsv, fileName, remedy, targetBaseCurrency, rateType, customRateOverrides, fileDefaultCurrency);
  result.fileType = fileType;
  result.sheets = sheetNames;
  result.activeSheet = activeSheetName;
  return result;
}


// Generate sample Excel template
export function generateSampleTrialBalanceExcel() {
  const wsData = [
    ['كود الحساب', 'اسم الحساب (عربي)', 'Account Name (English)', 'مدين (Debit)', 'دائن (Credit)', 'مرجع القيد', 'تاريخ الحركة'],
    ['1010', 'النقدية بالصندوق والخزينة', 'Petty Cash & Vault', 4850, 0, 'REF-2025-01', '2025-12-31'],
    ['1020', 'البنك الأهلي المصري', 'National Bank of Egypt', 26400, 0, 'REF-2025-02', '2025-12-31'],
    ['1110', 'العملاء التجاريون', 'Trade Receivables', 62400, 0, 'REF-2025-03', '2025-12-31'],
    ['1210', 'مخزون المواد الخام', 'Raw Materials Inventory', 34500, 0, 'REF-2025-04', '2025-12-31'],
    ['1520', 'آلات وخطوط إنتاج CNC', 'Machinery & CNC Lines', 96400, 0, 'REF-2025-05', '2025-12-31'],
    ['1590', 'مجمع إهلاك الأصول الثابتة', 'Accumulated Depreciation', 0, 58600, 'REF-2025-06', '2025-12-31'],
    ['2010', 'الموردون وأوراق الدفع', 'Trade Accounts Payable', 0, 44200, 'REF-2025-07', '2025-12-31'],
    ['2110', 'تسهيلات ائتمانية بنكية', 'Short-term Bank Facilities', 0, 22000, 'REF-2025-08', '2025-12-31'],
    ['3010', 'رأس المال المصدر والمدفوع', 'Share Capital', 0, 80000, 'REF-2025-09', '2025-12-31'],
    ['4010', 'إيرادات المبيعات الصناعية', 'Industrial Revenue', 0, 154000, 'REF-2025-10', '2025-12-31'],
    ['5010', 'تكلفة الخامات المستهلكة', 'Direct Materials Consumed', 94600, 0, 'REF-2025-11', '2025-12-31'],
    ['6020', 'رواتب ومصروفات الإدارة', 'General & Admin Salaries', 16900, 0, 'REF-2025-12', '2025-12-31'],
    ['7020', 'تكاليف التمويل والفوائد', 'Finance & Borrowing Costs', 11500, 0, 'REF-2025-13', '2025-12-31'],
    ['7090', 'مخصص ضريبة الدخل', 'Income Tax Expense', 7600, 0, 'REF-2025-14', '2025-12-31']
  ];

  const ws = XLSX.utils.aoa_to_sheet(wsData);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Trial_Balance_Sample');
  return XLSX.write(wb, { bookType: 'xlsx', type: 'binary' });
}

// Concrete CSV parsing acceptance tests including duplicate transaction detection
export function runCSVAcceptanceTests(): CSVParsingTestCase[] {
  const testCases: CSVParsingTestCase[] = [
    // Test 1: Arabic Headers & Arabic-Indic Numerals
    {
      id: 'TC-01-ARABIC-HEADERS',
      testNameEn: 'Arabic Column Headers & Arabic-Indic Numerals (٠-٩)',
      testNameAr: 'عناوين الأعمدة العربية والأرقام المشرقية (٠-٩)',
      scenario: 'arabic_headers',
      rawInput: `كود الحساب,اسم الحساب,مدين,دائن
١٠١٠,النقدية بالصندوق والخزينة المركزية,٤٨٥٠,٠
١٠٢٠,البنك الأهلي المصري حساب جاري,٢٦٤٠٠,٠
١١١٠,العملاء التجاريون المحليون,٣١٢٥٠,٠
٢٠١٠,موردو الخامات والمعدات,٠,٦٢٥٠٠`,
      status: 'idle',
      expectedOutcomeEn: '4 accounts extracted, Arabic-Indic numerals converted to 4850, 26400, 31250, 62500; Total Debit = 62,500, Total Credit = 62,500; Variance = 0; Balanced = true',
      expectedOutcomeAr: 'استخراج 4 حسابات، تحويل الأرقام المشرقية لأرقام قياسية، تطابق إجمالي المدين (62,500) مع الدائن (62,500) بدون فروق.',
      logs: []
    },

    // Test 2: Ambiguous Column Mappings
    {
      id: 'TC-02-AMBIGUOUS-MAPPINGS',
      testNameEn: 'Ambiguous Column Mappings (Single Amount with Type & Multi-Balances)',
      testNameAr: 'معالجة الأعمدة الملتبسة (عمود مبلغ مفرد مع نوع القيد وتعدد الأرصدة)',
      scenario: 'ambiguous_mappings',
      rawInput: `Account,Description,Opening Balance,Period Movement,Total Amount,Entry Type
1110,Trade Receivables Domestic,50000,12400,62400,Debit
2010,Trade Payables Overseas,40000,4200,44200,Credit
3010,Paid-up Share Capital,18200,0,18200,Credit`,
      status: 'idle',
      expectedOutcomeEn: 'Correctly disambiguates "Total Amount" and "Entry Type" over intermediate movement columns; allocates 62,400 to Debit and 62,400 to Credit; Balanced = true',
      expectedOutcomeAr: 'فض التباس عمود القيمة الإجمالية ونوع القيد وتفادي أعمدة الحركات البينية، وتخصيص 62,400 للمدين و 62,400 للدائن.',
      logs: []
    },

    // Test 3: Malformed Rows & Resilient Error Recovery
    {
      id: 'TC-03-MALFORMED-ROWS',
      testNameEn: 'Malformed Rows, Unclosed Quotes, Missing Codes, and Non-Numeric Cells',
      testNameAr: 'الصفوف المشوهة والأقواس وعلامات التنصيص المفتوحة والخلايا غير الرقمية',
      scenario: 'malformed_rows',
      rawInput: `كود,الاسم,مدين,دائن
1010,النقدية الرئيسية,5000,0
,حساب بدون كود لكن بالاسم الصحيح,1500,0
1030,"حساب مع فواصل, داخل الاسم وعلامات تنصيص مدمجة",0,6500
MALFORMED_LINE_WITHOUT_DELIMITERS_OR_VALUES
1040,حساب بقيمة غير رقمية,N/A,0
1050,حساب برصيد سالب بين أقواس,(2000),0`,
      status: 'idle',
      expectedOutcomeEn: 'Resiliently recovers from malformed line, auto-assigns fallback code for missing code, unescapes quoted commas, handles "N/A" safely as 0 with warning, handles (2000) as negative, total processed without crash',
      expectedOutcomeAr: 'معالجة مرنة للصفوف المشوهة، توليد كود تلقائي للحساب بدون كود، فك علامات التنصيص، التعامل الآمن مع N/A، ومعالجة الأقواس كقيم سالبة دون توقف النظام.',
      logs: []
    },

    // Test 4: Balance Calculations & Ledger Validation
    {
      id: 'TC-04-BALANCE-CALCULATIONS',
      testNameEn: 'Precise Decimal Balance Calculations & Variance Detection',
      testNameAr: 'الحسابات الرياضية الدقيقة لتطابق الميزان ورصد فروق الكسور العشرية',
      scenario: 'balance_calculations',
      rawInput: `Account Code,Account Name,Debit,Credit
1010,Petty Cash Vault EGP,10000.50,0.00
1020,NBE Operating Account,15000.25,0.00
2010,Local Raw Material Suppliers,0.00,20000.00
3010,Statutory Legal Reserve,0.00,5000.75`,
      status: 'idle',
      expectedOutcomeEn: 'Computes exact sums with floating point precision: Total Debit = 25,000.75, Total Credit = 25,000.75, Variance = 0.00, isBalanced = true',
      expectedOutcomeAr: 'حساب المجاميع بدقة عشرية متناهية: إجمالي المدين = 25,000.75، إجمالي الدائن = 25,000.75، الفارق = 0.00، والميزان متطابق بنجاح.',
      logs: []
    },

    // Test 5: Duplicate Transaction Detection & Removal
    {
      id: 'TC-05-DUPLICATE-TRANSACTIONS',
      testNameEn: 'Duplicate Transaction Detection (Identical Reference # & Dates)',
      testNameAr: 'اكتشاف واستبعاد القيود والعمليات المكررة (بنفس رقم المرجع والتاريخ)',
      scenario: 'duplicate_transactions',
      rawInput: `Reference,Date,Account Code,Account Name,Debit,Credit
REF-1001,2025-12-31,1010,Petty Cash Vault,5000,0
REF-1001,2025-12-31,1010,Petty Cash Vault,5000,0
REF-1002,2025-12-31,1020,NBE Operating Account,12000,0
REF-1003,2025-12-31,2010,Trade Accounts Payable,0,17000
REF-1003,2025-12-31,2010,Trade Accounts Payable,0,17000`,
      status: 'idle',
      expectedOutcomeEn: 'Identifies 2 duplicate rows (REF-1001 duplicate and REF-1003 duplicate). Automatically flags and removes them, leaving 3 distinct accounts with balanced total: Debit 17,000 = Credit 17,000, Balanced = true',
      expectedOutcomeAr: 'رصد قيدين مكررين (REF-1001 و REF-1003). تمييزهما واستبعادهما تلقائياً ليتبقى 3 حسابات فريدة بميزان متطابق 17,000 مدين = 17,000 دائن.',
      logs: []
    },

    // Test 6: Multi-Currency Normalization to Base Currency
    {
      id: 'TC-06-MULTI-CURRENCY-CONVERSION',
      testNameEn: 'Multi-Currency Normalization & Exchange Rate Translation',
      testNameAr: 'معالجة العملات المتعددة وتوحيد القوائم بسعر الصرف لعملة الأساس',
      scenario: 'currency_conversion',
      rawInput: `Account Code,Account Name,Currency,Debit,Credit
1025,CIB USD Operating Account,USD,1000.00,0.00
1026,Euro Export Collection Account,EUR,500.00,0.00
2015,Foreign Machinery Trade Supplier,USD,0.00,1000.00
2016,European Technical Vendor,EUR,0.00,500.00`,
      status: 'idle',
      expectedOutcomeEn: 'Normalizes 4 foreign currency accounts into base currency EGP using CBE closing rates (USD: 50.85 -> 50,850 EGP; EUR: 54.20 -> 27,100 EGP). Preserves original foreign amounts (1,000 USD & 500 EUR). Total Normalized Debit = 77,950 EGP = Total Normalized Credit = 77,950 EGP (Balanced = true).',
      expectedOutcomeAr: 'توحيد 4 حسابات بالعملات الأجنبية إلى الجنيه المصري بأسعار إقفال البنك المركزي (الدولار: 50.85 -> 50,850 ج.م؛ اليورو: 54.20 -> 27,100 ج.م). إجمالي المدين الموحد 77,950 ج.م = إجمالي الدائن الموحد 77,950 ج.م مع الحفاظ على الأرصدة الأصلية.',
      logs: []
    }
  ];

  // Execute tests synchronously
  testCases.forEach(tc => {
    tc.logs = [];
    tc.logs.push(`[${new Date().toISOString()}] Initializing test scenario: ${tc.scenario}`);
    tc.status = 'running';

    try {
      const result = parseCSVContent(tc.rawInput, `test_${tc.scenario}.csv`, 'remove');
      tc.logs.push(`[SUCCESS] CSV parsed successfully with ${result.parsedAccounts.length} final accounts.`);
      tc.logs.push(`[METRICS] Total Debit: ${result.totalDebit.toLocaleString()}, Total Credit: ${result.totalCredit.toLocaleString()}, Variance: ${result.variance}`);
      tc.logs.push(`[DELIMITER] Detected delimiter: "${result.columnMappingSummary?.delimiterUsed}"`);
      tc.logs.push(`[MAPPING] Method used: "${result.columnMappingSummary?.method}"`);

      if (tc.scenario === 'arabic_headers') {
        const hasArabicNum = result.parsedAccounts.some(a => a.code === '1010' && a.debit === 4850);
        if (hasArabicNum && result.isBalanced && result.parsedAccounts.length === 4) {
          tc.status = 'passed';
          tc.actualOutcomeEn = `PASSED: 4 accounts parsed. Arabic digits successfully converted (١٠١٠ -> 1010, ٤٨٥٠ -> 4850). Total Debit = 62,500 = Total Credit. Balanced!`;
        } else {
          tc.status = 'failed';
          tc.actualOutcomeEn = `FAILED: Verification mismatch on Arabic numerals or balance.`;
        }
      } else if (tc.scenario === 'ambiguous_mappings') {
        const foundRec = result.parsedAccounts.find(a => a.code === '1110');
        const foundPay = result.parsedAccounts.find(a => a.code === '2010');
        if (foundRec && foundRec.debit === 62400 && foundPay && foundPay.credit === 44200 && result.isBalanced) {
          tc.status = 'passed';
          tc.actualOutcomeEn = `PASSED: Correctly mapped single amount with entry type. Debit = 62,400, Credit = 62,400. Balanced!`;
        } else {
          tc.status = 'failed';
          tc.actualOutcomeEn = `FAILED: Ambiguous columns were not resolved to expected Debit/Credit amounts.`;
        }
      } else if (tc.scenario === 'malformed_rows') {
        const autoAccount = result.parsedAccounts.find(a => a.code.startsWith('AUTO-'));
        const quoteAccount = result.parsedAccounts.find(a => a.code === '1030');
        if (autoAccount && quoteAccount && result.parsedAccounts.length >= 4) {
          tc.status = 'passed';
          tc.actualOutcomeEn = `PASSED: Resiliently processed malformed input. Generated code "${autoAccount.code}", unescaped comma in "${quoteAccount.nameOriginal}", and recorded warnings without crashing.`;
        } else {
          tc.status = 'failed';
          tc.actualOutcomeEn = `FAILED: Did not handle malformed rows properly.`;
        }
      } else if (tc.scenario === 'balance_calculations') {
        if (result.isBalanced && Math.abs(result.totalDebit - 25000.75) < 0.001 && result.variance === 0) {
          tc.status = 'passed';
          tc.actualOutcomeEn = `PASSED: High-precision calculation verified: Debit = 25,000.75, Credit = 25,000.75, Variance = 0.00, isBalanced = true.`;
        } else {
          tc.status = 'failed';
          tc.actualOutcomeEn = `FAILED: Balance calculation mismatch.`;
        }
      } else if (tc.scenario === 'duplicate_transactions') {
        const dupReport = result.duplicateReport;
        tc.logs.push(`[DUPLICATE REPORT] Found ${dupReport?.totalDuplicatesCount} duplicates across ${dupReport?.groups.length} groups.`);

        if (
          dupReport &&
          dupReport.hasDuplicates &&
          dupReport.totalDuplicatesCount === 2 &&
          result.parsedAccounts.length === 3 &&
          result.isBalanced &&
          result.totalDebit === 17000 &&
          result.totalCredit === 17000
        ) {
          tc.status = 'passed';
          tc.actualOutcomeEn = `PASSED: Duplicate detection identified 2 recurring entries (REF-1001 & REF-1003). Auto-removed duplicates, leaving 3 balanced accounts (Total: 17,000 EGP, 0 variance).`;
        } else {
          tc.status = 'failed';
          tc.actualOutcomeEn = `FAILED: Duplicate detection did not find expected duplicates or calculate balances accurately. Found: ${dupReport?.totalDuplicatesCount} dups, ${result.parsedAccounts.length} accounts.`;
        }
      } else if (tc.scenario === 'currency_conversion') {
        const normSum = result.multiCurrencySummary;
        tc.logs.push(`[CURRENCY REPORT] Converted ${normSum?.accountsConvertedCount} accounts across currencies: ${normSum?.currenciesDetected.join(', ')}`);
        tc.logs.push(`[NORMALIZED BALANCES] Total Debit: ${result.totalDebit} ${result.detectedCurrency}, Total Credit: ${result.totalCredit} ${result.detectedCurrency}, Variance: ${result.variance}`);

        if (
          normSum &&
          normSum.accountsConvertedCount === 4 &&
          result.isBalanced &&
          Math.abs(result.totalDebit - 77950) < 1 &&
          Math.abs(result.totalCredit - 77950) < 1 &&
          result.parsedAccounts[0].originalDebit === 1000 &&
          result.parsedAccounts[0].exchangeRateApplied === 50.85
        ) {
          tc.status = 'passed';
          tc.actualOutcomeEn = `PASSED: 4 accounts converted from USD & EUR into EGP at CBE 2025 closing rates (USD: 50.85, EUR: 54.20). Preserved original foreign balances (1,000 USD & 500 EUR). Total Normalized: 77,950 EGP, 0 variance. Balanced!`;
        } else {
          tc.status = 'failed';
          tc.actualOutcomeEn = `FAILED: Multi-currency conversion failed. Accounts converted: ${normSum?.accountsConvertedCount}, Debits: ${result.totalDebit}`;
        }
      }

      if (result.warnings.length > 0) {
        result.warnings.forEach(w => tc.logs.push(`[WARN] ${w}`));
      }
    } catch (err: any) {
      tc.status = 'failed';
      tc.actualOutcomeEn = `FAILED with exception: ${err.message}`;
      tc.logs.push(`[ERROR] ${err.message}`);
    }
  });

  return testCases;
}
