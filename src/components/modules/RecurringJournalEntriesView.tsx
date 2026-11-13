import React, { useState } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import {
  CalendarRange,
  Clock,
  Play,
  Pause,
  Plus,
  CheckCircle2,
  AlertCircle,
  FileSpreadsheet,
  ArrowRight,
  Sparkles,
  History,
  Trash2,
  Calendar
} from 'lucide-react';

interface RecurringScheduleItem {
  id: string;
  code: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  frequency: 'monthly' | 'quarterly' | 'annual';
  amount: number; // kEGP
  debitAccountCode: string;
  debitAccountNameEn: string;
  debitAccountNameAr: string;
  creditAccountCode: string;
  creditAccountNameEn: string;
  creditAccountNameAr: string;
  status: 'active' | 'paused';
  dayOfMonth: number;
  lastExecutedDate: string;
  nextExecutionDate: string;
  totalExecutions: number;
}

interface ExecutionLog {
  id: string;
  scheduleId: string;
  timestamp: string;
  amount: number;
  journalRef: string;
  status: 'posted' | 'verified';
  auditorVerified: boolean;
}

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

const INITIAL_SCHEDULES: RecurringScheduleItem[] = [
  {
    id: 'REC-001',
    code: 'DEP-EQ-M',
    titleEn: 'Monthly Industrial Equipment Depreciation',
    titleAr: 'إهلاك شهري لآلات ومعدات الإنتاج الصناعي',
    descriptionEn: 'Straight-line monthly depreciation on precision machinery (Asset Class 1510 / 1515).',
    descriptionAr: 'قسط إهلاك شهري ثابت لخطوط الإنتاج والتصنيع (حساب 1510 / 1515).',
    frequency: 'monthly',
    amount: 1069.17,
    debitAccountCode: '5110',
    debitAccountNameEn: 'Factory Machinery Depreciation Expense',
    debitAccountNameAr: 'مصروف إهلاك آلات ومعدات المصنع',
    creditAccountCode: '1515',
    creditAccountNameEn: 'Accumulated Depreciation - Plant & Machinery',
    creditAccountNameAr: 'مجمع إهلاك آلات ومعدات',
    status: 'active',
    dayOfMonth: 30,
    lastExecutedDate: '2025-11-30',
    nextExecutionDate: '2025-12-31',
    totalExecutions: 11
  },
  {
    id: 'REC-002',
    code: 'ROU-LEASE-M',
    titleEn: 'Monthly IFRS 16 / EAS 49 Right-of-Use Amortization',
    titleAr: 'إهلاك شهري لأصول حق الاستخدام (معيار التأجير)',
    descriptionEn: 'Monthly amortization of administrative headquarters and central warehouse lease.',
    descriptionAr: 'إهلاك شهري لحق استخدام المقر الإداري والمخزن الرئيسي بالعبور.',
    frequency: 'monthly',
    amount: 1300.0,
    debitAccountCode: '6130',
    debitAccountNameEn: 'Right-of-Use Asset Amortization Expense',
    debitAccountNameAr: 'مصروف إهلاك أصول حق الاستخدام',
    creditAccountCode: '1555',
    creditAccountNameEn: 'Accumulated Amortization - ROU Assets',
    creditAccountNameAr: 'مجمع إهلاك أصول حق الاستخدام',
    status: 'active',
    dayOfMonth: 28,
    lastExecutedDate: '2025-11-28',
    nextExecutionDate: '2025-12-28',
    totalExecutions: 11
  },
  {
    id: 'REC-003',
    code: 'ACCR-AUDIT-Q',
    titleEn: 'Quarterly Statutory Audit & Legal Fees Accrual',
    titleAr: 'استحقاق ربع سنوي لأتعاب المراجعة والاستشارات القانونية',
    descriptionEn: 'Accrual for independent external auditor engagement and corporate legal retainers.',
    descriptionAr: 'تحميل دوري لأتعاب مكتب المراجعة الخارجي والمستشار القانوني للشركة.',
    frequency: 'quarterly',
    amount: 450.0,
    debitAccountCode: '6140',
    debitAccountNameEn: 'Professional & Audit Fees Expense',
    debitAccountNameAr: 'مصروفات استشارات ومراجعة قانونية',
    creditAccountCode: '2150',
    creditAccountNameEn: 'Accrued Expenses & Charges',
    creditAccountNameAr: 'مصروفات مستحقة وأرصدة دائنة',
    status: 'active',
    dayOfMonth: 31,
    lastExecutedDate: '2025-09-30',
    nextExecutionDate: '2025-12-31',
    totalExecutions: 3
  },
  {
    id: 'REC-004',
    code: 'UHIC-REV-M',
    titleEn: 'Monthly Universal Health Insurance Accrual (0.25%)',
    titleAr: 'استحقاق شهري للمساهمة التكافلية للتأمين الصحي الشامل',
    descriptionEn: 'Law 2/2018 solidarity levy of 0.25% calculated on estimated monthly revenue.',
    descriptionAr: 'مساهمة تكافلية شهرية بنسبة 0.25% من إيرادات الشهر التقديرية.',
    frequency: 'monthly',
    amount: 48.06,
    debitAccountCode: '6190',
    debitAccountNameEn: 'Universal Health Insurance Contribution Expense',
    debitAccountNameAr: 'مصروف المساهمة التكافلية للتأمين الصحي',
    creditAccountCode: '2145',
    creditAccountNameEn: 'ETA - Health Insurance Contribution Payable',
    creditAccountNameAr: 'مصلحة الضرائب - مستحقات المساهمة التكافلية',
    status: 'active',
    dayOfMonth: 30,
    lastExecutedDate: '2025-11-30',
    nextExecutionDate: '2025-12-31',
    totalExecutions: 11
  },
  {
    id: 'REC-005',
    code: 'STAT-RES-A',
    titleEn: 'Annual Statutory Reserve Allocation (5% of Net Profit)',
    titleAr: 'التجنيب السنوي للاحتياطي القانوني (5% من صافي الربح)',
    descriptionEn: 'Companies Law 159/1981 - 5% mandatory transfer of net profit to legal reserve until 50% of capital.',
    descriptionAr: 'قانون الشركات 159/1981 - تحويل 5% من أرباح العام للاحتياطي القانوني حتى بلوغ 50% من رأس المال.',
    frequency: 'annual',
    amount: 1475.0,
    debitAccountCode: '3130',
    debitAccountNameEn: 'Retained Earnings (Appropriation Account)',
    debitAccountNameAr: 'الأرباح المرحلة (حساب التوزيع)',
    creditAccountCode: '3120',
    creditAccountNameEn: 'Statutory Legal Reserve',
    creditAccountNameAr: 'الاحتياطي القانوني الإلزامي',
    status: 'paused',
    dayOfMonth: 31,
    lastExecutedDate: '2024-12-31',
    nextExecutionDate: '2025-12-31',
    totalExecutions: 1
  }
];

export const RecurringJournalEntriesView: React.FC<Props> = ({
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';
  const [schedules, setSchedules] = useState<RecurringScheduleItem[]>(INITIAL_SCHEDULES);
  const [filterFrequency, setFilterFrequency] = useState<'all' | 'monthly' | 'quarterly' | 'annual'>('all');
  const [executionLogs, setExecutionLogs] = useState<ExecutionLog[]>([
    {
      id: 'LOG-101',
      scheduleId: 'REC-001',
      timestamp: '2025-11-30 23:59:00',
      amount: 1069.17,
      journalRef: 'JV-2025-11-DEP01',
      status: 'posted',
      auditorVerified: true
    },
    {
      id: 'LOG-102',
      scheduleId: 'REC-002',
      timestamp: '2025-11-28 23:59:00',
      amount: 1300.0,
      journalRef: 'JV-2025-11-ROU01',
      status: 'posted',
      auditorVerified: true
    },
    {
      id: 'LOG-103',
      scheduleId: 'REC-004',
      timestamp: '2025-11-30 23:59:00',
      amount: 48.06,
      journalRef: 'JV-2025-11-UHIC01',
      status: 'posted',
      auditorVerified: true
    }
  ]);
  const [newModalOpen, setNewModalOpen] = useState(false);
  const [postFeedback, setPostFeedback] = useState<string | null>(null);

  // New item form state
  const [formData, setFormData] = useState({
    titleEn: '',
    titleAr: '',
    descriptionEn: '',
    descriptionAr: '',
    frequency: 'monthly' as const,
    amount: 0,
    debitAccountCode: '',
    debitAccountNameEn: '',
    debitAccountNameAr: '',
    creditAccountCode: '',
    creditAccountNameEn: '',
    creditAccountNameAr: '',
    dayOfMonth: 30
  });

  const toggleStatus = (id: string) => {
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === id ? { ...s, status: s.status === 'active' ? 'paused' : 'active' } : s
      )
    );
  };

  const handlePostNow = (item: RecurringScheduleItem) => {
    const today = new Date().toISOString().split('T')[0];
    const journalRef = `JV-${today}-${item.code}`;

    const newLog: ExecutionLog = {
      id: `LOG-${Date.now()}`,
      scheduleId: item.id,
      timestamp: `${today} ${new Date().toLocaleTimeString()}`,
      amount: item.amount,
      journalRef,
      status: 'posted',
      auditorVerified: true
    };

    setExecutionLogs((prev) => [newLog, ...prev]);
    setSchedules((prev) =>
      prev.map((s) =>
        s.id === item.id
          ? {
              ...s,
              lastExecutedDate: today,
              totalExecutions: s.totalExecutions + 1
            }
          : s
      )
    );

    setPostFeedback(
      isAr
        ? `تم ترحيل القيد الدوري (${item.titleAr}) بنجاح بدفتر اليومية برقم مرجعي: ${journalRef}`
        : `Successfully posted recurring journal (${item.titleEn}) to General Ledger with ref: ${journalRef}`
    );
    setTimeout(() => setPostFeedback(null), 4000);
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.titleEn || formData.amount <= 0) return;

    const newItem: RecurringScheduleItem = {
      id: `REC-${Date.now().toString().slice(-4)}`,
      code: `CUSTOM-${Date.now().toString().slice(-3)}`,
      titleEn: formData.titleEn,
      titleAr: formData.titleAr || formData.titleEn,
      descriptionEn: formData.descriptionEn,
      descriptionAr: formData.descriptionAr || formData.descriptionEn,
      frequency: formData.frequency,
      amount: formData.amount,
      debitAccountCode: formData.debitAccountCode || '6000',
      debitAccountNameEn: formData.debitAccountNameEn || 'Operating Expense',
      debitAccountNameAr: formData.debitAccountNameAr || 'مصروف تشغيلي',
      creditAccountCode: formData.creditAccountCode || '2000',
      creditAccountNameEn: formData.creditAccountNameEn || 'Accrued Liabilities',
      creditAccountNameAr: formData.creditAccountNameAr || 'التزامات مستحقة',
      status: 'active',
      dayOfMonth: formData.dayOfMonth,
      lastExecutedDate: 'None',
      nextExecutionDate: '2025-12-31',
      totalExecutions: 0
    };

    setSchedules((prev) => [...prev, newItem]);
    setNewModalOpen(false);
    setFormData({
      titleEn: '',
      titleAr: '',
      descriptionEn: '',
      descriptionAr: '',
      frequency: 'monthly',
      amount: 0,
      debitAccountCode: '',
      debitAccountNameEn: '',
      debitAccountNameAr: '',
      creditAccountCode: '',
      creditAccountNameEn: '',
      creditAccountNameAr: '',
      dayOfMonth: 30
    });
  };

  const filtered = schedules.filter(
    (s) => filterFrequency === 'all' || s.frequency === filterFrequency
  );

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <CalendarRange className="w-3.5 h-3.5" />
              {isAr ? 'إدارة القيود الآلية والدورية' : 'Automated Recurring Posting Engine'}
            </span>
            <span className="text-xs text-slate-400 font-mono">IAS 16 · IFRS 16 · Law 159/1981</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Clock className="w-6 h-6 text-blue-400" />
            {isAr ? 'قيود اليومية الدورية والمتكررة (Recurring Journals)' : 'Recurring Journal Entries & Auto-Posting Schedules'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'جدولة القيود الشهرية والربع سنوية والسنوية (الإهلاك المحاسبي، إطفاء حق الاستخدام، مخصصات الأتعاب، واحتياطيات الأرباح) مع الترحيل الفوري للأستاذ العام.'
              : 'Configure and automate recurring accruals, depreciation schedules, and statutory reserve transfers with one-click posting to General Ledger.'}
          </p>
        </div>

        <button
          onClick={() => setNewModalOpen(true)}
          className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-2 transition"
        >
          <Plus className="w-4 h-4" />
          {isAr ? 'إضافة قيد دوري جديد' : 'New Recurring Schedule'}
        </button>
      </div>

      {/* Post Feedback notification */}
      {postFeedback && (
        <div className="p-3 rounded-xl bg-emerald-500/20 border border-emerald-500/40 text-emerald-200 text-xs flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
          <span>{postFeedback}</span>
        </div>
      )}

      {/* Frequency Filter Bar */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setFilterFrequency('all')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterFrequency === 'all'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          {isAr ? 'كافة القيود' : 'All Schedules'} ({schedules.length})
        </button>
        <button
          onClick={() => setFilterFrequency('monthly')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterFrequency === 'monthly'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          {isAr ? 'شهري' : 'Monthly'}
        </button>
        <button
          onClick={() => setFilterFrequency('quarterly')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterFrequency === 'quarterly'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          {isAr ? 'ربع سنوي' : 'Quarterly'}
        </button>
        <button
          onClick={() => setFilterFrequency('annual')}
          className={`px-3 py-1.5 rounded-lg font-medium transition ${
            filterFrequency === 'annual'
              ? 'bg-blue-600 text-white font-bold'
              : 'text-slate-400 hover:text-white hover:bg-slate-900'
          }`}
        >
          {isAr ? 'سنوي' : 'Annual'}
        </button>
      </div>

      {/* Schedules List */}
      <div className="grid grid-cols-1 gap-4">
        {filtered.map((item) => (
          <div
            key={item.id}
            className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex flex-col lg:flex-row lg:items-center justify-between gap-4"
          >
            <div className="space-y-2 flex-1 min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950/60 px-2 py-0.5 rounded border border-blue-800">
                  {item.code}
                </span>
                <h3 className="font-bold text-white text-sm">
                  {isAr ? item.titleAr : item.titleEn}
                </h3>
                <span
                  className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                    item.status === 'active'
                      ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : 'bg-slate-800 text-slate-400 border border-slate-700'
                  }`}
                >
                  {item.status}
                </span>
                <span className="text-[10px] text-slate-400 font-mono uppercase bg-slate-950 px-2 py-0.5 rounded border border-slate-800">
                  {item.frequency}
                </span>
              </div>

              <p className="text-xs text-slate-400 leading-relaxed">
                {isAr ? item.descriptionAr : item.descriptionEn}
              </p>

              {/* Journal Accounts Mapping Preview */}
              <div className="p-3 rounded-lg bg-slate-950 border border-slate-800/80 text-xs font-mono grid grid-cols-1 md:grid-cols-2 gap-2">
                <div className="text-slate-300">
                  <span className="text-blue-400 font-bold">DR:</span> {item.debitAccountCode} ·{' '}
                  <span className="text-slate-400">{isAr ? item.debitAccountNameAr : item.debitAccountNameEn}</span>
                </div>
                <div className="text-slate-300">
                  <span className="text-emerald-400 font-bold">CR:</span> {item.creditAccountCode} ·{' '}
                  <span className="text-slate-400">{isAr ? item.creditAccountNameAr : item.creditAccountNameEn}</span>
                </div>
              </div>

              <div className="flex items-center gap-4 text-[11px] text-slate-400 pt-1">
                <span>
                  {isAr ? 'آخر ترحيل: ' : 'Last posted: '}
                  <strong className="text-slate-200 font-mono">{item.lastExecutedDate}</strong>
                </span>
                <span>·</span>
                <span>
                  {isAr ? 'الترحيل القادم: ' : 'Next execution: '}
                  <strong className="text-amber-400 font-mono">{item.nextExecutionDate}</strong>
                </span>
                <span>·</span>
                <span>
                  {isAr ? 'إجمالي مرات الترحيل: ' : 'Total runs: '}
                  <strong className="text-white font-mono">{item.totalExecutions}</strong>
                </span>
              </div>
            </div>

            {/* Right Amount & Actions */}
            <div className="flex flex-row lg:flex-col items-center lg:items-end justify-between gap-3 shrink-0 pt-3 lg:pt-0 border-t lg:border-t-0 border-slate-800">
              <div className="text-right">
                <div className="text-xs text-slate-400 font-medium">
                  {isAr ? 'قيمة القيد لكل فترة' : 'Scheduled Amount'}
                </div>
                <div className="text-xl font-bold font-mono text-emerald-400">
                  {item.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })} kEGP
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => toggleStatus(item.id)}
                  className={`p-2 rounded-lg border text-xs font-medium transition ${
                    item.status === 'active'
                      ? 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
                      : 'bg-emerald-950/60 text-emerald-300 border-emerald-800 hover:bg-emerald-900'
                  }`}
                  title={item.status === 'active' ? 'Pause Schedule' : 'Activate Schedule'}
                >
                  {item.status === 'active' ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
                </button>

                <button
                  onClick={() => handlePostNow(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs shadow-md shadow-blue-600/30 transition flex items-center gap-1.5"
                >
                  <Play className="w-3 h-3 fill-current" />
                  <span>{isAr ? 'ترحيل الآن للدفاتر' : 'Post to GL Now'}</span>
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Execution History Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <History className="w-4 h-4 text-blue-400" />
          {isAr ? 'سجل ترحيل القيود الدورية الحديثة' : 'Recent Recurring Journal Postings History'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-2.5">Log ID</th>
                <th className="p-2.5">{isAr ? 'تاريخ ووقت الترحيل' : 'Timestamp'}</th>
                <th className="p-2.5">{isAr ? 'رقم القيد الدفتري' : 'Journal Reference'}</th>
                <th className="p-2.5 text-right">{isAr ? 'القيمة (kEGP)' : 'Amount (kEGP)'}</th>
                <th className="p-2.5 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="p-2.5 text-center">{isAr ? 'اعتماد المراجع' : 'Auditor Sign-off'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {executionLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-800/40">
                  <td className="p-2.5 text-slate-400">{log.id}</td>
                  <td className="p-2.5 text-slate-300">{log.timestamp}</td>
                  <td className="p-2.5 text-blue-400 font-bold">{log.journalRef}</td>
                  <td className="p-2.5 text-right font-bold text-emerald-400">
                    {log.amount.toLocaleString(undefined, { minimumFractionDigits: 2 })}
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] uppercase font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                      {log.status}
                    </span>
                  </td>
                  <td className="p-2.5 text-center">
                    <span className="text-emerald-400 text-xs inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Verified
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* New Schedule Modal */}
      {newModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <CalendarRange className="w-5 h-5 text-blue-400" />
              {isAr ? 'إنشاء قيد دوري متكرر جديد' : 'Create New Recurring Schedule'}
            </h3>

            <form onSubmit={handleCreate} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">
                  {isAr ? 'عنوان القيد (English):' : 'Schedule Title (English):'}
                </label>
                <input
                  type="text"
                  required
                  value={formData.titleEn}
                  onChange={(e) => setFormData({ ...formData, titleEn: e.target.value })}
                  placeholder="e.g. Monthly Warehouse Lease Amortization"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">
                  {isAr ? 'عنوان القيد (بالعربية):' : 'Schedule Title (Arabic):'}
                </label>
                <input
                  type="text"
                  value={formData.titleAr}
                  onChange={(e) => setFormData({ ...formData, titleAr: e.target.value })}
                  placeholder="مثال: إطفاء إيجار مستودع العاشر من رمضان"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'التكرار الدوري:' : 'Frequency:'}
                  </label>
                  <select
                    value={formData.frequency}
                    onChange={(e) => setFormData({ ...formData, frequency: e.target.value as any })}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                  >
                    <option value="monthly">{isAr ? 'شهري' : 'Monthly'}</option>
                    <option value="quarterly">{isAr ? 'ربع سنوي' : 'Quarterly'}</option>
                    <option value="annual">{isAr ? 'سنوي' : 'Annual'}</option>
                  </select>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'المبلغ الدوري (kEGP):' : 'Amount (kEGP):'}
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    required
                    value={formData.amount || ''}
                    onChange={(e) => setFormData({ ...formData, amount: parseFloat(e.target.value) || 0 })}
                    placeholder="e.g. 500"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'كود الحساب المدين (DR):' : 'Debit Account Code (DR):'}
                  </label>
                  <input
                    type="text"
                    value={formData.debitAccountCode}
                    onChange={(e) => setFormData({ ...formData, debitAccountCode: e.target.value })}
                    placeholder="e.g. 6120"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'كود الحساب الدائن (CR):' : 'Credit Account Code (CR):'}
                  </label>
                  <input
                    type="text"
                    value={formData.creditAccountCode}
                    onChange={(e) => setFormData({ ...formData, creditAccountCode: e.target.value })}
                    placeholder="e.g. 2150"
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setNewModalOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {isAr ? 'حفظ وتفعيل القيد' : 'Save & Activate'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
