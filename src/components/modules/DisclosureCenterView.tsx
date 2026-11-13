import React, { useState } from 'react';
import {
  DisclosureChecklistItem,
  OutputLanguage,
  AccountingFramework,
  CompanyEntity,
  EgyptianTaxRequirement,
  TaxVerificationStatus
} from '../../types/accounting';
import { EGYPTIAN_TAX_STATUTES } from '../../data/defaultCompanyData';
import { useEvidence } from '../../context/EvidenceContext';
import {
  FileCheck2,
  CheckCircle2,
  AlertTriangle,
  Download,
  ShieldCheck,
  BookOpen,
  ArrowRight,
  Edit2,
  Check,
  Scale,
  Calendar,
  Building,
  Receipt,
  FileSpreadsheet,
  Award,
  ExternalLink
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  checklist: DisclosureChecklistItem[];
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const DisclosureCenterView: React.FC<Props> = ({
  checklist,
  company,
  language,
  framework
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';

  const [activeTab, setActiveTab] = useState<'eas_notes' | 'egyptian_tax'>('eas_notes');
  const [items, setItems] = useState<DisclosureChecklistItem[]>(checklist);
  const [selectedItem, setSelectedItem] = useState<DisclosureChecklistItem | null>(items[0] || null);

  const [taxStatutes] = useState<EgyptianTaxRequirement[]>(EGYPTIAN_TAX_STATUTES);
  const [selectedTax, setSelectedTax] = useState<EgyptianTaxRequirement | null>(taxStatutes[0] || null);

  const handleMarkCompliant = (id: string) => {
    setItems(items.map((i) => (i.id === id ? { ...i, status: 'compliant' } : i)));
    if (selectedItem?.id === id) {
      setSelectedItem({ ...selectedItem, status: 'compliant' });
    }
  };

  const getVerificationBadge = (status: TaxVerificationStatus) => {
    switch (status) {
      case 'verified_statutory':
        return {
          labelEn: 'Verified Statutory Reference',
          labelAr: 'مرجع تشريعي معتمد',
          className: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40'
        };
      case 'mandatory_compliance':
        return {
          labelEn: 'Active Mandatory Compliance',
          labelAr: 'امتثال تشريعي إلزامي سارٍ',
          className: 'bg-blue-500/20 text-blue-300 border-blue-500/40'
        };
      case 'active_e_invoicing':
        return {
          labelEn: 'Audited & Certified Integration',
          labelAr: 'تكامل معتمد ومفحوص (الفاتورة الإلكترونية)',
          className: 'bg-purple-500/20 text-purple-300 border-purple-500/40'
        };
      case 'statutory_contribution':
        return {
          labelEn: 'Statutory Non-Deductible Contribution',
          labelAr: 'مساهمة قانونية غير واجبة الخصم',
          className: 'bg-amber-500/20 text-amber-300 border-amber-500/40'
        };
    }
  };

  const exportNotesExcel = () => {
    const data = items.map((i) => ({
      Standard: i.standardRef,
      Title: i.standardName,
      'Topic (English)': i.topicEn,
      'Topic (Arabic)': i.topicAr,
      Requirement: i.requirementEn,
      'Available Company Data': i.availableDataEn,
      Status: i.status,
      'Draft Note (English)': i.draftWordingEn,
      'Draft Note (Arabic)': i.draftWordingAr
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Financial_Statement_Notes');

    const taxData = taxStatutes.map((t) => ({
      'Tax Type': t.taxType,
      'Law Citation': t.lawCitation,
      'Article Ref': t.articleRef,
      'Effective Date': t.effectiveDate,
      'Official Source': t.officialSource,
      'Verification Status': t.verificationStatus,
      'Topic (English)': t.topicEn,
      'Topic (Arabic)': t.topicAr,
      'Rate or Rule (English)': t.rateOrRuleEn,
      'Rate or Rule (Arabic)': t.rateOrRuleAr,
      'Notes (English)': t.notesEn,
      'Notes (Arabic)': t.notesAr
    }));
    const wsTax = XLSX.utils.json_to_sheet(taxData);
    XLSX.utils.book_append_sheet(wb, wsTax, 'Egyptian_Tax_Statutes');

    XLSX.writeFile(wb, `Statutory_Disclosures_${framework}_Egypt.xlsx`);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {framework === 'EAS'
                ? (isAr ? 'معايير المحاسبة المصرية (EAS)' : 'Egyptian Accounting Standards (EAS)')
                : (isAr ? 'المعايير الدولية (IFRS)' : 'IFRS Foundation')}
            </span>
            <span className="text-xs text-slate-400 font-mono">
              {items.length} {isAr ? 'إيضاح مالي' : 'Notes'} • {taxStatutes.length} {isAr ? 'متطلب ضريبي رسمي' : 'Statutory Statutes'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <FileCheck2 className="w-6 h-6 text-blue-400" />
            {isAr ? 'مركز الإفصاحات وإعداد الإيضاحات والامتثال الضريبي' : 'EAS Disclosures & Egyptian Tax Statutory Compliance Studio'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'صياغة الإيضاحات المتممة للقوائم المالية وربطها بأرصدة الدفاتر، مع استعراض كامل للمتطلبات الضريبية المصرية ومصادرها الرسمية وتواريخ سريانها المعتمدة.'
              : 'Formulates financial statement disclosure notes linked to ledger balances and reviews official Egyptian tax statutes with verification labels and effective dates.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={exportNotesExcel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تصدير الإيضاحات والضرائب' : 'Export Disclosures & Tax'}
          </button>
        </div>
      </div>

      {/* Tab Switcher */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 text-xs">
        <button
          onClick={() => setActiveTab('eas_notes')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 border ${
            activeTab === 'eas_notes'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <BookOpen className="w-4 h-4" />
          {isAr ? 'الإيضاحات المتممة للقوائم (EAS / IFRS)' : 'Mandatory Financial Statement Notes (EAS/IFRS)'}
          <span className="px-1.5 py-0.2 rounded-full bg-blue-900/60 text-[10px] text-blue-200">
            {items.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('egyptian_tax')}
          className={`px-4 py-2 rounded-xl font-bold transition flex items-center gap-2 border ${
            activeTab === 'egyptian_tax'
              ? 'bg-blue-600 text-white border-blue-500 shadow-md'
              : 'bg-slate-900 text-slate-400 border-slate-800 hover:text-white'
          }`}
        >
          <Scale className="w-4 h-4 text-amber-400" />
          {isAr ? 'المتطلبات الضريبية المصرية الرسمية والمصادر المعتمدة' : 'Official Egyptian Tax Statutes & Citations'}
          <span className="px-1.5 py-0.2 rounded-full bg-amber-900/60 text-[10px] text-amber-200">
            {taxStatutes.length}
          </span>
        </button>
      </div>

      {/* TAB 1: EAS / IFRS Accounting Notes */}
      {activeTab === 'eas_notes' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Checklist */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {isAr ? 'قائمة الإفصاحات الإلزامية' : 'Mandatory Disclosures Checklist'}
            </div>

            <div className="space-y-2">
              {items.map((item) => {
                const isSelected = selectedItem?.id === item.id;
                const isCompliant = item.status === 'compliant';

                return (
                  <div
                    key={item.id}
                    onClick={() => setSelectedItem(item)}
                    className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-1.5 ${
                      isSelected
                        ? 'bg-blue-950/40 border-blue-500 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-mono font-bold text-blue-400">{item.standardRef}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          isCompliant
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {isCompliant ? (isAr ? 'مستوفى' : 'Compliant') : (isAr ? 'يتطلب مراجعة' : 'Review')}
                      </span>
                    </div>
                    <h4 className="font-semibold text-slate-100">
                      {isAr ? item.topicAr : item.topicEn}
                    </h4>
                    <p className="text-[11px] text-slate-400 line-clamp-1">{item.standardName}</p>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Note Draft and Details (2 cols) */}
          {selectedItem && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-mono font-bold text-blue-400">
                        {selectedItem.standardRef}
                      </span>
                      <span className="text-xs text-slate-400">
                        {selectedItem.standardName}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-white mt-1">
                      {isAr ? selectedItem.topicAr : selectedItem.topicEn}
                    </h3>
                  </div>

                  <div className="flex items-center gap-2">
                    {selectedItem.status !== 'compliant' ? (
                      <button
                        onClick={() => handleMarkCompliant(selectedItem.id)}
                        className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs flex items-center gap-1.5 transition"
                      >
                        <Check className="w-4 h-4" />
                        {isAr ? 'اعتماد كإيضاح مستوفى' : 'Mark as Compliant'}
                      </button>
                    ) : (
                      <span className="px-3 py-1 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-xs font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-4 h-4" />
                        {isAr ? 'إيضاح معتمد بالقوائم' : 'Approved Note'}
                      </span>
                    )}
                  </div>
                </div>

                {/* Requirement Box */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1.5 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                    {isAr ? 'متطلب المعيار المحاسبي الإلزامي:' : 'Mandatory Standard Requirement:'}
                  </span>
                  <p className="text-slate-200 leading-relaxed font-medium">
                    {isAr ? selectedItem.requirementAr : selectedItem.requirementEn}
                  </p>
                </div>

                {/* Available Company Balances */}
                <div className="p-4 rounded-xl bg-blue-950/20 border border-blue-900/40 space-y-1 text-xs">
                  <span className="font-bold text-blue-300 uppercase tracking-wider text-[10px]">
                    {isAr ? 'البيانات والأرصدة المستخلصة من الدفاتر:' : 'Extracted Ledger Data & Evidence:'}
                  </span>
                  <p className="text-slate-200 leading-relaxed">
                    {isAr ? selectedItem.availableDataAr : selectedItem.availableDataEn}
                  </p>
                </div>

                {/* Draft Note Text in Arabic and English */}
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-white uppercase tracking-wider">
                      {isAr ? 'مسودة نص الإيضاح المتمم (صيغة مهنية معتمدة):' : 'Draft Note to Financial Statements:'}
                    </span>
                    <span className="text-slate-400 font-mono text-[11px]">Bilingual Draft</span>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                    <div>
                      <span className="text-[10px] text-blue-400 uppercase font-bold block mb-1">
                        {isAr ? 'النص باللغة العربية (المفضل محلياً):' : 'Arabic Statutory Wording:'}
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans text-sm p-3 bg-slate-900/60 rounded border border-slate-800">
                        {selectedItem.draftWordingAr}
                      </p>
                    </div>

                    <div>
                      <span className="text-[10px] text-emerald-400 uppercase font-bold block mb-1">
                        {isAr ? 'النص باللغة الإنجليزية (للمستثمرين والمراجع الخارجي):' : 'English Wording:'}
                      </span>
                      <p className="text-slate-200 leading-relaxed font-sans text-sm p-3 bg-slate-900/60 rounded border border-slate-800">
                        {selectedItem.draftWordingEn}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Auditor Trace Button */}
                <div className="flex justify-between items-center pt-2 text-xs">
                  <span className="text-slate-400 italic">
                    {isAr ? '* تم صياغة الإيضاح طبقاً لأحدث معايير المحاسبة المصرية السارية' : '* Prepared under currently active Egyptian Accounting Standards'}
                  </span>
                  <button
                    onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                    className="text-blue-400 hover:text-blue-300 font-semibold"
                  >
                    {isAr ? 'فحص أدلة أرقام الإيضاح' : 'Verify Balances Evidence'} &rarr;
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* TAB 2: Egyptian Tax Statutory Requirements & Verification Statuses */}
      {activeTab === 'egyptian_tax' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Statutes List */}
          <div className="space-y-3">
            <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider px-1">
              {isAr ? 'التشريعات والقوانين الضريبية المصرية' : 'Egyptian Tax Statutes'}
            </div>

            <div className="space-y-2">
              {taxStatutes.map((statute) => {
                const isSelected = selectedTax?.id === statute.id;
                const badge = getVerificationBadge(statute.verificationStatus);

                return (
                  <div
                    key={statute.id}
                    onClick={() => setSelectedTax(statute)}
                    className={`p-4 rounded-xl border cursor-pointer transition text-xs space-y-2 ${
                      isSelected
                        ? 'bg-amber-950/30 border-amber-500 shadow-md'
                        : 'bg-slate-900/80 border-slate-800 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono font-bold text-amber-400 text-[11px]">
                        {statute.lawCitation.split('(')[0].trim()}
                      </span>
                    </div>

                    <h4 className="font-semibold text-slate-100">
                      {isAr ? statute.topicAr : statute.topicEn}
                    </h4>

                    <span
                      className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold border ${badge.className}`}
                    >
                      {isAr ? badge.labelAr : badge.labelEn}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Statute Detailed Citation & Verification View */}
          {selectedTax && (
            <div className="lg:col-span-2 space-y-4">
              <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-6">
                {/* Header */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800">
                  <div>
                    <div className="flex flex-wrap items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30">
                        {selectedTax.articleRef}
                      </span>

                      {/* Verification Status Label */}
                      {(() => {
                        const badge = getVerificationBadge(selectedTax.verificationStatus);
                        return (
                          <span
                            className={`px-2.5 py-0.5 rounded text-[10px] font-bold uppercase border flex items-center gap-1 ${badge.className}`}
                          >
                            <ShieldCheck className="w-3 h-3" />
                            {isAr ? badge.labelAr : badge.labelEn}
                          </span>
                        );
                      })()}
                    </div>

                    <h3 className="text-lg font-bold text-white mt-1">
                      {isAr ? selectedTax.topicAr : selectedTax.topicEn}
                    </h3>
                  </div>
                </div>

                {/* 3 Citation Details Cards */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                      <Scale className="w-3.5 h-3.5 text-amber-400" />
                      {isAr ? 'السند والتشريع القانوني:' : 'Statutory Law Citation:'}
                    </span>
                    <span className="font-semibold text-slate-200 block">
                      {selectedTax.lawCitation}
                    </span>
                    <span className="text-[11px] text-amber-300/90 font-mono block">
                      {selectedTax.articleRef}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                      <Calendar className="w-3.5 h-3.5 text-blue-400" />
                      {isAr ? 'تاريخ السريان والجريدة الرسمية:' : 'Effective Date & Publication:'}
                    </span>
                    <span className="font-semibold text-slate-200 block">
                      {selectedTax.effectiveDate}
                    </span>
                  </div>

                  <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 space-y-1">
                    <span className="text-[10px] uppercase font-bold text-slate-400 block flex items-center gap-1">
                      <Building className="w-3.5 h-3.5 text-emerald-400" />
                      {isAr ? 'المصدر والجهة الإدارية الرسمية:' : 'Official Regulatory Source:'}
                    </span>
                    <span className="font-semibold text-slate-200 block">
                      {selectedTax.officialSource}
                    </span>
                  </div>
                </div>

                {/* Rate or Statutory Rule in Arabic & English */}
                <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-3 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    {isAr ? 'سعر الضريبة والقاعدة الحسابية المعتمدة:' : 'Statutory Tax Rate & Calculation Rule:'}
                  </span>

                  <div>
                    <span className="text-[10px] text-amber-400 font-bold block mb-1">
                      {isAr ? 'الصيغة باللغة العربية:' : 'Arabic Statute Rule:'}
                    </span>
                    <p className="text-slate-200 leading-relaxed font-sans text-sm p-3 bg-slate-900/60 rounded border border-slate-800">
                      {selectedTax.rateOrRuleAr}
                    </p>
                  </div>

                  <div>
                    <span className="text-[10px] text-blue-400 font-bold block mb-1">
                      {isAr ? 'الصيغة باللغة الإنجليزية:' : 'English Statute Rule:'}
                    </span>
                    <p className="text-slate-200 leading-relaxed font-sans text-sm p-3 bg-slate-900/60 rounded border border-slate-800">
                      {selectedTax.rateOrRuleEn}
                    </p>
                  </div>
                </div>

                {/* Audit & Compliance Practice Notes */}
                <div className="p-4 rounded-xl bg-slate-950/70 border border-slate-800 space-y-2 text-xs">
                  <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px] block">
                    {isAr ? 'إرشادات الفحص والامتثال الضريبي والمستندي:' : 'Audit Examination & Tax Filing Notes:'}
                  </span>
                  <p className="text-slate-300 leading-relaxed">
                    {isAr ? selectedTax.notesAr : selectedTax.notesEn}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
