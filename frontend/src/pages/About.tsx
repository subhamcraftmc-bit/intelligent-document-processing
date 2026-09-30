import React from 'react';
import { Link } from 'react-router-dom';
import { 
  Sparkles, 
  Cpu, 
  ShieldCheck, 
  Database, 
  ArrowRight, 
  FileCheck2, 
  CheckCircle2, 
  Layers, 
  Lock,
  Code2
} from 'lucide-react';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

export const About: React.FC = () => {
  const techStack = [
    { name: 'Google Gemini 2.0 Flash', role: 'Multimodal vision model for layout decomposition and OCR parsing' },
    { name: 'Supabase PostgreSQL', role: 'Relational data store with Row-Level Security and audit trails' },
    { name: 'Node.js & Express ESM', role: 'High-throughput multipart streaming backend deployed on Render' },
    { name: 'React 19 & TypeScript', role: 'Modern type-safe frontend architecture built with Vite' },
    { name: 'Tailwind CSS & Liquid Glass', role: 'Glassmorphism interaction layer with responsive visual tokens' }
  ];

  return (
    <div className="space-y-12 max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 animate-fade-in">
      {/* Hero Header */}
      <div className="text-center space-y-3">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-xs font-mono">
          <Sparkles className="w-3.5 h-3.5" />
          <span>ENTERPRISE DOCUMENT REVOLUTION</span>
        </div>
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
          About CineForge IDP
        </h1>
        <p className="text-sm sm:text-base text-slate-400 max-w-2xl mx-auto leading-relaxed">
          Pioneering intelligent document processing by marrying Google Gemini multimodal vision with human-in-the-loop verification.
        </p>
      </div>

      {/* Core Mission */}
      <LiquidGlassCard className="p-8 sm:p-10 space-y-4">
        <h2 className="text-lg font-bold text-white tracking-tight flex items-center gap-2.5">
          <span className="w-2 h-2 rounded-full bg-brand-400" />
          <span>Our Architecture & Philosophy</span>
        </h2>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          Modern enterprise systems are bogged down by millions of unstructured documents — from photographed restaurant receipts and multi-page cloud invoices to complex legal contracts. For decades, companies relied on brittle regex templates and optical character recognition (OCR) that stripped documents of their spatial and layout meaning.
        </p>
        <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
          CineForge IDP fundamentally changes this paradigm. By leveraging Google Gemini 2.0 Flash's multimodal vision capabilities, our system processes the document as an image, understanding visual relationships, tabular columns, signatures, and annotations.
        </p>
      </LiquidGlassCard>

      {/* Why Human Verification Matters */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <LiquidGlassCard className="p-6 space-y-3 border-amber-500/30">
          <div className="p-2 w-fit rounded-xl bg-amber-500/10 text-amber-400">
            <ShieldCheck className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Why Human Verification Matters</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            AI should assist and accelerate, not hallucinate unnoticed. CineForge IDP calculates certainty metrics per extracted entity. Anything below 85% is flagged, enabling human analysts to correct data in a streamlined split-screen view before committing to the ERP ledger.
          </p>
        </LiquidGlassCard>

        <LiquidGlassCard className="p-6 space-y-3 border-emerald-500/30">
          <div className="p-2 w-fit rounded-xl bg-emerald-500/10 text-emerald-400">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <h3 className="text-sm font-bold text-white">Tamper-Resistant Audit Trail</h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            Every extraction, review action, and verification event is immutably timestamped in PostgreSQL audit logs, recording who changed what and when, ensuring full compliance for accounting, Sarbanes-Oxley, and corporate audits.
          </p>
        </LiquidGlassCard>
      </div>

      {/* Technology Stack Grid */}
      <div className="space-y-4">
        <h3 className="text-base font-bold text-white text-center">
          Under the Hood: Enterprise Tech Stack
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {techStack.map(t => (
            <div key={t.name} className="p-4 rounded-2xl bg-slate-900/60 border border-slate-800 backdrop-blur-md">
              <h4 className="text-xs font-bold text-brand-300 font-mono flex items-center gap-2">
                <Code2 className="w-3.5 h-3.5" />
                <span>{t.name}</span>
              </h4>
              <p className="text-[11px] text-slate-400 mt-1 leading-normal">
                {t.role}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Call to Action */}
      <div className="p-8 rounded-3xl bg-gradient-to-r from-brand-950/60 via-slate-900/80 to-indigo-950/40 border border-brand-500/40 text-center space-y-4 shadow-glow-brand">
        <h3 className="text-lg font-bold text-white">Experience CineForge IDP</h3>
        <p className="text-xs text-slate-400 max-w-md mx-auto">
          Explore the command console or test multimodal extraction on sample enterprise invoices now.
        </p>
        <div className="flex items-center justify-center gap-3">
          <Link
            to="/upload"
            className="px-5 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all flex items-center gap-1.5"
          >
            <span>Upload Document</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          <Link
            to="/dashboard"
            className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold border border-slate-700 transition-colors"
          >
            <span>Console Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
