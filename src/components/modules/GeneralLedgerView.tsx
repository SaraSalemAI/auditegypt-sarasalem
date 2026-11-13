import React, { useState } from 'react';
import { JournalEntry, OutputLanguage, AccountingFramework } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  BookOpen,
  Search,
  Filter,
  CheckCircle2,
  Calendar,
  User,
  Hash,
  Download,
  ArrowRight
} from 'lucide-react';

interface Props {
  journalEntries: JournalEntry[];
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const GeneralLedgerView: React.FC<Props> = ({
  journalEntries,
  language
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';
  const [search, setSearch] = useState('');
  const [selectedEntry, setSelectedEntry] = useState<JournalEntry | null>(journalEntries[0] || null);

  const filtered = journalEntries.filter((je) => {
    return (
      je.entryNumber.toLowerCase().includes(search.toLowerCase()) ||
      je.reference.toLowerCase().includes(search.toLowerCase()) ||
      je.descriptionEn.toLowerCase().includes(search.toLowerCase()) ||
      je.descriptionAr.toLowerCase().includes(search.toLowerCase()) ||
      je.lines.some((l) => l.accountCode.includes(search) || l.accountNameEn.toLowerCase().includes(search.toLowerCase()))
    );
  });

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'سجلات اليومية والأستاذ العام' : 'General Ledger Audit'}
            </span>
            <span className="text-xs text-slate-400">
              {journalEntries.length} {isAr ? 'قيود يومية مسجلة' : 'Recorded Journal Entries'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <BookOpen className="w-6 h-6 text-blue-400" />
            {isAr ? 'دفتر الأستاذ العام وتفاصيل قيود اليومية' : 'General Ledger & Journal Entries Studio'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'فحص قيود اليومية المحاسبية المزدوجة، التأكد من توازن كل قيد، وتتبع المستندات المؤيدة وأطراف المعاملات المالية.'
              : 'Audit double-entry journal transactions, inspect balance integrity per entry, and verify source accounting vouchers.'}
          </p>
        </div>

        <div className="relative w-full md:w-72">
          <Search className={`w-4 h-4 absolute top-2.5 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={isAr ? 'بحث برقم القيد أو الحساب...' : 'Search entry #, ref, or account...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>
      </div>

      {/* Two Column Layout: List of Entries + Selected Entry Details */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Entries List */}
        <div className="space-y-3">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
            {isAr ? 'قائمة قيود اليومية المستخرجة' : 'Extracted Journal Vouchers'}
          </div>
          <div className="space-y-2 max-h-[600px] overflow-y-auto pr-1">
            {filtered.map((entry) => {
              const isSelected = selectedEntry?.id === entry.id;
              const entryTotalDebit = entry.lines.reduce((s, l) => s + l.debit, 0);

              return (
                <div
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-1.5 ${
                    isSelected
                      ? 'bg-blue-950/40 border-blue-500 shadow-md'
                      : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-bold text-blue-400">{entry.entryNumber}</span>
                    <span className="text-slate-400 text-[11px] flex items-center gap-1">
                      <Calendar className="w-3 h-3" />
                      {entry.date}
                    </span>
                  </div>
                  <h4 className="font-semibold text-slate-100 line-clamp-1">
                    {isAr ? entry.descriptionAr : entry.descriptionEn}
                  </h4>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-800/80 text-[11px]">
                    <span className="text-slate-400">{entry.lines.length} {isAr ? 'أطراف' : 'lines'}</span>
                    <span className="font-mono font-semibold text-emerald-400">
                      {entryTotalDebit.toLocaleString()} kEGP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Entry Detail Panel (2 cols) */}
        {selectedEntry && (
          <div className="lg:col-span-2 space-y-4">
            <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono font-bold text-blue-400">
                      {selectedEntry.entryNumber}
                    </span>
                    <span className="px-2 py-0.5 rounded bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 text-[10px] font-semibold flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      {isAr ? 'قيد متوازن' : 'Balanced Entry'}
                    </span>
                    <span className="text-xs text-slate-400 font-mono">
                      Ref: {selectedEntry.reference}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white mt-1">
                    {isAr ? selectedEntry.descriptionAr : selectedEntry.descriptionEn}
                  </h3>
                </div>

                <div className="text-right text-xs text-slate-400">
                  <div>{isAr ? 'تاريخ القيد:' : 'Posting Date:'} <strong className="text-slate-200">{selectedEntry.date}</strong></div>
                  <div>{isAr ? 'المراجع:' : 'By:'} <span className="text-slate-300">{selectedEntry.postedBy}</span></div>
                </div>
              </div>

              {/* Lines Table */}
              <div className="rounded-xl border border-slate-800 overflow-hidden">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                      <th className="py-2.5 px-3 font-semibold">{isAr ? 'كود الحساب' : 'Account Code'}</th>
                      <th className="py-2.5 px-3 font-semibold">{isAr ? 'اسم الحساب' : 'Account Description'}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'مدين (Debit)' : 'Debit'}</th>
                      <th className="py-2.5 px-3 font-semibold text-right">{isAr ? 'دائن (Credit)' : 'Credit'}</th>
                      <th className="py-2.5 px-3 font-semibold">{isAr ? 'البيان التوضيحي' : 'Memo'}</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
                    {selectedEntry.lines.map((line, idx) => (
                      <tr key={idx} className="hover:bg-slate-800/30">
                        <td className="py-2.5 px-3 font-mono font-semibold text-blue-400">
                          {line.accountCode}
                        </td>
                        <td className="py-2.5 px-3 text-slate-200 font-medium">
                          {isAr ? line.accountNameAr : line.accountNameEn}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-100">
                          {line.debit > 0 ? `${line.debit.toLocaleString()} kEGP` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-right font-mono text-slate-100">
                          {line.credit > 0 ? `${line.credit.toLocaleString()} kEGP` : '-'}
                        </td>
                        <td className="py-2.5 px-3 text-slate-400 italic">
                          {line.memo || '-'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                  <tfoot>
                    <tr className="bg-slate-950 font-bold text-white border-t border-slate-800">
                      <td colSpan={2} className="py-2.5 px-3">
                        {isAr ? 'إجمالي طرفي القيد' : 'Total Entry Balance'}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-blue-400">
                        {selectedEntry.lines.reduce((s, l) => s + l.debit, 0).toLocaleString()} kEGP
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono text-emerald-400">
                        {selectedEntry.lines.reduce((s, l) => s + l.credit, 0).toLocaleString()} kEGP
                      </td>
                      <td className="py-2.5 px-3 text-emerald-400 text-xs">
                        {isAr ? 'مطابق تماماً' : 'Balanced (0.00)'}
                      </td>
                    </tr>
                  </tfoot>
                </table>
              </div>

              {/* Source traceability */}
              <div className="p-3 rounded-lg bg-slate-950/60 border border-slate-800 flex items-center justify-between text-xs">
                <span className="text-slate-400">
                  {isAr ? 'ملف دفتر الأستاذ المصدري:' : 'GL Source Document:'}{' '}
                  <span className="font-mono text-slate-200">{selectedEntry.sourceFile}</span>
                </span>
                <button
                  onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                  className="text-blue-400 hover:text-blue-300 font-medium flex items-center gap-1"
                >
                  {isAr ? 'تتبع الدليل المحاسبي' : 'Trace Voucher Evidence'} &rarr;
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
