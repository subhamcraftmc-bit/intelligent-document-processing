import React from 'react';
import { Link } from 'react-router-dom';
import { Sparkles, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-slate-800/80 bg-slate-950/60 backdrop-blur-md py-8 text-xs text-slate-400 font-sans mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 space-y-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-brand-500 to-indigo-700 flex items-center justify-center text-white shadow-glow-brand">
              <Sparkles className="w-3.5 h-3.5" />
            </div>
            <div>
              <span className="font-bold text-white tracking-tight">CineForge IDP</span>
              <span className="text-[10px] text-slate-500 font-mono block">Enterprise Multimodal Document Understanding</span>
            </div>
          </div>

          {/* Quick Navigation Links */}
          <nav className="flex flex-wrap items-center justify-center gap-6 text-xs text-slate-400 font-medium">
            <Link to="/dashboard" className="hover:text-white transition-colors">Dashboard</Link>
            <Link to="/upload" className="hover:text-white transition-colors">Upload</Link>
            <Link to="/review" className="hover:text-white transition-colors">Review Center</Link>
            <Link to="/analytics" className="hover:text-white transition-colors">Analytics</Link>
            <Link to="/settings" className="hover:text-white transition-colors">Settings</Link>
            <Link to="/help" className="hover:text-white transition-colors">Help Center</Link>
            <Link to="/presentation" className="hover:text-purple-300 transition-colors">Pitch Deck</Link>
            <Link to="/about" className="hover:text-white transition-colors">About</Link>
          </nav>
        </div>

        <div className="border-t border-slate-900 pt-4 flex flex-col sm:flex-row items-center justify-between gap-3 text-[11px] text-slate-500 font-mono">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Google Gemini 2.0 Flash Multimodal Vision • Supabase PostgreSQL • 100% Audit Logging</span>
          </div>
          <div>
            <span>© {new Date().getFullYear()} CineForge IDP • Production Ready</span>
          </div>
        </div>
      </div>
    </footer>
  );
};
