import React, { useState, useMemo } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import {
  Globe,
  Building2,
  Layers,
  ArrowRight,
  CheckCircle2,
  AlertTriangle,
  Scale,
  Download,
  Filter,
  Sparkles,
  RefreshCw,
  GitMerge
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface SubsidiaryEntity {
  id: string;
  nameEn: string;
  nameAr: string;
  jurisdiction: string;
  currency: string;
  exchangeRateToEGP: number;
  ownershipPct: number;
  revenue: number; // kEGP equivalent
  cogs: number;
  grossProfit: number;
  netProfit: number;
  totalAssets: number;
  totalLiabilities: number;
  totalEquity: number;
  intercompanyReceivable: number;
  intercompanyPayable: number;
}

interface EliminationEntry {
  id: string;
  titleEn: string;
  titleAr: string;
  descriptionEn: string;
  descriptionAr: string;
  debitAccount: string;
  creditAccount: string;
  amount: number; // kEGP
  status: 'active' | 'pending';
}

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const GlobalConsolidationView: React.FC<Props> = ({
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';
  const [eliminationApplied, setEliminationApplied] = useState(true);

  // Subsidiaries Data
  const entities: SubsidiaryEntity[] = [
    {
      id: 'ENT-PARENT',
      nameEn: 'Cairo Precision Industries S.A.E. (Parent)',
      nameAr: 'شركة القاهرة للصناعات الدقيقة (الشركة الأم)',
      jurisdiction: 'Egypt (مصر)',
      currency: 'EGP',
      exchangeRateToEGP: 1.0,
      ownershipPct: 100,
      revenue: 230700,
      cogs: 164900,
      grossProfit: 65800,
      netProfit: 29500,
      totalAssets: 309300,
      totalLiabilities: 141200,
      totalEquity: 168100,
      intercompanyReceivable: 8450, // Owed by Alex Logistics
      intercompanyPayable: 0
    },
    {
      id: 'ENT-SUB-1',
      nameEn: 'Alexandria Logistics & Port Services S.A.E.',
      nameAr: 'شركة الإسكندرية للخدمات اللوجستية والموانئ',
      jurisdiction: 'Egypt (مصر)',
      currency: 'EGP',
      exchangeRateToEGP: 1.0,
      ownershipPct: 100,
      revenue: 48500,
      cogs: 34200,
      grossProfit: 14300,
      netProfit: 6800,
      totalAssets: 62400,
      totalLiabilities: 28100,
      totalEquity: 34300,
      intercompanyReceivable: 0,
      intercompanyPayable: 8100 // Recorded payable to Parent (350k mismatch in transit)
    },
    {
      id: 'ENT-SUB-2',
      nameEn: 'Gulf Precision Engineering FZE (Dubai)',
      nameAr: 'شركة الخليج للهندسة الدقيقة (دبي - المنطقة الحرة)',
      jurisdiction: 'UAE (الإمارات)',
      currency: 'AED',
      exchangeRateToEGP: 13.50,
      ownershipPct: 75, // 25% Non-Controlling Interest
      revenue: 82350, // Converted into kEGP
      cogs: 56100,
      grossProfit: 26250,
      netProfit: 12400,
      totalAssets: 98600,
      totalLiabilities: 39500,
      totalEquity: 59100,
      intercompanyReceivable: 0,
      intercompanyPayable: 4200
    }
  ];

  // Elimination Entries
  const eliminations: EliminationEntry[] = [
    {
      id: 'ELIM-01',
      titleEn: 'Eliminate Intercompany Industrial Sales & COGS',
      titleAr: 'استبعاد مبيعات وتكلفة المبيعات البينية',
      descriptionEn: 'Elimination of raw precision parts sold by Parent to Gulf Precision Engineering FZE.',
      descriptionAr: 'استبعاد مبيعات قطع الغيار والتجهيزات الموردة من الشركة الأم لفرع دبي.',
      debitAccount: 'Consolidated Revenue (EAS 42)',
      creditAccount: 'Consolidated Cost of Goods Sold',
      amount: 18400,
      status: 'active'
    },
    {
      id: 'ELIM-02',
      titleEn: 'Eliminate Intercompany Balances (Receivables / Payables)',
      titleAr: 'استبعاد الأرصدة البينية (العملاء والموردين)',
      descriptionEn: 'Netting intercompany balances between Parent and Alexandria Logistics (including 350k goods in transit adjustment).',
      descriptionAr: 'تسوية وإلغاء أرصدة الحسابات الجارية البينية بين الشركة الأم وشركة الإسكندرية اللوجستية.',
      debitAccount: 'Intercompany Payables',
      creditAccount: 'Intercompany Receivables',
      amount: 12300,
      status: 'active'
    },
    {
      id: 'ELIM-03',
      titleEn: 'Non-Controlling Interest (NCI) Allocation (25% Gulf FZE)',
      titleAr: 'تخصيص حقوق الأقلية غير المسيطرة (25% الخليج دبي)',
      descriptionEn: 'Recognition of 25% minority share in Gulf Precision FZE net assets (14,775 kEGP) and net profit (3,100 kEGP).',
      descriptionAr: 'إثبات حصة الأقلية غير المسيطرة في صافي أصول فرع دبي بمبلغ 14,775 ألف ج.م وصافي أرباح العام بمبلغ 3,100 ألف ج.م.',
      debitAccount: 'Consolidated Net Profit (NCI share)',
      creditAccount: 'Equity - Non-Controlling Interest',
      amount: 3100,
      status: 'active'
    }
  ];

  // Combined Totals (Sum before elimination)
  const combinedRevenue = entities.reduce((s, e) => s + e.revenue, 0);
  const combinedCOGS = entities.reduce((s, e) => s + e.cogs, 0);
  const combinedNetProfit = entities.reduce((s, e) => s + e.netProfit, 0);
  const combinedAssets = entities.reduce((s, e) => s + e.totalAssets, 0);
  const combinedLiabilities = entities.reduce((s, e) => s + e.totalLiabilities, 0);
  const combinedEquity = entities.reduce((s, e) => s + e.totalEquity, 0);

  // Consolidated Totals (After elimination)
  const elimRevenue = eliminations.find(e => e.id === 'ELIM-01')?.amount || 0;
  const elimBalances = eliminations.find(e => e.id === 'ELIM-02')?.amount || 0;
  const nciProfit = eliminations.find(e => e.id === 'ELIM-03')?.amount || 0;

  const consolidatedRevenue = eliminationApplied ? combinedRevenue - elimRevenue : combinedRevenue;
  const consolidatedCOGS = eliminationApplied ? combinedCOGS - elimRevenue : combinedCOGS;
  const consolidatedGrossProfit = consolidatedRevenue - consolidatedCOGS;
  const consolidatedNetProfit = combinedNetProfit; // Net profit remains identical before NCI split
  const parentShareProfit = eliminationApplied ? consolidatedNetProfit - nciProfit : consolidatedNetProfit;
  const consolidatedAssets = eliminationApplied ? combinedAssets - elimBalances : combinedAssets;
  const consolidatedLiabilities = eliminationApplied ? combinedLiabilities - elimBalances : combinedLiabilities;

  // Intercompany Mismatch: Parent AR (8,450) vs Alex AP (8,100) = 350 kEGP goods in transit
  const intercompanyMismatch = Math.abs(entities[0].intercompanyReceivable - entities[1].intercompanyPayable);

  const exportConsolidatedWorkbook = () => {
    const wb = XLSX.utils.book_new();

    const summaryRows = [
      ['GLOBAL CONSOLIDATION WORKPAPER (EAS 42 / IFRS 10)', 'أوراق عمل التجميع المالي الموحد'],
      ['Parent Entity', company.nameEn],
      ['Reporting Framework', framework],
      ['', ''],
      ['Financial Metric', 'Cairo Parent (EGP)', 'Alexandria Logistics (EGP)', 'Gulf FZE (AED eq.)', 'Eliminations', 'Consolidated Total'],
      ['Total Revenue', entities[0].revenue, entities[1].revenue, entities[2].revenue, eliminationApplied ? -elimRevenue : 0, consolidatedRevenue],
      ['Cost of Goods Sold', entities[0].cogs, entities[1].cogs, entities[2].cogs, eliminationApplied ? -elimRevenue : 0, consolidatedCOGS],
      ['Gross Profit', entities[0].grossProfit, entities[1].grossProfit, entities[2].grossProfit, 0, consolidatedGrossProfit],
      ['Net Profit', entities[0].netProfit, entities[1].netProfit, entities[2].netProfit, 0, consolidatedNetProfit],
      ['Non-Controlling Interest Share', 0, 0, 0, eliminationApplied ? -nciProfit : 0, eliminationApplied ? nciProfit : 0],
      ['Net Profit Attributable to Parent', entities[0].netProfit, entities[1].netProfit, entities[2].netProfit, '', parentShareProfit],
      ['', ''],
      ['Total Assets', entities[0].totalAssets, entities[1].totalAssets, entities[2].totalAssets, eliminationApplied ? -elimBalances : 0, consolidatedAssets],
      ['Total Liabilities', entities[0].totalLiabilities, entities[1].totalLiabilities, entities[2].totalLiabilities, eliminationApplied ? -elimBalances : 0, consolidatedLiabilities]
    ];

    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(summaryRows), 'Consolidated_Workpapers');
    XLSX.writeFile(wb, 'Consolidated_Financial_Statements_2025.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Top Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 flex items-center gap-1">
              <Globe className="w-3.5 h-3.5" />
              {isAr ? 'منظومة التجميع واستبعاد العمليات البينية' : 'Global Consolidation & Intercompany Elimination'}
            </span>
            <span className="text-xs text-slate-400 font-mono">EAS 42 / IFRS 10 · Multi-Entity Architecture</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <GitMerge className="w-6 h-6 text-indigo-400" />
            {isAr ? 'القوائم المالية المجمعة وتوحيد حسابات الشركات التابعة' : 'Consolidated Financial Statements & Subsidiary Roll-Up'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'تجميع موازين مراجعة الشركة الأم والشركات التابعة بالإسكندرية ودبي، واكتشاف فروق المطابقة البينية، واستبعاد المبيعات والأرصدة المشتركة طبقاً لمعيار EAS 42.'
              : 'Multi-subsidiary trial balance aggregation, intercompany mismatch detection, and automated elimination of intragroup revenues and payables under IFRS 10.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setEliminationApplied(!eliminationApplied)}
            className={`px-3 py-2 rounded-xl text-xs font-semibold border transition flex items-center gap-1.5 ${
              eliminationApplied
                ? 'bg-indigo-600 text-white border-indigo-500'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:text-white'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            {eliminationApplied
              ? (isAr ? 'الاستبعادات مفعلة (Consolidated)' : 'Eliminations Active')
              : (isAr ? 'عرض الإجمالي المجمع (Combined)' : 'Combined View (Pre-elimination)')}
          </button>
          <button
            onClick={exportConsolidatedWorkbook}
            className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold shadow-lg shadow-blue-600/20 flex items-center gap-1.5 transition"
          >
            <Download className="w-4 h-4" />
            {isAr ? 'تصدير القوائم المجمعة (Excel)' : 'Export Consolidated (Excel)'}
          </button>
        </div>
      </div>

      {/* Intercompany Mismatch Alert */}
      {intercompanyMismatch > 0 && (
        <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/30 text-xs flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <span className="font-bold text-amber-300">
              {isAr ? 'اكتشاف عدم تطابق في الأرصدة البينية قيد الانتقال (In-Transit Discrepancy)' : 'Intercompany In-Transit Balance Discrepancy Detected'}
            </span>
            <p className="text-slate-300 leading-relaxed">
              {isAr
                ? `رصيد العملاء بالشركة الأم تجاه الإسكندرية اللوجستية (8,450 ألف ج.م) يزيد عن رصيد الموردين المسجل لدى شركة الإسكندرية (8,100 ألف ج.م) بفارق ${intercompanyMismatch} ألف جنيه، وهو ما يمثل بضاعة بالطريق تم شحنها في 30 ديسمبر 2025 ولم تسجل بعد بدفاتر التابع. تم تسويتها في عمود الاستبعادات.`
                : `Parent AR against Alexandria Logistics (8,450 kEGP) exceeds Alexandria recorded AP (8,100 kEGP) by ${intercompanyMismatch} kEGP, representing inventory in transit shipped on Dec 30, 2025. Automatically adjusted in elimination workpapers.`}
            </p>
          </div>
        </div>
      )}

      {/* KPI Strip: Consolidated Performance */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Consolidated Revenue */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'إيرادات المجموعة الموحدة' : 'Consolidated Revenue'}</span>
            <Globe className="w-4 h-4 text-indigo-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {consolidatedRevenue.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            {eliminationApplied ? `Net of ${elimRevenue.toLocaleString()}k elim.` : 'Gross Combined'}
          </div>
        </div>

        {/* Consolidated Net Profit */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'صافي أرباح المجموعة' : 'Consolidated Net Profit'}</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          </div>
          <div className="text-xl font-bold font-mono text-emerald-400">
            {consolidatedNetProfit.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            Parent Share: {parentShareProfit.toLocaleString()}k
          </div>
        </div>

        {/* Total Group Assets */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'إجمالي أصول المجموعة' : 'Consolidated Total Assets'}</span>
            <Building2 className="w-4 h-4 text-blue-400" />
          </div>
          <div className="text-xl font-bold font-mono text-white">
            {consolidatedAssets.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            3 Entities Consolidated
          </div>
        </div>

        {/* Non-Controlling Interest */}
        <div className="p-4 rounded-xl bg-slate-900 border border-slate-800">
          <div className="text-xs text-slate-400 mb-1 flex items-center justify-between">
            <span>{isAr ? 'حقوق الأقلية غير المسيطرة' : 'Non-Controlling Interest'}</span>
            <Scale className="w-4 h-4 text-amber-400" />
          </div>
          <div className="text-xl font-bold font-mono text-amber-400">
            {nciProfit.toLocaleString()} <span className="text-xs font-sans font-normal text-slate-400">kEGP (Profit)</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-2">
            25% of Gulf FZE Equity
          </div>
        </div>
      </div>

      {/* Entities Roll-Up Table */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Building2 className="w-4 h-4 text-indigo-400" />
          {isAr ? 'جدول تسوية وتجميع الكيانات التابعة (Consolidation Matrix)' : 'Subsidiaries Roll-Up & Consolidation Matrix'}
        </h3>
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left" dir={isAr ? 'rtl' : 'ltr'}>
            <thead className="bg-slate-950 text-slate-400 font-semibold border-b border-slate-800">
              <tr>
                <th className="p-3">{isAr ? 'الكيان القانوني' : 'Legal Entity'}</th>
                <th className="p-3">{isAr ? 'الدولة والعملة' : 'Jurisdiction & FX'}</th>
                <th className="p-3 text-center">{isAr ? 'نسبة الملكية' : 'Ownership'}</th>
                <th className="p-3 text-right">{isAr ? 'الإيرادات (kEGP)' : 'Revenue (kEGP)'}</th>
                <th className="p-3 text-right">{isAr ? 'تكلفة المبيعات' : 'COGS'}</th>
                <th className="p-3 text-right">{isAr ? 'صافي الربح' : 'Net Profit'}</th>
                <th className="p-3 text-right">{isAr ? 'إجمالي الأصول' : 'Total Assets'}</th>
                <th className="p-3 text-right">{isAr ? 'الرصيد البيني' : 'Intercompany'}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60 font-mono">
              {entities.map((e) => (
                <tr key={e.id} className="hover:bg-slate-800/40">
                  <td className="p-3 font-sans">
                    <span className="font-bold text-white block">{isAr ? e.nameAr : e.nameEn}</span>
                    <span className="text-[10px] text-slate-400 font-mono">{e.id}</span>
                  </td>
                  <td className="p-3 text-slate-300 font-sans">
                    {e.jurisdiction} · <span className="font-mono">{e.currency}</span>
                    {e.currency !== 'EGP' && (
                      <span className="text-[10px] text-slate-400 block font-mono">
                        Rate: {e.exchangeRateToEGP} EGP
                      </span>
                    )}
                  </td>
                  <td className="p-3 text-center">
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                      {e.ownershipPct}%
                    </span>
                  </td>
                  <td className="p-3 text-right text-white font-bold">{e.revenue.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-300">{e.cogs.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-400 font-bold">{e.netProfit.toLocaleString()}</td>
                  <td className="p-3 text-right text-white">{e.totalAssets.toLocaleString()}</td>
                  <td className="p-3 text-right text-amber-400">
                    {e.intercompanyReceivable > 0
                      ? `+${e.intercompanyReceivable.toLocaleString()}k AR`
                      : e.intercompanyPayable > 0
                      ? `-${e.intercompanyPayable.toLocaleString()}k AP`
                      : '—'}
                  </td>
                </tr>
              ))}

              {/* Eliminations row */}
              {eliminationApplied && (
                <tr className="bg-indigo-950/40 text-indigo-300 font-bold border-t border-indigo-800/60">
                  <td className="p-3 font-sans">
                    {isAr ? 'استبعادات وتعديلات التجميع (EAS 42)' : 'Consolidation Eliminations & NCI'}
                  </td>
                  <td className="p-3 font-sans">—</td>
                  <td className="p-3 text-center">—</td>
                  <td className="p-3 text-right text-rose-400">-{elimRevenue.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-400">-{elimRevenue.toLocaleString()}</td>
                  <td className="p-3 text-right text-slate-300">0</td>
                  <td className="p-3 text-right text-rose-400">-{elimBalances.toLocaleString()}</td>
                  <td className="p-3 text-right text-emerald-400">0 (Reconciled)</td>
                </tr>
              )}

              {/* Total Consolidated */}
              <tr className="bg-slate-950 font-bold text-sm text-white border-t-2 border-slate-700">
                <td className="p-3 font-sans text-blue-400">
                  {isAr ? 'إجمالي المجموعة المجمعة الموحدة' : 'TOTAL CONSOLIDATED GROUP'}
                </td>
                <td className="p-3 font-sans text-slate-400">EGP Group</td>
                <td className="p-3 text-center font-sans text-xs">100% Parent / 25% NCI</td>
                <td className="p-3 text-right text-white font-mono">{consolidatedRevenue.toLocaleString()}</td>
                <td className="p-3 text-right text-slate-300 font-mono">{consolidatedCOGS.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-400 font-mono">{consolidatedNetProfit.toLocaleString()}</td>
                <td className="p-3 text-right text-white font-mono">{consolidatedAssets.toLocaleString()}</td>
                <td className="p-3 text-right text-emerald-400 font-mono">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Elimination Journals Detail */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <h3 className="text-sm font-bold text-white flex items-center gap-2">
          <Layers className="w-4 h-4 text-indigo-400" />
          {isAr ? 'قيود الاستبعاد المحاسبية المعتمدة بالقوائم المجمعة' : 'Statutory Consolidation Elimination Journal Entries'}
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          {eliminations.map((el) => (
            <div key={el.id} className="p-4 rounded-xl bg-slate-950 border border-slate-800 space-y-2">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs font-bold text-indigo-400">{el.id}</span>
                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-950 px-1.5 py-0.5 rounded border border-emerald-800">
                  {el.status}
                </span>
              </div>
              <h4 className="font-bold text-white text-xs">{isAr ? el.titleAr : el.titleEn}</h4>
              <p className="text-[11px] text-slate-400 leading-relaxed">
                {isAr ? el.descriptionAr : el.descriptionEn}
              </p>
              <div className="p-2 rounded bg-slate-900 border border-slate-800 font-mono text-[10px] text-slate-300 space-y-0.5">
                <div><span className="text-blue-400">DR:</span> {el.debitAccount}</div>
                <div><span className="text-emerald-400">CR:</span> {el.creditAccount}</div>
                <div className="text-right font-bold text-white pt-1">
                  Amount: {el.amount.toLocaleString()} kEGP
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
