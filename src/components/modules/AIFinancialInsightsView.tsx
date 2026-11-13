import React, { useState } from 'react';
import { AIInsightItem, OutputLanguage, AccountingFramework, CompanyEntity, AccountRow } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  Sparkles,
  AlertTriangle,
  CheckCircle2,
  TrendingUp,
  FileText,
  Filter,
  ArrowRight,
  ShieldAlert,
  HelpCircle,
  Lightbulb,
  Loader2,
  Bot,
  Copy,
  Check,
  RefreshCw,
  Scale
} from 'lucide-react';

interface Props {
  insights: AIInsightItem[];
  language: OutputLanguage;
  framework: AccountingFramework;
  company?: CompanyEntity;
  accounts?: AccountRow[];
  onOpenCopilot?: () => void;
}

export const AIFinancialInsightsView: React.FC<Props> = ({
  insights,
  language,
  framework,
  company,
  accounts = [],
  onOpenCopilot
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [filterSeverity, setFilterSeverity] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Live Gemini Audit State
  const [liveAuditLoading, setLiveAuditLoading] = useState(false);
  const [liveAuditText, setLiveAuditText] = useState<string | null>(null);
  const [auditTimestamp, setAuditTimestamp] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const filtered = insights.filter((item) => {
    const matchesSev = filterSeverity === 'all' || item.severity === filterSeverity;
    const matchesCat = filterCategory === 'all' || item.category === filterCategory;
    return matchesSev && matchesCat;
  });

  const handleGenerateLiveAudit = async () => {
    setLiveAuditLoading(true);
    setLiveAuditText(null);

    try {
      const prompt = isAr
        ? `قم بإجراء تدقيق استراتيجي وتشغيلي شامل وموجز لميزان المراجعة والقوائم المالية الخاصة بشركة ${company ? company.nameAr : 'الأهرام للصناعات الهندسية'}.
الإطار المعتمد: ${framework}
عدد الحسابات: ${accounts.length || 38} حساب.
يرجى التركيز على:
1. تقييم كفاءة رأس المال العامل ودورة التحويل النقدي (CCC).
2. فحص أثر فوائد السحب على المكشوف وتسهيلات الائتمان على صافي الربح.
3. توصيات فورية لترشيد التكاليف وتحسين السيولة وفقاً لمعايير المحاسبة المصرية (EAS).`
        : `Conduct a comprehensive, high-impact executive financial and operational audit for ${company ? company.nameEn : 'Al-Ahram Industrial Engineering'}.
Reporting Standard: ${framework}
Number of Accounts: ${accounts.length || 38} accounts.
Focus on:
1. Working capital efficiency & Cash Conversion Cycle (CCC).
2. Bank overdraft interest impact on net profitability.
3. Concrete treasury and cost-containment recommendations compliant with EAS/IFRS.`;

      const res = await fetch('/api/gemini/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: prompt,
          role: 'cfo_advisor',
          model: 'gemini-3.8-flash',
          companyContext: company
            ? {
                name: isAr ? company.nameAr : company.nameEn,
                framework,
                currency: company.baseCurrency,
                scale: company.scale,
                accountCount: accounts.length
              }
            : undefined
        })
      });

      const data = await res.json();
      if (!data.success) throw new Error(data.error || 'Failed to generate audit');

      setLiveAuditText(data.text);
      setAuditTimestamp(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch (err: any) {
      console.error('Failed to run live audit:', err);
      setLiveAuditText(
        isAr
          ? `حدث خطأ أثناء إجراء التدقيق عبر Gemini: ${err.message}`
          : `Error during Gemini live audit: ${err.message}`
      );
    } finally {
      setLiveAuditLoading(false);
    }
  };

  const handleCopy = () => {
    if (liveAuditText) {
      navigator.clipboard.writeText(liveAuditText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'ذكاء اصطناعي تحليلي مدقق بالأدلة' : 'Evidence-Backed Financial AI'}
            </span>
            <span className="text-xs text-slate-400">
              {insights.length} {isAr ? 'رؤية إدارية مسجلة' : 'Actionable Briefings'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lightbulb className="w-6 h-6 text-amber-400" />
            {isAr ? 'الرؤى والتحليلات المالية الذكية وتوصيات الإدارة التنفيذية' : 'AI Financial Insights & CFO Management Briefings'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'تحويل الأرقام المحاسبية إلى رؤى تنفيذية صريحة. كل نتيجة تفصل بين الأثر المالي، المبالغ المعنية، الأسباب المحتملة، والتوصيات المقترنة بمسار أدلة قابل للتحقق.'
              : 'Translating ledger numbers into clear, traceable executive insights. Each briefing distinguishes calculated facts from hypotheses and links to complete evidence chains.'}
          </p>
        </div>

        {/* Live Audit Trigger & Filters */}
        <div className="flex flex-wrap items-center gap-2 text-xs">
          <button
            onClick={handleGenerateLiveAudit}
            disabled={liveAuditLoading}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold flex items-center gap-2 shadow-lg shadow-blue-600/30 transition disabled:opacity-50"
          >
            {liveAuditLoading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Sparkles className="w-4 h-4 text-amber-300" />
            )}
            <span>{isAr ? 'توليد تدقيق حي (Gemini 3.8 Flash)' : 'Run Live Audit (Gemini 3.8 Flash)'}</span>
          </button>

          <select
            value={filterSeverity}
            onChange={(e) => setFilterSeverity(e.target.value)}
            className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">{isAr ? 'كافة مستويات الأهمية' : 'All Severities'}</option>
            <option value="critical">{isAr ? 'حرجة وعاجلة (Critical)' : 'Critical Priority'}</option>
            <option value="warning">{isAr ? 'تنبيهات (Warning)' : 'Warnings'}</option>
            <option value="positive">{isAr ? 'نقاط قوة (Positive)' : 'Positive Strengths'}</option>
          </select>

          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">{isAr ? 'كافة الأقسام المحاسبية' : 'All Modules'}</option>
            <option value="Ratios">{isAr ? 'المؤشرات ورأس المال العامل' : 'Ratios & Working Capital'}</option>
            <option value="Income Statement">{isAr ? 'قائمة الدخل والربحية' : 'Income Statement'}</option>
            <option value="Treasury">{isAr ? 'الخزينة والسيولة والفوائد' : 'Treasury & Liquidity'}</option>
          </select>
        </div>
      </div>

      {/* Live Gemini Audit Result Card (if generated) */}
      {liveAuditText && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-blue-950/60 via-slate-900 to-indigo-950/40 border border-blue-500/40 shadow-2xl space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-blue-900/50">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
                <Bot className="w-4 h-4" />
              </div>
              <div>
                <span className="text-xs font-bold text-white flex items-center gap-2">
                  <span>{isAr ? 'تقرير التدقيق التنفيذي المباشر بواسطة Gemini' : 'Live Gemini Executive Audit Briefing'}</span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300">
                    gemini-3.8-flash
                  </span>
                </span>
                <span className="text-[10px] text-slate-400 font-mono">
                  {auditTimestamp} &bull; {framework} &bull; {company ? (isAr ? company.nameAr : company.nameEn) : 'Al-Ahram'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={handleCopy}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white text-xs flex items-center gap-1.5 transition"
                title="Copy text"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? (isAr ? 'تم النسخ' : 'Copied') : isAr ? 'نسخ' : 'Copy'}</span>
              </button>

              {onOpenCopilot && (
                <button
                  onClick={onOpenCopilot}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs flex items-center gap-1.5 shadow-md shadow-blue-600/30 transition"
                >
                  <Bot className="w-3.5 h-3.5" />
                  <span>{isAr ? 'متابعة النقاش في المساعد' : 'Open in Copilot'} &rarr;</span>
                </button>
              )}
            </div>
          </div>

          <div className="text-xs sm:text-sm text-slate-200 whitespace-pre-line leading-relaxed font-sans">
            {liveAuditText}
          </div>
        </div>
      )}

      {/* CFO Executive Summary Note */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/40 via-slate-900 to-slate-900 border border-blue-900/40 text-xs text-slate-300 space-y-2">
        <div className="flex items-center justify-between">
          <span className="font-bold text-blue-300 uppercase tracking-wider text-sm flex items-center gap-1.5">
            <FileText className="w-4 h-4 text-blue-400" />
            {isAr ? 'الموجز التنفيذي الموجه للمدير المالي والمدير العام (CFO Executive Brief)' : 'CFO & Executive Leadership Briefing'}
          </span>
          <span className="font-mono text-slate-400 text-[11px]">FY 2025 Closed Audit</span>
        </div>
        <p className="leading-relaxed">
          {isAr
            ? 'تتمتع الشركة بمتانة تشغيلية وهوامش ربح مجملة استثنائية (36.4%) متفوقة على القطاع الصناعي المصري (+3.9%). في المقابل، يمثل طول دورة تحصيل العملاء (133 يوماً مقابل 88 يوماً كمتوسط قطاعي) أكبر ضغط على السيولة النقدية، مما يضطر الإدارة للاعتماد على تسهيلات ائتمانية وسحب على المكشوف يستنزف 11.5 مليون ج.م في فوائد بنكية. التوصية الأساسية هي تسريع التحصيلات وتخصيم عقود التصدير لخفض رصيد السحب على المكشوف بمقدار 10 ملايين ج.م لتوفير 2.6 مليون ج.م فوائد سنوية.'
            : 'The company maintains excellent operational margins (36.4% Gross Margin vs 32.5% industry average), but suffers from working capital friction: receivables collection lags at 133 days (+45 days excess vs industry). This working capital blockage requires 22.0M EGP in bank overdrafts, consuming 11.5M EGP in finance interest. Prioritizing collections will directly eliminate overdraft interest and unlock ~2.6M EGP in net earnings.'}
        </p>
      </div>

      {/* Detailed Insights Cards */}
      <div className="space-y-4">
        {filtered.map((item) => {
          const isCritical = item.severity === 'critical';
          const isWarning = item.severity === 'warning';
          const isPositive = item.severity === 'positive';

          return (
            <div
              key={item.id}
              className={`p-6 rounded-2xl border text-xs space-y-4 transition ${
                isCritical
                  ? 'bg-rose-950/20 border-rose-900/40'
                  : isWarning
                  ? 'bg-amber-950/20 border-amber-900/40'
                  : 'bg-emerald-950/20 border-emerald-900/40'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                <div className="flex items-center gap-2">
                  <span
                    className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                      isCritical
                        ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                        : isWarning
                        ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}
                  >
                    {item.severity}
                  </span>
                  <span className="text-slate-400 font-mono">{item.category}</span>
                  <span className="text-slate-400 font-mono">ID: {item.id}</span>
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-slate-400">
                    {isAr ? 'مستوى الثقة:' : 'Confidence:'}{' '}
                    <strong className="text-emerald-400 font-mono">{(item.confidence * 100).toFixed(0)}%</strong>
                  </span>
                  <button
                    onClick={() => openEvidence(item.evidenceTraceId)}
                    className="px-3 py-1 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold flex items-center gap-1 transition"
                  >
                    {isAr ? 'فحص سلسلة الأدلة' : 'Show Evidence Chain'} &rarr;
                  </button>
                </div>
              </div>

              <div>
                <h3 className="text-base font-bold text-white mb-1.5">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <p className="text-slate-200 text-sm leading-relaxed">
                  {isAr ? item.findingAr : item.findingEn}
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    {isAr ? 'الأهمية والأثر المالي المباشر' : 'Financial Significance'}
                  </span>
                  <p className="text-slate-300 font-medium leading-relaxed">
                    {isAr ? item.financialSignificanceAr : item.financialSignificanceEn}
                  </p>
                  {item.amountInvolved && (
                    <span className="font-mono text-emerald-400 font-bold block mt-2">
                      {isAr ? 'المبلغ المعني: ' : 'Amount Involved: '}
                      {item.amountInvolved.toLocaleString()} kEGP
                    </span>
                  )}
                </div>

                <div className="p-3 rounded-xl bg-slate-950/60 border border-slate-800/80">
                  <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                    {isAr ? 'السبب المحتمل (فرضية غير مؤكدة)' : 'Hypothesized Possible Cause'}
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {isAr ? item.possibleCauseAr : item.possibleCauseEn}
                  </p>
                  <span className="text-[10px] text-slate-500 italic block mt-2">
                    {isAr ? '* يتطلب فحص أذون الصرف وسجلات العملاء' : '* Requires credit ledger confirmation'}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50">
                  <span className="text-[10px] text-blue-300 uppercase tracking-wider block mb-1 font-bold">
                    {isAr ? 'الإجراء والتوصية المعتمدة للإدارة' : 'Recommended Management Action'}
                  </span>
                  <p className="text-blue-100 font-medium leading-relaxed">
                    {isAr ? item.recommendedActionAr : item.recommendedActionEn}
                  </p>
                  <span className="text-[10px] text-blue-300 block mt-2">
                    {isAr ? 'المرجع المحاسبي: ' : 'Related Line: '}{item.relatedAccountOrRatio}
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
