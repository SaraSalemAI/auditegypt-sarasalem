import React, { useState, useMemo } from 'react';
import { OutputLanguage, AccountingFramework, CompanyEntity } from '../../types/accounting';
import {
  Calculator,
  Percent,
  Receipt,
  FileText,
  Download,
  Copy,
  Check,
  ShieldCheck,
  HelpCircle,
  TrendingDown,
  Building2,
  Calendar,
  AlertTriangle,
  Info
} from 'lucide-react';
import * as XLSX from 'xlsx';

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
}

export const TaxCalculationToolkit: React.FC<Props> = ({
  company,
  language,
  framework
}) => {
  const isAr = language === 'ar';
  const [activeTab, setActiveTab] = useState<'vat' | 'wht' | 'cit' | 'disclosures'>('vat');
  const [copied, setCopied] = useState(false);

  // VAT Calculator State
  const [vatStandardSales, setVatStandardSales] = useState(145000); // kEGP
  const [vatMachinerySales, setVatMachinerySales] = useState(18500); // kEGP (5%)
  const [vatExportSales, setVatExportSales] = useState(55200); // kEGP (0%)
  const [vatExemptSales, setVatExemptSales] = useState(12000); // kEGP
  const [vatStandardPurchases, setVatStandardPurchases] = useState(88000); // kEGP (14% input tax)
  const [vatMachineryPurchases, setVatMachineryPurchases] = useState(14000); // kEGP (5% input tax)

  // VAT Calculations
  const vatOutputStandard = (vatStandardSales * 0.14);
  const vatOutputMachinery = (vatMachinerySales * 0.05);
  const totalVatOutput = vatOutputStandard + vatOutputMachinery;

  const vatInputStandard = (vatStandardPurchases * 0.14);
  const vatInputMachinery = (vatMachineryPurchases * 0.05);
  const totalVatInput = vatInputStandard + vatInputMachinery;

  const netVatPayable = totalVatOutput - totalVatInput;

  // WHT Calculator State
  const [whtSuppliesAmount, setWhtSuppliesAmount] = useState(42000); // 1%
  const [whtServicesAmount, setWhtServicesAmount] = useState(18500); // 3%
  const [whtCommissionsAmount, setWhtCommissionsAmount] = useState(6200); // 5%
  const [whtCollectedFromUs, setWhtCollectedFromUs] = useState(2450); // Withheld by customers

  const whtSuppliesTax = whtSuppliesAmount * 0.01;
  const whtServicesTax = whtServicesAmount * 0.03;
  const whtCommissionsTax = whtCommissionsAmount * 0.05;
  const totalWhtPayableForm41 = whtSuppliesTax + whtServicesTax + whtCommissionsTax;

  // Corporate Income Tax State
  const [accountingProfit, setAccountingProfit] = useState(29500); // kEGP
  const [nonDeductibleDepreciation, setNonDeductibleDepreciation] = useState(3800); // Accounting depreciation
  const [taxDepreciation, setTaxDepreciation] = useState(4600); // Tax law 91/2005 rate (accelerated)
  const [excessDonations, setExcessDonations] = useState(450); // Exceeding 10% limit
  const [penaltiesFines, setPenaltiesFines] = useState(320); // Delay fines
  const [unrealizedFxLoss, setUnrealizedFxLoss] = useState(850);
  const [totalAnnualRevenue, setTotalAnnualRevenue] = useState(230700); // For health insurance

  // CIT Calculations
  const taxAdjustmentsAdd = nonDeductibleDepreciation + excessDonations + penaltiesFines + unrealizedFxLoss;
  const taxAdjustmentsDeduct = taxDepreciation;
  const taxableNetProfit = Math.max(0, accountingProfit + taxAdjustmentsAdd - taxAdjustmentsDeduct);
  const citTaxPayableStandard = taxableNetProfit * 0.225; // Standard 22.5%
  const universalHealthContribution = totalAnnualRevenue * 0.0025; // 0.25% Law 2/2018
  const totalTaxBurden = citTaxPayableStandard + universalHealthContribution;
  const effectiveTaxRate = accountingProfit > 0 ? (totalTaxBurden / accountingProfit) * 100 : 0;

  // Law 152/2020 SME Simulation
  const smeApplicable = totalAnnualRevenue <= 10000;
  const smeFlatTax = useMemo(() => {
    if (totalAnnualRevenue < 250) return 1.0;
    if (totalAnnualRevenue <= 500) return 2.5;
    if (totalAnnualRevenue <= 1000) return 5.0;
    if (totalAnnualRevenue <= 2000) return totalAnnualRevenue * 0.005;
    if (totalAnnualRevenue <= 3000) return totalAnnualRevenue * 0.0075;
    if (totalAnnualRevenue <= 10000) return totalAnnualRevenue * 0.01;
    return 0;
  }, [totalAnnualRevenue]);

  // EAS 24 Disclosure Paragraph Generator
  const disclosureDraft = useMemo(() => {
    const diffDepreciation = taxDepreciation - nonDeductibleDepreciation;
    const deferredTaxLiability = diffDepreciation * 0.225;
    return isAr
      ? `إيضاح رقم (24): ضرائب الدخل والالتزامات الضريبية المؤجلة (طبقاً لمعيار المحاسبة المصري رقم 24)
1. عبء الضريبة الحالي لعام 2025:
بلغ صافي الربح المحاسبي قبل الضريبة ${accountingProfit.toLocaleString()} ألف جنيه مصري. وبعد إجراء التسويات الضريبية طبقاً لأحكام القانون رقم 91 لسنة 2005 وتعديلاته (بإضافة التكاليف غير واجبة الخصم بمبلغ ${taxAdjustmentsAdd.toLocaleString()} ألف جنيه واستنزال الفروق الضريبية بمبلغ ${taxAdjustmentsDeduct.toLocaleString()} ألف جنيه)، بلغ الوعاء الضريبي الخاضع للضريبة ${taxableNetProfit.toLocaleString()} ألف جنيه مصري، مما يسفر عن ضريبة دخل مستحقة قدرها ${citTaxPayableStandard.toLocaleString()} ألف جنيه مصري بالسعر القانوني (22.5%).
2. المساهمة التكافلية للتأمين الصحي الشامل:
استناداً إلى أحكام القانون رقم 2 لسنة 2018، قامت الشركة باحتساب المساهمة التكافلية بواقع 2.5 في الألف من إجمالي الإيرادات السنوية البالغة ${totalAnnualRevenue.toLocaleString()} ألف جنيه، لتبلغ قيمة المساهمة ${universalHealthContribution.toLocaleString()} ألف جنيه مصري (غير قابلة للخصم من الوعاء الضريبي).
3. الضرائب المؤجلة:
نشأت فروق ضريبية مؤقتة خاضعة للضريبة ناتجة عن الفارق بين الإهلاك المحاسبي والإهلاك الضريبي المعتمد بمبلغ ${diffDepreciation.toLocaleString()} ألف جنيه مصري، نتج عنها التزام ضريبي مؤجل قدره ${deferredTaxLiability.toLocaleString()} ألف جنيه مصري.`
      : `Note 24: Income Taxes & Deferred Tax Liabilities (in accordance with EAS 24 / IAS 12)
1. Current Tax Expense for FY 2025:
The accounting profit before income tax amounted to ${accountingProfit.toLocaleString()} kEGP. After reconciling for non-deductible tax adjustments under Egyptian Income Tax Law No. 91 of 2005 (add-backs of ${taxAdjustmentsAdd.toLocaleString()} kEGP and tax depreciation deductions of ${taxAdjustmentsDeduct.toLocaleString()} kEGP), the taxable profit base is ${taxableNetProfit.toLocaleString()} kEGP. Current corporate income tax at the statutory rate of 22.5% is ${citTaxPayableStandard.toLocaleString()} kEGP.
2. Universal Health Insurance Contribution (UHIC):
In accordance with Law No. 2 of 2018, the company recognized a solidarity contribution of 0.25% on gross revenue of ${totalAnnualRevenue.toLocaleString()} kEGP, amounting to ${universalHealthContribution.toLocaleString()} kEGP (non-deductible for corporate tax purposes).
3. Deferred Taxes:
Taxable temporary differences arising from the timing variance between accounting depreciation and statutory tax depreciation amounted to ${diffDepreciation.toLocaleString()} kEGP, resulting in a deferred tax liability of ${deferredTaxLiability.toLocaleString()} kEGP.`;
  }, [
    isAr,
    accountingProfit,
    taxAdjustmentsAdd,
    taxAdjustmentsDeduct,
    taxableNetProfit,
    citTaxPayableStandard,
    totalAnnualRevenue,
    universalHealthContribution,
    taxDepreciation,
    nonDeductibleDepreciation
  ]);

  const copyDisclosure = () => {
    navigator.clipboard.writeText(disclosureDraft);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const exportTaxWorkbook = () => {
    const wb = XLSX.utils.book_new();

    // VAT Sheet
    const vatRows = [
      ['VAT Return Form 10 Simulation', 'قيمة المبيعات / المشتريات (kEGP)', 'فئة الضريبة', 'ضريبة القيمة المضافة (kEGP)'],
      ['Standard Sales 14%', vatStandardSales, '14.0%', vatOutputStandard],
      ['Machinery & Production Equipment 5%', vatMachinerySales, '5.0%', vatOutputMachinery],
      ['Export Sales (Zero Rated)', vatExportSales, '0.0%', 0],
      ['Exempt Goods & Services', vatExemptSales, 'Exempt', 0],
      ['TOTAL OUTPUT VAT', vatStandardSales + vatMachinerySales + vatExportSales + vatExemptSales, '', totalVatOutput],
      ['Input Tax - Standard Purchases', vatStandardPurchases, '14.0%', vatInputStandard],
      ['Input Tax - Production Machinery', vatMachineryPurchases, '5.0%', vatInputMachinery],
      ['TOTAL DEDUCTIBLE INPUT VAT', vatStandardPurchases + vatMachineryPurchases, '', totalVatInput],
      ['NET VAT PAYABLE TO TAX AUTHORITY', '', '', netVatPayable]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(vatRows), 'VAT_Form_10');

    // CIT & WHT Sheet
    const citRows = [
      ['Corporate Income Tax Calculation (Law 91/2005)', 'Amount (kEGP)'],
      ['Accounting Net Profit Before Tax', accountingProfit],
      ['Add: Accounting Depreciation', nonDeductibleDepreciation],
      ['Add: Excess Donations (>10%)', excessDonations],
      ['Add: Penalties and Delay Fines', penaltiesFines],
      ['Add: Unrealized Foreign Exchange Losses', unrealizedFxLoss],
      ['Less: Tax Law Depreciation (Art. 25-27)', taxDepreciation],
      ['TAXABLE NET PROFIT BASE', taxableNetProfit],
      ['Corporate Income Tax (22.5%)', citTaxPayableStandard],
      ['Universal Health Contribution (0.25% of Turnover)', universalHealthContribution],
      ['TOTAL STATUTORY TAX BURDEN', totalTaxBurden],
      ['Effective Tax Rate (%)', `${effectiveTaxRate.toFixed(2)}%`]
    ];
    XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(citRows), 'CIT_Reconciliation');

    XLSX.writeFile(wb, 'Ledger_IQ_Egyptian_Tax_Package_2025.xlsx');
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header Banner */}
      <div className="p-6 rounded-2xl bg-gradient-to-r from-slate-900 via-indigo-950/40 to-slate-900 border border-slate-800 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded text-[10px] font-bold uppercase bg-amber-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
              <Calculator className="w-3.5 h-3.5" />
              {isAr ? 'منظومة الحسابات الضريبية المصرية' : 'Egyptian Statutory Tax Engine'}
            </span>
            <span className="text-xs text-slate-400 font-mono">Law 91/2005 · Law 67/2016 · Law 2/2018</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Percent className="w-6 h-6 text-amber-400" />
            {isAr ? 'حزمة الحسابات الضريبية وإقرارات الفحص (VAT / WHT / CIT)' : 'Tax Calculation Toolkit & Statutory Return Models'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'حسابات دقيقة لضريبة القيمة المضافة، الخصم والتحصيل (نموذج 41)، الأرباح التجارية والصناعية، والمساهمة التكافلية للتأمين الصحي الشامل مع صياغة إيضاح EAS 24.'
              : 'End-to-end statutory tax modeling for Egyptian VAT, Withholding Tax (Form 41), Corporate Income Tax, and Universal Health Contribution with EAS 24 / IAS 12 notes.'}
          </p>
        </div>

        <button
          onClick={exportTaxWorkbook}
          className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-semibold shadow-lg shadow-amber-600/20 flex items-center gap-2 transition"
        >
          <Download className="w-4 h-4" />
          {isAr ? 'تصدير حزمة الضرائب (Excel)' : 'Export Tax Model (Excel)'}
        </button>
      </div>

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 border-b border-slate-800 pb-2 overflow-x-auto text-xs">
        <button
          onClick={() => setActiveTab('vat')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'vat'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Receipt className="w-4 h-4" />
          {isAr ? 'القيمة المضافة (VAT - نموذج 10)' : 'Value Added Tax (VAT Form 10)'}
        </button>
        <button
          onClick={() => setActiveTab('wht')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'wht'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4" />
          {isAr ? 'الخصم والتحصيل (WHT - مادة 59)' : 'Withholding Tax (WHT Form 41)'}
        </button>
        <button
          onClick={() => setActiveTab('cit')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'cit'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <Calculator className="w-4 h-4" />
          {isAr ? 'ضريبة الأرباح التجارية (CIT 22.5%)' : 'Corporate Income Tax (CIT)'}
        </button>
        <button
          onClick={() => setActiveTab('disclosures')}
          className={`px-4 py-2 rounded-xl font-semibold transition flex items-center gap-2 ${
            activeTab === 'disclosures'
              ? 'bg-amber-600 text-white shadow-md'
              : 'bg-slate-900/80 text-slate-400 hover:text-white'
          }`}
        >
          <FileText className="w-4 h-4" />
          {isAr ? 'صائغ إيضاحات الضرائب (EAS 24)' : 'EAS 24 / IAS 12 Disclosures'}
        </button>
      </div>

      {/* Tab 1: Value Added Tax (VAT) */}
      {activeTab === 'vat' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <Receipt className="w-4 h-4 text-amber-400" />
                {isAr ? 'مخرجات المبيعات وضريبة المخرجات (Output VAT)' : 'Taxable Sales & Output VAT'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'مبيعات السعر العام 14% (kEGP):' : 'Standard 14% Sales (kEGP):'}
                  </label>
                  <input
                    type="number"
                    value={vatStandardSales}
                    onChange={(e) => setVatStandardSales(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[11px] text-amber-400 font-mono mt-1 block">
                    VAT: {vatOutputStandard.toLocaleString()} kEGP
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'مبيعات آلات ومعدات إنتاج 5% (kEGP):' : 'Capital Machinery 5% (kEGP):'}
                  </label>
                  <input
                    type="number"
                    value={vatMachinerySales}
                    onChange={(e) => setVatMachinerySales(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[11px] text-amber-400 font-mono mt-1 block">
                    VAT: {vatOutputMachinery.toLocaleString()} kEGP
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'عقود تصدير خارجي (سعر صفر 0%):' : 'Export Sales (Zero Rate 0%):'}
                  </label>
                  <input
                    type="number"
                    value={vatExportSales}
                    onChange={(e) => setVatExportSales(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">VAT: 0 kEGP (Refund Eligible)</span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'سلع وخدمات معفاة (جدول الإعفاءات):' : 'Exempt Sales (Table Exemptions):'}
                  </label>
                  <input
                    type="number"
                    value={vatExemptSales}
                    onChange={(e) => setVatExemptSales(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[11px] text-slate-500 font-mono mt-1 block">VAT: 0 kEGP</span>
                </div>
              </div>
            </div>

            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-3 flex items-center gap-2">
                <TrendingDown className="w-4 h-4 text-emerald-400" />
                {isAr ? 'مدخلات المشتريات وضريبة المدخلات القابلة للخصم (Input VAT)' : 'Deductible Input VAT on Purchases'}
              </h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'مشتريات خامات ومستلزمات إنتاج 14%:' : 'Raw Material Purchases 14%:'}
                  </label>
                  <input
                    type="number"
                    value={vatStandardPurchases}
                    onChange={(e) => setVatStandardPurchases(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                    Deductible: {vatInputStandard.toLocaleString()} kEGP
                  </span>
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'شراء آلات ومعدات مصانع 5%:' : 'Machinery Purchases 5%:'}
                  </label>
                  <input
                    type="number"
                    value={vatMachineryPurchases}
                    onChange={(e) => setVatMachineryPurchases(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                  <span className="text-[11px] text-emerald-400 font-mono mt-1 block">
                    Deductible: {vatInputMachinery.toLocaleString()} kEGP
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* VAT Summary Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-300">
                  {isAr ? 'ملخص إقرار القيمة المضافة' : 'VAT Form 10 Summary'}
                </span>
                <span className="text-[10px] font-mono text-amber-400">Monthly Return</span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'إجمالي ضريبة المخرجات:' : 'Total Output VAT:'}</span>
                  <span className="font-mono font-bold text-white">{totalVatOutput.toLocaleString()} kEGP</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'إجمالي ضريبة المدخلات (مخصومة):' : 'Total Deductible Input VAT:'}</span>
                  <span className="font-mono font-bold text-emerald-400">- {totalVatInput.toLocaleString()} kEGP</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white">
                    {isAr ? 'صافي الضريبة واجبة السداد:' : 'Net VAT Payable:'}
                  </span>
                  <span className="text-lg font-mono font-extrabold text-amber-400">
                    {netVatPayable.toLocaleString()} kEGP
                  </span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-1">
                <div className="flex items-center gap-1.5 text-blue-400 font-semibold">
                  <Info className="w-3.5 h-3.5" />
                  <span>{isAr ? 'المواعيد القانونية (ETA):' : 'Statutory ETA Deadline:'}</span>
                </div>
                <p>
                  {isAr
                    ? 'يُقدم الإقرار شهرياً خلال الشهر التالي لانتهاء الفترة الضريبية عبر بوابة مصلحة الضرائب المصرية.'
                    : 'Monthly return must be submitted through ETA portal by the last day of the following month.'}
                </p>
              </div>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-800 text-xs">
              <span className="text-slate-400 block mb-1">{isAr ? 'القيد المحاسبي للتسوية:' : 'Settlement Journal:'}</span>
              <p className="text-[11px] font-mono text-slate-300 bg-slate-950 p-2 rounded border border-slate-800">
                Dr. VAT Output ({totalVatOutput.toFixed(0)}k)<br />
                Cr. VAT Input ({totalVatInput.toFixed(0)}k)<br />
                Cr. VAT Payable to ETA ({netVatPayable.toFixed(0)}k)
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Withholding Tax (WHT Law 91/2005 Art. 59) */}
      {activeTab === 'wht' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Percent className="w-4 h-4 text-blue-400" />
                {isAr ? 'ضريبة الخصم والتحصيل لحساب الضريبة (مادة 59)' : 'Withholding Tax Deductions (Law 91/2005 Art. 59)'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {isAr
                  ? 'المبالغ المخصومة من مستحقات الموردين ومؤدي الخدمات لحساب مصلحة الضرائب المصرية (تورد كل ثلاثة أشهر بنموذج 41).'
                  : 'Tax amounts withheld from suppliers & service providers, remitted quarterly via Egyptian Form 41.'}
              </p>

              <div className="space-y-4 text-xs">
                {/* 1% Supplies */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">
                      {isAr ? 'توريدات سلع ومقاولات وأعمال تركيب (1%)' : 'Supplies & Contracting (1%)'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isAr ? 'قيمة فواتير الموردين المعتمدة الخاضعة للخصم:' : 'Eligible vendor invoices amount:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={whtSuppliesAmount}
                      onChange={(e) => setWhtSuppliesAmount(Number(e.target.value))}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-right"
                    />
                    <span className="w-24 text-right font-mono font-bold text-amber-400">
                      {whtSuppliesTax.toLocaleString()} kEGP
                    </span>
                  </div>
                </div>

                {/* 3% Services */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">
                      {isAr ? 'خدمات واستشارات وصيانة ونقل (3%)' : 'Services, Transport & Maintenance (3%)'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isAr ? 'أتعاب الشركات الخدمية المعتمدة:' : 'Corporate services and logistics invoices:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={whtServicesAmount}
                      onChange={(e) => setWhtServicesAmount(Number(e.target.value))}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-right"
                    />
                    <span className="w-24 text-right font-mono font-bold text-amber-400">
                      {whtServicesTax.toLocaleString()} kEGP
                    </span>
                  </div>
                </div>

                {/* 5% Commissions */}
                <div className="p-3 rounded-lg bg-slate-950 border border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <span className="font-bold text-white block">
                      {isAr ? 'عمولات ومهن حرة وسمسرة (5%)' : 'Commissions & Professional Fees (5%)'}
                    </span>
                    <span className="text-slate-400 text-[11px]">
                      {isAr ? 'أتعاب مكاتب المحاسبة والمحاماة والعملاء المستقلين:' : 'Audit, legal and agency commissions:'}
                    </span>
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="number"
                      value={whtCommissionsAmount}
                      onChange={(e) => setWhtCommissionsAmount(Number(e.target.value))}
                      className="w-32 bg-slate-900 border border-slate-700 rounded-lg p-1.5 text-white font-mono text-right"
                    />
                    <span className="w-24 text-right font-mono font-bold text-amber-400">
                      {whtCommissionsTax.toLocaleString()} kEGP
                    </span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* WHT Form 41 Schedule Card */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-300">
                  {isAr ? 'إقرار نموذج 41 ربع السنوي' : 'Quarterly Form 41 Package'}
                </span>
                <span className="text-[10px] font-mono text-blue-400">Quarterly Schedule</span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'خصم التوريدات (1%):' : 'Supplies WHT (1%):'}</span>
                  <span className="font-mono text-white">{whtSuppliesTax.toLocaleString()} kEGP</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'خصم الخدمات (3%):' : 'Services WHT (3%):'}</span>
                  <span className="font-mono text-white">{whtServicesTax.toLocaleString()} kEGP</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'خصم المهن والعمولات (5%):' : 'Commissions WHT (5%):'}</span>
                  <span className="font-mono text-white">{whtCommissionsTax.toLocaleString()} kEGP</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white">
                    {isAr ? 'إجمالي السداد لنموذج 41:' : 'Total Form 41 Remittance:'}
                  </span>
                  <span className="text-lg font-mono font-extrabold text-blue-400">
                    {totalWhtPayableForm41.toLocaleString()} kEGP
                  </span>
                </div>
              </div>

              <div className="mt-6 p-3 rounded-lg bg-slate-950/80 border border-slate-800 text-[11px] text-slate-400 space-y-2">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-blue-400" />
                  <span>{isAr ? 'مواعيد توريد نموذج 41:' : 'Submission Deadlines:'}</span>
                </div>
                <ul className="space-y-1 font-mono text-[10px] text-slate-400">
                  <li>Q1: April 30 · 30 إبريل</li>
                  <li>Q2: July 31 · 31 يوليو</li>
                  <li>Q3: October 31 · 31 أكتوبر</li>
                  <li>Q4: January 31 · 31 يناير</li>
                </ul>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-xs">
              <span className="text-slate-400 text-[11px] block">
                {isAr ? 'أرصدة خصم استقطعت منا لدى العملاء:' : 'WHT withheld from our receivables:'}
              </span>
              <span className="font-mono font-bold text-emerald-400 text-sm">
                {whtCollectedFromUs.toLocaleString()} kEGP (CIT Credit)
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Corporate Income Tax (CIT) */}
      {activeTab === 'cit' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <div className="p-5 rounded-xl bg-slate-900/90 border border-slate-800">
              <h3 className="text-sm font-bold text-white mb-2 flex items-center gap-2">
                <Calculator className="w-4 h-4 text-emerald-400" />
                {isAr ? 'تسوية صافي الربح المحاسبي إلى الوعاء الضريبي' : 'Accounting Profit to Taxable Base Reconciliation'}
              </h3>
              <p className="text-xs text-slate-400 mb-4">
                {isAr
                  ? 'تعديل صافي الربح الدفتري بإضافة التكاليف غير واجبة الخصم وخصم الإهلاك الضريبي القانوني.'
                  : 'Reconciling accounting net profit under EAS/IFRS with Egyptian Income Tax Law No. 91/2005.'}
              </p>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'صافي الربح الدفتري قبل الضريبة:' : 'Net Accounting Profit Before Tax:'}
                  </label>
                  <input
                    type="number"
                    value={accountingProfit}
                    onChange={(e) => setAccountingProfit(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? 'إجمالي الإيرادات السنوية (للتأمين الصحي):' : 'Annual Gross Turnover (UHIC base):'}
                  </label>
                  <input
                    type="number"
                    value={totalAnnualRevenue}
                    onChange={(e) => setTotalAnnualRevenue(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? '(+) إهلاك دفتري مستبعد:' : '(+) Accounting Depreciation:'}
                  </label>
                  <input
                    type="number"
                    value={nonDeductibleDepreciation}
                    onChange={(e) => setNonDeductibleDepreciation(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? '(-) إهلاك ضريبي معتمد (مادة 25-27):' : '(-) Statutory Tax Depreciation:'}
                  </label>
                  <input
                    type="number"
                    value={taxDepreciation}
                    onChange={(e) => setTaxDepreciation(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? '(+) تبرعات زائدة عن حد 10%:' : '(+) Excess Donations (>10%):'}
                  </label>
                  <input
                    type="number"
                    value={excessDonations}
                    onChange={(e) => setExcessDonations(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>

                <div>
                  <label className="text-slate-400 block mb-1">
                    {isAr ? '(+) غرامات وتأخيرات غير معتمدة:' : '(+) Fines & Delay Penalties:'}
                  </label>
                  <input
                    type="number"
                    value={penaltiesFines}
                    onChange={(e) => setPenaltiesFines(Number(e.target.value))}
                    className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-white font-mono"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* CIT Calculation Summary */}
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800 flex flex-col justify-between">
            <div>
              <div className="flex items-center justify-between pb-3 border-b border-slate-800">
                <span className="text-xs font-bold uppercase text-slate-300">
                  {isAr ? 'الوعاء والعبء الضريبي الإجمالي' : 'Tax Assessment & Total Burden'}
                </span>
                <span className="text-[10px] font-mono text-emerald-400">Statutory 22.5%</span>
              </div>

              <div className="mt-4 space-y-3 text-xs">
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'الوعاء الضريبي الخاضع:' : 'Net Taxable Profit Base:'}</span>
                  <span className="font-mono font-bold text-white">{taxableNetProfit.toLocaleString()} kEGP</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'ضريبة الأرباح (22.5%):' : 'Corporate Tax (22.5%):'}</span>
                  <span className="font-mono font-bold text-emerald-400">{citTaxPayableStandard.toLocaleString()} kEGP</span>
                </div>
                <div className="flex justify-between text-slate-300">
                  <span>{isAr ? 'المساهمة التكافلية (0.25%):' : 'Health Contribution (0.25%):'}</span>
                  <span className="font-mono font-bold text-blue-400">{universalHealthContribution.toLocaleString()} kEGP</span>
                </div>
                <div className="pt-3 border-t border-slate-800 flex justify-between items-center">
                  <span className="font-bold text-white">
                    {isAr ? 'إجمالي الالتزام الضريبي السنوي:' : 'Total Annual Tax Liability:'}
                  </span>
                  <span className="text-lg font-mono font-extrabold text-amber-400">
                    {totalTaxBurden.toLocaleString()} kEGP
                  </span>
                </div>
                <div className="flex justify-between text-slate-400 text-[11px] pt-1">
                  <span>{isAr ? 'معدل الضريبة الفعلي (ETR):' : 'Effective Tax Rate (ETR):'}</span>
                  <span className="font-mono font-bold text-white">{effectiveTaxRate.toFixed(2)}%</span>
                </div>
              </div>

              {/* SME Law 152/2020 check */}
              <div className="mt-5 p-3 rounded-lg bg-slate-950 border border-slate-800 text-[11px]">
                <span className="font-bold text-slate-300 block mb-1">
                  {isAr ? 'نظام المشروعات الصغيرة (قانون 152 لسنة 2020):' : 'SME Law 152/2020 Eligibility:'}
                </span>
                <p className="text-slate-400">
                  {smeApplicable
                    ? (isAr
                        ? `الكيان مؤهل لتطبيق ضريبة قطعية مبسطة بمبلغ ${smeFlatTax} ألف جنيه مصري.`
                        : `Company is eligible for simplified flat SME tax of ${smeFlatTax} kEGP.`)
                    : (isAr
                        ? 'إيرادات الشركة تتجاوز 10 مليون جنيه؛ تطبق أحكام الضريبة العامة (22.5%).'
                        : 'Company revenues exceed 10M EGP threshold; standard 22.5% CIT regime applies.')}
                </p>
              </div>
            </div>

            <div className="mt-4 pt-3 border-t border-slate-800 text-[11px] text-slate-400">
              <span>{isAr ? 'موعد تقديم الإقرار السنوي:' : 'Statutory Return Due Date:'}</span>{' '}
              <strong className="text-slate-200">30 April (إبريل)</strong>
            </div>
          </div>
        </div>
      )}

      {/* Tab 4: Disclosures & Draft Notes */}
      {activeTab === 'disclosures' && (
        <div className="space-y-4">
          <div className="p-5 rounded-xl bg-slate-900 border border-slate-800">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <FileText className="w-4 h-4 text-amber-400" />
                  {isAr ? 'مسودة الإيضاح المتمم للضرائب (EAS 24 / IAS 12)' : 'Draft Statutory Note: Income Taxes & Deferred Tax'}
                </h3>
                <span className="text-xs text-slate-400">
                  {isAr ? 'جاهزة للإدراج المباشر في القوائم المالية المدققة' : 'Ready for direct inclusion in the audited financial statements'}
                </span>
              </div>
              <button
                onClick={copyDisclosure}
                className="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center gap-1.5 transition self-start sm:self-auto"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                {copied ? (isAr ? 'تم النسخ بنجاح' : 'Copied!') : (isAr ? 'نسخ نص الإيضاح' : 'Copy Disclosure Text')}
              </button>
            </div>

            <div className="mt-4 p-4 rounded-xl bg-slate-950 border border-slate-800 text-xs text-slate-200 leading-relaxed font-sans whitespace-pre-line">
              {disclosureDraft}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
