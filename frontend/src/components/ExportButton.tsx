import React, { useState, useRef, useEffect } from 'react';
import { Download, FileSpreadsheet, FileJson, ChevronDown, Check, Loader2 } from 'lucide-react';
import { api } from '../services/api';

interface ExportButtonProps {
  documentId: string;
  fileName: string;
  variant?: 'primary' | 'secondary';
  size?: 'sm' | 'md';
}

export const ExportButton: React.FC<ExportButtonProps> = ({
  documentId,
  fileName,
  variant = 'primary',
  size = 'md'
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [downloading, setDownloading] = useState<'csv' | 'json' | null>(null);
  const [lastExported, setLastExported] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close dropdown on outside click
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleExport = async (format: 'csv' | 'json') => {
    try {
      setDownloading(format);
      await api.documents.downloadExport(documentId, format, fileName);
      setLastExported(format);
      setTimeout(() => setLastExported(null), 3000);
      setIsOpen(false);
    } catch (err: any) {
      console.error('Export failed:', err);
      alert(`Export failed: ${err.message || 'Unknown error'}`);
    } finally {
      setDownloading(null);
    }
  };

  const isPrimary = variant === 'primary';
  const sizeClasses = size === 'sm' ? 'px-2.5 py-1 text-xs' : 'px-3.5 py-2 text-sm';

  return (
    <div className="relative inline-block text-left" ref={menuRef}>
      <div className="inline-flex rounded-lg shadow-sm">
        <button
          type="button"
          onClick={() => handleExport('csv')}
          disabled={downloading !== null}
          className={`inline-flex items-center gap-2 font-medium rounded-l-lg border transition-all ${sizeClasses} ${
            isPrimary
              ? 'bg-brand-600 hover:bg-brand-500 text-white border-brand-500 shadow-glow-brand'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-200 border-slate-700'
          }`}
        >
          {downloading === 'csv' ? (
            <Loader2 className="w-4 h-4 animate-spin text-white" />
          ) : lastExported === 'csv' ? (
            <Check className="w-4 h-4 text-emerald-400" />
          ) : (
            <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
          )}
          <span>Export CSV</span>
        </button>

        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          aria-expanded={isOpen}
          className={`inline-flex items-center justify-center px-2 rounded-r-lg border-t border-b border-r transition-all ${
            isPrimary
              ? 'bg-brand-700 hover:bg-brand-600 text-white border-brand-500'
              : 'bg-slate-800 hover:bg-slate-700 text-slate-300 border-slate-700'
          }`}
        >
          <ChevronDown className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Dropdown Options */}
      {isOpen && (
        <div className="absolute right-0 mt-2 w-48 rounded-xl bg-slate-900 border border-slate-800 shadow-2xl z-50 p-1.5 focus:outline-none animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2.5 py-1.5 text-[11px] font-semibold tracking-wider uppercase text-slate-400 border-b border-slate-800/80 mb-1">
            Export Format
          </div>

          <button
            type="button"
            onClick={() => handleExport('csv')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2">
              <FileSpreadsheet className="w-4 h-4 text-emerald-400" />
              <span>Comma-Separated (.csv)</span>
            </div>
            {downloading === 'csv' && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />}
          </button>

          <button
            type="button"
            onClick={() => handleExport('json')}
            disabled={downloading !== null}
            className="w-full flex items-center justify-between px-2.5 py-2 text-xs font-medium text-slate-200 hover:text-white hover:bg-slate-800/80 rounded-lg transition-colors group"
          >
            <div className="flex items-center gap-2">
              <FileJson className="w-4 h-4 text-amber-400" />
              <span>Structured Data (.json)</span>
            </div>
            {downloading === 'json' && <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />}
          </button>
        </div>
      )}
    </div>
  );
};
