import React, { useState, useMemo } from 'react';
import {
  OutputLanguage,
  AccountingFramework,
  CompanyEntity,
  AccountRow
} from '../../types/accounting';
import {
  CalculatedIncomeStatement,
  CalculatedCashFlow,
  CalculatedBalanceSheet
} from '../../utils/financialCalculations';
import {
  Sliders,
  TrendingDown,
  TrendingUp,
  AlertTriangle,
  CheckCircle2,
  Sparkles,
  RefreshCw,
  DollarSign,
  Activity,
  ShieldAlert,
  Percent,
  Calendar,
  Layers,
  ArrowRight,
  Bot,
  Loader2,
  Copy,
  Check
} from 'lucide-react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line
} from 'recharts';

interface Props {
  language: OutputLanguage;
  framework: AccountingFramework;
  company?: CompanyEntity;
  is?: CalculatedIncomeStatement;
  cf?: CalculatedCashFlow;
  bs?: CalculatedBalanceSheet;
}

export interface StressVariables {
  revenueGrowthPct: number; // e.g. -15% to +30%
  inflationRatePct: number; // e.g. 10% to 45%
  cogsSurgePct: number; // e.g. -10% to +30%
  dsoDays: number; // e.g. 60 to 180 days
  cbeInterestRatePct: number; // e.g. 18% to 35%
  fxDepreciationPct: number; // e.g. 0% to 50%
}

export const CashFlowStressTestModule: React.FC<Props> = ({
  language,
  framework,
  company,
  is,
  cf,
  bs
}) => {
  const isAr = language === 'ar';

  // Fallback realistic figures if not passed from parent
  const baseRevenue = is?.totalRevenue || 178500; // in thousands EGP (178.5M EGP)
  const baseCOGS = is?.totalCostOfSales || 113500; // 113.5M EGP
  const baseOPEX = is?.totalOperatingExpenses || 28400; // 28.4M EGP
  const baseInterest = is?.financeCosts || 11500; // 11.5M EGP
  const baseOCF = cf?.netCashFromOperating || 18600; // 18.6M EGP
  const baseBeginningCash = cf?.beginningCash || 15000; // 15.0M EGP
  const baseReceivables = bs?.tradeReceivablesNet || 64800; // 64.8M EGP
  const baseOverdraft = bs?.shortTermBorrowings || 22000; // 22.0M EGP

  // Stress Variables State
  const [variables, setVariables] = useState<StressVariables>({
    revenueGrowthPct: 5.0, // +5%
    inflationRatePct: 26.5, // 26.5% headline inflation
    cogsSurgePct: 12.0, // +12% cost surge
    dsoDays: 145, // 145 days (elongated collection)
    cbeInterestRatePct: 28.25, // 28.25% CBE corridor lending
    fxDepreciationPct: 15.0 // +15% USD appreciation vs EGP
  });

  const [activePreset, setActivePreset] = useState<string>('moderate_stagflation');
  const [aiStressAdvice, setAiStressAdvice] = useState<string | null>(null);
  const [aiStressLoading, setAiStressLoading] = useState(false);
  const [copiedAdvice, setCopiedAdvice] = useState(false);

  // Apply Presets
  const applyPreset = (presetName: string) => {
    setActivePreset(presetName);
    switch (presetName) {
      case 'baseline':
        setVariables({
          revenueGrowthPct: 14.2,
          inflationRatePct: 22.0,
          cogsSurgePct: 0.0,
          dsoDays: 133,
          cbeInterestRatePct: 27.25,
          fxDepreciationPct: 5.0
        });
        break;
      case 'stagflation':
        setVariables({
          revenueGrowthPct: -10.0,
          inflationRatePct: 35.0,
          cogsSurgePct: 22.0,
          dsoDays: 165,
          cbeInterestRatePct: 31.0,
          fxDepreciationPct: 25.0
        });
        break;
      case 'supply_shock':
        setVariables({
          revenueGrowthPct: -4.0,
          inflationRatePct: 30.0,
          cogsSurgePct: 28.0,
          dsoDays: 150,
          cbeInterestRatePct: 29.5,
          fxDepreciationPct: 35.0
        });
        break;
      case 'wc_optimization':
        setVariables({
          revenueGrowthPct: 18.0,
          inflationRatePct: 18.0,
          cogsSurgePct: -3.0,
          dsoDays: 85,
          cbeInterestRatePct: 24.5,
          fxDepreciationPct: 0.0
        });
        break;
      case 'severe_crunch':
        setVariables({
          revenueGrowthPct: -25.0,
          inflationRatePct: 40.0,
          cogsSurgePct: 18.0,
          dsoDays: 180,
          cbeInterestRatePct: 33.0,
          fxDepreciationPct: 45.0
        });
        break;
      default:
        break;
    }
  };

  // Stressed Cash Flow Model Computations
  const stressResults = useMemo(() => {
    // 1. Revenue Impact
    const stressedRevenue = baseRevenue * (1 + variables.revenueGrowthPct / 100);

    // 2. COGS Impact (input surge + FX imported component)
    // Assuming 40% of COGS is imported raw materials subject to FX depreciation
    const fxImpactFactor = 1 + (variables.fxDepreciationPct / 100) * 0.4;
    const stressedCOGS =
      baseCOGS * (1 + variables.cogsSurgePct / 100) * fxImpactFactor;

    // 3. OPEX Impact (Driven by inflation rate)
    const baseInflation = 20.0;
    const inflationDelta = (variables.inflationRatePct - baseInflation) / 100;
    const stressedOPEX = baseOPEX * (1 + Math.max(inflationDelta, -0.1));

    // 4. Working Capital Receivables Absorption based on DSO
    // Normal baseline is 133 days
    const dailySales = stressedRevenue / 365;
    const stressedReceivables = dailySales * variables.dsoDays;
    const wcAbsorption = stressedReceivables - baseReceivables;

    // 5. Finance Costs Impact (Driven by interest rate & overdraft)
    const baseRate = 27.25;
    const rateFactor = variables.cbeInterestRatePct / baseRate;
    const stressedInterest = baseInterest * rateFactor;

    // 6. Stressed Operating Cash Flow
    // OCF = Stressed Revenue Collections - Cash COGS Disbursements - Cash OPEX - Interest - WC Absorption
    const grossCashMargin = stressedRevenue - stressedCOGS;
    const stressedOCF =
      grossCashMargin - stressedOPEX - stressedInterest - wcAbsorption * 0.35;

    // 7. Stressed Ending Cash & Overdraft Need
    const stressedEndingCash = baseBeginningCash + stressedOCF;
    const overdraftOverrun =
      stressedEndingCash < 0 ? Math.abs(stressedEndingCash) : 0;
    const totalRequiredFacility = baseOverdraft + overdraftOverrun;

    // 8. Solvency Indicators
    const ocfVariance = stressedOCF - baseOCF;
    const ocfVariancePct = baseOCF > 0 ? (ocfVariance / baseOCF) * 100 : -100;
    const isSolvent = stressedEndingCash >= 0;
    const daysOfLiquidity = Math.max(
      0,
      Math.round(
        ((baseBeginningCash + Math.max(0, stressedOCF)) /
          ((stressedOPEX + stressedCOGS) / 365))
      )
    );

    // 9. 12-Month Stressed Trajectory
    const monthlyProjection = [];
    let cumulativeCash = baseBeginningCash;
    const monthNames = [
      { en: 'Jan', ar: 'يناير' },
      { en: 'Feb', ar: 'فبراير' },
      { en: 'Mar', ar: 'مارس' },
      { en: 'Apr', ar: 'أبريل' },
      { en: 'May', ar: 'مايو' },
      { en: 'Jun', ar: 'يونيو' },
      { en: 'Jul', ar: 'يوليو' },
      { en: 'Aug', ar: 'أغسطس' },
      { en: 'Sep', ar: 'سبتمبر' },
      { en: 'Oct', ar: 'أكتوبر' },
      { en: 'Nov', ar: 'نوفمبر' },
      { en: 'Dec', ar: 'ديسمبر' }
    ];

    for (let m = 0; m < 12; m++) {
      const monthShare = 1 / 12;
      // Seasonality weights (e.g. tax in Apr, peak export in Q4)
      const seasonWeight =
        m === 3 ? 0.45 : m === 10 || m === 11 ? 1.45 : 1.0;
      const baseMonthlyOCF = (baseOCF / 12) * seasonWeight;
      const stressedMonthlyOCF = (stressedOCF / 12) * seasonWeight;
      cumulativeCash += stressedMonthlyOCF;

      monthlyProjection.push({
        month: isAr ? monthNames[m].ar : monthNames[m].en,
        baselineCashFlow: parseFloat((baseMonthlyOCF / 1000).toFixed(2)),
        stressedCashFlow: parseFloat((stressedMonthlyOCF / 1000).toFixed(2)),
        cumulativeLiquidity: parseFloat((cumulativeCash / 1000).toFixed(2))
      });
    }

    return {
      stressedRevenue,
      stressedCOGS,
      stressedOPEX,
      stressedInterest,
      stressedOCF,
      stressedEndingCash,
      overdraftOverrun,
      totalRequiredFacility,
      ocfVariance,
      ocfVariancePct,
      isSolvent,
      daysOfLiquidity,
      monthlyProjection
    };
  }, [
    baseRevenue,
    baseCOGS,
    baseOPEX,
    baseInterest,
    baseOCF,
    baseBeginningCash,
    baseReceivables,
    baseOverdraft,
    variables,
    isAr
  ]);

  // Trigger Gemini AI Stress Analysis
  const handleGenerateAIStressAdvice = async () => {
    setAiStressLoading(true);
    setAiStressAdvice(null);

    try {
      const prompt = isAr
        ? `بصفتك المدير المالي (CFO) واستشاري إدارة المخاطر، حلل نتائج اختبار التحمل المالي (What-If Stress Test) لشركة "${company?.nameAr || 'الصناعات الهندسية'}":
المتغيرات المطبقة:
- نمو/انكماش الإيرادات: ${variables.revenueGrowthPct > 0 ? `+${variables.revenueGrowthPct}%` : `${variables.revenueGrowthPct}%`}
- معدل التضخم السنوي: ${variables.inflationRatePct}%
- زيادة تكلفة المبيعات (COGS): +${variables.cogsSurgePct}%
- دورة تحصيل العملاء (DSO): ${variables.dsoDays} يوماً
- سعر الفائدة للبنك المركزي (CBE Corridor): ${variables.cbeInterestRatePct}%
- انخفاض سعر الصرف (USD/EGP): +${variables.fxDepreciationPct}%

النتائج المحسوبة:
- التدفق النقدي التشغيلي المضغوط (Stressed OCF): ${(stressResults.stressedOCF / 1000).toFixed(1)} مليون ج.م (تغير ${stressResults.ocfVariancePct.toFixed(1)}% عن الأساس)
- رصيد النقدية بنهاية العام: ${(stressResults.stressedEndingCash / 1000).toFixed(1)} مليون ج.م
- التسهيلات الائتمانية والسحب على المكشوف الإضافي المطلوب: ${(stressResults.overdraftOverrun / 1000).toFixed(1)} مليون ج.م
- أيام الأمان والسيولة: ${stressResults.daysOfLiquidity} يوماً

المطلوب:
1. تشخيص سريع لمدى استدامة السيولة ومخاطر كسر الشروط المصرفية (Bank Covenants).
2. 3 إجراءات دفاعية فورية لتقليص فجوة السيولة (تخصيم، إعادة تسعير، ترشيد نفقات).
3. حدود الأمان القصوى التي لا يجب أن تتجاوزها الشركة في هذا السيناريو.`
        : `As CFO and Risk Advisory Lead, analyze the following cash flow stress test results:
Variables Applied:
- Revenue Growth: ${variables.revenueGrowthPct}%
- Headline Inflation: ${variables.inflationRatePct}%
- Cost of Goods Sold Surge: +${variables.cogsSurgePct}%
- Days Sales Outstanding (DSO): ${variables.dsoDays} days
- CBE Lending Interest Rate: ${variables.cbeInterestRatePct}%
- EGP Currency Depreciation: +${variables.fxDepreciationPct}%

Financial Stress Outcomes:
- Stressed Operating Cash Flow: ${(stressResults.stressedOCF / 1000).toFixed(1)}M EGP (${stressResults.ocfVariancePct.toFixed(1)}% vs baseline)
- Projected Year-End Cash: ${(stressResults.stressedEndingCash / 1000).toFixed(1)}M EGP
- Additional Overdraft Required: ${(stressResults.overdraftOverrun / 1000).toFixed(1)}M EGP
- Days of Liquidity Runway: ${stressResults.daysOfLiquidity} days

Provide:
1. Solvency and bank covenant compliance risk verdict.
2. Three immediate defensive liquidity mitigations.
3. Critical thresholds for survival under this stress test.`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          role: 'treasury_fx',
          model: 'gemini-3.8-flash'
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate stress advisory');

      setAiStressAdvice(data.text);
    } catch (err: any) {
      console.error('AI Stress Error:', err);
      setAiStressAdvice(
        isAr
          ? `حدث خطأ أثناء استدعاء استشاري المخاطر: ${err.message}`
          : `Error obtaining stress advisory: ${err.message}`
      );
    } finally {
      setAiStressLoading(false);
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Module Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B152F] to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1.5">
                <Sliders className="w-3.5 h-3.5 text-amber-400" />
                Scenario & Sensitivity Engine
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {company?.reportingPeriod || 'FY 2025'}
              </span>
            </div>
            <h2 className="text-xl font-bold text-white flex items-center gap-2.5">
              <Activity className="w-6 h-6 text-amber-400" />
              {isAr
                ? 'اختبارات التحمل ومحاكاة السيولة النقدية ("What-If" Cash Flow Stress Tests)'
                : 'Cash Flow "What-If" Stress Testing & Sensitivity Simulation'}
            </h2>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'محاكاة ديناميكية لتقييم صمود الخزينة والتدفقات النقدية أمام صدمات السوق الحقيقية: انكماش الإيرادات، قفزات التضخم، ارتفاع أسعار الفائدة، وتأخر تحصيل العملاء.'
                : 'Interactive dynamic stress testing: evaluate treasury resilience against revenue downturns, raw material inflation, CBE interest spikes, and working capital receivables lockup.'}
            </p>
          </div>

          {/* Quick AI Trigger */}
          <button
            onClick={handleGenerateAIStressAdvice}
            disabled={aiStressLoading}
            className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-2 shadow-lg shadow-blue-600/30 transition self-start md:self-auto"
          >
            {aiStressLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>
              {isAr
                ? 'تحليل السيناريو بالذكاء الاصطناعي (Gemini)'
                : 'Analyze Scenario with Gemini'}
            </span>
          </button>
        </div>

        {/* Preset Stress Scenarios Bar */}
        <div className="pt-2 border-t border-slate-800 flex flex-wrap items-center gap-2 text-xs">
          <span className="text-slate-400 text-[11px] font-semibold shrink-0">
            {isAr ? 'سيناريوهات الصدمة الجاهزة:' : 'Pre-Packaged Shock Scenarios:'}
          </span>
          {[
            {
              id: 'baseline',
              labelEn: 'Baseline Plan',
              labelAr: 'الخطة المستهدفة (Baseline)'
            },
            {
              id: 'stagflation',
              labelEn: 'Stagflation Crisis (-10% Rev, +35% Inf)',
              labelAr: 'أزمة ركود تضخمي (-10% مبيعات، +35% تضخم)'
            },
            {
              id: 'supply_shock',
              labelEn: 'Supply Chain & FX Shock (+28% COGS, +35% FX)',
              labelAr: 'صدمة سلاسل الإمداد وسعر الصرف (+28% تكلفة)'
            },
            {
              id: 'wc_optimization',
              labelEn: 'Working Capital Overhaul (DSO 85d)',
              labelAr: 'تحسين كفاءة التحصيل (DSO 85 يوماً)'
            },
            {
              id: 'severe_crunch',
              labelEn: 'Severe Liquidity Crunch (-25% Rev, +33% Rate)',
              labelAr: 'أزمة سيولة حادة (-25% مبيعات، +33% فائدة)'
            }
          ].map((preset) => (
            <button
              key={preset.id}
              onClick={() => applyPreset(preset.id)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
                activePreset === preset.id
                  ? 'bg-amber-500 text-slate-950 border-amber-400 shadow-md font-bold'
                  : 'bg-slate-950/70 text-slate-300 border-slate-800 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isAr ? preset.labelAr : preset.labelEn}
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Left Variables Controls | Right Dynamic Stress Outcomes */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Interactive Stress Sliders (5 cols) */}
        <div className="lg:col-span-5 space-y-4">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-300 flex items-center gap-1.5">
                <Sliders className="w-4 h-4 text-amber-400" />
                {isAr ? 'لوحة تعديل المتغيرات الحاكمة' : 'Stress Variable Controls'}
              </span>
              <button
                onClick={() => applyPreset('baseline')}
                className="text-[11px] text-blue-400 hover:text-blue-300 flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                {isAr ? 'إعادة ضبط' : 'Reset'}
              </button>
            </div>

            {/* Slider 1: Revenue Growth */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'معدل نمو / تراجع الإيرادات' : 'Revenue Growth / Contraction'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    variables.revenueGrowthPct >= 0
                      ? 'text-emerald-400'
                      : 'text-rose-400'
                  }`}
                >
                  {variables.revenueGrowthPct > 0
                    ? `+${variables.revenueGrowthPct}%`
                    : `${variables.revenueGrowthPct}%`}
                </span>
              </div>
              <input
                type="range"
                min="-30"
                max="40"
                step="1"
                value={variables.revenueGrowthPct}
                onChange={(e) => {
                  setVariables({
                    ...variables,
                    revenueGrowthPct: parseFloat(e.target.value)
                  });
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-30% (Crisis)</span>
                <span>0%</span>
                <span>+40% (Boom)</span>
              </div>
            </div>

            {/* Slider 2: Inflation Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'معدل التضخم وزيادة المصروفات' : 'Headline Inflation / OPEX Surge'}
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {variables.inflationRatePct}%
                </span>
              </div>
              <input
                type="range"
                min="10"
                max="45"
                step="0.5"
                value={variables.inflationRatePct}
                onChange={(e) => {
                  setVariables({
                    ...variables,
                    inflationRatePct: parseFloat(e.target.value)
                  });
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>10% (Tame)</span>
                <span>26.5% (Benchmark)</span>
                <span>45% (Hyper)</span>
              </div>
            </div>

            {/* Slider 3: COGS Surge */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'قفزة تكلفة المبيعات والمواد الخام' : 'COGS / Direct Cost Surge'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    variables.cogsSurgePct > 10 ? 'text-rose-400' : 'text-slate-300'
                  }`}
                >
                  +{variables.cogsSurgePct}%
                </span>
              </div>
              <input
                type="range"
                min="-10"
                max="35"
                step="1"
                value={variables.cogsSurgePct}
                onChange={(e) => {
                  setVariables({
                    ...variables,
                    cogsSurgePct: parseFloat(e.target.value)
                  });
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>-10% (Discount)</span>
                <span>0% (Plan)</span>
                <span>+35% (Supply Shock)</span>
              </div>
            </div>

            {/* Slider 4: DSO Days */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'فترة تحصيل العملاء (DSO)' : 'Days Sales Outstanding (DSO)'}
                </span>
                <span
                  className={`font-mono font-bold ${
                    variables.dsoDays > 140 ? 'text-rose-400' : 'text-emerald-400'
                  }`}
                >
                  {variables.dsoDays} {isAr ? 'يوماً' : 'days'}
                </span>
              </div>
              <input
                type="range"
                min="60"
                max="180"
                step="5"
                value={variables.dsoDays}
                onChange={(e) => {
                  setVariables({
                    ...variables,
                    dsoDays: parseInt(e.target.value, 10)
                  });
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>60d (Fast)</span>
                <span>133d (Current)</span>
                <span>180d (Severe Lag)</span>
              </div>
            </div>

            {/* Slider 5: CBE Lending Interest Rate */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'سعر الفائدة البنكي (CBE Corridor)' : 'CBE Borrowing / Lending Rate'}
                </span>
                <span className="font-mono font-bold text-amber-400">
                  {variables.cbeInterestRatePct}%
                </span>
              </div>
              <input
                type="range"
                min="18"
                max="35"
                step="0.25"
                value={variables.cbeInterestRatePct}
                onChange={(e) => {
                  setVariables({
                    ...variables,
                    cbeInterestRatePct: parseFloat(e.target.value)
                  });
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>18% (Low)</span>
                <span>28.25% (Current)</span>
                <span>35% (Peak)</span>
              </div>
            </div>

            {/* Slider 6: Foreign Currency Depreciation */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs">
                <span className="font-semibold text-slate-200">
                  {isAr ? 'انخفاض سعر صرف الجنيه مقابل الدولار' : 'FX Devaluation (EGP/USD)'}
                </span>
                <span className="font-mono font-bold text-rose-400">
                  +{variables.fxDepreciationPct}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="50"
                step="5"
                value={variables.fxDepreciationPct}
                onChange={(e) => {
                  setVariables({
                    ...variables,
                    fxDepreciationPct: parseFloat(e.target.value)
                  });
                  setActivePreset('custom');
                }}
                className="w-full accent-amber-500 cursor-pointer"
              />
              <div className="flex justify-between text-[10px] text-slate-500 font-mono">
                <span>0% (Stable)</span>
                <span>+20% (Moderate)</span>
                <span>+50% (Sharp Float)</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column: Dynamic Stress Results & Projections (7 cols) */}
        <div className="lg:col-span-7 space-y-4">
          {/* Key Stress KPI Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
            {/* Stressed OCF */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {isAr ? 'التدفق التشغيلي المضغوط' : 'Stressed OCF'}
              </span>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  stressResults.stressedOCF >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {(stressResults.stressedOCF / 1000).toFixed(1)}M{' '}
                <span className="text-[10px] font-sans text-slate-400">EGP</span>
              </div>
              <span
                className={`text-[10px] font-semibold block mt-0.5 ${
                  stressResults.ocfVariance >= 0
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {stressResults.ocfVariance >= 0 ? '+' : ''}
                {stressResults.ocfVariancePct.toFixed(1)}% vs Base
              </span>
            </div>

            {/* Ending Cash Position */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {isAr ? 'رصيد نقدية نهاية العام' : 'Ending Liquidity'}
              </span>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  stressResults.stressedEndingCash >= 0
                    ? 'text-blue-400'
                    : 'text-rose-400'
                }`}
              >
                {(stressResults.stressedEndingCash / 1000).toFixed(1)}M{' '}
                <span className="text-[10px] font-sans text-slate-400">EGP</span>
              </div>
              <span className="text-[10px] text-slate-400 block mt-0.5">
                {stressResults.isSolvent
                  ? isAr ? 'رصيد إيجابي' : 'Solvent'
                  : isAr ? 'عجز سيولة' : 'Liquidity Deficit'}
              </span>
            </div>

            {/* Overdraft Overrun Required */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {isAr ? 'تسهيلات بنكية إضافية' : 'Extra Credit Needed'}
              </span>
              <div className="text-lg font-bold font-mono text-amber-400 mt-1">
                {(stressResults.overdraftOverrun / 1000).toFixed(1)}M{' '}
                <span className="text-[10px] font-sans text-slate-400">EGP</span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {isAr ? 'سحب مكشوف إضافي' : 'Overdraft Overrun'}
              </span>
            </div>

            {/* Liquidity Runway */}
            <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block">
                {isAr ? 'أيام الأمان النقدي' : 'Cash Runway'}
              </span>
              <div
                className={`text-lg font-bold font-mono mt-1 ${
                  stressResults.daysOfLiquidity > 45
                    ? 'text-emerald-400'
                    : 'text-rose-400'
                }`}
              >
                {stressResults.daysOfLiquidity}{' '}
                <span className="text-[10px] font-sans text-slate-400">
                  {isAr ? 'يوماً' : 'days'}
                </span>
              </div>
              <span className="text-[10px] text-slate-500 block mt-0.5">
                {stressResults.daysOfLiquidity > 60
                  ? isAr ? 'أمان ممتاز' : 'Adequate'
                  : isAr ? 'تحت الخطر' : 'Critical Risk'}
              </span>
            </div>
          </div>

          {/* 12-Month Projection Chart: Baseline vs Stressed */}
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <span className="text-xs font-bold text-white flex items-center gap-2">
                <Calendar className="w-4 h-4 text-blue-400" />
                {isAr
                  ? 'منحنى التدفق النقدي الشهري: الخطة المعتمدة مقابل السيناريو المضغوط'
                  : '12-Month Trajectory: Baseline Plan vs. Stressed Simulation'}
              </span>
              <span className="text-[10px] font-mono text-slate-400">M EGP</span>
            </div>

            <div className="h-64 w-full pt-1">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stressResults.monthlyProjection}>
                  <CartesianGrid stroke="#1e293b" strokeDasharray="3 3" vertical={false} />
                  <XAxis
                    dataKey="month"
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10.5 }}
                  />
                  <YAxis
                    stroke="#64748b"
                    tick={{ fill: '#94a3b8', fontSize: 10.5 }}
                    tickFormatter={(val) => `${val}M`}
                  />
                  <Tooltip
                    content={({ active, payload, label }) => {
                      if (active && payload && payload.length) {
                        return (
                          <div className="p-3 rounded-xl bg-slate-950 border border-slate-700 shadow-xl text-xs space-y-1">
                            <div className="font-bold text-white border-b border-slate-800 pb-1">
                              {label}
                            </div>
                            <div className="text-emerald-400 font-mono">
                              {isAr ? 'التدفق المستهدف:' : 'Baseline Plan:'}{' '}
                              <strong>{payload[0]?.value}M EGP</strong>
                            </div>
                            <div className="text-amber-400 font-mono">
                              {isAr ? 'التدفق المضغوط:' : 'Stressed Scenario:'}{' '}
                              <strong>{payload[1]?.value}M EGP</strong>
                            </div>
                            <div className="text-blue-400 font-mono border-t border-slate-800 pt-1">
                              {isAr ? 'رصيد النقدية التراكمي:' : 'Cumulative Cash:'}{' '}
                              <strong>{payload[2]?.value}M EGP</strong>
                            </div>
                          </div>
                        );
                      }
                      return null;
                    }}
                  />
                  <Legend
                    wrapperStyle={{ paddingTop: 8 }}
                    formatter={(val) => (
                      <span className="text-[11px] text-slate-300 font-medium px-1">
                        {val === 'baselineCashFlow'
                          ? isAr ? 'الخطة المستهدفة (Baseline Plan)' : 'Baseline Plan'
                          : val === 'stressedCashFlow'
                          ? isAr ? 'السيناريو المضغوط (Stressed)' : 'Stressed Simulation'
                          : isAr ? 'رصيد السيولة التراكمي (Cash Balance)' : 'Cumulative Cash Balance'}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="baselineCashFlow"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="stressedCashFlow"
                    fill="#f59e0b"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="cumulativeLiquidity"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* AI What-If Advisor Output Banner */}
          {aiStressAdvice && (
            <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-slate-900 to-indigo-950/50 border border-blue-500/40 shadow-xl space-y-3 animate-in fade-in">
              <div className="flex items-center justify-between pb-2 border-b border-blue-900/40">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                    <Bot className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-white flex items-center gap-2">
                      <span>
                        {isAr
                          ? 'التقرير التشخيصي والتوصيات التنفيذية (Gemini Stress Advisory)'
                          : 'CFO Stress Test Advisory & Defensive Playbook'}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                        gemini-3.8-flash
                      </span>
                    </span>
                  </div>
                </div>

                <button
                  onClick={() => {
                    navigator.clipboard.writeText(aiStressAdvice);
                    setCopiedAdvice(true);
                    setTimeout(() => setCopiedAdvice(false), 2000);
                  }}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs flex items-center gap-1 transition"
                >
                  {copiedAdvice ? (
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                  ) : (
                    <Copy className="w-3.5 h-3.5" />
                  )}
                  <span>{copiedAdvice ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
                </button>
              </div>

              <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
                {aiStressAdvice}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
