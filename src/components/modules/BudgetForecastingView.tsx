import React, { useState } from 'react';
import {
  BudgetVarianceRow,
  OutputLanguage,
  AccountingFramework,
  CompanyEntity
} from '../../types/accounting';
import {
  CalculatedIncomeStatement,
  CalculatedCashFlow,
  CalculatedBalanceSheet
} from '../../utils/financialCalculations';
import { useEvidence } from '../../context/EvidenceContext';
import { CashFlowStressTestModule } from './CashFlowStressTestModule';
import {
  CalendarRange,
  TrendingUp,
  TrendingDown,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Download,
  Filter,
  DollarSign,
  Sliders,
  Activity,
  Layers
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  variances: BudgetVarianceRow[];
  language: OutputLanguage;
  framework: AccountingFramework;
  company?: CompanyEntity;
  is?: CalculatedIncomeStatement;
  cf?: CalculatedCashFlow;
  bs?: CalculatedBalanceSheet;
}

export const BudgetForecastingView: React.FC<Props> = ({
  variances,
  language,
  framework,
  company,
  is,
  cf,
  bs
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'variance' | 'stresstest'>('variance');
  const [filterCat, setFilterCat] = useState<string>('all');

  const totalBudget = variances.reduce((sum, v) => sum + v.budgetAmount, 0);
  const totalActual = variances.reduce((sum, v) => sum + v.actualAmount, 0);
  const netVariance = totalActual - totalBudget;

  const filtered = variances.filter(
    (v) => filterCat === 'all' || v.category === filterCat
  );

  const exportBudgetExcel = () => {
    const data = variances.map((v) => ({
      Code: v.accountCode,
      'Name (English)': v.accountNameEn,
      'Name (Arabic)': v.accountNameAr,
      Category: v.category,
      Budget: v.budgetAmount,
      Actual: v.actualAmount,
      'Variance ($)': v.varianceAbs,
      'Variance (%)': `${v.variancePct.toFixed(2)}%`,
      Classification: v.isFavorable ? 'Favorable' : 'Unfavorable',
      Explanation: isAr ? v.explanationAr : v.explanationEn,
      Action: isAr ? v.actionAr : v.actionEn
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Budget_Variances');
    XLSX.writeFile(wb, 'Ledger_IQ_Budget_Variance_Report.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Header with Tab Switcher */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'الموازنات والنمذجة التقديرية' : 'Budgeting, Forecasting & Sensitivity'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {company?.reportingPeriod || 'FY 2025'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-blue-400" />
            {isAr
              ? 'إدارة الموازنات التقديرية واختبارات التحمل النقدي'
              : 'Budgeting, Variance Control & Cash Flow Stress Testing'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'مقارنة بنود الموازنة المعتمدة بالفعلي، مع وحدة محاكاة ديناميكية لاختبارات التحمل (What-If Stress Tests) على التدفقات النقدية وملاءة الخزينة.'
              : 'Audit approved budgets against actuals, and simulate "what-if" cash flow stress tests adjusting revenue growth, inflation, COGS surges, and interest rates.'}
          </p>
        </div>

        {/* View Switcher Tabs */}
        <div className="flex items-center gap-2 self-start md:self-auto">
          <div className="flex items-center p-1 rounded-xl bg-slate-950/80 border border-slate-800 gap-1">
            <button
              onClick={() => setActiveTab('variance')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'variance'
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <CalendarRange className="w-4 h-4" />
              <span>{isAr ? 'الموازنة مقابل الفعلي' : 'Budget vs Actual'}</span>
            </button>
            <button
              onClick={() => setActiveTab('stresstest')}
              className={`flex items-center gap-2 px-3.5 py-2 rounded-lg text-xs font-semibold transition ${
                activeTab === 'stresstest'
                  ? 'bg-amber-500 text-slate-950 font-bold shadow-md'
                  : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Sliders className="w-4 h-4" />
              <span>{isAr ? 'اختبارات التحمل (What-If)' : 'What-If Stress Test'}</span>
            </button>
          </div>

          {activeTab === 'variance' && (
            <button
              onClick={exportBudgetExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Download className="w-4 h-4 text-emerald-400" />
              <span className="hidden sm:inline">{isAr ? 'تصدير' : 'Export'}</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: BUDGET VS ACTUAL VARIANCE ANALYSIS */}
      {activeTab === 'variance' && (
        <div className="space-y-6">
          {/* Variance KPI Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي الموازنة المعتمدة' : 'Total Approved Budget'}</span>
              <span className="text-xl font-bold font-mono text-white mt-1 block">
                {totalBudget.toLocaleString()} <span className="text-xs font-sans text-slate-400">kEGP</span>
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">{isAr ? 'المعتمد من مجلس الإدارة' : 'Board Approved'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{isAr ? 'إجمالي المنفذ الفعلي' : 'Total Actual Execution'}</span>
              <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
                {totalActual.toLocaleString()} <span className="text-xs font-sans text-slate-400">kEGP</span>
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">{isAr ? 'من واقع دفاتر الأستاذ' : 'Audited General Ledger'}</span>
            </div>

            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-xs text-slate-400 block">{isAr ? 'صافي الانحراف الإجمالي' : 'Net Variance'}</span>
              <span className={`text-xl font-bold font-mono mt-1 block ${netVariance >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {netVariance > 0 ? `+${netVariance.toLocaleString()}` : netVariance.toLocaleString()}{' '}
                <span className="text-xs font-sans text-slate-400">kEGP</span>
              </span>
              <span className="text-[11px] text-slate-500 mt-1 block">
                {netVariance >= 0 ? (isAr ? 'أداء إجمالي ملائم' : 'Net Favorable Position') : (isAr ? 'تجاوز إنفاق' : 'Net Overspend')}
              </span>
            </div>
          </div>

          {/* Filter Category */}
          <div className="flex items-center gap-2 text-xs">
            {['all', 'Revenue', 'Cost of Sales', 'Operating Expenses', 'Finance Costs'].map((c) => (
              <button
                key={c}
                onClick={() => setFilterCat(c)}
                className={`px-3 py-1.5 rounded-lg font-semibold transition border ${
                  filterCat === c
                    ? 'bg-blue-600 text-white border-blue-500'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {c === 'all' ? (isAr ? 'كافة البنود' : 'All Lines') : c}
              </button>
            ))}
          </div>

          {/* Variances Detailed Table */}
          <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead>
                  <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                    <th className="py-3 px-3 font-semibold">{isAr ? 'كود الحساب' : 'Code'}</th>
                    <th className="py-3 px-3 font-semibold">{isAr ? 'بند الموازنة' : 'Budget Item'}</th>
                    <th className="py-3 px-3 text-right font-mono">{isAr ? 'الموازنة (Budget)' : 'Budget'}</th>
                    <th className="py-3 px-3 text-right font-mono">{isAr ? 'الفعلي (Actual)' : 'Actual'}</th>
                    <th className="py-3 px-3 text-right font-mono">{isAr ? 'الانحراف ($)' : 'Variance ($)'}</th>
                    <th className="py-3 px-3 text-center font-mono">{isAr ? 'الانحراف (%)' : 'Variance (%)'}</th>
                    <th className="py-3 px-3 text-center">{isAr ? 'التصنيف' : 'Classification'}</th>
                    <th className="py-3 px-3">{isAr ? 'أسباب وتفسير الانحراف' : 'Explanation & Evidence'}</th>
                    <th className="py-3 px-3 text-right">{isAr ? 'الدليل' : 'Trace'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                  {filtered.map((v) => (
                    <tr key={v.accountCode} className="hover:bg-slate-800/40 transition">
                      <td className="py-3 px-3 font-mono font-semibold text-blue-400">{v.accountCode}</td>
                      <td className="py-3 px-3 font-medium text-slate-100">
                        <div>{isAr ? v.accountNameAr : v.accountNameEn}</div>
                        <span className="text-[10px] text-slate-400">{v.category}</span>
                      </td>
                      <td className="py-3 px-3 text-right font-mono text-slate-300">
                        {v.budgetAmount.toLocaleString()} kEGP
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-bold text-white">
                        {v.actualAmount.toLocaleString()} kEGP
                      </td>
                      <td className="py-3 px-3 text-right font-mono font-semibold">
                        <span className={v.isFavorable ? 'text-emerald-400' : 'text-rose-400'}>
                          {v.varianceAbs > 0 ? `+${v.varianceAbs.toLocaleString()}` : v.varianceAbs.toLocaleString()}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            v.isFavorable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {v.variancePct > 0 ? `+${v.variancePct.toFixed(1)}%` : `${v.variancePct.toFixed(1)}%`}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                            v.isFavorable ? 'text-emerald-400 bg-emerald-950/40' : 'text-rose-400 bg-rose-950/40'
                          }`}
                        >
                          {v.isFavorable ? (isAr ? 'ملائم (F)' : 'Favorable') : (isAr ? 'غير ملائم (U)' : 'Unfavorable')}
                        </span>
                      </td>
                      <td className="py-3 px-3 max-w-xs text-slate-300 text-[11px] leading-relaxed">
                        <div className="mb-0.5">{isAr ? v.explanationAr : v.explanationEn}</div>
                        <div className="text-blue-300 font-medium">
                          {isAr ? 'الإجراء: ' : 'Action: '}{isAr ? v.actionAr : v.actionEn}
                        </div>
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => openEvidence('TRC-GROSS-MARGIN')}
                          className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold"
                        >
                          {isAr ? 'فحص' : 'Trace'} &rarr;
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: CASH FLOW 'WHAT-IF' STRESS TESTING MODULE */}
      {activeTab === 'stresstest' && (
        <CashFlowStressTestModule
          language={language}
          framework={framework}
          company={company}
          is={is}
          cf={cf}
          bs={bs}
        />
      )}
    </div>
  );
};
