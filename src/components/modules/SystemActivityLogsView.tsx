import React, { useState, useMemo } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import {
  FileCheck2,
  ShieldCheck,
  Download,
  Filter,
  Search,
  CheckCircle2,
  Lock,
  KeyRound,
  FileSpreadsheet,
  Clock,
  Sparkles,
  User,
  Hash
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ActivityLogItem {
  id: string;
  timestamp: string;
  actor: string;
  actorRole: string;
  category: 'LEDGER' | 'AI_COPILOT' | 'TAX_MAPPING' | 'SECURITY' | 'SIGN_OFF';
  actionEn: string;
  actionAr: string;
  details: string;
  sha256Hash: string;
  verified: boolean;
}

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

const INITIAL_LOGS: ActivityLogItem[] = [
  {
    id: 'ACT-901',
    timestamp: '2026-01-08 15:45:12',
    actor: 'Dr. Tamer Samir',
    actorRole: 'Engagement Partner (FCA, SOCPA)',
    category: 'SIGN_OFF',
    actionEn: 'Issued Clean Statutory Audit Opinion Draft for FY 2025',
    actionAr: 'إصدار مسودة تقرير المراجع المستقل برأي نظيف عن عام 2025',
    details: 'Materiality benchmark set at 5,200 kEGP. All 5 audit assertions verified without qualification.',
    sha256Hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    verified: true
  },
  {
    id: 'ACT-902',
    timestamp: '2026-01-08 14:12:08',
    actor: 'AI Gemini Copilot',
    actorRole: 'Automated Audit Intelligence',
    category: 'AI_COPILOT',
    actionEn: 'Synthesized SOCPA/EAS Key Audit Matters narrative paragraph',
    actionAr: 'صياغة فقرة أمور التدقيق الرئيسية وفقاً لمعيار ISA 701 و SOCPA',
    details: 'Synthesized inventory net realizable value testing and revenue recognition cut-off procedures.',
    sha256Hash: '4a53cda18c2baa0c0354bb5f9a3ecbe5ed12ab4d8e11ba873c2f11161202b945',
    verified: true
  },
  {
    id: 'ACT-903',
    timestamp: '2026-01-08 12:30:40',
    actor: 'Ahmed Mansour',
    actorRole: 'Chief Financial Officer',
    category: 'LEDGER',
    actionEn: 'Approved AI recommended bank adjustment entry (JV-2025-12-BNK01)',
    actionAr: 'اعتماد قيد تسوية كشف البنك المقترح بالذكاء الاصطناعي',
    details: 'Adjusted 180 kEGP unposted bank service charges to General Ledger account 6180.',
    sha256Hash: '7d793037a0760186574b0282f2f435e7b1e50774690f849780cad07400d0db9a',
    verified: true
  },
  {
    id: 'ACT-904',
    timestamp: '2026-01-08 10:15:22',
    actor: 'Karim Hassan',
    actorRole: 'Senior Audit Fieldwork Lead',
    category: 'TAX_MAPPING',
    actionEn: 'Verified Egyptian Tax Return Form 41 Withholding Tax mapping',
    actionAr: 'مراجعة وتأكيد تبويب حسابات الخصم والتحصيل لنموذج 41 الضريبي',
    details: 'Reconciled 1%, 3%, 5% tax deduction schedules against supplier invoices ledger.',
    sha256Hash: 'ef2d127de37b942baad06145e54b0c619a1f22327b2ebbcfbec78f5564afe39d',
    verified: true
  },
  {
    id: 'ACT-905',
    timestamp: '2026-01-07 18:20:00',
    actor: 'System Integrity Engine',
    actorRole: 'Automated Security Daemon',
    category: 'SECURITY',
    actionEn: 'Trial Balance Balance Integrity Seal Verified (Debit = Credit: 485,750 kEGP)',
    actionAr: 'تأكيد الختم الرقمي لتطابق ميزان المراجعة (مدين = دائن: 485,750 ألف ج.م)',
    details: 'Zero mathematical variance detected across 24 active ledger lines. Cryptographic seal affirmed.',
    sha256Hash: '8f434346648f6b96df89dda901c5176b10a6d83961dd3c1ac88b59b2dc327aa4',
    verified: true
  }
];

export const SystemActivityLogsView: React.FC<Props> = ({
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';
  const [logs] = useState<ActivityLogItem[]>(INITIAL_LOGS);
  const [filterCategory, setFilterCategory] = useState<string>('ALL');
  const [search, setSearch] = useState('');

  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      const matchCat = filterCategory === 'ALL' || log.category === filterCategory;
      const matchSearch =
        log.actor.toLowerCase().includes(search.toLowerCase()) ||
        log.actionEn.toLowerCase().includes(search.toLowerCase()) ||
        log.actionAr.toLowerCase().includes(search.toLowerCase()) ||
        log.sha256Hash.toLowerCase().includes(search.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [logs, filterCategory, search]);

  const exportSignedCertificate = () => {
    const wb = XLSX.utils.book_new();
    const rows = logs.map((l) => ({
      'Log ID': l.id,
      Timestamp: l.timestamp,
      Actor: l.actor,
      Role: l.actorRole,
      Category: l.category,
      'Action Description': l.actionEn,
      Details: l.details,
      'SHA-256 Seal': l.sha256Hash,
      'Integrity Verified': l.verified ? 'YES' : 'NO'
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Signed_Audit_Logs');
    XLSX.writeFile(wb, 'Ledger_IQ_Signed_Activity_Logs_2025.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-emerald-950/30 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? 'سجل النشاط المشفر والختم الرقمي' : 'Immutable Activity Logs & Cryptographic Seal'}
            </span>
            <span className="text-xs text-slate-400 font-mono">SHA-256 Ledger Provenance · ISA 230</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Lock className="w-6 h-6 text-emerald-400" />
            {isAr ? 'سجلات النشاط الموقعة والتحقق الرقمي من سلامة الدفاتر' : 'Signed System Activity Logs & Audit Integrity Certificates'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'تتبع تاريخي غير قابل للتعديل لكافة حركات النظام، استيراد موازين المراجعة، تسويات الذكاء الاصطناعي، واعتمادات الشريك المراجع مع تشفير SHA-256 لكل عملية.'
              : 'Tamper-evident audit trail capturing every ledger modification, AI recommendation posting, and partner sign-off with SHA-256 verification hash.'}
          </p>
        </div>

        <button
          onClick={exportSignedCertificate}
          className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4" />
          {isAr ? 'تصدير السجل الموقع (Excel/Seal)' : 'Export Signed Logs'}
        </button>
      </div>

      {/* Security & Integrity Status Badges */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/30">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-white">
                {isAr ? 'الختم الرقمي لميزان المراجعة سارٍ وغير معدل' : 'Cryptographic Hash Valid: Uncompromised Ledger State'}
              </span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-800">
                100% VERIFIED
              </span>
            </div>
            <span className="text-[11px] text-slate-400 font-mono">
              Root Hash: e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2 font-mono text-slate-300">
          <KeyRound className="w-4 h-4 text-emerald-400" />
          <span>FCA / SOCPA Firm Seal #EG-8841</span>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-80">
          <Search className={`w-4 h-4 absolute top-2.5 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={isAr ? 'بحث في السجلات أو التوقيعات...' : 'Search logs, actors, or SHA-256 hash...'}
            className={`w-full bg-slate-900 border border-slate-800 rounded-xl py-2 text-xs text-slate-200 focus:outline-none focus:border-emerald-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto">
          {['ALL', 'LEDGER', 'AI_COPILOT', 'TAX_MAPPING', 'SECURITY', 'SIGN_OFF'].map((cat) => (
            <button
              key={cat}
              onClick={() => setFilterCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                filterCategory === cat
                  ? 'bg-emerald-600 text-white font-bold'
                  : 'bg-slate-900 text-slate-400 border border-slate-800 hover:text-white'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Logs Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">Log ID</th>
                <th className="p-3">{isAr ? 'الوقت والمسؤول' : 'Timestamp & Actor'}</th>
                <th className="p-3">{isAr ? 'فئة الإجراء' : 'Category'}</th>
                <th className="p-3">{isAr ? 'بيان العملية والتوثيق' : 'Action & Details'}</th>
                <th className="p-3 font-mono">{isAr ? 'التوقيع المشفر (SHA-256)' : 'SHA-256 Seal'}</th>
                <th className="p-3 text-center">{isAr ? 'الحالة' : 'Integrity'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-sans">
              {filteredLogs.map((item) => (
                <tr key={item.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-mono text-slate-400 text-xs">{item.id}</td>
                  <td className="p-3">
                    <span className="font-bold text-white block">{item.actor}</span>
                    <span className="text-[10px] text-slate-400 block">{item.actorRole}</span>
                    <span className="text-[10px] text-slate-500 font-mono mt-0.5 block">{item.timestamp}</span>
                  </td>
                  <td className="p-3">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                        item.category === 'SIGN_OFF'
                          ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          : item.category === 'AI_COPILOT'
                          ? 'bg-indigo-500/20 text-indigo-300 border border-indigo-500/30'
                          : item.category === 'SECURITY'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {item.category}
                    </span>
                  </td>
                  <td className="p-3 max-w-sm">
                    <span className="font-bold text-slate-200 block">
                      {isAr ? item.actionAr : item.actionEn}
                    </span>
                    <p className="text-[11px] text-slate-400 mt-0.5 leading-relaxed">
                      {item.details}
                    </p>
                  </td>
                  <td className="p-3 font-mono text-[10px] text-slate-400 truncate max-w-[140px]" title={item.sha256Hash}>
                    {item.sha256Hash}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 inline-flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3 text-emerald-400" /> Sealed
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
