import React, { useState } from 'react';
import {
  AccountRow,
  AccountCategory,
  FinancialStatementType,
  OutputLanguage,
  AccountingFramework
} from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  Layers,
  CheckCircle2,
  AlertTriangle,
  Search,
  Filter,
  Check,
  RotateCcw,
  Sliders,
  ChevronDown,
  Edit2,
  ShieldCheck,
  History
} from 'lucide-react';

interface Props {
  accounts: AccountRow[];
  language: OutputLanguage;
  framework: AccountingFramework;
  onUpdateAccountMapping: (updatedAccounts: AccountRow[]) => void;
  onProceedToStatements: () => void;
}

export const AccountMapping: React.FC<Props> = ({
  accounts,
  language,
  onUpdateAccountMapping,
  onProceedToStatements
}) => {
  const { openEvidence } = useEvidence();
  const isAr = language === 'ar';

  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [filterConfidence, setFilterConfidence] = useState<string>('all'); // all, low (<0.90), high (>=0.90)
  const [filterStatus, setFilterStatus] = useState<string>('all'); // auto, confirmed, overridden
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [localAccounts, setLocalAccounts] = useState<AccountRow[]>(accounts);
  const [editingAccountId, setEditingAccountId] = useState<string | null>(null);

  const availableCategories: AccountCategory[] = [
    'Cash & Cash Equivalents',
    'Trade & Other Receivables',
    'Inventory',
    'Prepayments & Current Assets',
    'Property, Plant & Equipment',
    'Accumulated Depreciation',
    'Intangible Assets',
    'Right-of-Use Assets',
    'Trade & Other Payables',
    'Short-term Borrowings',
    'Current Lease Liabilities',
    'Accrued Expenses & Provisions',
    'Long-term Borrowings',
    'Non-current Lease Liabilities',
    'Deferred Tax Liabilities',
    'Share Capital',
    'Legal & Statutory Reserves',
    'General & Other Reserves',
    'Retained Earnings',
    'Revenue',
    'Cost of Sales',
    'Selling & Distribution Expenses',
    'General & Administrative Expenses',
    'Depreciation & Amortization',
    'Finance Income',
    'Finance Costs',
    'Other Operating Income/Expense',
    'Income Tax Expense',
    'Suspense & Unclassified'
  ];

  // Filtering
  const filteredAccounts = localAccounts.filter((acc) => {
    const matchesSearch =
      acc.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.nameOriginal.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.nameEn.toLowerCase().includes(searchQuery.toLowerCase()) ||
      acc.nameAr.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = filterCategory === 'all' || acc.category === filterCategory;

    const matchesConfidence =
      filterConfidence === 'all' ||
      (filterConfidence === 'low' && acc.confidence < 0.90) ||
      (filterConfidence === 'high' && acc.confidence >= 0.90);

    const matchesStatus =
      filterStatus === 'all' || acc.mappingStatus === filterStatus;

    return matchesSearch && matchesCategory && matchesConfidence && matchesStatus;
  });

  const handleConfirmSingle = (id: string) => {
    const updated = localAccounts.map((a) =>
      a.id === id ? { ...a, mappingStatus: 'confirmed' as const, confidence: 1.0 } : a
    );
    setLocalAccounts(updated);
    onUpdateAccountMapping(updated);
  };

  const handleConfirmAllSelected = () => {
    const updated = localAccounts.map((a) =>
      selectedIds.includes(a.id) ? { ...a, mappingStatus: 'confirmed' as const, confidence: 1.0 } : a
    );
    setLocalAccounts(updated);
    onUpdateAccountMapping(updated);
    setSelectedIds([]);
  };

  const handleConfirmAll = () => {
    const updated = localAccounts.map((a) => ({
      ...a,
      mappingStatus: 'confirmed' as const,
      confidence: 1.0
    }));
    setLocalAccounts(updated);
    onUpdateAccountMapping(updated);
  };

  const handleUpdateCategory = (id: string, newCategory: AccountCategory) => {
    let newFs: FinancialStatementType = 'BS';
    if (
      [
        'Revenue',
        'Cost of Sales',
        'Selling & Distribution Expenses',
        'General & Administrative Expenses',
        'Depreciation & Amortization',
        'Finance Income',
        'Finance Costs',
        'Other Operating Income/Expense',
        'Income Tax Expense'
      ].includes(newCategory)
    ) {
      newFs = 'IS';
    }

    const updated = localAccounts.map((a) =>
      a.id === id
        ? {
            ...a,
            category: newCategory,
            fsStatement: newFs,
            mappingStatus: 'overridden' as const,
            confidence: 1.0
          }
        : a
    );
    setLocalAccounts(updated);
    onUpdateAccountMapping(updated);
    setEditingAccountId(null);
  };

  const confirmedCount = localAccounts.filter((a) => a.mappingStatus === 'confirmed').length;
  const overriddenCount = localAccounts.filter((a) => a.mappingStatus === 'overridden').length;
  const pendingCount = localAccounts.filter((a) => a.mappingStatus === 'auto').length;

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'خطوة إلزامية لاعتماد القوائم' : 'Mandatory Reporting Gate'}
            </span>
            <span className="text-xs text-slate-400">
              {localAccounts.length} {isAr ? 'حساب في الدليل' : 'Accounts in Chart'}
            </span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Layers className="w-6 h-6 text-blue-400" />
            {isAr ? 'محرك وشاشة مراجعة واعتماد التبويب المحاسبي' : 'Review & Confirm Account Mapping Studio'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'مراجعة وتأكيد تصنيف كل حساب إلى البند المالي المعتمد (المركز المالي، الدخل، التدفق النقدي). لن يتم تمرير أي حساب ذو ثقة منخفضة دون تدقيقك.'
              : 'Audit and approve the mapping of each GL account into standardized reporting taxonomies (BS, IS, CF). Low-confidence mappings require manual confirmation.'}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {selectedIds.length > 0 && (
            <button
              onClick={handleConfirmAllSelected}
              className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
            >
              <Check className="w-4 h-4" />
              {isAr ? `اعتماد المحدد (${selectedIds.length})` : `Confirm Selected (${selectedIds.length})`}
            </button>
          )}
          <button
            onClick={handleConfirmAll}
            className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold shadow-lg shadow-emerald-600/20 flex items-center gap-1.5 transition"
          >
            <ShieldCheck className="w-4 h-4" />
            {isAr ? 'اعتماد كافة الحسابات المقترحة' : 'Approve All Mappings'}
          </button>
          <button
            onClick={onProceedToStatements}
            className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold flex items-center gap-1.5 transition"
          >
            {isAr ? 'عرض القوائم المالية' : 'View Statements'} &rarr;
          </button>
        </div>
      </div>

      {/* Progress & Status Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block">{isAr ? 'إجمالي الحسابات' : 'Total Accounts'}</span>
          <span className="text-xl font-bold font-mono text-white mt-1 block">
            {localAccounts.length}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block">{isAr ? 'معتمد ومؤكد' : 'Confirmed'}</span>
          <span className="text-xl font-bold font-mono text-emerald-400 mt-1 block">
            {confirmedCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block">{isAr ? 'معدل يدوياً (معدل)' : 'Overridden'}</span>
          <span className="text-xl font-bold font-mono text-blue-400 mt-1 block">
            {overriddenCount}
          </span>
        </div>
        <div className="p-3.5 rounded-xl bg-slate-900 border border-slate-800">
          <span className="text-slate-400 block">{isAr ? 'مقترح آلي (بانتظار التأكيد)' : 'Pending Review'}</span>
          <span className="text-xl font-bold font-mono text-amber-400 mt-1 block">
            {pendingCount}
          </span>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 flex flex-col md:flex-row gap-3 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className={`w-4 h-4 absolute top-3 text-slate-400 ${isAr ? 'right-3' : 'left-3'}`} />
          <input
            type="text"
            placeholder={isAr ? 'بحث بالكود أو الاسم العربي أو الإنجليزي...' : 'Search by code, Arabic, or English name...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className={`w-full bg-slate-950 border border-slate-800 rounded-xl py-2 text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-blue-500 ${
              isAr ? 'pr-9 pl-3' : 'pl-9 pr-3'
            }`}
          />
        </div>

        <div className="flex flex-wrap items-center gap-2 w-full md:w-auto text-xs">
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">{isAr ? 'كافة التصنيفات المحاسبية' : 'All Categories'}</option>
            {availableCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>

          <select
            value={filterConfidence}
            onChange={(e) => setFilterConfidence(e.target.value)}
            className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">{isAr ? 'كافة مستويات الثقة' : 'All Confidence Levels'}</option>
            <option value="high">{isAr ? 'ثقة عالية (>= 90%)' : 'High (>= 90%)'}</option>
            <option value="low">{isAr ? 'ثقة تتطلب مراجعة (< 90%)' : 'Needs Review (< 90%)'}</option>
          </select>

          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="bg-slate-950 text-slate-300 rounded-lg border border-slate-800 px-3 py-2 text-xs focus:outline-none focus:border-blue-500"
          >
            <option value="all">{isAr ? 'كافة حالات الاعتماد' : 'All Mapping Statuses'}</option>
            <option value="confirmed">{isAr ? 'معتمد (Confirmed)' : 'Confirmed'}</option>
            <option value="auto">{isAr ? 'مقترح آلي (Auto)' : 'Auto Suggested'}</option>
            <option value="overridden">{isAr ? 'معدل يدوياً (Overridden)' : 'Overridden'}</option>
          </select>
        </div>
      </div>

      {/* Main Mapping Table */}
      <div className="rounded-2xl border border-slate-800 bg-slate-900 overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead>
              <tr className="bg-slate-950 text-slate-400 border-b border-slate-800">
                <th className="py-3 px-3 w-8">
                  <input
                    type="checkbox"
                    checked={selectedIds.length === filteredAccounts.length && filteredAccounts.length > 0}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedIds(filteredAccounts.map((a) => a.id));
                      } else {
                        setSelectedIds([]);
                      }
                    }}
                    className="rounded bg-slate-900 border-slate-700 text-blue-600"
                  />
                </th>
                <th className="py-3 px-3 font-semibold">{isAr ? 'كود الحساب' : 'Account Code'}</th>
                <th className="py-3 px-3 font-semibold">{isAr ? 'اسم الحساب المصدري' : 'Source Account Name'}</th>
                <th className="py-3 px-3 font-semibold text-center">{isAr ? 'القائمة' : 'Statement'}</th>
                <th className="py-3 px-3 font-semibold text-center">{isAr ? 'الطبيعة' : 'Nature'}</th>
                <th className="py-3 px-3 font-semibold">{isAr ? 'التبويب المقترح / المعتمد' : 'Assigned Taxonomy'}</th>
                <th className="py-3 px-3 font-semibold text-center">{isAr ? 'الثقة' : 'Confidence'}</th>
                <th className="py-3 px-3 font-semibold text-center">{isAr ? 'الحالة' : 'Status'}</th>
                <th className="py-3 px-3 font-semibold text-right">{isAr ? 'الإجراء' : 'Actions'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 bg-slate-900/60">
              {filteredAccounts.map((acc) => {
                const isSelected = selectedIds.includes(acc.id);
                const isEditing = editingAccountId === acc.id;

                return (
                  <tr key={acc.id} className="hover:bg-slate-800/40 transition">
                    <td className="py-2.5 px-3">
                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setSelectedIds([...selectedIds, acc.id]);
                          } else {
                            setSelectedIds(selectedIds.filter((id) => id !== acc.id));
                          }
                        }}
                        className="rounded bg-slate-900 border-slate-700 text-blue-600"
                      />
                    </td>
                    <td className="py-2.5 px-3 font-mono font-semibold text-blue-400">
                      {acc.code}
                    </td>
                    <td className="py-2.5 px-3">
                      <div className="font-medium text-slate-100">{acc.nameOriginal}</div>
                      <div className="text-[10px] text-slate-400 font-sans">
                        {isAr ? acc.nameEn : acc.nameAr}
                      </div>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span className="px-2 py-0.5 rounded font-mono text-[10px] bg-slate-800 text-slate-300 border border-slate-700">
                        {acc.fsStatement}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-1.5 py-0.5 rounded font-mono text-[10px] uppercase ${
                          acc.nature === 'debit'
                            ? 'text-blue-300 bg-blue-950/40'
                            : 'text-emerald-300 bg-emerald-950/40'
                        }`}
                      >
                        {acc.nature}
                      </span>
                    </td>
                    <td className="py-2.5 px-3">
                      {isEditing ? (
                        <select
                          defaultValue={acc.category}
                          onChange={(e) => handleUpdateCategory(acc.id, e.target.value as AccountCategory)}
                          className="bg-slate-950 text-blue-300 text-xs rounded border border-blue-500 px-2 py-1 w-full"
                          autoFocus
                          onBlur={() => setEditingAccountId(null)}
                        >
                          {availableCategories.map((cat) => (
                            <option key={cat} value={cat}>{cat}</option>
                          ))}
                        </select>
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <span className="px-2.5 py-1 rounded-md bg-blue-500/10 text-blue-300 border border-blue-500/20 text-xs font-medium">
                            {acc.category}
                          </span>
                          <button
                            onClick={() => setEditingAccountId(acc.id)}
                            className="p-1 text-slate-500 hover:text-slate-300 transition"
                            title={isAr ? 'تعديل التبويب' : 'Change Taxonomy'}
                          >
                            <Edit2 className="w-3 h-3" />
                          </button>
                        </div>
                      )}
                    </td>
                    <td className="py-2.5 px-3 text-center font-mono">
                      <span
                        className={`font-semibold ${
                          acc.confidence >= 0.95
                            ? 'text-emerald-400'
                            : acc.confidence >= 0.85
                            ? 'text-blue-400'
                            : 'text-amber-400'
                        }`}
                      >
                        {(acc.confidence * 100).toFixed(0)}%
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-center">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold uppercase ${
                          acc.mappingStatus === 'confirmed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                            : acc.mappingStatus === 'overridden'
                            ? 'bg-blue-500/20 text-blue-300 border border-blue-500/30'
                            : 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                        }`}
                      >
                        {acc.mappingStatus}
                      </span>
                    </td>
                    <td className="py-2.5 px-3 text-right">
                      {acc.mappingStatus !== 'confirmed' ? (
                        <button
                          onClick={() => handleConfirmSingle(acc.id)}
                          className="px-2.5 py-1 rounded bg-slate-800 hover:bg-emerald-600 hover:text-white text-slate-300 text-[11px] font-medium transition inline-flex items-center gap-1"
                        >
                          <Check className="w-3 h-3" />
                          {isAr ? 'تأكيد' : 'Confirm'}
                        </button>
                      ) : (
                        <button
                          onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                          className="text-blue-400 hover:text-blue-300 text-[11px] font-medium"
                        >
                          {isAr ? 'الدليل' : 'Trace'} &rarr;
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
