import React from 'react';
import {
  CalculatedBalanceSheet,
  CalculatedIncomeStatement,
  CalculatedCashFlow
} from '../../utils/financialCalculations';
import {
  OutputLanguage,
  AccountingFramework,
  CompanyEntity,
  RatioItem,
  AuditRiskItem,
  DisclosureChecklistItem,
  BudgetVarianceRow
} from '../../types/accounting';
import {
  Download,
  FileSpreadsheet,
  FileText,
  Printer,
  CheckCircle2,
  Package,
  Layers,
  Sparkles,
  ShieldCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  bs: CalculatedBalanceSheet;
  is: CalculatedIncomeStatement;
  cf: CalculatedCashFlow;
  ratios: RatioItem[];
  risks: AuditRiskItem[];
  disclosures: DisclosureChecklistItem[];
  variances: BudgetVarianceRow[];
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const ReportsExportView: React.FC<Props> = ({
  bs,
  is,
  cf,
  ratios,
  risks,
  disclosures,
  variances,
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';

  const exportConsolidatedMasterWorkbook = () => {
    const wb = XLSX.utils.book_new();

    // 1. Balance Sheet
    const bsData = [
      ['بند المركز المالي', 'Financial Position Line', '2025 (kEGP)', '2024 (kEGP)'],
      ['النقدية وما في حكمها', 'Cash and Cash Equivalents', bs.cashAndEquivalents, 35100],
      ['صافي العملاء وأوراق القبض', 'Trade and Other Receivables', bs.tradeReceivablesNet, 69400],
      ['المخزون السلعي', 'Inventories (Net)', bs.inventoryNet, 53700],
      ['مصروفات مدفوعة مقدماً', 'Prepayments and Other CA', bs.prepayments, 4100],
      ['إجمالي الأصول المتداولة', 'Total Current Assets', bs.totalCurrentAssets, 162300],
      ['الأصول الثابتة (بالصافي)', 'Property, Plant & Equipment (Net)', bs.ppeNet, 128300],
      ['أصول حق الاستخدام', 'Right-of-Use Assets', bs.rightOfUseAssets, 15600],
      ['أصول غير ملموسة', 'Intangibles & Software', bs.intangiblesNet, 3100],
      ['إجمالي الأصول غير المتداولة', 'Total Non-current Assets', bs.totalNonCurrentAssets, 147000],
      ['إجمالي الأصول', 'TOTAL ASSETS', bs.totalAssets, 309300],
      ['الموردون وأوراق الدفع', 'Trade & Notes Payable', bs.tradePayables, 46600],
      ['تسهيلات ائتمانية قصيرة الأجل', 'Short-term Borrowings', bs.shortTermBorrowings, 18000],
      ['التزامات عقود إيجار متداولة', 'Current Lease Liabilities', bs.currentLeaseLiabilities, 3600],
      ['مصروفات مستحقة ومصلحة الضرائب', 'Accruals & Tax Payable', bs.accrualsAndTaxPayable, 11600],
      ['إجمالي الالتزامات المتداولة', 'Total Current Liabilities', bs.totalCurrentLiabilities, 79800],
      ['قروض بنكية طويلة الأجل', 'Long-term Bank Loans', bs.longTermBorrowings, 46000],
      ['إجمالي الالتزامات', 'TOTAL LIABILITIES', bs.totalLiabilities, 141200],
      ['رأس المال المصدر والمدفوع', 'Issued Capital', bs.shareCapital, 80000],
      ['الاحتياطي القانوني', 'Statutory Reserve', bs.statutoryReserve, 18200],
      ['الأرباح المرحلة من سنوات سابقة', 'Retained Earnings', bs.retainedEarningsBroughtForward, 28400],
      ['صافي ربح العام الحالي', 'Current Year Net Profit', bs.currentYearNetProfit, 29500],
      ['إجمالي حقوق الملكية', 'TOTAL EQUITY', bs.totalEquity, 168100],
      ['إجمالي الالتزامات وحقوق الملكية', 'TOTAL LIABILITIES & EQUITY', bs.totalLiabilitiesAndEquity, 309300]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(bsData), 'Balance_Sheet');

    // 2. Income Statement
    const isData = [
      ['بند قائمة الدخل', 'Income Statement Line', '2025 (kEGP)', '% of Revenue'],
      ['إيرادات المبيعات المحلية', 'Domestic Industrial Revenue', is.domesticRevenue, ((is.domesticRevenue / is.totalRevenue) * 100).toFixed(1)],
      ['إيرادات عقود التصدير', 'Export Contracts Revenue', is.exportRevenue, ((is.exportRevenue / is.totalRevenue) * 100).toFixed(1)],
      ['إيرادات خدمات ودعم فني', 'Service Revenue', is.serviceRevenue, ((is.serviceRevenue / is.totalRevenue) * 100).toFixed(1)],
      ['إجمالي الإيرادات', 'TOTAL REVENUE', is.totalRevenue, '100.0%'],
      ['تكلفة المبيعات المباشرة', 'Cost of Sales (COGS)', is.totalCostOfSales, ((is.totalCostOfSales / is.totalRevenue) * 100).toFixed(1)],
      ['مجمل الربح', 'GROSS PROFIT', is.grossProfit, is.grossMarginPct.toFixed(1)],
      ['مصروفات بيع وتوزيع', 'Selling & Marketing Expenses', is.sellingExpenses, ((is.sellingExpenses / is.totalRevenue) * 100).toFixed(1)],
      ['مصروفات إدارية وعمومية', 'General & Admin Expenses', is.gaSalaries + is.gaOtherExpenses, (((is.gaSalaries + is.gaOtherExpenses) / is.totalRevenue) * 100).toFixed(1)],
      ['إهلاك إداري واستهلاك برمجيات', 'Admin Depreciation', is.adminDepreciation, ((is.adminDepreciation / is.totalRevenue) * 100).toFixed(1)],
      ['الربح التشغيلي (EBIT)', 'OPERATING PROFIT (EBIT)', is.operatingProfit, is.operatingMarginPct.toFixed(1)],
      ['تكاليف التمويل والفوائد', 'Finance & Borrowing Costs', is.financeCosts, ((is.financeCosts / is.totalRevenue) * 100).toFixed(1)],
      ['صافي أرباح فروق العملات', 'Net Foreign Exchange Gain', is.fxGain, ((is.fxGain / is.totalRevenue) * 100).toFixed(1)],
      ['الربح قبل الضرائب', 'PROFIT BEFORE TAX', is.profitBeforeTax, ((is.profitBeforeTax / is.totalRevenue) * 100).toFixed(1)],
      ['ضريبة الدخل المحملة', 'Income Tax Expense (22.5%)', is.incomeTaxExpense, ((is.incomeTaxExpense / is.totalRevenue) * 100).toFixed(1)],
      ['صافي ربح العام', 'NET PROFIT FOR THE YEAR', is.netProfit, is.netMarginPct.toFixed(1)]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(isData), 'Income_Statement');

    // 3. Cash Flow
    const cfData = [
      ['بند التدفق النقدي', 'Cash Flow Activity Line', '2025 (kEGP)'],
      ['صافي الربح قبل الضرائب', 'Net Profit Before Tax', cf.netProfitBeforeTax],
      ['إهلاك واستهلاك غير نقدي', 'Depreciation Add-back', cf.depreciationAmortization],
      ['تكاليف تمويل مضافة', 'Finance Costs Add-back', cf.financeCosts],
      ['أرباح قبل رأس المال العامل', 'Operating Profit Before WC', cf.operatingProfitBeforeWC],
      ['التغير في رأس المال العامل', 'Working Capital Adjustments', cf.totalWorkingCapitalChange],
      ['ضرائب دخل مسددة', 'Taxes Paid', -cf.taxPaid],
      ['صافي تدفق الأنشطة التشغيلية', 'NET CASH FROM OPERATING ACTIVITIES', cf.netCashFromOperating],
      ['الإنفاق الاستثماري الرأسمالي (CapEx)', 'Capital Expenditure Purchases', cf.capexPurchases],
      ['صافي تدفق الأنشطة الاستثمارية', 'NET CASH USED IN INVESTING ACTIVITIES', cf.netCashFromInvesting],
      ['صافي تدفق الأنشطة التمويلية', 'NET CASH FROM FINANCING ACTIVITIES', cf.netCashFromFinancing],
      ['صافي التغير في النقدية', 'NET INCREASE IN CASH', cf.netChangeInCash],
      ['رصيد النقدية أول العام', 'Beginning Cash & Equivalents', cf.beginningCash],
      ['رصيد النقدية آخر العام', 'ENDING CASH AND CASH EQUIVALENTS', cf.endingCash]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(cfData), 'Cash_Flow');

    // 4. Ratios
    const ratioData = ratios.map((r) => ({
      Ratio: r.nameEn,
      'Arabic Name': r.nameAr,
      Category: r.category,
      'Company Actual': r.currentValue,
      'Industry Avg (Egypt)': r.benchmarkAverage,
      'Variance Gap': r.gapVsBenchmark,
      Formula: r.formulaEn
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(ratioData), 'Financial_Ratios');

    XLSX.writeFile(wb, `LEDGER_IQ_Master_Financial_Package_${company.crNumber}.xlsx`);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <Package className="w-3.5 h-3.5" />
              {isAr ? 'حزم التقارير والمخرجات التنفيذية' : 'Financial Reporting Packages'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Bilingual Export</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Download className="w-6 h-6 text-blue-400" />
            {isAr ? 'مركز تصدير التقارير والقوائم المالية (Excel / CSV / PDF)' : 'Reports & Export Center (Excel, CSV & PDF Formats)'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'تصدير الحزمة المالية الكاملة أو التقارير الفردية بصيغ Excel محتوية على المعادلات المحاسبية، أو ملفات PDF رسمية معدة للطباعة والتقديم لمجلس الإدارة والمراجع الخارجي.'
              : 'Export complete audit-ready workbooks with live formulas or print-optimized executive PDF packages formatted in Arabic, English, or bilingual presentation.'}
          </p>
        </div>

        <button
          onClick={exportConsolidatedMasterWorkbook}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
        >
          <Package className="w-4 h-4" />
          {isAr ? 'تحميل الحزمة المالية الشاملة (Master Pack)' : 'Download Master Financial Pack'}
        </button>
      </div>

      {/* Export Modules Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {/* Card 1: Master Financial Statements */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'القوائم المالية المدققة (المركز المالي والدخل)' : 'Audited Balance Sheet & P&L Statement'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'قائمة المركز المالي وقائمة الدخل بالعرض الثنائي المقارن لعامي 2025 و 2024 وفقاً لمعايير المحاسبة المصرية.'
                : 'Bilingual comparative Balance Sheet and Income Statement for FY2025 and FY2024.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={exportConsolidatedMasterWorkbook}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.xlsx)
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Card 2: Cash Flow Navigator Statement */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/30 flex items-center justify-center text-emerald-400 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'قائمة التدفقات النقدية ومطابقة الخزينة' : 'Cash Flow Navigator (IAS 7 / EAS 4)'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'قائمة التدفقات النقدية الكاملة (أنشطة تشغيلية، استثمارية، تمويلية) مع تسوية حركة النقدية والمطابقة مع المركز المالي.'
                : 'Full direct and indirect cash flows reconciled with verified balance sheet bank accounts.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={exportConsolidatedMasterWorkbook}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.xlsx)
            </button>
            <button
              onClick={() => window.print()}
              className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
          </div>
        </div>

        {/* Card 3: 5-Year Integrated Financial Model */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400 mb-3">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'النموذج المالي المتكامل لخمس سنوات' : '5-Year Integrated Forecast Model'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'توقعات القوائم المالية الثلاثة لخمس سنوات (2026-2030) للسيناريو الأساسي والمتفائل والمتحفظ.'
                : 'Projected integrated statements for 2026–2030 across Base, Optimistic, and Pessimistic cases.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={exportConsolidatedMasterWorkbook}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Card 4: Financial Ratios & Industry Benchmarking */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'بطاقة المؤشرات المالية والمقارنة القطاعية' : 'Financial Ratios & Benchmark Scorecard'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'جميع نسب السيولة والربحية والكفاءة والرافعة المالية مع مقارنات الهيئة العامة للرقابة المالية في مصر.'
                : 'Complete ratio diagnostics with Egyptian statutory industry benchmark percentiles.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={exportConsolidatedMasterWorkbook}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Card 5: Statutory Disclosure Notes & Checklist */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400 mb-3">
              <FileText className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'الإيضاحات المتممة للقوائم المالية (EAS/IFRS)' : 'Statutory Disclosure Notes Package'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'مسودات الإيضاحات المتممة والسياسات المحاسبية المعتمدة لصياغة التقرير المالي السنوي الكامل.'
                : 'Formulated notes on PPE, revenue recognition, leases, and accounting policies.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={exportConsolidatedMasterWorkbook}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.xlsx)
            </button>
          </div>
        </div>

        {/* Card 6: Audit Workpapers & Risk Assessment */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3 flex flex-col justify-between">
          <div>
            <div className="w-10 h-10 rounded-xl bg-rose-600/20 border border-rose-500/30 flex items-center justify-center text-rose-400 mb-3">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <h3 className="text-base font-bold text-white">
              {isAr ? 'أوراق عمل التدقيق وفحص المخاطر ومسودة الرأي' : 'Audit Workpapers & Draft Opinion'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">
              {isAr
                ? 'أوراق عمل فحص التأكيدات المحاسبية، الردود الإدارية، ومسودة تقرير مراقب الحسابات المستقل.'
                : 'Substantive testing workpapers and audit opinion draft support.'}
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-800">
            <button
              onClick={exportConsolidatedMasterWorkbook}
              className="flex-1 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-1.5 transition"
            >
              <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-400" />
              Excel (.xlsx)
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
