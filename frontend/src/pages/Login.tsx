import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { 
  Sparkles, 
  Lock, 
  Mail, 
  ArrowRight, 
  ShieldCheck, 
  FileCheck2, 
  CheckCircle2, 
  BarChart2, 
  FileSpreadsheet,
  Cpu,
  Layers,
  ArrowDown,
  UserCheck,
  Zap,
  Check
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { InteractiveHowItWorks } from '../components/InteractiveHowItWorks';

export const Login: React.FC = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [googleSubmitting, setGoogleSubmitting] = useState(false);

  const { login, loginAsDemo, signInWithGoogle } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      await login(email, password);
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleSignIn = async () => {
    setError(null);
    setGoogleSubmitting(true);
    try {
      await signInWithGoogle();
      navigate('/dashboard');
    } catch (err: any) {
      setError(err.message || 'Google sign in failed');
      setGoogleSubmitting(false);
    }
  };

  const handleDemoSignIn = () => {
    loginAsDemo();
    navigate('/dashboard');
  };

  const pipelineStages = [
    { title: 'UNSTRUCTURED DOCUMENT', desc: 'PDF, PNG, JPG, DOCX', icon: Layers, color: 'text-slate-300 border-slate-700 bg-slate-900/80' },
    { title: 'AI UNDERSTANDING', desc: 'Gemini 2.0 Multimodal Vision', icon: Cpu, color: 'text-brand-300 border-brand-500/40 bg-brand-500/10' },
    { title: 'STRUCTURED DATA', desc: 'Entities & Tabular Reconstruction', icon: FileSpreadsheet, color: 'text-indigo-300 border-indigo-500/40 bg-indigo-500/10' },
    { title: 'CONFIDENCE ANALYSIS', desc: 'Field Certainty (<85% Flagged)', icon: Zap, color: 'text-amber-300 border-amber-500/40 bg-amber-500/10' },
    { title: 'HUMAN VERIFICATION', desc: 'Split-Screen HITL Review', icon: UserCheck, color: 'text-purple-300 border-purple-500/40 bg-purple-500/10' },
    { title: 'VERIFIED INFORMATION', desc: 'Approved CSV & JSON APIs', icon: CheckCircle2, color: 'text-emerald-300 border-emerald-500/40 bg-emerald-500/10' }
  ];

  return (
    <div className="min-h-screen px-4 py-8 lg:py-12 relative overflow-hidden space-y-16">
      {/* Background Ambient Glows */}
      <div className="absolute top-1/4 left-1/4 w-[32rem] h-[32rem] bg-brand-600/10 rounded-full blur-3xl pointer-events-none" />
      <div className="absolute bottom-1/4 right-1/4 w-[32rem] h-[32rem] bg-violet-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Hero & Login Row */}
      <div className="max-w-6xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
        {/* Left Column: Hero Explanation */}
        <div className="lg:col-span-7 space-y-6 text-left">
          {/* Tagline Badge */}
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-slate-900/90 border border-slate-800 text-[11px] font-mono text-slate-300 shadow-sm">
            <span className="w-2 h-2 rounded-full bg-brand-400 animate-pulse" />
            <span>Google Gemini 2.0 Flash Multimodal Vision</span>
          </div>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand shrink-0">
                <Sparkles className="w-6 h-6 text-indigo-100" />
              </div>
              <div>
                <span className="text-xl sm:text-2xl font-bold tracking-tight text-white flex items-center gap-2">
                  CineForge <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 to-violet-400">IDP</span>
                </span>
                <span className="text-xs font-mono uppercase tracking-widest text-slate-400 block -mt-0.5">
                  Intelligent Document Processing
                </span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-white tracking-tight leading-tight">
              Turn Unstructured Documents into{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-brand-400 via-indigo-300 to-violet-400">
                Verified Structured Data
              </span>
            </h1>

            <p className="text-sm sm:text-base text-slate-400 leading-relaxed max-w-xl">
              Enterprise multimodal document understanding pipeline. Combines Gemini 2.0 Flash vision intelligence, field-level confidence scoring, human-in-the-loop review, and instant export.
            </p>
          </div>

          {/* 4 Value Pillars Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-brand-500/10 text-brand-400">
                  <Cpu className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Multimodal AI OCR</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Direct visual layout understanding for receipts, invoices, contracts, resumes, and IDs without brittle regex.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-indigo-500/10 text-indigo-400">
                  <BarChart2 className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Confidence Intelligence</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Automatic certainty metrics per entity. Fields below 85% threshold are automatically flagged for review.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400">
                  <ShieldCheck className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Human-In-The-Loop (HITL)</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Split-screen document preview, inline field editing, tabular line item correction, and timestamped audit logs.
              </p>
            </div>

            <div className="p-3.5 rounded-2xl bg-slate-900/60 border border-slate-800/80 hover:border-slate-700 transition-colors">
              <div className="flex items-center gap-2.5 mb-1.5">
                <div className="p-1.5 rounded-lg bg-emerald-500/10 text-emerald-400">
                  <FileSpreadsheet className="w-4 h-4" />
                </div>
                <h4 className="text-xs font-bold text-slate-200">Structured Export</h4>
              </div>
              <p className="text-[11px] text-slate-400 leading-normal">
                Standardized CSV and nested JSON ready for instant database insertion, ERP pipelines, and downstream APIs.
              </p>
            </div>
          </div>
        </div>

        {/* Right Column: Authentication & Instant Demo Card */}
        <div className="lg:col-span-5 w-full">
          <div className="glass-panel p-6 sm:p-8 rounded-3xl shadow-2xl border border-slate-800 relative">
            <div className="mb-6">
              <h2 className="text-lg font-bold text-white tracking-tight">
                Analyst Access & Sign In
              </h2>
              <p className="text-xs text-slate-400 mt-1">
                Sign in to your enterprise workspace or explore immediately via Instant Demo.
              </p>
            </div>

            {error && (
              <div className="mb-5 p-3 rounded-xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-400 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Instant Demo Access Button */}
            <div className="mb-6 p-4 rounded-2xl bg-gradient-to-br from-brand-950/60 via-slate-900/80 to-indigo-950/40 border border-brand-500/40 shadow-glow-brand">
              <div className="flex items-center gap-2 text-brand-300 font-semibold text-xs mb-1">
                <Sparkles className="w-4 h-4 text-brand-400" />
                <span>1-Click Hackathon Evaluator Access</span>
              </div>
              <p className="text-[11px] text-slate-400 mb-3 leading-relaxed">
                Jump directly into the live console with pre-staged Invoices, Receipts, and Contracts. Zero credentials needed.
              </p>
              <button
                type="button"
                onClick={handleDemoSignIn}
                className="w-full py-2.5 px-4 text-xs font-bold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-md hover:shadow-glow-brand transition-all flex items-center justify-center gap-2 btn-interactive"
              >
                <ShieldCheck className="w-4 h-4 text-brand-200" />
                <span>Instant Demo Sign In (Preloaded Data)</span>
              </button>
            </div>

            <div className="relative flex items-center justify-center my-4">
              <div className="border-t border-slate-800 w-full" />
              <span className="bg-slate-900/90 px-3 text-[10px] uppercase tracking-wider text-slate-500 font-semibold absolute">
                Or sign in with account
              </span>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3.5">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Work Email
                </label>
                <div className="relative">
                  <Mail className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={e => setEmail(e.target.value)}
                    placeholder="analyst@enterprise.com"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Password
                </label>
                <div className="relative">
                  <Lock className="w-4 h-4 text-slate-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-9 pr-3 py-2 text-xs bg-slate-900 border border-slate-800 rounded-xl text-slate-100 placeholder-slate-600 focus:outline-none focus:border-brand-500 transition-colors"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={submitting}
                className="w-full mt-2 py-2 px-4 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-interactive"
              >
                <span>{submitting ? 'Authenticating...' : 'Sign In'}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </form>

            {/* Google OAuth Button */}
            <div className="mt-3">
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={googleSubmitting}
                className="w-full py-2 px-4 text-xs font-semibold rounded-xl border border-slate-700 bg-slate-850 hover:bg-slate-800 text-slate-200 transition-all flex items-center justify-center gap-2 disabled:opacity-50 btn-interactive"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
                </svg>
                <span>{googleSubmitting ? 'Connecting...' : 'Continue with Google'}</span>
              </button>
            </div>

            <div className="mt-5 text-center text-xs text-slate-400">
              New to CineForge IDP?{' '}
              <Link to="/register" className="text-brand-400 hover:text-brand-300 font-semibold underline">
                Create an account
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Visual Pipeline Explanation (Requirement 2) */}
      <div className="max-w-6xl mx-auto space-y-4">
        <div className="text-center space-y-1">
          <span className="text-xs font-mono uppercase tracking-widest text-brand-400">
            Automated Intelligence Architecture
          </span>
          <h2 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            From Raw Pixels to Verified Business Records
          </h2>
          <p className="text-xs text-slate-400 max-w-lg mx-auto">
            Visitors understand the complete document processing flow within seconds
          </p>
        </div>

        {/* 6-Stage Flow Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
          {pipelineStages.map((stage, idx) => {
            const Icon = stage.icon;
            return (
              <div 
                key={stage.title}
                className={`p-4 rounded-2xl border flex flex-col justify-between space-y-2 backdrop-blur-md transition-transform hover:-translate-y-1 ${stage.color}`}
              >
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <Icon className="w-5 h-5" />
                    <span className="text-[10px] font-mono opacity-60">0{idx + 1}</span>
                  </div>
                  <h4 className="text-xs font-bold leading-tight tracking-wider">
                    {stage.title}
                  </h4>
                </div>
                <p className="text-[10px] opacity-75 font-mono leading-tight">
                  {stage.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>

      {/* Interactive "How It Works" Section (Requirement 3) */}
      <div className="max-w-6xl mx-auto">
        <InteractiveHowItWorks />
      </div>
    </div>
  );
};
