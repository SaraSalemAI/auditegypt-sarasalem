import React, { createContext, useContext, useState } from 'react';
import { EvidenceTrace } from '../types/accounting';
import { DEFAULT_EVIDENCE_TRACES } from '../data/defaultCompanyData';

interface EvidenceContextType {
  activeTrace: EvidenceTrace | null;
  isOpen: boolean;
  openEvidence: (traceIdOrObj: string | EvidenceTrace) => void;
  closeEvidence: () => void;
}

const EvidenceContext = createContext<EvidenceContextType | undefined>(undefined);

export const EvidenceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [activeTrace, setActiveTrace] = useState<EvidenceTrace | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  const openEvidence = (traceIdOrObj: string | EvidenceTrace) => {
    if (typeof traceIdOrObj === 'string') {
      const trace = DEFAULT_EVIDENCE_TRACES[traceIdOrObj] || DEFAULT_EVIDENCE_TRACES['TRC-CURRENT-RATIO'];
      setActiveTrace(trace);
    } else {
      setActiveTrace(traceIdOrObj);
    }
    setIsOpen(true);
  };

  const closeEvidence = () => {
    setIsOpen(false);
  };

  return (
    <EvidenceContext.Provider value={{ activeTrace, isOpen, openEvidence, closeEvidence }}>
      {children}
    </EvidenceContext.Provider>
  );
};

export const useEvidence = () => {
  const context = useContext(EvidenceContext);
  if (!context) {
    throw new Error('useEvidence must be used within an EvidenceProvider');
  }
  return context;
};
