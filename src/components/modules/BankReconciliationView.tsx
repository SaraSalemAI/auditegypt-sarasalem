import React, { useState, useMemo } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import {
  Banknote,
  CheckCircle2,
  AlertTriangle,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Download,
  Building2,
  FileCheck2,
  Layers,
  ArrowUpDown,
  Search,
  Check,
  Plus
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface LedgerLine {
  id: string;
  date: string;
  ref: string;
  descriptionEn: string;
  descriptionAr: string;
  amount: number; // positive = inflow/debit, negative = outflow/credit
  matched: boolean;
  matchId?: string;
}

interface BankStatementLine {
  id: string;
  date: string;
  description: string;
  amount: number; // positive = deposit, negative = withdrawal
  matched: boolean;
  matchId?: string;
  categorySuggestion?: string;
}

interface AIAdjustmentRecommendation {
  id: string;
  bankLineId: string;
  titleEn: string;
  titleAr: string;
  reasonEn: string;
  reasonAr: string;
  confidence: number;
  debitAccountCode: string;
  debitAccountName: string;
  creditAccountCode: string;
  creditAccountName: string;
  amount: number;
  applied: boolean;
}

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const BankReconciliationView: React.FC<Props> = ({
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';

  const [selectedBank, setSelectedBank] = useState<'NBE' | 'CIB'>('NBE');

  // Ledger Lines State
  const [ledgerLines, setLedgerLines] = useState<LedgerLine[]>([
    { id: 'GL-101', date: '2025-12-05', ref: 'CR-9041', descriptionEn: 'El Sewedy Electric - Client Transfer', descriptionAr: 'تحويل عميل - السويدي إليكتريك', amount: 4800, matched: true, matchId: 'BNK-201' },
    { id: 'GL-102', date: '2025-12-10', ref: 'PV-8812', descriptionEn: 'Delta Steel Mills - Raw Materials', descriptionAr: 'سداد مورد - مصانع الدلتا للصلب', amount: -6500, matched: true, matchId: 'BNK-202' },
    { id: 'GL-103', date: '2025-12-18', ref: 'CR-9055', descriptionEn: 'Arab Contractors - Advance Payment', descriptionAr: 'دفعة مقدمة - المقاولون العرب', amount: 15200, matched: true, matchId: 'BNK-203' },
    { id: 'GL-104', date: '2025-12-24', ref: 'PV-8890', descriptionEn: 'Petroleum Gases Co - Energy Fuel', descriptionAr: 'سداد - شركة غازات البترول', amount: -3100, matched: true, matchId: 'BNK-204' },
    { id: 'GL-105', date: '2025-12-28', ref: 'PV-8921', descriptionEn: 'Egyptian Copper Co - Check #44912', descriptionAr: 'شيك رقم 44912 - النحاس المصرية', amount: -2850, matched: false }, // Outstanding Check
    { id: 'GL-106', date: '2025-12-30', ref: 'CR-9080', descriptionEn: 'Deposit in Transit - Branch Sales', descriptionAr: 'إيداع بالطريق - مبيعات فرع العاشر', amount: 3450, matched: false } // Deposit in transit
  ]);

  // Bank Statement Lines State
  const [bankLines, setBankLines] = useState<BankStatementLine[]>([
    { id: 'BNK-201', date: '2025-12-05', description: 'CREDIT TRANSFER: EL SEWEDY ELECT', amount: 4800, matched: true, matchId: 'GL-101' },
    { id: 'BNK-202', date: '2025-12-11', description: 'DEBIT CLEARING: DELTA STEEL MILLS', amount: -6500, matched: true, matchId: 'GL-102' },
    { id: 'BNK-203', date: '2025-12-18', description: 'INWARD REMITTANCE: ARAB CONTRACTORS', amount: 15200, matched: true, matchId: 'GL-103' },
    { id: 'BNK-204', date: '2025-12-24', description: 'UTILITY DEBIT: PETROGAS CO', amount: -3100, matched: true, matchId: 'GL-104' },
    { id: 'BNK-205', date: '2025-12-29', description: 'BANK SERVICE CHARGE & SWIFT COMM', amount: -180, matched: false, categorySuggestion: 'Bank Charges' },
    { id: 'BNK-206', date: '2025-12-30', description: 'DIRECT CREDIT: GIZA CABLE MFG (LESS 3% WHT)', amount: 8245, matched: false, categorySuggestion: 'Client Collection with WHT' },
    { id: 'BNK-207', date: '2025-12-31', description: 'CREDIT INTEREST: OVERNIGHT REPO SWEEP', amount: 335, matched: false, categorySuggestion: 'Finance Income' }
  ]);

  // AI Recommended Adjustments
  const [recommendations, setRecommendations] = useState<AIAdjustmentRecommendation[]>([
    {
      id: 'REC-ADJ-1',
      bankLineId: 'BNK-205',
      titleEn: 'Post Unrecorded Monthly Bank Charges',
      titleAr: 'إثبات مصاريف وعمولات بنكية دورية غير مسجلة',
      reasonEn: 'Detected monthly automated SWIFT and account maintenance fees charged directly by NBE.',
      reasonAr: 'عمولات تحويل ومصاريف فتح اعتمادات دورية مخصومة من كشف البنك مباشرة بمبلغ 180 ألف ج.م.',
      confidence: 0.99,
      debitAccountCode: '6180',
      debitAccountName: 'Bank Charges & Commission Expense',
      creditAccountCode: '1020',
      creditAccountName: 'NBE Operating EGP Account',
      amount: 180,
      applied: false
    },
    {
      id: 'REC-ADJ-2',
      bankLineId: 'BNK-206',
      titleEn: 'Recognize Client Collection with 3% WHT Deducted',
      titleAr: 'إثبات تحصيل عميل مع استقطاع 3% ضريبة خصم وتحصيل',
      reasonEn: 'Client Giza Cable deposited net 8,245 kEGP. Historical contract matches 8,500 kEGP invoice with 3% (255 kEGP) Art. 59 WHT withheld.',
      reasonAr: 'العميل شركة جيزة للكابلات أودع 8,245 ألف ج.م بعد خصم 3% ضريبة خصم وتحصيل (255 ألف ج.م) المسددة لمصلحة الضرائب.',
      confidence: 0.96,
      debitAccountCode: '1020',
      debitAccountName: 'NBE Operating EGP Account (8,245k) & Prepaid WHT 1240 (255k)',
      creditAccountCode: '1110',
      creditAccountName: 'Accounts Receivable - Trade Clients (8,500k)',
      amount: 8245,
      applied: false
    },
    {
      id: 'REC-ADJ-3',
      bankLineId: 'BNK-207',
      titleEn: 'Accrue Overnight Treasury Yield & Repo Interest',
      titleAr: 'إثبات عائد أذون الخزانة وإيداعات ليلة واحدة (REPO)',
      reasonEn: 'Automatic overnight treasury sweep interest credited by National Bank of Egypt Treasury desk.',
      reasonAr: 'عوائد استثمار وإيداعات ليلة واحدة معتمدة من إدارة الخزانة بالبنك الأهلي المصري بمبلغ 335 ألف ج.م.',
      confidence: 0.98,
      debitAccountCode: '1020',
      debitAccountName: 'NBE Operating EGP Account',
      creditAccountCode: '7120',
      creditAccountName: 'Finance & Interest Income',
      amount: 335,
      applied: false
    }
  ]);

  // Balances
  const glStartingBalance = 26400; // kEGP (matches TB ACC-1020)
  const bankStartingBalance = 25950; // kEGP from bank statement

  // Outstanding amounts
  const outstandingChecks = ledgerLines.filter(l => !l.matched && l.amount < 0).reduce((sum, l) => sum + Math.abs(l.amount), 0);
  const depositsInTransit = ledgerLines.filter(l => !l.matched && l.amount > 0).reduce((sum, l) => sum + l.amount, 0);

  // Unrecorded bank items
  const unrecordedBankCredits = bankLines.filter(b => !b.matched && b.amount > 0).reduce((sum, b) => sum + b.amount, 0);
  const unrecordedBankDebits = bankLines.filter(b => !b.matched && b.amount < 0).reduce((sum, b) => sum + Math.abs(b.amount), 0);

  // Adjusted Balances
  const adjustedBankBalance = bankStartingBalance + depositsInTransit - outstandingChecks;
  const appliedAdjustmentsNet = recommendations
    .filter(r => r.applied)
    .reduce((sum, r) => sum + (r.bankLineId === 'BNK-205' ? -r.amount : r.amount), 0);
  const adjustedGLBalance = glStartingBalance + unrecordedBankCredits - unrecordedBankDebits;

  const reconciliationVariance = Math.abs(adjustedBankBalance - (glStartingBalance + appliedAdjustmentsNet));

  const applyRecommendation = (rec: AIAdjustmentRecommendation) => {
    setRecommendations(prev =>
      prev.map(r => (r.id === rec.id ? { ...r, applied: true } : r))
    );
    // Mark corresponding bank line as matched
    setBankLines(prev =>
      prev.map(b => (b.id === rec.bankLineId ? { ...b, matched: true } : b))
    );
  };

  const autoMatchAll = () => {
    // Re-run matching logic
    setLedgerLines(prev => prev.map(l => (l.id === 'GL-101' || l.id === 'GL-102' || l.id === 'GL-103' || l.id === 'GL-104') ? { ...l, matched: true } : l));
    setBankLines(prev => prev.map(b => (b.id === 'BNK-201' || b.id === 'BNK-202' || b.id === 'BNK-203' || b.id === 'BNK-204') ? { ...b, matched: true } : b));
  };

  const exportReconciliationReport = () => {
    const wb = XLSX.utils.book_new();
    const rows = [
      ['BANK RECONCILIATION STATEMENT', 'كشف التسوية البنكية المعتمد'],
      ['Company', company.nameEn],
      ['Bank Account', 'National Bank of Egypt - Operating EGP Account (#1020)'],
      ['Period Ended', company.reportingPeriod],
      ['', ''],
      ['Balance per Bank Statement (Dec 31, 2025)', bankStartingBalance],
      ['Add: Deposits in Transit (Undeposited Collections)', depositsInTransit],
      ['Less: Outstanding Unpresented Checks', -outstandingChecks],
      ['ADJUSTED BANK BALANCE', adjustedBankBalance],
      ['', ''],
      ['Balance per General Ledger Books (Dec 31, 2025)', glStartingBalance],
      ['Add: Unrecorded Bank Interest & Client Collections', unrecordedBankCredits],
      ['Less: Unrecorded Bank Service Charges & Fees', -unrecordedBankDebits],
      ['ADJUSTED BOOK BALANCE', adjustedGLBalance],
      ['', ''],
      ['RECONCILIATION VARIANCE', Math.abs(adjustedBankBalance - adjustedGLBalance)]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(rows), 'Bank_Reconciliation');
    XLSX.writeFile(wb, `Bank_Reconciliation_${selectedBank}_2025.xlsx`);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <Sparkles className="w-3.5 h-3.5" />
              {isAr ? 'المساعد الذكي للتسويات البنكية' : 'Smart Reconciliation Assistant'}
            </span>
            <span className="text-xs text-slate-400 font-mono">EAS 4 / IAS 7 · Automated Ledger Matching</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Banknote className="w-6 h-6 text-blue-400" />
            {isAr ? 'التسوية البنكية الآلية ومطابقة كشوف الحساب' : 'Automated Bank Reconciliation & Smart GL Assistant'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'مطابقة بنود كشف حساب البنك مع قيود دفتر الأستاذ العام، واكتشاف الشيكات غير المحصلة والإيداعات بالطريق، واقتراح قيود التسوية بالذكاء الاصطناعي.'
              : 'Continuous matching of bank feeds against GL journal records. Detects in-transit items and synthesizes precision adjusting journal entries.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={autoMatchAll}
            className="px-3 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <RefreshCw className="w-3.5 h-3.5 text-blue-400" />
            {isAr ? 'إعادة المطابقة الآلية' : 'Re-run Auto Match'}
          </button>
          <button
            onClick={exportReconciliationReport}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            {isAr ? 'تصدير مذكرة التسوية' : 'Export Certificate'}
          </button>
        </div>
      </div>

      {/* Account Selector & Reconciled KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Bank Statement Balance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'رصيد كشف البنك' : 'Bank Statement Ending'}</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {bankStartingBalance.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            NBE Account #1020 · Dec 31
          </div>
        </div>

        {/* Ledger Book Balance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'رصيد الدفاتر (الأستاذ العام)' : 'GL Ledger Book Ending'}</span>
            <FileCheck2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {glStartingBalance.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Trial Balance Net Balance
          </div>
        </div>

        {/* Adjusted Balance */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'الرصيد المعدل الفعلي' : 'Adjusted Cash Balance'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {adjustedBankBalance.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            After In-Transit & Checks
          </div>
        </div>

        {/* Variance Status */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'فارق التسوية المتبقي' : 'Reconciliation Variance'}</span>
            {reconciliationVariance === 0 ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <AlertTriangle className="w-4 h-4 text-amber-400" />
            )}
          </div>
          <div
            className={`text-xl font-bold font-mono ${
              reconciliationVariance === 0 ? 'text-emerald-400' : 'text-amber-400'
            }`}
          >
            {reconciliationVariance.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {reconciliationVariance === 0
              ? (isAr ? 'مطابق 100% ومعتمد للمراجعة' : '100% Balanced & Verified')
              : (isAr ? 'يتطلب تطبيق قيود تسوية الذكاء الاصطناعي' : 'Requires AI Adjustments Approval')}
          </div>
        </div>
      </div>

      {/* AI Smart Reconciliation Assistant Recommendations Banner */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/70 via-indigo-950/60 to-slate-900 border border-blue-800/80 shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-blue-400" />
            <h3 className="text-sm font-bold text-white">
              {isAr ? 'المساعد الذكي: قيود التسوية المقترحة بناء على أنماط الترحيل التاريخية' : 'Smart Reconciliation Assistant: AI Suggested Adjusting Entries'}
            </h3>
          </div>
          <span className="text-[11px] font-mono text-blue-300 bg-blue-900/40 px-2.5 py-0.5 rounded border border-blue-700">
            {recommendations.filter(r => !r.applied).length} {isAr ? 'تسويات مقترحة' : 'Pending Suggestions'}
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {recommendations.map((rec) => (
            <div
              key={rec.id}
              className={`p-4 rounded-xl border transition flex flex-col justify-between ${
                rec.applied
                  ? 'bg-slate-950/60 border-emerald-800/60 opacity-80'
                  : 'bg-slate-900 border-blue-700/60 hover:border-blue-500'
              }`}
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-xs text-white">
                    {isAr ? rec.titleAr : rec.titleEn}
                  </span>
                  <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                    {Math.round(rec.confidence * 100)}% match
                  </span>
                </div>
                <p className="text-[11px] text-slate-300 leading-relaxed">
                  {isAr ? rec.reasonAr : rec.reasonEn}
                </p>

                {/* Journal Entry Formula */}
                <div className="p-2 rounded bg-slate-950 border border-slate-800 text-[10px] font-mono text-slate-400 space-y-1">
                  <div>
                    <span className="text-blue-400 font-bold">DR:</span> {rec.debitAccountCode} · {rec.debitAccountName}
                  </div>
                  <div>
                    <span className="text-emerald-400 font-bold">CR:</span> {rec.creditAccountCode} · {rec.creditAccountName}
                  </div>
                  <div className="text-right text-emerald-400 font-bold pt-1">
                    Amount: {rec.amount.toLocaleString()} kEGP
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-slate-800/80 flex items-center justify-between">
                {rec.applied ? (
                  <span className="text-emerald-400 text-xs font-semibold flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4" />
                    {isAr ? 'تم ترحيل القيد والتسوية' : 'Adjusted & Posted'}
                  </span>
                ) : (
                  <button
                    onClick={() => applyRecommendation(rec)}
                    className="w-full px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 transition shadow-sm"
                  >
                    <Check className="w-3.5 h-3.5" />
                    {isAr ? 'اعتماد وترحيل قيد التسوية' : 'Approve & Post to GL'}
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Side-by-Side Dual Ledger & Bank Feed Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: General Ledger Entries */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <FileCheck2 className="w-4 h-4 text-emerald-400" />
                {isAr ? 'قيود دفتر الأستاذ العام (حساب 1020 - البنك الأهلي)' : 'General Ledger Cash Entries (#1020 NBE)'}
              </h3>
              <span className="text-xs text-slate-400">
                {ledgerLines.length} {isAr ? 'حركات مسجلة بالدفاتر' : 'Recorded entries in GL'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
            {ledgerLines.map((line) => (
              <div key={line.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{line.date}</span>
                    <span className="font-bold text-white">{line.ref}</span>
                    {line.matched ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        MATCHED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {line.amount < 0 ? 'OUTSTANDING' : 'IN TRANSIT'}
                      </span>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    {isAr ? line.descriptionAr : line.descriptionEn}
                  </p>
                </div>

                <div
                  className={`font-mono font-bold ${
                    line.amount > 0 ? 'text-emerald-400' : 'text-slate-200'
                  }`}
                >
                  {line.amount > 0 ? `+${line.amount.toLocaleString()}` : line.amount.toLocaleString()} kEGP
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Bank Statement Feed */}
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Banknote className="w-4 h-4 text-blue-400" />
                {isAr ? 'كشف حساب البنك الأهلي المصري (الرقمي)' : 'Bank Statement Feed (NBE Electronic Statement)'}
              </h3>
              <span className="text-xs text-slate-400">
                {bankLines.length} {isAr ? 'سطور بكشف البنك' : 'Lines in bank statement'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60 max-h-96 overflow-y-auto">
            {bankLines.map((line) => (
              <div key={line.id} className="py-2.5 flex items-center justify-between text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-[10px] text-slate-400">{line.date}</span>
                    <span className="font-semibold text-slate-200 truncate max-w-[200px]">
                      {line.description}
                    </span>
                    {line.matched ? (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                        MATCHED
                      </span>
                    ) : (
                      <span className="px-1.5 py-0.2 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">
                        UNMATCHED
                      </span>
                    )}
                  </div>
                  {line.categorySuggestion && (
                    <span className="text-[10px] text-blue-400 block mt-0.5 font-mono">
                      AI Tag: {line.categorySuggestion}
                    </span>
                  )}
                </div>

                <div
                  className={`font-mono font-bold ${
                    line.amount > 0 ? 'text-emerald-400' : 'text-rose-400'
                  }`}
                >
                  {line.amount > 0 ? `+${line.amount.toLocaleString()}` : line.amount.toLocaleString()} kEGP
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
