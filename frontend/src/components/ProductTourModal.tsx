import React, { useState } from 'react';
import { 
  Sparkles, 
  X, 
  ChevronRight, 
  ChevronLeft, 
  LayoutDashboard, 
  UploadCloud, 
  Cpu, 
  FileSpreadsheet, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  Download,
  ExternalLink
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { useSettings } from '../context/SettingsContext';

interface TourStep {
  title: string;
  badge: string;
  description: string;
  targetRoute?: string;
  icon: React.ComponentType<{ className?: string }>;
  keyInsight: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '1. Command Console & Real-Time Metrics',
    badge: 'DASHBOARD 2.0',
    description: 'The console serves as your operational headquarters. Monitor total ingested records, review workload (<85% confidence), automation rates, and filter by schema type or search.',
    targetRoute: '/dashboard',
    icon: LayoutDashboard,
    keyInsight: 'Real-time telemetry without fake data.'
  },
  {
    title: '2. Smart Multi-Format Ingestion',
    badge: 'WATER DROPZONE',
    description: 'Ingest complex PDFs, scans, receipts, or contracts. Drag & drop files onto the liquid surface or paste screenshots with Ctrl+V. Multi-file staging with automatic duplicate protection.',
    targetRoute: '/upload',
    icon: UploadCloud,
    keyInsight: 'Full multi-file batch queue with duplicate prevention.'
  },
  {
    title: '3. Gemini 2.0 Multimodal Vision',
    badge: 'AI EXTRACTION',
    description: 'Google Gemini 2.0 Flash inspects raw visual document layouts without brittle regex rules, identifying 5 core schemas: Invoices, Receipts, Contracts, Resumes, and ID Proofs.',
    icon: Cpu,
    keyInsight: 'Direct multimodal visual understanding.'
  },
  {
    title: '4. Confidence Scoring & Flagged Queue',
    badge: 'CONFIDENCE INTELLIGENCE',
    description: 'Every extracted key-value entity receives an individual confidence score. Entities falling below the automated 85% threshold are automatically flagged for human verification.',
    icon: ShieldCheck,
    keyInsight: 'Transparent statistical grounding.'
  },
  {
    title: '5. Human-in-the-Loop Review Center',
    badge: 'SMART TRIAGE',
    description: 'The dedicated Review Center prioritizes documents needing human attention. Sort by lowest confidence or oldest pending to quickly inspect side-by-side with original document viewer.',
    targetRoute: '/review',
    icon: UserCheck,
    keyInsight: 'Side-by-side split screen with real-time editing.'
  },
  {
    title: '6. Verified Approval & Audit Trail',
    badge: 'COMPLIANCE',
    description: 'Approved records are stamped as Verified with a tamper-resistant PostgreSQL audit log tracking reviewer edits and timestamps.',
    icon: CheckCircle2,
    keyInsight: 'Immutable audit trail in Supabase.'
  },
  {
    title: '7. Instant ERP & Downstream Export',
    badge: 'STRUCTURED EXPORT',
    description: 'Export verified structured data instantly in standardized CSV or nested JSON formats for downstream accounting, ERP, or CRM sync.',
    icon: Download,
    keyInsight: 'Ready for production downstream systems.'
  }
];

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductTourModal: React.FC<ProductTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const navigate = useNavigate();
  const { setTourCompleted } = useSettings();

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleNext = () => {
    if (isLast) {
      setTourCompleted(true);
      onClose();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      if (TOUR_STEPS[nextIdx].targetRoute) {
        navigate(TOUR_STEPS[nextIdx].targetRoute!);
      }
    }
  };

  const handlePrev = () => {
    if (!isFirst) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      if (TOUR_STEPS[prevIdx].targetRoute) {
        navigate(TOUR_STEPS[prevIdx].targetRoute!);
      }
    }
  };

  const handleSkip = () => {
    setTourCompleted(true);
    onClose();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="tour-modal-title"
    >
      <div 
        className="liquid-glass border border-brand-500/40 rounded-3xl max-w-xl w-full p-6 sm:p-8 shadow-2xl space-y-6 relative overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Ambient Top Glow */}
        <div className="absolute top-0 right-0 w-48 h-48 bg-brand-500/10 rounded-full blur-3xl pointer-events-none" />

        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand shrink-0">
              <Icon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-400">
                {step.badge} • Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <h3 id="tour-modal-title" className="text-base sm:text-lg font-bold text-white tracking-tight">
                {step.title}
              </h3>
            </div>
          </div>
          <button
            type="button"
            onClick={handleSkip}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
            title="Close Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body Content */}
        <div className="space-y-4">
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>

          <div className="p-3.5 rounded-xl bg-slate-950/70 border border-slate-800 text-xs flex items-center justify-between">
            <span className="text-slate-400 font-medium">Core Value:</span>
            <span className="font-semibold text-brand-300 font-mono">{step.keyInsight}</span>
          </div>

          {/* Stepper Dots */}
          <div className="flex items-center justify-center gap-1.5 pt-2">
            {TOUR_STEPS.map((_, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => {
                  setCurrentStep(idx);
                  if (TOUR_STEPS[idx].targetRoute) {
                    navigate(TOUR_STEPS[idx].targetRoute!);
                  }
                }}
                className={`h-1.5 rounded-full transition-all ${
                  idx === currentStep ? 'w-6 bg-brand-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
                }`}
                aria-label={`Go to tour step ${idx + 1}`}
              />
            ))}
          </div>
        </div>

        {/* Footer Navigation */}
        <div className="flex items-center justify-between pt-2 border-t border-slate-800">
          <button
            id="tour-modal-skip-btn"
            type="button"
            onClick={handleSkip}
            className="text-xs text-slate-400 hover:text-slate-200 font-medium transition-colors"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              id="tour-modal-back-btn"
              type="button"
              disabled={isFirst}
              onClick={handlePrev}
              className="px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 disabled:opacity-30 text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              id="tour-modal-next-btn"
              type="button"
              onClick={handleNext}
              className="px-4 py-1.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand flex items-center gap-1 transition-all"
            >
              <span>{isLast ? 'Complete Tour' : 'Next Step'}</span>
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
