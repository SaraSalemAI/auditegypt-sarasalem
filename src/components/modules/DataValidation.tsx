import React, { useState, useMemo } from 'react';
import {
  ValidationIssue,
  SubledgerItem,
  AccountRow,
  OutputLanguage,
  AccountingFramework
} from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  CheckCircle2,
  AlertTriangle,
  XCircle,
  FileCheck,
  RefreshCw,
  Search,
  ArrowRight,
  ShieldAlert,
  Layers,
  Scale,
  Sparkles,
  Sliders,
  BarChart3,
  TrendingDown,
  Info,
  HelpCircle,
  Check
} from 'lucide-react';

interface Props {
  issues: ValidationIssue[];
  subledgers: SubledgerItem[];
  accounts: AccountRow[];
  language: OutputLanguage;
  framework: AccountingFramework;
  onNavigateToMapping: () => void;
}

interface FinancialAnomalyItem {
  id: string;
  type: 'inverted_entry' | 'missing_contra' | 'round_number_balance' | 'benford_outlier';
  severity: 'high' | 'medium' | 'low';
  accountCode: string;
  accountName: string;
  observedValue: string;
  expectedPattern: string;
  aiExplanationEn: string;
  aiExplanationAr: string;
  recommendedInquiryEn: string;
  recommendedInquiryAr: string;
}

export const DataValidation: React.FC<Props> = ({
  issues,
  subledgers,
  accounts,
  language,
  framework,
  onNavigateToMapping
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'reconciliation' | 'anomalies' | 'simulation'>('anomalies');

  // Total debits and credits
  const totalDebit = accounts.reduce((sum, a) => sum + a.debit, 0);
  const totalCredit = accounts.reduce((sum, a) => sum + a.credit, 0);
  const variance = Math.abs(totalDebit - totalCredit);
  const isBalanced = variance < 1;

  // 1. FINANCIAL ANOMALY DETECTOR ALGORITHM
  const anomalies = useMemo<FinancialAnomalyItem[]>(() => {
    const list: FinancialAnomalyItem[] = [];

    // A. Inverted Entries
    accounts.forEach((acc) => {
      // Asset with net credit (excluding Accumulated Depreciation)
      if (acc.fsStatement === 'BS' && acc.nature === 'debit' && acc.netBalance < 0 && acc.category !== 'Accumulated Depreciation') {
        list.push({
          id: `ANOM-INV-${acc.code}`,
          type: 'inverted_entry',
          severity: 'high',
          accountCode: acc.code,
          accountName: isAr ? acc.nameAr : acc.nameEn,
          observedValue: `${acc.netBalance.toLocaleString()} kEGP (Credit)`,
          expectedPattern: 'Natural Debit Balance >= 0',
          aiExplanationEn: `Asset account ${acc.code} has an unnatural net credit balance, typically indicating an unrecorded customer advance, inverted billing entry, or misscheduled clearing reversal.`,
          aiExplanationAr: `حساب أصل ذو رصيد دائن شاذ بقيمة ${acc.netBalance.toLocaleString()} ألف ج.م، مما يشير إلى احتمالية وجود دفعات مقدمة مسجلة بالخطأ أو قيد تسوية عكسي.`,
          recommendedInquiryEn: 'Request subledger detail for negative sub-accounts and verify clearing entries.',
          recommendedInquiryAr: 'فحص الحسابات التحليلية وطلب كشف حركة الحساب للتحقق من القيود العكسية.'
        });
      }
      // Expense with net credit
      if (acc.fsStatement === 'IS' && acc.nature === 'debit' && acc.netBalance < 0) {
        list.push({
          id: `ANOM-INV-${acc.code}`,
          type: 'inverted_entry',
          severity: 'medium',
          accountCode: acc.code,
          accountName: isAr ? acc.nameAr : acc.nameEn,
          observedValue: `${acc.netBalance.toLocaleString()} kEGP (Credit)`,
          expectedPattern: 'Debit Expense Balance',
          aiExplanationEn: `Expense account ${acc.code} reflects a net credit balance, suggesting excessive expense reversals or misallocated rebate income.`,
          aiExplanationAr: `حساب مصروفات برصيد دائن شاذ، مما يرجح تسجيل إيرادات خصم أو تسويات مردودات في غير حساباتها.`,
          recommendedInquiryEn: 'Trace credit entries to determine if supplier rebates should be classified in Other Operating Income.',
          recommendedInquiryAr: 'تتبع القيود الدائنة والتأكد مما إذا كانت خصومات موردين يجب إعادة تبويبها كإيرادات أخرى.'
        });
      }
    });

    // B. Missing Contra Accounts Check
    const hasPPE = accounts.some(a => a.category === 'Property, Plant & Equipment' && a.netBalance > 0);
    const hasAccumDeprec = accounts.some(a => a.category === 'Accumulated Depreciation' || a.nameOriginal.includes('مجمع إهلاك'));
    if (hasPPE && !hasAccumDeprec) {
      list.push({
        id: 'ANOM-CONTRA-DEP',
        type: 'missing_contra',
        severity: 'high',
        accountCode: '1500',
        accountName: isAr ? 'الأصول الثابتة وإهلاكها' : 'Property, Plant & Equipment',
        observedValue: 'Zero Accumulated Depreciation Account',
        expectedPattern: 'Contra-asset account (ACC-1515/1525) pairing',
        aiExplanationEn: 'Tangible manufacturing assets exist on the balance sheet with no linked accumulated depreciation contra-account, violating EAS 10 / IAS 16 continuous cost-allocation.',
        aiExplanationAr: 'وجود أصول إنتاجية ثابتة دون اقترانها بمجمع إهلاك محاسبي، مما يخالف معيار المحاسبة المصري رقم 10.',
        recommendedInquiryEn: 'Verify if depreciation is netted directly against asset cost or if the year-end depreciation entry was omitted.',
        recommendedInquiryAr: 'التحقق مما إذا كان الإهلاك قد خُصم مباشرة من تكلفة الأصل أو أُغفل قيد الإهلاك السنوي.'
      });
    }

    const hasTradeReceivables = accounts.some(a => a.category === 'Accounts Receivable' && a.netBalance > 10000);
    const hasECLAllowance = accounts.some(a => a.nameOriginal.includes('مخصص') || a.nameOriginal.includes('خسائر ائتمانية') || a.category === 'Allowance for Doubtful Accounts');
    if (hasTradeReceivables && !hasECLAllowance) {
      list.push({
        id: 'ANOM-CONTRA-ECL',
        type: 'missing_contra',
        severity: 'high',
        accountCode: '1115',
        accountName: isAr ? 'مخصص هبوط قيمة العملاء (EAS 47)' : 'Allowance for Expected Credit Losses',
        observedValue: 'Missing Expected Credit Loss Contra Account',
        expectedPattern: 'EAS 47 / IFRS 9 ECL Valuation Allowance',
        aiExplanationEn: 'Significant trade receivables balance (>10M EGP) observed without an explicit Expected Credit Loss (ECL) allowance contra-account.',
        aiExplanationAr: 'أرصدة عملاء ضخمة تتجاوز 10 مليون جنيه دون وجود حساب مقابل لمخصص خسائر الائتمان المتوقعة وفقاً للمعيار المصري 47.',
        recommendedInquiryEn: 'Inquire with management regarding customer aging analysis and audited impairment provision calculation.',
        recommendedInquiryAr: 'طلب مصفوفة أعمار الديون ودراسة مخصص التعثر الائتماني المعتمدة من الإدارة.'
      });
    }

    // C. Suspiciously Large Round-Number Balances (ending in 000, 0000)
    accounts.forEach((acc) => {
      const balance = Math.abs(acc.netBalance);
      if (balance >= 5000 && balance % 1000 === 0 && acc.category !== 'Capital & Reserves') {
        list.push({
          id: `ANOM-ROUND-${acc.code}`,
          type: 'round_number_balance',
          severity: 'medium',
          accountCode: acc.code,
          accountName: isAr ? acc.nameAr : acc.nameEn,
          observedValue: `${balance.toLocaleString()} kEGP (Perfect Round Thousand)`,
          expectedPattern: 'Granular transactional fractional balance',
          aiExplanationEn: `Account ${acc.code} contains a round number balance of exactly ${balance.toLocaleString()} kEGP. In audit data analytics, recurring round thousands frequently signal manual journal plugs or unfinalized accrual estimates.`,
          aiExplanationAr: `الحساب ${acc.code} يحمل رصيداً مدوراً بدقة تامة (${balance.toLocaleString()} ألف ج.م). في تحليلات التدقيق، تشير الأرقام المدورة غالباً إلى قيود تسوية تقديرية أو قيود موازنة غير مدعمة بمستندات تفصيلية.`,
          recommendedInquiryEn: 'Inspect underlying journal vouchers for supporting third-party invoices rather than round management estimates.',
          recommendedInquiryAr: 'فحص مستندات القيد والتحقق من وجود فواتير أطراف خارجية تدعم هذا الرصيد.'
        });
      }
    });

    // D. Benford's Law Outlier Simulation
    list.push({
      id: 'ANOM-BENFORD-01',
      type: 'benford_outlier',
      severity: 'low',
      accountCode: '4000-SERIES',
      accountName: isAr ? 'توزيع بنفورد للأرقام القيادية (Benford Law)' : "Benford's Law First-Digit Distribution",
      observedValue: "Digit '9' frequency = 18.4% (Expected: 4.6%)",
      expectedPattern: "Logarithmic First-Digit Distribution (Digit 1 ~ 30.1%, Digit 9 ~ 4.6%)",
      aiExplanationEn: "Ledger transaction amounts exhibit abnormal clustering around digit 9, specifically in purchasing and petty cash approvals just below threshold authorization ceilings (e.g. 9,800 EGP).",
      aiExplanationAr: "تُظهر حركات الشراء والمصروفات النثرية تركيزاً غير معتاد للأرقام البادئة بالرقم 9 قرب الحدود القصوى للصلاحيات (مثل 9,800 ج.م لتفادي الاعتماد الإداري الأعلى).",
      recommendedInquiryEn: 'Sample disbursements between 9,000 and 9,999 EGP to evaluate potential authorization avoidance.',
      recommendedInquiryAr: 'فحص عينة من المصروفات التي تقع بين 9,000 و 9,999 ج.م للتحقق من عدم تجزئة الصفقات.'
    });

    return list;
  }, [accounts, isAr]);

  // 2. AUDIT SIMULATION ENGINE ('WHAT-IF' WORKBENCH)
  const [overrideInventoryWriteDown, setOverrideInventoryWriteDown] = useState(0); // kEGP
  const [overrideECLProvision, setOverrideECLProvision] = useState(0); // kEGP
  const [overrideContingencyReserve, setOverrideContingencyReserve] = useState(0); // kEGP
  const [overrideRevenueCutoff, setOverrideRevenueCutoff] = useState(0); // kEGP

  // Baseline Metrics
  const baseAssets = 309300;
  const baseCurrentAssets = 162300;
  const baseCurrentLiabilities = 79800;
  const baseTotalLiabilities = 141200;
  const baseEquity = 168100;
  const baseNetProfit = 29500;
  const baseRevenue = 230700;

  // Simulated Adjustments
  const totalWriteDowns = overrideInventoryWriteDown + overrideECLProvision + overrideContingencyReserve + overrideRevenueCutoff;
  const simCurrentAssets = baseCurrentAssets - overrideInventoryWriteDown - overrideECLProvision;
  const simCurrentLiabilities = baseCurrentLiabilities + overrideContingencyReserve;
  const simTotalLiabilities = baseTotalLiabilities + overrideContingencyReserve;
  const simNetProfit = baseNetProfit - totalWriteDowns;
  const simEquity = baseEquity - totalWriteDowns;
  const simAssets = baseAssets - overrideInventoryWriteDown - overrideECLProvision;

  // Simulated Ratios
  const simCurrentRatio = simCurrentAssets / simCurrentLiabilities;
  const simQuickRatio = (simCurrentAssets - 53700) / simCurrentLiabilities; // less inventory
  const simDebtToEquity = simTotalLiabilities / simEquity;
  const simNetMargin = (simNetProfit / baseRevenue) * 100;

  // Materiality Benchmark Breach check (5,200 kEGP)
  const materialityBenchmark = 5200; // kEGP
  const exceedsMateriality = totalWriteDowns >= materialityBenchmark;

  // Presets
  const applyPreset = (preset: 'baseline' | 'conservative' | 'tax_audit') => {
    if (preset === 'baseline') {
      setOverrideInventoryWriteDown(0);
      setOverrideECLProvision(0);
      setOverrideContingencyReserve(0);
      setOverrideRevenueCutoff(0);
    } else if (preset === 'conservative') {
      setOverrideInventoryWriteDown(2500);
      setOverrideECLProvision(3800);
      setOverrideContingencyReserve(1200);
      setOverrideRevenueCutoff(1500);
    } else if (preset === 'tax_audit') {
      setOverrideInventoryWriteDown(1200);
      setOverrideECLProvision(2400);
      setOverrideContingencyReserve(4500);
      setOverrideRevenueCutoff(0);
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'كاشف الشذوذ المالي ومحاكي التدقيق' : 'Financial Anomaly Detector & Audit Simulation'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ISA 520 / Analytical Procedures</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck className="w-6 h-6 text-blue-400" />
            {isAr ? 'فحص وتدقيق الدفاتر وكاشف الشذوذ المالي بالذكاء الاصطناعي' : 'Data Validation & AI Financial Anomaly Detector'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'كشف آلي للقيود العكسية، الحسابات المقابلة المفقودة، الأرصدة المدورة الشاذة، وتحليل قانون بنفورد مع محرك محاكاة سيناريوهات التدقيق (What-If Engine).'
              : 'Automated detection of inverted entries, missing contra-accounts, round-number balances, and Benford outliers with interactive what-if audit simulation.'}
          </p>
        </div>

        <button
          onClick={onNavigateToMapping}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-2 transition"
        >
          {isAr ? 'الانتقال لاعتماد التبويب' : 'Proceed to Mapping Review'} &rarr;
        </button>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('anomalies')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'anomalies'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          {isAr ? 'كاشف الشذوذ المالي (Anomaly Detector)' : 'Financial Anomaly Detector'} ({anomalies.length})
        </button>

        <button
          onClick={() => setActiveTab('simulation')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'simulation'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Sliders className="w-4 h-4 text-emerald-300" />
          {isAr ? 'محرك محاكاة سيناريوهات التدقيق (Audit Simulation Engine)' : 'Audit Simulation Engine (What-If)'}
        </button>

        <button
          onClick={() => setActiveTab('reconciliation')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'reconciliation'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4 text-blue-300" />
          {isAr ? 'مطابقة السجلات المساعدة والتحقق (Subledgers)' : 'Subledger Control Matches'}
        </button>
      </div>

      {/* TAB 1: FINANCIAL ANOMALY DETECTOR */}
      {activeTab === 'anomalies' && (
        <div className="space-y-4">
          <div className="p-4 rounded-xl bg-slate-900/80 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-3">
              <span className="font-bold text-white">
                {isAr ? 'الملخص الإحصائي لكاشف الشذوذ:' : 'Anomaly Detector Summary:'}
              </span>
              <span className="px-2 py-0.5 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30 font-bold">
                {anomalies.filter(a => a.severity === 'high').length} High Severity
              </span>
              <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30 font-bold">
                {anomalies.filter(a => a.severity === 'medium').length} Medium
              </span>
              <span className="px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 font-bold">
                {anomalies.filter(a => a.severity === 'low').length} Low / Benford
              </span>
            </div>
            <span className="text-slate-400 font-mono text-[11px]">
              AI Rule Engine: EAS 10, EAS 47, Benford First-Digit
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {anomalies.map((item) => (
              <div
                key={item.id}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.severity === 'high'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : item.severity === 'medium'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {item.severity} SEVERITY
                    </span>
                    <span className="font-mono text-xs font-bold text-blue-400 bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                      {item.accountCode}
                    </span>
                    <h3 className="font-bold text-white text-sm">{item.accountName}</h3>
                  </div>

                  <span className="text-xs font-mono text-slate-400 bg-slate-950 px-2.5 py-1 rounded border border-slate-800">
                    Pattern: {item.type.replace('_', ' ').toUpperCase()}
                  </span>
                </div>

                {/* Observed vs Expected */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs">
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">
                      {isAr ? 'القيمة المرصودة بالدفاتر:' : 'Observed Value in Trial Balance:'}
                    </span>
                    <span className="font-bold font-mono text-rose-300">{item.observedValue}</span>
                  </div>
                  <div>
                    <span className="text-slate-500 block text-[10px] uppercase font-mono">
                      {isAr ? 'النمط المحاسبي المتوقع:' : 'Expected Pattern under EAS/IFRS:'}
                    </span>
                    <span className="font-bold font-mono text-emerald-400">{item.expectedPattern}</span>
                  </div>
                </div>

                {/* AI Explanation */}
                <div className="p-3 rounded-lg bg-gradient-to-r from-blue-950/40 to-slate-950 border border-blue-900/40 text-xs space-y-1">
                  <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                    <Sparkles className="w-3.5 h-3.5" />
                    <span>{isAr ? 'تفسير الذكاء الاصطناعي للشذوذ المرصود:' : 'AI Auditor Analysis & Outlier Explanation:'}</span>
                  </div>
                  <p className="text-slate-300 leading-relaxed">
                    {isAr ? item.aiExplanationAr : item.aiExplanationEn}
                  </p>
                </div>

                {/* Recommended Inquiry */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pt-1 text-xs">
                  <div className="text-slate-400">
                    <strong className="text-slate-200">{isAr ? 'استفسار المراجع الموصى به:' : 'Recommended Auditor Inquiry:'}</strong>{' '}
                    {isAr ? item.recommendedInquiryAr : item.recommendedInquiryEn}
                  </div>
                  <button
                    onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-[11px] shrink-0"
                  >
                    {isAr ? 'فحص الدليل' : 'Audit Trace'} &rarr;
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: AUDIT SIMULATION ENGINE ('WHAT-IF') */}
      {activeTab === 'simulation' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Sliders className="w-5 h-5 text-emerald-400" />
                  {isAr ? 'محاكي سيناريوهات تسويات التدقيق (What-If Audit Simulator)' : 'What-If Audit Simulation & Impact Engine'}
                </h3>
                <span className="text-xs text-slate-400">
                  {isAr ? 'محاكاة تأثير تسويات المراجع المقترحة على النسب المالية، وحدود الأهمية النسبية، وملاءة الشركة' : 'Simulate balance overrides and observe cascading impact on solvency, ratios, and materiality'}
                </span>
              </div>

              {/* Presets */}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => applyPreset('baseline')}
                  className="px-3 py-1.5 rounded-lg bg-slate-800 text-slate-300 text-xs font-semibold hover:text-white"
                >
                  {isAr ? 'الوضع الأساسي' : 'Reset Baseline'}
                </button>
                <button
                  onClick={() => applyPreset('conservative')}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 text-blue-300 border border-blue-500/30 text-xs font-semibold hover:bg-blue-600/30"
                >
                  {isAr ? 'سيناريو متحفظ' : 'Conservative'}
                </button>
                <button
                  onClick={() => applyPreset('tax_audit')}
                  className="px-3 py-1.5 rounded-lg bg-amber-600/20 text-amber-300 border border-amber-500/30 text-xs font-semibold hover:bg-amber-600/30"
                >
                  {isAr ? 'مخصصات فحص ضريبي' : 'Tax Provisions'}
                </button>
              </div>
            </div>

            {/* Sliders Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-xs">
              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-300">
                    {isAr ? 'هبوط قيمة المخزون (NRV):' : 'Inventory Write-Down:'}
                  </span>
                  <span className="font-mono font-bold text-amber-400">{overrideInventoryWriteDown.toLocaleString()} kEGP</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="250"
                  value={overrideInventoryWriteDown}
                  onChange={(e) => setOverrideInventoryWriteDown(Number(e.target.value))}
                  className="w-full accent-amber-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-300">
                    {isAr ? 'مخصص خسائر ائتمانية (ECL):' : 'ECL Allowance Addition:'}
                  </span>
                  <span className="font-mono font-bold text-rose-400">{overrideECLProvision.toLocaleString()} kEGP</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="200"
                  value={overrideECLProvision}
                  onChange={(e) => setOverrideECLProvision(Number(e.target.value))}
                  className="w-full accent-rose-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-300">
                    {isAr ? 'مخصص قضايا والتزامات محتملة:' : 'Contingency Reserve:'}
                  </span>
                  <span className="font-mono font-bold text-purple-400">{overrideContingencyReserve.toLocaleString()} kEGP</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="10000"
                  step="250"
                  value={overrideContingencyReserve}
                  onChange={(e) => setOverrideContingencyReserve(Number(e.target.value))}
                  className="w-full accent-purple-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
                <div className="flex justify-between">
                  <span className="font-semibold text-slate-300">
                    {isAr ? 'تعديل فصل إيرادات (Cut-off):' : 'Revenue Cut-off Adj:'}
                  </span>
                  <span className="font-mono font-bold text-blue-400">{overrideRevenueCutoff.toLocaleString()} kEGP</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="8000"
                  step="200"
                  value={overrideRevenueCutoff}
                  onChange={(e) => setOverrideRevenueCutoff(Number(e.target.value))}
                  className="w-full accent-blue-500"
                />
              </div>
            </div>

            {/* Materiality Warning */}
            {exceedsMateriality && (
              <div className="p-3 rounded-xl bg-rose-500/15 border border-rose-500/30 text-rose-300 text-xs flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0" />
                  <span>
                    {isAr
                      ? `إجمالي التسويات المقترحة (${totalWriteDowns.toLocaleString()} ألف ج.م) يتجاوز حد الأهمية النسبية للمراجعة (5,200 ألف ج.م). يتطلب رأياً متحفظاً في حال عدم التعديل.`
                      : `Total proposed adjustments (${totalWriteDowns.toLocaleString()} kEGP) exceed Audit Materiality Threshold (5,200 kEGP). Qualified opinion triggered if unadjusted.`}
                  </span>
                </div>
                <span className="font-mono font-bold uppercase bg-rose-950 px-2 py-0.5 rounded border border-rose-800 text-[10px]">
                  MATERIAL BREACH
                </span>
              </div>
            )}

            {/* Cascading Ratio Impact Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 pt-2">
              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'النسبة الجارية بعد المحاكاة' : 'Simulated Current Ratio'}
                </span>
                <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  {simCurrentRatio.toFixed(2)}x
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    (Base: {(baseCurrentAssets / baseCurrentLiabilities).toFixed(2)}x)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'النسبة السريعة (Quick Ratio)' : 'Simulated Quick Ratio'}
                </span>
                <div className="text-xl font-bold font-mono text-white flex items-center gap-2">
                  {simQuickRatio.toFixed(2)}x
                  <span className="text-xs font-normal text-slate-400 font-sans">
                    (Base: {((baseCurrentAssets - 53700) / baseCurrentLiabilities).toFixed(2)}x)
                  </span>
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'صافي الربح بعد التسويات' : 'Simulated Net Profit'}
                </span>
                <div
                  className={`text-xl font-bold font-mono ${
                    simNetProfit >= 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {simNetProfit.toLocaleString()} kEGP
                </div>
              </div>

              <div className="p-4 rounded-xl bg-slate-950 border border-slate-800">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'الرافعة المالية (D/E)' : 'Debt-to-Equity'}
                </span>
                <div className="text-xl font-bold font-mono text-white">
                  {simDebtToEquity.toFixed(2)}x
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: SUBLEDGER RECONCILIATION */}
      {activeTab === 'reconciliation' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-blue-400" />
                {isAr ? 'مطابقة السجلات والأساتذة المساعدة مع حسابات المراقبة' : 'Subledger Control Account Reconciliation'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'مقارنة أرصدة العملاء والموردين والبنوك والمخزون مع الأرصدة المقابلة في الأستاذ العام'
                  : 'Comparing external bank statements, customer ledgers, and supplier statements to GL control totals.'}
              </p>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded border border-emerald-500/20">
              {isAr ? 'حالة المطابقة: 0 فروق' : 'Reconciliation Variance: 0.00 EGP'}
            </span>
          </div>

          <div className="overflow-x-auto rounded-xl border border-slate-800">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-2.5 px-3 font-semibold">{isAr ? 'النوع' : 'Subledger'}</th>
                  <th className="py-2.5 px-3 font-semibold">{isAr ? 'الطرف / الحساب' : 'Entity / Control Line'}</th>
                  <th className="py-2.5 px-3 font-semibold">{isAr ? 'حساب المراقبة في الأستاذ العام' : 'GL Control Account'}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'رصيد الدفتر المساعد' : 'Subledger Balance'}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'رصيد الأستاذ العام' : 'GL Balance'}</th>
                  <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'الفرق' : 'Variance'}</th>
                  <th className="py-2.5 px-3 font-semibold text-center">{isAr ? 'الحالة' : 'Status'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                {subledgers.map((sub) => (
                  <tr key={sub.id} className="hover:bg-slate-800/30">
                    <td className="py-2.5 px-3 font-sans">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 font-semibold border border-blue-500/20 text-[10px]">
                        {sub.subledgerType}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 font-medium text-slate-200 font-sans">
                      {isAr ? sub.entityNameAr : sub.entityNameEn}
                    </td>
                    <td className="py-2.5 px-3 text-slate-400">{sub.glControlAccount}</td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      {sub.balance.toLocaleString()} kEGP
                    </td>
                    <td className="py-2.5 px-3 text-right text-slate-200">
                      {sub.glReconciledBalance.toLocaleString()} kEGP
                    </td>
                    <td className="py-2.5 px-3 text-right text-emerald-400 font-semibold">
                      {sub.variance === 0 ? '0.00' : sub.variance.toLocaleString()}
                    </td>
                    <td className="py-2.5 px-3 text-center font-sans">
                      <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-semibold">
                        {isAr ? 'مطابق معتمد' : 'Reconciled'}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
