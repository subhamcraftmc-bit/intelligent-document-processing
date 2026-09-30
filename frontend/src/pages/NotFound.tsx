import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { FileQuestion, ArrowLeft, LayoutDashboard, Sparkles } from 'lucide-react';

export const NotFound: React.FC = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-[75vh] flex items-center justify-center px-4 py-12">
      <div className="max-w-md w-full text-center space-y-6 bg-slate-900/60 p-8 rounded-3xl border border-slate-800 shadow-2xl backdrop-blur-md">
        <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 text-brand-400 flex items-center justify-center mx-auto shadow-glow-brand">
          <FileQuestion className="w-8 h-8" />
        </div>

        <div className="space-y-2">
          <span className="text-xs font-mono uppercase tracking-widest text-brand-400">
            Error 404 • Resource Not Found
          </span>
          <h1 className="text-2xl font-extrabold text-white tracking-tight">
            Page Does Not Exist
          </h1>
          <p className="text-xs text-slate-400 leading-relaxed">
            The document ID or application route you navigated to could not be located in the current workspace.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl border border-slate-700 bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs font-semibold flex items-center justify-center gap-2 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Go Back</span>
          </button>
          <Link
            to="/dashboard"
            className="w-full sm:w-auto px-4 py-2.5 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-semibold flex items-center justify-center gap-2 shadow-glow-brand transition-all"
          >
            <LayoutDashboard className="w-4 h-4" />
            <span>Console Dashboard</span>
          </Link>
        </div>
      </div>
    </div>
  );
};
