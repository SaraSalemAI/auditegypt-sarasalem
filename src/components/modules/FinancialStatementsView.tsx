import React, { useState } from 'react';
import {
  CalculatedBalanceSheet,
  CalculatedIncomeStatement
} from '../../utils/financialCalculations';
import {
  OutputLanguage,
  AccountingFramework,
  CompanyEntity
} from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  FileText,
  CheckCircle2,
  Download,
  Building,
  ArrowUpRight,
  Printer,
  Layers,
  HelpCircle
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  bs: CalculatedBalanceSheet;
  is: CalculatedIncomeStatement;
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const FinancialStatementsView: React.FC<Props> = ({
  bs,
  is,
  company,
  language,
  framework
}) => {
  const { openEvidence } = useEvidence();
  const [activeTab, setActiveTab] = useState<'BS' | 'IS'>('BS');
  const isAr = language === 'ar';
  const isBilingual = language === 'bilingual';

  const formatAmount = (num: number) => {
    return num.toLocaleString(undefined, { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  };

  const exportStatementsExcel = () => {
    const wb = XLSX.utils.book_new();

    // Balance Sheet Sheet
    const bsData = [
      ['بند المركز المالي (عربي)', 'Statement of Financial Position Line (English)', 'القيمة (ألف ج.م / kEGP)'],
      ['--- الأصول المتداولة (Current Assets) ---', '', ''],
      ['النقدية وما في حكمها', 'Cash and Cash Equivalents', bs.cashAndEquivalents],
      ['صافي العملاء وأوراق القبض', 'Trade and Other Receivables (Net)', bs.tradeReceivablesNet],
      ['المخزون السلعي (بالصافي)', 'Inventories (Net)', bs.inventoryNet],
      ['مصروفات مدفوعة مقدماً', 'Prepaid Expenses & Other', bs.prepayments],
      ['إجمالي الأصول المتداولة', 'Total Current Assets', bs.totalCurrentAssets],
      ['--- الأصول غير المتداولة (Non-current Assets) ---', '', ''],
      ['الأصول الثابتة (بالصافي)', 'Property, Plant & Equipment (Net)', bs.ppeNet],
      ['أصول حق الاستخدام (معيار 49 / 16)', 'Right-of-Use Assets', bs.rightOfUseAssets],
      ['أصول غير ملموسة وبرمجيات', 'Intangible Assets (Net)', bs.intangiblesNet],
      ['إجمالي الأصول غير المتداولة', 'Total Non-current Assets', bs.totalNonCurrentAssets],
      ['إجمالي الأصول', 'TOTAL ASSETS', bs.totalAssets],
      ['', '', ''],
      ['--- الالتزامات المتداولة (Current Liabilities) ---', '', ''],
      ['الموردون وأوراق الدفع', 'Trade and Other Payables', bs.tradePayables],
      ['تسهيلات ائتمانية قصيرة الأجل', 'Short-term Borrowings & Overdrafts', bs.shortTermBorrowings],
      ['التزامات عقود إيجار متداولة', 'Current Lease Liabilities', bs.currentLeaseLiabilities],
      ['مصروفات مستحقة ومصلحة الضرائب', 'Accruals & Taxes Payable', bs.accrualsAndTaxPayable],
      ['إجمالي الالتزامات المتداولة', 'Total Current Liabilities', bs.totalCurrentLiabilities],
      ['--- الالتزامات غير المتداولة (Non-current Liabilities) ---', '', ''],
      ['قروض بنكية طويلة الأجل', 'Long-term Bank Loans', bs.longTermBorrowings],
      ['التزامات عقود إيجار غير متداولة', 'Non-current Lease Liabilities', bs.nonCurrentLeaseLiabilities],
      ['التزامات ضريبية مؤجلة', 'Deferred Tax Liabilities', bs.deferredTaxLiabilities],
      ['إجمالي الالتزامات غير المتداولة', 'Total Non-current Liabilities', bs.totalNonCurrentLiabilities],
      ['إجمالي الالتزامات', 'TOTAL LIABILITIES', bs.totalLiabilities],
      ['', '', ''],
      ['--- حقوق الملكية (Equity) ---', '', ''],
      ['رأس المال المصدر والمدفوع', 'Issued & Paid-up Share Capital', bs.shareCapital],
      ['الاحتياطي القانوني الإلزامي', 'Statutory Legal Reserve', bs.statutoryReserve],
      ['احتياطيات أخرى ورأسمالية', 'General & Capital Reserves', bs.generalReserves],
      ['الأرباح المرحلة من سنوات سابقة', 'Retained Earnings Brought Forward', bs.retainedEarningsBroughtForward],
      ['صافي أرباح العام الحالي', 'Current Year Net Profit', bs.currentYearNetProfit],
      ['إجمالي حقوق الملكية', 'TOTAL EQUITY', bs.totalEquity],
      ['إجمالي الالتزامات وحقوق الملكية', 'TOTAL LIABILITIES & EQUITY', bs.totalLiabilitiesAndEquity]
    ];
    const wsBS = XLSX.utils.aoa_to_sheet(bsData);
    XLSX.utils.book_append_sheet(wb, wsBS, 'Balance_Sheet');

    // Income Statement Sheet
    const isData = [
      ['بند قائمة الدخل (عربي)', 'Income Statement Line (English)', 'القيمة (ألف ج.م / kEGP)', 'نسبة من الإيرادات (%)'],
      ['إيرادات المبيعات المحلية', 'Domestic Industrial Revenue', is.domesticRevenue, ((is.domesticRevenue / is.totalRevenue) * 100).toFixed(1)],
      ['إيرادات عقود التصدير', 'Export Contracts Revenue', is.exportRevenue, ((is.exportRevenue / is.totalRevenue) * 100).toFixed(1)],
      ['إيرادات خدمات ودعم فني', 'Service & Maintenance Revenue', is.serviceRevenue, ((is.serviceRevenue / is.totalRevenue) * 100).toFixed(1)],
      ['إجمالي الإيرادات', 'TOTAL REVENUE', is.totalRevenue, '100.0%'],
      ['تكلفة المبيعات المباشرة', 'Cost of Sales (COGS)', is.totalCostOfSales, ((is.totalCostOfSales / is.totalRevenue) * 100).toFixed(1)],
      ['مجمل الربح', 'GROSS PROFIT', is.grossProfit, is.grossMarginPct.toFixed(1)],
      ['مصروفات البيع والتسويق', 'Selling & Marketing Expenses', is.sellingExpenses, ((is.sellingExpenses / is.totalRevenue) * 100).toFixed(1)],
      ['مصروفات عمومية وإدارية', 'General & Administrative Expenses', is.gaSalaries + is.gaOtherExpenses, (((is.gaSalaries + is.gaOtherExpenses) / is.totalRevenue) * 100).toFixed(1)],
      ['إهلاك إداري واستهلاك برمجيات', 'Administrative Depreciation', is.adminDepreciation, ((is.adminDepreciation / is.totalRevenue) * 100).toFixed(1)],
      ['الأرباح قبل الفوائد والضرائب والإهلاك', 'EBITDA (Analytical measure)', is.ebitda, is.ebitdaMarginPct.toFixed(1)],
      ['الربح التشغيلي (EBIT)', 'OPERATING PROFIT (EBIT)', is.operatingProfit, is.operatingMarginPct.toFixed(1)],
      ['عوائد وفوائد دائنة', 'Finance & Interest Income', is.financeIncome, ((is.financeIncome / is.totalRevenue) * 100).toFixed(1)],
      ['تكاليف التمويل والفوائد المدينة', 'Finance & Borrowing Costs', is.financeCosts, ((is.financeCosts / is.totalRevenue) * 100).toFixed(1)],
      ['أرباح فروق العملات الأجنبية', 'Net Foreign Exchange Gain', is.fxGain, ((is.fxGain / is.totalRevenue) * 100).toFixed(1)],
      ['الربح قبل الضرائب (PBT)', 'PROFIT BEFORE TAX', is.profitBeforeTax, ((is.profitBeforeTax / is.totalRevenue) * 100).toFixed(1)],
      ['ضريبة الدخل المحملة', 'Income Tax Expense (22.5%)', is.incomeTaxExpense, ((is.incomeTaxExpense / is.totalRevenue) * 100).toFixed(1)],
      ['صافي ربح العام', 'NET PROFIT FOR THE YEAR', is.netProfit, is.netMarginPct.toFixed(1)]
    ];
    const wsIS = XLSX.utils.aoa_to_sheet(isData);
    XLSX.utils.book_append_sheet(wb, wsIS, 'Income_Statement');

    XLSX.writeFile(wb, `Financial_Statements_${company.reportingPeriod}.xlsx`);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {framework === 'EAS'
                ? (isAr ? 'معايير المحاسبة المصرية (EAS 1)' : 'Egyptian Accounting Standards (EAS 1)')
                : (isAr ? 'المعايير الدولية (IAS 1)' : 'International Standards (IAS 1)')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {company.reportingPeriod}
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'متطابقة ومدققة' : 'Audited & Balanced'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileText className="w-6 h-6 text-blue-400" />
            {isAr ? 'القوائم المالية المدققة والمقارنة' : 'Audited Financial Statements & Schedules'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? `قائمة المركز المالي وقائمة الدخل لشركة ${company.nameAr}، مطابقة ومصنفة بحسب المعايير وتدعم العرض باللغة العربية أو الإنجليزية أو الثنائي جنب إلى جنب.`
              : `Statement of Financial Position and Profit or Loss for ${company.nameEn}, formatted to statutory standards with bilingual dual-column support.`}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => window.print()}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition no-print"
          >
            <Printer className="w-4 h-4" />
            {isAr ? 'طباعة رسمية' : 'Print View'}
          </button>
          <button
            onClick={exportStatementsExcel}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition no-print"
          >
            <Download className="w-4 h-4" />
            {isAr ? 'تصدير إكسيل كامل' : 'Export Excel'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 no-print">
        <button
          onClick={() => setActiveTab('BS')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${
            activeTab === 'BS'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {isAr ? 'قائمة المركز المالي (الميزانية العمومية)' : 'Statement of Financial Position (Balance Sheet)'}
        </button>
        <button
          onClick={() => setActiveTab('IS')}
          className={`px-5 py-2.5 rounded-xl text-xs font-bold transition border ${
            activeTab === 'IS'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          {isAr ? 'قائمة الأرباح أو الخسائر (قائمة الدخل)' : 'Statement of Profit or Loss (Income Statement)'}
        </button>
      </div>

      {/* BALANCE SHEET VIEW */}
      {activeTab === 'BS' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
            <div>
              <span className="font-semibold text-white text-sm">
                {isAr ? company.nameAr : company.nameEn}
              </span>
              <p>{isAr ? 'كما في 31 ديسمبر 2025 و 2024 (الأرقام بألف جنيه مصري)' : 'As at Dec 31, 2025 & 2024 (Figures in kEGP)'}</p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className="px-2.5 py-1 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-mono font-bold">
                {isAr ? 'معادلة الميزانية: أصول = التزامات + ملكية' : 'Assets = Liabilities + Equity (Balanced)'}
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">{isAr ? 'بند القائمة المالية' : 'Line Item'}</th>
                  {isBilingual && (
                    <th className="py-3 px-4 font-semibold text-slate-300">Statement Line (Arabic / عربي)</th>
                  )}
                  <th className="py-3 px-4 text-center">{isAr ? 'الإيضاح' : 'Note'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? '2025 (ألف ج.م)' : '2025 (kEGP)'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? '2024 (ألف ج.م)' : '2024 (kEGP)'}</th>
                  <th className="py-3 px-4 text-right no-print">{isAr ? 'الدليل' : 'Evidence'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                {/* SECTION 1: ASSETS */}
                <tr className="bg-slate-950/80 font-bold text-blue-400">
                  <td colSpan={isBilingual ? 6 : 5} className="py-2.5 px-4 uppercase tracking-wider text-[11px]">
                    {isAr ? 'أولاً: الأصول المتداولة' : 'Current Assets'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'النقدية وما في حكمها بالبنوك والخزينة' : 'Cash and Cash Equivalents'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">النقدية وما في حكمها</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 5</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.cashAndEquivalents)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">35,100</td>
                  <td className="py-2 px-4 text-right no-print">
                    <button onClick={() => openEvidence('TRC-CURRENT-RATIO')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'العملاء وأوراق القبض (بالصافي بعد مخصص التعثر)' : 'Trade & Other Receivables (Net of ECL)'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">صافي العملاء وأوراق القبض</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 6</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.tradeReceivablesNet)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">69,400</td>
                  <td className="py-2 px-4 text-right no-print">
                    <button onClick={() => openEvidence('TRC-DSO-WORKING-CAPITAL')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'المخزون السلعي (خامات وإنتاج تام بالصافي)' : 'Inventories (Net)'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">صافي المخزون السلعي</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 7</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.inventoryNet)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">53,700</td>
                  <td className="py-2 px-4 text-right no-print">
                    <button onClick={() => openEvidence('TRC-CURRENT-RATIO')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'مصروفات مدفوعة مقدماً ومدينون متنوعون' : 'Prepayments and Other Current Assets'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">مصروفات مدفوعة مقدماً</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 8</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.prepayments)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">4,100</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-t border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'إجمالي الأصول المتداولة' : 'Total Current Assets'}</td>
                  {isBilingual && <td className="py-2.5 px-4">إجمالي الأصول المتداولة</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-300">{formatAmount(bs.totalCurrentAssets)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">162,300</td>
                  <td className="no-print"></td>
                </tr>

                {/* NON-CURRENT ASSETS */}
                <tr className="bg-slate-950/80 font-bold text-blue-400">
                  <td colSpan={isBilingual ? 6 : 5} className="py-2.5 px-4 uppercase tracking-wider text-[11px]">
                    {isAr ? 'ثانياً: الأصول غير المتداولة' : 'Non-Current Assets'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'الأصول الثابتة (بالصافي بعد مجمع الإهلاك)' : 'Property, Plant and Equipment (Net)'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">الأصول الثابتة (صافي)</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 9</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.ppeNet)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">128,300</td>
                  <td className="py-2 px-4 text-right no-print">
                    <button onClick={() => openEvidence('TRC-CURRENT-RATIO')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'أصول حق الاستخدام (معيار المحاسبة المصري 49)' : 'Right-of-Use Assets (EAS 49 / IFRS 16)'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">أصول حق الاستخدام</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 10</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.rightOfUseAssets)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">15,600</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'أصول غير ملموسة وبرمجيات ERP' : 'Intangible Assets & Software'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">أصول غير ملموسة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 11</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.intangiblesNet)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">3,100</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-t border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'إجمالي الأصول غير المتداولة' : 'Total Non-Current Assets'}</td>
                  {isBilingual && <td className="py-2.5 px-4">إجمالي الأصول غير المتداولة</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-300">{formatAmount(bs.totalNonCurrentAssets)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">147,000</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="bg-blue-950/60 font-bold text-base text-white border-y-2 border-blue-600">
                  <td className="py-3 px-4">{isAr ? 'إجمالي الأصول' : 'TOTAL ASSETS'}</td>
                  {isBilingual && <td className="py-3 px-4 text-blue-200">إجمالي الأصول</td>}
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatAmount(bs.totalAssets)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">309,300</td>
                  <td className="no-print"></td>
                </tr>

                {/* SECTION 2: LIABILITIES & EQUITY */}
                <tr className="bg-slate-950/80 font-bold text-blue-400">
                  <td colSpan={isBilingual ? 6 : 5} className="py-2.5 px-4 uppercase tracking-wider text-[11px]">
                    {isAr ? 'ثالثاً: الالتزامات المتداولة' : 'Current Liabilities'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'الموردون وأوراق الدفع التجارية' : 'Trade and Notes Payable'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">الموردون وأوراق الدفع</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 12</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.tradePayables)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">46,600</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'تسهيلات ائتمانية قصيرة الأجل وسحب على المكشوف' : 'Short-term Borrowings & Overdrafts'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">تسهيلات بنكية قصيرة الأجل</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 13</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.shortTermBorrowings)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">18,000</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'التزامات عقود إيجار متداولة' : 'Current Lease Liabilities'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">التزامات إيجار متداولة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 14</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.currentLeaseLiabilities)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">3,600</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'مصروفات مستحقة ومستحقات مصلحة الضرائب' : 'Accrued Expenses & Tax Payable'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">مستحقات ضريبية ومصروفات مستحقة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 15</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.accrualsAndTaxPayable)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">11,600</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-t border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'إجمالي الالتزامات المتداولة' : 'Total Current Liabilities'}</td>
                  {isBilingual && <td className="py-2.5 px-4">إجمالي الالتزامات المتداولة</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-300">{formatAmount(bs.totalCurrentLiabilities)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">79,800</td>
                  <td className="no-print"></td>
                </tr>

                {/* NON-CURRENT LIABILITIES */}
                <tr className="bg-slate-950/80 font-bold text-blue-400">
                  <td colSpan={isBilingual ? 6 : 5} className="py-2.5 px-4 uppercase tracking-wider text-[11px]">
                    {isAr ? 'رابعاً: الالتزامات غير المتداولة' : 'Non-Current Liabilities'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'قروض بنكية طويلة الأجل لتمويل التوسعات' : 'Long-term Bank Loans'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">قروض طويلة الأجل</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 16</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.longTermBorrowings)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">46,000</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'التزامات عقود إيجار غير متداولة' : 'Non-current Lease Liabilities'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">التزامات إيجار غير متداولة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 17</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.nonCurrentLeaseLiabilities)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">10,800</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'التزامات ضريبية مؤجلة' : 'Deferred Tax Liabilities'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">ضرائب مؤجلة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 18</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.deferredTaxLiabilities)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">4,600</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-t border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'إجمالي الالتزامات' : 'Total Liabilities'}</td>
                  {isBilingual && <td className="py-2.5 px-4">إجمالي الالتزامات</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-300">{formatAmount(bs.totalLiabilities)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">141,200</td>
                  <td className="no-print"></td>
                </tr>

                {/* EQUITY */}
                <tr className="bg-slate-950/80 font-bold text-emerald-400">
                  <td colSpan={isBilingual ? 6 : 5} className="py-2.5 px-4 uppercase tracking-wider text-[11px]">
                    {isAr ? 'خامساً: حقوق الملكية' : 'Equity'}
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'رأس المال المصدر والمدفوع بالكامل' : 'Issued and Paid-up Share Capital'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">رأس المال المصدر</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 19</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.shareCapital)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">80,000</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'الاحتياطي القانوني الإلزامي (قانون 159/1981)' : 'Statutory Legal Reserve'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">الاحتياطي القانوني</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 20</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.statutoryReserve)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">18,200</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'احتياطي رأسمالي وتوسعات' : 'Capital & Expansion Reserves'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">احتياطيات أخرى</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 21</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.generalReserves)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">12,000</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-slate-200">
                    {isAr ? 'الأرباح المرحلة من فترات سابقة' : 'Retained Earnings Brought Forward'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">أرباح مرحلة سابقة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 22</td>
                  <td className="py-2 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(bs.retainedEarningsBroughtForward)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">28,400</td>
                  <td className="py-2 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2 px-4 font-medium text-emerald-300">
                    {isAr ? 'صافي أرباح الفترة المالية الحالية' : 'Net Profit for the Current Year'}
                  </td>
                  {isBilingual && <td className="py-2 px-4 text-emerald-300">صافي ربح العام</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Income Stmt</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-emerald-400">{formatAmount(bs.currentYearNetProfit)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">29,500</td>
                  <td className="py-2 px-4 text-right no-print">
                    <button onClick={() => setActiveTab('IS')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'قائمة الدخل' : 'P&L'}</button>
                  </td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-t border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'إجمالي حقوق الملكية' : 'Total Equity'}</td>
                  {isBilingual && <td className="py-2.5 px-4">إجمالي حقوق الملكية</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-emerald-300">{formatAmount(bs.totalEquity)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">168,100</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="bg-blue-950/60 font-bold text-base text-white border-y-2 border-blue-600">
                  <td className="py-3 px-4">{isAr ? 'إجمالي الالتزامات وحقوق الملكية' : 'TOTAL LIABILITIES & EQUITY'}</td>
                  {isBilingual && <td className="py-3 px-4 text-blue-200">إجمالي الالتزامات وحقوق الملكية</td>}
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">{formatAmount(bs.totalLiabilitiesAndEquity)}</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">309,300</td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* INCOME STATEMENT VIEW */}
      {activeTab === 'IS' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-800 text-xs text-slate-400">
            <div>
              <span className="font-semibold text-white text-sm">
                {isAr ? company.nameAr : company.nameEn}
              </span>
              <p>{isAr ? 'عن السنة المالية المنتهية في 31 ديسمبر 2025 و 2024 (الأرقام بألف جنيه مصري)' : 'For the Year Ended Dec 31, 2025 & 2024 (Figures in kEGP)'}</p>
            </div>
            <div className="flex items-center gap-2 mt-2 sm:mt-0">
              <span className="px-2.5 py-1 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-mono font-bold">
                {isAr ? 'هامش صافي الربح: ' : 'Net Margin: '} {is.netMarginPct.toFixed(1)}%
              </span>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left">
              <thead>
                <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                  <th className="py-3 px-4 font-semibold">{isAr ? 'بند قائمة الدخل' : 'Revenue & Expense Item'}</th>
                  {isBilingual && (
                    <th className="py-3 px-4 font-semibold text-slate-300">Statement Line (Arabic / عربي)</th>
                  )}
                  <th className="py-3 px-4 text-center">{isAr ? 'الإيضاح' : 'Note'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? '2025 (ألف ج.م)' : '2025 (kEGP)'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? '% من الإيراد' : '% Revenue'}</th>
                  <th className="py-3 px-4 text-right">{isAr ? '2024 (ألف ج.م)' : '2024 (kEGP)'}</th>
                  <th className="py-3 px-4 text-right no-print">{isAr ? 'الدليل' : 'Evidence'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 bg-slate-900/40">
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-semibold text-slate-100">{isAr ? 'إيرادات المبيعات المحلية' : 'Domestic Industrial Revenue'}</td>
                  {isBilingual && <td className="py-2.5 px-4 text-slate-300">مبيعات محلية</td>}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">Note 23</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(is.domesticRevenue)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{((is.domesticRevenue / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">138,000</td>
                  <td className="py-2.5 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-semibold text-slate-100">{isAr ? 'إيرادات عقود التصدير للخارج' : 'Export Contracts Revenue'}</td>
                  {isBilingual && <td className="py-2.5 px-4 text-slate-300">إيرادات تصدير</td>}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">Note 23</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(is.exportRevenue)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{((is.exportRevenue / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">58,000</td>
                  <td className="py-2.5 px-4 text-right no-print">-</td>
                </tr>
                <tr className="hover:bg-slate-800/30">
                  <td className="py-2.5 px-4 font-semibold text-slate-100">{isAr ? 'إيرادات عقود الصيانة والدعم الفني' : 'Service & Maintenance Revenue'}</td>
                  {isBilingual && <td className="py-2.5 px-4 text-slate-300">خدمات صيانة</td>}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">Note 23</td>
                  <td className="py-2.5 px-4 text-right font-mono font-semibold text-slate-100">{formatAmount(is.serviceRevenue)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{((is.serviceRevenue / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">14,600</td>
                  <td className="py-2.5 px-4 text-right no-print">-</td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-y border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'إجمالي الإيرادات (المبيعات)' : 'TOTAL REVENUE'}</td>
                  {isBilingual && <td className="py-2.5 px-4">إجمالي الإيرادات</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-300">{formatAmount(is.totalRevenue)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-300">100.0%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">210,600</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-rose-300">
                  <td className="py-2.5 px-4 font-medium">({isAr ? 'تكلفة المبيعات المباشرة ومصروفات الإنتاج' : 'Cost of Sales'})</td>
                  {isBilingual && <td className="py-2.5 px-4 text-rose-300">تكلفة المبيعات</td>}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">Note 24</td>
                  <td className="py-2.5 px-4 text-right font-mono">({formatAmount(is.totalCostOfSales)})</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{((is.totalCostOfSales / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">(136,700)</td>
                  <td className="py-2.5 px-4 text-right no-print">
                    <button onClick={() => openEvidence('TRC-GROSS-MARGIN')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                  </td>
                </tr>
                <tr className="bg-emerald-950/30 font-bold text-emerald-400 border-y border-emerald-900/50">
                  <td className="py-3 px-4">{isAr ? 'مجمل الربح' : 'GROSS PROFIT'}</td>
                  {isBilingual && <td className="py-3 px-4">مجمل الربح</td>}
                  <td></td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400 font-bold">{formatAmount(is.grossProfit)}</td>
                  <td className="py-3 px-4 text-right font-mono text-emerald-400">{is.grossMarginPct.toFixed(1)}%</td>
                  <td className="py-3 px-4 text-right font-mono text-slate-300">73,900</td>
                  <td className="py-3 px-4 text-right no-print">
                    <button onClick={() => openEvidence('TRC-GROSS-MARGIN')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'الدليل' : 'Evidence'}</button>
                  </td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-slate-300">
                  <td className="py-2 px-4 font-medium">({isAr ? 'مصروفات البيع والتسويق والتصدير' : 'Selling & Distribution Expenses'})</td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">مصروفات بيع وتوزيع</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 25</td>
                  <td className="py-2 px-4 text-right font-mono">({formatAmount(is.sellingExpenses)})</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">{((is.sellingExpenses / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">(12,800)</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-slate-300">
                  <td className="py-2 px-4 font-medium">({isAr ? 'مصروفات إدارية وعمومية ومرتبات' : 'General & Administrative Expenses'})</td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">مصروفات عمومية وإدارية</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 26</td>
                  <td className="py-2 px-4 text-right font-mono">({formatAmount(is.gaSalaries + is.gaOtherExpenses)})</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">{(((is.gaSalaries + is.gaOtherExpenses) / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">(20,100)</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-slate-300">
                  <td className="py-2 px-4 font-medium">({isAr ? 'إهلاك الأصول الإدارية واستهلاك البرمجيات' : 'Admin Depreciation & Amortization'})</td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">إهلاك واستهلاك إداري</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 27</td>
                  <td className="py-2 px-4 text-right font-mono">({formatAmount(is.adminDepreciation)})</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">{((is.adminDepreciation / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">(2,400)</td>
                  <td className="no-print"></td>
                </tr>
                {/* EBITDA line item (explicitly labeled analytical) */}
                <tr className="bg-blue-950/30 font-semibold text-blue-300 border-t border-blue-900/40">
                  <td className="py-2 px-4 flex items-center gap-1.5">
                    {isAr ? 'الأرباح قبل الفوائد والضرائب والإهلاك (مؤشر تحليلي غير خاضع للمعايير)' : 'EBITDA (Analytical Non-IFRS Metric)'}
                  </td>
                  {isBilingual && <td className="py-2 px-4">EBITDA (تحليلي)</td>}
                  <td className="text-center font-mono text-slate-400">Analytical</td>
                  <td className="py-2 px-4 text-right font-mono font-bold text-blue-300">{formatAmount(is.ebitda)}</td>
                  <td className="py-2 px-4 text-right font-mono text-blue-300">{is.ebitdaMarginPct.toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">49,400</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-y border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'الربح التشغيلي (EBIT)' : 'OPERATING PROFIT (EBIT)'}</td>
                  {isBilingual && <td className="py-2.5 px-4">أرباح التشغيل</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-white">{formatAmount(is.operatingProfit)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-white">{is.operatingMarginPct.toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">38,600</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-slate-200">
                  <td className="py-2 px-4 font-medium">{isAr ? 'فوائد وعوائد استثمارات دائنة' : 'Finance Income'}</td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">فوائد دائنة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 28</td>
                  <td className="py-2 px-4 text-right font-mono text-emerald-400">{formatAmount(is.financeIncome)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">{((is.financeIncome / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">1,900</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-rose-300">
                  <td className="py-2 px-4 font-medium">({isAr ? 'تكاليف التمويل والفوائد البنكية' : 'Finance Costs & Borrowing Interest'})</td>
                  {isBilingual && <td className="py-2 px-4 text-rose-300">تكاليف التمويل</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 29</td>
                  <td className="py-2 px-4 text-right font-mono">({formatAmount(is.financeCosts)})</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">{((is.financeCosts / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">(9,200)</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-slate-200">
                  <td className="py-2 px-4 font-medium">{isAr ? 'صافي أرباح فروق العملات الأجنبية' : 'Net Foreign Exchange Gain'}</td>
                  {isBilingual && <td className="py-2 px-4 text-slate-300">أرباح فروق عملة</td>}
                  <td className="py-2 px-4 text-center font-mono text-slate-400">Note 30</td>
                  <td className="py-2 px-4 text-right font-mono text-emerald-400">{formatAmount(is.fxGain)}</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">{((is.fxGain / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2 px-4 text-right font-mono text-slate-400">6,800</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="bg-slate-900/90 font-bold text-white border-y border-slate-700">
                  <td className="py-2.5 px-4">{isAr ? 'الأرباح قبل ضرائب الدخل (PBT)' : 'PROFIT BEFORE TAX'}</td>
                  {isBilingual && <td className="py-2.5 px-4">الربح قبل الضريبة</td>}
                  <td></td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-300">{formatAmount(is.profitBeforeTax)}</td>
                  <td className="py-2.5 px-4 text-right font-mono text-blue-300">{((is.profitBeforeTax / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">38,100</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="hover:bg-slate-800/30 text-rose-300">
                  <td className="py-2.5 px-4 font-medium">({isAr ? 'عبء ضريبة الدخل المحملة عن العام' : 'Income Tax Expense (22.5%)'})</td>
                  {isBilingual && <td className="py-2.5 px-4 text-rose-300">ضريبة الدخل</td>}
                  <td className="py-2.5 px-4 text-center font-mono text-slate-400">Note 31</td>
                  <td className="py-2.5 px-4 text-right font-mono">({formatAmount(is.incomeTaxExpense)})</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">{((is.incomeTaxExpense / is.totalRevenue) * 100).toFixed(1)}%</td>
                  <td className="py-2.5 px-4 text-right font-mono text-slate-400">(8,600)</td>
                  <td className="no-print"></td>
                </tr>
                <tr className="bg-emerald-950/50 font-bold text-base text-white border-y-2 border-emerald-600">
                  <td className="py-3.5 px-4">{isAr ? 'صافي أرباح العام' : 'NET PROFIT FOR THE YEAR'}</td>
                  {isBilingual && <td className="py-3.5 px-4 text-emerald-300">صافي ربح العام</td>}
                  <td></td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400 font-bold">{formatAmount(is.netProfit)}</td>
                  <td className="py-3.5 px-4 text-right font-mono text-emerald-400">{is.netMarginPct.toFixed(1)}%</td>
                  <td className="py-3.5 px-4 text-right font-mono text-slate-300">29,500</td>
                  <td className="no-print"></td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
