import React, { useState } from 'react';
import { 
  UploadCloud, 
  Brain, 
  FileSpreadsheet, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  Download,
  ChevronRight,
  Layers,
  Sparkles
} from 'lucide-react';

interface Step {
  num: string;
  title: string;
  subtitle: string;
  description: string;
  icon: React.ComponentType<{ className?: string }>;
  uiIllustration: {
    badge: string;
    sampleKey: string;
    sampleVal: string;
    sampleConfidence: string;
  };
}

const STEPS: Step[] = [
  {
    num: '01',
    title: 'Upload',
    subtitle: 'Multi-Format Ingestion',
    description: 'Securely ingest PDFs, PNGs, JPEGs, and DOCX documents via drag & drop, file browser, or clipboard paste.',
    icon: UploadCloud,
    uiIllustration: {
      badge: 'MULTIPART INGESTION',
      sampleKey: 'Apex_Invoice_1042.pdf',
      sampleVal: '342 KB • application/pdf',
      sampleConfidence: 'Binary Validated ✓'
    }
  },
  {
    num: '02',
    title: 'Understand',
    subtitle: 'Gemini 2.0 Multimodal Vision',
    description: 'Our multimodal vision model inspects the full-page layout, reading visual bounding boxes and complex spatial structures.',
    icon: Brain,
    uiIllustration: {
      badge: 'GEMINI 2.0 FLASH VISION',
      sampleKey: 'Document Class',
      sampleVal: 'Commercial Tax Invoice',
      sampleConfidence: 'Classification: 99%'
    }
  },
  {
    num: '03',
    title: 'Extract',
    subtitle: 'Entities & Tabular Reconstruction',
    description: 'Extracts critical key-value pairs (totals, dates, vendor names) and complex line items directly into typed schemas.',
    icon: FileSpreadsheet,
    uiIllustration: {
      badge: 'SCHEMA EXTRACTION',
      sampleKey: 'Total Amount',
      sampleVal: '$4,632.50 USD',
      sampleConfidence: '98% Extracted'
    }
  },
  {
    num: '04',
    title: 'Validate',
    subtitle: 'Statistical Confidence Thresholds',
    description: 'Every extracted entity is scored. If confidence drops below 85%, CineForge automatically flags it for human attention.',
    icon: ShieldCheck,
    uiIllustration: {
      badge: 'ANOMALY DETECTOR',
      sampleKey: 'Payment Terms',
      sampleVal: 'Net 30 (Direct Wire)',
      sampleConfidence: '79% ⚠ Flagged for Review'
    }
  },
  {
    num: '05',
    title: 'Review',
    subtitle: 'Smart Review Center',
    description: 'Reviewers can easily inspect side-by-side: original document on the left, editable extracted fields on the right.',
    icon: UserCheck,
    uiIllustration: {
      badge: 'HUMAN-IN-THE-LOOP',
      sampleKey: 'Reviewer Action',
      sampleVal: 'Field Focused & Corrected',
      sampleConfidence: 'Audit Trail Recorded'
    }
  },
  {
    num: '06',
    title: 'Verify',
    subtitle: 'One-Click Approval',
    description: 'Once confirmed, the document status transitions to Verified and approved, timestamped with full audit trail in PostgreSQL.',
    icon: CheckCircle2,
    uiIllustration: {
      badge: 'VERIFIED APPROVAL',
      sampleKey: 'Document Status',
      sampleVal: 'Approved & Immutable',
      sampleConfidence: '100% Quality Assurance'
    }
  },
  {
    num: '07',
    title: 'Export',
    subtitle: 'ERP & Downstream Sync',
    description: 'Export verified structured data instantly to CSV or JSON for seamless ingestion into ERP, CRM, or accounting systems.',
    icon: Download,
    uiIllustration: {
      badge: 'STRUCTURED EXPORT',
      sampleKey: 'Format Available',
      sampleVal: 'Standardized CSV & JSON API',
      sampleConfidence: 'Ready for Sync'
    }
  }
];

export const InteractiveHowItWorks: React.FC = () => {
  const [activeStepIndex, setActiveStepIndex] = useState(0);

  const activeStep = STEPS[activeStepIndex];
  const StepIcon = activeStep.icon;

  return (
    <div className="w-full bg-slate-900/40 rounded-3xl border border-slate-800/80 p-6 sm:p-8 backdrop-blur-md space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-800 pb-5">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-mono mb-2">
            <Sparkles className="w-3 h-3" />
            <span>INTERACTIVE ARCHITECTURE</span>
          </div>
          <h3 className="text-lg sm:text-xl font-bold text-white tracking-tight">
            How CineForge IDP Works
          </h3>
          <p className="text-xs text-slate-400">
            Click any step to inspect the enterprise pipeline from raw upload to verified export
          </p>
        </div>
        <div className="text-right hidden sm:block">
          <span className="text-xs font-mono text-slate-500">Step {activeStepIndex + 1} of 7</span>
        </div>
      </div>

      {/* 7 Stepper Buttons */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2">
        {STEPS.map((step, idx) => {
          const Icon = step.icon;
          const isActive = idx === activeStepIndex;
          const isPassed = idx < activeStepIndex;

          return (
            <button
              key={step.num}
              type="button"
              onClick={() => setActiveStepIndex(idx)}
              className={`p-3 rounded-2xl border text-left transition-all relative ${
                isActive
                  ? 'bg-brand-500/15 border-brand-500/50 shadow-glow-brand ring-1 ring-brand-500/30'
                  : isPassed
                  ? 'bg-slate-900/60 border-slate-800 text-slate-300 hover:border-slate-700'
                  : 'bg-slate-950/40 border-slate-900 text-slate-400 hover:border-slate-800 hover:text-slate-300'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-mono font-bold ${isActive ? 'text-brand-400' : 'text-slate-400'}`}>
                  {step.num}
                </span>
                <Icon className={`w-4 h-4 ${isActive ? 'text-brand-300' : 'text-slate-400'}`} />
              </div>
              <p className={`text-xs font-bold truncate ${isActive ? 'text-white' : 'text-slate-300'}`}>
                {step.title}
              </p>
            </button>
          );
        })}
      </div>

      {/* Active Step Detailed Explanation & UI Illustration Card */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 bg-slate-950/60 p-6 rounded-2xl border border-slate-800/90 items-center">
        {/* Left Explanation */}
        <div className="lg:col-span-7 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-brand-500/20 border border-brand-500/30 flex items-center justify-center text-brand-300 shadow-sm">
              <StepIcon className="w-5 h-5" />
            </div>
            <div>
              <span className="text-[10px] font-mono uppercase tracking-widest text-brand-400">
                Stage {activeStep.num} • {activeStep.subtitle}
              </span>
              <h4 className="text-base sm:text-lg font-bold text-white">
                {activeStep.title}
              </h4>
            </div>
          </div>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            {activeStep.description}
          </p>

          <div className="flex items-center gap-3 pt-2 text-xs">
            <button
              type="button"
              disabled={activeStepIndex === 0}
              onClick={() => setActiveStepIndex(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 rounded-lg bg-slate-900 hover:bg-slate-800 disabled:opacity-30 border border-slate-800 text-slate-300 font-medium transition-colors"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={activeStepIndex === STEPS.length - 1}
              onClick={() => setActiveStepIndex(prev => Math.min(STEPS.length - 1, prev + 1))}
              className="px-3 py-1.5 rounded-lg bg-brand-600 hover:bg-brand-500 disabled:opacity-30 text-white font-medium transition-colors flex items-center gap-1 shadow-sm"
            >
              <span>Next Stage</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right UI Illustration Card */}
        <div className="lg:col-span-5 bg-slate-900/90 p-4 rounded-xl border border-slate-800 shadow-lg space-y-3">
          <div className="flex items-center justify-between text-[11px] font-mono text-slate-400 border-b border-slate-800 pb-2">
            <span className="text-brand-400 font-semibold">{activeStep.uiIllustration.badge}</span>
            <span className="text-slate-400">Pipeline State</span>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center bg-slate-950/70 p-2.5 rounded-lg border border-slate-800/80 text-xs">
              <span className="text-slate-400 font-medium">{activeStep.uiIllustration.sampleKey}</span>
              <span className="font-semibold text-white font-mono">{activeStep.uiIllustration.sampleVal}</span>
            </div>

            <div className="flex items-center justify-between bg-brand-500/10 border border-brand-500/20 px-3 py-2 rounded-lg text-xs font-mono">
              <span className="text-slate-400">Certainty Status:</span>
              <span className="text-brand-300 font-semibold">{activeStep.uiIllustration.sampleConfidence}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
