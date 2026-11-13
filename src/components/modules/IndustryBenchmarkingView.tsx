import React, { useState } from 'react';
import {
  SectorBenchmarkData,
  PeerCompany,
  OutputLanguage,
  AccountingFramework,
  CompanyEntity,
  RatioItem
} from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  Building2,
  TrendingUp,
  TrendingDown,
  ShieldCheck,
  Info,
  CheckCircle2,
  AlertTriangle,
  Award,
  ExternalLink,
  Users,
  BarChart3
} from 'lucide-react';

interface Props {
  benchmark: SectorBenchmarkData;
  peers: PeerCompany[];
  ratios: RatioItem[];
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const IndustryBenchmarkingView: React.FC<Props> = ({
  benchmark,
  peers,
  ratios,
  company,
  language,
  framework
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'overview' | 'percentiles' | 'peers'>('overview');

  const benchmarkMetrics = [
    { key: 'gross_margin', nameEn: 'Gross Profit Margin', nameAr: 'هامش مجمل الربح', companyVal: 36.4, bench: benchmark.ratios.gross_margin },
    { key: 'operating_margin', nameEn: 'Operating Profit Margin', nameAr: 'هامش الربح التشغيلي', companyVal: 15.3, bench: benchmark.ratios.operating_margin },
    { key: 'ebitda_margin', nameEn: 'EBITDA Margin', nameAr: 'هامش EBITDA', companyVal: 20.8, bench: benchmark.ratios.ebitda_margin },
    { key: 'net_margin', nameEn: 'Net Profit Margin', nameAr: 'هامش صافي الربح', companyVal: 7.8, bench: benchmark.ratios.net_margin },
    { key: 'current_ratio', nameEn: 'Current Ratio', nameAr: 'نسبة السيولة الجارية', companyVal: 1.98, bench: benchmark.ratios.current_ratio },
    { key: 'quick_ratio', nameEn: 'Quick Ratio', nameAr: 'نسبة السيولة السريعة', companyVal: 1.31, bench: benchmark.ratios.quick_ratio },
    { key: 'dso', nameEn: 'Days Sales Outstanding (DSO)', nameAr: 'فترة تحصيل العملاء', companyVal: 133, bench: benchmark.ratios.dso },
    { key: 'dio', nameEn: 'Days Inventory Outstanding (DIO)', nameAr: 'فترة دوران المخزون', companyVal: 156, bench: benchmark.ratios.dio },
    { key: 'dpo', nameEn: 'Days Payables Outstanding (DPO)', nameAr: 'فترة سداد الموردين', companyVal: 128, bench: benchmark.ratios.dpo },
    { key: 'interest_coverage', nameEn: 'Interest Coverage', nameAr: 'معدل تغطية الفوائد', companyVal: 3.08, bench: benchmark.ratios.interest_coverage }
  ];

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'بيانات معتمدة من الهيئة العامة للرقابة المالية' : 'FRA & CAPMAS Audited Dataset'}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {benchmark.sampleSize} {isAr ? 'شركة مساهمة مصرية' : 'Sample Companies'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Building2 className="w-6 h-6 text-blue-400" />
            {isAr ? 'محرك المقارنة المعيارية بالقطاع الصناعي ونظراء السوق' : 'Industry Benchmarking & Peer Intelligence Engine'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? `مقارنة أداء ${company.nameAr} بمتوسطات ومئينيات (25%، 50%، 75%) قطاع الصناعات الهندسية والمعدات في مصر، استناداً إلى دراسات الهيئة العامة للرقابة المالية.`
              : `Benchmarking ${company.nameEn} against officially surveyed quartiles (P25, Median, P75) of Egyptian industrial machinery manufacturers.`}
          </p>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeTab === 'overview'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isAr ? 'نظرة عامة' : 'Overview'}
          </button>
          <button
            onClick={() => setActiveTab('percentiles')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeTab === 'percentiles'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isAr ? 'المئينيات والربيعات' : 'Quartiles & Medians'}
          </button>
          <button
            onClick={() => setActiveTab('peers')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              activeTab === 'peers'
                ? 'bg-blue-600 text-white border-blue-500'
                : 'bg-slate-800 text-slate-400 border-slate-700'
            }`}
          >
            {isAr ? 'مقارنة الشركات المماثلة' : 'Peer Companies'}
          </button>
        </div>
      </div>

      {/* Official Benchmark Transparency Citation Card */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border border-blue-900/40 space-y-3">
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-blue-400" />
            <span className="font-bold text-white text-sm">
              {isAr ? 'إفصاح مصدر وتوثيق البيانات المعيارية:' : 'Benchmark Source & Methodology Verification:'}
            </span>
          </div>
          <span className="text-slate-400 font-mono text-[11px]">{benchmark.reportingYear}</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-3 text-xs">
          <div>
            <span className="text-slate-400 block">{isAr ? 'الجهة المصدرة:' : 'Organization:'}</span>
            <strong className="text-slate-200">{benchmark.sourceOrg}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'التقرير المرجعي:' : 'Study / Report:'}</span>
            <strong className="text-slate-200">{benchmark.reportName}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'عينة الشركات:' : 'Sample Scope:'}</span>
            <strong className="text-emerald-400">{benchmark.sampleSize} {isAr ? 'شركة مساهمة صناعية' : 'Audited S.A.E. Firms'}</strong>
          </div>
          <div>
            <span className="text-slate-400 block">{isAr ? 'إطار المحاسبة:' : 'Accounting Standard:'}</span>
            <strong className="text-blue-300">EAS (معايير المحاسبة المصرية)</strong>
          </div>
        </div>
      </div>

      {/* Strengths & Critical Gaps Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-900/40 space-y-3">
          <div className="flex items-center gap-2">
            <Award className="w-5 h-5 text-emerald-400" />
            <h3 className="text-sm font-bold text-emerald-300">
              {isAr ? 'أقوى مؤشرات الشركة مقارنة بالقطاع' : 'Strongest Ratios Outperforming Industry'}
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span>{isAr ? 'هامش مجمل الربح:' : 'Gross Profit Margin:'} <strong className="text-white">36.4%</strong> vs {isAr ? 'قطاع' : 'Sector'} 32.5%</span>
              <span className="text-emerald-400 font-bold font-mono">+3.9% (Top Quartile)</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span>{isAr ? 'نسبة السيولة الجارية:' : 'Current Ratio:'} <strong className="text-white">1.98x</strong> vs {isAr ? 'قطاع' : 'Sector'} 1.62x</span>
              <span className="text-emerald-400 font-bold font-mono">+0.36x (Upper 75th)</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span>{isAr ? 'هامش الربح التشغيلي:' : 'Operating Margin:'} <strong className="text-white">15.3%</strong> vs {isAr ? 'قطاع' : 'Sector'} 14.8%</span>
              <span className="text-emerald-400 font-bold font-mono">+0.5% (In line)</span>
            </li>
          </ul>
        </div>

        <div className="p-5 rounded-2xl bg-rose-950/20 border border-rose-900/40 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-rose-400" />
            <h3 className="text-sm font-bold text-rose-300">
              {isAr ? 'أكبر فجوات الأداء المتأخرة عن القطاع' : 'Critical Performance Lags vs Industry'}
            </h3>
          </div>
          <ul className="space-y-2 text-xs text-slate-300">
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span>{isAr ? 'فترة تحصيل العملاء (DSO):' : 'Days Sales Outstanding (DSO):'} <strong className="text-white">133 {isAr ? 'يوم' : 'days'}</strong> vs 88 {isAr ? 'يوم' : 'days'}</span>
              <span className="text-rose-400 font-bold font-mono">+45 Days Excess</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span>{isAr ? 'فترة دوران المخزون (DIO):' : 'Days Inventory Outstanding:'} <strong className="text-white">156 {isAr ? 'يوم' : 'days'}</strong> vs 95 {isAr ? 'يوم' : 'days'}</span>
              <span className="text-rose-400 font-bold font-mono">+61 Days Tied Capital</span>
            </li>
            <li className="flex items-center justify-between p-2 rounded-lg bg-slate-900/80 border border-slate-800">
              <span>{isAr ? 'هامش صافي الربح:' : 'Net Profit Margin:'} <strong className="text-white">7.8%</strong> vs 9.8%</span>
              <span className="text-rose-400 font-bold font-mono">-2.0% (Interest Burden)</span>
            </li>
          </ul>
        </div>
      </div>

      {/* Main Benchmarks Table */}
      {activeTab === 'overview' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">
            {isAr ? 'جدول المقارنة القطاعية الشامل مع مؤشرات الأداء' : 'Comprehensive Industry Benchmark Comparison Table'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3 font-semibold">{isAr ? 'مؤشر الأداء' : 'Ratio Metric'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'أداء الشركة' : 'Company'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'متوسط القطاع' : 'Sector Avg'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'وسيط القطاع (Median)' : 'Median'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'فجوة المقارنة' : 'Variance Gap'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الموقع النسبي' : 'Peer Position'}</th>
                  <th className="py-3 px-3 text-right">{isAr ? 'الدليل' : 'Trace'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                {benchmarkMetrics.map((m) => {
                  const gap = Number((m.companyVal - m.bench.average).toFixed(2));
                  const isFavorable = m.key === 'dso' || m.key === 'dio' ? gap <= 0 : gap >= 0;

                  return (
                    <tr key={m.key} className="hover:bg-slate-800/40 transition">
                      <td className="py-2.5 px-3 font-medium text-slate-200">
                        {isAr ? m.nameAr : m.nameEn}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono font-bold text-white">
                        {m.companyVal} {m.bench.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-300">
                        {m.bench.average} {m.bench.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono text-slate-400">
                        {m.bench.median} {m.bench.unit}
                      </td>
                      <td className="py-2.5 px-3 text-center font-mono">
                        <span
                          className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                            isFavorable
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {gap > 0 ? `+${gap}` : gap} {m.bench.unit}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-center font-medium">
                        <span
                          className={`text-xs ${
                            isFavorable ? 'text-emerald-400' : 'text-rose-400'
                          }`}
                        >
                          {isFavorable
                            ? (isAr ? 'أعلى من المتوسط' : 'Above Average')
                            : (isAr ? 'أقل من المتوسط' : 'Below Average')}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
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
      )}

      {/* Percentiles Tab */}
      {activeTab === 'percentiles' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <h3 className="font-bold text-white text-base">
            {isAr ? 'توزيع المئينيات الإحصائية لقطاع الصناعات الهندسية في مصر' : 'Statistical Percentile Breakdown (P25, Median, P75, Top Range)'}
          </h3>
          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3 font-semibold">{isAr ? 'المؤشر' : 'Metric'}</th>
                  <th className="py-3 px-3 text-center font-mono text-blue-300">{isAr ? 'الشركة' : 'Company'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الربيع الأدنى (25%)' : '25th Percentile'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الوسيط (50%)' : 'Median (50%)'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'الربيع الأعلى (75%)' : '75th Percentile'}</th>
                  <th className="py-3 px-3 text-center font-mono text-emerald-400">{isAr ? 'الشريحة الرائدة (Top)' : 'Top Range'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                {benchmarkMetrics.map((m) => (
                  <tr key={m.key} className="hover:bg-slate-800/40">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {isAr ? m.nameAr : m.nameEn}
                    </td>
                    <td className="py-2.5 px-3 text-center font-bold text-white bg-blue-950/20">
                      {m.companyVal} {m.bench.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {m.bench.p25} {m.bench.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-200 font-semibold">
                      {m.bench.median} {m.bench.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">
                      {m.bench.p75} {m.bench.unit}
                    </td>
                    <td className="py-2.5 px-3 text-center text-emerald-400 font-semibold">
                      {m.bench.topQuartile} {m.bench.unit}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Peer Companies Tab */}
      {activeTab === 'peers' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="font-bold text-white text-base">
                {isAr ? 'مقارنة الأداء المالي مع الشركات المنافسة المماثلة في مصر' : 'Comparative Peer Company Financial Analysis'}
              </h3>
              <p className="text-xs text-slate-400 mt-0.5">
                {isAr
                  ? 'مقارنة مباشرة بين شركتنا وشركات صناعية مساهمة مقيدة ببورصة الأوراق المالية'
                  : 'Direct head-to-head comparison with listed industrial manufacturers.'}
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">EGX Audited Data</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-3 font-semibold">{isAr ? 'الشركة' : 'Company'}</th>
                  <th className="py-3 px-3 font-semibold text-center">{isAr ? 'رمز البورصة' : 'Ticker'}</th>
                  <th className="py-3 px-3 text-right">{isAr ? 'الإيرادات (م.ج)' : 'Revenue (M)'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'السيولة الجارية' : 'Current Ratio'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'هامش مجمل الربح' : 'Gross Margin'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'هامش صافي الربح' : 'Net Margin'}</th>
                  <th className="py-3 px-3 text-center">{isAr ? 'دورة النقدية (يوم)' : 'Cash Cycle (Days)'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/60 font-mono">
                {/* Our company */}
                <tr className="bg-blue-950/40 font-semibold border-y border-blue-500/40">
                  <td className="py-3 px-3 font-sans text-blue-300 font-bold">
                    {isAr ? company.nameAr : company.nameEn} ({isAr ? 'شركتنا' : 'Our Entity'})
                  </td>
                  <td className="py-3 px-3 text-center text-slate-400 font-sans">Private S.A.E.</td>
                  <td className="py-3 px-3 text-right text-white font-bold">240.5M</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold">1.98x</td>
                  <td className="py-3 px-3 text-center text-emerald-400 font-bold">36.4%</td>
                  <td className="py-3 px-3 text-center text-slate-200">7.8%</td>
                  <td className="py-3 px-3 text-center text-rose-400 font-bold">154 days</td>
                </tr>
                {peers.map((p) => (
                  <tr key={p.id} className="hover:bg-slate-800/40 font-mono">
                    <td className="py-2.5 px-3 font-sans font-medium text-slate-200">
                      {isAr ? p.nameAr : p.nameEn}
                    </td>
                    <td className="py-2.5 px-3 text-center text-slate-400">{p.ticker || '-'}</td>
                    <td className="py-2.5 px-3 text-right text-slate-300">{(p.revenue / 1000).toFixed(1)}M</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{p.currentRatio}x</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{p.grossMargin}%</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{p.netMargin}%</td>
                    <td className="py-2.5 px-3 text-center text-slate-300">{p.ccc} days</td>
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
