import React, { useState } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import { DEFAULT_AUDIT_RISKS } from '../../data/defaultCompanyData';
import {
  ShieldAlert,
  FileText,
  Lock,
  Eye,
  CheckCircle2,
  Clock,
  Sparkles,
  Link,
  Plus,
  Download,
  Building,
  UserCheck,
  FolderOpen,
  ArrowRight,
  Filter,
  Activity,
  Share2
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface FieldworkNote {
  id: string;
  wpRef: string; // e.g. WP-1010
  auditorInitials: string;
  date: string;
  topicEn: string;
  topicAr: string;
  notesEn: string;
  notesAr: string;
  linkedRiskId?: string;
  status: 'reviewed' | 'pending_partner_review';
}

interface AuditFeedItem {
  id: string;
  timestamp: string;
  actor: string;
  actionEn: string;
  actionAr: string;
  target: string;
  category: 'ledger' | 'ai' | 'mapping' | 'risk' | 'system';
  targetModuleId: number;
}

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
  onNavigate: (moduleId: number) => void;
}

export const AuditorDashboardView: React.FC<Props> = ({
  company,
  language,
  framework,
  onNavigate
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'fieldwork' | 'feed' | 'stakeholder' | 'portal'>('fieldwork');
  const [clientPortalReadOnly, setClientPortalReadOnly] = useState(false);

  // Fieldwork Notes State
  const [fieldworkNotes, setFieldworkNotes] = useState<FieldworkNote[]>([
    {
      id: 'NOTE-01',
      wpRef: 'WP-1010-CASH',
      auditorInitials: 'KH',
      date: '2025-12-28',
      topicEn: 'Bank Confirmation Letter Inspection (NBE)',
      topicAr: 'فحص كتاب المصادقة البنكية للبنك الأهلي المصري',
      notesEn: 'Obtained direct electronic bank confirmation from NBE. Reconciled book cash of 26,400 kEGP. Identified 180 kEGP unposted bank service fees; management agreed to adjust.',
      notesAr: 'تم استلام المصادقة البنكية المباشرة ومطابقتها برصيد الدفاتر البالغ 26,400 ألف ج.م، وتم الاتفاق على قيد تسوية لمصروفات البنك.',
      linkedRiskId: 'VAL-01',
      status: 'reviewed'
    },
    {
      id: 'NOTE-02',
      wpRef: 'WP-1210-INV',
      auditorInitials: 'AM',
      date: '2025-12-30',
      topicEn: 'Physical Inventory Count Observation (10th of Ramadan Plant)',
      topicAr: 'ملاحظة الجرد الفعلي للمخزون (مصنع العاشر من رمضان)',
      notesEn: 'Attended year-end stock count for industrial raw materials and finished engineering components. Observed sample count accuracy 99.4%. Provision for slow-moving parts is adequate at 4,150 kEGP.',
      notesAr: 'حضور جرد نهاية العام للمصنع الرئيسي، بلغت دقة العينات 99.4% مع كفاية مخصص الركود بمبلغ 4,150 ألف ج.م.',
      linkedRiskId: 'EXT-01',
      status: 'reviewed'
    },
    {
      id: 'NOTE-03',
      wpRef: 'WP-1110-REC',
      auditorInitials: 'KH',
      date: '2026-01-04',
      topicEn: 'EAS 47 / IFRS 9 Expected Credit Loss (ECL) Model Audit',
      topicAr: 'تدقيق نموذج الخسائر الائتمانية المتوقعة للعملاء',
      notesEn: 'Audited aging buckets and forward-looking macroeconomic default probabilities. Tested specific provision of 6,200 kEGP against aging receivables.',
      notesAr: 'فحص فئات أعمار الديون ومصفوفة التعثر الائتماني وفقاً للمعيار المصري 47، واعتماد مخصص بمبلغ 6,200 ألف ج.م.',
      linkedRiskId: 'VAL-02',
      status: 'pending_partner_review'
    }
  ]);

  // Real-Time Audit Feed
  const [auditFeed] = useState<AuditFeedItem[]>([
    {
      id: 'FEED-01',
      timestamp: '2026-01-08 14:32',
      actor: 'Auditor Karim H.',
      actionEn: 'Linked bank confirmation file to Risk VAL-01 workpapers',
      actionAr: 'ربط كتاب المصادقة البنكية بأوراق عمل الخطر VAL-01',
      target: 'Audit Risk Studio (VAL-01)',
      category: 'risk',
      targetModuleId: 17
    },
    {
      id: 'FEED-02',
      timestamp: '2026-01-08 13:15',
      actor: 'AI Smart Assistant',
      actionEn: 'Suggested adjustment journal for unmatched bank statement SWIFT fees (180 kEGP)',
      actionAr: 'اقتراح قيد تسوية للمصروفات البنكية غير المسجلة (180 ألف ج.م)',
      target: 'Bank Reconciliation (#1020)',
      category: 'ai',
      targetModuleId: 22
    },
    {
      id: 'FEED-03',
      timestamp: '2026-01-08 11:20',
      actor: 'CFO Office (Ahmed M.)',
      actionEn: 'Re-imported balanced Trial Balance with 2025 closing figures',
      actionAr: 'استيراد ميزان المراجعة المتوازن لأرصدة نهاية 2025',
      target: 'Trial Balance Engine',
      category: 'ledger',
      targetModuleId: 5
    },
    {
      id: 'FEED-04',
      timestamp: '2026-01-08 09:45',
      actor: 'Lead Partner (Dr. Tamer S.)',
      actionEn: 'Signed off on Comparative Materiality Thresholds (>15% / 5.2M EGP)',
      actionAr: 'اعتماد حدود الأهمية النسبية المقارنة (>15% / 5.2 مليون ج.م)',
      target: 'Audit Compliance Studio',
      category: 'system',
      targetModuleId: 17
    }
  ]);

  // New Note Modal
  const [newNoteOpen, setNewNoteOpen] = useState(false);
  const [newWpRef, setNewWpRef] = useState('');
  const [newTopic, setNewTopic] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newRiskLink, setNewRiskLink] = useState('VAL-01');

  const handleAddNote = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newWpRef || !newTopic) return;

    const newNote: FieldworkNote = {
      id: `NOTE-${Date.now().toString().slice(-3)}`,
      wpRef: newWpRef,
      auditorInitials: 'KH',
      date: new Date().toISOString().split('T')[0],
      topicEn: newTopic,
      topicAr: newTopic,
      notesEn: newNotes,
      notesAr: newNotes,
      linkedRiskId: newRiskLink,
      status: 'pending_partner_review'
    };

    setFieldworkNotes([newNote, ...fieldworkNotes]);
    setNewNoteOpen(false);
    setNewWpRef('');
    setNewTopic('');
    setNewNotes('');
  };

  const exportAuditorDossier = () => {
    const wb = XLSX.utils.book_new();
    const rows = fieldworkNotes.map((n) => ({
      'WP Reference': n.wpRef,
      Auditor: n.auditorInitials,
      Date: n.date,
      Topic: n.topicEn,
      'Fieldwork Notes': n.notesEn,
      'Linked Risk': n.linkedRiskId || 'None',
      Status: n.status
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Fieldwork_Notes');
    XLSX.writeFile(wb, 'Auditor_Fieldwork_Dossier_2025.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-blue-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-300 border border-blue-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAr ? 'منصة المراجع المستقل وبوابة العميل' : 'Professional Auditor Dashboard & Client Portal'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ISA 210 · ISA 230 · Working Papers Dossier</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <UserCheck className="w-6 h-6 text-blue-400" />
            {isAr ? 'لوحة المراجع القانوني وتدفق أوراق العمل الميدانية' : 'Lead Auditor Cockpit, Fieldwork Notes & Stakeholder Portal'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'إدارة ملاحظات الفحص الميداني، خطابات الارتباط، الملف الدائم، ومتابعة تدفق التعديلات الحية مع توفير بوابة للقراءة فقط لممثلي العميل والمساهمين.'
              : 'Centralizes audit fieldwork notes, permanent files, real-time modification feed, and client stakeholder reporting with secure read-only portal view.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Read-Only Portal Switcher */}
          <button
            onClick={() => setClientPortalReadOnly(!clientPortalReadOnly)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              clientPortalReadOnly
                ? 'bg-amber-600 text-white border-amber-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            {clientPortalReadOnly ? <Lock className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            {clientPortalReadOnly
              ? (isAr ? 'بوابة العميل (قراءة فقط)' : 'Client Portal (Read-Only)')
              : (isAr ? 'وضع المراجع الكامل' : 'Auditor Full Mode')}
          </button>

          <button
            onClick={exportAuditorDossier}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            {isAr ? 'تصدير الملف الميداني' : 'Export Dossier'}
          </button>
        </div>
      </div>

      {/* Client Portal Watermark Banner when active */}
      {clientPortalReadOnly && (
        <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 text-xs flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Lock className="w-4 h-4 text-amber-400 shrink-0" />
            <span>
              {isAr
                ? 'وضع بوابة العميل المخصصة مفعل: الصلاحية للقراءة فقط، وتم حظر إجراء أي تعديلات على الدفاتر أو قيود التسوية.'
                : 'Client Read-Only Portal Active: Underlying ledgers and audit risk settings are locked from modification.'}
            </span>
          </div>
          <span className="text-[10px] font-mono uppercase bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/40">
            SECURE ACCESS
          </span>
        </div>
      )}

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('fieldwork')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'fieldwork'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <FolderOpen className="w-4 h-4" />
          {isAr ? 'أوراق العمل والملاحظات الميدانية' : 'Fieldwork Notes & Working Papers'}
        </button>

        <button
          onClick={() => setActiveTab('feed')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'feed'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Activity className="w-4 h-4" />
          {isAr ? 'تدفق العمليات اللحظي (Audit Feed)' : 'Real-Time Audit Feed'}
        </button>

        <button
          onClick={() => setActiveTab('stakeholder')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'stakeholder'
              ? 'bg-blue-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Share2 className="w-4 h-4" />
          {isAr ? 'تقرير المساهمين والإدارة' : 'Stakeholder Summary Report'}
        </button>
      </div>

      {/* TAB 1: FIELDWORK NOTES */}
      {activeTab === 'fieldwork' && (
        <div className="space-y-4">
          {/* Header Action Strip */}
          <div className="flex items-center justify-between">
            <span className="text-xs text-slate-400">
              {fieldworkNotes.length} {isAr ? 'أوراق عمل فحص ميداني موثقة' : 'Documented fieldwork working papers'}
            </span>
            {!clientPortalReadOnly && (
              <button
                onClick={() => setNewNoteOpen(true)}
                className="px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 shadow-sm transition"
              >
                <Plus className="w-3.5 h-3.5" />
                {isAr ? 'إضافة ملاحظة ميدانية' : 'Add Fieldwork Note'}
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4">
            {fieldworkNotes.map((note) => (
              <div
                key={note.id}
                className="p-5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition space-y-3"
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-mono text-xs font-bold text-blue-400 bg-blue-950 px-2 py-0.5 rounded border border-blue-800">
                      {note.wpRef}
                    </span>
                    <h3 className="font-bold text-white text-sm">
                      {isAr ? note.topicAr : note.topicEn}
                    </h3>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase ${
                        note.status === 'reviewed'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                      }`}
                    >
                      {note.status === 'reviewed' ? 'Partner Approved' : 'Pending Review'}
                    </span>
                  </div>

                  <div className="flex items-center gap-3 text-xs text-slate-400">
                    <span>Auditor: <strong className="text-slate-200 font-mono">{note.auditorInitials}</strong></span>
                    <span>·</span>
                    <span className="font-mono">{note.date}</span>
                  </div>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed">
                  {isAr ? note.notesAr : note.notesEn}
                </p>

                {/* Linked Risk Finding */}
                {note.linkedRiskId && (
                  <div className="p-2.5 rounded-lg bg-slate-950 border border-slate-800/80 flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <Link className="w-3.5 h-3.5 text-rose-400" />
                      <span className="text-slate-400">
                        {isAr ? 'مرتبط بخطر التدقيق:' : 'Linked Audit Risk:'}{' '}
                        <strong className="text-rose-300 font-mono">{note.linkedRiskId}</strong>
                      </span>
                    </div>

                    <button
                      onClick={() => onNavigate(17)}
                      className="text-blue-400 hover:text-blue-300 text-[11px] font-medium flex items-center gap-1"
                    >
                      {isAr ? 'عرض في استوديو المخاطر' : 'Inspect in Risk Studio'} <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 2: REAL-TIME AUDIT FEED */}
      {activeTab === 'feed' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Activity className="w-4 h-4 text-blue-400" />
                {isAr ? 'سجل النشاط وتدفق التعديلات المحاسبية المباشر' : 'Continuous Audit Activity & System Modification Feed'}
              </h3>
              <span className="text-xs text-slate-400">
                {isAr ? 'رصد فوري لكافة التعديلات، تسويات الذكاء الاصطناعي، واعتمادات المراجع' : 'Live trace of GL modifications, AI adjustments, and partner sign-offs'}
              </span>
            </div>
          </div>

          <div className="divide-y divide-slate-800/60">
            {auditFeed.map((item) => (
              <div key={item.id} className="py-3 flex items-start justify-between gap-4 text-xs">
                <div className="flex items-start gap-3">
                  <div
                    className={`p-1.5 rounded-lg mt-0.5 shrink-0 ${
                      item.category === 'ai'
                        ? 'bg-indigo-500/20 text-indigo-300'
                        : item.category === 'risk'
                        ? 'bg-rose-500/20 text-rose-300'
                        : 'bg-blue-500/20 text-blue-300'
                    }`}
                  >
                    {item.category === 'ai' ? <Sparkles className="w-4 h-4" /> : <Clock className="w-4 h-4" />}
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-white">{item.actor}</span>
                      <span className="text-[10px] font-mono text-slate-400 bg-slate-950 px-1.5 py-0.2 rounded border border-slate-800">
                        {item.timestamp}
                      </span>
                    </div>
                    <p className="text-slate-300">{isAr ? item.actionAr : item.actionEn}</p>
                    <span className="text-[11px] text-slate-500 font-mono block">Target: {item.target}</span>
                  </div>
                </div>

                <button
                  onClick={() => onNavigate(item.targetModuleId)}
                  className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-blue-300 text-xs font-semibold shrink-0 flex items-center gap-1 transition"
                >
                  {isAr ? 'انتقال للبند' : 'Jump'} <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: STAKEHOLDER REPORTING */}
      {activeTab === 'stakeholder' && (
        <div className="space-y-6">
          <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Share2 className="w-5 h-5 text-blue-400" />
              {isAr ? 'ملخص تقرير التدقيق لمجلس الإدارة والمساهمين' : 'Executive Audit Summary for Board of Directors & Shareholders'}
            </h3>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {isAr
                ? `تقرير تنفيذي يلخص نتائج فحص القوائم المالية لشركة ${company.nameAr} عن السنة المالية المنتهية في 31 ديسمبر 2025، شاملاً أمور التدقيق الرئيسية (KAMs)، وردود الإدارة، ونسبة الإنجاز حتى إصدار الرأي النظيف النهائي.`
                : `Executive audit report for ${company.nameEn} covering FY 2025. Highlights Key Audit Matters (KAMs), management representations, and clearance status towards a clean audit opinion.`}
            </p>

            {/* Key Audit Matters List */}
            <div className="space-y-3 pt-2">
              <span className="text-xs font-bold text-slate-400 uppercase tracking-wider block">
                {isAr ? 'أمور التدقيق الرئيسية (Key Audit Matters - ISA 701)' : 'Key Audit Matters (KAMs under ISA 701)'}
              </span>

              {DEFAULT_AUDIT_RISKS.slice(0, 3).map((risk) => (
                <div key={risk.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2 text-xs">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-white text-xs">
                      {risk.assertion}: {risk.accountCode} - {risk.accountNameEn}
                    </span>
                    <span className="text-emerald-400 font-bold font-mono">
                      {isAr ? 'استجابة الإدارة معتمدة' : 'Management Response Accepted'}
                    </span>
                  </div>
                  <p className="text-slate-400 text-[11px] leading-relaxed">
                    {isAr ? risk.descriptionAr : risk.descriptionEn}
                  </p>
                  <div className="p-2.5 rounded bg-slate-900/90 text-slate-300 text-[11px]">
                    <strong className="text-blue-400">{isAr ? 'إجراءات التدقيق المستقل:' : 'Auditor Procedure:'}</strong>{' '}
                    {isAr ? risk.auditProcedureAr : risk.auditProcedureEn}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Add Fieldwork Note Modal */}
      {newNoteOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="w-full max-w-lg bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-2xl space-y-4">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              {isAr ? 'إضافة ورقة عمل وملاحظة فحص ميداني' : 'Add Fieldwork Working Paper Note'}
            </h3>

            <form onSubmit={handleAddNote} className="space-y-3 text-xs">
              <div>
                <label className="text-slate-400 block mb-1">Working Paper Reference (e.g. WP-1010-CASH):</label>
                <input
                  type="text"
                  required
                  value={newWpRef}
                  onChange={(e) => setNewWpRef(e.target.value)}
                  placeholder="WP-1510-PPE"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'عنوان الموضوع:' : 'Audit Topic:'}</label>
                <input
                  type="text"
                  required
                  value={newTopic}
                  onChange={(e) => setNewTopic(e.target.value)}
                  placeholder="PPE Additions & Supplier Invoices Testing"
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'ملاحظات الفحص والنتائج:' : 'Observations & Procedures:'}</label>
                <textarea
                  rows={3}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Inspected purchase orders, customs clearance documents, and capital expenditure approvals..."
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'الربط بمخاطر التدقيق:' : 'Link to Audit Risk Assertion:'}</label>
                <select
                  value={newRiskLink}
                  onChange={(e) => setNewRiskLink(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white"
                >
                  {DEFAULT_AUDIT_RISKS.map((r) => (
                    <option key={r.id} value={r.id}>
                      {r.id} - {r.assertion} ({r.accountNameEn})
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-4">
                <button
                  type="button"
                  onClick={() => setNewNoteOpen(false)}
                  className="px-4 py-2 rounded-lg bg-slate-800 text-slate-300 hover:text-white"
                >
                  {isAr ? 'إلغاء' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold"
                >
                  {isAr ? 'حفظ ورقة العمل' : 'Save Working Paper'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
