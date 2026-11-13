import React, { useState } from 'react';
import {
  TranslationConcept,
  OutputLanguage,
  AccountingFramework
} from '../../types/accounting';
import {
  INITIAL_ACCOUNTING_DICTIONARY,
  getLocalizedTerm
} from '../../data/accountingDictionary';
import {
  Languages,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Check,
  Edit2,
  Plus,
  Download,
  Upload,
  BookOpen,
  ArrowRight,
  ShieldCheck,
  Globe
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  language: OutputLanguage;
  framework: AccountingFramework;
  onFrameworkChange: (fw: AccountingFramework) => void;
  onLanguageChange: (lang: OutputLanguage) => void;
}

export const TranslationCenterView: React.FC<Props> = ({
  language,
  framework,
  onFrameworkChange,
  onLanguageChange
}) => {
  const isAr = language === 'ar';
  const [dictionary, setDictionary] = useState<TranslationConcept[]>(INITIAL_ACCOUNTING_DICTIONARY);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [editingConceptId, setEditingConceptId] = useState<string | null>(null);
  const [customTermModalOpen, setCustomTermModalOpen] = useState(false);

  // New Term Form
  const [newConceptKey, setNewConceptKey] = useState('');
  const [newTermEn, setNewTermEn] = useState('');
  const [newTermAr, setNewTermAr] = useState('');
  const [newEasAr, setNewEasAr] = useState('');
  const [newIfrsAr, setNewIfrsAr] = useState('');
  const [newCategory, setNewCategory] = useState('Current Assets');

  const filtered = dictionary.filter((item) => {
    const matchesSearch =
      item.termEn.toLowerCase().includes(search.toLowerCase()) ||
      item.termAr.includes(search) ||
      item.easPreferredAr.includes(search) ||
      item.ifrsPreferredAr.includes(search) ||
      item.synonymsEn.some((s) => s.toLowerCase().includes(search.toLowerCase())) ||
      item.synonymsAr.some((s) => s.includes(search));

    const matchesCat = categoryFilter === 'all' || item.category === categoryFilter;
    return matchesSearch && matchesCat;
  });

  const handleApprove = (id: string) => {
    setDictionary(
      dictionary.map((d) => (d.id === id ? { ...d, approvalStatus: 'approved' } : d))
    );
  };

  const handleAddNewTerm = () => {
    if (!newTermEn || !newTermAr) return;
    const newConcept: TranslationConcept = {
      id: `CUSTOM-${Date.now().toString().slice(-4)}`,
      conceptKey: newConceptKey || newTermEn.toLowerCase().replace(/\s+/g, '_'),
      termEn: newTermEn,
      termAr: newTermAr,
      easPreferredEn: newTermEn,
      easPreferredAr: newEasAr || newTermAr,
      ifrsPreferredEn: newTermEn,
      ifrsPreferredAr: newIfrsAr || newTermAr,
      synonymsEn: [],
      synonymsAr: [],
      category: newCategory,
      definitionEn: 'Custom user-defined accounting concept.',
      definitionAr: 'مصطلح محاسبي مخصص معرف من قبل المستخدم.',
      relevantFramework: 'Both',
      approvalStatus: 'custom',
      updatedAt: new Date().toISOString().split('T')[0]
    };
    setDictionary([newConcept, ...dictionary]);
    setCustomTermModalOpen(false);
    setNewTermEn('');
    setNewTermAr('');
    setNewEasAr('');
    setNewIfrsAr('');
  };

  const exportGlossaryExcel = () => {
    const data = dictionary.map((d) => ({
      ID: d.id,
      Key: d.conceptKey,
      'Standard English': d.termEn,
      'Standard Arabic': d.termAr,
      'EAS Preferred (Ar)': d.easPreferredAr,
      'EAS Preferred (En)': d.easPreferredEn,
      'IFRS Preferred (Ar)': d.ifrsPreferredAr,
      'IFRS Preferred (En)': d.ifrsPreferredEn,
      Category: d.category,
      Status: d.approvalStatus,
      'English Definition': d.definitionEn,
      'Arabic Definition': d.definitionAr
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Accounting_Glossary');
    XLSX.writeFile(wb, 'Ledger_IQ_Bilingual_Accounting_Dictionary.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              {isAr ? 'المحرك المركزي للمصطلحات المحاسبية' : 'Statutory Translation & Localization Engine'}
            </span>
            <span className="text-xs text-slate-400">
              {dictionary.length} {isAr ? 'مفهوم محاسبي معتمد' : 'Standard Accounting Concepts'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Languages className="w-6 h-6 text-blue-400" />
            {isAr ? 'مركز الترجمة المحاسبية ومعجم المصطلحات (EAS / IFRS)' : 'Accounting Translation Center & Terminology Governance'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'فصل معايير المحاسبة (المصرية EAS مقابل الدولية IFRS) تماماً عن لغة العرض. يضمن ترجمة مسميات الحسابات والقوائم بألفاظ مهنية معتمدة دون المساس برموز الحسابات أو القيم العددية.'
              : 'Decoupling accounting standard (EAS vs IFRS) from display language (Arabic, English, Bilingual). Preserves exact account numbers and balances while standardizing terms.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setCustomTermModalOpen(true)}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Plus className="w-4 h-4" />
            {isAr ? 'إضافة مصطلح محاسبي جديد' : 'Add Custom Term'}
          </button>
          <button
            onClick={exportGlossaryExcel}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4 text-emerald-400" />
            {isAr ? 'تصدير المعجم' : 'Export Glossary'}
          </button>
        </div>
      </div>

      {/* Core Principle 4.1: Framework & Language Decoupling Control */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-blue-950/30 via-slate-900 to-slate-900 border border-blue-900/40 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <ShieldCheck className="w-4 h-4 text-blue-400" />
            <span>{isAr ? '1. الإطار المحاسبي المطبق (Accounting Framework)' : '1. Statutory Accounting Framework'}</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {isAr
              ? 'يحدد السياسات المحاسبية والقواعد والتبويبات والإفصاحات (EAS أو IFRS) بصورة مستقلة عن لغة الشاشة.'
              : 'Dictates accounting recognition, valuation rules, and disclosures independently of display language.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onFrameworkChange('EAS')}
              className={`px-4 py-2 rounded-xl font-bold transition border ${
                framework === 'EAS'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isAr ? 'معايير المحاسبة المصرية (EAS)' : 'Egyptian Accounting Standards (EAS)'}
            </button>
            <button
              onClick={() => onFrameworkChange('IFRS')}
              className={`px-4 py-2 rounded-xl font-bold transition border ${
                framework === 'IFRS'
                  ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              {isAr ? 'المعايير الدولية (IFRS)' : 'International Standards (IFRS)'}
            </button>
          </div>
        </div>

        <div className="space-y-2">
          <div className="flex items-center gap-2 text-slate-300 font-bold">
            <Globe className="w-4 h-4 text-emerald-400" />
            <span>{isAr ? '2. لغة المخرجات والتقارير (Output Language)' : '2. Output & Reporting Language'}</span>
          </div>
          <p className="text-slate-400 text-[11px]">
            {isAr
              ? 'تغيير لغة العرض يترجم المسميات والقوائم دون تغيير الأرقام أو المعالجة المحاسبية المعتمدة.'
              : 'Switches terminology and UI language without affecting underlying accounting entries or formulas.'}
          </p>
          <div className="flex items-center gap-2 pt-1">
            <button
              onClick={() => onLanguageChange('ar')}
              className={`px-3 py-2 rounded-xl font-bold transition border ${
                language === 'ar'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              العربية (Arabic)
            </button>
            <button
              onClick={() => onLanguageChange('en')}
              className={`px-3 py-2 rounded-xl font-bold transition border ${
                language === 'en'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              English
            </button>
            <button
              onClick={() => onLanguageChange('bilingual')}
              className={`px-3 py-2 rounded-xl font-bold transition border ${
                language === 'bilingual'
                  ? 'bg-emerald-600 text-white border-emerald-500 shadow-md'
                  : 'bg-slate-950 text-slate-400 border-slate-800'
              }`}
            >
              Bilingual (مزدوج عربي/إنجليزي)
            </button>
          </div>
        </div>
      </div>

      {/* Search and Category Filter */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full sm:w-96">
          <Search className={`w-4 h-4 absolute top-2.5 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={isAr ? 'بحث في المعجم بالمصطلح العربي أو الإنجليزي أو المرادفات...' : 'Search dictionary by concept, English, Arabic, or synonyms...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-xs text-slate-200 focus:outline-none focus:border-blue-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <select
          value={categoryFilter}
          onChange={(e) => setCategoryFilter(e.target.value)}
          className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-2 text-xs w-full sm:w-auto"
        >
          <option value="all">{isAr ? 'كافة التصنيفات' : 'All Categories'}</option>
          <option value="Current Assets">Current Assets (الأصول المتداولة)</option>
          <option value="Non-current Assets">Non-current Assets (الأصول غير المتداولة)</option>
          <option value="Current Liabilities">Current Liabilities (الالتزامات المتداولة)</option>
          <option value="Equity">Equity (حقوق الملكية)</option>
          <option value="Income Statement">Income Statement (قائمة الدخل)</option>
          <option value="Cash Flow">Cash Flow (التدفقات النقدية)</option>
        </select>
      </div>

      {/* Terminology Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3 font-semibold">{isAr ? 'المفهوم المحاسبي' : 'Accounting Concept'}</th>
                <th className="py-3 px-3 font-semibold">{isAr ? 'المصطلح المفضل بمعايير مصر (EAS)' : 'EAS Preferred Terminology'}</th>
                <th className="py-3 px-3 font-semibold">{isAr ? 'المصطلح المفضل بالمعايير الدولية (IFRS)' : 'IFRS Preferred Terminology'}</th>
                <th className="py-3 px-3 font-semibold">{isAr ? 'المرادفات الشائعة بالدفاتر' : 'Accepted GL Synonyms'}</th>
                <th className="py-3 px-3 font-semibold text-center">{isAr ? 'الحالة' : 'Approval'}</th>
                <th className="py-3 px-3 text-right">{isAr ? 'الإجراء' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {filtered.map((concept) => (
                <tr key={concept.id} className="hover:bg-slate-800/40 transition">
                  <td className="py-3 px-3">
                    <div className="font-bold text-white text-sm">{concept.termEn}</div>
                    <div className="text-emerald-400 font-medium">{concept.termAr}</div>
                    <div className="text-[10px] text-slate-500 font-mono mt-0.5">{concept.conceptKey} • {concept.category}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-semibold text-blue-300">{concept.easPreferredAr}</div>
                    <div className="text-[11px] text-slate-400">{concept.easPreferredEn}</div>
                  </td>
                  <td className="py-3 px-3 text-slate-200">
                    <div className="font-semibold text-purple-300">{concept.ifrsPreferredAr}</div>
                    <div className="text-[11px] text-slate-400">{concept.ifrsPreferredEn}</div>
                  </td>
                  <td className="py-3 px-3">
                    <div className="flex flex-wrap gap-1">
                      {concept.synonymsAr.concat(concept.synonymsEn).slice(0, 4).map((s, idx) => (
                        <span key={idx} className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
                          {s}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="py-3 px-3 text-center">
                    <span
                      className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${
                        concept.approvalStatus === 'approved'
                          ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                          : 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                      }`}
                    >
                      {concept.approvalStatus}
                    </span>
                  </td>
                  <td className="py-3 px-3 text-right">
                    {concept.approvalStatus !== 'approved' ? (
                      <button
                        onClick={() => handleApprove(concept.id)}
                        className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-medium transition"
                      >
                        {isAr ? 'اعتماد' : 'Approve'}
                      </button>
                    ) : (
                      <span className="text-emerald-400 text-xs font-semibold flex items-center justify-end gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        {isAr ? 'معتمد' : 'Verified'}
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal for adding custom term */}
      {customTermModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 p-4">
          <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 w-full max-w-lg space-y-4 text-xs">
            <h3 className="text-base font-bold text-white flex items-center gap-2">
              <Plus className="w-5 h-5 text-blue-400" />
              {isAr ? 'إضافة مصطلح محاسبي جديد إلى معجم الشركة' : 'Add Custom Company Accounting Term'}
            </h3>

            <div className="space-y-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المصطلح باللغة الإنجليزية' : 'English Term'}</label>
                <input
                  type="text"
                  value={newTermEn}
                  onChange={(e) => setNewTermEn(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  placeholder="e.g. Letters of Guarantee Margin"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المصطلح باللغة العربية' : 'Arabic Term'}</label>
                <input
                  type="text"
                  value={newTermAr}
                  onChange={(e) => setNewTermAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  placeholder="مثال: غطاء خطابات الضمان المصرفية"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'المصطلح المعتمد وفقاً لمعايير المحاسبة المصرية (EAS)' : 'EAS Preferred Arabic'}</label>
                <input
                  type="text"
                  value={newEasAr}
                  onChange={(e) => setNewEasAr(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                  placeholder="تأمين وودائع نقدية محتجزة لخطابات الضمان"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'التصنيف المحاسبي' : 'Category'}</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
                >
                  <option value="Current Assets">Current Assets</option>
                  <option value="Non-current Assets">Non-current Assets</option>
                  <option value="Current Liabilities">Current Liabilities</option>
                  <option value="Equity">Equity</option>
                  <option value="Income Statement">Income Statement</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setCustomTermModalOpen(false)}
                className="px-4 py-2 rounded-xl bg-slate-800 text-slate-300 hover:bg-slate-700"
              >
                {isAr ? 'إلغاء' : 'Cancel'}
              </button>
              <button
                onClick={handleAddNewTerm}
                className="px-4 py-2 rounded-xl bg-blue-600 text-white font-bold hover:bg-blue-500"
              >
                {isAr ? 'حفظ وإدراج بالمعجم' : 'Save Term'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
