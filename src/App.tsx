import React, { useState, useMemo } from 'react';
import {
  AccountingFramework,
  OutputLanguage,
  AccountRow,
  CompanyEntity,
  ScaleUnit,
  RatioItem,
  ValidationIssue
} from './types/accounting';
import {
  DEFAULT_COMPANY,
  DEFAULT_TRIAL_BALANCE_2025,
  EGYPT_INDUSTRIAL_BENCHMARK,
  PEER_COMPANIES,
  DEFAULT_JOURNAL_ENTRIES,
  DEFAULT_SUBLEDGER_ITEMS,
  DEFAULT_VALIDATION_ISSUES,
  DEFAULT_BUDGET_VARIANCES,
  DEFAULT_AI_INSIGHTS,
  DEFAULT_AUDIT_RISKS,
  DEFAULT_DISCLOSURE_CHECKLIST
} from './data/defaultCompanyData';
import {
  computeBalanceSheet,
  computeIncomeStatement,
  computeCashFlow,
  computeFinancialRatios
} from './utils/financialCalculations';
import { EvidenceProvider, useEvidence } from './context/EvidenceContext';
import { EvidenceModal } from './components/EvidenceModal';

// Modules
import { ExecutiveDashboard } from './components/modules/ExecutiveDashboard';
import { UploadCenter } from './components/modules/UploadCenter';
import { DataValidation } from './components/modules/DataValidation';
import { AccountMapping } from './components/modules/AccountMapping';
import { TrialBalanceView } from './components/modules/TrialBalanceView';
import { GeneralLedgerView } from './components/modules/GeneralLedgerView';
import { FinancialStatementsView } from './components/modules/FinancialStatementsView';
import { CashFlowAnalysisView } from './components/modules/CashFlowAnalysisView';
import { FinancialRatiosView } from './components/modules/FinancialRatiosView';
import { IndustryBenchmarkingView } from './components/modules/IndustryBenchmarkingView';
import { FinancialAnalysisView } from './components/modules/FinancialAnalysisView';
import { BudgetForecastingView } from './components/modules/BudgetForecastingView';
import { FiveYearModelView } from './components/modules/FiveYearModelView';
import { AIFinancialInsightsView } from './components/modules/AIFinancialInsightsView';
import { TranslationCenterView } from './components/modules/TranslationCenterView';
import { DisclosureCenterView } from './components/modules/DisclosureCenterView';
import { AuditRiskStudioView } from './components/modules/AuditRiskStudioView';
import { EvidenceAuditTrailView } from './components/modules/EvidenceAuditTrailView';
import { ReportsExportView } from './components/modules/ReportsExportView';
import { SettingsView } from './components/modules/SettingsView';
import { GeminiStudio } from './components/modules/GeminiStudio';
import { GeminiSlideOverDrawer } from './components/GeminiSlideOverDrawer';

import {
  Sparkles,
  Bot,
  MapPin,
  LayoutDashboard,
  UploadCloud,
  FileCheck,
  Layers,
  FileSpreadsheet,
  BookOpen,
  FileText,
  Banknote,
  Activity,
  Building2,
  Percent,
  CalendarRange,
  LineChart,
  Lightbulb,
  Languages,
  ShieldCheck,
  ShieldAlert,
  Download,
  Settings,
  Menu,
  X,
  Search,
  Globe,
  CheckCircle2,
  ChevronRight,
  ChevronLeft
} from 'lucide-react';

export function AppContent() {
  const [activeModule, setActiveModule] = useState<number>(2);
  const [framework, setFramework] = useState<AccountingFramework>('EAS');
  const [language, setLanguage] = useState<OutputLanguage>('ar');
  const [company, setCompany] = useState<CompanyEntity>(DEFAULT_COMPANY);
  const [accounts, setAccounts] = useState<AccountRow[]>(DEFAULT_TRIAL_BALANCE_2025);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [geminiDrawerOpen, setGeminiDrawerOpen] = useState(false);

  const { openEvidence } = useEvidence();

  const isAr = language === 'ar';

  // Core Financial Aggregations
  const computedIS = useMemo(() => computeIncomeStatement(accounts), [accounts]);
  const computedBS = useMemo(() => computeBalanceSheet(accounts, computedIS.netProfit), [accounts, computedIS.netProfit]);
  const computedCF = useMemo(() => computeCashFlow(computedIS, computedBS), [computedIS, computedBS]);
  const computedRatios = useMemo(
    () => computeFinancialRatios(computedBS, computedIS, computedCF, EGYPT_INDUSTRIAL_BENCHMARK),
    [computedBS, computedIS, computedCF]
  );

  const handleDataImported = (newAccounts: AccountRow[], fileName: string, scale: ScaleUnit) => {
    setAccounts(newAccounts);
    setCompany({ ...company, scale });
    setActiveModule(4); // Navigate to Review & Confirm Mapping gate
  };

  const navItems = [
    {
      groupEn: 'CORE ACCOUNTING',
      groupAr: 'المحاسبة والترحيل',
      items: [
        { id: 1, labelEn: 'Executive Dashboard', labelAr: 'لوحة القيادة التنفيذية', icon: LayoutDashboard },
        { id: 2, labelEn: 'Upload Center', labelAr: 'مركز رفع الملفات', icon: UploadCloud },
        { id: 3, labelEn: 'Data Validation', labelAr: 'فحص وتدقيق الدفاتر', icon: FileCheck },
        { id: 4, labelEn: 'Account Mapping', labelAr: 'اعتماد التبويب المحاسبي', icon: Layers },
        { id: 5, labelEn: 'Trial Balance', labelAr: 'ميزان المراجعة', icon: FileSpreadsheet },
        { id: 6, labelEn: 'General Ledger', labelAr: 'دفتر الأستاذ العام', icon: BookOpen }
      ]
    },
    {
      groupEn: 'STATEMENTS & TREASURY',
      groupAr: 'القوائم المالية والسيولة',
      items: [
        { id: 7, labelEn: 'Financial Statements', labelAr: 'القوائم المالية المدققة', icon: FileText },
        { id: 8, labelEn: 'Cash Flow Analysis', labelAr: 'قائمة التدفقات النقدية', icon: Banknote },
        { id: 12, labelEn: 'Budget & Forecasting', labelAr: 'الموازنات التقديرية', icon: CalendarRange },
        { id: 13, labelEn: '5-Year Financial Model', labelAr: 'النموذج المالي 5 سنوات', icon: LineChart }
      ]
    },
    {
      groupEn: 'AI & GROUNDING STUDIO',
      groupAr: 'الذكاء الاصطناعي والبحث الميداني',
      items: [
        { id: 21, labelEn: 'Gemini Copilot & Grounding', labelAr: 'استوديو Gemini والبحث الميداني', icon: Sparkles },
        { id: 14, labelEn: 'AI Financial Insights', labelAr: 'رؤى الذكاء الاصطناعي', icon: Lightbulb }
      ]
    },
    {
      groupEn: 'DIAGNOSTICS & BENCHMARK',
      groupAr: 'التحليل والمقارنة القطاعية',
      items: [
        { id: 9, labelEn: 'Financial Ratios', labelAr: 'النسب والمؤشرات المالية', icon: Activity },
        { id: 10, labelEn: 'Industry Benchmarking', labelAr: 'المقارنة بالقطاع الصناعي', icon: Building2 },
        { id: 11, labelEn: 'Vertical / Horizontal', labelAr: 'التحليل الرأسي والأفقي', icon: Percent }
      ]
    },
    {
      groupEn: 'STANDARDS & AUDIT',
      groupAr: 'المعايير والرقابة',
      items: [
        { id: 15, labelEn: 'Translation Center', labelAr: 'معجم المصطلحات (EAS/IFRS)', icon: Languages },
        { id: 16, labelEn: 'EAS & IFRS Disclosures', labelAr: 'الإفصاحات والإيضاحات', icon: ShieldCheck },
        { id: 17, labelEn: 'Audit & Risk Studio', labelAr: 'استوديو تدقيق الحسابات', icon: ShieldAlert },
        { id: 18, labelEn: 'Evidence & Audit Trail', labelAr: 'مسار الأدلة والتتبع', icon: CheckCircle2 }
      ]
    },
    {
      groupEn: 'OUTPUTS & GOVERNANCE',
      groupAr: 'المخرجات والإعدادات',
      items: [
        { id: 19, labelEn: 'Reports & Exports', labelAr: 'تصدير التقارير (Excel/PDF)', icon: Download },
        { id: 20, labelEn: 'Settings & Entities', labelAr: 'إعدادات المنظومة والكيان', icon: Settings }
      ]
    }
  ];

  return (
    <div
      className="min-h-screen bg-[#070D1E] text-slate-100 flex flex-col font-sans"
      dir={isAr ? 'rtl' : 'ltr'}
    >
      {/* Top Corporate Status Header */}
      <header className="sticky top-0 z-30 bg-[#0B152F]/95 backdrop-blur-md border-b border-slate-800/80 px-4 lg:px-6 py-2.5">
        <div className="flex items-center justify-between gap-4">
          {/* Logo & Mobile Menu Toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="lg:hidden p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white"
            >
              <Menu className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-2.5 cursor-pointer" onClick={() => setActiveModule(1)}>
              <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-blue-700 via-blue-600 to-indigo-500 flex items-center justify-center text-white shadow-lg shadow-blue-600/30 font-bold font-mono text-lg">
                IQ
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-extrabold text-white text-base tracking-tight font-sans">
                    LEDGER IQ
                  </span>
                  <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-widest hidden sm:inline-block">
                    STUDIO
                  </span>
                </div>
                <div className="text-[10px] text-slate-400 font-medium hidden sm:block">
                  {isAr ? 'منظومة المحاسبة والنمذجة المالية والتدقيق' : 'AI Accounting, Modeling & Audit Platform'}
                </div>
              </div>
            </div>
          </div>

          {/* Center Entity & Standard Badges */}
          <div className="hidden xl:flex items-center gap-3 text-xs">
            <div className="flex items-center gap-2 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="font-bold text-white">{isAr ? company.nameAr : company.nameEn}</span>
              <span className="text-slate-500">|</span>
              <span className="font-mono text-slate-400">{company.baseCurrency}</span>
            </div>

            <div className="flex items-center gap-1.5 px-3 py-1 rounded-xl bg-slate-900/90 border border-slate-800 text-slate-300">
              <span className="text-slate-400">{isAr ? 'الإطار المحاسبي:' : 'Standard:'}</span>
              <span className="font-bold text-blue-400 font-mono">
                {framework === 'EAS' ? 'EAS (المصرية)' : 'IFRS (الدولية)'}
              </span>
            </div>
          </div>

          {/* Right Controls: Framework, Language, Quick Evidence */}
          <div className="flex items-center gap-2 text-xs">
            {/* Framework Switcher Button */}
            <button
              onClick={() => setFramework(framework === 'EAS' ? 'IFRS' : 'EAS')}
              className="px-2.5 py-1.5 rounded-xl bg-slate-900 hover:bg-slate-800 border border-slate-700 text-slate-200 font-semibold transition flex items-center gap-1.5"
              title={isAr ? 'التبديل بين المعايير المصرية والدولية' : 'Switch EAS / IFRS Standard'}
            >
              <span className="text-[10px] text-slate-400 uppercase">Fw:</span>
              <span className="text-blue-300 font-mono font-bold">{framework}</span>
            </button>

            {/* Language Switcher */}
            <div className="flex items-center bg-slate-900 rounded-xl border border-slate-700 p-0.5">
              <button
                onClick={() => setLanguage('ar')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  language === 'ar' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                عربي
              </button>
              <button
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition ${
                  language === 'en' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                EN
              </button>
              <button
                onClick={() => setLanguage('bilingual')}
                className={`px-2 py-1 rounded-lg text-xs font-bold transition hidden sm:block ${
                  language === 'bilingual' ? 'bg-blue-600 text-white' : 'text-slate-400 hover:text-white'
                }`}
              >
                مزدوج
              </button>
            </div>

            {/* Gemini Copilot Launch Button */}
            <button
              onClick={() => setGeminiDrawerOpen(true)}
              className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold transition flex items-center gap-1.5 shadow-md shadow-blue-600/30 text-xs"
              title={isAr ? 'فتح مساعد Gemini الذكي المباشر' : 'Launch Gemini AI Copilot'}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-200" />
              <span>{isAr ? 'مساعد Gemini' : 'Gemini Copilot'}</span>
              <span className="text-[9px] px-1 py-0.2 rounded bg-white/20 text-white font-mono uppercase hidden md:inline">
                Grounding
              </span>
            </button>

            {/* Universal Evidence Trigger */}
            <button
              onClick={() => openEvidence('TRC-CURRENT-RATIO')}
              className="px-3 py-1.5 rounded-xl bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 font-semibold transition flex items-center gap-1.5"
            >
              <CheckCircle2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="hidden sm:inline">{isAr ? 'مسار الأدلة' : 'Audit Trail'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Workspace Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Navigation Sidebar */}
        <aside
          className={`fixed inset-y-0 z-40 lg:static lg:z-auto w-64 bg-[#081026] border-r border-slate-800/80 flex flex-col transition-transform duration-300 ${
            sidebarOpen ? 'translate-x-0' : isAr ? 'translate-x-full lg:translate-x-0' : '-translate-x-full lg:translate-x-0'
          }`}
        >
          {/* Mobile close button */}
          <div className="lg:hidden flex items-center justify-between p-4 border-b border-slate-800">
            <span className="font-bold text-white text-sm">القائمة الرئيسية</span>
            <button onClick={() => setSidebarOpen(false)} className="text-slate-400">
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Navigation Items List */}
          <div className="flex-1 overflow-y-auto p-3 space-y-5 text-xs">
            {navItems.map((group, gIdx) => (
              <div key={gIdx} className="space-y-1">
                <div className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-300">
                  {isAr ? group.groupAr : group.groupEn}
                </div>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = activeModule === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => {
                        setActiveModule(item.id);
                        setSidebarOpen(false);
                      }}
                      className={`w-full flex items-center justify-between px-3 py-2 rounded-xl font-medium transition ${
                        isActive
                          ? 'bg-blue-600 text-white font-bold shadow-md shadow-blue-600/20'
                          : 'text-slate-300 hover:text-white hover:bg-slate-900/80'
                      }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                        <span>{isAr ? item.labelAr : item.labelEn}</span>
                      </div>
                      <span className="text-[10px] font-mono text-slate-300">
                        {item.id}
                      </span>
                    </button>
                  );
                })}
              </div>
            ))}
          </div>

          {/* Sidebar Footer */}
          <div className="p-3 bg-slate-950/60 border-t border-slate-800/80 text-[11px] text-slate-400 space-y-1">
            <div className="flex items-center justify-between">
              <span>{isAr ? 'ميزان المراجعة:' : 'TB Status:'}</span>
              <span className="text-emerald-400 font-bold font-mono">100% Balanced</span>
            </div>
            <div className="flex items-center justify-between">
              <span>{isAr ? 'معايير الإفصاح:' : 'Standards:'}</span>
              <span className="text-blue-300 font-mono font-semibold">EAS / IFRS</span>
            </div>
          </div>
        </aside>

        {/* Backdrop for mobile */}
        {sidebarOpen && (
          <div
            onClick={() => setSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 z-30 lg:hidden backdrop-blur-xs"
          />
        )}

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-4 lg:p-8 bg-gradient-to-b from-[#091228] to-[#070D1E]">
          <div className="max-w-7xl mx-auto">
            {activeModule === 1 && (
              <ExecutiveDashboard
                bs={computedBS}
                is={computedIS}
                cf={computedCF}
                ratios={computedRatios}
                insights={DEFAULT_AI_INSIGHTS}
                company={company}
                accounts={accounts}
                language={language}
                framework={framework}
                onNavigate={(idx) => setActiveModule(idx)}
              />
            )}
            {activeModule === 2 && (
              <UploadCenter
                language={language}
                framework={framework}
                onDataImported={handleDataImported}
                onNavigateToMapping={() => setActiveModule(4)}
                onOpenCopilot={() => setGeminiDrawerOpen(true)}
              />
            )}
            {activeModule === 3 && (
              <DataValidation
                issues={DEFAULT_VALIDATION_ISSUES}
                subledgers={DEFAULT_SUBLEDGER_ITEMS}
                accounts={accounts}
                language={language}
                framework={framework}
                onNavigateToMapping={() => setActiveModule(4)}
              />
            )}
            {activeModule === 4 && (
              <AccountMapping
                accounts={accounts}
                language={language}
                framework={framework}
                onUpdateAccountMapping={(updated) => setAccounts(updated)}
                onProceedToStatements={() => setActiveModule(7)}
              />
            )}
            {activeModule === 5 && (
              <TrialBalanceView
                accounts={accounts}
                language={language}
                framework={framework}
                onNavigateToMapping={() => setActiveModule(4)}
              />
            )}
            {activeModule === 6 && (
              <GeneralLedgerView
                journalEntries={DEFAULT_JOURNAL_ENTRIES}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 7 && (
              <FinancialStatementsView
                bs={computedBS}
                is={computedIS}
                company={company}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 8 && (
              <CashFlowAnalysisView
                cf={computedCF}
                bs={computedBS}
                is={computedIS}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 9 && (
              <FinancialRatiosView
                ratios={computedRatios}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 10 && (
              <IndustryBenchmarkingView
                benchmark={EGYPT_INDUSTRIAL_BENCHMARK}
                peers={PEER_COMPANIES}
                ratios={computedRatios}
                company={company}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 11 && (
              <FinancialAnalysisView
                bs={computedBS}
                is={computedIS}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 12 && (
              <BudgetForecastingView
                variances={DEFAULT_BUDGET_VARIANCES}
                language={language}
                framework={framework}
                company={company}
                is={computedIS}
                cf={computedCF}
                bs={computedBS}
              />
            )}
            {activeModule === 13 && (
              <FiveYearModelView
                baseIS={computedIS}
                baseBS={computedBS}
                company={company}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 14 && (
              <AIFinancialInsightsView
                insights={DEFAULT_AI_INSIGHTS}
                language={language}
                framework={framework}
                company={company}
                accounts={accounts}
                onOpenCopilot={() => setGeminiDrawerOpen(true)}
              />
            )}
            {activeModule === 15 && (
              <TranslationCenterView
                language={language}
                framework={framework}
                onFrameworkChange={setFramework}
                onLanguageChange={setLanguage}
              />
            )}
            {activeModule === 16 && (
              <DisclosureCenterView
                checklist={DEFAULT_DISCLOSURE_CHECKLIST}
                company={company}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 17 && (
              <AuditRiskStudioView
                risks={DEFAULT_AUDIT_RISKS}
                company={company}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 18 && (
              <EvidenceAuditTrailView
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 19 && (
              <ReportsExportView
                bs={computedBS}
                is={computedIS}
                cf={computedCF}
                ratios={computedRatios}
                risks={DEFAULT_AUDIT_RISKS}
                disclosures={DEFAULT_DISCLOSURE_CHECKLIST}
                variances={DEFAULT_BUDGET_VARIANCES}
                company={company}
                language={language}
                framework={framework}
              />
            )}
            {activeModule === 20 && (
              <SettingsView
                company={company}
                language={language}
                framework={framework}
                onUpdateCompany={setCompany}
                onFrameworkChange={setFramework}
                onLanguageChange={setLanguage}
              />
            )}
            {activeModule === 21 && (
              <GeminiStudio
                language={language}
                framework={framework}
                company={company}
                accounts={accounts}
              />
            )}
          </div>
        </main>
      </div>

      {/* Universal Show Evidence Modal */}
      <EvidenceModal language={language} />

      {/* Slide-Over Drawer for Instant Gemini Access */}
      <GeminiSlideOverDrawer
        isOpen={geminiDrawerOpen}
        onClose={() => setGeminiDrawerOpen(false)}
        language={language}
        framework={framework}
        company={company}
        accounts={accounts}
      />
    </div>
  );
}

export default function App() {
  return (
    <EvidenceProvider>
      <AppContent />
    </EvidenceProvider>
  );
}
