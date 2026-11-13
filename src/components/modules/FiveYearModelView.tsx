import React, { useState } from 'react';
import {
  CalculatedBalanceSheet,
  CalculatedIncomeStatement,
  projectFiveYearModel
} from '../../utils/financialCalculations';
import {
  FiveYearAssumption,
  OutputLanguage,
  AccountingFramework,
  CompanyEntity
} from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  LineChart,
  Sliders,
  TrendingUp,
  Download,
  RotateCcw,
  CheckCircle2,
  DollarSign,
  ShieldAlert,
  ArrowRight
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  baseIS: CalculatedIncomeStatement;
  baseBS: CalculatedBalanceSheet;
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const FiveYearModelView: React.FC<Props> = ({
  baseIS,
  baseBS,
  company,
  language
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [activeScenario, setActiveScenario] = useState<'base' | 'optimistic' | 'pessimistic'>('base');

  const defaultAssumptions: Record<'base' | 'optimistic' | 'pessimistic', FiveYearAssumption> = {
    base: {
      scenario: 'base',
      revenueGrowthPct: [12.0, 10.0, 8.5, 7.5, 7.0],
      grossMarginPct: 36.5,
      opexRatioPct: 15.0,
      taxRatePct: 22.5,
      interestRatePct: 18.0,
      dsoDays: 110,
      dpoDays: 75,
      dioDays: 95,
      capexPctRevenue: 5.5,
      dividendPayoutPct: 30.0
    },
    optimistic: {
      scenario: 'optimistic',
      revenueGrowthPct: [18.0, 16.0, 14.0, 12.0, 10.0],
      grossMarginPct: 38.5,
      opexRatioPct: 13.5,
      taxRatePct: 22.5,
      interestRatePct: 16.0,
      dsoDays: 90,
      dpoDays: 80,
      dioDays: 85,
      capexPctRevenue: 6.5,
      dividendPayoutPct: 35.0
    },
    pessimistic: {
      scenario: 'pessimistic',
      revenueGrowthPct: [5.0, 4.0, 3.5, 3.0, 3.0],
      grossMarginPct: 32.0,
      opexRatioPct: 17.5,
      taxRatePct: 22.5,
      interestRatePct: 21.0,
      dsoDays: 140,
      dpoDays: 65,
      dioDays: 120,
      capexPctRevenue: 3.5,
      dividendPayoutPct: 20.0
    }
  };

  const [assumptions, setAssumptions] = useState<FiveYearAssumption>(defaultAssumptions[activeScenario]);

  const handleScenarioChange = (sc: 'base' | 'optimistic' | 'pessimistic') => {
    setActiveScenario(sc);
    setAssumptions(defaultAssumptions[sc]);
  };

  const modelResult = projectFiveYearModel(baseIS, baseBS, assumptions);

  const exportModelExcel = () => {
    const data = modelResult.projections.map((p) => ({
      Year: p.year,
      'Revenue (kEGP)': p.revenue,
      'Cost of Sales (COGS)': p.cogs,
      'Gross Profit': p.grossProfit,
      OpEx: p.opex,
      EBITDA: p.ebitda,
      'Operating Profit (EBIT)': p.ebit,
      'Interest Expense': p.interest,
      'Profit Before Tax': p.pbt,
      'Tax Expense': p.tax,
      'Net Profit': p.netProfit,
      'Cash & Equivalents': p.cash,
      'Total Assets': p.assets,
      'Total Debt': p.debt,
      'Total Equity': p.equity
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, '5Year_Financial_Model');
    XLSX.writeFile(wb, `5Year_Financial_Model_${activeScenario}.xlsx`);
  };

  const format = (n: number) => n.toLocaleString();

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'النمذجة المالية الاستراتيجية' : '3-Statement Financial Modeler'}
            </span>
            <span className="text-xs text-slate-400 font-mono">2026 – 2030 Projections</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <LineChart className="w-6 h-6 text-blue-400" />
            {isAr ? 'النموذج المالي المتكامل لخمس سنوات (2026 - 2030)' : 'Five-Year Integrated Financial Forecast Model'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'نموذج مالي ديناميكي يربط قائمة الدخل والمركز المالي والتدفقات النقدية. يتيح اختبار 3 سيناريوهات وتعديل معدلات النمو، هوامش الربح، والإنفاق الرأسمالي فورياً.'
              : 'Dynamic 3-statement forecast linking P&L, balance sheet, and cash movements across Base, Optimistic, and Pessimistic management scenarios.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportModelExcel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تصدير النموذج المالي' : 'Export Model'}
          </button>
        </div>
      </div>

      {/* Scenario Switcher Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="flex items-center gap-2 text-xs">
          <span className="font-semibold text-slate-400">{isAr ? 'السيناريو النشط:' : 'Active Scenario:'}</span>
          <button
            onClick={() => handleScenarioChange('base')}
            className={`px-3 py-1.5 rounded-lg font-bold transition border ${
              activeScenario === 'base'
                ? 'bg-blue-600 text-white border-blue-500 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? 'السيناريو الأساسي (Base Case)' : 'Base Case (Plan)'}
          </button>
          <button
            onClick={() => handleScenarioChange('optimistic')}
            className={`px-3 py-1.5 rounded-lg font-bold transition border ${
              activeScenario === 'optimistic'
                ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? 'السيناريو المتفائل (Optimistic)' : 'Optimistic (High Growth)'}
          </button>
          <button
            onClick={() => handleScenarioChange('pessimistic')}
            className={`px-3 py-1.5 rounded-lg font-bold transition border ${
              activeScenario === 'pessimistic'
                ? 'bg-rose-600 text-white border-rose-500 shadow'
                : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
            }`}
          >
            {isAr ? 'السيناريو المتحفظ (Pessimistic)' : 'Pessimistic (Stress Test)'}
          </button>
        </div>

        <button
          onClick={() => handleScenarioChange(activeScenario)}
          className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 transition"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          {isAr ? 'إعادة ضبط الافتراضات' : 'Reset Defaults'}
        </button>
      </div>

      {/* Assumptions Control Panel (Sliders / Inputs) */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
        <h3 className="font-bold text-white flex items-center gap-2 text-sm">
          <Sliders className="w-4 h-4 text-blue-400" />
          {isAr ? 'افتراضات النموذج القابلة للتعديل والمحاكاة' : 'Dynamic Forecast Assumptions & Levers'}
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isAr ? 'معدل نمو الإيرادات (السنة 1-5)' : 'Yr 1 Revenue Growth (%)'}
            </span>
            <input
              type="number"
              value={assumptions.revenueGrowthPct[0]}
              onChange={(e) => {
                const val = Number(e.target.value);
                setAssumptions({
                  ...assumptions,
                  revenueGrowthPct: [val, assumptions.revenueGrowthPct[1], assumptions.revenueGrowthPct[2], assumptions.revenueGrowthPct[3], assumptions.revenueGrowthPct[4]]
                });
              }}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-blue-300 font-bold w-full text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isAr ? 'هامش مجمل الربح المستهدف (%)' : 'Gross Margin Target (%)'}
            </span>
            <input
              type="number"
              value={assumptions.grossMarginPct}
              onChange={(e) => setAssumptions({ ...assumptions, grossMarginPct: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-emerald-300 font-bold w-full text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isAr ? 'نسبة المصروفات التشغيلية (%)' : 'OpEx Ratio to Revenue (%)'}
            </span>
            <input
              type="number"
              value={assumptions.opexRatioPct}
              onChange={(e) => setAssumptions({ ...assumptions, opexRatioPct: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 font-bold w-full text-xs"
            />
          </div>

          <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800">
            <span className="text-slate-400 block mb-1">
              {isAr ? 'نسبة الإنفاق الاستثماري CapEx (%)' : 'CapEx % of Revenue'}
            </span>
            <input
              type="number"
              value={assumptions.capexPctRevenue}
              onChange={(e) => setAssumptions({ ...assumptions, capexPctRevenue: Number(e.target.value) })}
              className="bg-slate-900 border border-slate-700 rounded px-2 py-1 font-mono text-slate-200 font-bold w-full text-xs"
            />
          </div>
        </div>
      </div>

      {/* Model Integrated Output Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <h3 className="font-bold text-white text-base">
          {isAr ? 'مخرجات النموذج المالي المقدر لخمس سنوات (الأرقام بألف جنيه مصري)' : 'Integrated 5-Year Financial Projection Statement (kEGP)'}
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3 font-semibold">{isAr ? 'البند المالي / السنة' : 'Financial Line Item'}</th>
                {modelResult.years.map((y, idx) => (
                  <th
                    key={y}
                    className={`py-3 px-3 text-right font-mono ${
                      idx === 0 ? 'text-slate-300 font-bold bg-slate-900' : 'text-blue-300'
                    }`}
                  >
                    {y}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
              <tr className="bg-slate-950/40 font-bold text-white">
                <td className="py-2.5 px-3 font-sans">{isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2.5 px-3 text-right text-blue-400">{format(p.revenue)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-rose-300">
                <td className="py-2 px-3 font-sans">({isAr ? 'تكلفة المبيعات' : 'Cost of Sales'})</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right">({format(p.cogs)})</td>
                ))}
              </tr>
              <tr className="bg-emerald-950/20 font-bold text-emerald-400">
                <td className="py-2.5 px-3 font-sans">{isAr ? 'مجمل الربح' : 'Gross Profit'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2.5 px-3 text-right">{format(p.grossProfit)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-slate-300">
                <td className="py-2 px-3 font-sans">({isAr ? 'المصروفات التشغيلية' : 'Operating Expenses'})</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right">({format(p.opex)})</td>
                ))}
              </tr>
              <tr className="bg-slate-950/40 font-semibold text-slate-200">
                <td className="py-2 px-3 font-sans">{isAr ? 'الأرباح قبل الفوائد والضرائب والإهلاك (EBITDA)' : 'EBITDA (Analytical)'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right text-blue-300">{format(p.ebitda)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-white font-semibold">
                <td className="py-2 px-3 font-sans">{isAr ? 'الربح التشغيلي (EBIT)' : 'Operating Profit (EBIT)'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right">{format(p.ebit)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-rose-300">
                <td className="py-2 px-3 font-sans">({isAr ? 'فوائد التمويل' : 'Interest Costs'})</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right">({format(p.interest)})</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-slate-300">
                <td className="py-2 px-3 font-sans">{isAr ? 'الأرباح قبل الضرائب' : 'Profit Before Tax'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right">{format(p.pbt)}</td>
                ))}
              </tr>
              <tr className="bg-emerald-950/40 font-bold text-base text-emerald-400 border-y border-emerald-800">
                <td className="py-3 px-3 font-sans">{isAr ? 'صافي الربح المتوقع' : 'NET PROFIT'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-3 px-3 text-right font-bold">{format(p.netProfit)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-slate-300">
                <td className="py-2 px-3 font-sans">{isAr ? 'رصيد النقدية وما في حكمها' : 'Cash & Equivalents'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right text-emerald-300">{format(p.cash)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-slate-300">
                <td className="py-2 px-3 font-sans">{isAr ? 'إجمالي الأصول المقدرة' : 'Total Assets'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right text-slate-200">{format(p.assets)}</td>
                ))}
              </tr>
              <tr className="hover:bg-slate-800/30 text-slate-300">
                <td className="py-2 px-3 font-sans">{isAr ? 'إجمالي الديون البنكية' : 'Total Bank Debt'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2 px-3 text-right text-rose-300">{format(p.debt)}</td>
                ))}
              </tr>
              <tr className="bg-blue-950/30 font-bold text-white border-t border-blue-900">
                <td className="py-2.5 px-3 font-sans">{isAr ? 'إجمالي حقوق الملكية المقدرة' : 'Total Projected Equity'}</td>
                {modelResult.projections.map((p, i) => (
                  <td key={i} className="py-2.5 px-3 text-right text-blue-300 font-bold">{format(p.equity)}</td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
