import React, { useState } from 'react';
import { RatioItem, OutputLanguage, AccountingFramework } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  HelpCircle,
  Building2,
  Filter,
  Calculator
} from 'lucide-react';

interface Props {
  ratios: RatioItem[];
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const FinancialRatiosView: React.FC<Props> = ({
  ratios,
  language,
  framework
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [selectedCategory, setSelectedCategory] = useState<string>('all');

  const categories = [
    { id: 'all', labelEn: 'All Ratios', labelAr: 'كافة المؤشرات' },
    { id: 'Liquidity', labelEn: 'Liquidity', labelAr: 'السيولة' },
    { id: 'Profitability', labelEn: 'Profitability', labelAr: 'الربحية' },
    { id: 'Efficiency', labelEn: 'Efficiency & Turnover', labelAr: 'الكفاءة والنشاط' },
    { id: 'Solvency', labelEn: 'Solvency & Leverage', labelAr: 'الملاءة والرفع المالي' }
  ];

  const filteredRatios = ratios.filter(
    (r) => selectedCategory === 'all' || r.category === selectedCategory
  );

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'التحليل المالي بالنسب والمؤشرات' : 'Financial Ratio Diagnostic Engine'}
            </span>
            <span className="text-xs text-slate-400">
              {ratios.length} {isAr ? 'مؤشر مالي معتمد' : 'Audited Ratios'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Activity className="w-6 h-6 text-blue-400" />
            {isAr ? 'التحليل المالي الشامل للنسب والمؤشرات مع المقارنة القطاعية' : 'Comprehensive Financial Ratios & Benchmark Diagnostics'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'كل بطاقة مؤشر توضح المعادلة المحاسبية، القيم الفعلية، المقارنة بمتوسط الشريحة المماثلة في مصر، وفجوة الأداء مع زر التتبع المباشر للأدلة.'
              : 'Every ratio card displays its exact formula components, prior period movement, Egyptian sector benchmark comparison, and one-click trace to source books.'}
          </p>
        </div>

        {/* Category Pills */}
        <div className="flex flex-wrap items-center gap-1.5 text-xs">
          {categories.map((cat) => (
            <button
              key={cat.id}
              onClick={() => setSelectedCategory(cat.id)}
              className={`px-3 py-1.5 rounded-xl font-semibold transition border ${
                selectedCategory === cat.id
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800 hover:text-white'
              }`}
            >
              {isAr ? cat.labelAr : cat.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Ratios Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredRatios.map((ratio) => {
          const isFavorable =
            ratio.key === 'dso'
              ? ratio.currentValue <= ratio.benchmarkAverage
              : ratio.currentValue >= ratio.benchmarkAverage;

          return (
            <div
              key={ratio.id}
              className="p-5 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg flex flex-col justify-between space-y-4"
            >
              {/* Header */}
              <div>
                <div className="flex items-center justify-between text-xs mb-2">
                  <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold text-[10px]">
                    {ratio.category}
                  </span>
                  <button
                    onClick={() => openEvidence(ratio.evidenceTraceId)}
                    className="text-blue-400 hover:text-blue-300 font-semibold text-xs flex items-center gap-1"
                  >
                    {isAr ? 'فحص الدليل' : 'Audit Trace'} &rarr;
                  </button>
                </div>

                <h3 className="text-base font-bold text-white">
                  {isAr ? ratio.nameAr : ratio.nameEn}
                </h3>
                <p className="text-xs text-slate-400 mt-1 line-clamp-2">
                  {isAr ? ratio.definitionAr : ratio.definitionEn}
                </p>
              </div>

              {/* Value and Benchmark Comparison Box */}
              <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800/80 space-y-2.5">
                <div className="flex items-baseline justify-between">
                  <div>
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'قيمة الشركة الفعلية' : 'Company Actual'}
                    </span>
                    <span className="text-2xl font-bold font-mono text-white">
                      {ratio.currentValue} {ratio.unit}
                    </span>
                  </div>

                  <div className="text-right">
                    <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                      {isAr ? 'متوسط القطاع (مصر)' : 'Egypt Sector Avg'}
                    </span>
                    <span className="text-base font-bold font-mono text-slate-300">
                      {ratio.benchmarkAverage} {ratio.unit}
                    </span>
                  </div>
                </div>

                {/* Gap Indicator */}
                <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-xs">
                  <span className="text-slate-400">{isAr ? 'فجوة الأداء:' : 'Variance Gap:'}</span>
                  <span
                    className={`font-mono font-bold px-2 py-0.5 rounded text-[11px] ${
                      isFavorable
                        ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                        : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                    }`}
                  >
                    {ratio.gapVsBenchmark > 0 ? `+${ratio.gapVsBenchmark}` : ratio.gapVsBenchmark}{' '}
                    {ratio.unit} ({isFavorable ? (isAr ? 'أداء أفضل' : 'Favorable') : (isAr ? 'تأخر عن القطاع' : 'Unfavorable')})
                  </span>
                </div>
              </div>

              {/* Formula and Interpretation */}
              <div className="space-y-2 text-xs">
                <div className="p-2.5 rounded-lg bg-slate-900 border border-slate-800 font-mono text-[11px] text-blue-300">
                  <span className="text-slate-500 block text-[10px] uppercase font-sans font-semibold mb-0.5">
                    {isAr ? 'المعادلة الرياضية:' : 'Formula:'}
                  </span>
                  {isAr ? ratio.formulaAr : ratio.formulaEn}
                </div>

                <div className="text-slate-300 text-[11px] leading-relaxed">
                  <strong className="text-slate-200">{isAr ? 'التفسير المحاسبي: ' : 'Interpretation: '}</strong>
                  {isAr ? ratio.interpretationAr : ratio.interpretationEn}
                </div>

                <div className="text-blue-300 text-[11px] bg-blue-950/20 p-2 rounded border border-blue-900/30">
                  <strong className="text-blue-200">{isAr ? 'توصية المدير المالي: ' : 'Recommendation: '}</strong>
                  {isAr ? ratio.recommendedActionAr : ratio.recommendedActionEn}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
