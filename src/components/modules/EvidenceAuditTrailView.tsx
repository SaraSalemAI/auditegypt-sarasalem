import React, { useState } from 'react';
import { EvidenceTrace, OutputLanguage, AccountingFramework } from '../../types/accounting';
import { DEFAULT_EVIDENCE_TRACES } from '../../data/defaultCompanyData';
import { useEvidence } from '../../context/EvidenceContext';
import {
  FileCheck2,
  Search,
  Database,
  ArrowRight,
  ShieldCheck,
  Building2,
  Layers,
  CheckCircle2,
  Download
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const EvidenceAuditTrailView: React.FC<Props> = ({ language }) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');

  const traceList = Object.values(DEFAULT_EVIDENCE_TRACES);

  const filtered = traceList.filter(
    (t) =>
      t.id.toLowerCase().includes(search.toLowerCase()) ||
      t.targetMetricEn.toLowerCase().includes(search.toLowerCase()) ||
      t.targetMetricAr.includes(search) ||
      t.sourceFile.toLowerCase().includes(search.toLowerCase())
  );

  const exportEvidenceExcel = () => {
    const data = traceList.map((t) => ({
      'Trace ID': t.id,
      'Target Metric (En)': t.targetMetricEn,
      'Target Metric (Ar)': t.targetMetricAr,
      'Current Value': t.currentValue,
      Formula: t.formulaEn,
      'Financial Statement Line': t.fsLineItemEn,
      'Source File': t.sourceFile,
      'Sheet Tab': t.sourceSheet,
      'Row References': t.sourceRow,
      'Benchmark Organization': t.benchmarkSource?.organization || 'N/A',
      'Benchmark Values': t.benchmarkSource?.benchmarkValue || 'N/A',
      'Approved By': t.approvalHistory?.approvedBy || 'N/A',
      Timestamp: t.approvalHistory?.timestamp || 'N/A'
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Evidence_Audit_Trail');
    XLSX.writeFile(wb, 'Ledger_IQ_Master_Audit_Trail.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5" />
              {isAr ? 'سجل الأدلة والتتبع غير القابل للتعديل' : 'Immutable Evidence & Audit Trail'}
            </span>
            <span className="text-xs text-slate-400 font-mono">End-to-End Lineage</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-400" />
            {isAr ? 'مسار الأدلة وسجل المطابقة المحاسبية الشامل' : 'Evidence Traceability & Audit Trail Studio'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'كل رقم مالي أو نسبة أو توصية ذكاء اصطناعي موثقة بالكامل عبر مسار: الملف المرفوع ← السطر المستخرج ← الحساب ← التبويب ← المعادلة ← القائمة المالية ← المقارنة القطاعية.'
              : 'Every single financial output is rigorously traced: Original File → Imported Row → Account → Mapping → Calculation → Financial Statement → Ratio → Benchmark → AI Insight.'}
          </p>
        </div>

        <button
          onClick={exportEvidenceExcel}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4 text-emerald-400" />
          {isAr ? 'تصدير سجل الأدلة بالكامل' : 'Export Full Audit Trail'}
        </button>
      </div>

      {/* Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
        <div className="relative w-full sm:w-96">
          <Search className={`w-4 h-4 absolute top-2.5 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={isAr ? 'بحث برقم الدليل أو اسم المؤشر أو الملف المصدري...' : 'Search trace ID, metric name, or source file...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Traces Cards */}
      <div className="space-y-4">
        {filtered.map((trace) => (
          <div
            key={trace.id}
            className="p-6 rounded-2xl bg-slate-900 border border-slate-800 hover:border-slate-700 transition shadow-lg space-y-4 text-xs"
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-3 border-b border-slate-800">
              <div className="flex items-center gap-3">
                <span className="font-mono font-bold text-blue-400 text-sm">
                  {trace.id}
                </span>
                <span className="text-base font-bold text-white">
                  {isAr ? trace.targetMetricAr : trace.targetMetricEn}
                </span>
                <span className="font-mono text-emerald-400 font-bold text-base">
                  [{trace.currentValue}]
                </span>
              </div>

              <button
                onClick={() => openEvidence(trace)}
                className="px-3.5 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-500 text-white font-semibold transition flex items-center gap-1.5 self-start sm:self-auto"
              >
                {isAr ? 'فتح مسار الدليل التفاعلي' : 'Open Evidence Modal'} &rarr;
              </button>
            </div>

            {/* Pipeline Visual */}
            <div className="p-3 rounded-xl bg-slate-950 border border-slate-800 flex items-center gap-2 overflow-x-auto text-[11px] text-slate-300">
              <span className="font-mono text-blue-400">{trace.sourceFile}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="font-mono text-slate-400">{trace.sourceSheet} ({trace.sourceRow})</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="font-semibold text-slate-200">{trace.mappedAccounts.length} {isAr ? 'حسابات مطابقة' : 'GL Accounts'}</span>
              <ArrowRight className="w-3.5 h-3.5 text-slate-600 shrink-0" />
              <span className="text-emerald-400 font-bold">{trace.currentValue}</span>
            </div>

            {/* Formula & Accounts */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  {isAr ? 'المعادلة وقاعدة الاحتساب المحاسبية:' : 'Accounting Formula & Rule:'}
                </span>
                <div className="p-2.5 rounded bg-slate-950 font-mono text-blue-300 border border-slate-800">
                  {isAr ? trace.formulaAr : trace.formulaEn}
                </div>
              </div>

              <div className="space-y-1">
                <span className="text-slate-400 text-[10px] uppercase font-bold block">
                  {isAr ? 'المصدر المرجعي الموثق للمقارنة:' : 'Documented Benchmark Citation:'}
                </span>
                <div className="p-2.5 rounded bg-slate-950 text-slate-300 border border-slate-800">
                  <span className="font-semibold text-slate-200">{trace.benchmarkSource?.organization}</span>
                  <p className="text-[10px] text-slate-400 mt-0.5">{trace.benchmarkSource?.datasetName} ({trace.benchmarkSource?.publicationYear})</p>
                </div>
              </div>
            </div>

            {/* Sign-off footer */}
            {trace.approvalHistory && (
              <div className="pt-2 border-t border-slate-800 text-[11px] text-slate-400 flex items-center justify-between">
                <span>
                  {isAr ? 'الاعتماد والمطابقة: ' : 'Auditor Sign-off: '}
                  <strong className="text-slate-200">{trace.approvalHistory.approvedBy}</strong>
                </span>
                <span className="font-mono">{trace.approvalHistory.timestamp}</span>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};
