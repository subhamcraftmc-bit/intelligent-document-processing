import React, { useState, useEffect } from 'react';
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
  GitCompare,
  Check
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
  spotlightHint?: string;
}

const TOUR_STEPS: TourStep[] = [
  {
    title: '1. Dashboard Console',
    badge: 'OPERATIONAL RADAR',
    description: 'Monitor real-time metrics across all ingested documents, review workload (<85% confidence), automation rates, and filter by document category.',
    targetRoute: '/dashboard',
    icon: LayoutDashboard,
    keyInsight: 'Live metrics grounded in database state without fake data.',
    spotlightHint: 'Metric cards & document table'
  },
  {
    id: 'upload',
    title: '2. Upload Ingestion',
    badge: 'WATER DROPZONE',
    description: 'Drag & drop single or multi-page PDFs, scans, receipts, or contracts. Or press Ctrl+V to paste a screenshot directly from clipboard.',
    targetRoute: '/upload',
    icon: UploadCloud,
    keyInsight: 'Multi-format support (PDF, PNG, JPG, DOCX) with duplicate detection.',
    spotlightHint: 'Interactive liquid upload zone'
  },
  {
    title: '3. AI Processing Pipeline',
    badge: 'GEMINI 2.0 FLASH',
    description: 'Google Gemini 2.0 Flash inspects the visual 2D spatial arrangement, reading skewed columns, blurry stamps, and multi-line invoice tables.',
    icon: Cpu,
    keyInsight: 'Visual multimodal awareness beats legacy OCR string flattening.',
    spotlightHint: 'Multimodal vision engine'
  },
  {
    title: '4. Extracted Fields & Data Grid',
    badge: 'STRUCTURED ENTITIES',
    description: 'Extracted key-value entities (vendor, date, total, tax, terms) and tabular line item rows are formatted into a live editable spreadsheet grid.',
    icon: FileSpreadsheet,
    keyInsight: 'Both key-value entities and nested line items extracted.',
    spotlightHint: 'Editable extraction data grid'
  },
  {
    title: '5. Confidence Intelligence',
    badge: 'CONFIDENCE ENGINE',
    description: 'Every single extracted field receives an individual certainty percentage. Entities falling below 85% are automatically flagged for review.',
    icon: ShieldCheck,
    keyInsight: 'Statistical grounding with color-coded confidence rings.',
    spotlightHint: 'Individual field confidence ratings'
  },
  {
    title: '6. Review Center (HITL)',
    badge: 'HUMAN-IN-THE-LOOP',
    description: 'Review low-confidence fields side-by-side with the original scanned file. Make instant inline corrections with full audit logging.',
    targetRoute: '/review',
    icon: UserCheck,
    keyInsight: 'Side-by-side split screen with real-time audit trail.',
    spotlightHint: 'Flagged review triage list'
  },
  {
    title: '7. Document Verification',
    badge: 'REGULATORY COMPLIANCE',
    description: 'Mark reviewed documents as Verified. An immutable PostgreSQL audit trail records auditor signatures, original values, and change timestamps.',
    icon: CheckCircle2,
    keyInsight: 'Immutable audit logs with reviewer attribution.',
    spotlightHint: 'One-click document approval'
  },
  {
    title: '8. Structured Export',
    badge: 'DOWNSTREAM SYNC',
    description: 'Export verified records instantly into standardized CSV or nested JSON payloads for seamless ERP, accounting, or webhook integration.',
    icon: Download,
    keyInsight: 'Ready-to-consume payloads for enterprise ERP systems.',
    spotlightHint: 'CSV and JSON export engine'
  },
  {
    title: '9. AI Document Comparison',
    badge: 'DIFF ENGINE (PHASE 14)',
    description: 'Select Document A (Original) and Document B (Updated). The engine normalizes schemas, identifies CHANGED, ADDED, and REMOVED fields, and displays side-by-side and overlay views.',
    targetRoute: '/compare',
    icon: GitCompare,
    keyInsight: 'Intelligent version-to-version diffing with natural language summary.',
    spotlightHint: 'Field-by-field diff & overlay slider'
  }
];

interface ProductTourModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ProductTourModal: React.FC<ProductTourModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const [isClosing, setIsClosing] = useState(false);
  const navigate = useNavigate();
  const { setTourCompleted } = useSettings();

  useEffect(() => {
    if (isOpen) {
      setCurrentStep(0);
      setIsClosing(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const step = TOUR_STEPS[currentStep];
  const Icon = step.icon;
  const isFirst = currentStep === 0;
  const isLast = currentStep === TOUR_STEPS.length - 1;

  const handleFinish = () => {
    setTourCompleted(true);
    localStorage.setItem('cineforge_tour_completed', 'true');
    setIsClosing(true);
    setTimeout(() => {
      onClose();
    }, 200);
  };

  const handleSkip = () => {
    handleFinish();
  };

  const handleNext = () => {
    if (isLast) {
      handleFinish();
    } else {
      const nextIdx = currentStep + 1;
      setCurrentStep(nextIdx);
      if (TOUR_STEPS[nextIdx].targetRoute) {
        navigate(TOUR_STEPS[nextIdx].targetRoute!);
      }
    }
  };

  const handleBack = () => {
    if (!isFirst) {
      const prevIdx = currentStep - 1;
      setCurrentStep(prevIdx);
      if (TOUR_STEPS[prevIdx].targetRoute) {
        navigate(TOUR_STEPS[prevIdx].targetRoute!);
      }
    }
  };

  return (
    <div 
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md ${
        isClosing ? 'motion-backdrop-exit' : 'motion-backdrop-enter'
      }`}
      role="dialog"
      aria-modal="true"
      aria-label="Interactive Product Tour"
    >
      {/* Animated Spotlight Ring Effect (Phase 12) */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 flex items-center justify-center"
        aria-hidden="true"
      >
        <div className="w-[500px] h-[500px] rounded-full border-2 border-brand-500/30 animate-water-pulse bg-brand-500/5 blur-sm" />
      </div>

      <div 
        className={`liquid-glass border border-brand-500/50 rounded-3xl max-w-lg w-full shadow-2xl p-6 sm:p-8 space-y-6 relative overflow-hidden z-10 ${
          isClosing ? 'motion-modal-exit' : 'motion-modal-enter'
        }`}
      >
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-brand-400 animate-pulse" />
            <span className="text-[11px] font-mono uppercase tracking-widest text-brand-300 font-bold">
              {step.badge}
            </span>
          </div>

          <button
            type="button"
            onClick={handleSkip}
            className="p-1.5 rounded-xl text-slate-400 hover:text-white bg-slate-800/60 hover:bg-slate-800 transition-colors"
            title="Skip Tour"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Step Visual & Title */}
        <div className="space-y-4">
          <div className="flex items-center gap-3.5">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand shrink-0">
              <Icon className="w-6 h-6" />
            </div>
            <div>
              <span className="text-[11px] font-mono text-slate-500">
                Step {currentStep + 1} of {TOUR_STEPS.length}
              </span>
              <h2 className="text-lg font-bold text-white tracking-tight">
                {step.title}
              </h2>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {step.description}
          </p>

          <div className="p-3 rounded-2xl bg-slate-950/70 border border-slate-800 space-y-1">
            <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block">
              Architectural Grounding:
            </span>
            <p className="text-xs font-medium text-brand-300 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-brand-400 shrink-0" />
              <span>{step.keyInsight}</span>
            </p>
          </div>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center justify-center gap-1.5 py-1">
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
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === currentStep
                  ? 'w-6 bg-brand-400 shadow-glow-brand'
                  : idx < currentStep
                  ? 'w-2 bg-brand-600/60'
                  : 'w-2 bg-slate-800'
              }`}
              aria-label={`Jump to step ${idx + 1}`}
            />
          ))}
        </div>

        {/* Controls: Back, Skip, Next, Finish (Phase 12) */}
        <div className="flex items-center justify-between gap-3 pt-2 border-t border-slate-800/80">
          <button
            type="button"
            onClick={handleSkip}
            className="text-xs text-slate-500 hover:text-slate-300 font-medium px-2 py-1"
          >
            Skip Tour
          </button>

          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isFirst}
              onClick={handleBack}
              className="px-3.5 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white disabled:opacity-30 disabled:pointer-events-none text-xs font-semibold flex items-center gap-1 transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
              <span>Back</span>
            </button>

            <button
              type="button"
              onClick={handleNext}
              className="px-4 py-2 rounded-xl bg-gradient-to-r from-brand-600 to-indigo-600 hover:from-brand-500 hover:to-indigo-500 text-white text-xs font-bold shadow-glow-brand flex items-center gap-1.5 transition-all btn-interactive"
            >
              <span>{isLast ? 'Finish Tour' : 'Next Step'}</span>
              {isLast ? <Check className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
