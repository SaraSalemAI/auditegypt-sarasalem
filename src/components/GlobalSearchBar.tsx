import React, { useState, useEffect, useMemo, useRef } from 'react';
import {
  Search,
  X,
  FileSpreadsheet,
  BookOpen,
  FileText,
  ShieldAlert,
  Scale,
  Sparkles,
  ArrowRight,
  Calculator,
  Building2,
  Calendar,
  Layers,
  CheckCircle2
} from 'lucide-react';
import { AccountRow, OutputLanguage } from '../types/accounting';
import { DEFAULT_JOURNAL_ENTRIES, DEFAULT_AUDIT_RISKS } from '../data/defaultCompanyData';

interface SearchResultItem {
  id: string;
  title: string;
  subtitle: string;
  category: 'account' | 'journal' | 'tax' | 'audit' | 'module';
  moduleTarget: number;
  badge?: string;
  metadata?: string;
}

interface Props {
  accounts: AccountRow[];
  language: OutputLanguage;
  onNavigate: (moduleId: number) => void;
  isOpen: boolean;
  onClose: () => void;
}

const TAX_RULES_DATABASE = [
  {
    id: 'TAX-VAT-14',
    code: 'VAT 14%',
    titleEn: 'Value Added Tax - General Standard Rate (14%)',
    titleAr: 'ضريبة القيمة المضافة - السعر العام (14%)',
    descEn: 'Law 67/2016 - Standard rate applicable to commercial goods & industrial sales.',
    descAr: 'قانون 67 لسنة 2016 - السعر العام للسلع التجارية والمبيعات الصناعية.',
    moduleTarget: 23
  },
  {
    id: 'TAX-VAT-MACH-5',
    code: 'VAT 5%',
    titleEn: 'VAT Capital Machinery & Equipment Concession (5%)',
    titleAr: 'ضريبة القيمة المضافة المخفضة للآلات والمعدات (5%)',
    descEn: 'Decree Law 3/2022 - Concessionary rate on industrial production machinery.',
    descAr: 'القانون رقم 3 لسنة 2022 - فئة مخفضة للآلات والمعدات المستخدمة في الإنتاج الصناعي.',
    moduleTarget: 23
  },
  {
    id: 'TAX-WHT-ART59-1',
    code: 'WHT 1%',
    titleEn: 'Withholding Tax - Contracting & Raw Materials Supplies (1%)',
    titleAr: 'خصم وتحصيل - التوريدات والمقاولات (1%)',
    descEn: 'Income Tax Law 91/2005 Article 59 - Deducted from invoice amounts exceeding 300 EGP.',
    descAr: 'قانون ضريبة الدخل 91 لسنة 2005 مادة 59 - يخصم على توريدات السلع والمقاولات.',
    moduleTarget: 23
  },
  {
    id: 'TAX-WHT-ART59-3',
    code: 'WHT 3%',
    titleEn: 'Withholding Tax - Services & Technical Consulting (3%)',
    titleAr: 'خصم وتحصيل - الخدمات والاستشارات الهندسية (3%)',
    descEn: 'Article 59 Law 91/2005 - Deducted from service providers and contractors.',
    descAr: 'مادة 59 قانون 91 لسنة 2005 - يخصم على أتعاب الخدمات والاستشارات والصيانة.',
    moduleTarget: 23
  },
  {
    id: 'TAX-CIT-225',
    code: 'CIT 22.5%',
    titleEn: 'Corporate Income Tax - Standard Corporate Rate (22.5%)',
    titleAr: 'ضريبة الأرباح التجارية والصناعية (22.5%)',
    descEn: 'Corporate net taxable profit after non-deductible adjustments and tax depreciation.',
    descAr: 'صافي الربح الضريبي بعد رد التكاليف غير واجبة الخصم وفروق إهلاك الأصول.',
    moduleTarget: 23
  },
  {
    id: 'TAX-HEALTH-025',
    code: 'UHIC 0.25%',
    titleEn: 'Universal Health Insurance Contribution (0.25% of Revenue)',
    titleAr: 'المساهمة التكافلية للتأمين الصحي الشامل (0.25% من الإيرادات)',
    descEn: 'Law 2/2018 - Non-deductible levy on total annual gross turnover without deductions.',
    descAr: 'قانون 2 لسنة 2018 - فريضة تكافلية غير قابلة للخصم من إجمالي الإيرادات.',
    moduleTarget: 23
  }
];

const MODULE_NAV_INDEX = [
  { id: 1, nameEn: 'Executive Dashboard', nameAr: 'لوحة القيادة التنفيذية', category: 'Executive' },
  { id: 2, nameEn: 'Upload Center', nameAr: 'مركز رفع الملفات', category: 'Data' },
  { id: 3, nameEn: 'Data Validation & Anomaly Detector', nameAr: 'فحص وتدقيق الدفاتر وكاشف الشذوذ', category: 'Audit' },
  { id: 4, nameEn: 'Account Mapping & Chart of Accounts', nameAr: 'اعتماد التبويب ودليل الحسابات', category: 'Mapping' },
  { id: 5, nameEn: 'Comparative Trial Balance', nameAr: 'ميزان المراجعة المقارن', category: 'Ledger' },
  { id: 6, nameEn: 'General Ledger Journals', nameAr: 'دفتر الأستاذ العام وقيود اليومية', category: 'Ledger' },
  { id: 7, nameEn: 'Financial Statements (BS, P&L)', nameAr: 'القوائم المالية المدققة', category: 'Statements' },
  { id: 8, nameEn: 'Cash Flow Analysis (IAS 7)', nameAr: 'قائمة التدفقات النقدية', category: 'Statements' },
  { id: 9, nameEn: 'Financial Ratios & DuPont', nameAr: 'النسب والمؤشرات المالية ونموذج دوبونت', category: 'Analysis' },
  { id: 10, nameEn: 'Industry Benchmarking', nameAr: 'المقارنة بالقطاع الصناعي', category: 'Analysis' },
  { id: 12, nameEn: 'Budget & Stress Testing', nameAr: 'الموازنات التقديرية واختبار الضغط', category: 'Modeling' },
  { id: 13, nameEn: '5-Year Financial Model', nameAr: 'النموذج المالي لـ 5 سنوات', category: 'Modeling' },
  { id: 16, nameEn: 'EAS & IFRS Disclosure Center', nameAr: 'الإفصاحات والإيضاحات المتممة', category: 'Standards' },
  { id: 17, nameEn: 'Audit Risk Studio & Narrative Builder', nameAr: 'استوديو تدقيق الحسابات وصائغ التقارير', category: 'Audit' },
  { id: 22, nameEn: 'Bank Reconciliation & Smart Assistant', nameAr: 'التسوية البنكية والمساعد الذكي للتسويات', category: 'Cash' },
  { id: 23, nameEn: 'Egyptian Tax Calculation Toolkit', nameAr: 'حزمة الحسابات الضريبية المصرية', category: 'Tax' },
  { id: 24, nameEn: 'Recurring Journal Entries', nameAr: 'قيود اليومية الدورية والمتكررة', category: 'Ledger' },
  { id: 25, nameEn: 'Global Consolidation & Elimination', nameAr: 'التجميع المالي واستبعاد العمليات البينية', category: 'Consolidation' },
  { id: 26, nameEn: 'Audit Compliance Heatmap (D3.js)', nameAr: 'خريطة الامتثال الضريبي والرقابي', category: 'Audit' },
  { id: 27, nameEn: 'Auditor Dashboard & Client Portal', nameAr: 'لوحة المراجع القانوني وبوابة العميل', category: 'Audit' },
  { id: 28, nameEn: 'System Activity Logs & Signed Export', nameAr: 'سجلات النشاط الموقعة رقمياً', category: 'Governance' }
];

export const GlobalSearchBar: React.FC<Props> = ({
  accounts,
  language,
  onNavigate,
  isOpen,
  onClose
}) => {
  const isAr = language === 'ar';
  const [query, setQuery] = useState('');
  const [selectedFilter, setSelectedFilter] = useState<'all' | 'account' | 'journal' | 'tax' | 'audit' | 'module'>('all');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    }
  }, [isOpen]);

  // Global keydown listener for ESC and arrows
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Build searchable corpus
  const results = useMemo<SearchResultItem[]>(() => {
    if (!query.trim()) {
      // Default recommended quick links
      return [
        {
          id: 'quick-tb',
          title: isAr ? 'ميزان المراجعة المقارن (2025 vs 2024)' : 'Comparative Trial Balance (2025 vs 2024)',
          subtitle: isAr ? 'فحص الانحرافات الجوهرية والتحليل الرأسي' : 'Materiality variance filtering & 3-way analysis',
          category: 'module',
          moduleTarget: 5,
          badge: 'TB'
        },
        {
          id: 'quick-recon',
          title: isAr ? 'المساعد الذكي للتسويات البنكية' : 'Smart Bank Reconciliation Assistant',
          subtitle: isAr ? 'مطابقة قيود الأستاذ العام مع كشوف البنك بالذكاء الاصطناعي' : 'AI journal adjustments for unmatched bank lines',
          category: 'module',
          moduleTarget: 22,
          badge: 'NEW'
        },
        {
          id: 'quick-tax',
          title: isAr ? 'حزمة الضرائب المصرية (VAT, WHT, CIT)' : 'Egyptian Tax Toolkit (VAT, WHT, CIT)',
          subtitle: isAr ? 'حسابات ضريبة القيمة المضافة والخصم والتحصيل وضريبة الدخل' : 'Law 91/2005 & Law 67/2016 automated calculations',
          category: 'module',
          moduleTarget: 23,
          badge: 'TAX'
        },
        {
          id: 'quick-auditor',
          title: isAr ? 'لوحة المراجع القانوني وبوابة العميل' : 'Professional Auditor Dashboard & Portal',
          subtitle: isAr ? 'أوراق العمل، خطابات الارتباط، وتدفق التعديلات اللحظي' : 'Fieldwork notes, permanent audit file & live feed',
          category: 'module',
          moduleTarget: 27,
          badge: 'AUDIT'
        },
        {
          id: 'quick-heatmap',
          title: isAr ? 'خريطة الامتثال للمواعيد الرقابية (D3.js)' : 'Audit Compliance Deadlines Heatmap',
          subtitle: isAr ? 'رصد المواعيد الضريبية والرقابية مع إشارات التنبيه' : 'Visual statutory deadline matrix with overdue alerts',
          category: 'module',
          moduleTarget: 26,
          badge: 'D3'
        }
      ];
    }

    const q = query.toLowerCase().trim();
    const items: SearchResultItem[] = [];

    // 1. Search Accounts
    accounts.forEach((acc) => {
      const matchCode = acc.code.includes(q);
      const matchEn = acc.nameEn.toLowerCase().includes(q);
      const matchAr = acc.nameAr.includes(q);
      const matchOrig = acc.nameOriginal.toLowerCase().includes(q);
      const matchCat = acc.category.toLowerCase().includes(q);

      if (matchCode || matchEn || matchAr || matchOrig || matchCat) {
        items.push({
          id: `acc-${acc.id}`,
          title: `${acc.code} · ${isAr ? acc.nameAr : acc.nameEn}`,
          subtitle: `${acc.category} · ${isAr ? 'الرصيد: ' : 'Net: '}${acc.netBalance.toLocaleString()} kEGP (${acc.nature.toUpperCase()})`,
          category: 'account',
          moduleTarget: 5,
          badge: acc.fsStatement,
          metadata: acc.code
        });
      }
    });

    // 2. Search Journal Entries
    DEFAULT_JOURNAL_ENTRIES.forEach((j) => {
      const matchDesc =
        j.descriptionEn.toLowerCase().includes(q) || j.descriptionAr.includes(q);
      const matchId = j.id.toLowerCase().includes(q);
      const matchRef = j.reference.toLowerCase().includes(q);

      if (matchDesc || matchId || matchRef) {
        items.push({
          id: `jn-${j.id}`,
          title: `${j.reference} · ${isAr ? j.descriptionAr : j.descriptionEn}`,
          subtitle: `${j.date} · ${isAr ? 'القيمة: ' : 'Amount: '}${j.totalAmount.toLocaleString()} kEGP · ${j.lines.length} lines`,
          category: 'journal',
          moduleTarget: 6,
          badge: 'GL',
          metadata: j.date
        });
      }
    });

    // 3. Search Tax Requirements & Rules
    TAX_RULES_DATABASE.forEach((tax) => {
      const matchTitle =
        tax.titleEn.toLowerCase().includes(q) ||
        tax.titleAr.includes(q) ||
        tax.descEn.toLowerCase().includes(q) ||
        tax.descAr.includes(q) ||
        tax.code.toLowerCase().includes(q);

      if (matchTitle) {
        items.push({
          id: tax.id,
          title: `${tax.code} · ${isAr ? tax.titleAr : tax.titleEn}`,
          subtitle: isAr ? tax.descAr : tax.descEn,
          category: 'tax',
          moduleTarget: tax.moduleTarget,
          badge: 'ETA'
        });
      }
    });

    // 4. Search Audit Risks & Assertions
    DEFAULT_AUDIT_RISKS.forEach((risk) => {
      const matchRisk =
        risk.id.toLowerCase().includes(q) ||
        risk.assertion.toLowerCase().includes(q) ||
        risk.descriptionEn.toLowerCase().includes(q) ||
        risk.descriptionAr.includes(q) ||
        risk.accountNameEn.toLowerCase().includes(q);

      if (matchRisk) {
        items.push({
          id: `risk-${risk.id}`,
          title: `${risk.id} · ${risk.assertion} (${isAr ? risk.assertionAr : risk.assertion})`,
          subtitle: `${isAr ? risk.descriptionAr : risk.descriptionEn} · Exposure: ${risk.amountInvolved.toLocaleString()} kEGP`,
          category: 'audit',
          moduleTarget: 17,
          badge: risk.severity.toUpperCase(),
          metadata: `${risk.amountInvolved}k`
        });
      }
    });

    // 5. Search Navigation Modules
    MODULE_NAV_INDEX.forEach((mod) => {
      const matchMod =
        mod.nameEn.toLowerCase().includes(q) ||
        mod.nameAr.includes(q) ||
        mod.category.toLowerCase().includes(q);

      if (matchMod) {
        items.push({
          id: `mod-${mod.id}`,
          title: isAr ? mod.nameAr : mod.nameEn,
          subtitle: `${isAr ? 'وحدة بالنظام · ' : 'Module · '}${mod.category}`,
          category: 'module',
          moduleTarget: mod.id,
          badge: 'NAV'
        });
      }
    });

    return items;
  }, [query, accounts, isAr]);

  const filteredResults = useMemo(() => {
    if (selectedFilter === 'all') return results;
    return results.filter((r) => r.category === selectedFilter);
  }, [results, selectedFilter]);

  const handleSelect = (item: SearchResultItem) => {
    onNavigate(item.moduleTarget);
    onClose();
  };

  const handleKeyDownInInput = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1 < filteredResults.length ? prev + 1 : prev));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      if (filteredResults[selectedIndex]) {
        handleSelect(filteredResults[selectedIndex]);
      }
    } else if (e.key === 'Escape') {
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-slate-950/80 backdrop-blur-sm animate-fade-in">
      <div
        className="w-full max-w-2xl bg-[#091228] border border-slate-700/80 rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[82vh]"
        dir={isAr ? 'rtl' : 'ltr'}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-slate-800 flex items-center gap-3 bg-slate-900/60">
          <Search className="w-5 h-5 text-blue-400 shrink-0" />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDownInInput}
            placeholder={
              isAr
                ? 'ابحث في الحسابات، قيود اليومية، المواد الضريبية، مخاطر التدقيق، أو الوحدات...'
                : 'Search accounts, journal entries, tax laws, audit risks, or modules...'
            }
            className="w-full bg-transparent text-sm text-white placeholder-slate-400 focus:outline-none"
          />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center gap-1 px-2 py-0.5 text-[10px] font-mono text-slate-400 bg-slate-800 rounded border border-slate-700">
            ESC
          </kbd>
        </div>

        {/* Filter Segmented Bar */}
        <div className="flex items-center gap-1 px-4 py-2 border-b border-slate-800/80 bg-slate-950/40 text-xs overflow-x-auto">
          {(
            [
              { key: 'all', labelEn: 'All Results', labelAr: 'الكل' },
              { key: 'account', labelEn: 'Accounts', labelAr: 'الحسابات' },
              { key: 'journal', labelEn: 'Journals', labelAr: 'القيود' },
              { key: 'tax', labelEn: 'Tax Rules', labelAr: 'الضرائب' },
              { key: 'audit', labelEn: 'Audit Risks', labelAr: 'المخاطر' },
              { key: 'module', labelEn: 'Modules', labelAr: 'الشاشات' }
            ] as const
          ).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                setSelectedFilter(tab.key);
                setSelectedIndex(0);
              }}
              className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
                selectedFilter === tab.key
                  ? 'bg-blue-600 text-white font-semibold'
                  : 'text-slate-400 hover:text-white hover:bg-slate-800'
              }`}
            >
              {isAr ? tab.labelAr : tab.labelEn}
            </button>
          ))}
          <span className="text-[10px] text-slate-400 ms-auto font-mono tabular-nums">
            {filteredResults.length} {isAr ? 'نتيجة' : 'items'}
          </span>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto divide-y divide-slate-800/60 p-2">
          {filteredResults.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs">
              <p>{isAr ? 'لم يتم العثور على نتائج تطابق استعلامك.' : 'No results found matching your search.'}</p>
              <p className="text-slate-400 mt-1">
                {isAr ? 'جرب البحث بكود الحساب، كلمة ضريبية، أو رقم القيد.' : 'Try searching by account code, tax keyword, or journal number.'}
              </p>
            </div>
          ) : (
            filteredResults.map((item, idx) => {
              const isSelected = idx === selectedIndex;
              let Icon = FileSpreadsheet;
              if (item.category === 'journal') Icon = BookOpen;
              if (item.category === 'tax') Icon = Calculator;
              if (item.category === 'audit') Icon = ShieldAlert;
              if (item.category === 'module') Icon = Layers;

              return (
                <div
                  key={item.id}
                  onClick={() => handleSelect(item)}
                  onMouseEnter={() => setSelectedIndex(idx)}
                  className={`flex items-center justify-between p-3 rounded-xl cursor-pointer transition ${
                    isSelected
                      ? 'bg-blue-600/20 border border-blue-500/40 text-white'
                      : 'hover:bg-slate-800/50 text-slate-300'
                  }`}
                >
                  <div className="flex items-start gap-3 min-w-0">
                    <div
                      className={`p-2 rounded-lg shrink-0 mt-0.5 ${
                        item.category === 'tax'
                          ? 'bg-amber-500/20 text-amber-300'
                          : item.category === 'audit'
                          ? 'bg-rose-500/20 text-rose-300'
                          : item.category === 'journal'
                          ? 'bg-indigo-500/20 text-indigo-300'
                          : 'bg-blue-500/20 text-blue-300'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-xs text-white truncate">{item.title}</span>
                        {item.badge && (
                          <span className="px-1.5 py-0.2 rounded text-[10px] font-mono font-bold bg-slate-800 border border-slate-700 text-slate-300">
                            {item.badge}
                          </span>
                        )}
                      </div>
                      <p className="text-[11px] text-slate-400 truncate mt-0.5">{item.subtitle}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 shrink-0 ms-3">
                    <span className="text-[10px] text-blue-400 hidden sm:inline flex items-center gap-1 font-medium">
                      {isAr ? 'انتقال' : 'Jump'} <ArrowRight className="w-3 h-3" />
                    </span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Footer shortcuts */}
        <div className="p-3 border-t border-slate-800/80 bg-slate-950/80 text-[11px] text-slate-400 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <span>&uarr;&darr; {isAr ? 'للتنقل' : 'to navigate'}</span>
            <span>&crarr; {isAr ? 'للاختيار' : 'to select'}</span>
            <span>ESC {isAr ? 'للإغلاق' : 'to close'}</span>
          </div>
          <span className="font-mono text-[10px] text-slate-400">LEDGER IQ SEARCH</span>
        </div>
      </div>
    </div>
  );
};
