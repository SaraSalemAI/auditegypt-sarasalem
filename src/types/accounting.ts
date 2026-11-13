// Core Accounting & Financial Intelligence Types for LEDGER IQ

export type AccountingFramework = 'EAS' | 'IFRS';
export type OutputLanguage = 'en' | 'ar' | 'bilingual';
export type CurrencyCode = 'EGP' | 'USD' | 'EUR' | 'GBP' | 'SAR' | 'AED';
export type ScaleUnit = 'units' | 'thousands' | 'millions';

export type AccountNature = 'debit' | 'credit';

export type FinancialStatementType = 'BS' | 'IS' | 'CF';

export type AccountCategory =
  // Balance Sheet - Assets
  | 'Cash & Cash Equivalents'
  | 'Trade & Other Receivables'
  | 'Inventory'
  | 'Prepayments & Current Assets'
  | 'Property, Plant & Equipment'
  | 'Accumulated Depreciation'
  | 'Intangible Assets'
  | 'Right-of-Use Assets'
  | 'Long-term Investments'
  | 'Deferred Tax Assets'
  | 'Other Non-current Assets'
  // Balance Sheet - Liabilities
  | 'Trade & Other Payables'
  | 'Short-term Borrowings'
  | 'Current Lease Liabilities'
  | 'Accrued Expenses & Provisions'
  | 'Long-term Borrowings'
  | 'Non-current Lease Liabilities'
  | 'Deferred Tax Liabilities'
  | 'Other Non-current Liabilities'
  // Balance Sheet - Equity
  | 'Share Capital'
  | 'Legal & Statutory Reserves'
  | 'General & Other Reserves'
  | 'Retained Earnings'
  | 'Other Comprehensive Income'
  // Income Statement
  | 'Revenue'
  | 'Cost of Sales'
  | 'Selling & Distribution Expenses'
  | 'General & Administrative Expenses'
  | 'Depreciation & Amortization'
  | 'Other Operating Income/Expense'
  | 'Finance Income'
  | 'Finance Costs'
  | 'Income Tax Expense'
  // Cash Flow specific
  | 'Operating Activities'
  | 'Investing Activities'
  | 'Financing Activities'
  | 'Suspense & Unclassified';

export interface AccountRow {
  id: string;
  code: string;
  nameOriginal: string;
  nameEn: string;
  nameAr: string;
  debit: number;
  credit: number;
  openingBalance: number;
  closingBalance: number;
  netBalance: number;
  nature: AccountNature;
  fsStatement: FinancialStatementType;
  category: AccountCategory;
  subCategory?: string;
  confidence: number; // 0.0 - 1.0
  mappingStatus: 'auto' | 'confirmed' | 'overridden';
  sourceFile: string;
  sheetName?: string;
  rowNumber: number;
  languageDetected: 'ar' | 'en' | 'mixed';
  notes?: string;
  refNumber?: string;
  entryDate?: string;
  isDuplicate?: boolean;
  duplicateReason?: string;
  duplicateGroupId?: string;
  originalCurrency?: CurrencyCode;
  originalDebit?: number;
  originalCredit?: number;
  exchangeRateApplied?: number;
  rateTypeApplied?: 'cbe_closing_2025' | 'cbe_historical_2024' | 'live_spot' | 'custom_override';
  rateDateApplied?: string;
}

export interface JournalEntryLine {
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  debit: number;
  credit: number;
  memo?: string;
}

export interface JournalEntry {
  id: string;
  entryNumber: string;
  date: string;
  period: string;
  reference: string;
  descriptionEn: string;
  descriptionAr: string;
  sourceFile: string;
  lines: JournalEntryLine[];
  isBalanced: boolean;
  postedBy: string;
  postedDate: string;
}

export interface SubledgerItem {
  id: string;
  subledgerType: 'AR' | 'AP' | 'Bank' | 'Inventory' | 'FixedAssets' | 'Payroll';
  entityNameEn: string;
  entityNameAr: string;
  referenceCode: string;
  glControlAccount: string;
  balance: number;
  glReconciledBalance: number;
  variance: number;
  status: 'reconciled' | 'variance' | 'unmatched';
  notes?: string;
}

export interface ValidationIssue {
  id: string;
  type: 'error' | 'warning' | 'info';
  category: 'Trial Balance' | 'General Ledger' | 'Subledger' | 'Sign Convention' | 'Suspense' | 'Period Cut-off';
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  accountCode?: string;
  amount?: number;
  sourceFile: string;
  sheetOrRow?: string;
  recommendedActionEn: string;
  recommendedActionAr: string;
  status: 'pending' | 'resolved' | 'acknowledged';
}

export interface EvidenceStep {
  stage: string;
  stageAr: string;
  detail: string;
  detailAr: string;
  value?: string | number;
  reference?: string;
}

export interface EvidenceTrace {
  id: string;
  targetMetricEn: string;
  targetMetricAr: string;
  currentValue: number | string;
  formulaEn: string;
  formulaAr: string;
  fsLineItemEn: string;
  fsLineItemAr: string;
  mappedAccounts: {
    code: string;
    nameEn: string;
    nameAr: string;
    amount: number;
  }[];
  sourceFile: string;
  sourceSheet: string;
  sourceRow: string;
  rawRecord: Record<string, any>;
  benchmarkSource?: {
    organization: string;
    publicationYear: number;
    datasetName: string;
    benchmarkValue: string;
    sampleSize: string;
    methodology: string;
  };
  approvalHistory?: {
    approvedBy: string;
    timestamp: string;
    comments: string;
  };
}

export interface RatioItem {
  id: string;
  key: string;
  nameEn: string;
  nameAr: string;
  category: 'Liquidity' | 'Profitability' | 'Efficiency' | 'Solvency' | 'CashFlow' | 'Growth';
  definitionEn: string;
  definitionAr: string;
  formulaEn: string;
  formulaAr: string;
  formulaComponents: { labelEn: string; labelAr: string; value: number }[];
  currentValue: number;
  previousValue: number;
  unit: 'x' | '%' | 'days' | 'EGP' | 'ratio';
  higherIsBetter: boolean | 'optimal_range';
  optimalRange?: [number, number];
  benchmarkAverage: number;
  benchmarkMedian: number;
  benchmarkP25: number;
  benchmarkP75: number;
  benchmarkSource: string;
  gapVsBenchmark: number;
  positionVsIndustry: 'above' | 'in_line' | 'below' | 'optimal';
  interpretationEn: string;
  interpretationAr: string;
  recommendedActionEn: string;
  recommendedActionAr: string;
  evidenceTraceId: string;
}

export interface SectorBenchmarkData {
  industryId: string;
  industryNameEn: string;
  industryNameAr: string;
  subSectorEn: string;
  subSectorAr: string;
  country: string;
  reportingYear: string;
  sourceOrg: string;
  reportName: string;
  sampleSize: number;
  sourceUrl: string;
  methodologyNotes: string;
  ratios: Record<string, {
    average: number;
    median: number;
    p25: number;
    p75: number;
    topQuartile: number;
    unit: string;
  }>;
}

export interface PeerCompany {
  id: string;
  nameEn: string;
  nameAr: string;
  ticker?: string;
  revenue: number;
  netIncome: number;
  assets: number;
  currentRatio: number;
  grossMargin: number;
  netMargin: number;
  debtToEquity: number;
  ccc: number;
}

export interface AIInsightItem {
  id: string;
  category: 'Balance Sheet' | 'Income Statement' | 'Cash Flow' | 'Ratios' | 'Benchmarking' | 'Risk' | 'Treasury';
  titleEn: string;
  titleAr: string;
  findingEn: string;
  findingAr: string;
  financialSignificanceEn: string;
  financialSignificanceAr: string;
  amountInvolved?: number;
  relatedAccountOrRatio: string;
  period: string;
  possibleCauseEn: string;
  possibleCauseAr: string;
  evidenceEn: string;
  evidenceAr: string;
  recommendedActionEn: string;
  recommendedActionAr: string;
  severity: 'critical' | 'warning' | 'positive' | 'info';
  confidence: number;
  status: 'reviewed' | 'pending' | 'implemented';
  evidenceTraceId: string;
}

export interface TranslationConcept {
  id: string;
  conceptKey: string;
  termEn: string;
  termAr: string;
  easPreferredEn: string;
  easPreferredAr: string;
  ifrsPreferredEn: string;
  ifrsPreferredAr: string;
  synonymsEn: string[];
  synonymsAr: string[];
  category: string;
  definitionEn: string;
  definitionAr: string;
  relevantFramework: 'Both' | 'EAS' | 'IFRS';
  approvalStatus: 'approved' | 'pending' | 'custom';
  updatedAt: string;
}

export interface FiveYearAssumption {
  scenario: 'base' | 'optimistic' | 'pessimistic';
  revenueGrowthPct: number[]; // 5 years
  grossMarginPct: number;
  opexRatioPct: number;
  taxRatePct: number;
  interestRatePct: number;
  dsoDays: number;
  dpoDays: number;
  dioDays: number;
  capexPctRevenue: number;
  dividendPayoutPct: number;
}

export interface BudgetVarianceRow {
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  category: string;
  budgetAmount: number;
  actualAmount: number;
  varianceAbs: number;
  variancePct: number;
  isFavorable: boolean;
  explanationEn: string;
  explanationAr: string;
  actionEn: string;
  actionAr: string;
}

export interface DisclosureChecklistItem {
  id: string;
  standardRef: string;
  standardName: string;
  framework: AccountingFramework;
  topicEn: string;
  topicAr: string;
  requirementEn: string;
  requirementAr: string;
  availableDataEn: string;
  availableDataAr: string;
  missingDataEn?: string;
  missingDataAr?: string;
  draftWordingEn: string;
  draftWordingAr: string;
  status: 'compliant' | 'review_required' | 'data_missing';
  reviewedBy?: string;
}

export interface AuditRiskItem {
  id: string;
  assertion: 'Existence' | 'Completeness' | 'Accuracy' | 'Valuation' | 'Rights & Obligations' | 'Cut-off' | 'Classification' | 'Presentation';
  assertionAr: string;
  descriptionEn: string;
  descriptionAr: string;
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  amountInvolved: number;
  severity: 'high' | 'medium' | 'low';
  auditProcedureEn: string;
  auditProcedureAr: string;
  managementResponseEn?: string;
  managementResponseAr?: string;
  reviewerDecision: 'pending' | 'flagged_for_testing' | 'cleared' | 'adjustment_required';
  evidenceTraceId: string;
}

export interface UploadedFileMeta {
  id: string;
  name: string;
  category: string;
  size: number;
  uploadedAt: string;
  detectedType: 'xlsx' | 'xls' | 'csv' | 'pdf';
  detectedLanguage: 'ar' | 'en' | 'mixed';
  detectedPeriod: string;
  detectedCurrency: CurrencyCode;
  detectedScale: ScaleUnit;
  rowsCount: number;
  sheets: string[];
  status: 'uploaded' | 'parsing' | 'validated' | 'error';
  errorMessage?: string;
}

export interface CompanyEntity {
  id: string;
  nameEn: string;
  nameAr: string;
  crNumber: string;
  taxRegistrationNumber: string;
  country: string;
  industryEn: string;
  industryAr: string;
  subIndustryEn: string;
  subIndustryAr: string;
  legalStructureEn: string;
  legalStructureAr: string;
  reportingFramework: AccountingFramework;
  baseCurrency: CurrencyCode;
  reportingPeriod: string;
  comparativePeriod: string;
  scale: ScaleUnit;
}

export type TaxVerificationStatus =
  | 'verified_statutory'
  | 'mandatory_compliance'
  | 'active_e_invoicing'
  | 'statutory_contribution';

export interface EgyptianTaxRequirement {
  id: string;
  taxType: 'CorporateIncomeTax' | 'VAT' | 'WithholdingTax' | 'EInvoicing' | 'HealthInsurance' | 'StampDuty';
  lawCitation: string;
  articleRef: string;
  effectiveDate: string;
  officialSource: string;
  verificationStatus: TaxVerificationStatus;
  topicEn: string;
  topicAr: string;
  rateOrRuleEn: string;
  rateOrRuleAr: string;
  notesEn: string;
  notesAr: string;
}

export interface BatchFileQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  category: string;
  status: 'queued' | 'parsing' | 'detecting' | 'completed' | 'error';
  progress: number;
  stageEn: string;
  stageAr: string;
  result?: any;
  error?: string;
}

export interface CSVParsingTestCase {
  id: string;
  testNameEn: string;
  testNameAr: string;
  scenario: 'arabic_headers' | 'ambiguous_mappings' | 'malformed_rows' | 'balance_calculations' | 'duplicate_transactions' | 'currency_conversion';
  rawInput: string;
  status: 'idle' | 'running' | 'passed' | 'failed';
  expectedOutcomeEn: string;
  expectedOutcomeAr: string;
  actualOutcomeEn?: string;
  logs: string[];
}

export interface DuplicateEntryGroup {
  groupId: string;
  matchCriteria: 'identical_ref' | 'identical_date_and_code' | 'identical_recurring_entry';
  matchKey: string;
  refNumber?: string;
  entryDate?: string;
  accountCode: string;
  accountName: string;
  primaryEntryId: string;
  duplicateEntryIds: string[];
  totalOccurrences: number;
  duplicateDebitAmount: number;
  duplicateCreditAmount: number;
  descriptionEn: string;
  descriptionAr: string;
}

export interface DuplicateDetectionReport {
  hasDuplicates: boolean;
  totalDuplicatesCount: number;
  groups: DuplicateEntryGroup[];
  totalDuplicateDebit: number;
  totalDuplicateCredit: number;
  activeRemedy: 'flag' | 'remove' | 'merge';
}

export type ExchangeRateType = 'cbe_closing_2025' | 'cbe_historical_2024' | 'live_spot' | 'custom_override';

export interface ExchangeRateRecord {
  currency: CurrencyCode;
  rateToBase: number; // 1 Foreign Currency = X Base Currency (e.g., 1 USD = 50.85 EGP)
  baseCurrency: CurrencyCode;
  effectiveDate: string;
  source: string;
  rateType: ExchangeRateType;
  isOverride?: boolean;
}

export interface MultiCurrencyConversionSummary {
  baseCurrency: CurrencyCode;
  currenciesDetected: CurrencyCode[];
  accountsConvertedCount: number;
  ratesApplied: Record<string, number>;
  rateTypeUsed: ExchangeRateType;
  totalOriginalDebitsByCurrency: Record<string, number>;
  totalOriginalCreditsByCurrency: Record<string, number>;
  totalNormalizedDebit: number;
  totalNormalizedCredit: number;
  normalizedVariance: number;
  isBalancedInBaseCurrency: boolean;
}
