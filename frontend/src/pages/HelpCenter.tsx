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
  BookOpen
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
    category: 'Guides',
    title: 'Getting Started with CineForge IDP',
    summary: 'A 60-second operational overview for first-time analysts.',
    content: 'CineForge IDP is an enterprise document understanding system powered by Google Gemini 2.0 Flash. It accepts unstructured files (PDFs, scans, receipts, invoices, contracts) and extracts key-value entities and tabular line items with confidence scoring and human verification.',
    steps: [
      'Upload a document via Drag & Drop or paste a screenshot with Ctrl+V',
      'Gemini multimodal vision inspects the visual spatial structure',
      'Entities are classified and confidence scores are calculated',
      'Flagged fields (< 85% confidence) are routed to Review Center for human sign-off',
      'Export verified data directly to CSV or JSON API'
    ]
  },
  {
    id: 'how-upload-works',
    category: 'Guides',
    title: 'How Multi-Format Ingestion Works',
    summary: 'Supported formats, size boundaries, and duplicate protection.',
    content: 'The upload dropzone accepts PDF, PNG, JPG, JPEG, and DOCX files up to 10MB per document. You can stage single or multiple documents at once. CineForge automatically analyzes binary headers and skips duplicate files.',
    tips: 'Pro-Tip: You can use Windows Snipping Tool (Win + Shift + S) and immediately press Ctrl+V anywhere on the Upload page to stage screenshots directly!'
  },
  {
    id: 'gemini-vision',
    category: 'AI Pipeline',
    title: 'How Gemini 2.0 Multimodal Vision Extracts Data',
    summary: 'Why visual OCR outperforms traditional OCR and brittle regex templates.',
    content: 'Unlike legacy OCR tools that collapse visual layouts into flat text streams, Gemini 2.0 Flash inspects the document visually. It maintains spatial awareness between labels and values, understanding skewed tables, multi-column layouts, and watermarked receipts.'
  },
  {
    id: 'confidence-scoring',
    category: 'Confidence Intelligence',
    title: 'Understanding Statistical Confidence Scores',
    summary: 'How confidence percentages work and when human review triggers.',
    content: 'Every extracted key-value entity receives a statistical certainty score from 0% to 100%. Scores are categorized into three distinct operational bands:\n\n• HIGH CONFIDENCE (>= 85%): Entity meets automated ingestion threshold.\n• MEDIUM CONFIDENCE (70% - 84%): Slight OCR layout ambiguity; flagged for human verification.\n• NEEDS REVIEW (< 70%): Text unreadable or schema mismatch; mandatory human correction required.',
    tips: 'An overall document confidence score is computed as the harmonic mean across all extracted fields.'
  },
  {
    id: 'human-review-center',
    category: 'Human-in-the-Loop',
    title: 'Using the Smart Review Center & Queue',
    summary: 'Efficiently triaging low-confidence documents side-by-side.',
    content: 'The Review Center displays all documents awaiting human confirmation. Reviewers inspect the original document preview on the left and the editable extraction data grid on the right. When an analyst corrects an entity value, CineForge marks the field as "Edited" and logs a tamper-resistant audit entry.'
  },
  {
    id: 'exporting-data',
    category: 'Integration',
    title: 'Exporting Verified Data to CSV & JSON',
    summary: 'How to save extracted records for downstream ERP, CRM, or accounting sync.',
    content: 'Verified documents can be exported at any time. CSV exports provide tabular summaries suitable for Excel or legacy databases. JSON exports provide nested structured schemas with field-level confidence ratings and auditor signatures.'
  },
  {
    id: 'troubleshoot-gemini',
    category: 'Troubleshooting',
    title: 'AI Extraction Service Unavailable or Timeout',
    summary: 'What to do if Gemini or backend connection slows down.',
    content: 'If the backend is hosted on a free Render tier, the server instance may enter standby after inactivity. The first request will wake up the container (~30s).',
    troubleshooting: {
      cause: 'Render backend container cold start or transient Google API rate limit.',
      fix: 'Wait 15-20 seconds and click the "Retry" button on the document card. Alternatively, use 1-Click Instant Demo mode for immediate testing.'
    }
  },
  {
    id: 'troubleshoot-upload-failed',
    category: 'Troubleshooting',
    title: 'File Rejected During Upload',
    summary: 'Handling unsupported document formats or oversized files.',
    content: 'Files larger than 10MB or in unapproved formats (.exe, .zip, .html) are rejected at the edge to ensure system security.',
    troubleshooting: {
      cause: 'Document exceeds 10MB limit or has an unrecognized file extension.',
      fix: 'Compress the PDF or image file to under 10MB, or convert scans to PNG/JPG before uploading.'
    }
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
            <span>KNOWLEDGE BASE & GUIDES</span>
          </div>
          <h1 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
            Help Center & Operational Guides
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Learn how multimodal vision, confidence thresholds, and human-in-the-loop verification work together
          </p>
        </div>

        {onStartTour && (
          <button
            type="button"
            onClick={onStartTour}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-brand-600 hover:bg-brand-500 text-white text-xs font-bold shadow-glow-brand transition-all shrink-0"
          >
            <Sparkles className="w-4 h-4" />
            <span>Interactive Product Tour</span>
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
          placeholder="Search articles, troubleshooting, or FAQ..."
          className="w-full pl-11 pr-4 py-3 text-xs bg-slate-900/80 border border-slate-800 rounded-2xl text-slate-200 placeholder-slate-500 focus:outline-none focus:border-brand-500 backdrop-blur-md shadow-lg"
        />
      </div>

      {/* Articles Accordion List */}
      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-16 text-slate-500 text-xs">
            No help articles matching "{search}". Try searching for "confidence", "upload", or "troubleshooting".
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
