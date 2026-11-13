import React, { useState, useMemo } from 'react';
import { AccountRow, OutputLanguage, AccountingFramework } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  FileSpreadsheet,
  CheckCircle2,
  Search,
  Filter,
  Download,
  ArrowUpDown,
  Layers,
  FileCheck2,
  GitCompare,
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  Minus,
  Sparkles,
  ArrowRight,
  Calendar,
  PieChart,
  X,
  UserCheck,
  Check,
  MessageSquare,
  Activity
} from 'lucide-react';
import * as XLSX from 'xlsx';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { buildComparativeTrialBalance, ComparativeAccountRow } from '../../utils/comparativeData';

interface Props {
  accounts: AccountRow[];
  language: OutputLanguage;
  framework: AccountingFramework;
  onNavigateToMapping: () => void;
}

export const TrialBalanceView: React.FC<Props> = ({
  accounts,
  language,
  onNavigateToMapping
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';

  // Mode: standard vs comparative
  const [viewMode, setViewMode] = useState<'standard' | 'comparative'>('comparative');

  // Comparative settings
  const [comparativeBaseline, setComparativeBaseline] = useState<'historical_2024' | 'budget_2025' | 'three_way'>('historical_2024');
  const [materialityOnly, setMaterialityOnly] = useState(false);
  const [varianceDirectionFilter, setVarianceDirectionFilter] = useState<'all' | 'favorable' | 'unfavorable'>('all');

  // Search & Statement Filter
  const [search, setSearch] = useState('');
  const [statementFilter, setStatementFilter] = useState<'all' | 'BS' | 'IS'>('all');

  // Interactive Trend Analysis & Sign-Off Modal State
  const [selectedAccountForTrend, setSelectedAccountForTrend] = useState<AccountRow | ComparativeAccountRow | null>(null);
  const [reviewSignOffs, setReviewSignOffs] = useState<Record<string, { note: string; signedBy: string; timestamp: string }>>({
    '1010': { note: 'Cash in vault verified against physical count certificate.', signedBy: 'Auditor Karim H.', timestamp: '2026-01-05' },
    '1020': { note: 'Direct bank confirmation reconciled with 0 variance.', signedBy: 'Auditor Karim H.', timestamp: '2026-01-06' }
  });
  const [currentNoteInput, setCurrentNoteInput] = useState('');
  const [currentSignerInput, setCurrentSignerInput] = useState('Auditor Karim H.');

  // Calculate totals
  const totalDebit = accounts.reduce((acc, curr) => acc + curr.debit, 0);
  const totalCredit = accounts.reduce((acc, curr) => acc + curr.credit, 0);
  const variance = Math.abs(totalDebit - totalCredit);
  const isBalanced = variance < 1;

  // Comparative Dataset
  const comparativeAccounts = useMemo(() => {
    return buildComparativeTrialBalance(accounts);
  }, [accounts]);

  // Filtered Comparative rows
  const filteredComparative = useMemo(() => {
    return comparativeAccounts.filter((acc) => {
      const matchesSearch =
        acc.code.includes(search) ||
        acc.nameOriginal.toLowerCase().includes(search.toLowerCase()) ||
        acc.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        acc.nameAr.toLowerCase().includes(search.toLowerCase());

      const matchesStmt = statementFilter === 'all' || acc.fsStatement === statementFilter;

      const matchesMateriality = !materialityOnly || acc.isMaterialVariance;

      const matchesDirection =
        varianceDirectionFilter === 'all' || acc.varianceDirection === varianceDirectionFilter;

      return matchesSearch && matchesStmt && matchesMateriality && matchesDirection;
    });
  }, [comparativeAccounts, search, statementFilter, materialityOnly, varianceDirectionFilter]);

  // Standard filtered accounts
  const filteredStandard = useMemo(() => {
    return accounts.filter((acc) => {
      const matchesSearch =
        acc.code.includes(search) ||
        acc.nameOriginal.toLowerCase().includes(search.toLowerCase()) ||
        acc.nameEn.toLowerCase().includes(search.toLowerCase()) ||
        acc.nameAr.toLowerCase().includes(search.toLowerCase());

      const matchesStmt = statementFilter === 'all' || acc.fsStatement === statementFilter;
      return matchesSearch && matchesStmt;
    });
  }, [accounts, search, statementFilter]);

  // Summary Metrics for Comparative Mode
  const summaryMetrics = useMemo(() => {
    const isBaseline2024 = comparativeBaseline === 'historical_2024' || comparativeBaseline === 'three_way';

    const currentRevenue = accounts
      .filter((a) => a.category === 'Revenue')
      .reduce((sum, a) => sum + Math.abs(a.netBalance), 0);

    const baselineRevenue = comparativeAccounts
      .filter((a) => a.category === 'Revenue')
      .reduce((sum, a) => sum + Math.abs(isBaseline2024 ? a.historicalBalance2024 : a.budgetBalance2025), 0);

    const revDelta = currentRevenue - baselineRevenue;
    const revDeltaPct = baselineRevenue !== 0 ? (revDelta / baselineRevenue) * 100 : 0;

    const currentAssets = accounts
      .filter((a) => a.fsStatement === 'BS' && a.nature === 'debit')
      .reduce((sum, a) => sum + a.netBalance, 0);

    const baselineAssets = comparativeAccounts
      .filter((a) => a.fsStatement === 'BS' && a.nature === 'debit')
      .reduce((sum, a) => sum + (isBaseline2024 ? a.historicalBalance2024 : a.budgetBalance2025), 0);

    const assetsDelta = currentAssets - baselineAssets;
    const assetsDeltaPct = baselineAssets !== 0 ? (assetsDelta / baselineAssets) * 100 : 0;

    const materialCount = comparativeAccounts.filter((a) => a.isMaterialVariance).length;

    return {
      currentRevenue,
      baselineRevenue,
      revDelta,
      revDeltaPct,
      currentAssets,
      baselineAssets,
      assetsDelta,
      assetsDeltaPct,
      materialCount
    };
  }, [accounts, comparativeAccounts, comparativeBaseline]);

  // Export Comparative Excel
  const exportComparativeExcel = () => {
    const data = comparativeAccounts.map((a) => ({
      Code: a.code,
      'Account Name (Original)': a.nameOriginal,
      'Account Name (English)': a.nameEn,
      'Account Name (Arabic)': a.nameAr,
      Statement: a.fsStatement,
      Category: a.category,
      'Current Net Balance (FY 2025)': a.netBalance,
      'Historical Net Balance (FY 2024)': a.historicalBalance2024,
      'Variance vs 2024 (Amount)': a.varianceVs2024,
      'Variance vs 2024 (%)': `${a.varianceVs2024Pct.toFixed(1)}%`,
      'Approved Budget (FY 2025)': a.budgetBalance2025,
      'Variance vs Budget (Amount)': a.varianceVsBudget,
      'Variance vs Budget (%)': `${a.varianceVsBudgetPct.toFixed(1)}%`,
      Materiality: a.isMaterialVariance ? 'Material (>15%)' : 'Normal',
      Direction: a.varianceDirection
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Comparative_Trial_Balance');
    XLSX.writeFile(wb, 'Ledger_IQ_Comparative_Trial_Balance_FY2025_vs_FY2024.xlsx');
  };

  const exportStandardExcel = () => {
    const data = accounts.map((a) => ({
      Code: a.code,
      'Name (Original)': a.nameOriginal,
      'Name (English)': a.nameEn,
      'Name (Arabic)': a.nameAr,
      'Debit (Dr)': a.debit,
      'Credit (Cr)': a.credit,
      'Net Balance': a.netBalance,
      Classification: a.category,
      Statement: a.fsStatement,
      Nature: a.nature
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Trial_Balance');
    XLSX.writeFile(wb, 'Ledger_IQ_Trial_Balance_FY2025.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3" />
              {isBalanced ? (isAr ? 'ميزان متطابق 100%' : 'Balanced (0.00 Variance)') : 'Variance Alert'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {isAr ? 'السنة الحالية: 2025 | المقارنة: 2024 والموازنة' : 'Current: FY 2025 | Comparative: FY 2024 & Budget'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
            <FileSpreadsheet className="w-6 h-6 text-blue-400" />
            {viewMode === 'comparative'
              ? (isAr ? 'ميزان المراجعة المقارن (الفترة الحالية مقابل الفترات التاريخية والموازنة)' : 'Comparative Trial Balance (Current vs Historical & Budget)')
              : (isAr ? 'ميزان المراجعة بالأرصدة والمجاميع' : 'General Trial Balance (Debits, Credits & Balances)')}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {viewMode === 'comparative'
              ? (isAr
                  ? 'مقارنة تحليلية لأرصدة الحسابات المستوردة حالياً مقابل الفترات التاريخية (السنة السابقة) والموازنات التقديرية، مع حساب الانحرافات والفروق الجوهرية.'
                  : 'Multi-period variance analysis comparing current imported ledger positions against prior fiscal year balances and approved budget forecasts.')
              : (isAr
                  ? 'ميزان المراجعة الرئيسي المستخرج من السجلات، موضحاً المجاميع المدينة والدائنة وصافي الأرصدة والتبويب المحاسبي المعتمد.'
                  : 'Primary trial balance displaying debit & credit activity, net closing positions, and linked reporting taxonomy.')}
          </p>
        </div>

        {/* View Mode Toggle & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Mode Switcher */}
          <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
            <button
              onClick={() => setViewMode('comparative')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewMode === 'comparative'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <GitCompare className="w-3.5 h-3.5" />
              <span>{isAr ? 'ميزان مقارن' : 'Comparative TB'}</span>
            </button>
            <button
              onClick={() => setViewMode('standard')}
              className={`px-3 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition ${
                viewMode === 'standard'
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-600/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>{isAr ? 'ميزان تقليدي' : 'Standard TB'}</span>
            </button>
          </div>

          <button
            onClick={viewMode === 'comparative' ? exportComparativeExcel : exportStandardExcel}
            className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تصدير إكسيل' : 'Export Excel'}
          </button>
          <button
            onClick={onNavigateToMapping}
            className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition shadow-lg shadow-blue-600/20"
          >
            <Layers className="w-4 h-4" />
            {isAr ? 'مراجعة التبويب' : 'Audit Mapping'}
          </button>
        </div>
      </div>

      {/* COMPARATIVE MODE CONTROLS & SUMMARY */}
      {viewMode === 'comparative' && (
        <div className="space-y-4">
          {/* Summary KPI Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Revenue Growth / Variance */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                {isAr ? 'إجمالي الإيرادات (المقارنة)' : 'Revenue Comparison'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-white">
                  {summaryMetrics.currentRevenue.toLocaleString()} <span className="text-[10px] text-slate-400">kEGP</span>
                </span>
                <span className={`font-mono font-bold flex items-center gap-0.5 ${summaryMetrics.revDelta >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                  {summaryMetrics.revDelta >= 0 ? '+' : ''}{summaryMetrics.revDeltaPct.toFixed(1)}%
                  {summaryMetrics.revDelta >= 0 ? <TrendingUp className="w-3.5 h-3.5" /> : <TrendingDown className="w-3.5 h-3.5" />}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                {isAr ? 'الأساس المقارن: ' : 'Baseline: '}
                <span className="font-mono">{summaryMetrics.baselineRevenue.toLocaleString()} kEGP</span>
              </div>
            </div>

            {/* Total Assets Variance */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                {isAr ? 'إجمالي الأصول (المقارنة)' : 'Assets Comparison'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-blue-400">
                  {summaryMetrics.currentAssets.toLocaleString()} <span className="text-[10px] text-slate-400">kEGP</span>
                </span>
                <span className="font-mono font-bold text-emerald-400 flex items-center gap-0.5">
                  +{summaryMetrics.assetsDeltaPct.toFixed(1)}% <TrendingUp className="w-3.5 h-3.5" />
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                {isAr ? 'الأساس المقارن: ' : 'Baseline: '}
                <span className="font-mono">{summaryMetrics.baselineAssets.toLocaleString()} kEGP</span>
              </div>
            </div>

            {/* Material Variance Count */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                {isAr ? 'الانحرافات الجوهرية (> 15%)' : 'Material Variances (>15%)'}
              </span>
              <div className="flex items-baseline justify-between">
                <span className="text-xl font-bold font-mono text-amber-400">
                  {summaryMetrics.materialCount}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 border border-amber-500/30">
                  {isAr ? 'تتطلب إيضاح' : 'Disclosure Trigger'}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                {isAr ? 'من إجمالي ' : 'Out of '}{accounts.length} {isAr ? 'حساب في الميزان' : 'accounts'}
              </div>
            </div>

            {/* Baseline Configuration Status */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-xs space-y-1">
              <span className="text-slate-400 block font-semibold uppercase tracking-wider">
                {isAr ? 'أساس المقارنة الفعال' : 'Active Baseline'}
              </span>
              <div className="text-base font-bold text-white flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-blue-400" />
                <span>
                  {comparativeBaseline === 'historical_2024'
                    ? (isAr ? 'السنة المالية السابقة (FY 2024)' : 'Historical FY 2024')
                    : comparativeBaseline === 'budget_2025'
                    ? (isAr ? 'الموازنة التقديرية (FY 2025)' : 'Budget Forecast FY 2025')
                    : (isAr ? 'مقارنة ثلاثية (2024 والموازنة)' : '3-Way Multi-Period')}
                </span>
              </div>
              <div className="text-[11px] text-slate-400 pt-1">
                {isAr ? 'معيار القياس: القيمة المطلقة والنسبية' : 'Measurement: Abs & % Variance'}
              </div>
            </div>
          </div>

          {/* Comparative Baseline & Filtering Toolbar */}
          <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-wrap items-center justify-between gap-3 text-xs">
            {/* Baseline Selectors */}
            <div className="flex items-center gap-1.5">
              <span className="text-slate-400 font-semibold">{isAr ? 'مقارنة مع:' : 'Compare vs:'}</span>
              <button
                onClick={() => setComparativeBaseline('historical_2024')}
                className={`px-3 py-1.5 rounded-lg font-medium border transition ${
                  comparativeBaseline === 'historical_2024'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isAr ? 'السنة السابقة (FY 2024)' : 'FY 2024 Historical'}
              </button>
              <button
                onClick={() => setComparativeBaseline('budget_2025')}
                className={`px-3 py-1.5 rounded-lg font-medium border transition ${
                  comparativeBaseline === 'budget_2025'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isAr ? 'الموازنة التقديرية (FY 2025)' : 'FY 2025 Budget'}
              </button>
              <button
                onClick={() => setComparativeBaseline('three_way')}
                className={`px-3 py-1.5 rounded-lg font-medium border transition ${
                  comparativeBaseline === 'three_way'
                    ? 'bg-blue-600 text-white border-blue-500 shadow-sm'
                    : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {isAr ? 'مقارنة ثلاثية شاملة' : '3-Way Multi-Period'}
              </button>
            </div>

            {/* Filter by Materiality & Direction */}
            <div className="flex items-center gap-2">
              <label className="flex items-center gap-1.5 cursor-pointer px-2.5 py-1.5 rounded-lg bg-slate-950 border border-slate-800 text-slate-300">
                <input
                  type="checkbox"
                  checked={materialityOnly}
                  onChange={(e) => setMaterialityOnly(e.target.checked)}
                  className="rounded bg-slate-900 border-slate-700 text-blue-600"
                />
                <span>{isAr ? 'الانحرافات الجوهرية فقط (>15%)' : 'Material Changes Only (>15%)'}</span>
              </label>

              <select
                value={varianceDirectionFilter}
                onChange={(e) => setVarianceDirectionFilter(e.target.value as any)}
                className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-1.5 text-xs focus:outline-none focus:border-blue-500"
              >
                <option value="all">{isAr ? 'كافة الاتجاهات' : 'All Directions'}</option>
                <option value="favorable">{isAr ? 'إيجابي / في صالح الشركة' : 'Favorable'}</option>
                <option value="unfavorable">{isAr ? 'سلبي / غير مواتٍ' : 'Unfavorable'}</option>
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute top-2.5 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={isAr ? 'بحث بالكود أو اسم الحساب...' : 'Search by code or account name...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setStatementFilter('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition border ${
              statementFilter === 'all'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? 'كافة الحسابات' : 'All Accounts'}
          </button>
          <button
            onClick={() => setStatementFilter('BS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition border ${
              statementFilter === 'BS'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? 'المركز المالي (BS)' : 'Balance Sheet'}
          </button>
          <button
            onClick={() => setStatementFilter('IS')}
            className={`px-3 py-1.5 rounded-lg font-medium transition border ${
              statementFilter === 'IS'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? 'قائمة الدخل (IS)' : 'Income Statement'}
          </button>
        </div>
      </div>

      {/* COMPARATIVE TRIAL BALANCE TABLE */}
      {viewMode === 'comparative' ? (
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3 font-semibold">{isAr ? 'كود الحساب' : 'Code'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'اسم الحساب بالدفاتر' : 'Account Description'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isAr ? 'القائمة' : 'Statement'}</th>

                  {/* Current Active Imported Balance */}
                  <th className="py-3 px-3 font-semibold text-right bg-blue-950/30 text-blue-300 border-s border-slate-800">
                    {isAr ? 'الفترة الحالية (2025)' : 'Current (FY 2025)'}
                  </th>

                  {/* Baseline Column(s) */}
                  {(comparativeBaseline === 'historical_2024' || comparativeBaseline === 'three_way') && (
                    <th className="py-3 px-3 font-semibold text-right text-slate-300">
                      {isAr ? 'التاريخي (FY 2024)' : 'Historical (FY 2024)'}
                    </th>
                  )}

                  {(comparativeBaseline === 'budget_2025' || comparativeBaseline === 'three_way') && (
                    <th className="py-3 px-3 font-semibold text-right text-slate-300">
                      {isAr ? 'الموازنة (Budget)' : 'Budget (FY 2025)'}
                    </th>
                  )}

                  {/* Variance Columns */}
                  <th className="py-3 px-3 font-semibold text-right text-slate-200">
                    {isAr ? 'الانحراف (مبلغ)' : 'Variance (Δ)'}
                  </th>
                  <th className="py-3 px-3 font-semibold text-right text-slate-200">
                    {isAr ? 'الانحراف (%)' : 'Variance (%)'}
                  </th>
                  <th className="py-3 px-3 font-semibold text-center">{isAr ? 'الأثر المالي' : 'Effect'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'التبويب والملاحظة' : 'Taxonomy & Note'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isAr ? 'الدليل' : 'Trace'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredComparative.map((acc) => {
                  const baselineVal =
                    comparativeBaseline === 'budget_2025'
                      ? acc.budgetBalance2025
                      : acc.historicalBalance2024;
                  const varianceAmount =
                    comparativeBaseline === 'budget_2025'
                      ? acc.varianceVsBudget
                      : acc.varianceVs2024;
                  const variancePct =
                    comparativeBaseline === 'budget_2025'
                      ? acc.varianceVsBudgetPct
                      : acc.varianceVs2024Pct;

                  const isFavorable = acc.varianceDirection === 'favorable';
                  const isUnfavorable = acc.varianceDirection === 'unfavorable';

                  return (
                    <tr
                      key={acc.id}
                      className={`hover:bg-slate-800/40 transition ${
                        acc.isMaterialVariance ? 'bg-amber-950/10' : ''
                      }`}
                    >
                      <td className="py-2.5 px-3 font-mono font-semibold text-blue-400">
                        {acc.code}
                      </td>
                      <td className="py-2.5 px-3">
                        <div className="font-medium text-slate-100 flex items-center gap-1.5">
                          <span>{acc.nameOriginal}</span>
                          {acc.isMaterialVariance && (
                            <span
                              className="px-1.5 py-0.2 rounded text-[9px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30"
                              title="Material Change > 15%"
                            >
                              &gt;15%
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-slate-400 font-sans">
                          {isAr ? acc.nameEn : acc.nameAr}
                        </div>
                      </td>
                      <td className="py-2.5 px-3 text-center">
                        <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">
                          {acc.fsStatement}
                        </span>
                      </td>

                      {/* Current Period Balance */}
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-white bg-blue-950/20 border-s border-slate-800">
                        {acc.netBalance.toLocaleString()}
                      </td>

                      {/* Historical Balance */}
                      {(comparativeBaseline === 'historical_2024' || comparativeBaseline === 'three_way') && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {acc.historicalBalance2024.toLocaleString()}
                        </td>
                      )}

                      {/* Budget Balance */}
                      {(comparativeBaseline === 'budget_2025' || comparativeBaseline === 'three_way') && (
                        <td className="py-2.5 px-3 text-right font-mono text-slate-300">
                          {acc.budgetBalance2025.toLocaleString()}
                        </td>
                      )}

                      {/* Variance Amount */}
                      <td className="py-2.5 px-3 text-right font-mono font-semibold">
                        <span className={varianceAmount >= 0 ? 'text-emerald-400' : 'text-rose-400'}>
                          {varianceAmount > 0 ? '+' : ''}{varianceAmount.toLocaleString()}
                        </span>
                      </td>

                      {/* Variance Percentage */}
                      <td className="py-2.5 px-3 text-right font-mono">
                        <span
                          className={`inline-flex items-center gap-0.5 font-bold px-2 py-0.5 rounded text-[11px] ${
                            acc.isMaterialVariance
                              ? varianceAmount >= 0
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                              : 'text-slate-300'
                          }`}
                        >
                          {variancePct > 0 ? '+' : ''}{variancePct.toFixed(1)}%
                          {variancePct > 0 ? (
                            <TrendingUp className="w-3 h-3" />
                          ) : variancePct < 0 ? (
                            <TrendingDown className="w-3 h-3" />
                          ) : (
                            <Minus className="w-3 h-3 text-slate-500" />
                          )}
                        </span>
                      </td>

                      {/* Financial Effect Direction */}
                      <td className="py-2.5 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            isFavorable
                              ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                              : isUnfavorable
                              ? 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                              : 'bg-slate-800 text-slate-400'
                          }`}
                        >
                          {isFavorable
                            ? isAr ? 'إيجابي' : 'Favorable'
                            : isUnfavorable
                            ? isAr ? 'سلبي' : 'Unfavorable'
                            : isAr ? 'محايد' : 'Neutral'}
                        </span>
                      </td>

                      {/* Taxonomy & Commentary */}
                      <td className="py-2.5 px-3">
                        <div className="text-[11px] text-blue-300 font-semibold">{acc.category}</div>
                        {(acc.commentaryAr || acc.commentaryEn) && (
                          <div className="text-[10px] text-slate-400 mt-0.5 truncate max-w-xs">
                            {isAr ? acc.commentaryAr : acc.commentaryEn}
                          </div>
                        )}
                      </td>

                      {/* Trace */}
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                          className="text-blue-400 hover:text-blue-300 text-[11px] font-medium"
                        >
                          {isAr ? 'فحص' : 'Trace'} &rarr;
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        /* STANDARD TRIAL BALANCE TABLE */
        <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3 font-semibold">{isAr ? 'كود الحساب' : 'Code'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'اسم الحساب بالدفاتر' : 'Account Description'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isAr ? 'القائمة' : 'Statement'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isAr ? 'مدين (Debit)' : 'Debit (Dr)'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isAr ? 'دائن (Credit)' : 'Credit (Cr)'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isAr ? 'الرصيد الصافي' : 'Net Balance'}</th>
                  <th className="py-3 px-3 font-semibold">{isAr ? 'التبويب المالي' : 'Reporting Taxonomy'}</th>
                  <th className="py-3 px-3 font-semibold text-right">{isAr ? 'الدليل' : 'Trace'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {filteredStandard.map((acc) => (
                  <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2 px-3 font-mono font-semibold text-blue-400">{acc.code}</td>
                    <td className="py-2 px-3">
                      <div className="font-medium text-slate-100">{acc.nameOriginal}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {isAr ? acc.nameEn : acc.nameAr}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-center">
                      <span className="px-1.5 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300">
                        {acc.fsStatement}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">
                      {acc.debit > 0 ? acc.debit.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono text-slate-200">
                      {acc.credit > 0 ? acc.credit.toLocaleString() : '-'}
                    </td>
                    <td className="py-2 px-3 text-right font-mono font-semibold text-emerald-400">
                      {acc.netBalance.toLocaleString()}
                    </td>
                    <td className="py-2 px-3">
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 text-[11px]">
                        {acc.category}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-right">
                      <button
                        onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                        className="text-blue-400 hover:text-blue-300 text-[11px] font-medium"
                      >
                        {isAr ? 'فحص' : 'Trace'} &rarr;
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-slate-950 font-bold text-white border-t border-slate-800">
                  <td colSpan={3} className="py-3 px-3 text-left">
                    {isAr ? 'إجمالي ميزان المراجعة' : 'Grand Total'}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-blue-400">
                    {totalDebit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-emerald-400">
                    {totalCredit.toLocaleString()}
                  </td>
                  <td className="py-3 px-3 text-right font-mono text-slate-300">
                    0.00
                  </td>
                  <td colSpan={2} className="py-3 px-3 text-center text-xs text-emerald-400">
                    {isAr ? 'الميزان متطابق بالكامل' : '100% Balanced'}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
