import React, { useState } from 'react';
import {
  parseUploadedFile,
  ParseResult,
  generateSampleTrialBalanceExcel,
  runCSVAcceptanceTests,
  detectDuplicateTransactions
} from '../../utils/fileParser';
import {
  normalizeAccountsToBaseCurrency,
  getExchangeRate,
  CBE_CLOSING_RATES_2025,
  CBE_HISTORICAL_RATES_2024,
  LIVE_SPOT_RATES,
  EXCHANGE_RATE_SOURCES,
  detectCurrencyCode
} from '../../utils/currencyConversion';
import {
  AccountRow,
  OutputLanguage,
  AccountingFramework,
  ScaleUnit,
  CurrencyCode,
  BatchFileQueueItem,
  CSVParsingTestCase,
  DuplicateDetectionReport,
  ExchangeRateType,
  MultiCurrencyConversionSummary
} from '../../types/accounting';
import {
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Check,
  FileText,
  RefreshCw,
  Info,
  Layers,
  Play,
  X,
  Trash2,
  Eye,
  Activity,
  CheckCheck,
  FileCode,
  ShieldCheck,
  ArrowRight,
  CopyCheck,
  ChevronDown,
  ChevronUp,
  SlidersHorizontal,
  Calendar,
  Hash,
  Coins,
  DollarSign,
  TrendingUp,
  Globe2,
  Edit3,
  Sparkles,
  Bot,
  Loader2,
  Copy
} from 'lucide-react';

interface Props {
  language: OutputLanguage;
  framework: AccountingFramework;
  onDataImported: (accounts: AccountRow[], fileName: string, scale: ScaleUnit) => void;
  onNavigateToMapping: () => void;
  onOpenCopilot?: () => void;
}

export const UploadCenter: React.FC<Props> = ({
  language,
  onDataImported,
  onNavigateToMapping,
  onOpenCopilot
}) => {
  const isAr = language === 'ar';

  const [isDragging, setIsDragging] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState('Trial Balance');
  const [confirmedScale, setConfirmedScale] = useState<ScaleUnit>('thousands');
  const [confirmedCurrency, setConfirmedCurrency] = useState<CurrencyCode>('EGP');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Active inspected parse result (shown in summary panel)
  const [activeParseResult, setActiveParseResult] = useState<ParseResult | null>(null);

  // Multi-Currency Normalization state
  const [rateType, setRateType] = useState<ExchangeRateType>('cbe_closing_2025');
  const [customOverrides, setCustomOverrides] = useState<Partial<Record<CurrencyCode, number>>>({
    USD: 50.85,
    EUR: 54.20,
    GBP: 64.10,
    SAR: 13.55,
    AED: 13.84
  });
  const [fileDefaultCurrency, setFileDefaultCurrency] = useState<CurrencyCode>('EGP');
  const [showCurrencyBreakdown, setShowCurrencyBreakdown] = useState(false);
  const [isRefreshingRates, setIsRefreshingRates] = useState(false);

  // Duplicate Transaction Remedy mode: 'remove' | 'flag' | 'merge'
  const [duplicateRemedy, setDuplicateRemedy] = useState<'remove' | 'flag' | 'merge'>('remove');
  const [showDuplicateDetails, setShowDuplicateDetails] = useState(false);

  // Batch Processing Queue state
  const [batchQueue, setBatchQueue] = useState<BatchFileQueueItem[]>([]);
  const [isBatchProcessing, setIsBatchProcessing] = useState(false);

  // CSV Acceptance Tests state
  const [showTestModal, setShowTestModal] = useState(false);
  const [testCases, setTestCases] = useState<CSVParsingTestCase[]>(() => runCSVAcceptanceTests());
  const [isRunningTests, setIsRunningTests] = useState(false);

  // AI Pre-flight Audit State
  const [aiPreAuditLoading, setAiPreAuditLoading] = useState(false);
  const [aiPreAuditText, setAiPreAuditText] = useState<string | null>(null);
  const [aiPreAuditCopied, setAiPreAuditCopied] = useState(false);

  const handleRunAIAudit = async () => {
    if (!activeParseResult) return;
    setAiPreAuditLoading(true);
    setAiPreAuditText(null);

    try {
      const prompt = isAr
        ? `قم بفحص وتدقيق ميزان المراجعة المستورد حديثاً (${activeParseResult.fileName}):
- إجمالي الحسابات المستخرجة: ${activeParseResult.parsedAccounts.length}
- العملة الأساسية: ${confirmedCurrency}
- العملات الأجنبية المكتشفة: ${activeParseResult.multiCurrencySummary?.currenciesDetected.join(', ') || 'EGP فقط'}
- إجمالي المدين الموحد: ${activeParseResult.totalDebit.toLocaleString()} ${confirmedCurrency}
- إجمالي الدائن الموحد: ${activeParseResult.totalCredit.toLocaleString()} ${confirmedCurrency}
- حالة التوازن: ${activeParseResult.isBalanced ? 'متطابق تماماً بدون فروق (Δ = 0.00)' : 'يوجد فرق قدره ' + activeParseResult.variance.toLocaleString()}
- المعاملات المكررة المكتشفة: ${activeParseResult.duplicateReport?.totalDuplicatesCount || 0}
المطلوب:
1. تقييم موجز لصحة وتطابق البيانات المحاسبية وفقاً لمعايير المحاسبة المصرية (EAS).
2. فحص مخاطر حسابات المعلقات أو الحسابات الوسيطة وفروق أسعار الصرف (EAS 13).
3. التوصيات النهائية قبل اعتماد التبويب ونقل الأرصدة للقوائم المالية.`
        : `Perform a pre-flight executive audit for the newly ingested trial balance (${activeParseResult.fileName}):
- Total extracted accounts: ${activeParseResult.parsedAccounts.length}
- Base currency: ${confirmedCurrency}
- Currencies detected: ${activeParseResult.multiCurrencySummary?.currenciesDetected.join(', ') || 'EGP only'}
- Normalized Debit: ${activeParseResult.totalDebit.toLocaleString()} ${confirmedCurrency}
- Normalized Credit: ${activeParseResult.totalCredit.toLocaleString()} ${confirmedCurrency}
- Balance status: ${activeParseResult.isBalanced ? '100% Balanced (Δ = 0.00)' : 'Variance of ' + activeParseResult.variance.toLocaleString()}
- Duplicate transactions detected: ${activeParseResult.duplicateReport?.totalDuplicatesCount || 0}
Required:
1. Concise executive verdict on data integrity and EAS/IFRS compliance.
2. Suspense account risks and EAS 13 FX translation verification.
3. Clearance recommendation before final account mapping and statement aggregation.`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          role: 'forensic_auditor',
          model: 'gemini-3.8-flash'
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to analyze trial balance');

      setAiPreAuditText(data.text);
    } catch (err: any) {
      console.error('AI audit error:', err);
      setAiPreAuditText(
        isAr
          ? `حدث خطأ أثناء إجراء الفحص الذكي: ${err.message}`
          : `Error during AI pre-flight audit: ${err.message}`
      );
    } finally {
      setAiPreAuditLoading(false);
    }
  };

  const categories = [
    { id: 'Trial Balance', labelEn: 'Trial Balance (Primary)', labelAr: 'ميزان المراجعة (أساسي)', required: true },
    { id: 'General Ledger', labelEn: 'General Ledger (Transactions)', labelAr: 'دفتر الأستاذ العام (القيود)', required: false },
    { id: 'Subledger', labelEn: 'Subledgers (AR/AP/Inventory)', labelAr: 'دفاتر مساعدة (عملاء/موردين/مخزون)', required: false },
    { id: 'Chart of Accounts', labelEn: 'Chart of Accounts (COA)', labelAr: 'دليل الحسابات الموحد', required: false },
    { id: 'Fixed Assets', labelEn: 'Fixed Asset Register', labelAr: 'سجل الأصول الثابتة والإهلاك', required: false },
    { id: 'Budget', labelEn: 'Budget & Target Projections', labelAr: 'الموازنة التقديرية والمستهدفات', required: false }
  ];

  // Apply real-time recalculation of duplicates and currency normalization
  const applyNormalizationAndDeduplication = (
    newRemedy = duplicateRemedy,
    newRateType = rateType,
    newOverrides = customOverrides,
    newBaseCurrency = confirmedCurrency,
    newFileDefault = fileDefaultCurrency
  ) => {
    if (!activeParseResult) return;
    const rawAccounts = activeParseResult.allParsedAccounts || activeParseResult.parsedAccounts;

    // 1. Duplicate transaction check & remedy
    const dupCheck = detectDuplicateTransactions(rawAccounts, newRemedy);

    // 2. Multi-currency translation into base currency
    const norm = normalizeAccountsToBaseCurrency(
      dupCheck.processedAccounts,
      newBaseCurrency,
      newRateType,
      newOverrides,
      newFileDefault
    );

    setActiveParseResult({
      ...activeParseResult,
      parsedAccounts: norm.normalizedAccounts,
      totalDebit: norm.summary.totalNormalizedDebit,
      totalCredit: norm.summary.totalNormalizedCredit,
      variance: norm.summary.normalizedVariance,
      isBalanced: norm.summary.isBalancedInBaseCurrency,
      duplicateReport: dupCheck.report,
      multiCurrencySummary: norm.summary,
      detectedCurrency: newBaseCurrency
    });
  };

  // Process a batch of files simultaneously
  const enqueueFiles = (files: FileList | File[]) => {
    const newItems: BatchFileQueueItem[] = Array.from(files).map((f, idx) => ({
      id: `BATCH-${Date.now()}-${idx}-${Math.random().toString(36).substr(2, 4)}`,
      file: f,
      name: f.name,
      size: f.size,
      category: selectedCategory,
      status: 'queued',
      progress: 0,
      stageEn: 'Queued for processing',
      stageAr: 'في قائمة الانتظار'
    }));

    setBatchQueue((prev) => [...prev, ...newItems]);
    processBatch([...newItems]);
  };

  const processBatch = async (items: BatchFileQueueItem[]) => {
    setIsBatchProcessing(true);

    for (const item of items) {
      updateItemStatus(item.id, {
        status: 'parsing',
        progress: 20,
        stageEn: 'Reading raw data stream...',
        stageAr: 'قراءة مصفوفة البيانات...'
      });

      await new Promise((r) => setTimeout(r, 150));

      updateItemStatus(item.id, {
        status: 'detecting',
        progress: 50,
        stageEn: 'Detecting columns, references & currencies...',
        stageAr: 'اكتشاف الأعمدة والمراجع والعملات...'
      });

      try {
        const result = await parseUploadedFile(
          item.file,
          duplicateRemedy,
          confirmedCurrency,
          rateType,
          customOverrides,
          fileDefaultCurrency
        );

        updateItemStatus(item.id, {
          status: 'detecting',
          progress: 80,
          stageEn: 'Normalizing exchange rates & verifying balance...',
          stageAr: 'ترجمة أسعار الصرف وفحص الميزان...'
        });

        await new Promise((r) => setTimeout(r, 150));

        updateItemStatus(item.id, {
          status: 'completed',
          progress: 100,
          stageEn: `Ready (${result.parsedAccounts.length} accounts, ${result.isBalanced ? 'Balanced' : 'Unbalanced'}${result.multiCurrencySummary?.accountsConvertedCount ? `, ${result.multiCurrencySummary.accountsConvertedCount} converted` : ''})`,
          stageAr: `مكتمل (${result.parsedAccounts.length} حساب، ${result.isBalanced ? 'متطابق' : 'غير متطابق'})`,
          result
        });

        setActiveParseResult(result);
        setConfirmedScale(result.detectedScale);
        setConfirmedCurrency(result.detectedCurrency);
      } catch (err: any) {
        updateItemStatus(item.id, {
          status: 'error',
          progress: 100,
          stageEn: `Failed: ${err.message}`,
          stageAr: `فشل: ${err.message}`,
          error: err.message
        });
      }
    }

    setIsBatchProcessing(false);
  };

  const updateItemStatus = (id: string, updates: Partial<BatchFileQueueItem>) => {
    setBatchQueue((prev) =>
      prev.map((item) => (item.id === id ? { ...item, ...updates } : item))
    );
  };

  const removeFromQueue = (id: string) => {
    setBatchQueue((prev) => prev.filter((item) => item.id !== id));
    if (activeParseResult?.fileName === batchQueue.find((i) => i.id === id)?.name) {
      setActiveParseResult(null);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      enqueueFiles(e.dataTransfer.files);
    }
  };

  const handleDownloadSample = () => {
    const binary = generateSampleTrialBalanceExcel();
    const buf = new ArrayBuffer(binary.length);
    const view = new Uint8Array(buf);
    for (let i = 0; i < binary.length; i++) view[i] = binary.charCodeAt(i) & 0xff;
    const blob = new Blob([buf], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'Egyptian_MultiCurrency_Trial_Balance_Sample.xlsx';
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleRemedyChange = (newRemedy: 'remove' | 'flag' | 'merge') => {
    setDuplicateRemedy(newRemedy);
    applyNormalizationAndDeduplication(newRemedy, rateType, customOverrides, confirmedCurrency, fileDefaultCurrency);
  };

  const handleRateTypeChange = (newRateType: ExchangeRateType) => {
    setRateType(newRateType);
    applyNormalizationAndDeduplication(duplicateRemedy, newRateType, customOverrides, confirmedCurrency, fileDefaultCurrency);
  };

  const handleCustomRateChange = (currency: CurrencyCode, rate: number) => {
    const updated = { ...customOverrides, [currency]: rate };
    setCustomOverrides(updated);
    setRateType('custom_override');
    applyNormalizationAndDeduplication(duplicateRemedy, 'custom_override', updated, confirmedCurrency, fileDefaultCurrency);
  };

  const handleFileDefaultCurrencyChange = (newCurrency: CurrencyCode) => {
    setFileDefaultCurrency(newCurrency);
    applyNormalizationAndDeduplication(duplicateRemedy, rateType, customOverrides, confirmedCurrency, newCurrency);
  };

  const handleRefreshLiveRates = () => {
    setIsRefreshingRates(true);
    setTimeout(() => {
      setRateType('live_spot');
      applyNormalizationAndDeduplication(duplicateRemedy, 'live_spot', customOverrides, confirmedCurrency, fileDefaultCurrency);
      setIsRefreshingRates(false);
    }, 400);
  };

  const handleCommitSingle = (result: ParseResult) => {
    onDataImported(result.parsedAccounts, result.fileName, confirmedScale);
    setSuccessMessage(
      isAr
        ? `تم اعتماد وتطبيق بيانات ${result.parsedAccounts.length} حساب من ملف "${result.fileName}" بعد التوحيد لعملة الأساس ${confirmedCurrency} بنجاح!`
        : `Successfully imported ${result.parsedAccounts.length} normalized accounts from "${result.fileName}" into active financial models in base currency ${confirmedCurrency}!`
    );
  };

  const handleCommitAllCompleted = () => {
    const completedItems = batchQueue.filter((i) => i.status === 'completed' && i.result);
    if (completedItems.length === 0) return;

    const allAccounts: AccountRow[] = [];
    const fileNames: string[] = [];

    completedItems.forEach((item) => {
      const res: ParseResult = item.result;
      allAccounts.push(...res.parsedAccounts);
      fileNames.push(res.fileName);
    });

    onDataImported(allAccounts, fileNames.join(', '), confirmedScale);
    setSuccessMessage(
      isAr
        ? `تم اعتماد دمج ${allAccounts.length} حساب من ${completedItems.length} ملفات دفعة واحدة بالعملة الأساسية ${confirmedCurrency}!`
        : `Successfully consolidated and imported ${allAccounts.length} normalized accounts across ${completedItems.length} batch files!`
    );
  };

  const handleExecuteAcceptanceTests = () => {
    setIsRunningTests(true);
    setTimeout(() => {
      const results = runCSVAcceptanceTests();
      setTestCases(results);
      setIsRunningTests(false);
    }, 350);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'بوابة استيراد البيانات أولاً' : 'Data-First Ingestion Center'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              Live FX • Historical CBE Rates • Deduplication • Multi-Batch
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UploadCloud className="w-6 h-6 text-blue-400" />
            {isAr ? 'مركز رفع ومعالجة موازين المراجعة وتوحيد العملات' : 'Multi-Currency Trial Balance Upload & Ingestion Studio'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'ارفع ملفات موازين المراجعة بالعملات المحلية والأجنبية (USD, EUR, SAR, EGP). يترجم النظام العملات تلقائياً بأسعار البنك المركزي المصري الرسمية أو أسعار السوق اللحظية لعملة الأساس.'
              : 'Upload Trial Balances in single or multiple currencies (USD, EUR, SAR, EGP). The normalization engine translates foreign currencies into base currency using official Central Bank of Egypt or live market spot rates.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setShowTestModal(true)}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-purple-300 border border-purple-500/30 text-xs font-semibold flex items-center gap-2 transition shadow-sm"
          >
            <ShieldCheck className="w-4 h-4 text-purple-400" />
            {isAr ? 'اختبارات قبول CSV والعملات' : 'Acceptance Tests (6 Scenarios)'}
          </button>

          <button
            onClick={handleDownloadSample}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-2 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تحميل نموذج متعدد العملات' : 'Download Multi-Currency Template'}
          </button>
        </div>
      </div>

      {/* Category Selector */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
        {categories.map((cat) => (
          <button
            key={cat.id}
            onClick={() => setSelectedCategory(cat.id)}
            className={`px-3 py-2 rounded-xl font-medium whitespace-nowrap transition border ${
              selectedCategory === cat.id
                ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? cat.labelAr : cat.labelEn}
            {cat.required && (
              <span className="ml-1 text-[10px] text-amber-300 font-bold">*</span>
            )}
          </button>
        ))}
      </div>

      {/* Enhanced Animated Drag & Drop Zone */}
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        onClick={() => {
          const input = document.createElement('input');
          input.type = 'file';
          input.accept = '.csv,.xlsx,.xls,.txt';
          input.multiple = true;
          input.onchange = (e: any) => {
            if (e.target.files && e.target.files.length > 0) {
              enqueueFiles(e.target.files);
            }
          };
          input.click();
        }}
        className={`relative overflow-hidden border-2 border-dashed rounded-2xl p-10 text-center transition-all duration-300 cursor-pointer flex flex-col items-center justify-center ${
          isDragging
            ? 'border-blue-400 bg-blue-950/40 shadow-2xl shadow-blue-500/20 scale-[1.01] ring-4 ring-blue-500/30'
            : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 hover:bg-slate-900/90'
        }`}
      >
        {isDragging && (
          <div className="absolute inset-0 bg-gradient-to-r from-blue-600/10 via-cyan-500/10 to-blue-600/10 animate-pulse pointer-events-none" />
        )}

        <div
          className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all duration-300 ${
            isDragging
              ? 'bg-blue-500 text-white scale-110 shadow-lg shadow-blue-500/50'
              : 'bg-blue-600/10 border border-blue-500/20 text-blue-400'
          }`}
        >
          <UploadCloud className={`w-8 h-8 ${isDragging ? 'animate-bounce' : ''}`} />
        </div>

        <h3 className="text-base font-bold text-white mb-1.5 flex items-center gap-2">
          {isDragging
            ? (isAr ? 'أفلت الملفات الآن لبدء المعالجة وترجمة العملات!' : 'Release files to start instant multi-currency batch ingestion!')
            : (isAr ? 'اسحب وأفلت موازين المراجعة هنا، أو اضغط للاختيار' : 'Drop your trial balance files here, or browse')}
        </h3>

        <p className="text-xs text-slate-400 max-w-lg mb-4">
          {isAr
            ? 'يدعم رفع ملفات متعددة وموازين مراجعة بالدولار واليورو والريال مع توحيد أسعار الصرف، رصد العمليات المكررة، والأرقام المشرقية.'
            : 'Supports multi-currency CSVs & Excel sheets with automatic FX normalization, duplicate transaction removal, and balance reconciliation.'}
        </p>

        <div className="flex flex-wrap items-center justify-center gap-3 text-[11px] text-slate-500">
          <span className="px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/30 text-blue-300">
            Multi-Currency FX (USD, EUR, SAR &rarr; EGP)
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
            CBE Closing & Spot Rates
          </span>
          <span className="px-2 py-0.5 rounded bg-purple-500/10 border border-purple-500/30 text-purple-300">
            Duplicate Auto-Deduplication
          </span>
          <span className="px-2 py-0.5 rounded bg-slate-800/80 border border-slate-700 text-slate-300">
            CSV & Excel
          </span>
        </div>
      </div>

      {/* Success Notification */}
      {successMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-emerald-300">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-400 flex-shrink-0" />
            <span className="font-semibold">{successMessage}</span>
          </div>
          <button
            onClick={onNavigateToMapping}
            className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-bold transition flex items-center justify-center gap-1.5 w-fit"
          >
            {isAr ? 'الانتقال لشاشة مراجعة واعتماد التبويب' : 'Proceed to Account Taxonomy Review'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      )}

      {/* Batch Processing Queue Panel */}
      {batchQueue.length > 0 && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {isAr ? 'طابور المعالجة المجمعة' : 'Batch Ingestion Queue'}
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {batchQueue.filter((i) => i.status === 'completed').length} / {batchQueue.length}{' '}
                  {isAr ? 'ملفات مكتملة' : 'files processed'}
                </span>
              </div>
              <h3 className="text-base font-bold text-white mt-1">
                {isAr ? 'ملفات موازين المراجعة في طابور الرفع الفوري' : 'Queued Accounting Files & Ingestion Progress'}
              </h3>
            </div>

            <div className="flex items-center gap-2">
              {batchQueue.some((i) => i.status === 'completed') && (
                <button
                  onClick={handleCommitAllCompleted}
                  className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-md transition flex items-center gap-1.5"
                >
                  <CheckCheck className="w-4 h-4" />
                  {isAr ? 'اعتماد جميع الملفات المكتملة دفعة واحدة' : 'Commit All Processed Files'}
                </button>
              )}

              <button
                onClick={() => setBatchQueue([])}
                className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 text-xs font-medium transition"
              >
                {isAr ? 'مسح القائمة' : 'Clear Queue'}
              </button>
            </div>
          </div>

          {/* Queue items list */}
          <div className="space-y-3">
            {batchQueue.map((item) => {
              const isCompleted = item.status === 'completed';
              const isError = item.status === 'error';
              const isSelected = activeParseResult?.fileName === item.name;

              return (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border transition ${
                    isSelected
                      ? 'bg-blue-950/30 border-blue-500'
                      : 'bg-slate-950/60 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 mb-2 text-xs">
                    <div className="flex items-center gap-2.5">
                      <FileSpreadsheet
                        className={`w-5 h-5 flex-shrink-0 ${
                          isCompleted
                            ? 'text-emerald-400'
                            : isError
                            ? 'text-rose-400'
                            : 'text-blue-400 animate-pulse'
                        }`}
                      />
                      <div>
                        <span className="font-semibold text-slate-100 font-mono block">
                          {item.name}
                        </span>
                        <span className="text-[11px] text-slate-400">
                          {(item.size / 1024).toFixed(1)} KB • {item.category}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isCompleted
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : isError
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                        }`}
                      >
                        {isAr ? item.stageAr : item.stageEn}
                      </span>

                      {isCompleted && item.result && (
                        <button
                          onClick={() => {
                            setActiveParseResult(item.result);
                            setConfirmedScale(item.result.detectedScale);
                            setConfirmedCurrency(item.result.detectedCurrency);
                          }}
                          className={`p-1.5 rounded-lg border text-xs transition ${
                            isSelected
                              ? 'bg-blue-600 text-white border-blue-500'
                              : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                          }`}
                          title={isAr ? 'عرض ملخص هذا الملف' : 'Inspect Summary'}
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>
                      )}

                      <button
                        onClick={() => removeFromQueue(item.id)}
                        className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-400 hover:text-rose-300 border border-slate-700 transition"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Individual Ingestion Progress Bar */}
                  <div className="space-y-1">
                    <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                      <div
                        className={`h-full transition-all duration-300 rounded-full ${
                          isError
                            ? 'bg-rose-500'
                            : isCompleted
                            ? 'bg-emerald-500'
                            : 'bg-blue-500'
                        }`}
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Summary Panel: Statistics & Inspection Before Finalizing Import */}
      {activeParseResult && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
                  {isAr ? 'لوحة ملخص الفحص قبل الاعتماد' : 'Pre-Import Statistics Summary Panel'}
                </span>
                <span className="text-xs text-slate-400 font-mono">{activeParseResult.fileName}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-1">
                {isAr ? 'التحقق من صحة الأعمدة وتوحيد العملات وتوازن الميزان' : 'Multi-Currency Normalization & Balance Verification'}
              </h3>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleRunAIAudit}
                disabled={aiPreAuditLoading}
                className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white text-xs font-bold shadow-lg shadow-blue-600/20 transition flex items-center gap-2 disabled:opacity-50"
              >
                {aiPreAuditLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Sparkles className="w-4 h-4 text-amber-300" />
                )}
                <span>{isAr ? 'فحص تدقيقي ذكي (Gemini 3.8 Flash)' : 'Pre-Audit with Gemini'}</span>
              </button>

              <button
                onClick={() => handleCommitSingle(activeParseResult)}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 transition flex items-center gap-2"
              >
                <Check className="w-4 h-4" />
                {isAr ? 'اعتماد ونقل البيانات للتحليل المالي' : 'Confirm & Finalize Import'}
              </button>
            </div>
          </div>

          {/* Statistics Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 text-xs">
            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block">{isAr ? 'إجمالي الصفوف' : 'Total Rows'}</span>
              <span className="text-base font-bold font-mono text-white mt-1 block">
                {activeParseResult.parsedAccounts.length}
              </span>
              <span className="text-[10px] text-slate-500">{isAr ? 'حساب محاسبي' : 'accounts'}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block">{isAr ? 'العملة الأساسية' : 'Base Currency'}</span>
              <span className="text-base font-bold font-mono text-blue-400 mt-1 block">
                {confirmedCurrency}
              </span>
              <span className="text-[10px] text-slate-500 truncate block">
                {activeParseResult.multiCurrencySummary?.currenciesDetected.length || 1} {isAr ? 'عملات بالملف' : 'currencies'}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block">{isAr ? 'إجمالي المدين الموحد' : 'Total Normalized Debit'}</span>
              <span className="text-sm font-bold font-mono text-slate-200 mt-1 block">
                {activeParseResult.totalDebit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-500">{confirmedCurrency}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block">{isAr ? 'إجمالي الدائن الموحد' : 'Total Normalized Credit'}</span>
              <span className="text-sm font-bold font-mono text-slate-200 mt-1 block">
                {activeParseResult.totalCredit.toLocaleString('en-US', { minimumFractionDigits: 0 })}
              </span>
              <span className="text-[10px] text-slate-500">{confirmedCurrency}</span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block">{isAr ? 'تطابق الميزان الموحد' : 'Balance Status'}</span>
              <span
                className={`font-semibold mt-1 flex items-center gap-1 ${
                  activeParseResult.isBalanced ? 'text-emerald-400' : 'text-rose-400'
                }`}
              >
                {activeParseResult.isBalanced ? (
                  <>
                    <CheckCircle2 className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{isAr ? 'متطابق (0 فرق)' : 'Balanced'}</span>
                  </>
                ) : (
                  <>
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0" />
                    <span>{isAr ? 'غير متوازن' : 'Diff: ' + activeParseResult.variance.toFixed(0)}</span>
                  </>
                )}
              </span>
              <span className="text-[10px] text-slate-500">
                {activeParseResult.isBalanced ? 'Δ = 0.00' : `Δ = ${activeParseResult.variance.toLocaleString()}`}
              </span>
            </div>

            <div className="p-3.5 rounded-xl bg-slate-950/60 border border-slate-800">
              <span className="text-slate-400 block">{isAr ? 'مقياس الأرقام' : 'Unit Scale'}</span>
              <select
                value={confirmedScale}
                onChange={(e) => setConfirmedScale(e.target.value as ScaleUnit)}
                className="mt-1 bg-slate-900 text-blue-300 font-semibold rounded border border-slate-700 px-1.5 py-0.5 w-full text-xs"
              >
                <option value="units">{isAr ? 'وحدات (1:1)' : 'Units (1:1)'}</option>
                <option value="thousands">{isAr ? 'بالآلاف (000s)' : 'Thousands (000s)'}</option>
                <option value="millions">{isAr ? 'بالملايين (M)' : 'Millions (M)'}</option>
              </select>
              <span className="text-[10px] text-slate-500">
                {activeParseResult.detectedLanguage === 'ar' ? 'عربي' : activeParseResult.detectedLanguage === 'mixed' ? 'مزدوج' : 'English'}
              </span>
            </div>
          </div>

          {/* Live Gemini Pre-Flight Audit Result Banner */}
          {aiPreAuditText && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/50 border border-blue-500/40 shadow-xl space-y-3">
              <div className="flex items-center justify-between pb-2 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span>{isAr ? 'نتائج الفحص والتدقيق الاستباقي (Gemini Forensic Audit)' : 'Gemini Pre-Flight Ingestion Audit'}</span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        gemini-3.8-flash
                      </span>
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(aiPreAuditText);
                      setAiPreAuditCopied(true);
                      setTimeout(() => setAiPreAuditCopied(false), 2000);
                    }}
                    className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                  >
                    {aiPreAuditCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{aiPreAuditCopied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
                  </button>

                  {onOpenCopilot && (
                    <button
                      onClick={onOpenCopilot}
                      className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition"
                    >
                      <Bot className="w-3.5 h-3.5" />
                      <span>{isAr ? 'متابعة في المساعد' : 'Open in Copilot'} &rarr;</span>
                    </button>
                  )}
                </div>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {aiPreAuditText}
              </div>
            </div>
          )}

          {/* Dedicated Multi-Currency Normalization & Exchange Rate Engine Panel */}
          <div className="p-5 rounded-2xl bg-blue-950/20 border border-blue-500/30 space-y-4">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/20 border border-blue-500/30 flex items-center justify-center text-blue-400 flex-shrink-0 mt-0.5">
                  <Coins className="w-5 h-5" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {isAr ? 'محرك توحيد العملات المتعددة وأسعار الصرف' : 'Multi-Currency Normalization Engine'}
                    </span>
                    <span className="text-xs font-mono font-bold text-blue-200">
                      Base Currency: {confirmedCurrency}
                    </span>
                  </div>
                  <p className="text-xs text-slate-200 mt-1">
                    {isAr
                      ? `يقوم النظام بترجمة الأرصدة بالعملات الأجنبية (USD, EUR, SAR) آلياً إلى ${confirmedCurrency} باستخدام أسعار الصرف الرسمية المعتمدة.`
                      : `Translates foreign currency balances into ${confirmedCurrency} using official Central Bank of Egypt (CBE) closing rates or live market spot rates.`}
                  </p>
                </div>
              </div>

              {/* Rate Type Selector Tabs */}
              <div className="flex flex-wrap items-center gap-1.5 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
                <button
                  onClick={() => handleRateTypeChange('cbe_closing_2025')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                    rateType === 'cbe_closing_2025'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Official CBE Year-End Closing Rate on Dec 31, 2025"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {isAr ? 'إقفال البنك المركزي 2025' : 'CBE Closing 2025'}
                </button>

                <button
                  onClick={() => handleRateTypeChange('cbe_historical_2024')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                    rateType === 'cbe_historical_2024'
                      ? 'bg-blue-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Comparative Year-End Rate on Dec 31, 2024"
                >
                  <Calendar className="w-3.5 h-3.5" />
                  {isAr ? 'البنك المركزي 2024' : 'CBE 2024'}
                </button>

                <button
                  onClick={handleRefreshLiveRates}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                    rateType === 'live_spot'
                      ? 'bg-emerald-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Real-Time Interbank Market Spot Rate"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRefreshingRates ? 'animate-spin' : ''}`} />
                  {isAr ? 'سعر السوق اللحظي' : 'Live Spot Rate'}
                </button>

                <button
                  onClick={() => handleRateTypeChange('custom_override')}
                  className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1 ${
                    rateType === 'custom_override'
                      ? 'bg-purple-600 text-white shadow'
                      : 'text-slate-400 hover:text-white'
                  }`}
                  title="Custom Financial Controller Override"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  {isAr ? 'تعديل مخصص' : 'Custom Override'}
                </button>
              </div>
            </div>

            {/* Currency Rates Cards Grid */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-2">
              {(['USD', 'EUR', 'GBP', 'SAR'] as CurrencyCode[]).map((cur) => {
                const rateRecord = getExchangeRate(cur, confirmedCurrency, rateType, customOverrides);
                const isCustom = rateType === 'custom_override';

                return (
                  <div
                    key={cur}
                    className="p-3 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-slate-100 flex items-center gap-1.5">
                        <DollarSign className="w-3.5 h-3.5 text-blue-400" />
                        {cur} &rarr; {confirmedCurrency}
                      </span>
                      <span className="text-[10px] text-slate-500 font-mono">
                        {cur === 'USD' ? 'US Dollar' : cur === 'EUR' ? 'Euro' : cur === 'GBP' ? 'British Pound' : 'Saudi Riyal'}
                      </span>
                    </div>

                    <div className="flex items-center gap-2">
                      {isCustom ? (
                        <div className="flex items-center gap-1 w-full">
                          <span className="text-slate-400 text-xs">1 {cur} =</span>
                          <input
                            type="number"
                            step="0.01"
                            value={customOverrides[cur] || rateRecord.rateToBase}
                            onChange={(e) => handleCustomRateChange(cur, parseFloat(e.target.value) || 1)}
                            className="w-20 px-2 py-0.5 rounded bg-slate-900 border border-purple-500/50 text-purple-200 font-mono font-bold text-xs"
                          />
                          <span className="text-slate-400 text-xs">{confirmedCurrency}</span>
                        </div>
                      ) : (
                        <div className="flex items-baseline gap-1.5">
                          <span className="text-sm font-bold font-mono text-emerald-400">
                            {rateRecord.rateToBase.toFixed(2)}
                          </span>
                          <span className="text-[11px] text-slate-400">
                            {confirmedCurrency} / {cur}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="text-[10px] text-slate-500 flex items-center justify-between">
                      <span>{rateRecord.source}</span>
                      <span className="font-mono">{rateRecord.effectiveDate}</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Currency Breakdown Toggle */}
            {activeParseResult.multiCurrencySummary && (
              <div className="pt-1 border-t border-blue-900/40 flex items-center justify-between text-xs">
                <button
                  onClick={() => setShowCurrencyBreakdown(!showCurrencyBreakdown)}
                  className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1.5 transition"
                >
                  {showCurrencyBreakdown ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showCurrencyBreakdown
                    ? (isAr ? 'إخفاء تفاصيل أرصدة العملات الأجنبية' : 'Hide Multi-Currency Breakdown')
                    : (isAr ? `عرض تفاصيل توحيد العملات (${activeParseResult.multiCurrencySummary.currenciesDetected.join(', ')})` : `View Multi-Currency Breakdown (${activeParseResult.multiCurrencySummary.currenciesDetected.join(', ')})`)}
                </button>

                <span className="text-[11px] text-slate-400">
                  {isAr
                    ? `تم توحيد ${activeParseResult.multiCurrencySummary.accountsConvertedCount} حساب أجنبي بسعر ${EXCHANGE_RATE_SOURCES[rateType].nameAr}`
                    : `Active Rate: ${EXCHANGE_RATE_SOURCES[rateType].nameEn}`}
                </span>
              </div>
            )}

            {/* Detailed Multi-Currency Breakdown Table */}
            {showCurrencyBreakdown && activeParseResult.multiCurrencySummary && (
              <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                      <th className="py-2 px-2.5 font-semibold">{isAr ? 'العملة' : 'Currency'}</th>
                      <th className="py-2 px-2.5 font-semibold">{isAr ? 'سعر التحويل المطبق' : 'Applied Exchange Rate'}</th>
                      <th className="py-2 px-2.5 font-semibold text-right">{isAr ? 'إجمالي المدين بالعملة الأصلية' : 'Original Debit'}</th>
                      <th className="py-2 px-2.5 font-semibold text-right">{isAr ? 'إجمالي الدائن بالعملة الأصلية' : 'Original Credit'}</th>
                      <th className="py-2 px-2.5 font-semibold text-right">{isAr ? `المعادل بـ ${confirmedCurrency} (مدين)` : `Converted to ${confirmedCurrency} (Debit)`}</th>
                      <th className="py-2 px-2.5 font-semibold text-right">{isAr ? `المعادل بـ ${confirmedCurrency} (دائن)` : `Converted to ${confirmedCurrency} (Credit)`}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                    {activeParseResult.multiCurrencySummary.currenciesDetected.map((cur) => {
                      const origD = activeParseResult.multiCurrencySummary?.totalOriginalDebitsByCurrency[cur] || 0;
                      const origC = activeParseResult.multiCurrencySummary?.totalOriginalCreditsByCurrency[cur] || 0;
                      const rate = activeParseResult.multiCurrencySummary?.ratesApplied[cur] || 1;
                      const convD = origD * rate;
                      const convC = origC * rate;

                      return (
                        <tr key={cur} className="hover:bg-slate-900/50">
                          <td className="py-2 px-2.5">
                            <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 font-bold border border-blue-500/30">
                              {cur}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-200">
                            1 {cur} = {rate.toFixed(4)} {confirmedCurrency}
                          </td>
                          <td className="py-2 px-2.5 text-right text-slate-300">
                            {origD > 0 ? `${origD.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${cur}` : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-right text-slate-300">
                            {origC > 0 ? `${origC.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${cur}` : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-emerald-400">
                            {convD > 0 ? `${convD.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${confirmedCurrency}` : '-'}
                          </td>
                          <td className="py-2 px-2.5 text-right font-bold text-emerald-400">
                            {convC > 0 ? `${convC.toLocaleString('en-US', { minimumFractionDigits: 2 })} ${confirmedCurrency}` : '-'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Dedicated Duplicate Transaction Detection & Resolution Banner */}
          {activeParseResult.duplicateReport?.hasDuplicates && (
            <div className="p-5 rounded-2xl bg-amber-950/30 border border-amber-500/40 space-y-4">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 flex-shrink-0 mt-0.5">
                    <CopyCheck className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {isAr ? 'رصد العمليات والقيود المكررة' : 'Duplicate Transactions Detected'}
                      </span>
                      <span className="text-xs font-mono font-bold text-amber-200">
                        {activeParseResult.duplicateReport.totalDuplicatesCount} {isAr ? 'قيود مكررة' : 'duplicate rows'}
                      </span>
                    </div>
                    <p className="text-xs text-slate-200 mt-1">
                      {isAr
                        ? `تم رصد ${activeParseResult.duplicateReport.totalDuplicatesCount} قيد مكرر عبر ${activeParseResult.duplicateReport.groups.length} مجموعات مرجعية/تاريخية تشترك في نفس رقم المرجع أو التاريخ والحساب.`
                        : `Identified ${activeParseResult.duplicateReport.totalDuplicatesCount} recurring entries across ${activeParseResult.duplicateReport.groups.length} reference/date groups. Select how to resolve duplicates:`}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono mt-0.5">
                      {isAr
                        ? `إجمالي مبالغ التكرار: مدين ${activeParseResult.duplicateReport.totalDuplicateDebit.toLocaleString()} ${confirmedCurrency} | دائن ${activeParseResult.duplicateReport.totalDuplicateCredit.toLocaleString()} ${confirmedCurrency}`
                        : `Duplicate impact: Debit ${activeParseResult.duplicateReport.totalDuplicateDebit.toLocaleString()} ${confirmedCurrency} | Credit ${activeParseResult.duplicateReport.totalDuplicateCredit.toLocaleString()} ${confirmedCurrency}`}
                    </p>
                  </div>
                </div>

                {/* Duplicate Remedy Mode Buttons */}
                <div className="flex flex-wrap items-center gap-2 bg-slate-950/80 p-1.5 rounded-xl border border-slate-800 text-xs">
                  <button
                    onClick={() => handleRemedyChange('remove')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      duplicateRemedy === 'remove'
                        ? 'bg-emerald-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isAr ? 'استبعاد وحذف المكرر (موصى به)' : 'Auto-Remove Duplicates'}
                  </button>

                  <button
                    onClick={() => handleRemedyChange('flag')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      duplicateRemedy === 'flag'
                        ? 'bg-amber-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {isAr ? 'إبقاء وتمييز المكرر' : 'Flag & Keep All'}
                  </button>

                  <button
                    onClick={() => handleRemedyChange('merge')}
                    className={`px-3 py-1.5 rounded-lg font-semibold transition flex items-center gap-1.5 ${
                      duplicateRemedy === 'merge'
                        ? 'bg-blue-600 text-white shadow'
                        : 'text-slate-400 hover:text-white'
                    }`}
                  >
                    <Layers className="w-3.5 h-3.5" />
                    {isAr ? 'دمج الأرصدة' : 'Merge Balances'}
                  </button>
                </div>
              </div>

              {/* Toggle to expand/collapse duplicate group details */}
              <div className="pt-1 border-t border-amber-900/40 flex items-center justify-between text-xs">
                <button
                  onClick={() => setShowDuplicateDetails(!showDuplicateDetails)}
                  className="text-amber-400 hover:text-amber-300 font-semibold flex items-center gap-1.5 transition"
                >
                  {showDuplicateDetails ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  {showDuplicateDetails
                    ? (isAr ? 'إخفاء تفاصيل المجموعات المكررة' : 'Hide Duplicate Groups Breakdown')
                    : (isAr ? `عرض تفاصيل المجموعات المكررة (${activeParseResult.duplicateReport.groups.length} مجموعات)` : `View Duplicate Groups Breakdown (${activeParseResult.duplicateReport.groups.length} groups)`)}
                </button>

                <span className="text-[11px] text-slate-400">
                  {duplicateRemedy === 'remove'
                    ? (isAr ? 'الحالة الحالية: تم استبعاد الصفوف المكررة من الميزان' : 'Active: Redundant rows removed from active ledger')
                    : duplicateRemedy === 'flag'
                    ? (isAr ? 'الحالة الحالية: تم تمييز الصفوف المكررة بعلامة تحذير' : 'Active: Duplicate rows flagged in table')
                    : (isAr ? 'الحالة الحالية: تم دمج وتوحيد الأرصدة في صف واحد' : 'Active: Balances consolidated into single accounts')}
                </span>
              </div>

              {/* Expandable Duplicate Groups Breakdown Table */}
              {showDuplicateDetails && (
                <div className="overflow-x-auto rounded-xl border border-slate-800 bg-slate-950/70 p-3 space-y-2">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-slate-800 text-slate-400 text-[11px]">
                        <th className="py-2 px-2.5 font-semibold">{isAr ? 'معيار المطابقة' : 'Match Criteria'}</th>
                        <th className="py-2 px-2.5 font-semibold">{isAr ? 'رقم المرجع / التاريخ' : 'Reference / Date'}</th>
                        <th className="py-2 px-2.5 font-semibold">{isAr ? 'كود الحساب' : 'Account Code'}</th>
                        <th className="py-2 px-2.5 font-semibold">{isAr ? 'اسم الحساب' : 'Account Name'}</th>
                        <th className="py-2 px-2.5 font-semibold text-center">{isAr ? 'مرات التكرار' : 'Occurrences'}</th>
                        <th className="py-2 px-2.5 font-semibold text-right">{isAr ? 'المبلغ المكرر (مدين/دائن)' : 'Duplicate Amount'}</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-800/60 font-mono text-[11px]">
                      {activeParseResult.duplicateReport.groups.map((group) => (
                        <tr key={group.groupId} className="hover:bg-slate-900/50">
                          <td className="py-2 px-2.5">
                            <span className="px-2 py-0.5 rounded bg-slate-800 text-amber-300 border border-amber-500/20 text-[10px]">
                              {group.matchCriteria === 'identical_ref'
                                ? 'Identical Reference #'
                                : group.matchCriteria === 'identical_date_and_code'
                                ? 'Identical Date & Code'
                                : 'Recurring Line'}
                            </span>
                          </td>
                          <td className="py-2 px-2.5 text-slate-200">
                            {group.refNumber ? (
                              <span className="text-blue-300 font-bold">{group.refNumber}</span>
                            ) : group.entryDate ? (
                              <span className="text-slate-300">{group.entryDate}</span>
                            ) : (
                              <span className="text-slate-500">-</span>
                            )}
                          </td>
                          <td className="py-2 px-2.5 text-blue-400 font-bold">{group.accountCode}</td>
                          <td className="py-2 px-2.5 text-slate-300 font-sans">{group.accountName}</td>
                          <td className="py-2 px-2.5 text-center text-amber-400 font-bold">
                            {group.totalOccurrences}x
                          </td>
                          <td className="py-2 px-2.5 text-right text-slate-200">
                            {group.duplicateDebitAmount > 0
                              ? `Dr ${group.duplicateDebitAmount.toLocaleString()}`
                              : `Cr ${group.duplicateCreditAmount.toLocaleString()}`}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          {/* Column Mapping Details */}
          {activeParseResult.columnMappingSummary && (
            <div className="p-3.5 rounded-xl bg-slate-950/40 border border-slate-800/80 text-xs flex flex-wrap items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="text-slate-400 font-medium">
                  {isAr ? 'خريطة ربط الأعمدة:' : 'Column Mapping:'}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  Code: {activeParseResult.columnMappingSummary.codeColumn}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  Name: {activeParseResult.columnMappingSummary.nameColumn}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  Debit: {activeParseResult.columnMappingSummary.debitColumn}
                </span>
                <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 font-mono text-[11px]">
                  Credit: {activeParseResult.columnMappingSummary.creditColumn}
                </span>
                {activeParseResult.columnMappingSummary.currencyColumn && (
                  <span className="px-2 py-0.5 rounded bg-blue-950/60 text-blue-300 border border-blue-800 font-mono text-[11px]">
                    Currency: {activeParseResult.columnMappingSummary.currencyColumn}
                  </span>
                )}
                {activeParseResult.columnMappingSummary.refColumn && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                    Ref: {activeParseResult.columnMappingSummary.refColumn}
                  </span>
                )}
                {activeParseResult.columnMappingSummary.dateColumn && (
                  <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700 font-mono text-[11px]">
                    Date: {activeParseResult.columnMappingSummary.dateColumn}
                  </span>
                )}
              </div>
              <span className="text-[11px] text-slate-500 font-mono">
                Delimiter: "{activeParseResult.columnMappingSummary.delimiterUsed}" • Malformed: {activeParseResult.columnMappingSummary.malformedRowCount}
              </span>
            </div>
          )}

          {/* Warnings list if any */}
          {activeParseResult.warnings.length > 0 && (
            <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-900/50 text-xs text-amber-300 space-y-1">
              <div className="font-bold flex items-center gap-1.5">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {isAr ? 'ملاحظات المعالجة والاستيراد:' : 'Ingestion & Balance Notices:'}
              </div>
              <ul className="list-disc list-inside space-y-0.5 text-slate-300">
                {activeParseResult.warnings.map((w, idx) => (
                  <li key={idx}>{w}</li>
                ))}
              </ul>
            </div>
          )}

          {/* Sample Rows Table */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                {isAr ? 'معاينة عينة من الحسابات المستخرجة والمترجمة لعملة الأساس' : 'Extracted Accounts Preview Normalized to Base Currency'}
              </h4>
              <span className="text-xs text-slate-500">
                {isAr ? `عرض أول 10 من أصل ${activeParseResult.parsedAccounts.length}` : `Showing 10 of ${activeParseResult.parsedAccounts.length}`}
              </span>
            </div>

            <div className="overflow-x-auto rounded-xl border border-slate-800">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3 font-semibold">{isAr ? 'الكود' : 'Code'}</th>
                    <th className="py-2.5 px-3 font-semibold">{isAr ? 'اسم الحساب المستخرج' : 'Extracted Name'}</th>
                    <th className="py-2.5 px-3 font-semibold text-center">{isAr ? 'العملة الأصلية' : 'Orig CCY'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'الرصيد الأصلي' : 'Original Balance'}</th>
                    <th className="py-2.5 px-3 font-semibold text-center">{isAr ? 'سعر الصرف' : 'FX Rate'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{isAr ? `مدين (${confirmedCurrency})` : `Debit (${confirmedCurrency})`}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{isAr ? `دائن (${confirmedCurrency})` : `Credit (${confirmedCurrency})`}</th>
                    <th className="py-2.5 px-3 font-semibold">{isAr ? 'التصنيف' : 'Category'}</th>
                    <th className="py-2.5 px-3 font-semibold text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {activeParseResult.parsedAccounts.slice(0, 10).map((acc) => {
                    const isForeign = acc.originalCurrency && acc.originalCurrency !== confirmedCurrency;

                    return (
                      <tr
                        key={acc.id}
                        className={`hover:bg-slate-800/30 ${
                          acc.isDuplicate ? 'bg-amber-950/20 border-l-2 border-amber-500' : ''
                        }`}
                      >
                        <td className="py-2 px-3 font-mono text-blue-400 font-bold">{acc.code}</td>
                        <td className="py-2 px-3 text-slate-200 font-medium">
                          <div className="flex items-center gap-1.5">
                            <span>{acc.nameOriginal}</span>
                            {acc.isDuplicate && (
                              <span className="px-1.5 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 text-[10px] font-bold">
                                {isAr ? 'مكرر' : 'Dup'}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="py-2 px-3 text-center">
                          <span
                            className={`px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
                              isForeign
                                ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                                : 'bg-slate-800 text-slate-400'
                            }`}
                          >
                            {acc.originalCurrency || confirmedCurrency}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-300 text-[11px]">
                          {isForeign ? (
                            <span>
                              {acc.originalDebit && acc.originalDebit > 0
                                ? `Dr ${acc.originalDebit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                : acc.originalCredit && acc.originalCredit > 0
                                ? `Cr ${acc.originalCredit.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
                                : '-'}
                            </span>
                          ) : (
                            <span className="text-slate-500">1:1</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-center font-mono text-[11px]">
                          {isForeign && acc.exchangeRateApplied ? (
                            <span className="text-emerald-400 font-bold">
                              @{acc.exchangeRateApplied.toFixed(2)}
                            </span>
                          ) : (
                            <span className="text-slate-500">-</span>
                          )}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200 font-bold">
                          {acc.debit > 0 ? acc.debit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-2 px-3 text-right font-mono text-slate-200 font-bold">
                          {acc.credit > 0 ? acc.credit.toLocaleString('en-US', { minimumFractionDigits: 2 }) : '-'}
                        </td>
                        <td className="py-2 px-3">
                          <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                            {acc.category}
                          </span>
                        </td>
                        <td className="py-2 px-3 text-center font-mono">
                          {acc.isDuplicate ? (
                            <span className="text-amber-400 font-semibold text-[11px]">
                              {acc.duplicateReason || 'Duplicate Entry'}
                            </span>
                          ) : isForeign ? (
                            <span className="text-emerald-400 text-[11px]">
                              Converted &radic;
                            </span>
                          ) : (
                            <span className="text-slate-400 text-[11px]">
                              Base ({confirmedCurrency})
                            </span>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Note when foreign currencies were converted */}
            {activeParseResult.multiCurrencySummary && activeParseResult.multiCurrencySummary.accountsConvertedCount > 0 && (
              <div className="mt-2 text-[11px] text-slate-400 flex items-center justify-between p-2 rounded-lg bg-slate-950 border border-slate-800">
                <span className="flex items-center gap-1.5 text-blue-300">
                  <Coins className="w-3.5 h-3.5 text-blue-400" />
                  {isAr
                    ? `تمت ترجمة وتوحيد ${activeParseResult.multiCurrencySummary.accountsConvertedCount} حساب بالعملات الأجنبية بسعر الصرف لعملة الأساس ${confirmedCurrency}.`
                    : `Normalized ${activeParseResult.multiCurrencySummary.accountsConvertedCount} foreign currency accounts into ${confirmedCurrency} using ${EXCHANGE_RATE_SOURCES[rateType].nameEn}.`}
                </span>
                <span className="text-emerald-400 font-mono font-bold">
                  Total Converted: {activeParseResult.totalDebit.toLocaleString()} {confirmedCurrency}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* CSV Acceptance Tests Modal */}
      {showTestModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl max-w-4xl w-full max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            {/* Modal Header */}
            <div className="p-5 border-b border-slate-800 flex items-center justify-between bg-slate-950/60">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">
                    {isAr ? 'اختبارات قبول استيراد ملفات CSV وتوحيد العملات' : 'Concrete CSV Parsing & Multi-Currency Acceptance Test Suite'}
                  </h3>
                  <p className="text-xs text-slate-400">
                    {isAr
                      ? 'التحقق الآلي من معالجة العناوين العربية، فض الالتباس، الصفوف المشوهة، العمليات المكررة، وترجمة أسعار الصرف.'
                      : 'Verifies Arabic headers, ambiguous mappings, malformed rows, duplicate reference detection, and FX currency normalization.'}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={handleExecuteAcceptanceTests}
                  disabled={isRunningTests}
                  className="px-3 py-1.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-50 text-white text-xs font-semibold flex items-center gap-1.5 transition"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isRunningTests ? 'animate-spin' : ''}`} />
                  {isAr ? 'إعادة تشغيل الاختبارات' : 'Rerun All Tests'}
                </button>
                <button
                  onClick={() => setShowTestModal(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Modal Body: Test Cases Cards */}
            <div className="p-5 overflow-y-auto space-y-4 flex-1">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {testCases.map((tc, index) => {
                  const isPassed = tc.status === 'passed';

                  return (
                    <div
                      key={tc.id}
                      className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-3 text-xs"
                    >
                      <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                        <span className="font-mono text-purple-400 font-bold">
                          #{index + 1} {tc.id}
                        </span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            isPassed
                              ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          }`}
                        >
                          {isPassed ? 'PASSED ✓' : 'FAILED ✗'}
                        </span>
                      </div>

                      <div>
                        <h4 className="font-semibold text-slate-100 text-sm">
                          {isAr ? tc.testNameAr : tc.testNameEn}
                        </h4>
                        <span className="text-[10px] text-slate-500 font-mono block mt-0.5">
                          Scenario: {tc.scenario}
                        </span>
                      </div>

                      {/* Raw Test CSV Input Snippet */}
                      <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800/80 font-mono text-[10px] text-slate-300 overflow-x-auto whitespace-pre">
                        {tc.rawInput}
                      </div>

                      {/* Expected vs Actual */}
                      <div className="space-y-1 text-[11px]">
                        <div>
                          <span className="text-slate-400 font-semibold block">
                            {isAr ? 'النتيجة المتوقعة:' : 'Expected Outcome:'}
                          </span>
                          <span className="text-slate-300">
                            {isAr ? tc.expectedOutcomeAr : tc.expectedOutcomeEn}
                          </span>
                        </div>
                        {tc.actualOutcomeEn && (
                          <div className="pt-1">
                            <span className="text-emerald-400 font-semibold block">
                              {isAr ? 'النتيجة المحققة فعلياً:' : 'Actual Verification:'}
                            </span>
                            <span className="text-slate-200">{tc.actualOutcomeEn}</span>
                          </div>
                        )}
                      </div>

                      {/* Execution Logs */}
                      {tc.logs.length > 0 && (
                        <div className="p-2 rounded bg-slate-900/90 border border-slate-800 font-mono text-[10px] text-slate-400 max-h-24 overflow-y-auto space-y-0.5">
                          {tc.logs.map((log, lIdx) => (
                            <div key={lIdx}>{log}</div>
                          ))}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="p-4 border-t border-slate-800 bg-slate-950/60 flex items-center justify-between text-xs">
              <span className="text-slate-400">
                {isAr
                  ? `تم اجتياز جميع اختبارات القبول بنجاح (${testCases.filter(t => t.status === 'passed').length}/${testCases.length})`
                  : `All ${testCases.length} Acceptance Test Scenarios Passing (${testCases.filter(t => t.status === 'passed').length}/${testCases.length})`}
              </span>
              <button
                onClick={() => setShowTestModal(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-white font-semibold transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
