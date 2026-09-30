import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  ArrowRight, 
  ArrowLeft, 
  X, 
  Layers, 
  Cpu, 
  ShieldAlert, 
  UserCheck, 
  Download, 
  CheckCircle2, 
  Maximize2,
  ExternalLink,
  Zap,
  LayoutDashboard
} from 'lucide-react';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface Slide {
  id: number;
  stage: string;
  title: string;
  subtitle: string;
  problemOrContext: string;
  solution: string;
  keyMetric: string;
  actionRoute: string;
  actionLabel: string;
  badge: string;
}

const PRESENTATION_SLIDES: Slide[] = [
  {
    id: 1,
    stage: '01 / THE PROBLEM',
    title: 'Unstructured Documents Cripple Enterprise Workflows',
    subtitle: 'Legacy OCR tools extract raw text without visual layout comprehension',
    problemOrContext: 'Modern businesses receive millions of invoices, receipts, and contracts in chaotic formats. Traditional OCR flattens visual bounding boxes, losing table coordinates and relationships.',
    solution: 'CineForge IDP employs Gemini 2.0 Multimodal Vision to visually read documents like a human expert, maintaining spatial context and tabular relationships.',
    keyMetric: '80% of Enterprise Data is Unstructured',
    actionRoute: '/upload',
    actionLabel: 'Experience Multimodal Ingestion →',
    badge: 'CHALLENGE'
  },
  {
    id: 2,
    stage: '02 / INGESTION & VISION',
    title: 'Liquid Multipart Ingestion & Multimodal Layout Parsing',
    subtitle: 'Direct visual inspection across 5 core document classes',
    problemOrContext: 'Multi-page PDFs, scans, and mobile camera receipts vary widely in lighting, angle, and layout.',
    solution: 'Our server accepts multipart payloads with automatic duplicate prevention and passes raw images/PDFs directly into Google Gemini 2.0 Flash for layout reconstruction.',
    keyMetric: '5 Schemas Supported: Invoices, Receipts, Contracts, Resumes, IDs',
    actionRoute: '/upload',
    actionLabel: 'Try Ingestion Dropzone →',
    badge: 'AI VISION'
  },
  {
    id: 3,
    stage: '03 / CONFIDENCE INTELLIGENCE',
    title: 'Explainable Field-Level Statistical Validation',
    subtitle: 'No black box: Every extracted entity has an audit-grade certainty score',
    problemOrContext: 'Traditional AI solutions either pass everything (introducing costly errors) or fail completely.',
    solution: 'CineForge calculates individual certainty metrics per entity. Scores below 85% are automatically isolated into an operational review queue.',
    keyMetric: '< 85% Automatically Flagged for Review',
    actionRoute: '/review',
    actionLabel: 'Inspect Review Queue →',
    badge: 'CONFIDENCE'
  },
  {
    id: 4,
    stage: '04 / HUMAN-IN-THE-LOOP',
    title: 'Side-by-Side Review Center with Real-Time Correction',
    subtitle: 'AI assists, humans verify when necessary',
    problemOrContext: 'Manual verification is slow when reviewers must jump between multiple disconnected screens.',
    solution: 'Split-screen interface: Original document preview on the left, editable schema fields and tabular line items on the right with instant calculation.',
    keyMetric: '100% Data Fidelity with Human Oversight',
    actionRoute: '/review',
    actionLabel: 'Open Review Center →',
    badge: 'HUMAN-IN-THE-LOOP'
  },
  {
    id: 5,
    stage: '05 / AUDIT & EXPORT',
    title: 'Tamper-Resistant Audit Trail & Instant ERP Sync',
    subtitle: 'From pixel to production database in seconds',
    problemOrContext: 'Enterprises need complete compliance records for every entity modification.',
    solution: 'Every correction is recorded in Supabase PostgreSQL audit logs. Verified data exports seamlessly to standardized CSV and nested JSON.',
    keyMetric: 'Instant CSV & JSON Downstream Ingestion',
    actionRoute: '/dashboard',
    actionLabel: 'Return to Command Console →',
    badge: 'PRODUCTION READY'
  }
];

export const PresentationMode: React.FC = () => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const navigate = useNavigate();

  const currentSlide = PRESENTATION_SLIDES[currentSlideIndex];
  const isFirst = currentSlideIndex === 0;
  const isLast = currentSlideIndex === PRESENTATION_SLIDES.length - 1;

  // Keyboard navigation (ArrowRight / ArrowLeft / Escape)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowRight' || e.key === 'Space') {
        e.preventDefault();
        setCurrentSlideIndex(prev => (prev < PRESENTATION_SLIDES.length - 1 ? prev + 1 : prev));
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        setCurrentSlideIndex(prev => (prev > 0 ? prev - 1 : prev));
      } else if (e.key === 'Escape') {
        navigate('/dashboard');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [navigate]);

  return (
    <div className="min-h-screen bg-[#07090e] text-white flex flex-col justify-between p-6 sm:p-12 relative overflow-hidden">
      {/* Background Glows */}
      <div className="absolute top-1/4 left-1/3 w-[36rem] h-[36rem] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[36rem] h-[36rem] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Top Bar */}
      <div className="flex items-center justify-between z-10 border-b border-slate-800/80 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center shadow-glow-brand">
            <Sparkles className="w-5 h-5 text-indigo-100" />
          </div>
          <div>
            <span className="text-sm font-bold tracking-tight text-white flex items-center gap-2">
              CineForge <span className="text-brand-400">IDP</span>
              <span className="text-[10px] font-mono uppercase bg-brand-500/20 text-brand-300 px-2 py-0.5 rounded border border-brand-500/30">
                Hackathon Pitch Mode
              </span>
            </span>
            <span className="text-[10px] font-mono text-slate-500 block">
              Google Gemini 2.0 Multimodal Vision Architecture
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <span className="text-xs font-mono text-slate-400">
            Slide {currentSlideIndex + 1} of {PRESENTATION_SLIDES.length}
          </span>
          <Link
            to="/dashboard"
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-400 hover:text-white transition-colors"
            title="Exit Presentation Mode (Esc)"
          >
            <X className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Main Slide Content */}
      <div className="max-w-5xl mx-auto w-full py-12 z-10 space-y-8 animate-fade-in" key={currentSlide.id}>
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-brand-500/20 text-brand-300 border border-brand-500/40">
              {currentSlide.stage}
            </span>
            <span className="px-2.5 py-1 rounded-full text-[10px] font-mono text-slate-400 bg-slate-900 border border-slate-800">
              {currentSlide.badge}
            </span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-white leading-tight">
            {currentSlide.title}
          </h1>
          <p className="text-base sm:text-xl text-slate-400 leading-relaxed font-light">
            {currentSlide.subtitle}
          </p>
        </div>

        {/* 2-Column Comparison Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <LiquidGlassCard className="p-6 sm:p-8 space-y-3 border-rose-500/20 bg-slate-900/50">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-rose-400 flex items-center gap-2">
              <ShieldAlert className="w-4 h-4" />
              <span>Current Industry Problem</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentSlide.problemOrContext}
            </p>
          </LiquidGlassCard>

          <LiquidGlassCard className="p-6 sm:p-8 space-y-3 border-emerald-500/20 bg-slate-900/50">
            <h3 className="text-xs font-bold font-mono uppercase tracking-wider text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4" />
              <span>CineForge IDP Solution</span>
            </h3>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              {currentSlide.solution}
            </p>
          </LiquidGlassCard>
        </div>

        {/* Key Metric & Live Link */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-5 rounded-2xl bg-brand-500/10 border border-brand-500/30">
          <div className="flex items-center gap-3">
            <Zap className="w-5 h-5 text-brand-400 shrink-0" />
            <span className="font-bold text-sm sm:text-base text-brand-200 font-mono">
              {currentSlide.keyMetric}
            </span>
          </div>

          <Link
            to={currentSlide.actionRoute}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all shrink-0"
          >
            <span>{currentSlide.actionLabel}</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      {/* Bottom Navigation */}
      <div className="flex items-center justify-between z-10 border-t border-slate-800/80 pt-4">
        <span className="text-xs font-mono text-slate-500 hidden sm:inline">
          Use ← and → arrow keys to navigate
        </span>

        {/* Stepper Dots */}
        <div className="flex items-center gap-2">
          {PRESENTATION_SLIDES.map((_, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => setCurrentSlideIndex(idx)}
              className={`h-2 rounded-full transition-all ${
                idx === currentSlideIndex ? 'w-8 bg-brand-400' : 'w-2 bg-slate-700 hover:bg-slate-500'
              }`}
            />
          ))}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={isFirst}
            onClick={() => setCurrentSlideIndex(p => Math.max(0, p - 1))}
            className="px-4 py-2 rounded-xl bg-slate-900 border border-slate-800 text-slate-300 disabled:opacity-30 text-xs font-semibold flex items-center gap-1.5 transition-colors"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Previous</span>
          </button>

          <button
            type="button"
            disabled={isLast}
            onClick={() => setCurrentSlideIndex(p => Math.min(PRESENTATION_SLIDES.length - 1, p + 1))}
            className="px-5 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 disabled:opacity-30 text-white text-xs font-bold shadow-glow-brand flex items-center gap-1.5 transition-all"
          >
            <span>Next Slide</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};
