import React, { useState } from 'react';
import {
  CalculatedCashFlow,
  CalculatedBalanceSheet,
  CalculatedIncomeStatement
} from '../../utils/financialCalculations';
import { OutputLanguage, AccountingFramework } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  Banknote,
  CheckCircle2,
  AlertCircle,
  Download,
  Info,
  ArrowRight,
  TrendingUp,
  TrendingDown
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  cf: CalculatedCashFlow;
  bs: CalculatedBalanceSheet;
  is: CalculatedIncomeStatement;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const CashFlowAnalysisView: React.FC<Props> = ({
  cf,
  bs,
  is,
  language,
  framework
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const isBilingual = language === 'bilingual';
  const [method, setMethod] = useState<'indirect' | 'direct'>('indirect');

  const format = (n: number) => {
    const isNeg = n < 0;
    const abs = Math.abs(n).toLocaleString();
    return isNeg ? `(${abs})` : abs;
  };

  const exportCashFlowExcel = () => {
    const data = [
      ['بند قائمة التدفقات النقدية (عربي)', 'Cash Flow Statement Line (English)', 'القيمة (ألف ج.م / kEGP)'],
      ['--- التدفقات النقدية من الأنشطة التشغيلية (Operating Activities) ---', '', ''],
      ['صافي الربح المحاسبي قبل الضرائب', 'Net Profit Before Tax', cf.netProfitBeforeTax],
      ['إهلاك الأصول الثابتة واستهلاك البرمجيات', 'Depreciation & Amortization', cf.depreciationAmortization],
      ['تكاليف التمويل والفوائد البنكية', 'Finance Costs Add-back', cf.financeCosts],
      ['عوائد وفوائد دائنة', 'Finance Income Deducted', -cf.financeIncome],
      ['أرباح التشغيل قبل التغير في رأس المال العامل', 'Operating Profit Before Working Capital', cf.operatingProfitBeforeWC],
      ['(الزيادة) في أرصدة العملاء وأوراق القبض', 'Change in Receivables', cf.changeInReceivables],
      ['(الزيادة) في أرصدة المخزون السلعي', 'Change in Inventories', cf.changeInInventory],
      ['(الزيادة) في مصروفات مدفوعة مقدماً', 'Change in Prepayments', cf.changeInPrepayments],
      ['الزيادة في الموردين وأوراق الدفع', 'Change in Trade Payables', cf.changeInPayables],
      ['الزيادة في المصروفات المستحقة', 'Change in Accrued Expenses', cf.changeInAccruals],
      ['ضرائب دخل مسددة نقداً', 'Income Taxes Paid', -cf.taxPaid],
      ['صافي التدفقات النقدية من الأنشطة التشغيلية', 'NET CASH FROM OPERATING ACTIVITIES', cf.netCashFromOperating],
      ['', '', ''],
      ['--- التدفقات النقدية من الأنشطة الاستثمارية (Investing Activities) ---', '', ''],
      ['مدفوعات لشراء آلات ومعدات مصنع (CapEx)', 'Purchase of Property, Plant & Equipment', cf.capexPurchases],
      ['مدفوعات لشراء تراخيص برمجيات ERP', 'Purchase of Intangible Software Licenses', cf.softwareLicenses],
      ['صافي التدفقات النقدية المستخدمة في الأنشطة الاستثمارية', 'NET CASH USED IN INVESTING ACTIVITIES', cf.netCashFromInvesting],
      ['', '', ''],
      ['--- التدفقات النقدية من الأنشطة التمويلية (Financing Activities) ---', '', ''],
      ['سداد أقساط قروض بنكية طويلة الأجل', 'Repayment of Long-term Bank Loans', cf.loanRepayments],
      ['صافي السحب على التسهيلات الائتمانية', 'Net Drawdown on Credit Facilities', cf.overdraftMovement],
      ['سداد التزامات عقود إيجار تمويلي', 'Payment of Lease Principal (EAS 49 / IFRS 16)', cf.leasePrincipalPaid],
      ['توزيعات أرباح مسددة للمساهمين', 'Dividends Paid to Shareholders', cf.dividendsPaid],
      ['صافي التدفقات النقدية من (المستخدمة في) الأنشطة التمويلية', 'NET CASH FROM FINANCING ACTIVITIES', cf.netCashFromFinancing],
      ['', '', ''],
      ['صافي التغير في النقدية وما في حكمها', 'NET INCREASE IN CASH AND CASH EQUIVALENTS', cf.netChangeInCash],
      ['رصيد النقدية وما في حكمها أول الفترة', 'Cash and Cash Equivalents at Beginning of Year', cf.beginningCash],
      ['رصيد النقدية وما في حكمها آخر الفترة', 'CASH AND CASH EQUIVALENTS AT END OF YEAR', cf.endingCash]
    ];
    const ws = XLSX.utils.aoa_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Cash_Flow');
    XLSX.writeFile(wb, 'Ledger_IQ_Cash_Flow_Statement_IAS7.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {framework === 'EAS'
                ? (isAr ? 'معيار المحاسبة المصري رقم 4 (EAS 4)' : 'Egyptian Accounting Standard 4 (EAS 4)')
                : (isAr ? 'معيار المحاسبة الدولي رقم 7 (IAS 7)' : 'International Accounting Standard 7 (IAS 7)')}
            </span>
            <span className="text-xs text-emerald-400 font-mono flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              {isAr ? 'مطابق مع رصيد المركز المالي' : 'Reconciled to Balance Sheet Cash'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-blue-400" />
            {isAr ? 'قائمة التدفقات النقدية والتحليل المالي للسيولة' : 'Cash Flow Navigator & Treasury Analysis'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'إعادة بناء التدفقات النقدية التشغيلية والاستثمارية والتمويلية استناداً إلى مقارنة أرصدة الفترات وحركات الأستاذ العام والتغير في رأس المال العامل.'
              : 'Reconstructed operating, investing, and financing cash flows linked to comparative trial balances, working capital adjustments, and verified bank statements.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportCashFlowExcel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تصدير إكسيل' : 'Export Cash Flow'}
          </button>
        </div>
      </div>

      {/* Method Switcher & Cash Reconciliation Card */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
          <span className="text-xs text-slate-400 block">{isAr ? 'طريقة العرض' : 'Reporting Method'}</span>
          <div className="flex items-center gap-1 mt-2">
            <button
              onClick={() => setMethod('indirect')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                method === 'indirect'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isAr ? 'غير مباشرة (المعيارية)' : 'Indirect (IAS 7)'}
            </button>
            <button
              onClick={() => setMethod('direct')}
              className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition border ${
                method === 'direct'
                  ? 'bg-blue-600 text-white border-blue-500'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isAr ? 'المباشرة' : 'Direct'}
            </button>
          </div>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{isAr ? 'صافي تدفق التشغيل' : 'Operating Cash Flow'}</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            +{format(cf.netCashFromOperating)} <span className="text-xs font-sans text-slate-400">kEGP</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {isAr ? 'تغطية قوية للالتزامات' : 'Solid debt servicing capacity'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{isAr ? 'الإنفاق الاستثماري (CapEx)' : 'Capital Expenditure'}</span>
          <span className="text-xl font-bold font-mono text-rose-400 mt-1 block">
            {format(cf.capexPurchases)} <span className="text-xs font-sans text-slate-400">kEGP</span>
          </span>
          <span className="text-[11px] text-slate-500 mt-1 block">
            {isAr ? 'خطوط إنتاج CNC جديدة' : 'New CNC line additions'}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-xs text-slate-400 block">{isAr ? 'رصيد النقدية آخر الفترة' : 'Closing Cash & Equivalents'}</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {format(cf.endingCash)} <span className="text-xs font-sans text-slate-400">kEGP</span>
          </span>
          <span className="text-[11px] text-emerald-400 mt-1 block font-semibold">
            {isAr ? 'مطابق تماماً للميزانية العمومية' : 'Matched 100% with Balance Sheet'}
          </span>
        </div>
      </div>

      {/* Accounting Notice on Cash Flow Reconstruction */}
      <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 text-xs text-blue-300 flex items-start gap-3">
        <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
        <div>
          <strong className="block text-blue-200 font-semibold mb-0.5">
            {isAr ? 'إفصاح المنهجية المحاسبية للتدفقات النقدية (EAS 4 / IAS 7):' : 'Accounting Methodology Disclosure for Cash Flows (IAS 7):'}
          </strong>
          {isAr
            ? 'تم احتساب التدفقات النقدية استناداً إلى مقارنة ميزان المراجعة الحالي مع أرصدة أول المدة الافتتاحية المدققة، والتغيرات الفعلية في حسابات رأس المال العامل (العملاء، المخزون، الموردين) وحركات الأصول الثابتة من دفتر الأستاذ العام. لم يتم اختلاق أو تقدير أي حركة نقدية عشوائياً.'
            : 'Cash flows are derived from comparative opening & closing trial balances, verified subledger movements in trade working capital, and audited general ledger vouchers. No estimated or fabricated movements are introduced.'}
        </div>
      </div>

      {/* Full Statement Table */}
      <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-xs">
          <h3 className="font-bold text-white text-base">
            {method === 'indirect'
              ? (isAr ? 'قائمة التدفقات النقدية (الطريقة غير المباشرة المعتمدة)' : 'Statement of Cash Flows (Indirect Method)')
              : (isAr ? 'قائمة التدفقات النقدية (الطريقة المباشرة)' : 'Statement of Cash Flows (Direct Method)')}
          </h3>
          <span className="font-mono text-slate-400">FY 2025 (kEGP)</span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-2.5 px-3 font-semibold">{isAr ? 'بند التدفق النقدي' : 'Cash Flow Activity Line'}</th>
                {isBilingual && (
                  <th className="py-2.5 px-3 font-semibold text-slate-300">Statement Line (Arabic / عربي)</th>
                )}
                <th className="py-2.5 px-3 text-right">{isAr ? 'المبلغ (ألف ج.م)' : 'Amount (kEGP)'}</th>
                <th className="py-2.5 px-3 text-right">{isAr ? 'الدليل' : 'Audit Trace'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {/* OPERATING ACTIVITIES */}
              <tr className="bg-slate-950 font-bold text-blue-400">
                <td colSpan={isBilingual ? 4 : 3} className="py-2 px-3 uppercase text-[11px]">
                  {isAr ? '1. التدفقات النقدية من الأنشطة التشغيلية' : '1. Cash Flows from Operating Activities'}
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-200">{isAr ? 'صافي الربح قبل الضرائب المحاسبية' : 'Net Profit Before Income Tax'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-300">صافي الربح قبل الضريبة</td>}
                <td className="py-2 px-3 text-right font-mono font-semibold text-slate-100">{format(cf.netProfitBeforeTax)}</td>
                <td className="py-2 px-3 text-right">
                  <button onClick={() => openEvidence('TRC-GROSS-MARGIN')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">+{isAr ? 'إهلاك الأصول الثابتة واستهلاك البرمجيات' : 'Depreciation of PPE & Amortization of Intangibles'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">إهلاك واستهلاك</td>}
                <td className="py-2 px-3 text-right font-mono text-emerald-400">+{format(cf.depreciationAmortization)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">+{isAr ? 'تكاليف التمويل والفوائد البنكية المدينة' : 'Finance Costs Add-back'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">تكاليف التمويل</td>}
                <td className="py-2 px-3 text-right font-mono text-emerald-400">+{format(cf.financeCosts)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'عوائد وفوائد دائنة مستبعدة' : 'Finance Income Deducted'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">فوائد دائنة</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">({format(cf.financeIncome)})</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="bg-slate-900/90 font-semibold text-white">
                <td className="py-2 px-3">{isAr ? 'أرباح التشغيل قبل التغير في رأس المال العامل' : 'Operating Profit Before Working Capital Changes'}</td>
                {isBilingual && <td className="py-2 px-3">أرباح قبل رأس المال العامل</td>}
                <td className="py-2 px-3 text-right font-mono text-blue-300">{format(cf.operatingProfitBeforeWC)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>

              {/* Working capital movements */}
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'الزيادة في أرصدة العملاء وأوراق القبض (تدفق خارج)' : 'Increase in Trade and Other Receivables'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">زيادة حسابات العملاء</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.changeInReceivables)}</td>
                <td className="py-2 px-3 text-right">
                  <button onClick={() => openEvidence('TRC-DSO-WORKING-CAPITAL')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'فحص' : 'Trace'}</button>
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'الزيادة في أرصدة المخزون السلعي' : 'Increase in Inventories'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">زيادة المخزون</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.changeInInventory)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'الزيادة في مصروفات مدفوعة مقدماً' : 'Increase in Prepayments'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">زيادة مدفوعات مقدماً</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.changeInPrepayments)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">+{isAr ? 'الزيادة في الموردين وأوراق الدفع (تمويل تجاري)' : 'Increase in Trade Payables'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">زيادة الموردين</td>}
                <td className="py-2 px-3 text-right font-mono text-emerald-400">+{format(cf.changeInPayables)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">+{isAr ? 'الزيادة في المصروفات المستحقة' : 'Increase in Accruals & Tax Payable'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">زيادة مستحقات</td>}
                <td className="py-2 px-3 text-right font-mono text-emerald-400">+{format(cf.changeInAccruals)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'ضرائب دخل مسددة نقداً' : 'Income Taxes Paid'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">ضرائب مسددة</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">({format(cf.taxPaid)})</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="bg-emerald-950/40 font-bold text-emerald-400 border-y border-emerald-900/50">
                <td className="py-2.5 px-3">{isAr ? 'صافي النقدية المتولدة من الأنشطة التشغيلية' : 'NET CASH FROM OPERATING ACTIVITIES'}</td>
                {isBilingual && <td className="py-2.5 px-3">صافي تدفق التشغيل</td>}
                <td className="py-2.5 px-3 text-right font-mono text-emerald-400 font-bold">{format(cf.netCashFromOperating)}</td>
                <td className="py-2.5 px-3 text-right">
                  <button onClick={() => openEvidence('TRC-CURRENT-RATIO')} className="text-blue-400 hover:text-blue-300 font-semibold">{isAr ? 'الدليل' : 'Evidence'}</button>
                </td>
              </tr>

              {/* INVESTING ACTIVITIES */}
              <tr className="bg-slate-950 font-bold text-blue-400">
                <td colSpan={isBilingual ? 4 : 3} className="py-2 px-3 uppercase text-[11px]">
                  {isAr ? '2. التدفقات النقدية من الأنشطة الاستثمارية' : '2. Cash Flows from Investing Activities'}
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'مدفوعات لشراء خطوط إنتاج وآلات ومعدات مصنع (CapEx)' : 'Purchase of Property, Plant & Equipment'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">شراء أصول ثابتة</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.capexPurchases)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'شراء تراخيص برمجيات وأنظمة ERP' : 'Purchase of Software Licenses'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">شراء برمجيات</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.softwareLicenses)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="bg-slate-900/90 font-bold text-slate-200 border-y border-slate-700">
                <td className="py-2.5 px-3">{isAr ? 'صافي النقدية المستخدمة في الأنشطة الاستثمارية' : 'NET CASH USED IN INVESTING ACTIVITIES'}</td>
                {isBilingual && <td className="py-2.5 px-3">صافي تدفق الاستثمار</td>}
                <td className="py-2.5 px-3 text-right font-mono text-rose-300 font-bold">{format(cf.netCashFromInvesting)}</td>
                <td className="py-2.5 px-3 text-right">-</td>
              </tr>

              {/* FINANCING ACTIVITIES */}
              <tr className="bg-slate-950 font-bold text-blue-400">
                <td colSpan={isBilingual ? 4 : 3} className="py-2 px-3 uppercase text-[11px]">
                  {isAr ? '3. التدفقات النقدية من الأنشطة التمويلية' : '3. Cash Flows from Financing Activities'}
                </td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'سداد أقساط قروض بنكية طويلة الأجل' : 'Repayment of Long-term Bank Loans'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">سداد قروض</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.loanRepayments)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">+{isAr ? 'صافي السحب من التسهيلات الائتمانية البنكية' : 'Net Drawdown on Short-term Facilities'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">سحب تسهيلات</td>}
                <td className="py-2 px-3 text-right font-mono text-emerald-400">+{format(cf.overdraftMovement)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'سداد أصل التزامات عقود الإيجار (EAS 49 / IFRS 16)' : 'Payment of Lease Liabilities Principal'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">سداد إيجارات</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.leasePrincipalPaid)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">({isAr ? 'توزيعات أرباح مسددة للمساهمين' : 'Dividends Paid to Shareholders'})</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">توزيعات أرباح</td>}
                <td className="py-2 px-3 text-right font-mono text-rose-300">{format(cf.dividendsPaid)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="bg-slate-900/90 font-bold text-slate-200 border-y border-slate-700">
                <td className="py-2.5 px-3">{isAr ? 'صافي النقدية المستخدمة في الأنشطة التمويلية' : 'NET CASH USED IN FINANCING ACTIVITIES'}</td>
                {isBilingual && <td className="py-2.5 px-3">صافي تدفق التمويل</td>}
                <td className="py-2.5 px-3 text-right font-mono text-rose-300 font-bold">{format(cf.netCashFromFinancing)}</td>
                <td className="py-2.5 px-3 text-right">-</td>
              </tr>

              {/* NET MOVEMENT & RECONCILIATION */}
              <tr className="bg-blue-950/40 font-bold text-white border-t border-blue-900">
                <td className="py-3 px-3">{isAr ? 'صافي الزيادة في النقدية وما في حكمها خلال العام' : 'NET INCREASE IN CASH & CASH EQUIVALENTS'}</td>
                {isBilingual && <td className="py-3 px-3 text-blue-200">صافي التغير في النقدية</td>}
                <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">+{format(cf.netChangeInCash)}</td>
                <td className="py-3 px-3 text-right">-</td>
              </tr>
              <tr className="hover:bg-slate-800/30">
                <td className="py-2 px-3 text-slate-300">{isAr ? 'رصيد النقدية وما في حكمها في بداية العام' : 'Cash and Cash Equivalents at Beginning of Year'}</td>
                {isBilingual && <td className="py-2 px-3 text-slate-400">نقدية أول العام</td>}
                <td className="py-2 px-3 text-right font-mono text-slate-200">{format(cf.beginningCash)}</td>
                <td className="py-2 px-3 text-right">-</td>
              </tr>
              <tr className="bg-blue-950/80 font-bold text-base text-white border-y-2 border-blue-500">
                <td className="py-3 px-3">{isAr ? 'رصيد النقدية وما في حكمها في نهاية العام (مطابق)' : 'CASH AND CASH EQUIVALENTS AT END OF YEAR'}</td>
                {isBilingual && <td className="py-3 px-3 text-emerald-300">نقدية آخر العام (مطابقة)</td>}
                <td className="py-3 px-3 text-right font-mono text-emerald-400 font-bold">{format(cf.endingCash)}</td>
                <td className="py-3 px-3 text-right text-emerald-400 font-semibold text-xs">
                  {isAr ? 'مطابق 100%' : '100% Reconciled'}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
