import React, { useState, useMemo } from 'react';
import { AuditRiskItem, OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  ShieldAlert,
  CheckCircle2,
  AlertTriangle,
  FileText,
  Download,
  Filter,
  Check,
  Building,
  UserCheck,
  ArrowRight,
  Printer,
  Sparkles,
  Layers,
  Send,
  Upload,
  Copy,
  BookOpen,
  FileCheck
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface EvidenceRequestItem {
  id: string;
  itemEn: string;
  itemAr: string;
  department: string;
  linkedRiskId: string;
  status: 'received_verified' | 'pending_submission' | 'overdue';
  dueDate: string;
  fileName?: string;
}

interface Props {
  risks: AuditRiskItem[];
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const AuditRiskStudioView: React.FC<Props> = ({
  risks,
  company,
  language,
  framework
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'assertions' | 'peer_review' | 'request_tracker' | 'narrative_builder'>('assertions');
  const [selectedAssertion, setSelectedAssertion] = useState<string>('all');
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [opinionType, setOpinionType] = useState<'clean' | 'qualified'>('clean');
  const [copiedNarrative, setCopiedNarrative] = useState(false);

  // Evidence Request Tracker State (PBC list)
  const [requests, setRequests] = useState<EvidenceRequestItem[]>([
    {
      id: 'REQ-01',
      itemEn: 'Bank Confirmation Certificate (NBE Operating Account #1020)',
      itemAr: 'شهادة المصادقة البنكية المباشرة (البنك الأهلي المصري #1020)',
      department: 'Treasury & Finance',
      linkedRiskId: 'VAL-01',
      status: 'received_verified',
      dueDate: '2026-01-05',
      fileName: 'NBE_Bank_Confirmation_FY2025_Signed.pdf'
    },
    {
      id: 'REQ-02',
      itemEn: 'Year-End Physical Stock Count Sheets & Variance Analysis (10th Ramadan Plant)',
      itemAr: 'محاضر الجرد الفعلي للمخزون السنوي وفروق الجرد (مصنع العاشر)',
      department: 'Warehouse & Operations',
      linkedRiskId: 'EXT-01',
      status: 'received_verified',
      dueDate: '2026-01-03',
      fileName: 'Stock_Count_Dec31_CairoPrecision_Signed.xlsx'
    },
    {
      id: 'REQ-03',
      itemEn: 'Export Customs Shipping Manifests & Bill of Lading (Cut-off Testing)',
      itemAr: 'أذون الإفراج الجمركي وبوالص الشحن لتسليمات التصدير (فحص فصل الفترات)',
      department: 'Logistics & Export',
      linkedRiskId: 'CUT-01',
      status: 'pending_submission',
      dueDate: '2026-01-15'
    },
    {
      id: 'REQ-04',
      itemEn: 'Legal Counsel Letter on Outstanding Litigation and Warranty Claims',
      itemAr: 'خطاب المستشار القانوني الخارجي بشأن الدعاوي القضائية ومطالبات الضمان',
      department: 'Legal Counsel',
      linkedRiskId: 'COM-01',
      status: 'pending_submission',
      dueDate: '2026-01-18'
    },
    {
      id: 'REQ-05',
      itemEn: 'External Valuation Certificate for Commercial Headquarters Land & Building',
      itemAr: 'تقرير التقييم العقاري المستقل لأراضي ومباني المقر الرئيسي (EAS 10)',
      department: 'Executive Management',
      linkedRiskId: 'VAL-03',
      status: 'overdue',
      dueDate: '2025-12-30'
    }
  ]);

  const toggleRequestStatus = (id: string) => {
    setRequests((prev) =>
      prev.map((r) =>
        r.id === id
          ? {
              ...r,
              status: r.status === 'received_verified' ? 'pending_submission' : 'received_verified',
              fileName: r.status === 'received_verified' ? undefined : 'Client_Uploaded_Document.pdf'
            }
          : r
      )
    );
  };

  const assertions = [
    'all',
    'Valuation',
    'Existence',
    'Cut-off',
    'Completeness',
    'Accuracy',
    'Classification'
  ];

  const filtered = risks.filter(
    (r) => selectedAssertion === 'all' || r.assertion === selectedAssertion
  );

  // SOCPA / EAS Audit Narrative Paragraphs
  const generatedNarrative = useMemo(() => {
    return isAr
      ? `تقرير مراقب الحسابات المستقل
إلى السادة مساهمي شركة ${company.nameAr}

أولاً: الرأي في القوائم المالية (Opinion)
راجعنا القوائم المالية لشركة ${company.nameAr}، والمتمثلة في قائمة المركز المالي كما في 31 ديسمبر 2025، وقوائم الأرباح أو الخسائر والدخل الشامل الآخر، والتغيرات في حقوق الملكية، والتدفقات النقدية عن السنة المالية المنتهية في ذلك التاريخ، والإيضاحات المتممة.
في رأينا المهني المستقل، تعبر القوائم المالية بعدالة ووضوح، في كافة جوانبها الجوهرية، عن المركز المالي للشركة كما في 31 ديسمبر 2025، وعن أدائها المالي وتدفقاتها النقدية عن السنة المنتهية في ذلك التاريخ وفقاً لمعايير المحاسبة المصرية (EAS) والمتطلبات النظامية لقانون الشركات المصري رقم 159 لسنة 1981 وتعديلاته ومعايير الهيئة العامة للمحاسبين والمراجعين (SOCPA / EAS).

ثانياً: أساس الرأي (Basis for Opinion)
قمنا بأعمال المراجعة وفقاً لمعايير المراجعة المصرية. وإن مسؤولياتنا بموجب هذه المعايير موضحة بالتفصيل في فقرة "مسؤوليات مراقب الحسابات". ونؤكد استقلاليتنا التامة عن الشركة وفقاً لقواعد السلوك المهني الدولية. ونعتقد أن أدلة المراجعة التي حصلنا عليها كافية ومناسبة لتوفير أساس معقول لإبداء رأينا.

ثالثاً: أمور التدقيق الرئيسية (Key Audit Matters - ISA 701)
1. تقييم كفاية مخصص خسائر الائتمان المتوقعة لأرصدة العملاء (معيار المحاسبة المصري رقم 47):
بلغ صافي رصيد العملاء 69,400 ألف ج.م. تطلبت المراجعة تقييماً تقديرياً جوهرياً من الإدارة لمصفوفة التعثر التاريخية والتوقعات الاقتصادية المستقبلية. واشتملت إجراءاتنا على اختبار ضوابط الرقابة الداخلية، وإعادة احتساب مصفوفة التعثر، وفحص التحصيلات اللاحقة بعد تاريخ الميزانية.
2. التحقق من اكتمال وتقييم مخزون الإنتاج الصناعي وبضاعة بالطريق (معيار المحاسبة المصري رقم 2):
بلغ رصيد المخزون 53,700 ألف ج.م. قمنا بحضور الجرد الفعلي الفجائي، واختبار صافي القيمة البيعية القابلة للتحقق (NRV)، ومطابقة بوالص الشحن الجمركي لمبيعات التصدير لضمان سلامة فصل الفترات المحاسبية.

رابعاً: تقرير عن المتطلبات القانونية والنظامية الأخرى
تمسك الشركة حسابات مالية منتظمة تتضمن كل ما نص عليه القانون ونظام الشركة، وقد تبين لنا تطابق ميزان المراجعة ودفتر الأستاذ العام تطابقاً تاماً مع القوائم المالية المعروضة.`
      : `INDEPENDENT AUDITOR’S REPORT
To the Shareholders of ${company.nameEn}

1. Unqualified Opinion
We have audited the financial statements of ${company.nameEn}, which comprise the Statement of Financial Position as at December 31, 2025, and the Statement of Profit or Loss and Other Comprehensive Income, Statement of Changes in Equity, and Statement of Cash Flows for the year then ended, and notes to the financial statements.
In our opinion, the accompanying financial statements present fairly, in all material respects, the financial position of the Company as at December 31, 2025, and its financial performance and cash flows for the year then ended in accordance with Egyptian Accounting Standards (EAS), International Financial Reporting Standards (IFRS) principles, and Egyptian Companies Law No. 159 of 1981.

2. Basis for Opinion
We conducted our audit in accordance with Egyptian Standards on Auditing and International Standards on Auditing (ISAs). We are independent of the Company in accordance with the International Ethics Standards Board for Accountants’ Code of Ethics. We believe that the audit evidence we have obtained is sufficient and appropriate to provide a basis for our opinion.

3. Key Audit Matters (ISA 701)
Key Audit Matters are those matters that, in our professional judgment, were of most significance in our audit of the financial statements of the current period:
- Valuation of Trade Receivables and ECL Allowance (EAS 47 / IFRS 9): Tested internal credit ratings, aging distribution, and historical loss ratios.
- Existence and Valuation of Manufacturing Inventories (EAS 2 / IAS 2): Attended physical inventory count observation at 10th of Ramadan industrial facilities and tested lower of cost or net realizable value (NRV).

4. Report on Other Legal and Regulatory Requirements
The Company maintains proper books of account which include all that is mandated by law and company statutes. The trial balance is mathematically balanced and in complete agreement with the audited financial statements.`;
  }, [isAr, company]);

  const copyNarrative = () => {
    navigator.clipboard.writeText(generatedNarrative);
    setCopiedNarrative(true);
    setTimeout(() => setCopiedNarrative(false), 2500);
  };

  const exportAuditRiskExcel = () => {
    const data = risks.map((r) => ({
      ID: r.id,
      Assertion: r.assertion,
      'Assertion (Arabic)': r.assertionAr,
      'Risk Description (En)': r.descriptionEn,
      'Risk Description (Ar)': r.descriptionAr,
      Account: `${r.accountCode} - ${r.accountNameEn}`,
      'Amount (kEGP)': r.amountInvolved,
      Severity: r.severity,
      'Audit Procedure (En)': r.auditProcedureEn,
      'Audit Procedure (Ar)': r.auditProcedureAr,
      'Management Response': isAr ? r.managementResponseAr : r.managementResponseEn,
      Decision: r.reviewerDecision
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Audit_Risk_Assessment');
    XLSX.writeFile(wb, 'Ledger_IQ_Audit_Risk_Workpapers.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800 shadow-xl">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-400 border border-rose-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAr ? 'بيئة دعم وتدقيق الحسابات المستقلة' : 'Audit-Support & Risk Studio'}
            </span>
            <span className="text-xs text-slate-400">
              {risks.length} {isAr ? 'مخاطر تدقيق محددة' : 'Targeted Risk Assertions'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShieldAlert className="w-6 h-6 text-rose-400" />
            {isAr ? 'استوديو فحص مخاطر التدقيق وصائغ التقارير النظامية' : 'Audit & Risk Management Studio & SOCPA Narrative Builder'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'تحليل التأكيدات المحاسبية، المراجعة النظيرة بالذكاء الاصطناعي (AI Peer Review)، تعقب طلبات الأدلة من العميل (PBC Tracker)، وصياغة مسودة تقرير المراجع المستقل وفق معايير SOCPA و EAS.'
              : 'Assertion-level substantive testing, AI Peer Review inconsistencies scanner, PBC evidence request tracking, and SOCPA/EAS audit opinion paragraph synthesis.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setReportModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <FileText className="w-4 h-4" />
            {isAr ? 'مسودة تقرير التدقيق' : 'Preliminary Audit Report'}
          </button>
          <button
            onClick={exportAuditRiskExcel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تصدير أوراق العمل' : 'Export Workpapers'}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('assertions')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'assertions'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <ShieldAlert className="w-4 h-4" />
          {isAr ? 'فحص التأكيدات والمخاطر' : 'Risk Assertions & Workpapers'}
        </button>

        <button
          onClick={() => setActiveTab('peer_review')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'peer_review'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Sparkles className="w-4 h-4 text-amber-300" />
          {isAr ? 'المراجعة النظيرة الذكية (AI Peer Review)' : 'AI Peer Review Tool'}
        </button>

        <button
          onClick={() => setActiveTab('request_tracker')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'request_tracker'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <FileCheck className="w-4 h-4 text-blue-300" />
          {isAr ? 'تعقب طلبات أدلة العميل (PBC Tracker)' : 'Evidence Request Tracker (PBC)'}
        </button>

        <button
          onClick={() => setActiveTab('narrative_builder')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'narrative_builder'
              ? 'bg-rose-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4 text-emerald-300" />
          {isAr ? 'صائغ التقرير النظامي (SOCPA Narrative)' : 'SOCPA/EAS Narrative Builder'}
        </button>
      </div>

      {/* TAB 1: ASSERTIONS */}
      {activeTab === 'assertions' && (
        <div className="space-y-4">
          <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
            {assertions.map((a) => (
              <button
                key={a}
                onClick={() => setSelectedAssertion(a)}
                className={`px-3 py-1.5 rounded-xl font-semibold transition border whitespace-nowrap ${
                  selectedAssertion === a
                    ? 'bg-rose-600 text-white border-rose-500 shadow'
                    : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {a === 'all' ? (isAr ? 'كافة التأكيدات (Assertions)' : 'All Assertions') : a}
              </button>
            ))}
          </div>

          <div className="space-y-4">
            {filtered.map((risk) => {
              const isHigh = risk.severity === 'high';

              return (
                <div
                  key={risk.id}
                  className={`p-6 rounded-2xl border text-xs space-y-4 transition ${
                    isHigh
                      ? 'bg-rose-950/20 border-rose-900/40'
                      : 'bg-slate-900 border-slate-800'
                  }`}
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
                    <div className="flex items-center gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase ${
                          isHigh
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {risk.severity} Severity
                      </span>
                      <span className="px-2 py-0.5 rounded bg-blue-500/10 text-blue-300 border border-blue-500/20 font-semibold text-[10px]">
                        {isAr ? `تأكيد: ${risk.assertionAr}` : `Assertion: ${risk.assertion}`}
                      </span>
                      <span className="text-slate-400 font-mono">ID: {risk.id}</span>
                    </div>

                    <div className="flex items-center gap-3">
                      <span className="font-mono text-emerald-400 font-bold">
                        {isAr ? 'المبلغ المفحوص: ' : 'Audited Amount: '}
                        {risk.amountInvolved.toLocaleString()} kEGP
                      </span>
                      <button
                        onClick={() => openEvidence(risk.evidenceTraceId)}
                        className="text-blue-400 hover:text-blue-300 font-semibold flex items-center gap-1"
                      >
                        {isAr ? 'فحص الدليل والمستند' : 'Audit Evidence'} &rarr;
                      </button>
                    </div>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-white mb-1">
                      {isAr ? risk.descriptionAr : risk.descriptionEn}
                    </h3>
                    <p className="text-xs text-slate-400">
                      {isAr ? 'الحساب المعني: ' : 'Target Account: '}
                      <strong className="text-slate-200">{risk.accountCode} - {isAr ? risk.accountNameAr : risk.accountNameEn}</strong>
                    </p>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="font-bold text-blue-300 uppercase tracking-wider text-[10px] block">
                        {isAr ? 'إجراء التدقيق الموصى به للمراجع الخارجي:' : 'Prescribed Substantive Audit Procedure:'}
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans">
                        {isAr ? risk.auditProcedureAr : risk.auditProcedureEn}
                      </p>
                    </div>

                    <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                      <span className="font-bold text-emerald-300 uppercase tracking-wider text-[10px] block">
                        {isAr ? 'رد وإيضاح الإدارة المالية والأدلة المقدمة:' : 'Management Response & Submitted Evidence:'}
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans">
                        {isAr ? risk.managementResponseAr : risk.managementResponseEn}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-slate-800/80 text-[11px] text-slate-400">
                    <span>{isAr ? 'قرار وموقف المراجع:' : 'Auditor Assessment:'} <strong className="text-blue-300">{risk.reviewerDecision}</strong></span>
                    <span className="italic">{isAr ? 'مستند إلى فحص عينات الدفاتر' : 'Grounded in ledger sample testing'}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: AI PEER REVIEW TOOL */}
      {activeTab === 'peer_review' && (
        <div className="space-y-4">
          <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/50 via-indigo-950/40 to-slate-900 border border-blue-800/80 space-y-3">
            <div className="flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-400" />
              <h3 className="text-base font-bold text-white">
                {isAr ? 'المراجعة النظيرة المستقلة بالذكاء الاصطناعي (AI Peer Review)' : 'AI Peer Review & Consistency Diagnostic'}
              </h3>
            </div>
            <p className="text-xs text-slate-300 leading-relaxed max-w-3xl">
              {isAr
                ? 'فحص شامل ومنهجي للقوائم المالية بحثاً عن أي تناقضات منطقية، أو فروق تصنيفية، أو مخاطر إفصاح وفقاً لمعايير EAS و IFRS، مع توصيات موجهة لفريق التدقيق الميداني.'
                : 'Automated critical audit evaluation identifying logical inconsistencies and reporting risks across statements under EAS/IFRS standards.'}
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            {/* Finding 1 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-amber-500/20 text-amber-300 font-bold font-mono text-[10px]">
                  IFRS 15 / EAS 48 · REVENUE CUT-OFF
                </span>
                <span className="text-amber-400 font-bold">Medium Risk</span>
              </div>
              <h4 className="font-bold text-white text-sm">
                {isAr ? 'تزامن نمو إيرادات التصدير في ديسمبر مع استقرار التدفق النقدي' : 'December Export Revenue Surge vs. Cash Flow Divergence'}
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {isAr
                  ? 'سجلت إيرادات التصدير زيادة قدرها 24% في الأسبوعين الأخيرين من شهر ديسمبر 2025. يتطلب معيار EAS 48 التحقق من انتقال السيطرة الفعلية وبوالص الشحن (Bill of Lading) قبل 31 ديسمبر لتفادي التبكير في إثبات الإيراد.'
                  : 'Export revenues increased by 24% in the last 2 weeks of December. EAS 48 requires verifying that control and FOB shipping terms transferred prior to Dec 31 to prevent premature revenue recognition.'}
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-blue-300">
                <strong>{isAr ? 'توصية التدقيق:' : 'Audit Focus:'}</strong>{' '}
                {isAr ? 'فحص عينة بنسبة 100% لفواتير التصدير الصادرة بين 24 و 31 ديسمبر 2025 ومطابقتها بشهادات الإفراج الجمركي.' : 'Test 100% of export invoices issued between Dec 24 and Dec 31 against bill of lading customs timestamps.'}
              </div>
            </div>

            {/* Finding 2 */}
            <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 space-y-3">
              <div className="flex items-center justify-between">
                <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-300 font-bold font-mono text-[10px]">
                  IAS 2 / EAS 2 · INVENTORY VALUATION
                </span>
                <span className="text-emerald-400 font-bold">Verified Satisfactory</span>
              </div>
              <h4 className="font-bold text-white text-sm">
                {isAr ? 'كفاية مخصص هبوط المخزون الراكد وقطع الغيار' : 'Adequacy of Inventory Obsolete Provision'}
              </h4>
              <p className="text-slate-300 leading-relaxed">
                {isAr
                  ? 'تمت مقارنة تكلفة المخزون البالغة 53,700 ألف ج.م بأسعار البيع اللاحقة في الربع الأول من 2026. هامش مجمل الربح المحقق (28.5%) يدعم سلامة تقييم المخزون بالتكلفة دون الحاجة لمخصصات إضافية.'
                  : 'Total inventory of 53,700 kEGP was benchmarked against post-year-end selling prices in Q1 2026. The 28.5% gross margin supports lower of cost or net realizable value (NRV).'}
              </p>
              <div className="p-2.5 rounded bg-slate-950 border border-slate-800 text-[11px] text-emerald-300">
                <strong>{isAr ? 'توصية التدقيق:' : 'Audit Focus:'}</strong>{' '}
                {isAr ? 'الاعتماد على نتائج الجرد الفعلي الموثقة وإدراجها ضمن أوراق العمل النهائية.' : 'Incorporate certified inventory count sheets into permanent audit file.'}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: EVIDENCE REQUEST TRACKER (PBC) */}
      {activeTab === 'request_tracker' && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileCheck className="w-5 h-5 text-blue-400" />
                {isAr ? 'قائمة طلبات بيانات العميل (Provided By Client - PBC Tracker)' : 'Client Audit Evidence Request Tracker (PBC)'}
              </h3>
              <span className="text-xs text-slate-400">
                {isAr ? 'متابعة استلام المستندات المؤيدة وربطها المباشر بمخاطر التدقيق' : 'Track data requests to client and link received files directly to risk findings'}
              </span>
            </div>
            <span className="text-xs font-mono text-emerald-400 bg-emerald-950 px-2.5 py-1 rounded border border-emerald-800">
              {requests.filter(r => r.status === 'received_verified').length} / {requests.length} Received & Verified
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
              <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
                <tr>
                  <th className="p-3">Req ID</th>
                  <th className="p-3">{isAr ? 'المستند المطلوب' : 'Requested Evidence Item'}</th>
                  <th className="p-3">{isAr ? 'الإدارة المسؤولة' : 'Department'}</th>
                  <th className="p-3">{isAr ? 'خطر التدقيق المرتبط' : 'Linked Risk'}</th>
                  <th className="p-3">{isAr ? 'تاريخ الاستحقاق' : 'Due Date'}</th>
                  <th className="p-3 text-center">{isAr ? 'الحالة' : 'Status'}</th>
                  <th className="p-3 text-center">{isAr ? 'الإجراء' : 'Action'}</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 font-sans">
                {requests.map((r) => (
                  <tr key={r.id} className="hover:bg-slate-800/40">
                    <td className="p-3 font-mono text-slate-400 text-xs">{r.id}</td>
                    <td className="p-3">
                      <span className="font-bold text-white block">{isAr ? r.itemAr : r.itemEn}</span>
                      {r.fileName && (
                        <span className="text-[10px] text-emerald-400 font-mono mt-0.5 flex items-center gap-1">
                          <CheckCircle2 className="w-3 h-3" /> {r.fileName}
                        </span>
                      )}
                    </td>
                    <td className="p-3 text-slate-300">{r.department}</td>
                    <td className="p-3 font-mono text-blue-400 font-bold">{r.linkedRiskId}</td>
                    <td className="p-3 font-mono text-slate-400">{r.dueDate}</td>
                    <td className="p-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                          r.status === 'received_verified'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : r.status === 'overdue'
                            ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {r.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-3 text-center">
                      <button
                        onClick={() => toggleRequestStatus(r.id)}
                        className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold transition"
                      >
                        {r.status === 'received_verified'
                          ? (isAr ? 'إلغاء التأكيد' : 'Mark Pending')
                          : (isAr ? 'تأكيد الاستلام' : 'Mark Verified')}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: SOCPA/EAS NARRATIVE BUILDER */}
      {activeTab === 'narrative_builder' && (
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
            <div>
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <BookOpen className="w-5 h-5 text-emerald-400" />
                {isAr ? 'صائغ فقرات تقرير التدقيق الرسمي (SOCPA & EAS Compliant)' : 'Formal SOCPA / EAS Audit Report Paragraph Builder'}
              </h3>
              <span className="text-xs text-slate-400">
                {isAr ? 'صياغة آلية لفقرات الرأي، أساس الرأي، وأمور التدقيق الرئيسية جاهزة للطباعة' : 'Synthesized opinion, basis, and KAM paragraphs complying with Saudi/Egyptian auditing standards'}
              </span>
            </div>

            <button
              onClick={copyNarrative}
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold shadow-lg shadow-emerald-600/20 flex items-center gap-2 transition"
            >
              {copiedNarrative ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
              {copiedNarrative ? (isAr ? 'تم نسخ التقرير' : 'Copied!') : (isAr ? 'نسخ نص التقرير بالكامل' : 'Copy Full Narrative')}
            </button>
          </div>

          <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
            {generatedNarrative}
          </div>
        </div>
      )}

      {/* Preliminary Audit Report Modal */}
      {reportModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
          <div className="bg-slate-900 border border-slate-700 rounded-2xl max-w-3xl w-full p-6 text-xs text-slate-200 space-y-4 my-8 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-800">
              <div>
                <span className="text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 px-2 py-0.5 rounded border border-amber-500/30">
                  {isAr ? 'مسودة تقرير استرشادي لدعم المراجع' : 'Draft Audit-Support Material (Not a Signed Auditor Opinion)'}
                </span>
                <h3 className="text-lg font-bold text-white mt-1">
                  {isAr ? 'مسودة تقرير مراقب الحسابات المستقل' : 'Draft Independent Auditor’s Report (Audit Support)'}
                </h3>
              </div>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 font-bold"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>

            <div className="p-3 rounded-xl bg-amber-950/40 border border-amber-900/60 text-amber-200 text-[11px] space-y-1">
              <strong>{isAr ? 'تنبيه مهني هام:' : 'Important Professional Responsibility Notice:'}</strong>
              <p>
                {isAr
                  ? 'أي تقرير أو رأي يصدره النظام هو مادة مساعدة لأعمال التدقيق فقط، ولا يعد بديلاً عن التقرير الرسمي الموقع من مراقب الحسابات المستقل المقيد بسجل المحاسبين والمراجعين.'
                  : 'All generated audit reports are drafts and audit-support material only. The final signed audit opinion remains solely the legal responsibility of an authorized independent certified auditor.'}
              </p>
            </div>

            <div className="p-5 rounded-xl bg-slate-950 border border-slate-800 space-y-3 font-sans leading-relaxed text-slate-300 whitespace-pre-line">
              {generatedNarrative}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => window.print()}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-200 hover:bg-slate-700 flex items-center gap-1.5 font-bold"
              >
                <Printer className="w-4 h-4" />
                {isAr ? 'طباعة المسودة' : 'Print Draft'}
              </button>
              <button
                onClick={() => setReportModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white hover:bg-blue-500 font-bold"
              >
                {isAr ? 'تم' : 'Done'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
