import React, { useState } from 'react';
import {
  CalculatedBalanceSheet,
  CalculatedIncomeStatement
} from '../../utils/financialCalculations';
import { OutputLanguage, AccountingFramework } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  BarChart,
  Percent,
  TrendingUp,
  TrendingDown,
  ArrowRight,
  Download,
  Layers,
  ArrowUpDown
} from 'lucide-react';

interface Props {
  bs: CalculatedBalanceSheet;
  is: CalculatedIncomeStatement;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const FinancialAnalysisView: React.FC<Props> = ({
  bs,
  is,
  language
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [activeMode, setActiveMode] = useState<'vertical' | 'horizontal'>('vertical');
  const [statement, setStatement] = useState<'IS' | 'BS'>('IS');

  // Horizontal Comparative Data (2025 vs 2024)
  const isHorizontalRows = [
    { nameEn: 'Domestic Industrial Revenue', nameAr: 'المبيعات المحلية', val2025: is.domesticRevenue, val2024: 138000 },
    { nameEn: 'Export Contracts Revenue', nameAr: 'عقود التصدير', val2025: is.exportRevenue, val2024: 58000 },
    { nameEn: 'Service & Maintenance Revenue', nameAr: 'خدمات الصيانة', val2025: is.serviceRevenue, val2024: 14600 },
    { nameEn: 'Total Revenue', nameAr: 'إجمالي الإيرادات', val2025: is.totalRevenue, val2024: 210600, isTotal: true },
    { nameEn: 'Cost of Sales (COGS)', nameAr: 'تكلفة المبيعات المباشرة', val2025: is.totalCostOfSales, val2024: 136700, isNegative: true },
    { nameEn: 'Gross Profit', nameAr: 'مجمل الربح', val2025: is.grossProfit, val2024: 73900, isTotal: true },
    { nameEn: 'Selling & Distribution Expenses', nameAr: 'مصروفات البيع والتسويق', val2025: is.sellingExpenses, val2024: 12800, isNegative: true },
    { nameEn: 'General & Admin Expenses', nameAr: 'مصروفات عمومية وإدارية', val2025: is.gaSalaries + is.gaOtherExpenses, val2024: 20100, isNegative: true },
    { nameEn: 'Operating Profit (EBIT)', nameAr: 'الربح التشغيلي (EBIT)', val2025: is.operatingProfit, val2024: 38600, isTotal: true },
    { nameEn: 'Finance Costs', nameAr: 'تكاليف التمويل والفوائد', val2025: is.financeCosts, val2024: 9200, isNegative: true },
    { nameEn: 'Net Profit for the Year', nameAr: 'صافي ربح العام', val2025: is.netProfit, val2024: 29500, isTotal: true, isNet: true }
  ];

  const bsHorizontalRows = [
    { nameEn: 'Cash and Cash Equivalents', nameAr: 'النقدية وما في حكمها', val2025: bs.cashAndEquivalents, val2024: 35100 },
    { nameEn: 'Trade Receivables (Net)', nameAr: 'صافي العملاء وأوراق القبض', val2025: bs.tradeReceivablesNet, val2024: 69400 },
    { nameEn: 'Inventories (Net)', nameAr: 'صافي المخزون السلعي', val2025: bs.inventoryNet, val2024: 53700 },
    { nameEn: 'Total Current Assets', nameAr: 'إجمالي الأصول المتداولة', val2025: bs.totalCurrentAssets, val2024: 162300, isTotal: true },
    { nameEn: 'Property, Plant & Equipment (Net)', nameAr: 'الأصول الثابتة (بالصافي)', val2025: bs.ppeNet, val2024: 128300 },
    { nameEn: 'Total Assets', nameAr: 'إجمالي الأصول', val2025: bs.totalAssets, val2024: 309300, isTotal: true, isNet: true },
    { nameEn: 'Trade & Notes Payable', nameAr: 'الموردون وأوراق الدفع', val2025: bs.tradePayables, val2024: 46600 },
    { nameEn: 'Short-term Borrowings', nameAr: 'تسهيلات ائتمانية قصيرة الأجل', val2025: bs.shortTermBorrowings, val2024: 18000 },
    { nameEn: 'Long-term Bank Loans', nameAr: 'قروض طويلة الأجل', val2025: bs.longTermBorrowings, val2024: 46000 },
    { nameEn: 'Total Liabilities', nameAr: 'إجمالي الالتزامات', val2025: bs.totalLiabilities, val2024: 141200, isTotal: true },
    { nameEn: 'Total Equity', nameAr: 'إجمالي حقوق الملكية', val2025: bs.totalEquity, val2024: 168100, isTotal: true, isNet: true }
  ];

  const format = (num: number) => num.toLocaleString();

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'التحليل المالي الرأسي والأفقي' : 'Vertical & Horizontal Analysis'}
            </span>
            <span className="text-xs text-slate-400 font-mono">YoY Comparative</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-blue-400" />
            {isAr ? 'التحليل الهيكلي الرأسي والتحليل الاتجاهي الأفقي' : 'Structural (Vertical) & Trend (Horizontal) Analysis'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'التحليل الرأسي يوضح الأوزان النسبية لكل بند كنسبة مئوية من إجمالي الأصول أو الإيرادات. التحليل الأفقي يقيس التغير المطلق والنسبي السنوي (YoY).'
              : 'Vertical analysis calculates each line item as a percentage of Total Assets or Revenue. Horizontal analysis tracks year-over-year percentage and absolute variations.'}
          </p>
        </div>

        {/* Mode Selector */}
        <div className="flex items-center gap-2">
          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setActiveMode('vertical')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeMode === 'vertical' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'التحليل الرأسي (%)' : 'Vertical (% of Base)'}
            </button>
            <button
              onClick={() => setActiveMode('horizontal')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                activeMode === 'horizontal' ? 'bg-blue-600 text-white shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'التحليل الأفقي (YoY)' : 'Horizontal (YoY %)'}
            </button>
          </div>

          <div className="bg-slate-950 p-1 rounded-xl border border-slate-800 flex items-center gap-1 text-xs">
            <button
              onClick={() => setStatement('IS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statement === 'IS' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'قائمة الدخل' : 'Income Stmt'}
            </button>
            <button
              onClick={() => setStatement('BS')}
              className={`px-3 py-1.5 rounded-lg font-bold transition ${
                statement === 'BS' ? 'bg-slate-800 text-slate-200' : 'text-slate-400 hover:text-white'
              }`}
            >
              {isAr ? 'المركز المالي' : 'Balance Sheet'}
            </button>
          </div>
        </div>
      </div>

      {/* Main Analysis Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <h3 className="font-bold text-white text-base">
            {activeMode === 'vertical'
              ? (isAr ? `التحليل الرأسي (${statement === 'IS' ? 'كنسبة من الإيرادات' : 'كنسبة من إجمالي الأصول'})` : `Vertical Analysis (${statement === 'IS' ? '% of Total Revenue' : '% of Total Assets'})`)
              : (isAr ? 'التحليل الأفقي المقارن (2025 مقارنة بـ 2024)' : 'Horizontal Trend Analysis (2025 vs 2024 Comparative)')}
          </h3>
          <span className="font-mono text-slate-400">Figures in kEGP</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-4 font-semibold">{isAr ? 'البند المالي' : 'Financial Line Item'}</th>
                <th className="py-3 px-4 text-right font-mono">{isAr ? '2025 (ألف ج.م)' : '2025 (kEGP)'}</th>
                {activeMode === 'vertical' ? (
                  <>
                    <th className="py-3 px-4 text-center">{isAr ? 'الوزن النسبي (%)' : 'Relative Weight (%)'}</th>
                    <th className="py-3 px-4">{isAr ? 'تمثيل شريطي بياني' : 'Visual Proportion Bar'}</th>
                  </>
                ) : (
                  <>
                    <th className="py-3 px-4 text-right font-mono">{isAr ? '2024 (ألف ج.م)' : '2024 (kEGP)'}</th>
                    <th className="py-3 px-4 text-right font-mono">{isAr ? 'التغير المطلق ($)' : 'Absolute Change ($)'}</th>
                    <th className="py-3 px-4 text-center font-mono">{isAr ? 'نسبة النمو YoY' : 'YoY Growth (%)'}</th>
                  </>
                )}
                <th className="py-3 px-4 text-right">{isAr ? 'الدليل' : 'Trace'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {(statement === 'IS' ? isHorizontalRows : bsHorizontalRows).map((row, idx) => {
                const baseTotal = statement === 'IS' ? is.totalRevenue : bs.totalAssets;
                const verticalPct = baseTotal > 0 ? ((row.val2025 / baseTotal) * 100).toFixed(1) : '0.0';

                const absDiff = row.val2025 - row.val2024;
                const pctDiff = row.val2024 > 0 ? ((absDiff / row.val2024) * 100).toFixed(1) : '0.0';
                const isGrowth = absDiff >= 0;

                return (
                  <tr
                    key={idx}
                    className={`transition hover:bg-slate-800/40 ${
                      row.isTotal ? 'bg-slate-950/80 font-bold text-white' : ''
                    } ${row.isNet ? 'bg-blue-950/30 text-emerald-300 font-bold' : ''}`}
                  >
                    <td className="py-2.5 px-4 font-medium">
                      {isAr ? row.nameAr : row.nameEn}
                    </td>
                    <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-100">
                      {format(row.val2025)}
                    </td>

                    {activeMode === 'vertical' ? (
                      <>
                        <td className="py-2.5 px-4 text-center font-mono font-bold text-blue-400">
                          {verticalPct}%
                        </td>
                        <td className="py-2.5 px-4 w-48">
                          <div className="w-full bg-slate-800 rounded-full h-2 overflow-hidden">
                            <div
                              className="bg-blue-500 h-2 rounded-full"
                              style={{ width: `${Math.min(100, Math.abs(Number(verticalPct)))}%` }}
                            />
                          </div>
                        </td>
                      </>
                    ) : (
                      <>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-400">
                          {format(row.val2024)}
                        </td>
                        <td className="py-2.5 px-4 text-right font-mono text-slate-200">
                          {absDiff > 0 ? `+${format(absDiff)}` : format(absDiff)}
                        </td>
                        <td className="py-2.5 px-4 text-center font-mono font-bold">
                          <span
                            className={`px-2 py-0.5 rounded text-[11px] ${
                              isGrowth
                                ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                            }`}
                          >
                            {absDiff > 0 ? `+${pctDiff}%` : `${pctDiff}%`}
                          </span>
                        </td>
                      </>
                    )}

                    <td className="py-2.5 px-4 text-right">
                      <button
                        onClick={() => openEvidence('TRC-GROSS-MARGIN')}
                        className="text-blue-400 hover:text-blue-300 text-[11px] font-semibold"
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
    </div>
  );
};
