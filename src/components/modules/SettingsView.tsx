import React, { useState } from 'react';
import {
  CompanyEntity,
  OutputLanguage,
  AccountingFramework,
  CurrencyCode,
  ScaleUnit
} from '../../types/accounting';
import {
  Settings,
  Building,
  Globe,
  DollarSign,
  Layers,
  ShieldCheck,
  CheckCircle2,
  RefreshCw,
  Save,
  Info
} from 'lucide-react';

interface Props {
  company: CompanyEntity;
  language: OutputLanguage;
  framework: AccountingFramework;
  onUpdateCompany: (company: CompanyEntity) => void;
  onFrameworkChange: (fw: AccountingFramework) => void;
  onLanguageChange: (lang: OutputLanguage) => void;
}

export const SettingsView: React.FC<Props> = ({
  company,
  language,
  framework,
  onUpdateCompany,
  onFrameworkChange,
  onLanguageChange
}) => {
  const isAr = language === 'ar';
  const [formData, setFormData] = useState<CompanyEntity>(company);
  const [savedMessage, setSavedMessage] = useState(false);

  const handleSave = () => {
    onUpdateCompany(formData);
    onFrameworkChange(formData.reportingFramework);
    setSavedMessage(true);
    setTimeout(() => setSavedMessage(false), 3000);
  };

  return (
    <div className="space-y-6" dir={isAr ? 'rtl' : 'ltr'}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 p-6 rounded-2xl bg-slate-900 border border-slate-800">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2 py-0.5 rounded text-[10px] font-bold uppercase bg-blue-500/20 text-blue-400 border border-blue-500/30">
              {isAr ? 'إعدادات المنشأة والحوكمة المالية' : 'Corporate Governance & Configuration'}
            </span>
            <span className="text-xs text-slate-400 font-mono">CR: {formData.crNumber}</span>
          </div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Settings className="w-6 h-6 text-blue-400" />
            {isAr ? 'إعدادات المنظومة والكيانات المحاسبية والعملات' : 'System Settings & Corporate Entities Configuration'}
          </h2>
          <p className="text-xs text-slate-300 mt-1 max-w-2xl">
            {isAr
              ? 'تكوين الإطار المحاسبي المطبق، عملة التقارير، مقياس الأرقام، وبيانات التسجيل التجاري والضريبي للكيان المحاسبي.'
              : 'Configure statutory accounting standard, reporting currency, numerical scale, and corporate registration IDs.'}
          </p>
        </div>

        <button
          onClick={handleSave}
          className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white text-xs font-bold shadow-lg shadow-blue-600/30 flex items-center gap-2 transition"
        >
          <Save className="w-4 h-4" />
          {isAr ? 'حفظ التغييرات' : 'Save Configuration'}
        </button>
      </div>

      {savedMessage && (
        <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-900/60 flex items-center gap-2 text-xs text-emerald-300">
          <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          <span>{isAr ? 'تم حفظ وتطبيق إعدادات المنشأة بنجاح!' : 'Settings successfully saved and applied!'}</span>
        </div>
      )}

      {/* Main Settings Form */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left: Entity Identification */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Building className="w-4 h-4 text-blue-400" />
            {isAr ? 'بيانات الكيان والشركة والملف الضريبي' : 'Corporate Entity Profile & Registration'}
          </h3>

          <div className="space-y-3">
            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'اسم الشركة (عربي رسمي)' : 'Company Name (Arabic)'}</label>
              <input
                type="text"
                value={formData.nameAr}
                onChange={(e) => setFormData({ ...formData, nameAr: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-semibold"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'اسم الشركة (English)' : 'Company Legal Name (English)'}</label>
              <input
                type="text"
                value={formData.nameEn}
                onChange={(e) => setFormData({ ...formData, nameEn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2.5 text-slate-100 font-semibold"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'رقم السجل التجاري' : 'Commercial Registration (CR)'}</label>
                <input
                  type="text"
                  value={formData.crNumber}
                  onChange={(e) => setFormData({ ...formData, crNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-200"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'رقم التسجيل الضريبي' : 'Tax Registration Number'}</label>
                <input
                  type="text"
                  value={formData.taxRegistrationNumber}
                  onChange={(e) => setFormData({ ...formData, taxRegistrationNumber: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-200"
                />
              </div>
            </div>

            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'الشكل القانوني للمنشأة' : 'Legal Corporate Structure'}</label>
              <input
                type="text"
                value={isAr ? formData.legalStructureAr : formData.legalStructureEn}
                onChange={(e) => setFormData({ ...formData, legalStructureAr: e.target.value, legalStructureEn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>

            <div>
              <label className="text-slate-400 block mb-1">{isAr ? 'القطاع الصناعي الرئيسي' : 'Primary Sector / Industry'}</label>
              <input
                type="text"
                value={isAr ? formData.industryAr : formData.industryEn}
                onChange={(e) => setFormData({ ...formData, industryAr: e.target.value, industryEn: e.target.value })}
                className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200"
              />
            </div>
          </div>
        </div>

        {/* Right: Accounting Framework & Localization Standards */}
        <div className="p-6 rounded-2xl bg-slate-900 border border-slate-800 space-y-4 text-xs">
          <h3 className="text-sm font-bold text-white flex items-center gap-2 pb-2 border-b border-slate-800">
            <Globe className="w-4 h-4 text-emerald-400" />
            {isAr ? 'معايير المحاسبة واللغة ومقياس الأرقام' : 'Statutory Framework, Currency & Scales'}
          </h3>

          <div className="space-y-4">
            {/* Framework */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-semibold">
                {isAr ? 'الإطار المحاسبي المطبق للقوائم (Accounting Standard)' : 'Statutory Accounting Framework'}
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, reportingFramework: 'EAS' })}
                  className={`p-3 rounded-xl border text-left transition ${
                    formData.reportingFramework === 'EAS'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-sm">EAS (المصرية)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">Egyptian Accounting Standards</div>
                </button>
                <button
                  type="button"
                  onClick={() => setFormData({ ...formData, reportingFramework: 'IFRS' })}
                  className={`p-3 rounded-xl border text-left transition ${
                    formData.reportingFramework === 'IFRS'
                      ? 'bg-blue-600/20 border-blue-500 text-blue-300 font-bold'
                      : 'bg-slate-950 border-slate-800 text-slate-400'
                  }`}
                >
                  <div className="font-bold text-sm">IFRS (الدولية)</div>
                  <div className="text-[10px] text-slate-400 mt-0.5">International Financial Reporting</div>
                </button>
              </div>
            </div>

            {/* Language Selector */}
            <div>
              <label className="text-slate-400 block mb-1.5 font-semibold">
                {isAr ? 'لغة العرض والتقارير المالية (مستقلة عن المعيار)' : 'Reporting Display Language (Independent of Framework)'}
              </label>
              <div className="grid grid-cols-3 gap-2">
                {(['ar', 'en', 'bilingual'] as OutputLanguage[]).map((lang) => (
                  <button
                    key={lang}
                    type="button"
                    onClick={() => onLanguageChange(lang)}
                    className={`py-2 px-3 rounded-xl border text-center font-bold transition ${
                      language === lang
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow'
                        : 'bg-slate-950 text-slate-400 border-slate-800'
                    }`}
                  >
                    {lang === 'ar' ? 'العربية' : lang === 'en' ? 'English' : 'مزدوج (Bilingual)'}
                  </button>
                ))}
              </div>
            </div>

            {/* Currency and Scale */}
            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'عملة القوائم المالية' : 'Base Currency'}</label>
                <select
                  value={formData.baseCurrency}
                  onChange={(e) => setFormData({ ...formData, baseCurrency: e.target.value as CurrencyCode })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-200"
                >
                  <option value="EGP">EGP - الجنيه المصري</option>
                  <option value="USD">USD - US Dollar</option>
                  <option value="EUR">EUR - Euro</option>
                  <option value="SAR">SAR - الريال السعودي</option>
                  <option value="AED">AED - الدرهم الإماراتي</option>
                </select>
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'مقياس الأرقام والتقريب' : 'Numeric Scale Unit'}</label>
                <select
                  value={formData.scale}
                  onChange={(e) => setFormData({ ...formData, scale: e.target.value as ScaleUnit })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 font-mono text-slate-200"
                >
                  <option value="units">{isAr ? 'وحدات كاملة (1:1)' : 'Exact Units (1:1)'}</option>
                  <option value="thousands">{isAr ? 'بالآلاف (000s)' : 'Thousands (000s)'}</option>
                  <option value="millions">{isAr ? 'بالملايين (M)' : 'Millions (M)'}</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'فترة التقرير الحالية' : 'Current Period'}</label>
                <input
                  type="text"
                  value={formData.reportingPeriod}
                  onChange={(e) => setFormData({ ...formData, reportingPeriod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>

              <div>
                <label className="text-slate-400 block mb-1">{isAr ? 'فترة المقارنة السابقة' : 'Comparative Period'}</label>
                <input
                  type="text"
                  value={formData.comparativePeriod}
                  onChange={(e) => setFormData({ ...formData, comparativePeriod: e.target.value })}
                  className="w-full bg-slate-950 border border-slate-700 rounded-lg p-2 text-slate-200 font-mono"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
