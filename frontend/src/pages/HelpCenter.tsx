import React, { useState } from 'react';
import { 
  HelpCircle, 
  Search, 
  UploadCloud, 
  Cpu, 
  ShieldCheck, 
  UserCheck, 
  CheckCircle2, 
  Download, 
  AlertTriangle, 
  ChevronDown, 
  ChevronUp, 
  Sparkles, 
  FileText,
  RefreshCw,
  ExternalLink,
  BookOpen,
  GitCompare,
  HelpCircle as QuestionIcon
} from 'lucide-react';
import { LiquidGlassCard } from '../components/LiquidGlassCard';

interface HelpArticle {
  id: string;
  category: string;
  title: string;
  summary: string;
  content: string;
  steps?: string[];
  tips?: string;
  troubleshooting?: {
    cause: string;
    fix: string;
  };
}

const HELP_ARTICLES: HelpArticle[] = [
  {
    id: 'getting-started',
    category: '1. Overview',
    title: 'GETTING STARTED',
    summary: 'A fast operational overview of CineForge Intelligent Document Processing.',
    content: 'CineForge IDP is an enterprise document understanding and intelligence platform powered by Google Gemini 2.0 Multimodal Vision and PostgreSQL. It ingests unstructured documents (invoices, receipts, agreements, resumes, ID cards), extracts structured key-value entities and tabular line items with confidence scoring, and coordinates human verification.',
    steps: [
      'Upload a document via drag & drop or paste with Ctrl+V',
      'Gemini multimodal vision inspects visual layout and extract entities',
      'Confidence scoring flags ambiguous entities (<85%)',
      'Human-in-the-Loop review allows instant side-by-side editing',
      'Compare versions with the AI Document Comparison Engine',
      'Export verified data to CSV or JSON for ERP/CRM integration'
    ]
  },
  {
    id: 'how-to-upload',
    category: '2. Ingestion',
    title: 'HOW TO UPLOAD',
    summary: 'Supported document formats, file boundaries, and staging queues.',
    content: 'CineForge accepts PDF, PNG, JPG, JPEG, and DOCX files up to 10MB per document. You can stage single or multi-file batches. The dropzone automatically detects binary file headers and prevents duplicate submissions.',
    tips: 'Pro-Tip: Press Win+Shift+S (or Cmd+Shift+4) to capture any receipt on screen, then press Ctrl+V anywhere on the Upload page to stage screenshots instantly!'
  },
  {
    id: 'how-ai-processing-works',
    category: '3. AI Pipeline',
    title: 'HOW AI PROCESSING WORKS',
    summary: 'Why Gemini 2.0 Multimodal Vision outperforms traditional flat OCR.',
    content: 'Legacy OCR collapses visual documents into flat unstructured text strings, destroying tabular geometry. Gemini 2.0 Flash processes the high-resolution visual pixels directly, maintaining full 2D spatial awareness between headers, labels, skewed columns, and watermarked receipts.'
  },
  {
    id: 'understanding-extraction',
    category: '4. Entities',
    title: 'UNDERSTANDING EXTRACTION',
    summary: 'Classification schemas and structured entity extraction.',
    content: 'CineForge classifies documents into 5 core enterprise schemas: Invoices, Receipts, Contracts, Resumes, and Identity Proofs. For each schema, it parses key-value entities (vendor, date, total, tax, terms) and tabular line item arrays with quantity, unit price, and total calculations.'
  },
  {
    id: 'understanding-confidence',
    category: '5. Confidence',
    title: 'UNDERSTANDING CONFIDENCE',
    summary: 'Statistical confidence scoring and operational threshold bands.',
    content: 'Every extracted key-value entity receives a precision certainty score between 0% and 100%:\n\n• HIGH CONFIDENCE (>= 85%): Meets automated straight-through processing standards.\n• MEDIUM CONFIDENCE (70% - 84%): Slight layout or OCR noise; flagged for review.\n• NEEDS REVIEW (< 70%): Ambiguous or obscured characters; mandatory human verification.',
    tips: 'The overall document confidence is calculated as the harmonic mean across all extracted entities.'
  },
  {
    id: 'human-in-the-loop',
    category: '6. HITL',
    title: 'HUMAN-IN-THE-LOOP (HITL)',
    summary: 'Reviewing and correcting flagged extractions with audit tracking.',
    content: 'The Review Center displays all documents with entities requiring human confirmation. Analysts inspect the original document preview on the left and the editable extraction grid on the right. Any corrected field is logged in the PostgreSQL audit log with reviewer attribution.'
  },
  {
    id: 'document-verification',
    category: '7. Compliance',
    title: 'DOCUMENT VERIFICATION',
    summary: 'Approval workflows, status states, and immutable audit logs.',
    content: 'Once all flagged fields are verified or corrected by an analyst, clicking "Approve Document" marks the record as Verified. An immutable audit trail records the auditor ID, timestamp, original value, and modified value for regulatory compliance.'
  },
  {
    id: 'comparing-documents',
    category: '8. Comparison',
    title: 'COMPARING DOCUMENTS',
    summary: 'Using the AI Diff Engine to compare two versions of a document.',
    content: 'The Document Comparison Engine (Phase 14) lets you select Document A (Original) and Document B (Updated). It normalizes fields across schemas and computes exact field-by-field differences (UNCHANGED, CHANGED, ADDED, REMOVED) with numeric deltas and line item comparisons.',
    tips: 'Use Side-by-Side or Overlay mode with the transparency slider to inspect physical layout shifts between document revisions.'
  },
  {
    id: 'exporting-data',
    category: '9. Integration',
    title: 'EXPORTING DATA',
    summary: 'Exporting verified documents and comparisons to CSV & JSON.',
    content: 'Verified documents and comparison diffs can be exported anytime. CSV exports provide flat tables ready for Excel, QuickBooks, or SAP. JSON exports provide nested structured schemas suitable for webhooks, REST APIs, or automated ERP ingestion pipelines.'
  },
  {
    id: 'troubleshooting',
    category: '10. Diagnostics',
    title: 'TROUBLESHOOTING',
    summary: 'Resolving container cold starts, network latency, or upload rejections.',
    content: 'If running on Render free tier, the backend server may take ~30 seconds to wake up from sleep upon the first API request.',
    troubleshooting: {
      cause: 'Server container cold start or transient Google API rate limit.',
      fix: 'Wait 15 seconds and retry, or use the 1-Click Instant Demo mode for immediate testing.'
    }
  },
  {
    id: 'faq',
    category: '11. FAQ',
    title: 'FREQUENTLY ASKED QUESTIONS (FAQ)',
    summary: 'Common questions on security, accuracy, and data retention.',
    content: 'Q: Is my document data sent to third-party models for training?\nA: No. Gemini API enterprise inference does not use customer payloads for model retraining.\n\nQ: Can I compare an invoice against a receipt?\nA: Yes! The Comparison Engine normalizes canonical keys (e.g. total_amount, merchant_name, tax_amount) across disparate document classes.\n\nQ: What happens if an image is blurry?\nA: Gemini 2.0 multimodal vision assigns a lower confidence score (<85%) to ambiguous fields, routing them to the Review Center for human sign-off.'
  }
];

export const HelpCenter: React.FC<{ onStartTour?: () => void }> = ({ onStartTour }) => {
  const [search, setSearch] = useState('');
  const [expandedId, setExpandedId] = useState<string | null>('getting-started');

  const filtered = HELP_ARTICLES.filter(a =>
    a.title.toLowerCase().includes(search.toLowerCase()) ||
    a.summary.toLowerCase().includes(search.toLowerCase()) ||
    a.category.toLowerCase().includes(search.toLowerCase()) ||
    a.content.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-8 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 animate-fade-in">
      {/* Hero Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-gradient-to-r from-slate-900/90 via-slate-900/60 to-indigo-950/40 p-6 sm:p-8 rounded-3xl border border-slate-800 shadow-xl backdrop-blur-md">
        <div>
          <div className="inline-flex items-center gap-2 px-2.5 py-1 rounded-full bg-brand-500/10 border border-brand-500/20 text-brand-400 text-[11px] font-mono mb-2">
            <BookOpen className="w-3.5 h-3.5" />
            <span>11 COMPREHENSIVE SECTIONS</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Help Center & Operational Documentation
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Complete architectural and user guide for document processing, verification, and AI comparison
          </p>
        </div>

        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Take Product Tour</span>
          </button>
        )}
      </div>

      {/* Search Input */}
      <div className="relative max-w-xl mx-auto w-full">
        <Search className="w-4 h-4 text-slate-500 absolute left-4 top-1/2 -translate-y-1/2" />
        <input
          type="text"
          value={search}
          onChange={e => setSearch(e.target.value)}
          placeholder="Search articles: upload, extraction, confidence, compare, faq..."
          className="w-full pl-11 pr-4 py-3 text-xs bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 backdrop-blur-md shadow-lg"
        />
      </div>

      {/* Articles Accordion List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No help articles matching "{search}". Try searching for "compare", "confidence", or "faq".
          </div>
        ) : (
          filtered.map(article => {
            const isExpanded = expandedId === article.id;
            return (
              <LiquidGlassCard
                key={article.id}
                className="p-5 cursor-pointer transition-colors"
                onClick={() => setExpandedId(isExpanded ? null : article.id)}
              >
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase tracking-wider bg-brand-500/10 text-brand-300 border border-brand-500/20 shrink-0">
                      {article.category}
                    </span>
                    <div className="truncate">
                      <h3 className="text-sm font-bold text-white truncate">{article.title}</h3>
                      <p className="text-xs text-slate-400 mt-0.5 truncate">{article.summary}</p>
                    </div>
                  </div>
                  <div className="text-slate-500 hover:text-white shrink-0">
                    {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                  </div>
                </div>

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-slate-800/80 space-y-3 text-xs text-slate-300 leading-relaxed animate-fade-in" onClick={e => e.stopPropagation()}>
                    <p className="whitespace-pre-line">{article.content}</p>

                    {article.steps && (
                      <div className="bg-slate-950/60 p-3.5 rounded-xl border border-slate-800/80 space-y-1.5">
                        <span className="font-bold text-white text-[11px] uppercase tracking-wider block mb-1">
                          Step-by-Step Procedure:
                        </span>
                        {article.steps.map((st, i) => (
                          <div key={i} className="flex items-start gap-2">
                            <span className="w-4 h-4 rounded-full bg-brand-500/20 text-brand-300 text-[10px] flex items-center justify-center shrink-0 mt-0.5 font-mono">
                              {i + 1}
                            </span>
                            <span className="text-slate-300">{st}</span>
                          </div>
                        ))}
                      </div>
                    )}

                    {article.tips && (
                      <div className="bg-brand-500/10 border border-brand-500/20 p-3 rounded-xl text-brand-200 text-xs flex items-center gap-2">
                        <Sparkles className="w-4 h-4 text-brand-400 shrink-0" />
                        <span>{article.tips}</span>
                      </div>
                    )}

                    {article.troubleshooting && (
                      <div className="bg-rose-950/20 border border-rose-500/30 p-3.5 rounded-xl space-y-2 text-xs">
                        <div className="flex items-center gap-2 text-rose-300 font-bold">
                          <AlertTriangle className="w-4 h-4" />
                          <span>Diagnosis: {article.troubleshooting.cause}</span>
                        </div>
                        <p className="text-slate-300 pl-6 font-mono text-[11px]">
                          Resolution: {article.troubleshooting.fix}
                        </p>
                      </div>
                    )}
                  </div>
                )}
              </LiquidGlassCard>
            );
          })
        )}
      </div>
    </div>
  );
};
