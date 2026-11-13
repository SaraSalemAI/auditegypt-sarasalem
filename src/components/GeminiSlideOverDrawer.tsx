import React from 'react';
import { X, Sparkles, Bot } from 'lucide-react';
import { GeminiStudio } from './modules/GeminiStudio';
import { OutputLanguage, AccountingFramework, CompanyEntity, AccountRow } from '../types/accounting';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  language: OutputLanguage;
  framework: AccountingFramework;
  company: CompanyEntity;
  accounts: AccountRow[];
}

export const GeminiSlideOverDrawer: React.FC<Props> = ({
  isOpen,
  onClose,
  language,
  framework,
  company,
  accounts
}) => {
  if (!isOpen) return null;
  const isAr = language === 'ar';

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/60 backdrop-blur-sm transition-opacity" dir={isAr ? 'rtl' : 'ltr'}>
      <div className="w-full max-w-4xl h-full bg-[#070D1E] border-s border-slate-800 shadow-2xl flex flex-col overflow-hidden animate-in slide-in-from-right duration-300">
        {/* Header */}
        <div className="p-4 bg-[#0B152F] border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/30 border border-blue-500/40 flex items-center justify-center text-blue-400">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <span>{isAr ? 'مساعد Ledger IQ الذكي (Gemini Copilot)' : 'Ledger IQ Gemini Copilot'}</span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  Search & Maps Grounded
                </span>
              </h2>
              <p className="text-[11px] text-slate-400">
                {isAr ? 'استشارات فورية أثناء فحص الدفاتر والميزان' : 'Context-aware intelligence while reviewing statements'}
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-slate-800/80 hover:bg-slate-700 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Drawer Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 bg-[#070D1E]">
          <GeminiStudio
            language={language}
            framework={framework}
            company={company}
            accounts={accounts}
          />
        </div>
      </div>
    </div>
  );
};
