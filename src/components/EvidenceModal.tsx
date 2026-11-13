import React from 'react';
import { useEvidence } from '../context/EvidenceContext';
import { OutputLanguage } from '../types/accounting';
import {
  X,
  FileCheck2,
  CheckCircle2,
  Layers,
  ArrowRight,
  Database,
  Building2,
  UserCheck,
  Hash,
  Scale
} from 'lucide-react';

interface Props {
  language: OutputLanguage;
}

export const EvidenceModal: React.FC<Props> = ({ language }) => {
  const { activeTrace, isOpen, closeEvidence } = useEvidence();

  if (!isOpen || !activeTrace) return null;

  const isAr = language === 'ar';

  const pipelineSteps = [
    { labelEn: 'Original File', labelAr: 'الملف المرفوع', icon: Database, done: true },
    { labelEn: 'Imported Row', labelAr: 'السطر المستخرج', icon: Hash, done: true },
    { labelEn: 'Account Code', labelAr: 'كود الحساب', icon: Layers, done: true },
    { labelEn: 'Taxonomy Mapping', labelAr: 'التبويب المحاسبي', icon: Scale, done: true },
    { labelEn: 'FS Line Item', labelAr: 'بند القائمة المالية', icon: Building2, done: true },
    { labelEn: 'Audit Calculation', labelAr: 'المعادلة والاحتساب', icon: FileCheck2, done: true },
    { labelEn: 'Benchmark Gap', labelAr: 'المقارنة القطاعية', icon: CheckCircle2, done: true }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 overflow-y-auto">
      <div
        className="relative w-full max-w-4xl bg-slate-900 border border-slate-700/80 rounded-xl shadow-2xl overflow-hidden text-slate-100 my-8 max-h-[90vh] flex flex-col"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 bg-slate-950/80 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-400">
              <FileCheck2 className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30 uppercase tracking-wider">
                  {isAr ? 'مسار الأدلة والتحقق المحاسبي' : 'Audit Trace & Evidence Path'}
                </span>
                <span className="text-xs text-slate-400 font-mono">ID: {activeTrace.id}</span>
              </div>
              <h3 className="text-lg font-bold text-white mt-0.5">
                {isAr ? activeTrace.targetMetricAr : activeTrace.targetMetricEn}
                <span className="ml-3 mr-3 font-mono text-emerald-400 text-base font-semibold">
                  [{activeTrace.currentValue}]
                </span>
              </h3>
            </div>
          </div>
          <button
            onClick={closeEvidence}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Traceability Pipeline Breadcrumb */}
        <div className="bg-slate-950/40 px-6 py-3 border-b border-slate-800/80 overflow-x-auto">
          <div className="flex items-center gap-2 min-w-max text-xs">
            {pipelineSteps.map((step, idx) => {
              const Icon = step.icon;
              return (
                <React.Fragment key={idx}>
                  <div className="flex items-center gap-1.5 px-2.5 py-1 rounded bg-slate-800/70 border border-slate-700/60 text-slate-200">
                    <Icon className="w-3.5 h-3.5 text-blue-400" />
                    <span className="font-medium">{isAr ? step.labelAr : step.labelEn}</span>
                  </div>
                  {idx < pipelineSteps.length - 1 && (
                    <ArrowRight className={`w-3.5 h-3.5 text-slate-500 ${isAr ? 'rotate-180' : ''}`} />
                  )}
                </React.Fragment>
              );
            })}
          </div>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6 overflow-y-auto flex-1 text-sm">
          {/* Rule and Calculation */}
          <div className="p-4 rounded-lg bg-slate-950/60 border border-slate-800">
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
              {isAr ? 'المعادلة المحاسبية المطبقة وقاعدة الاحتساب' : 'Applied Accounting Rule & Formula'}
            </h4>
            <div className="font-mono text-blue-300 text-sm bg-slate-900/90 px-3 py-2 rounded border border-blue-900/40">
              {isAr ? activeTrace.formulaAr : activeTrace.formulaEn}
            </div>
            <p className="text-xs text-slate-400 mt-2">
              {isAr ? 'بند القائمة المالية المستهدف:' : 'Target Financial Statement Line:'}{' '}
              <span className="text-slate-200 font-medium">
                {isAr ? activeTrace.fsLineItemAr : activeTrace.fsLineItemEn}
              </span>
            </p>
          </div>

          {/* Mapped Accounts in Equation */}
          <div>
            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-2">
              {isAr ? 'الحسابات المقترنة بالاحتساب من ميزان المراجعة' : 'Mapped Accounts Contributing to Figure'}
            </h4>
            <div className="rounded-lg border border-slate-800 overflow-hidden bg-slate-950/40">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-slate-900/90 text-slate-400 border-b border-slate-800">
                    <th className="py-2.5 px-3 font-semibold">{isAr ? 'كود الحساب' : 'Account Code'}</th>
                    <th className="py-2.5 px-3 font-semibold">{isAr ? 'اسم الحساب بالدفاتر' : 'Account Name'}</th>
                    <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'القيمة (ألف ج.م)' : 'Amount (kEGP)'}</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {activeTrace.mappedAccounts.map((acc, i) => (
                    <tr key={i} className="hover:bg-slate-800/30">
                      <td className="py-2 px-3 font-mono text-blue-400">{acc.code}</td>
                      <td className="py-2 px-3 text-slate-200 font-medium">
                        {isAr ? acc.nameAr : acc.nameEn}
                      </td>
                      <td className="py-2 px-3 text-right font-mono text-emerald-400">
                        {acc.amount.toLocaleString()}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Source Location */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-slate-400 block">{isAr ? 'الملف المصدري' : 'Source Document'}</span>
              <span className="font-mono text-xs text-slate-200 font-medium break-all mt-1 block">
                {activeTrace.sourceFile}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-slate-400 block">{isAr ? 'ورقة العمل' : 'Worksheet / Tab'}</span>
              <span className="font-mono text-xs text-slate-200 font-medium mt-1 block">
                {activeTrace.sourceSheet}
              </span>
            </div>
            <div className="p-3 rounded-lg bg-slate-950/50 border border-slate-800">
              <span className="text-xs text-slate-400 block">{isAr ? 'مراجع السطور والقيود' : 'Row / Cell References'}</span>
              <span className="font-mono text-xs text-slate-200 font-medium mt-1 block">
                {activeTrace.sourceRow}
              </span>
            </div>
          </div>

          {/* Official Benchmark Documentation */}
          {activeTrace.benchmarkSource && (
            <div className="p-4 rounded-lg bg-blue-950/20 border border-blue-900/40">
              <div className="flex items-center gap-2 mb-2">
                <Building2 className="w-4 h-4 text-blue-400" />
                <h4 className="text-xs font-semibold text-blue-300 uppercase tracking-wider">
                  {isAr ? 'المصدر المرجعي الموثق للمقارنة القطاعية' : 'Verified Industry Benchmark Citation'}
                </h4>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="text-slate-400 block">{isAr ? 'الجهة المصدرة للتقرير:' : 'Issuing Organization:'}</span>
                  <span className="text-slate-200 font-medium">{activeTrace.benchmarkSource.organization}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'اسم الدراسة / سنة الإصدار:' : 'Dataset & Year:'}</span>
                  <span className="text-slate-200 font-medium">{activeTrace.benchmarkSource.datasetName} ({activeTrace.benchmarkSource.publicationYear})</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'قيم المقارنة القطاعية:' : 'Benchmark Distribution:'}</span>
                  <span className="font-mono text-emerald-300">{activeTrace.benchmarkSource.benchmarkValue}</span>
                </div>
                <div>
                  <span className="text-slate-400 block">{isAr ? 'حجم عينة الشركات:' : 'Sample Size & Methodology:'}</span>
                  <span className="text-slate-300">{activeTrace.benchmarkSource.sampleSize}</span>
                </div>
              </div>
            </div>
          )}

          {/* Auditor Sign-off and Approval History */}
          {activeTrace.approvalHistory && (
            <div className="p-3 rounded-lg bg-emerald-950/20 border border-emerald-900/30 flex items-start gap-3">
              <UserCheck className="w-4 h-4 text-emerald-400 shrink-0 mt-0.5" />
              <div className="text-xs">
                <span className="font-semibold text-emerald-300">
                  {isAr ? 'اعتماد المراجعة والمطابقة:' : 'Auditor & Controller Sign-off:'}
                </span>{' '}
                <span className="text-slate-200">{activeTrace.approvalHistory.approvedBy}</span>
                <span className="text-slate-400 mx-2">({activeTrace.approvalHistory.timestamp})</span>
                <p className="text-slate-300 mt-1 italic">"{activeTrace.approvalHistory.comments}"</p>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 bg-slate-950/90 border-t border-slate-800 flex justify-between items-center text-xs text-slate-400">
          <span>{isAr ? 'جميع الأرقام قابلة للمطابقة والتدقيق التاريخي' : 'Traceable & verifiable to original accounting books'}</span>
          <button
            onClick={closeEvidence}
            className="px-4 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-medium transition"
          >
            {isAr ? 'إغلاق نافذة الدليل' : 'Close Evidence'}
          </button>
        </div>
      </div>
    </div>
  );
};
