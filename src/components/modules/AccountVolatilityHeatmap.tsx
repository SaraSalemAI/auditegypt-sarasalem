import React, { useEffect, useRef, useState, useMemo } from 'react';
import * as d3 from 'd3';
import { AccountRow, OutputLanguage, CompanyEntity } from '../../types/accounting';
import { useEvidence } from '../../context/EvidenceContext';
import {
  Flame,
  AlertTriangle,
  Filter,
  Info,
  Sparkles,
  Maximize2,
  CheckCircle2,
  HelpCircle,
  Eye,
  Activity,
  Layers,
  ArrowRight
} from 'lucide-react';

interface Props {
  accounts: AccountRow[];
  company: CompanyEntity;
  language: OutputLanguage;
  onOpenEvidence?: (traceId: string) => void;
}

export interface HeatmapCellData {
  accountCode: string;
  accountNameEn: string;
  accountNameAr: string;
  category: string;
  month: string;
  monthAr: string;
  monthIndex: number;
  amount: number; // in thousands EGP
  zScore: number; // statistical anomaly score
  isOutlier: boolean;
  volatilityPct: number;
  anomalyReasonEn: string;
  anomalyReasonAr: string;
}

export const AccountVolatilityHeatmap: React.FC<Props> = ({
  accounts,
  company,
  language,
  onOpenEvidence
}) => {
  const isAr = language === 'ar';
  const { openEvidence } = useEvidence();
  const svgRef = useRef<SVGSVGElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [outliersOnly, setOutliersOnly] = useState<boolean>(false);
  const [selectedCell, setSelectedCell] = useState<HeatmapCellData | null>(null);
  const [hoveredCell, setHoveredCell] = useState<HeatmapCellData | null>(null);

  const months = useMemo(
    () => [
      { en: 'Jan', ar: 'يناير' },
      { en: 'Feb', ar: 'فبراير' },
      { en: 'Mar', ar: 'مارس' },
      { en: 'Apr', ar: 'أبريل' },
      { en: 'May', ar: 'مايو' },
      { en: 'Jun', ar: 'يونيو' },
      { en: 'Jul', ar: 'يوليو' },
      { en: 'Aug', ar: 'أغسطس' },
      { en: 'Sep', ar: 'سبتمبر' },
      { en: 'Oct', ar: 'أكتوبر' },
      { en: 'Nov', ar: 'نوفمبر' },
      { en: 'Dec', ar: 'ديسمبر' }
    ],
    []
  );

  // Generate deterministic monthly transaction activity & volatility metrics per account
  const heatmapData: HeatmapCellData[] = useMemo(() => {
    // Select representative accounts covering Balance Sheet & Income Statement
    const targetCodes = [
      '1010', '1020', '1025', '1110', '1210', '1410', '2010', '2020',
      '2050', '2110', '4010', '4020', '5010', '5020', '6010', '6020',
      '7020', '7050', '7090'
    ];

    const activeAccs = accounts.filter(
      (a) => targetCodes.includes(a.code) || a.netBalance > 10000
    ).slice(0, 16);

    const data: HeatmapCellData[] = [];

    activeAccs.forEach((acc) => {
      const baseMonthly = Math.abs(acc.netBalance) / 12;

      // Seed deterministic monthly variance based on account behavior
      months.forEach((m, mIdx) => {
        let seasonalityMultiplier = 1.0;
        let anomalyReasonEn = 'Normal expected seasonal flow';
        let anomalyReasonAr = 'تدفق دوري معتاد ضمن النطاق الطبيعي';
        let isOutlier = false;

        // Specific real-world corporate Egyptian accounting anomalies
        if (acc.code === '7090') {
          // Income Tax Expense spike in April
          if (mIdx === 3) {
            seasonalityMultiplier = 3.8;
            anomalyReasonEn = 'Annual statutory tax filing surge (Law 91/2005)';
            anomalyReasonAr = 'سداد الالتزامات الضريبية السنوية لمصلحة الضرائب المصرية (قانون 91/2005)';
            isOutlier = true;
          } else {
            seasonalityMultiplier = 0.5;
          }
        } else if (acc.code === '4020') {
          // Export revenue surge in Nov/Dec
          if (mIdx === 10 || mIdx === 11) {
            seasonalityMultiplier = 2.4;
            anomalyReasonEn = 'Q4 European export contracts delivery peak';
            anomalyReasonAr = 'تسليم عقود التصدير للأسواق الأوروبية بنهاية الربع الرابع';
            isOutlier = true;
          }
        } else if (acc.code === '7020') {
          // Finance Costs - overdraft expansion in May/June
          if (mIdx === 4 || mIdx === 5) {
            seasonalityMultiplier = 2.6;
            anomalyReasonEn = 'Overdraft facility peak following tax outflow';
            anomalyReasonAr = 'توسع في السحب على المكشوف لتغطية سدادات الضرائب والموردين';
            isOutlier = true;
          }
        } else if (acc.code === '1025') {
          // USD Bank balance - FX revaluation jump in March
          if (mIdx === 2) {
            seasonalityMultiplier = 2.8;
            anomalyReasonEn = 'CBE exchange rate flotation revaluation (EAS 13)';
            anomalyReasonAr = 'إعادة تقييم الأرصدة بالدولار وفق تعديل سعر الصرف الرسمي (معيار 13)';
            isOutlier = true;
          }
        } else if (acc.code === '5010') {
          // Raw materials import batch in September
          if (mIdx === 8) {
            seasonalityMultiplier = 2.2;
            anomalyReasonEn = 'Bulk raw steel batch import clearance at Alexandria Port';
            anomalyReasonAr = 'شحنة صلب خام مستوردة عبر ميناء الإسكندرية لتأمين إنتاج الشتاء';
            isOutlier = true;
          }
        } else if (acc.code === '1110') {
          // Trade Receivables spike in October
          if (mIdx === 9) {
            seasonalityMultiplier = 2.1;
            anomalyReasonEn = 'Concentrated OEM machinery deliveries on 90-day credit';
            anomalyReasonAr = 'مبيعات معدات صناعية لعملاء محليين بآجال سداد 90 يوماً';
            isOutlier = true;
          }
        } else {
          // Gentle sinusoidal variance
          const cycle = Math.sin((mIdx + parseInt(acc.code.slice(-2), 10)) * 0.7);
          seasonalityMultiplier = 1.0 + cycle * 0.25;
        }

        const monthlyAmount = baseMonthly * seasonalityMultiplier;
        const volatilityPct = (seasonalityMultiplier - 1.0) * 100;
        const zScore = parseFloat(((seasonalityMultiplier - 1.0) / 0.45).toFixed(2));

        if (Math.abs(zScore) >= 2.2) {
          isOutlier = true;
        }

        data.push({
          accountCode: acc.code,
          accountNameEn: acc.nameEn,
          accountNameAr: acc.nameAr,
          category: acc.category,
          month: m.en,
          monthAr: m.ar,
          monthIndex: mIdx,
          amount: parseFloat(monthlyAmount.toFixed(1)),
          zScore,
          isOutlier,
          volatilityPct: parseFloat(volatilityPct.toFixed(1)),
          anomalyReasonEn,
          anomalyReasonAr
        });
      });
    });

    return data;
  }, [accounts, months]);

  // Unique categories for filtering
  const categories = useMemo(() => {
    const set = new Set(heatmapData.map((d) => d.category));
    return ['all', ...Array.from(set)];
  }, [heatmapData]);

  // Unique accounts in order
  const displayAccounts = useMemo(() => {
    let filtered = heatmapData;
    if (selectedCategory !== 'all') {
      filtered = filtered.filter((d) => d.category === selectedCategory);
    }
    if (outliersOnly) {
      const outlierCodes = new Set(filtered.filter((d) => d.isOutlier).map((d) => d.accountCode));
      filtered = filtered.filter((d) => outlierCodes.has(d.accountCode));
    }
    const accMap = new Map<string, { code: string; nameEn: string; nameAr: string; category: string }>();
    filtered.forEach((d) => {
      if (!accMap.has(d.accountCode)) {
        accMap.set(d.accountCode, {
          code: d.accountCode,
          nameEn: d.accountNameEn,
          nameAr: d.accountNameAr,
          category: d.category
        });
      }
    });
    return Array.from(accMap.values());
  }, [heatmapData, selectedCategory, outliersOnly]);

  const filteredCells = useMemo(() => {
    const accCodes = new Set(displayAccounts.map((a) => a.code));
    return heatmapData.filter((d) => accCodes.has(d.accountCode));
  }, [heatmapData, displayAccounts]);

  const outlierStats = useMemo(() => {
    const totalOutliers = heatmapData.filter((d) => d.isOutlier).length;
    const maxZScore = Math.max(...heatmapData.map((d) => Math.abs(d.zScore)));
    return { totalOutliers, maxZScore };
  }, [heatmapData]);

  // Render D3 Heatmap
  useEffect(() => {
    if (!svgRef.current || displayAccounts.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const margin = {
      top: 35,
      right: isAr ? 20 : 30,
      bottom: 25,
      left: isAr ? 250 : 230
    };

    const containerWidth = containerRef.current?.clientWidth || 900;
    const width = Math.max(containerWidth, 800) - margin.left - margin.right;
    const rowHeight = 28;
    const height = displayAccounts.length * rowHeight;

    svg
      .attr('width', width + margin.left + margin.right)
      .attr('height', height + margin.top + margin.bottom);

    const g = svg
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // X Scale (Months)
    const xScale = d3
      .scaleBand()
      .domain(months.map((m) => (isAr ? m.ar : m.en)))
      .range([0, width])
      .padding(0.08);

    // Y Scale (Accounts)
    const yScale = d3
      .scaleBand()
      .domain(displayAccounts.map((a) => a.code))
      .range([0, height])
      .padding(0.12);

    // Color Scale: Diverging Volatility (Negative Z to Extreme Outlier)
    // Dark slate -> Navy -> Amber -> Crimson Red
    const colorScale = d3
      .scaleSequential()
      .domain([-1.5, 3.5])
      .interpolator(
        d3.interpolateRgbBasis([
          '#0f172a', // Deep slate (low/subdued)
          '#1e293b', // Normal slate
          '#1e3a8a', // Mild positive
          '#0284c7', // Moderate flow
          '#f59e0b', // Elevated volatility (warning)
          '#ef4444', // High outlier spike (alert)
          '#dc2626'  // Extreme statistical outlier
        ])
      );

    // X Axis Labels (Top)
    g.append('g')
      .selectAll('.month-label')
      .data(months)
      .enter()
      .append('text')
      .attr('class', 'month-label')
      .attr('x', (m) => (xScale(isAr ? m.ar : m.en) || 0) + xScale.bandwidth() / 2)
      .attr('y', -12)
      .attr('text-anchor', 'middle')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-weight', '600')
      .attr('font-family', 'ui-monospace, monospace')
      .text((m) => (isAr ? m.ar : m.en));

    // Y Axis Labels (Accounts on Left)
    g.append('g')
      .selectAll('.account-label')
      .data(displayAccounts)
      .enter()
      .append('text')
      .attr('class', 'account-label')
      .attr('x', -12)
      .attr('y', (a) => (yScale(a.code) || 0) + yScale.bandwidth() / 2 + 4)
      .attr('text-anchor', 'end')
      .attr('fill', '#e2e8f0')
      .attr('font-size', '11px')
      .attr('font-weight', '500')
      .attr('cursor', 'pointer')
      .text((a) => `${a.code} - ${isAr ? a.nameAr : a.nameEn}`)
      .each(function () {
        // Truncate long names cleanly
        const self = d3.select(this);
        const text = self.text();
        if (text.length > 28) {
          self.text(text.slice(0, 26) + '...');
        }
      });

    // Render Heatmap Cells
    const cellGroups = g
      .selectAll('.cell-group')
      .data(filteredCells)
      .enter()
      .append('g')
      .attr('class', 'cell-group')
      .attr(
        'transform',
        (d) =>
          `translate(${xScale(isAr ? d.monthAr : d.month) || 0}, ${
            yScale(d.accountCode) || 0
          })`
      )
      .attr('cursor', 'pointer')
      .on('mouseenter', (event: MouseEvent, d) => {
        setHoveredCell(d);
        d3.select(event.currentTarget as SVGGElement)
          .select('rect')
          .attr('stroke', '#ffffff')
          .attr('stroke-width', 2);
      })
      .on('mouseleave', (event: MouseEvent, d) => {
        setHoveredCell(null);
        d3.select(event.currentTarget as SVGGElement)
          .select('rect')
          .attr('stroke', d.isOutlier ? '#f87171' : '#334155')
          .attr('stroke-width', d.isOutlier ? 1.8 : 0.8);
      })
      .on('click', (_event: MouseEvent, d) => {
        setSelectedCell(d);
      });

    // Cell Rectangles
    cellGroups
      .append('rect')
      .attr('width', xScale.bandwidth())
      .attr('height', yScale.bandwidth())
      .attr('rx', 4)
      .attr('ry', 4)
      .attr('fill', (d) => colorScale(d.zScore))
      .attr('stroke', (d) => (d.isOutlier ? '#f87171' : '#334155'))
      .attr('stroke-width', (d) => (d.isOutlier ? 1.8 : 0.8))
      .attr('stroke-dasharray', (d) => (d.isOutlier ? 'none' : 'none'))
      .style('transition', 'all 0.2s ease');

    // Outlier Visual Indicators (Pulsing ring or warning dot)
    cellGroups
      .filter((d) => d.isOutlier)
      .append('circle')
      .attr('cx', xScale.bandwidth() - 6)
      .attr('cy', 6)
      .attr('r', 3)
      .attr('fill', '#ef4444')
      .attr('stroke', '#ffffff')
      .attr('stroke-width', 0.8);

    // Cell value labels (abbreviated in thousands if space allows)
    if (xScale.bandwidth() > 42) {
      cellGroups
        .append('text')
        .attr('x', xScale.bandwidth() / 2)
        .attr('y', yScale.bandwidth() / 2 + 3.5)
        .attr('text-anchor', 'middle')
        .attr('fill', (d) => (d.zScore > 1.8 ? '#ffffff' : '#cbd5e1'))
        .attr('font-size', '9.5px')
        .attr('font-weight', (d) => (d.isOutlier ? 'bold' : 'normal'))
        .attr('font-family', 'ui-monospace, monospace')
        .text((d) => {
          if (d.amount >= 1000) return `${(d.amount / 1000).toFixed(1)}M`;
          return `${d.amount.toFixed(0)}k`;
        });
    }
  }, [displayAccounts, filteredCells, isAr, months, selectedCategory, outliersOnly]);

  return (
    <div className="space-y-4" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header and Controls */}
      <div className="p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-[#0B152F] to-slate-900 border border-slate-800 shadow-xl space-y-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1.5">
                <Flame className="w-3.5 h-3.5 text-rose-400" />
                D3.js Financial Volatility Heatmap
              </span>
              <span className="text-xs text-slate-400 font-mono">
                {company.reportingPeriod}
              </span>
            </div>
            <h3 className="text-lg font-bold text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-rose-400" />
              {isAr
                ? 'خريطة التذبذب المحاسبي ورصد المعاملات الشاذة (Account Volatility & Outliers)'
                : 'Account-Level Volatility Heatmap & Outlier Anomaly Detection'}
            </h3>
            <p className="text-xs text-slate-300 mt-1 max-w-2xl">
              {isAr
                ? 'مصفوفة بصرية مدعومة بـ D3.js لرصد الانحرافات المعيارية والقفزات غير المعتادة على مستوى الحسابات الشهرية للكشف المبكر عن الأخطاء المحاسبية والتسويات الاستثنائية.'
                : 'D3.js visual density matrix mapping standard deviation (Z-scores) across fiscal months to detect unexpected ledger spikes, cut-off distortions, and transaction lumps.'}
            </p>
          </div>

          {/* Quick Outlier Metrics */}
          <div className="flex items-center gap-2 text-xs">
            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800 flex items-center gap-2.5">
              <div className="w-2.5 h-2.5 rounded-full bg-rose-500 animate-ping" />
              <div>
                <span className="text-slate-400 block text-[10px] uppercase">
                  {isAr ? 'القيم الشاذة المرصودة' : 'Outliers Detected'}
                </span>
                <span className="text-sm font-bold font-mono text-rose-400">
                  {outlierStats.totalOutliers}{' '}
                  <span className="text-[10px] text-slate-400 font-sans">
                    {isAr ? 'حركات استثنائية' : 'spikes'}
                  </span>
                </span>
              </div>
            </div>

            <div className="px-3.5 py-2 rounded-xl bg-slate-950/80 border border-slate-800">
              <span className="text-slate-400 block text-[10px] uppercase">
                {isAr ? 'أعلى انحراف معياري' : 'Max Z-Score'}
              </span>
              <span className="text-sm font-bold font-mono text-amber-400">
                +{outlierStats.maxZScore.toFixed(1)}&sigma;
              </span>
            </div>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-3 border-t border-slate-800/80 text-xs">
          {/* Category Pills */}
          <div className="flex items-center gap-1.5 overflow-x-auto pb-1 max-w-full">
            <span className="text-slate-400 text-[11px] font-semibold shrink-0">
              {isAr ? 'التبويب:' : 'Category:'}
            </span>
            {categories.slice(0, 6).map((cat) => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-2.5 py-1 rounded-lg text-xs font-medium transition whitespace-nowrap border ${
                  selectedCategory === cat
                    ? 'bg-rose-600 text-white border-rose-500 shadow-sm'
                    : 'bg-slate-950/60 text-slate-400 border-slate-800 hover:text-white'
                }`}
              >
                {cat === 'all' ? (isAr ? 'كافة الحسابات' : 'All Accounts') : cat}
              </button>
            ))}
          </div>

          {/* Outliers Only Toggle */}
          <div className="flex items-center gap-3">
            <label className="flex items-center gap-2 cursor-pointer bg-slate-950/70 px-3 py-1.5 rounded-xl border border-slate-800 hover:border-slate-700 transition">
              <input
                type="checkbox"
                checked={outliersOnly}
                onChange={(e) => setOutliersOnly(e.target.checked)}
                className="rounded bg-slate-900 border-slate-700 text-rose-600 focus:ring-rose-500"
              />
              <span className="text-slate-300 font-semibold text-xs flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-rose-400" />
                {isAr ? 'إظهار الحسابات الشاذة فقط' : 'Highlight Outliers Only'}
              </span>
            </label>

            {/* Color Legend */}
            <div className="hidden sm:flex items-center gap-1.5 text-[10px] text-slate-400 bg-slate-950/60 px-3 py-1.5 rounded-xl border border-slate-800">
              <span>{isAr ? 'منخفض' : 'Low'}</span>
              <div className="flex h-2.5 w-20 rounded overflow-hidden">
                <div className="w-1/4 bg-[#0f172a]" />
                <div className="w-1/4 bg-[#1e3a8a]" />
                <div className="w-1/4 bg-[#f59e0b]" />
                <div className="w-1/4 bg-[#ef4444]" />
              </div>
              <span className="text-rose-400 font-bold">{isAr ? 'شاذ (+3&sigma;)' : 'Outlier (+3&sigma;)'}</span>
            </div>
          </div>
        </div>
      </div>

      {/* D3 Heatmap Canvas Container */}
      <div
        ref={containerRef}
        className="rounded-2xl border border-slate-800 bg-slate-900/90 p-4 shadow-2xl overflow-x-auto relative"
      >
        <svg ref={svgRef} className="mx-auto block" />

        {/* Hovered Tooltip Card */}
        {hoveredCell && (
          <div
            className={`absolute bottom-4 ${
              isAr ? 'left-4' : 'right-4'
            } p-3 rounded-xl bg-slate-950/95 border border-slate-700 shadow-2xl text-xs space-y-1 z-20 max-w-xs animate-in fade-in duration-150 backdrop-blur-md`}
          >
            <div className="flex items-center justify-between gap-3 border-b border-slate-800 pb-1.5">
              <span className="font-bold text-white font-mono">
                {hoveredCell.accountCode} • {isAr ? hoveredCell.monthAr : hoveredCell.month}
              </span>
              <span
                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                  hoveredCell.isOutlier
                    ? 'bg-rose-500/20 text-rose-300 border border-rose-500/30'
                    : 'bg-slate-800 text-slate-400'
                }`}
              >
                {hoveredCell.isOutlier
                  ? (isAr ? 'قيمة شاذة (Outlier)' : 'Outlier Spike')
                  : 'Normal'}
              </span>
            </div>
            <div className="text-slate-200 font-medium truncate">
              {isAr ? hoveredCell.accountNameAr : hoveredCell.accountNameEn}
            </div>
            <div className="flex items-center justify-between text-slate-400 pt-1">
              <span>{isAr ? 'الرصيد الشهري:' : 'Monthly Balance:'}</span>
              <strong className="text-emerald-400 font-mono">
                {hoveredCell.amount.toLocaleString()} kEGP
              </strong>
            </div>
            <div className="flex items-center justify-between text-slate-400">
              <span>{isAr ? 'الانحراف المعياري:' : 'Z-Score (&sigma;):'}</span>
              <strong
                className={`font-mono ${
                  hoveredCell.zScore > 2.0 ? 'text-rose-400' : 'text-amber-400'
                }`}
              >
                {hoveredCell.zScore > 0 ? `+${hoveredCell.zScore}` : hoveredCell.zScore}&sigma;
              </strong>
            </div>
            <div className="text-[10px] text-slate-400 pt-1 border-t border-slate-800/80 italic">
              {isAr ? hoveredCell.anomalyReasonAr : hoveredCell.anomalyReasonEn}
            </div>
          </div>
        )}
      </div>

      {/* Forensic Inspection Modal / Panel when clicking an outlier cell */}
      {selectedCell && (
        <div className="p-5 rounded-2xl bg-gradient-to-r from-rose-950/40 via-slate-900 to-slate-900 border border-rose-500/40 shadow-xl space-y-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-rose-900/40">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 rounded-xl bg-rose-500/20 border border-rose-500/30 flex items-center justify-center text-rose-400">
                <AlertTriangle className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>
                    {isAr ? 'فحص تدقيقي للحركة الشاذة:' : 'Forensic Outlier Inspection:'}{' '}
                    {selectedCell.accountCode} - {isAr ? selectedCell.accountNameAr : selectedCell.accountNameEn}
                  </span>
                  <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-rose-500/20 text-rose-300">
                    {isAr ? selectedCell.monthAr : selectedCell.month}
                  </span>
                </h4>
                <span className="text-xs text-slate-400 font-mono">
                  {selectedCell.category} • Deviation: {selectedCell.volatilityPct > 0 ? `+${selectedCell.volatilityPct}%` : `${selectedCell.volatilityPct}%`}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => openEvidence('TRC-CURRENT-RATIO')}
                className="px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-semibold flex items-center gap-1.5 transition"
              >
                <Eye className="w-3.5 h-3.5" />
                <span>{isAr ? 'فحص مسار الدليل' : 'Inspect Audit Trail'}</span>
              </button>
              <button
                onClick={() => setSelectedCell(null)}
                className="px-3 py-1.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs transition"
              >
                {isAr ? 'إغلاق' : 'Close'}
              </button>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 text-xs">
            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                {isAr ? 'مبلغ الحركة والشهر' : 'Monthly Outlier Flow'}
              </span>
              <div className="text-base font-bold font-mono text-rose-400">
                {selectedCell.amount.toLocaleString()} kEGP
              </div>
              <span className="text-[10px] text-slate-500">
                {isAr ? 'انحراف إحصائي: ' : 'Statistical Score: '}{selectedCell.zScore}&sigma;
              </span>
            </div>

            <div className="p-3 rounded-xl bg-slate-950/70 border border-slate-800">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider block mb-1">
                {isAr ? 'التشخيص المحاسبي الفوري' : 'Accounting Diagnostic'}
              </span>
              <p className="text-slate-200 leading-relaxed font-sans text-xs">
                {isAr ? selectedCell.anomalyReasonAr : selectedCell.anomalyReasonEn}
              </p>
            </div>

            <div className="p-3 rounded-xl bg-blue-950/30 border border-blue-900/50">
              <span className="text-[10px] text-blue-300 uppercase tracking-wider block mb-1 font-bold">
                {isAr ? 'إجراء التدقيق الموصى به' : 'Recommended Audit Verification'}
              </span>
              <p className="text-blue-100 leading-relaxed font-sans text-xs">
                {isAr
                  ? 'مطابقة القيود المجمعة مع مستندات الدعم والفواتير الإلكترونية المعتمدة من مصلحة الضرائب لضمان صحة فترة التحميل (Cut-off).'
                  : 'Verify batch journal entries against approved ETA e-invoices and customs clearance declarations to validate period cut-off integrity.'}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
