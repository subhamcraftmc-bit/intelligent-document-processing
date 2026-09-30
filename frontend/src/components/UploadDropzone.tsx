import React, { useState, useRef, useEffect } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck,
  Cpu,
  Sparkles,
  RefreshCw
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentRecord } from '../types';

interface UploadDropzoneProps {
  onUploadSuccess?: (documents: DocumentRecord[]) => void;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

const PROCESSING_STAGES = [
  { id: 1, label: 'Ingesting Document Payload', desc: 'Secure multipart transfer & binary validation' },
  { id: 2, label: 'Gemini 2.0 Multimodal Vision', desc: 'Full-page visual OCR & layout decomposition' },
  { id: 3, label: 'Entity & Table Extraction', desc: 'Key-value parsing and tabular line item reconstruction' },
  { id: 4, label: 'Confidence & Anomaly Analysis', desc: 'Field-level statistical validation (<85% flagged)' },
  { id: 5, label: 'Database Sync & Audit Trail', desc: 'Persisting structured records to Supabase' }
];

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [currentStageIndex, setCurrentStageIndex] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [processedDocs, setProcessedDocs] = useState<DocumentRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Progressive stage stepper for honest AI processing states
  useEffect(() => {
    let stageInterval: any;
    if (uploading) {
      setCurrentStageIndex(0);
      stageInterval = setInterval(() => {
        setCurrentStageIndex(prev => {
          // Advance through stages 0 -> 1 -> 2 -> 3, leaving stage 4 for response completion
          if (prev < PROCESSING_STAGES.length - 1) {
            return prev + 1;
          }
          return prev;
        });
      }, 1600);
    } else {
      setCurrentStageIndex(0);
    }
    return () => {
      if (stageInterval) clearInterval(stageInterval);
    };
  }, [uploading]);

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const validateAndAddFiles = (files: FileList | null) => {
    if (!files) return;
    setStatusMessage(null);

    const newFiles: File[] = [];
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const ext = '.' + file.name.split('.').pop()?.toLowerCase();

      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        setStatusMessage({
          type: 'error',
          text: `File "${file.name}" has unsupported format. Allowed: PDF, PNG, JPG, DOCX.`
        });
        return;
      }

      if (file.size > MAX_SIZE_BYTES) {
        setStatusMessage({
          type: 'error',
          text: `File "${file.name}" exceeds the 10MB size limit.`
        });
        return;
      }

      newFiles.push(file);
    }

    setSelectedFiles(prev => [...prev, ...newFiles]);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndAddFiles(e.dataTransfer.files);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndAddFiles(e.target.files);
    }
  };

  const removeFile = (index: number) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleUploadAndProcess = async () => {
    if (selectedFiles.length === 0 || uploading) return;

    try {
      setUploading(true);
      setStatusMessage(null);

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      const result = await api.documents.upload(formData);
      setCurrentStageIndex(PROCESSING_STAGES.length - 1);

      const docs = Array.isArray(result?.documents) ? result.documents : [];
      setProcessedDocs(docs);
      setSelectedFiles([]);
      setStatusMessage({
        type: 'success',
        text: `Successfully processed ${result?.total || docs.length} document(s) with Gemini 2.0 Multimodal Vision.`
      });

      if (onUploadSuccess && docs.length > 0) {
        onUploadSuccess(docs);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Upload and extraction failed. Please try again.'
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="w-full space-y-6">
      {/* Drop Zone Box */}
      <div
        onDragEnter={handleDrag}
        onDragLeave={handleDrag}
        onDragOver={handleDrag}
        onDrop={handleDrop}
        onClick={() => !uploading && fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center transition-all duration-200 overflow-hidden ${
          uploading 
            ? 'cursor-wait border-brand-500/60 bg-slate-950/90'
            : dragActive
            ? 'cursor-pointer border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'cursor-pointer border-slate-800 hover:border-brand-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        } backdrop-blur-md`}
      >
        {/* Laser Scanner Animation Beam during active processing */}
        {uploading && (
          <div className="absolute inset-x-0 h-1 bg-gradient-to-r from-transparent via-brand-400 to-transparent shadow-[0_0_15px_rgba(99,102,241,0.8)] animate-laser-scan pointer-events-none" />
        )}

        <input
          ref={fileInputRef}
          type="file"
          multiple
          disabled={uploading}
          accept=".pdf,.png,.jpg,.jpeg,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-glow-brand">
            {uploading ? (
              <Loader2 className="w-8 h-8 animate-spin text-brand-400" />
            ) : (
              <UploadCloud className="w-8 h-8" />
            )}
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
            {uploading 
              ? 'Analyzing document layout with Gemini 2.0...'
              : <>Drop your documents here, or <span className="text-brand-400 underline">browse files</span></>
            }
          </h3>
          <p className="text-xs sm:text-sm text-slate-400 mb-4">
            Supports Invoices, Receipts, Contracts, Resumes, and Identity Proofs
          </p>

          <div className="flex flex-wrap items-center justify-center gap-2 text-xs text-slate-500">
            <span className="px-2.5 py-1 rounded-md bg-slate-800/80 border border-slate-700/60 font-mono">
              PDF, PNG, JPG, DOCX
            </span>
            <span>•</span>
            <span>Max 10MB per document</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400 font-medium">
              <ShieldCheck className="w-3.5 h-3.5" />
              Gemini Vision Ready
            </span>
          </div>
        </div>
      </div>

      {/* Honest AI Pipeline Progress State (Phase 8 & 9) */}
      {uploading && (
        <div className="p-5 rounded-2xl bg-slate-900/90 border border-brand-500/40 shadow-xl space-y-4 animate-fade-in">
          <div className="flex items-center justify-between border-b border-slate-800 pb-3">
            <div className="flex items-center gap-2.5">
              <Cpu className="w-4 h-4 text-brand-400 animate-pulse" />
              <h4 className="text-xs font-bold uppercase tracking-wider text-slate-200">
                Gemini 2.0 Multimodal Pipeline Active
              </h4>
            </div>
            <span className="text-[11px] font-mono text-brand-300 bg-brand-500/10 px-2 py-0.5 rounded border border-brand-500/20">
              Stage {currentStageIndex + 1} of {PROCESSING_STAGES.length}
            </span>
          </div>

          {/* Step Timeline */}
          <div className="grid grid-cols-1 sm:grid-cols-5 gap-2 pt-1">
            {PROCESSING_STAGES.map((stage, idx) => {
              const isPast = idx < currentStageIndex;
              const isCurrent = idx === currentStageIndex;
              return (
                <div
                  key={stage.id}
                  className={`p-3 rounded-xl border transition-all ${
                    isCurrent
                      ? 'bg-brand-500/15 border-brand-500/50 shadow-glow-brand'
                      : isPast
                      ? 'bg-slate-950/60 border-emerald-500/30 text-emerald-300'
                      : 'bg-slate-950/40 border-slate-800/60 opacity-50'
                  }`}
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    {isPast ? (
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                    ) : isCurrent ? (
                      <Loader2 className="w-3.5 h-3.5 text-brand-400 animate-spin shrink-0" />
                    ) : (
                      <span className="w-3.5 h-3.5 rounded-full border border-slate-600 text-[9px] flex items-center justify-center text-slate-500">
                        {stage.id}
                      </span>
                    )}
                    <span className="text-[11px] font-semibold text-slate-200 truncate">
                      {stage.label}
                    </span>
                  </div>
                  <p className="text-[10px] text-slate-400 leading-tight">
                    {stage.desc}
                  </p>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center justify-between gap-3 border animate-fade-in ${
            statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          <div className="flex items-center gap-2.5">
            {statusMessage.type === 'error' ? (
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
            ) : (
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
            )}
            <span>{statusMessage.text}</span>
          </div>
          {statusMessage.type === 'error' && (
            <button
              type="button"
              onClick={handleUploadAndProcess}
              className="px-2.5 py-1 rounded bg-rose-500/20 hover:bg-rose-500/30 text-rose-200 font-semibold transition-colors flex items-center gap-1 shrink-0 btn-interactive"
            >
              <RefreshCw className="w-3 h-3" />
              <span>Retry</span>
            </button>
          )}
        </div>
      )}

      {/* Selected File Queue */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800 animate-fade-in">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Staged Documents ({selectedFiles.length})</span>
            <button
              type="button"
              disabled={uploading}
              onClick={() => setSelectedFiles([])}
              className="text-slate-500 hover:text-slate-300 disabled:opacity-40"
            >
              Clear All
            </button>
          </div>

          <div className="space-y-2 max-h-60 overflow-y-auto pr-1">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="flex items-center justify-between p-2.5 rounded-xl bg-slate-950/80 border border-slate-800/80 text-xs"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {file.name.endsWith('.pdf') ? (
                    <FileText className="w-4 h-4 text-brand-400 shrink-0" />
                  ) : (
                    <ImageIcon className="w-4 h-4 text-emerald-400 shrink-0" />
                  )}
                  <div className="truncate">
                    <p className="font-medium text-slate-200 truncate">{file.name}</p>
                    <p className="text-[11px] text-slate-500">{(file.size / 1024).toFixed(1)} KB</p>
                  </div>
                </div>

                {!uploading && (
                  <button
                    type="button"
                    onClick={() => removeFile(idx)}
                    className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors btn-interactive"
                    aria-label={`Remove ${file.name}`}
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>
            ))}
          </div>

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleUploadAndProcess}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all disabled:opacity-50 btn-interactive"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Multimodal AI Vision & Extracting...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Upload & Extract with Gemini</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Processed Results Quick Preview */}
      {processedDocs.length > 0 && (
        <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/30 animate-fade-in">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <h4 className="text-sm font-semibold text-white">Processed Extraction Batch</h4>
            </div>
            <span className="text-xs text-emerald-400 font-medium">Ready for review</span>
          </div>

          <div className="divide-y divide-slate-800/80">
            {processedDocs.map(doc => (
              <div key={doc.id} className="py-3 flex items-center justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-200 truncate">{doc.file_name}</p>
                  <div className="flex items-center gap-2 text-[11px] text-slate-400 mt-0.5">
                    <span className="px-1.5 py-0.5 rounded bg-slate-800 font-semibold text-brand-300">
                      {doc.document_class || 'Classified'}
                    </span>
                    <span>•</span>
                    <span>Confidence: {Math.round((doc.overall_confidence || 0) * 100)}%</span>
                  </div>
                </div>

                <a
                  href={`/documents/${doc.id}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0 btn-interactive"
                >
                  <span>Review & Verify</span>
                  <ArrowRight className="w-3.5 h-3.5 text-brand-400" />
                </a>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
