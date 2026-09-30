import React from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  FileText, 
  Receipt, 
  FileCheck, 
  UserSquare2, 
  ShieldCheck, 
  Sparkles,
  ArrowLeft
} from 'lucide-react';
import { UploadDropzone } from '../components/UploadDropzone';
import type { DocumentRecord } from '../types';

export const UploadPage: React.FC = () => {
  const navigate = useNavigate();

  const handleUploadSuccess = (docs: DocumentRecord[]) => {
    if (Array.isArray(docs) && docs.length === 1 && docs[0]?.id) {
      // If single document uploaded, jump directly into split-screen verification
      navigate(`/documents/${docs[0].id}`);
    }
  };

  const supportedTypes = [
    {
      title: 'Invoices',
      icon: FileText,
      color: 'text-brand-400',
      description: 'Vendor name, invoice date, due date, subtotal, tax, total, and tabular line items.'
    },
    {
      title: 'Receipts',
      icon: Receipt,
      color: 'text-emerald-400',
      description: 'Merchant name, transaction date, payment method, tax, tip, and purchased items.'
    },
    {
      title: 'Contracts & NDAs',
      icon: FileCheck,
      color: 'text-violet-400',
      description: 'Parties involved, effective date, termination clauses, governing law, and liability terms.'
    },
    {
      title: 'Resumes & CVs',
      icon: UserSquare2,
      color: 'text-amber-400',
      description: 'Candidate name, email, phone number, work experience, primary skills, and education.'
    },
    {
      title: 'Identity Proofs',
      icon: ShieldCheck,
      color: 'text-cyan-400',
      description: 'Full legal name, document number, date of birth, expiry date, and issuing authority.'
    }
  ];

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          type="button"
          onClick={() => navigate('/dashboard')}
          className="inline-flex items-center gap-1.5 text-xs text-slate-400 hover:text-white transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Dashboard</span>
        </button>

        <div className="flex items-center gap-2 text-xs font-mono text-slate-400 bg-slate-900 px-3 py-1.5 rounded-full border border-slate-800">
          <Sparkles className="w-3.5 h-3.5 text-brand-400" />
          <span>Gemini 2.0 Flash Multimodal Vision</span>
        </div>
      </div>

      <div className="text-center max-w-xl mx-auto">
        <h1 className="text-2xl sm:text-3xl font-bold text-white tracking-tight">
          Ingest & Extract Documents
        </h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-2">
          Upload individual files or batch queues. The AI will classify each document and extract structured entities automatically.
        </p>
      </div>

      {/* Main Upload Dropzone */}
      <UploadDropzone onUploadSuccess={handleUploadSuccess} />

      {/* Supported Document Schemas Guide */}
      <div className="pt-8 border-t border-slate-800/80 space-y-4">
        <h3 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
          Target Document Schemas & Intelligent Classifications
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {supportedTypes.map((t, idx) => {
            const Icon = t.icon;
            return (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-900/50 border border-slate-800 hover:border-slate-700 transition-colors"
              >
                <div className="flex items-center gap-2.5 mb-2">
                  <div className={`p-1.5 rounded-lg bg-slate-800/80 ${t.color}`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  <h4 className="text-xs font-semibold text-slate-200">{t.title}</h4>
                </div>
                <p className="text-[11px] text-slate-400 leading-relaxed">
                  {t.description}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
