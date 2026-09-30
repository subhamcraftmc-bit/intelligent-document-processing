import React, { useState, useRef } from 'react';
import { 
  UploadCloud, 
  FileText, 
  Image as ImageIcon, 
  X, 
  CheckCircle2, 
  AlertCircle, 
  Loader2, 
  ArrowRight,
  ShieldCheck
} from 'lucide-react';
import { api } from '../services/api';
import type { DocumentRecord } from '../types';

interface UploadDropzoneProps {
  onUploadSuccess?: (documents: DocumentRecord[]) => void;
}

const ALLOWED_EXTENSIONS = ['.pdf', '.png', '.jpg', '.jpeg', '.docx'];
const MAX_SIZE_BYTES = 10 * 1024 * 1024; // 10MB

export const UploadDropzone: React.FC<UploadDropzoneProps> = ({ onUploadSuccess }) => {
  const [dragActive, setDragActive] = useState(false);
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [statusMessage, setStatusMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [processedDocs, setProcessedDocs] = useState<DocumentRecord[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

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
    if (selectedFiles.length === 0) return;

    try {
      setUploading(true);
      setUploadProgress(15);
      setStatusMessage(null);

      const formData = new FormData();
      selectedFiles.forEach(file => {
        formData.append('files', file);
      });

      // Simulated progressive indicator
      const progressTimer = setInterval(() => {
        setUploadProgress(prev => (prev < 85 ? prev + 10 : prev));
      }, 300);

      const result = await api.documents.upload(formData);
      clearInterval(progressTimer);
      setUploadProgress(100);

      setProcessedDocs(result.documents);
      setSelectedFiles([]);
      setStatusMessage({
        type: 'success',
        text: `Successfully processed ${result.total} document(s) with Gemini 2.0 Multimodal Vision.`
      });

      if (onUploadSuccess) {
        onUploadSuccess(result.documents);
      }
    } catch (err: any) {
      setStatusMessage({
        type: 'error',
        text: err.message || 'Upload and extraction failed.'
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
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-3xl p-8 sm:p-12 text-center cursor-pointer transition-all duration-200 ${
          dragActive
            ? 'border-brand-400 bg-brand-500/10 scale-[1.01]'
            : 'border-slate-800 hover:border-brand-500/50 bg-slate-900/40 hover:bg-slate-900/70'
        } backdrop-blur-md`}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept=".pdf,.png,.jpg,.jpeg,.docx"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center max-w-md mx-auto pointer-events-none">
          <div className="w-16 h-16 rounded-2xl bg-brand-500/10 border border-brand-500/20 flex items-center justify-center text-brand-400 mb-4 shadow-glow-brand">
            <UploadCloud className="w-8 h-8" />
          </div>

          <h3 className="text-base sm:text-lg font-semibold text-white mb-1">
            Drop your documents here, or <span className="text-brand-400 underline">browse files</span>
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

      {/* Status Alert */}
      {statusMessage && (
        <div
          className={`p-4 rounded-xl text-xs flex items-center gap-3 border ${
            statusMessage.type === 'error'
              ? 'bg-rose-500/10 border-rose-500/30 text-rose-300'
              : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
          }`}
        >
          {statusMessage.type === 'error' ? (
            <AlertCircle className="w-4 h-4 shrink-0 text-rose-400" />
          ) : (
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-400" />
          )}
          <span>{statusMessage.text}</span>
        </div>
      )}

      {/* Selected File Queue */}
      {selectedFiles.length > 0 && (
        <div className="space-y-3 bg-slate-900/60 p-4 rounded-2xl border border-slate-800">
          <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
            <span>Staged Documents ({selectedFiles.length})</span>
            <button
              type="button"
              onClick={() => setSelectedFiles([])}
              className="text-slate-500 hover:text-slate-300"
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

                <button
                  type="button"
                  onClick={() => removeFile(idx)}
                  className="p-1 text-slate-500 hover:text-rose-400 rounded transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>

          {/* Upload Progress Bar */}
          {uploading && (
            <div className="space-y-1.5 pt-2">
              <div className="flex items-center justify-between text-xs text-slate-400">
                <span className="flex items-center gap-1.5">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-brand-400" />
                  Extracting entities with Gemini 2.0 Flash...
                </span>
                <span className="font-mono">{uploadProgress}%</span>
              </div>
              <div className="w-full bg-slate-800 h-2 rounded-full overflow-hidden">
                <div
                  className="bg-brand-500 h-full rounded-full transition-all duration-300 shadow-glow-brand"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            </div>
          )}

          {/* Action Trigger */}
          <div className="flex justify-end pt-2">
            <button
              type="button"
              onClick={handleUploadAndProcess}
              disabled={uploading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-xs font-semibold rounded-xl bg-brand-600 hover:bg-brand-500 text-white shadow-glow-brand transition-all disabled:opacity-50"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Processing Multimodal AI...</span>
                </>
              ) : (
                <>
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
        <div className="space-y-3 bg-slate-900/60 p-5 rounded-2xl border border-emerald-500/30">
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
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-white bg-slate-800 hover:bg-slate-700 rounded-lg border border-slate-700 transition-colors shrink-0"
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
