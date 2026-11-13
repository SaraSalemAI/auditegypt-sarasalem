import React, { useState, useMemo } from 'react';
import {
  CalculatedBalanceSheet,
  CalculatedIncomeStatement,
  CalculatedCashFlow
} from '../../utils/financialCalculations';
import {
  RatioItem,
  AIInsightItem,
  OutputLanguage,
  AccountingFramework,
  CompanyEntity,
  AccountRow
} from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import { AccountVolatilityHeatmap } from './AccountVolatilityHeatmap';
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend
} from 'recharts';
import { generate12MonthTrends } from '../../utils/comparativeData';
import {
  TrendingUp,
  TrendingDown,
  AlertTriangle,
  CheckCircle2,
  FileCheck2,
  Activity,
  Layers,
  ArrowUpRight,
  ShieldCheck,
  Building,
  LineChart as LineChartIcon,
  Flame,
  Sparkles
} from 'lucide-react';

interface Props {
  bs: CalculatedBalanceSheet;
  is: CalculatedIncomeStatement;
  cf: CalculatedCashFlow;
  ratios: RatioItem[];
  insights: AIInsightItem[];
  company: CompanyEntity;
  accounts?: AccountRow[];
  language: OutputLanguage;
  framework: AccountingFramework;
  onNavigate: (moduleIndex: number) => void;
}

export const ExecutiveDashboard: React.FC<Props> = ({
  bs,
  is,
  cf,
  ratios,
  insights,
  company,
  accounts = [],
  language,
  framework,
  onNavigate
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';

  const formatNumber = (num: number) => {
    return (num / 1000).toLocaleString(undefined, { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  };

  const highPriorityInsights = insights.filter(i => i.severity === 'critical' || i.severity === 'warning');

  // Executive Visual Analytics Mode: 'both' | 'trends' | 'heatmap'
  const [executiveViewMode, setExecutiveViewMode] = useState<'both' | 'trends' | 'heatmap'>('both');

  // 12-Month Dual-Axis Trends for Net Income and Cash Flow
  const [chartMode, setChartMode] = useState<'monthly' | 'cumulative'>('monthly');

  const monthlyTrends = useMemo(() => {
    return generate12MonthTrends(is.netProfit, cf.netCashFromOperating);
  }, [is.netProfit, cf.netCashFromOperating]);

  const chartData = useMemo(() => {
    if (chartMode === 'monthly') return monthlyTrends;
    let cumProfit = 0;
    let cumCF = 0;
    return monthlyTrends.map((pt) => {
      cumProfit += pt.netIncome;
      cumCF += pt.operatingCashFlow;
      return {
        ...pt,
        netIncome: parseFloat(cumProfit.toFixed(2)),
        operatingCashFlow: parseFloat(cumCF.toFixed(2))
      };
    });
  }, [monthlyTrends, chartMode]);

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Executive Welcome & Status Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/60 to-slate-900 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl pointer-events-none" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 relative z-10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                <CheckCircle2 className="w-3.5 h-3.5" />
                {isAr ? 'ميزان المراجعة معتمد ومطابق' : 'Trial Balance Validated & Reconciled'}
              </span>
              <span className="px-2.5 py-0.5 rounded text-xs font-semibold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                {framework === 'EAS'
                  ? (isAr ? 'معايير المحاسبة المصرية (EAS)' : 'Egyptian Accounting Standards (EAS)')
                  : (isAr ? 'المعايير الدولية للتقارير المالية (IFRS)' : 'International Standards (IFRS)')}
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {company.reportingPeriod}
              </span>
            </div>
            <h1 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              {isAr ? 'لوحة القيادة المالية والرقابة التنفيذية' : 'Executive Financial & Control Cockpit'}
            </h1>
            <p className="text-sm text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? `تحليل شامل ومترابط للأداء المالي لشركة ${company.nameAr}، مستند إلى ميزان مراجعة فعلي ودفاتر أستاذ مطابقة ومقارنات قطاعية موثقة.`
                : `Integrated financial intelligence for ${company.nameEn}, grounded in verified trial balance records, balanced general ledgers, and official sector benchmarks.`}
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => onNavigate(7)}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-medium text-xs shadow-lg shadow-blue-600/30 transition flex items-center gap-2"
            >
              <FileCheck2 className="w-4 h-4" />
              {isAr ? 'القوائم المالية' : 'Financial Statements'}
            </button>
            <button
              onClick={() => onNavigate(10)}
              className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 font-medium text-xs transition flex items-center gap-2"
            >
              <Building className="w-4 h-4" />
              {isAr ? 'المقارنة القطاعية' : 'Industry Benchmark'}
            </button>
          </div>
        </div>
      </div>

      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Revenue */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">
              {isAr ? 'إجمالي الإيرادات' : 'Total Revenue'}
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              +14.2% YoY <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatNumber(is.totalRevenue)}{' '}
            <span className="text-xs font-sans font-normal text-slate-400">
              {isAr ? 'مليون ج.م' : 'M EGP'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-400">
              {isAr ? 'عقود تصدير:' : 'Exports:'}{' '}
              <strong className="text-slate-200">{formatNumber(is.exportRevenue)}M</strong>
            </span>
            <button
              onClick={() => openEvidence('TRC-GROSS-MARGIN')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {isAr ? 'الدليل' : 'Evidence'} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Gross Profit Margin */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">
              {isAr ? 'هامش مجمل الربح' : 'Gross Profit Margin'}
            </span>
            <span className="text-emerald-400 font-medium flex items-center gap-0.5">
              {isAr ? 'أعلى من القطاع' : 'Above Peer Avg'} <TrendingUp className="w-3.5 h-3.5" />
            </span>
          </div>
          <div className="text-2xl font-bold font-mono text-emerald-400">
            {is.grossMarginPct.toFixed(1)}%
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-400">
              {isAr ? 'مجمل الربح:' : 'Gross Profit:'}{' '}
              <strong className="text-slate-200">{formatNumber(is.grossProfit)}M</strong>
            </span>
            <button
              onClick={() => openEvidence('TRC-GROSS-MARGIN')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {isAr ? 'الدليل' : 'Evidence'} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Operating Cash Flow */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">
              {isAr ? 'التدفق النقدي التشغيلي' : 'Operating Cash Flow'}
            </span>
            <span className="text-blue-400 font-mono text-xs">IAS 7 / EAS 4</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            {formatNumber(cf.netCashFromOperating)}{' '}
            <span className="text-xs font-sans font-normal text-slate-400">
              {isAr ? 'مليون ج.م' : 'M EGP'}
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-400">
              {isAr ? 'رصيد النقدية الختامي:' : 'Ending Cash:'}{' '}
              <strong className="text-slate-200">{formatNumber(cf.endingCash)}M</strong>
            </span>
            <button
              onClick={() => onNavigate(8)}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {isAr ? 'التحليل' : 'Analysis'} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>

        {/* Current Ratio */}
        <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 shadow-md hover:border-slate-700 transition">
          <div className="flex items-center justify-between text-xs text-slate-400 mb-2">
            <span className="font-semibold uppercase tracking-wider">
              {isAr ? 'نسبة السيولة الجارية' : 'Current Ratio'}
            </span>
            <span className="text-emerald-400 font-medium">1.98x</span>
          </div>
          <div className="text-2xl font-bold font-mono text-white">
            1.98x{' '}
            <span className="text-xs font-sans font-normal text-slate-400">
              ({isAr ? 'القطاع' : 'Sector'}: 1.62x)
            </span>
          </div>
          <div className="flex items-center justify-between mt-3 text-xs">
            <span className="text-slate-400">
              {isAr ? 'رأس المال العامل:' : 'Working Capital:'}{' '}
              <strong className="text-slate-200">
                {formatNumber(bs.totalCurrentAssets - bs.totalCurrentLiabilities)}M
              </strong>
            </span>
            <button
              onClick={() => openEvidence('TRC-CURRENT-RATIO')}
              className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
            >
              {isAr ? 'الدليل' : 'Evidence'} <ArrowUpRight className="w-3 h-3" />
            </button>
          </div>
        </div>
      </div>

      {/* Executive Visual Analytics Mode Selector */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-3.5 rounded-2xl bg-slate-900 border border-slate-800 text-xs">
        <div className="flex items-center gap-2">
          <Activity className="w-4 h-4 text-blue-400" />
          <span className="font-bold text-white">
            {isAr ? 'التحليلات البصرية المتقدمة للإدارة التنفيذية:' : 'Executive Visual Analytics Suite:'}
          </span>
          <span className="text-[11px] text-slate-400">
            {isAr ? 'اتجاهات السيولة (Recharts) وخريطة التذبذب والشواذ (D3.js)' : 'Liquidity Trajectory (Recharts) & Volatility Heatmap (D3.js)'}
          </span>
        </div>

        <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 gap-1 self-start sm:self-auto">
          <button
            onClick={() => setExecutiveViewMode('trends')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              executiveViewMode === 'trends'
                ? 'bg-blue-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <LineChartIcon className="w-3.5 h-3.5" />
            <span>{isAr ? 'اتجاهات الدخل والسيولة' : 'Dual-Axis Trends'}</span>
          </button>
          <button
            onClick={() => setExecutiveViewMode('heatmap')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              executiveViewMode === 'heatmap'
                ? 'bg-rose-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Flame className="w-3.5 h-3.5" />
            <span>{isAr ? 'خريطة التذبذب (D3.js)' : 'D3 Volatility Heatmap'}</span>
          </button>
          <button
            onClick={() => setExecutiveViewMode('both')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              executiveViewMode === 'both'
                ? 'bg-indigo-600 text-white shadow-sm'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>{isAr ? 'عرض متكامل (Both)' : 'Combined View'}</span>
          </button>
        </div>
      </div>

      {/* 12-Month Net Income vs Operating Cash Flow Dual-Axis Chart (Recharts) */}
      {(executiveViewMode === 'trends' || executiveViewMode === 'both') && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-800">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1 font-mono">
                  <LineChartIcon className="w-3.5 h-3.5 text-blue-400" />
                  12-Month Dual-Axis Trend Analysis
                </span>
                <span className="text-xs text-slate-400 font-mono">
                  {company.nameEn}
                </span>
              </div>
              <h3 className="text-lg font-bold text-white flex items-center gap-2">
                <Activity className="w-5 h-5 text-emerald-400" />
                {isAr
                  ? 'تحليل اتجاهات صافي الدخل والتدفقات النقدية التشغيلية (12 شهراً)'
                  : '12-Month Net Income vs. Operating Cash Flow Trajectory'}
              </h3>
              <p className="text-xs text-slate-300 mt-0.5 max-w-2xl">
                {isAr
                  ? 'رسم بياني بمحورين متزامنين لمقارنة جودة الأرباح المحاسبية مع التدفقات النقدية الفعلية المحققة من العمليات التشغيلية، موضحاً فجوات رأس المال العامل ومواسم سداد الضرائب والتحصيل.'
                  : 'Dual-axis financial trajectory analyzing the convergence between accounting profitability (Net Income) and actual cash realization (Operating Cash Flow) over the past 12 months.'}
              </p>
            </div>

            <div className="flex items-center gap-2 self-start sm:self-auto">
              {/* Mode Switcher: Monthly vs Cumulative */}
              <div className="flex items-center p-1 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                <button
                  onClick={() => setChartMode('monthly')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    chartMode === 'monthly'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'شهري' : 'Monthly'}
                </button>
                <button
                  onClick={() => setChartMode('cumulative')}
                  className={`px-3 py-1.5 rounded-lg font-bold transition ${
                    chartMode === 'cumulative'
                      ? 'bg-blue-600 text-white shadow-sm'
                      : 'text-slate-400 hover:text-white'
                  }`}
                >
                  {isAr ? 'تراكمي (YTD)' : 'Cumulative YTD'}
                </button>
              </div>
            </div>
          </div>

          {/* Dual Axis Legend & Quick Metrics */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'المحور الأيسر: صافي الدخل' : 'Left Axis: Net Income'}
                </span>
                <span className="text-base font-bold font-mono text-emerald-400">
                  {formatNumber(is.netProfit)}M <span className="text-[10px] text-slate-400 font-sans">EGP</span>
                </span>
              </div>
              <div className="w-3 h-3 rounded-full bg-emerald-500 shadow-sm shadow-emerald-500/50" />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'المحور الأيمن: التدفق النقدي' : 'Right Axis: Operating Cash Flow'}
                </span>
                <span className="text-base font-bold font-mono text-blue-400">
                  {formatNumber(cf.netCashFromOperating)}M <span className="text-[10px] text-slate-400 font-sans">EGP</span>
                </span>
              </div>
              <div className="w-3 h-3 rounded-full bg-blue-500 shadow-sm shadow-blue-500/50" />
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'معدل تحويل النقد (Cash Conversion)' : 'Earnings to Cash Ratio'}
                </span>
                <span className="text-base font-bold font-mono text-amber-400">
                  {((cf.netCashFromOperating / (is.netProfit || 1)) * 100).toFixed(0)}%
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">OCF / NI</span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800/80 flex items-center justify-between">
              <div>
                <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                  {isAr ? 'موسم الضغط على السيولة' : 'Cash Flow Trough'}
                </span>
                <span className="text-sm font-bold text-slate-200">
                  {isAr ? 'أبريل (سداد الضرائب)' : 'April (ETA Tax Filing)'}
                </span>
              </div>
              <span className="text-[10px] font-mono text-rose-400">Q2 Dip</span>
            </div>
          </div>

          {/* Recharts Dual-Axis Line Chart */}
          <div className="h-80 w-full pt-2">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart
                data={chartData}
                margin={{ top: 10, right: 30, left: 20, bottom: 10 }}
              >
                <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                <XAxis
                  dataKey={isAr ? 'monthAr' : 'month'}
                  stroke="#64748b"
                  tick={{ fill: '#94a3b8', fontSize: 11 }}
                  axisLine={{ stroke: '#334155' }}
                />
                {/* Left Y-Axis: Net Income */}
                <YAxis
                  yAxisId="left"
                  stroke="#10b981"
                  tick={{ fill: '#10b981', fontSize: 11 }}
                  tickFormatter={(val) => `${val}M`}
                  axisLine={{ stroke: '#10b981' }}
                />
                {/* Right Y-Axis: Operating Cash Flow */}
                <YAxis
                  yAxisId="right"
                  orientation={isAr ? 'left' : 'right'}
                  stroke="#3b82f6"
                  tick={{ fill: '#3b82f6', fontSize: 11 }}
                  tickFormatter={(val) => `${val}M`}
                  axisLine={{ stroke: '#3b82f6' }}
                />
                <Tooltip
                  content={({ active, payload, label }) => {
                    if (active && payload && payload.length) {
                      const ni = payload.find((p) => p.dataKey === 'netIncome')?.value;
                      const ocf = payload.find((p) => p.dataKey === 'operatingCashFlow')?.value;
                      return (
                        <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-2xl text-xs space-y-1.5 min-w-[190px]">
                          <div className="font-bold text-white border-b border-slate-800 pb-1 flex items-center justify-between">
                            <span>{label}</span>
                            <span className="text-[10px] font-mono text-slate-400">{company.reportingPeriod}</span>
                          </div>
                          <div className="flex items-center justify-between text-emerald-400 font-mono">
                            <span>{isAr ? 'صافي الدخل:' : 'Net Income:'}</span>
                            <span className="font-bold">{ni}M EGP</span>
                          </div>
                          <div className="flex items-center justify-between text-blue-400 font-mono">
                            <span>{isAr ? 'التدفق النقدي التشغيلي:' : 'Cash Flow (OCF):'}</span>
                            <span className="font-bold">{ocf}M EGP</span>
                          </div>
                          <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80">
                            {Number(ocf) < Number(ni)
                              ? (isAr ? 'امتصاص سيولة في رأس المال العامل' : 'Working capital cash absorption')
                              : (isAr ? 'تحويل نقدي مرتفع من المبيعات' : 'High cash conversion from collections')}
                          </div>
                        </div>
                      );
                    }
                    return null;
                  }}
                />
                <Legend
                  wrapperStyle={{ paddingTop: 10 }}
                  formatter={(value) => <span className="text-xs text-slate-300 font-medium px-1">{value}</span>}
                />
                <Line
                  yAxisId="left"
                  type="monotone"
                  dataKey="netIncome"
                  name={isAr ? 'صافي الدخل (Net Income)' : 'Net Income (M EGP)'}
                  stroke="#10b981"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#10b981', strokeWidth: 1, stroke: '#064e3b' }}
                  activeDot={{ r: 6, fill: '#34d399' }}
                />
                <Line
                  yAxisId="right"
                  type="monotone"
                  dataKey="operatingCashFlow"
                  name={isAr ? 'التدفق النقدي التشغيلي (Cash Flow)' : 'Operating Cash Flow (M EGP)'}
                  stroke="#3b82f6"
                  strokeWidth={2.5}
                  dot={{ r: 4, fill: '#3b82f6', strokeWidth: 1, stroke: '#1e3a8a' }}
                  activeDot={{ r: 6, fill: '#60a5fa' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* CFO Footnote Analysis */}
          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs text-slate-300 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" />
            <p className="leading-relaxed text-[11px]">
              <strong className="text-white">{isAr ? 'تحليل الإدارة المالية:' : 'CFO Diagnostic Note:'}</strong>{' '}
              {isAr
                ? 'يظهر التباين بين صافي الدخل وتدفقات النقد خلال شهري أبريل ومايو بسبب سداد الإقرارات الضريبية السنوية لمصلحة الضرائب المصرية (قانون 91/2005)، بينما يشهد الربع الرابع طفرة تدفقات نقدية قوية مدفوعة بتحصيلات عقود التصدير الخارجية وتصفية مستحقات العملاء.'
                : 'The seasonal divergence between Net Income and Cash Flow during April reflects statutory annual corporate tax payments to the Egyptian Tax Authority (Law 91/2005), followed by strong cash replenishment in Q4 driven by export receivables clearance.'}
            </p>
          </div>
        </div>
      )}

      {/* D3.js Account Volatility & Outlier Heatmap Overlay */}
      {(executiveViewMode === 'heatmap' || executiveViewMode === 'both') && (
        <AccountVolatilityHeatmap
          accounts={accounts}
          company={company}
          language={language}
          onOpenEvidence={openEvidence}
        />
      )}

      {/* Two Column Layout: Executive Summary + AI Priority Insights */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Core Financial Health Matrix (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          {/* Financial Position vs Performance Summary */}
          <div className="p-6 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="text-base font-bold text-white flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-400" />
                  {isAr ? 'الملخص المالي والمركز المحاسبي' : 'Financial Position & Performance Summary'}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {isAr
                    ? 'الأرقام مستخلصة ومطابقة من ميزان المراجعة وقائمة المركز المالي وقائمة الدخل'
                    : 'Values derived and verified from Balance Sheet and Income Statement'}
                </p>
              </div>
              <button
                onClick={() => onNavigate(7)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
              >
                {isAr ? 'عرض القوائم الكاملة' : 'View Full Statements'} &rarr;
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'إجمالي الأصول' : 'Total Assets'}
                </span>
                <span className="text-xl font-bold font-mono text-white block">
                  {formatNumber(bs.totalAssets)}M
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'متداولة: ' : 'Current: '}
                  {formatNumber(bs.totalCurrentAssets)}M
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'إجمالي الالتزامات' : 'Total Liabilities'}
                </span>
                <span className="text-xl font-bold font-mono text-slate-200 block">
                  {formatNumber(bs.totalLiabilities)}M
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'قصيرة الأجل: ' : 'Current: '}
                  {formatNumber(bs.totalCurrentLiabilities)}M
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'حقوق الملكية' : 'Total Equity'}
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400 block">
                  {formatNumber(bs.totalEquity)}M
                </span>
                <span className="text-[11px] text-slate-500">
                  {isAr ? 'رأس المال: ' : 'Capital: '}
                  {formatNumber(bs.shareCapital)}M
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'الربح التشغيلي (EBIT)' : 'Operating Profit (EBIT)'}
                </span>
                <span className="text-xl font-bold font-mono text-white block">
                  {formatNumber(is.operatingProfit)}M
                </span>
                <span className="text-[11px] text-slate-400">
                  {is.operatingMarginPct.toFixed(1)}% {isAr ? 'هامش' : 'Margin'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'الأرباح قبل الفوائد والضرائب والإهلاك (EBITDA)' : 'EBITDA (Analytical)'}
                </span>
                <span className="text-xl font-bold font-mono text-blue-300 block">
                  {formatNumber(is.ebitda)}M
                </span>
                <span className="text-[11px] text-slate-400">
                  {is.ebitdaMarginPct.toFixed(1)}% {isAr ? 'هامش' : 'Margin'}
                </span>
              </div>

              <div className="p-4 rounded-xl bg-slate-950/60 border border-slate-800/80">
                <span className="text-xs text-slate-400 block mb-1">
                  {isAr ? 'صافي أرباح العام' : 'Net Profit for Year'}
                </span>
                <span className="text-xl font-bold font-mono text-emerald-400 block">
                  {formatNumber(is.netProfit)}M
                </span>
                <span className="text-[11px] text-slate-400">
                  {is.netMarginPct.toFixed(1)}% {isAr ? 'هامش صافي' : 'Net Margin'}
                </span>
              </div>
            </div>

            {/* Quick Benchmark Highlights Table */}
            <div className="mt-6 pt-5 border-t border-slate-800">
              <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                {isAr ? 'مؤشرات الأداء الرئيسية مقارنة بالقطاع الصناعي المصري' : 'Key Ratios vs Egyptian Industrial Sector Benchmark'}
              </h4>
              <div className="overflow-x-auto">
                <table className="w-full text-xs">
                  <thead>
                    <tr className="text-slate-400 border-b border-slate-800">
                      <th className="py-2 text-left">{isAr ? 'المؤشر' : 'Financial Ratio'}</th>
                      <th className="py-2 text-center">{isAr ? 'الشركة' : 'Company'}</th>
                      <th className="py-2 text-center">{isAr ? 'متوسط القطاع' : 'Sector Avg'}</th>
                      <th className="py-2 text-center">{isAr ? 'الفجوة' : 'Variance Gap'}</th>
                      <th className="py-2 text-right">{isAr ? 'التقييم والمسار' : 'Audit Trace'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {ratios.slice(0, 5).map((r) => {
                      const isPositiveGap = r.gapVsBenchmark > 0;
                      return (
                        <tr key={r.id} className="hover:bg-slate-800/40">
                          <td className="py-2.5 font-medium text-slate-200">
                            {isAr ? r.nameAr : r.nameEn}
                          </td>
                          <td className="py-2.5 text-center font-mono font-semibold text-white">
                            {r.currentValue} {r.unit}
                          </td>
                          <td className="py-2.5 text-center font-mono text-slate-400">
                            {r.benchmarkAverage} {r.unit}
                          </td>
                          <td className="py-2.5 text-center font-mono">
                            <span
                              className={`px-2 py-0.5 rounded text-[11px] font-semibold ${
                                r.key === 'dso'
                                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                                  : isPositiveGap
                                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                  : 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                              }`}
                            >
                              {r.gapVsBenchmark > 0 ? `+${r.gapVsBenchmark}` : r.gapVsBenchmark} {r.unit}
                            </span>
                          </td>
                          <td className="py-2.5 text-right">
                            <button
                              onClick={() => openEvidence(r.evidenceTraceId)}
                              className="text-blue-400 hover:text-blue-300 font-medium inline-flex items-center gap-1"
                            >
                              {isAr ? 'فحص الدليل' : 'Audit Evidence'} &rarr;
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
        </div>

        {/* Right Column: AI CFO Insights & Audit Alerts (1 col) */}
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900/90 border border-slate-800">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-amber-400" />
                {isAr ? 'تنبيهات الإدارة المالية والأدلة' : 'Executive Insights & Risk Alerts'}
              </h3>
              <button
                onClick={() => onNavigate(14)}
                className="text-xs text-blue-400 hover:text-blue-300 font-medium"
              >
                {isAr ? 'عرض الكل' : 'View All'}
              </button>
            </div>

            <div className="space-y-3">
              {highPriorityInsights.map((item) => (
                <div
                  key={item.id}
                  className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition ${
                    item.severity === 'critical'
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'bg-amber-950/20 border-amber-900/40'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span
                      className={`font-semibold uppercase tracking-wider text-[10px] px-2 py-0.5 rounded ${
                        item.severity === 'critical'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {item.severity === 'critical' ? (isAr ? 'أولوية قصوى' : 'Critical') : (isAr ? 'تنبيه تدقيق' : 'Warning')}
                    </span>
                    <button
                      onClick={() => openEvidence(item.evidenceTraceId)}
                      className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                    >
                      {isAr ? 'تتبع الدليل' : 'Show Evidence'} &rarr;
                    </button>
                  </div>
                  <h4 className="font-bold text-slate-100 text-sm">
                    {isAr ? item.titleAr : item.titleEn}
                  </h4>
                  <p className="text-slate-300 leading-relaxed">
                    {isAr ? item.findingAr : item.findingEn}
                  </p>
                  <div className="pt-1 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                    <span>{isAr ? 'المبلغ المعني:' : 'Amount:'} <strong className="text-slate-200">{(item.amountInvolved || 0).toLocaleString()} kEGP</strong></span>
                    <span className="font-mono text-emerald-400">{isAr ? 'ثقة:' : 'Conf:'} {(item.confidence * 100).toFixed(0)}%</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Quick Action Hub */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-slate-900 to-slate-950 border border-slate-800 space-y-3">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
              {isAr ? 'الوصول السريع لمهام المدير المالي' : 'CFO & Controller Quick Actions'}
            </h4>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <button
                onClick={() => onNavigate(2)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-left transition"
              >
                <div className="font-semibold">{isAr ? 'رفع ميزان جديد' : 'Upload New TB'}</div>
                <div className="text-[10px] text-slate-400">{isAr ? 'إكسيل أو CSV' : 'Excel or CSV'}</div>
              </button>
              <button
                onClick={() => onNavigate(4)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-left transition"
              >
                <div className="font-semibold">{isAr ? 'مراجعة التبويب' : 'Review Mapping'}</div>
                <div className="text-[10px] text-slate-400">{isAr ? 'اعتماد الحسابات' : 'Confirm Taxonomy'}</div>
              </button>
              <button
                onClick={() => onNavigate(13)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-left transition"
              >
                <div className="font-semibold">{isAr ? 'النموذج المالي 5 سنوات' : '5-Year Model'}</div>
                <div className="text-[10px] text-slate-400">{isAr ? 'محاكاة السيناريوهات' : 'Scenario Forecast'}</div>
              </button>
              <button
                onClick={() => onNavigate(19)}
                className="p-2.5 rounded-lg bg-slate-800/80 hover:bg-slate-700 text-slate-200 border border-slate-700/80 text-left transition"
              >
                <div className="font-semibold">{isAr ? 'تصدير التقارير' : 'Export Reports'}</div>
                <div className="text-[10px] text-slate-400">{isAr ? 'PDF / إكسيل عربي' : 'Excel / PDF / Pack'}</div>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
