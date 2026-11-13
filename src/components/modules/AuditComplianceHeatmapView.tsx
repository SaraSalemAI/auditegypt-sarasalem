import React, { useState, useEffect, useRef } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import * as d3 from 'd3';
import {
  Calendar,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Filter,
  Download,
  ShieldAlert,
  Building,
  Info,
  CalendarRange
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface ComplianceFilingItem {
  id: string;
  nameEn: string;
  nameAr: string;
  authorityEn: string;
  authorityAr: string;
  authorityCode: 'ETA' | 'GAFI' | 'FRA' | 'NOSI' | 'AUDIT';
  frequency: 'Monthly' | 'Quarterly' | 'Annual';
  monthIndex: number; // 0 = Jan, 11 = Dec
  dayOfMonth: number;
  dueDate: string;
  daysRemaining: number;
  status: 'overdue' | 'impending' | 'on_track' | 'completed';
  penaltyRiskEn: string;
  penaltyRiskAr: string;
  statuteReference: string;
}

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

const STATUTORY_FILINGS: ComplianceFilingItem[] = [
  {
    id: 'FIL-ETA-VAT-12',
    nameEn: 'December 2025 VAT Return (Form 10)',
    nameAr: 'إقرار ضريبة القيمة المضافة لشهر ديسمبر (نموذج 10)',
    authorityEn: 'Egyptian Tax Authority (ETA)',
    authorityAr: 'مصلحة الضرائب المصرية',
    authorityCode: 'ETA',
    frequency: 'Monthly',
    monthIndex: 0, // Jan 31, 2026
    dayOfMonth: 31,
    dueDate: '2026-01-31',
    daysRemaining: 18,
    status: 'impending',
    penaltyRiskEn: 'Delay fine of 1% per month plus statutory fine up to 50,000 EGP (Law 206/2020 Art. 67).',
    penaltyRiskAr: 'غرامة تأخير 1% شهرياً بالإضافة لغرامة من 5,000 إلى 50,000 ج.م وفقاً للمادة 67 من قانون الإجراءات الضريبية الموحد.',
    statuteReference: 'Law 67/2016 Art. 14 & Law 206/2020'
  },
  {
    id: 'FIL-ETA-WHT-Q4',
    nameEn: 'Q4 2025 Withholding Tax Return (Form 41)',
    nameAr: 'نموذج 41 الخصم والتحصيل للربع الرابع 2025',
    authorityEn: 'Egyptian Tax Authority (ETA)',
    authorityAr: 'مصلحة الضرائب المصرية',
    authorityCode: 'ETA',
    frequency: 'Quarterly',
    monthIndex: 0, // Jan 31
    dayOfMonth: 31,
    dueDate: '2026-01-31',
    daysRemaining: 18,
    status: 'impending',
    penaltyRiskEn: 'Fixed statutory penalty of 3,000 to 50,000 EGP for late Form 41 submission.',
    penaltyRiskAr: 'غرامة مالية من 3,000 حتى 50,000 ج.م لعدم توريد نموذج 41 في الموعد القانوني.',
    statuteReference: 'Law 91/2005 Art. 59'
  },
  {
    id: 'FIL-ETA-SALARY-ANN',
    nameEn: 'Annual Payroll Tax Reconciliation (Form 4 Payroll)',
    nameAr: 'التسوية السنوية لضريبة كسب العمل والمرتبات (نموذج 4)',
    authorityEn: 'Egyptian Tax Authority (ETA)',
    authorityAr: 'مصلحة الضرائب المصرية',
    authorityCode: 'ETA',
    frequency: 'Annual',
    monthIndex: 0, // Jan 31
    dayOfMonth: 31,
    dueDate: '2026-01-31',
    daysRemaining: 18,
    status: 'impending',
    penaltyRiskEn: 'Disallowance of wage expenses from corporate income tax deductions plus interest.',
    penaltyRiskAr: 'عدم اعتماد مصروفات الأجور والمرتبات ضريبياً واحتساب فوائد تأخير وفقاً لسعر الإقراض والخصم.',
    statuteReference: 'Law 91/2005 Art. 13-16'
  },
  {
    id: 'FIL-ETA-CIT-2025',
    nameEn: 'Corporate Income Tax Annual Return & Audited Accounts',
    nameAr: 'الإقرار الضريبي السنوي لضريبة الدخل والقوائم المعتمدة',
    authorityEn: 'Egyptian Tax Authority (ETA)',
    authorityAr: 'مصلحة الضرائب المصرية',
    authorityCode: 'ETA',
    frequency: 'Annual',
    monthIndex: 3, // April 30
    dayOfMonth: 30,
    dueDate: '2026-04-30',
    daysRemaining: 108,
    status: 'on_track',
    penaltyRiskEn: 'Penalty of 50,000 to 2,000,000 EGP for failure to submit audited corporate tax declaration.',
    penaltyRiskAr: 'غرامة من 50 ألف إلى 2 مليون جنيه لعدم تقديم إقرار شركات الأموال المعتمد من محاسب قانوني.',
    statuteReference: 'Law 206/2020 Art. 69'
  },
  {
    id: 'FIL-GAFI-OGM-2025',
    nameEn: 'Ordinary General Meeting (OGM) & Annual FS Filing',
    nameAr: 'الجمعية العامة العادية السنوية وإيداع القوائم المالية بالهيئة',
    authorityEn: 'General Authority for Investment (GAFI)',
    authorityAr: 'الهيئة العامة للاستثمار والمناطق الحرة',
    authorityCode: 'GAFI',
    frequency: 'Annual',
    monthIndex: 2, // March 31
    dayOfMonth: 31,
    dueDate: '2026-03-31',
    daysRemaining: 78,
    status: 'on_track',
    penaltyRiskEn: 'Suspension of commercial register renewals and administrative fines on board members.',
    penaltyRiskAr: 'تجميد تجديد السجل التجاري وغرامات إدارية على أعضاء مجلس الإدارة لعدم اعتماد الجمعية.',
    statuteReference: 'Companies Law 159/1981 Art. 61'
  },
  {
    id: 'FIL-NOSI-INS-2',
    nameEn: 'Social Insurance Annual Wage Census (Form 2 Social Ins.)',
    nameAr: 'استمارة (2) تأمينات اجتماعية سنوية وتحديث الأجور التأمينية',
    authorityEn: 'National Organization for Social Insurance (NOSI)',
    authorityAr: 'الهيئة القومية للتأمين الاجتماعي',
    authorityCode: 'NOSI',
    frequency: 'Annual',
    monthIndex: 0, // Jan 31
    dayOfMonth: 31,
    dueDate: '2026-01-31',
    daysRemaining: 18,
    status: 'impending',
    penaltyRiskEn: 'Administrative levy and 2% monthly delay interest on undeclared wage increases.',
    penaltyRiskAr: 'مستحقات تأمينية تقديرية وغرامة تأخير 2% شهرياً عن الزيادات غير المعلنة.',
    statuteReference: 'Law 148/2019'
  },
  {
    id: 'FIL-FRA-AUDIT-OP',
    nameEn: 'Statutory Independent Audit Opinion & Management Letter',
    nameAr: 'تقرير مراقب الحسابات المستقل وخطاب الإدارة السنوي',
    authorityEn: 'Audit & Oversight Body',
    authorityAr: 'سجل المحاسبين والمراجعين / هيئة الرقابة',
    authorityCode: 'AUDIT',
    frequency: 'Annual',
    monthIndex: 2, // March 15
    dayOfMonth: 15,
    dueDate: '2026-03-15',
    daysRemaining: 62,
    status: 'on_track',
    penaltyRiskEn: 'Delay hinders board approval and commercial bank borrowing facility covenants.',
    penaltyRiskAr: 'تأخير التقرير يوقف تجديد التسهيلات المصرفية واعتماد الميزانية.',
    statuteReference: 'ISA 700 / Egyptian Auditing Standards'
  },
  {
    id: 'FIL-ETA-STAMP-DUTY',
    nameEn: 'Annual Banking Credit Facilities Stamp Duty Settlement',
    nameAr: 'التسوية السنوية لضريبة الدمغة النسبية على التسهيلات الائتمانية',
    authorityEn: 'Egyptian Tax Authority (ETA)',
    authorityAr: 'مصلحة الضرائب المصرية',
    authorityCode: 'ETA',
    frequency: 'Quarterly',
    monthIndex: 11, // Dec 31 (Overdue simulation for audit alert)
    dayOfMonth: 31,
    dueDate: '2025-12-31',
    daysRemaining: -12,
    status: 'overdue',
    penaltyRiskEn: 'Overdue! Compound interest calculated daily on unremitted bank stamp duty balance.',
    penaltyRiskAr: 'متأخر! احتساب فوائد تأخير يومية بنكياً على رصيد الدمغة النسبية غير المسددة.',
    statuteReference: 'Stamp Tax Law 111/1980 Art. 60'
  }
];

export const AuditComplianceHeatmapView: React.FC<Props> = ({
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';
  const svgRef = useRef<SVGSVGElement | null>(null);

  const [selectedAuthority, setSelectedAuthority] = useState<'ALL' | 'ETA' | 'GAFI' | 'NOSI' | 'AUDIT'>('ALL');
  const [selectedFiling, setSelectedFiling] = useState<ComplianceFilingItem | null>(STATUTORY_FILINGS[7]); // Defaults to the overdue one for immediate inspection
  const [hoveredFiling, setHoveredFiling] = useState<ComplianceFilingItem | null>(null);

  const filteredFilings = STATUTORY_FILINGS.filter(
    (f) => selectedAuthority === 'ALL' || f.authorityCode === selectedAuthority
  );

  // Statistics
  const overdueCount = STATUTORY_FILINGS.filter((f) => f.status === 'overdue').length;
  const impendingCount = STATUTORY_FILINGS.filter((f) => f.status === 'impending').length;
  const onTrackCount = STATUTORY_FILINGS.filter((f) => f.status === 'on_track').length;

  // D3 Render
  useEffect(() => {
    if (!svgRef.current) return;

    const width = 860;
    const height = 360;
    const margin = { top: 40, right: 30, bottom: 50, left: 160 };

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    svg.attr('viewBox', `0 0 ${width} ${height}`).attr('width', '100%').attr('height', '100%');

    // Months columns (Jan to Dec)
    const monthsEn = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const monthsAr = ['يناير', 'فبراير', 'مارس', 'إبريل', 'مايو', 'يونيو', 'يوليو', 'أغسطس', 'سبتمبر', 'أكتوبر', 'نوفمبر', 'ديسمبر'];
    const months = isAr ? monthsAr : monthsEn;

    // Authorities / Categories for Y-axis
    const categories = ['ETA (ضرائب)', 'GAFI (استثمار)', 'NOSI (تأمينات)', 'AUDIT (مراجعة)'];

    const xScale = d3
      .scaleBand()
      .domain(months)
      .range([margin.left, width - margin.right])
      .padding(0.12);

    const yScale = d3
      .scaleBand()
      .domain(categories)
      .range([margin.top, height - margin.bottom])
      .padding(0.18);

    // Color mapper
    const statusColor = (status: string) => {
      if (status === 'overdue') return '#ef4444'; // Red
      if (status === 'impending') return '#f59e0b'; // Amber
      if (status === 'completed') return '#3b82f6'; // Blue
      return '#10b981'; // Green
    };

    // Draw background grid cells
    categories.forEach((cat) => {
      months.forEach((m) => {
        svg
          .append('rect')
          .attr('x', xScale(m) || 0)
          .attr('y', yScale(cat) || 0)
          .attr('width', xScale.bandwidth())
          .attr('height', yScale.bandwidth())
          .attr('rx', 6)
          .attr('fill', '#0f172a')
          .attr('stroke', '#1e293b')
          .attr('stroke-width', 1);
      });
    });

    // Draw X Axis (Months)
    svg
      .append('g')
      .attr('transform', `translate(0, ${height - margin.bottom + 10})`)
      .call(d3.axisBottom(xScale).tickSize(0))
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#94a3b8')
      .attr('font-size', '11px')
      .attr('font-family', 'ui-monospace, monospace');

    // Draw Y Axis (Categories)
    svg
      .append('g')
      .attr('transform', `translate(${margin.left - 10}, 0)`)
      .call(d3.axisLeft(yScale).tickSize(0))
      .call((g) => g.select('.domain').remove())
      .selectAll('text')
      .attr('fill', '#cbd5e1')
      .attr('font-size', '11px')
      .attr('font-weight', '600');

    // Plot compliance filing markers on heatmap
    filteredFilings.forEach((filing) => {
      const monthLabel = months[filing.monthIndex];
      let catLabel = categories[0];
      if (filing.authorityCode === 'GAFI') catLabel = categories[1];
      if (filing.authorityCode === 'NOSI') catLabel = categories[2];
      if (filing.authorityCode === 'AUDIT') catLabel = categories[3];

      const cellX = xScale(monthLabel) || 0;
      const cellY = yScale(catLabel) || 0;
      const cellW = xScale.bandwidth();
      const cellH = yScale.bandwidth();

      const g = svg
        .append('g')
        .attr('class', 'compliance-marker')
        .attr('cursor', 'pointer')
        .on('mouseenter', (event: MouseEvent) => {
          setHoveredFiling(filing);
          d3.select(event.currentTarget as SVGGElement)
            .select('rect')
            .attr('stroke', '#ffffff')
            .attr('stroke-width', 2);
        })
        .on('mouseleave', (event: MouseEvent) => {
          setHoveredFiling(null);
          d3.select(event.currentTarget as SVGGElement)
            .select('rect')
            .attr('stroke', statusColor(filing.status))
            .attr('stroke-width', filing.status === 'overdue' ? 2 : 1);
        })
        .on('click', () => {
          setSelectedFiling(filing);
        });

      // Active colored block inside cell
      g.append('rect')
        .attr('x', cellX + 3)
        .attr('y', cellY + 3)
        .attr('width', cellW - 6)
        .attr('height', cellH - 6)
        .attr('rx', 5)
        .attr('fill', statusColor(filing.status))
        .attr('fill-opacity', 0.85)
        .attr('stroke', statusColor(filing.status))
        .attr('stroke-width', filing.status === 'overdue' ? 2 : 1);

      // Label text
      g.append('text')
        .attr('x', cellX + cellW / 2)
        .attr('y', cellY + cellH / 2 + 4)
        .attr('text-anchor', 'middle')
        .attr('fill', '#ffffff')
        .attr('font-size', '10px')
        .attr('font-weight', 'bold')
        .attr('font-family', 'ui-monospace, monospace')
        .text(filing.status === 'overdue' ? '! OVERDUE' : `${filing.dayOfMonth}th`);
    });
  }, [filteredFilings, isAr]);

  const exportComplianceExcel = () => {
    const wb = XLSX.utils.book_new();
    const rows = STATUTORY_FILINGS.map((f) => ({
      ID: f.id,
      Filing: f.nameEn,
      'Filing (Arabic)': f.nameAr,
      Authority: f.authorityEn,
      Frequency: f.frequency,
      'Due Date': f.dueDate,
      'Days Remaining': f.daysRemaining,
      Status: f.status.toUpperCase(),
      'Legal Citation': f.statuteReference,
      'Penalty Risk': f.penaltyRiskEn
    }));
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), 'Statutory_Compliance_Matrix');
    XLSX.writeFile(wb, 'Audit_Compliance_Deadlines_2026.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-rose-950/30 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-rose-500/20 text-rose-300 border border-rose-500/30 flex items-center gap-1">
              <ShieldAlert className="w-3.5 h-3.5" />
              {isAr ? 'خريطة الامتثال للمواعيد الرقابية والضريبية' : 'Audit Compliance Deadline Heatmap (D3.js)'}
            </span>
            <span className="text-xs text-slate-400 font-mono">ETA · GAFI · FRA · Law 206/2020</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <CalendarRange className="w-6 h-6 text-rose-400" />
            {isAr ? 'مصفوفة مواعيد الإقرارات والالتزامات القانونية' : 'Statutory Deadlines Matrix & Audit Attention Heatmap'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'مخطط بياني تفاعلي باستخدام D3.js يرصد مواعيد تقديم الإقرارات الضريبية والمالية مع تمييز المواعيد الوشيكة باللون الأصفر والمتأخرة باللون الأحمر للتدخل الفوري.'
              : 'Interactive D3.js calendar matrix visualizing all statutory filing dates, color-flagging impending deadlines in amber and overdue items in red for audit scrutiny.'}
          </p>
        </div>

        <button
          onClick={exportComplianceExcel}
          className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 text-xs font-semibold shadow-md flex items-center gap-1.5 transition"
        >
          <Download className="w-4 h-4" />
          {isAr ? 'تصدير جدول المواعيد (Excel)' : 'Export Deadlines (Excel)'}
        </button>
      </div>

      {/* KPI Counters: Overdue, Impending, On Track */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Overdue */}
        <div className="p-4 rounded-xl bg-rose-950/30 border border-rose-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-rose-400 uppercase tracking-wider block">
              {isAr ? 'التزامات متأخرة واجبة السداد فورا' : 'Overdue Compliance Items'}
            </span>
            <div className="text-2xl font-bold font-mono text-rose-400 mt-1">
              {overdueCount} {isAr ? 'بند متأخر' : 'Overdue'}
            </div>
            <span className="text-[11px] text-slate-400">Immediate Auditor Action Required</span>
          </div>
          <AlertTriangle className="w-8 h-8 text-rose-400" />
        </div>

        {/* Impending */}
        <div className="p-4 rounded-xl bg-amber-950/30 border border-amber-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-amber-400 uppercase tracking-wider block">
              {isAr ? 'مواعيد وشيكة (أقل من 30 يوماً)' : 'Impending Deadlines (<30 Days)'}
            </span>
            <div className="text-2xl font-bold font-mono text-amber-400 mt-1">
              {impendingCount} {isAr ? 'استحقاقات قادمة' : 'Impending'}
            </div>
            <span className="text-[11px] text-slate-400">VAT Form 10 & WHT Form 41</span>
          </div>
          <Clock className="w-8 h-8 text-amber-400" />
        </div>

        {/* On Track */}
        <div className="p-4 rounded-xl bg-emerald-950/30 border border-emerald-800/60 flex items-center justify-between">
          <div>
            <span className="text-xs font-bold text-emerald-400 uppercase tracking-wider block">
              {isAr ? 'التزامات سنوية في مسارها الطبيعي' : 'On Track Statutory Filings'}
            </span>
            <div className="text-2xl font-bold font-mono text-emerald-400 mt-1">
              {onTrackCount} {isAr ? 'التزامات' : 'On Track'}
            </div>
            <span className="text-[11px] text-slate-400">CIT Return & Annual OGM</span>
          </div>
          <CheckCircle2 className="w-8 h-8 text-emerald-400" />
        </div>
      </div>

      {/* Heatmap Card */}
      <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Calendar className="w-4 h-4 text-blue-400" />
              {isAr ? 'خريطة التوزيع الزمني للالتزامات عبر الشهور (D3.js Interactive Matrix)' : 'D3.js Statutory Timeline Distribution Matrix'}
            </h3>
            <span className="text-xs text-slate-400">
              {isAr ? 'انقر على أي مستطيل بالخريطة لعرض تفاصيل الالتزام والمخاطر القانونية المرتبطة' : 'Click on any cell to view statutory details, penalties, and audit steps'}
            </span>
          </div>

          {/* Authority Filter Tabs */}
          <div className="flex items-center gap-1 bg-slate-950 p-1 rounded-xl border border-slate-800 text-xs">
            {(['ALL', 'ETA', 'GAFI', 'NOSI', 'AUDIT'] as const).map((auth) => (
              <button
                key={auth}
                onClick={() => setSelectedAuthority(auth)}
                className={`px-2.5 py-1 rounded-lg font-semibold transition ${
                  selectedAuthority === auth
                    ? 'bg-blue-600 text-white'
                    : 'text-slate-400 hover:text-white'
                }`}
              >
                {auth}
              </button>
            ))}
          </div>
        </div>

        {/* SVG Container */}
        <div className="w-full overflow-x-auto bg-[#070e20] p-4 rounded-xl border border-slate-800/80">
          <svg ref={svgRef} className="mx-auto" />
        </div>

        {/* Legend */}
        <div className="flex items-center justify-center gap-6 text-xs text-slate-400 pt-2">
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-rose-500" />
            <span>{isAr ? 'متأخر (تنبيه فوري)' : 'Overdue (<0 Days)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-amber-500" />
            <span>{isAr ? 'وشيك (أقل من 30 يوم)' : 'Impending (<30 Days)'}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="w-3.5 h-3.5 rounded bg-emerald-500" />
            <span>{isAr ? 'في المسار الطبيعي (>30 يوم)' : 'On Track (>30 Days)'}</span>
          </div>
        </div>
      </div>

      {/* Selected Filing Detail Drawer / Card */}
      {selectedFiling && (
        <div className="p-5 rounded-2xl bg-slate-900 border border-slate-800 space-y-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span
                  className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase ${
                    selectedFiling.status === 'overdue'
                      ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                      : selectedFiling.status === 'impending'
                      ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                      : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  }`}
                >
                  {selectedFiling.status}
                </span>
                <span className="text-xs font-mono text-slate-400">{selectedFiling.authorityCode}</span>
                <span className="text-xs text-slate-500">·</span>
                <span className="text-xs font-mono text-blue-400">{selectedFiling.dueDate}</span>
              </div>
              <h3 className="text-base font-bold text-white">
                {isAr ? selectedFiling.nameAr : selectedFiling.nameEn}
              </h3>
              <p className="text-xs text-slate-400 mt-1">
                {isAr ? selectedFiling.authorityAr : selectedFiling.authorityEn} · {selectedFiling.frequency}
              </p>
            </div>

            <div className="text-right">
              <span className="text-[11px] text-slate-400 block">{isAr ? 'الأيام المتبقية' : 'Days Remaining'}</span>
              <span
                className={`text-2xl font-bold font-mono ${
                  selectedFiling.daysRemaining < 0
                    ? 'text-rose-400'
                    : selectedFiling.daysRemaining <= 30
                    ? 'text-amber-400'
                    : 'text-emerald-400'
                }`}
              >
                {selectedFiling.daysRemaining < 0
                  ? `${Math.abs(selectedFiling.daysRemaining)} Days LATE`
                  : `${selectedFiling.daysRemaining} Days`}
              </span>
            </div>
          </div>

          <div className="p-4 rounded-xl bg-slate-950 border border-slate-800 grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
            <div>
              <span className="font-semibold text-slate-400 block mb-1">
                {isAr ? 'المخاطر القانونية والغرامات المحتملة:' : 'Statutory Penalty & Legal Exposure:'}
              </span>
              <p className="text-rose-300 leading-relaxed font-sans">
                {isAr ? selectedFiling.penaltyRiskAr : selectedFiling.penaltyRiskEn}
              </p>
            </div>
            <div>
              <span className="font-semibold text-slate-400 block mb-1">
                {isAr ? 'السند القانوني والتشريعي:' : 'Statutory Reference:'}
              </span>
              <p className="text-slate-200 font-mono text-[11px]">
                {selectedFiling.statuteReference}
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
